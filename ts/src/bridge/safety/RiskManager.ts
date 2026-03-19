// ---------------------------------------------------------------------------
// RiskManager -- enforces trading limits and safety checks
// ---------------------------------------------------------------------------

import type { ArbitrageOpportunity, BridgeConfig } from '../types.js';
import type { GasEstimator } from '../execution/GasEstimator.js';

export interface RiskCheckResult {
    allowed: boolean;
    reason?: string;
}

export class RiskManager {
    private maxSlippageBps: number;
    private maxPositionUsd: number;
    private maxGasGwei: number;
    private gasEstimator: GasEstimator;
    private openExposureUsd = 0;
    private maxTotalExposureUsd: number;

    constructor(gasEstimator: GasEstimator, config: BridgeConfig['execution']) {
        this.maxSlippageBps = config.maxSlippageBps ?? 50;
        this.maxPositionUsd = config.maxPositionUsd ?? 10000;
        this.maxGasGwei = config.maxGasGwei ?? 100;
        this.maxTotalExposureUsd = this.maxPositionUsd * 3; // Max 3 concurrent positions
        this.gasEstimator = gasEstimator;
    }

    checkExecution(opportunity: ArbitrageOpportunity): RiskCheckResult {
        // Check opportunity freshness
        if (Date.now() > opportunity.expiresAt) {
            return { allowed: false, reason: 'Opportunity expired' };
        }

        // Check position size
        const positionUsd = opportunity.maxSize * opportunity.cexPrice;
        if (positionUsd > this.maxPositionUsd) {
            return { allowed: false, reason: `Position $${positionUsd.toFixed(2)} exceeds limit $${this.maxPositionUsd}` };
        }

        // Check total exposure
        if (this.openExposureUsd + positionUsd > this.maxTotalExposureUsd) {
            return { allowed: false, reason: `Total exposure would exceed $${this.maxTotalExposureUsd}` };
        }

        // Check gas price
        if (this.gasEstimator.isGasTooHigh(this.maxGasGwei)) {
            return {
                allowed: false,
                reason: `Gas price ${this.gasEstimator.getGasPriceGwei().toFixed(1)} gwei exceeds limit ${this.maxGasGwei} gwei`,
            };
        }

        // Check minimum confidence
        if (opportunity.confidence < 0.3) {
            return { allowed: false, reason: `Confidence ${opportunity.confidence.toFixed(2)} below minimum 0.3` };
        }

        // Check estimated profit is still positive
        if (opportunity.estimatedProfitUsd <= 0) {
            return { allowed: false, reason: 'Estimated profit is non-positive' };
        }

        return { allowed: true };
    }

    addExposure(usd: number): void {
        this.openExposureUsd += usd;
    }

    removeExposure(usd: number): void {
        this.openExposureUsd = Math.max(0, this.openExposureUsd - usd);
    }

    getOpenExposure(): number {
        return this.openExposureUsd;
    }
}
