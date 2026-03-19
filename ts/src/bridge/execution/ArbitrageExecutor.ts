// ---------------------------------------------------------------------------
// ArbitrageExecutor -- executes arbitrage by running both legs in parallel
// ---------------------------------------------------------------------------

import type { BinanceCexAdapter } from '../adapters/BinanceCexAdapter.js';
import type { UniswapDexAdapter } from '../adapters/UniswapDexAdapter.js';
import type { RiskManager } from '../safety/RiskManager.js';
import type { ArbitrageOpportunity, ArbitrageExecution, ExecutionLeg } from '../types.js';
import { resolveTokenPair, POOL_FEES } from '../constants/tokens.js';

export class ArbitrageExecutor {
    private cex: BinanceCexAdapter;
    private dex: UniswapDexAdapter;
    private riskManager: RiskManager;
    private dryRun: boolean;
    private maxSlippageBps: number;
    private legTimeoutMs: number;

    constructor(
        cex: BinanceCexAdapter,
        dex: UniswapDexAdapter,
        riskManager: RiskManager,
        config: {
            dryRun?: boolean;
            maxSlippageBps?: number;
            legTimeoutMs?: number;
        },
    ) {
        this.cex = cex;
        this.dex = dex;
        this.riskManager = riskManager;
        this.dryRun = config.dryRun ?? false;
        this.maxSlippageBps = config.maxSlippageBps ?? 50;
        this.legTimeoutMs = config.legTimeoutMs ?? 30000;
    }

    async execute(opportunity: ArbitrageOpportunity): Promise<ArbitrageExecution> {
        const startedAt = Date.now();

        // Pre-execution risk checks
        const riskCheck = this.riskManager.checkExecution(opportunity);
        if (!riskCheck.allowed) {
            return {
                opportunity,
                status: 'failed',
                error: `Risk check failed: ${riskCheck.reason}`,
                legs: [],
                startedAt,
                completedAt: Date.now(),
            };
        }

        if (this.dryRun) {
            return this.simulateExecution(opportunity, startedAt);
        }

        const pair = resolveTokenPair(opportunity.symbol, opportunity.chain.chainId);
        if (!pair) {
            return {
                opportunity,
                status: 'failed',
                error: `Cannot resolve token pair for ${opportunity.symbol} on chain ${opportunity.chain.chainId}`,
                legs: [],
                startedAt,
                completedAt: Date.now(),
            };
        }

        const legs: ExecutionLeg[] = [];

        if (opportunity.direction === 'cex-to-dex') {
            return this.executeCexToDex(opportunity, pair, legs, startedAt);
        } else {
            return this.executeDexToCex(opportunity, pair, legs, startedAt);
        }
    }

    // CEX-to-DEX: buy on Binance, sell on Uniswap
    private async executeCexToDex(
        opp: ArbitrageOpportunity,
        pair: { base: { address: `0x${string}`; decimals: number }; quote: { address: `0x${string}`; decimals: number } },
        legs: ExecutionLeg[],
        startedAt: number,
    ): Promise<ArbitrageExecution> {
        const cexLeg: ExecutionLeg = {
            venue: 'binance',
            side: 'buy',
            status: 'pending',
        };
        const dexLeg: ExecutionLeg = {
            venue: 'uniswap',
            side: 'sell',
            status: 'pending',
        };
        legs.push(cexLeg, dexLeg);

        // Execute both legs in parallel
        const [cexResult, dexResult] = await Promise.allSettled([
            this.withTimeout(
                this.cex.createOrder(opp.symbol, 'market', 'buy', opp.maxSize),
                this.legTimeoutMs,
            ),
            this.withTimeout(
                this.executeDexSwap(
                    pair.base.address,
                    pair.quote.address,
                    opp.maxSize,
                    pair.base.decimals,
                    pair.quote.decimals,
                    'sell',
                ),
                this.legTimeoutMs,
            ),
        ]);

        // Process CEX result
        let cexOrder: any;
        if (cexResult.status === 'fulfilled') {
            cexOrder = cexResult.value;
            cexLeg.status = 'filled';
            cexLeg.price = cexOrder.average ?? cexOrder.price;
            cexLeg.amount = cexOrder.filled ?? opp.maxSize;
            cexLeg.orderId = cexOrder.id;
            cexLeg.timestamp = Date.now();
        } else {
            cexLeg.status = 'failed';
        }

        // Process DEX result
        if (dexResult.status === 'fulfilled') {
            dexLeg.status = 'filled';
            dexLeg.txHash = dexResult.value;
            dexLeg.timestamp = Date.now();
        } else {
            dexLeg.status = 'failed';
        }

        const allFilled = legs.every((l) => l.status === 'filled');
        const anyFailed = legs.some((l) => l.status === 'failed');

        return {
            opportunity: opp,
            status: allFilled ? 'completed' : anyFailed ? 'failed' : 'partial',
            cexOrder,
            dexTxHash: dexLeg.txHash as `0x${string}` | undefined,
            legs,
            startedAt,
            completedAt: Date.now(),
            error: anyFailed ? 'One or more legs failed' : undefined,
        };
    }

