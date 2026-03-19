// ---------------------------------------------------------------------------
// Uniswap V3 DEX Adapter -- uses viem for all on-chain interactions
// Supports two modes: standalone (privateKey) or wagmi (injected clients)
// ---------------------------------------------------------------------------

import type { PublicClient, WalletClient, Account } from 'viem';
import { BaseDexAdapter } from './BaseDexAdapter.js';
import type { ChainConfig, DexQuote } from '../types.js';
import { QuoterV2ABI, SwapRouterABI, ERC20ABI, UniswapV3PoolABI } from '../constants/abis.js';

interface StandaloneConfig {
    privateKey: `0x${string}`;
    chain: ChainConfig;
}

interface WagmiConfig {
    publicClient: PublicClient;
    walletClient: WalletClient;
    chain: ChainConfig;
}

type UniswapDexConfig = StandaloneConfig | WagmiConfig;

function isWagmiConfig(config: UniswapDexConfig): config is WagmiConfig {
    return 'publicClient' in config;
}

export class UniswapDexAdapter extends BaseDexAdapter {
    private config: UniswapDexConfig;
    private publicClient!: PublicClient;
    private walletClient!: WalletClient;
    private account!: Account;
    private chain: ChainConfig;
    private initialized = false;
    private unwatchers: Array<() => void> = [];

    constructor(config: UniswapDexConfig) {
        super();
        this.config = config;
        this.chain = config.chain;
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;

        if (isWagmiConfig(this.config)) {
            this.publicClient = this.config.publicClient;
            this.walletClient = this.config.walletClient;
            const accounts = await this.walletClient.getAddresses();
            // Use first account from wallet client
            this.account = { address: accounts[0], type: 'json-rpc' } as Account;
        } else {
            // Standalone mode: create viem clients from private key
            const viem = await import('viem');
            const viemAccounts = await import('viem/accounts');
            const viemChains = await import('viem/chains');

            const account = viemAccounts.privateKeyToAccount(this.config.privateKey);
            this.account = account;

            const chainMap: Record<number, any> = {
                1: viemChains.mainnet,
                42161: viemChains.arbitrum,
                10: viemChains.optimism,
                8453: viemChains.base,
                137: viemChains.polygon,
            };

            const viemChain = chainMap[this.chain.chainId];
            if (!viemChain) {
                throw new Error(`Unsupported chainId: ${this.chain.chainId}`);
            }

            const transport = viem.http(this.chain.rpcUrl);
            this.publicClient = viem.createPublicClient({ chain: viemChain, transport }) as PublicClient;
            this.walletClient = viem.createWalletClient({ account, chain: viemChain, transport }) as WalletClient;
        }

        this.initialized = true;
    }

    async shutdown(): Promise<void> {
        for (const unwatch of this.unwatchers) {
            unwatch();
        }
        this.unwatchers = [];
        this.initialized = false;
    }

    async getQuote(
        tokenIn: `0x${string}`,
        tokenOut: `0x${string}`,
        amountIn: bigint,
        poolFee: number,
    ): Promise<DexQuote> {
        this.ensureInitialized();

        const result = await this.publicClient.simulateContract({
            address: this.chain.uniswapQuoter,
            abi: QuoterV2ABI,
            functionName: 'quoteExactInputSingle',
            args: [{
                tokenIn,
                tokenOut,
                amountIn,
                fee: poolFee,
                sqrtPriceLimitX96: 0n,
            }],
        });

        const [amountOut] = result.result as [bigint, bigint, number, bigint];
        const price = Number(amountOut) / Number(amountIn);

        return {
            tokenIn,
            tokenOut,
            amountIn,
            amountOut,
            price,
            poolFee,
            timestamp: Date.now(),
        };
    }

    async swap(
        tokenIn: `0x${string}`,
        tokenOut: `0x${string}`,
        amountIn: bigint,
        minAmountOut: bigint,
        poolFee: number,
    ): Promise<`0x${string}`> {
        this.ensureInitialized();

        // Check and set approval if needed
        await this.ensureApproval(tokenIn, amountIn);

        const deadline = BigInt(Math.floor(Date.now() / 1000) + 300); // 5 min deadline
        const account = this.account;

        const hash = await this.walletClient.writeContract({
            address: this.chain.uniswapRouter,
            abi: SwapRouterABI,
            functionName: 'exactInputSingle',
            args: [{
                tokenIn,
                tokenOut,
                fee: poolFee,
                recipient: account.address,
                deadline,
                amountIn,
                amountOutMinimum: minAmountOut,
                sqrtPriceLimitX96: 0n,
            }],
            account,
            chain: null,
        });

        return hash;
    }

    async getBalance(token: `0x${string}`): Promise<bigint> {
        this.ensureInitialized();
        return this.publicClient.readContract({
            address: token,
            abi: ERC20ABI,
            functionName: 'balanceOf',
            args: [this.account.address],
        }) as Promise<bigint>;
    }

    async getNativeBalance(): Promise<bigint> {
        this.ensureInitialized();
        return this.publicClient.getBalance({ address: this.account.address });
    }

    async getGasPrice(): Promise<bigint> {
        this.ensureInitialized();
        return this.publicClient.getGasPrice();
    }

    watchSwapEvents(poolAddress: `0x${string}`, callback: (price: number) => void): () => void {
        this.ensureInitialized();

        const unwatch = this.publicClient.watchContractEvent({
            address: poolAddress,
            abi: UniswapV3PoolABI,
            eventName: 'Swap',
            onLogs: (logs: any[]) => {
                for (const log of logs) {
                    const sqrtPriceX96 = log.args.sqrtPriceX96 as bigint;
                    const price = this.sqrtPriceX96ToPrice(sqrtPriceX96);
                    callback(price);
                }
            },
        });

        this.unwatchers.push(unwatch);
        return unwatch;
    }

    // --- Private helpers ---

    private async ensureApproval(token: `0x${string}`, amount: bigint): Promise<void> {
        const allowance = await this.publicClient.readContract({
            address: token,
            abi: ERC20ABI,
            functionName: 'allowance',
            args: [this.account.address, this.chain.uniswapRouter],
        }) as bigint;

        if (allowance < amount) {
            const maxApproval = 2n ** 256n - 1n;
            await this.walletClient.writeContract({
                address: token,
                abi: ERC20ABI,
                functionName: 'approve',
                args: [this.chain.uniswapRouter, maxApproval],
                account: this.account,
                chain: null,
            });
        }
    }

    private sqrtPriceX96ToPrice(sqrtPriceX96: bigint): number {
        const Q96 = 2n ** 96n;
        const price = Number(sqrtPriceX96 * sqrtPriceX96) / Number(Q96 * Q96);
        return price;
    }

    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error('UniswapDexAdapter not initialized. Call initialize() first.');
        }
    }
}
