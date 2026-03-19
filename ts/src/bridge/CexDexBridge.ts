// ---------------------------------------------------------------------------
// CexDexBridge -- main orchestrator for CEX-DEX arbitrage
// ---------------------------------------------------------------------------

import type {
    BridgeConfig,
    ChainConfig,
    ArbitrageOpportunity,
    ArbitrageExecution,
    TransferResult,
    BridgeEventMap,
    PriceSnapshot,
} from './types.js';
import { BinanceCexAdapter } from './adapters/BinanceCexAdapter.js';
import { UniswapDexAdapter } from './adapters/UniswapDexAdapter.js';
import { PriceMonitor } from './pricing/PriceMonitor.js';
import { ArbitrageDetector } from './pricing/ArbitrageDetector.js';
import { ArbitrageExecutor } from './execution/ArbitrageExecutor.js';
import { TransferManager } from './execution/TransferManager.js';
import { GasEstimator } from './execution/GasEstimator.js';
import { RiskManager } from './safety/RiskManager.js';
import { TOKENS } from './constants/tokens.js';

type EventHandler<K extends keyof BridgeEventMap> = (data: BridgeEventMap[K]) => void;

export class CexDexBridge {
    private config: BridgeConfig;
    private chain: ChainConfig;
    private cex: BinanceCexAdapter;
    private dex: UniswapDexAdapter;
    private priceMonitor: PriceMonitor;
    private detector: ArbitrageDetector;
    private executor: ArbitrageExecutor;
    private transferManager!: TransferManager;
    private gasEstimator: GasEstimator;
    private riskManager: RiskManager;
    private initialized = false;
    private eventHandlers: Map<string, Array<(...args: any[]) => void>> = new Map();

    constructor(config: BridgeConfig) {
        this.config = config;

        // Resolve default chain
        const chainConfig = config.chains.find((c) => c.chainId === config.defaultChainId);
        if (!chainConfig) {
            throw new Error(`Default chain ${config.defaultChainId} not found in config.chains`);
        }
        this.chain = chainConfig;

        // Initialize adapters
        this.cex = new BinanceCexAdapter({
            apiKey: config.binance.apiKey,
            secret: config.binance.secret,
            sandbox: config.binance.sandbox,
        });

        const dexConfig = config.wallet.privateKey
            ? { privateKey: config.wallet.privateKey, chain: this.chain }
            : (() => { throw new Error('Either privateKey or wagmi clients must be provided'); })();
        this.dex = new UniswapDexAdapter(dexConfig);

        // Initialize subsystems
        this.gasEstimator = new GasEstimator(this.dex, this.chain);
        this.riskManager = new RiskManager(this.gasEstimator, config.execution);

        this.priceMonitor = new PriceMonitor(
            this.cex,
            this.dex,
            this.chain,
            config.monitoring,
        );

        this.detector = new ArbitrageDetector(
            this.priceMonitor,
            this.gasEstimator,
            this.chain,
            config.monitoring,
            config.execution,
        );

        this.executor = new ArbitrageExecutor(this.cex, this.dex, this.riskManager, {
            dryRun: config.execution.dryRun,
            maxSlippageBps: config.execution.maxSlippageBps,
            legTimeoutMs: config.execution.legTimeoutMs,
        });
    }

    /**
     * Create a bridge instance with wagmi/viem clients (for React apps)
     */
    static withClients(
        config: BridgeConfig,
        publicClient: any,
        walletClient: any,
    ): CexDexBridge {
        const bridge = new CexDexBridge({ ...config, wallet: {} });
        const chainConfig = config.chains.find((c) => c.chainId === config.defaultChainId)!;
        (bridge as any).dex = new UniswapDexAdapter({
            publicClient,
            walletClient,
            chain: chainConfig,
        });
        // Re-create subsystems with new dex
        (bridge as any).gasEstimator = new GasEstimator((bridge as any).dex, chainConfig);
        (bridge as any).riskManager = new RiskManager((bridge as any).gasEstimator, config.execution);
        (bridge as any).priceMonitor = new PriceMonitor(
            (bridge as any).cex, (bridge as any).dex, chainConfig, config.monitoring,
        );
        (bridge as any).detector = new ArbitrageDetector(
            (bridge as any).priceMonitor, (bridge as any).gasEstimator,
            chainConfig, config.monitoring, config.execution,
        );
        (bridge as any).executor = new ArbitrageExecutor(
            (bridge as any).cex, (bridge as any).dex, (bridge as any).riskManager, {
                dryRun: config.execution.dryRun,
                maxSlippageBps: config.execution.maxSlippageBps,
                legTimeoutMs: config.execution.legTimeoutMs,
            },
        );
        return bridge;
    }

    // --- Lifecycle ---

