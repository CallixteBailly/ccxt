// ---------------------------------------------------------------------------
// ArbitrageDetector -- evaluates price snapshots for profitable opportunities
// ---------------------------------------------------------------------------

import type { PriceSnapshot, ArbitrageOpportunity, ChainConfig, BridgeConfig } from '../types.js';
import type { PriceMonitor } from './PriceMonitor.js';
import type { GasEstimator } from '../execution/GasEstimator.js';

let nextOpportunityId = 0;

export class ArbitrageDetector {
    private priceMonitor: PriceMonitor;
    private gasEstimator: GasEstimator;
    private chain: ChainConfig;
    private minSpreadBps: number;
    private minProfitUsd: number;
    private stalenessMs: number;
    private maxPositionUsd: number;
    private listeners: Array<(opp: ArbitrageOpportunity) => void> = [];
    private running = false;

    // Cached fee data
    private cexTradingFee = 0.001;       // default 0.1% taker
    private cexWithdrawalFees: Map<string, number> = new Map();

    constructor(
        priceMonitor: PriceMonitor,
        gasEstimator: GasEstimator,
        chain: ChainConfig,
        config: BridgeConfig['monitoring'],
        executionConfig: BridgeConfig['execution'],
    ) {
        this.priceMonitor = priceMonitor;
        this.gasEstimator = gasEstimator;
        this.chain = chain;
        this.minSpreadBps = config.minSpreadBps ?? 30;
        this.minProfitUsd = config.minProfitUsd ?? 5;
        this.stalenessMs = config.stalenessMs ?? 2000;
        this.maxPositionUsd = executionConfig.maxPositionUsd ?? 10000;
    }

    onOpportunity(listener: (opp: ArbitrageOpportunity) => void): void {
        this.listeners.push(listener);
    }

    setCexTradingFee(fee: number): void {
        this.cexTradingFee = fee;
    }

    setCexWithdrawalFee(currency: string, fee: number): void {
        this.cexWithdrawalFees.set(currency, fee);
    }

    start(): void {
        if (this.running) return;
        this.running = true;
        this.priceMonitor.onPrice((snapshot) => this.evaluate(snapshot));
    }

    stop(): void {
        this.running = false;
    }

    evaluate(snapshot: PriceSnapshot): void {
        if (!this.running) return;

        const now = Date.now();
        if (now - snapshot.timestamp > this.stalenessMs) return;

        // CEX-to-DEX: buy on CEX (at ask), sell on DEX
        this.checkDirection(snapshot, 'cex-to-dex', snapshot.cexAsk, snapshot.dexSellPrice);
        // DEX-to-CEX: buy on DEX, sell on CEX (at bid)
        this.checkDirection(snapshot, 'dex-to-cex', snapshot.dexBuyPrice, snapshot.cexBid);
    }

    private async checkDirection(
        snapshot: PriceSnapshot,
        direction: 'cex-to-dex' | 'dex-to-cex',
        buyPrice: number,
        sellPrice: number,
    ): Promise<void> {
        if (buyPrice <= 0 || sellPrice <= 0) return;

        const spreadBps = ((sellPrice - buyPrice) / buyPrice) * 10000;
        if (spreadBps < this.minSpreadBps) return;

        // Estimate costs
        const tradeSize = this.maxPositionUsd / buyPrice;
        const tradeSizeUsd = tradeSize * buyPrice;

        const cexTradingCost = tradeSizeUsd * this.cexTradingFee;
        const dexSwapFee = tradeSizeUsd * 0.003; // 0.3% Uniswap fee tier
        const gasEstimate = await this.gasEstimator.estimateSwapCostUsd();
        const baseCurrency = snapshot.symbol.split('/')[0];
        const withdrawalFee = (this.cexWithdrawalFees.get(baseCurrency) ?? 0) * buyPrice;
        const slippageCost = tradeSizeUsd * 0.001; // 0.1% buffer

        const totalCosts = cexTradingCost + dexSwapFee + gasEstimate + withdrawalFee + slippageCost;
        const grossProfit = (spreadBps / 10000) * tradeSizeUsd;
        const netProfit = grossProfit - totalCosts;

        if (netProfit < this.minProfitUsd) return;

        const opportunity: ArbitrageOpportunity = {
            id: `arb-${++nextOpportunityId}-${Date.now()}`,
            timestamp: Date.now(),
            direction,
            symbol: snapshot.symbol,
            cexPrice: direction === 'cex-to-dex' ? snapshot.cexAsk : snapshot.cexBid,
            dexPrice: direction === 'cex-to-dex' ? snapshot.dexSellPrice : snapshot.dexBuyPrice,
            spreadBps,
            estimatedProfitUsd: netProfit,
            maxSize: tradeSize,
            chain: this.chain,
            cexFees: {
                trading: cexTradingCost,
                withdrawal: withdrawalFee,
            },
            dexFees: {
                trading: dexSwapFee,
                gas: BigInt(Math.round(gasEstimate * 1e18)),
            },
            confidence: this.calculateConfidence(snapshot, spreadBps),
            expiresAt: Date.now() + this.stalenessMs,
        };

        for (const listener of this.listeners) {
            listener(opportunity);
        }
    }

    private calculateConfidence(snapshot: PriceSnapshot, spreadBps: number): number {
        const ageMs = Date.now() - snapshot.timestamp;
        const freshness = Math.max(0, 1 - ageMs / this.stalenessMs);
        const spreadFactor = Math.min(1, spreadBps / 100); // Higher spread = more confidence
        return freshness * 0.7 + spreadFactor * 0.3;
    }
}