    // DEX-to-CEX: buy on Uniswap, sell on Binance
    private async executeDexToCex(
        opp: ArbitrageOpportunity,
        pair: { base: { address: `0x${string}`; decimals: number }; quote: { address: `0x${string}`; decimals: number } },
        legs: ExecutionLeg[],
        startedAt: number,
    ): Promise<ArbitrageExecution> {
        const dexLeg: ExecutionLeg = {
            venue: 'uniswap',
            side: 'buy',
            status: 'pending',
        };
        const cexLeg: ExecutionLeg = {
            venue: 'binance',
            side: 'sell',
            status: 'pending',
        };
        legs.push(dexLeg, cexLeg);

        const [dexResult, cexResult] = await Promise.allSettled([
            this.withTimeout(
                this.executeDexSwap(
                    pair.quote.address,
                    pair.base.address,
                    opp.maxSize * opp.dexPrice, // Amount in quote terms
                    pair.quote.decimals,
                    pair.base.decimals,
                    'buy',
                ),
                this.legTimeoutMs,
            ),
            this.withTimeout(
                this.cex.createOrder(opp.symbol, 'market', 'sell', opp.maxSize),
                this.legTimeoutMs,
            ),
        ]);

        if (dexResult.status === 'fulfilled') {
            dexLeg.status = 'filled';
            dexLeg.txHash = dexResult.value;
            dexLeg.timestamp = Date.now();
        } else {
            dexLeg.status = 'failed';
        }

        let cexOrder: any;
        if (cexResult.status === 'fulfilled') {
            cexOrder = cexResult.value;
            cexLeg.status = 'filled';
            cexLeg.price = cexOrder.average ?? cexOrder.price;
            cexLeg.amount = cexOrder.filled ?? opp.maxSize;
            cexLeg.orderId = cexOrder.id;
            cexLeg.timestamp = Date.now();
        } else {
            cexLeg.status = 'failed';
        }

        const allFilled = legs.every((l) => l.status === 'filled');
        const anyFailed = legs.some((l) => l.status === 'failed');

        return {
            opportunity: opp,
            status: allFilled ? 'completed' : anyFailed ? 'failed' : 'partial',
            cexOrder,
            dexTxHash: dexLeg.txHash as `0x${string}` | undefined,
            legs,
            startedAt,
            completedAt: Date.now(),
            error: anyFailed ? 'One or more legs failed' : undefined,
        };
    }

    private async executeDexSwap(
        tokenIn: `0x${string}`,
        tokenOut: `0x${string}`,
        amount: number,
        tokenInDecimals: number,
        tokenOutDecimals: number,
        _side: 'buy' | 'sell',
    ): Promise<`0x${string}`> {
        const amountIn = BigInt(Math.floor(amount * (10 ** tokenInDecimals)));
        const slippageFactor = 1 - this.maxSlippageBps / 10000;

        // Get quote for minimum output
        const quote = await this.dex.getQuote(tokenIn, tokenOut, amountIn, POOL_FEES.MEDIUM);
        const minAmountOut = BigInt(Math.floor(Number(quote.amountOut) * slippageFactor));

        return this.dex.swap(tokenIn, tokenOut, amountIn, minAmountOut, POOL_FEES.MEDIUM);
    }

    private simulateExecution(
        opp: ArbitrageOpportunity,
        startedAt: number,
    ): ArbitrageExecution {
        return {
            opportunity: opp,
            status: 'completed',
            legs: [
                {
                    venue: opp.direction === 'cex-to-dex' ? 'binance' : 'uniswap',
                    side: 'buy',
                    status: 'filled',
                    price: opp.direction === 'cex-to-dex' ? opp.cexPrice : opp.dexPrice,
                    amount: opp.maxSize,
                    timestamp: Date.now(),
                },
                {
                    venue: opp.direction === 'cex-to-dex' ? 'uniswap' : 'binance',
                    side: 'sell',
                    status: 'filled',
                    price: opp.direction === 'cex-to-dex' ? opp.dexPrice : opp.cexPrice,
                    amount: opp.maxSize,
                    timestamp: Date.now(),
                },
            ],
            startedAt,
            completedAt: Date.now(),
            actualProfitUsd: opp.estimatedProfitUsd,
        };
    }

    private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
        return Promise.race([
            promise,
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`Leg timed out after ${ms}ms`)), ms)
            ),
        ]);
    }
}