    async initialize(): Promise<void> {
        if (this.initialized) return;
        await Promise.all([this.cex.initialize(), this.dex.initialize()]);

        // Fetch initial fee data
        try {
            const symbol = this.config.monitoring.symbols[0];
            if (symbol) {
                const fees = await this.cex.fetchTradingFees(symbol);
                this.detector.setCexTradingFee(fees.taker);

                const baseCurrency = symbol.split('/')[0];
                const withdrawFees = await this.cex.fetchWithdrawalFees(baseCurrency);
                const networkFee = withdrawFees[this.chain.binanceNetwork];
                if (networkFee !== undefined) {
                    this.detector.setCexWithdrawalFee(baseCurrency, networkFee);
                }
            }
        } catch {
            // Use default fees if fetch fails
        }

        // Wire up event forwarding
        this.detector.onOpportunity((opp) => {
            this.emit('opportunity', opp);
        });

        this.priceMonitor.onPrice((snapshot) => {
            this.emit('price', snapshot);
            // Update ETH price for gas estimation
            if (snapshot.symbol === 'ETH/USDT' || snapshot.symbol === 'ETH/USDC') {
                this.gasEstimator.setEthPriceUsd((snapshot.cexBid + snapshot.cexAsk) / 2);
            }
        });

        // Determine wallet address for transfer manager
        const walletAddress = this.config.wallet.privateKey
            ? await this.deriveAddress(this.config.wallet.privateKey)
            : '0x0000000000000000000000000000000000000000';
        this.transferManager = new TransferManager(this.cex, this.dex, walletAddress);

        this.initialized = true;
    }

    async shutdown(): Promise<void> {
        this.priceMonitor.stop();
        this.detector.stop();
        await Promise.all([this.cex.shutdown(), this.dex.shutdown()]);
        this.initialized = false;
    }

    // --- Monitoring ---

    async *watchOpportunities(): AsyncGenerator<ArbitrageOpportunity> {
        this.ensureInitialized();

        const queue: ArbitrageOpportunity[] = [];
        let resolve: (() => void) | null = null;

        this.detector.onOpportunity((opp) => {
            queue.push(opp);
            if (resolve) {
                resolve();
                resolve = null;
            }
        });

        await this.priceMonitor.start();
        this.detector.start();

        try {
            while (this.initialized) {
                if (queue.length > 0) {
                    yield queue.shift()!;
                } else {
                    await new Promise<void>((r) => { resolve = r; });
                }
            }
        } finally {
            this.priceMonitor.stop();
            this.detector.stop();
        }
    }

    async getSnapshot(): Promise<{
        prices: PriceSnapshot[];
        opportunities: ArbitrageOpportunity[];
    }> {
        this.ensureInitialized();
        return {
            prices: this.priceMonitor.getAllSnapshots(),
            opportunities: [],
        };
    }

    // --- Execution ---

    async executeArbitrage(opportunity: ArbitrageOpportunity): Promise<ArbitrageExecution> {
        this.ensureInitialized();

        const positionUsd = opportunity.maxSize * opportunity.cexPrice;
        this.riskManager.addExposure(positionUsd);

        try {
            const result = await this.executor.execute(opportunity);
            this.emit('execution', result);
            return result;
        } finally {
            this.riskManager.removeExposure(positionUsd);
        }
    }

    // --- Fund management ---

    async transferToDex(currency: string, amount: number, chain?: ChainConfig): Promise<TransferResult> {
        this.ensureInitialized();
        return this.transferManager.transferToDex(currency, amount, chain ?? this.chain);
    }

    async transferToCex(currency: string, amount: number, chain?: ChainConfig): Promise<TransferResult> {
        this.ensureInitialized();
        return this.transferManager.transferToCex(currency, amount, chain ?? this.chain);
    }

    async getBalances(): Promise<{ cex: Record<string, number>; dex: Record<string, number> }> {
        this.ensureInitialized();
        const chainTokens = TOKENS[this.chain.chainId] ?? {};
        const tokens = Object.values(chainTokens).map((t) => ({
            symbol: t.symbol,
            address: t.address,
            decimals: t.decimals,
        }));
        return this.transferManager.getBalances(tokens);
    }

    // --- Events ---

    on<K extends keyof BridgeEventMap>(event: K, handler: EventHandler<K>): void {
        const handlers = this.eventHandlers.get(event) ?? [];
        handlers.push(handler);
        this.eventHandlers.set(event, handlers);
    }

    off<K extends keyof BridgeEventMap>(event: K, handler: EventHandler<K>): void {
        const handlers = this.eventHandlers.get(event) ?? [];
        const idx = handlers.indexOf(handler);
        if (idx >= 0) handlers.splice(idx, 1);
    }

    // --- Private ---

    private emit<K extends keyof BridgeEventMap>(event: K, data: BridgeEventMap[K]): void {
        const handlers = this.eventHandlers.get(event) ?? [];
        for (const handler of handlers) {
            try {
                handler(data);
            } catch (err) {
                if (event !== 'error') {
                    this.emit('error', err as Error);
                }
            }
        }
    }

    private async deriveAddress(privateKey: `0x${string}`): Promise<string> {
        try {
            const { privateKeyToAccount } = await import('viem/accounts');
            return privateKeyToAccount(privateKey).address;
        } catch {
            return '0x0000000000000000000000000000000000000000';
        }
    }

    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error('CexDexBridge not initialized. Call initialize() first.');
        }
    }
}
