// ---------------------------------------------------------------------------
// GasEstimator -- estimates swap gas costs in USD
// ---------------------------------------------------------------------------

import type { UniswapDexAdapter } from '../adapters/UniswapDexAdapter.js';
import type { ChainConfig } from '../types.js';

// Approximate gas units for a Uniswap V3 single-hop swap
const SWAP_GAS_ESTIMATE = 200_000n;
// Approximate gas units for an ERC20 approval
const APPROVAL_GAS_ESTIMATE = 50_000n;

export class GasEstimator {
    private dex: UniswapDexAdapter;
    private chain: ChainConfig;
    private ethPriceUsd: number = 0;
    private lastGasPrice: bigint = 0n;

    constructor(dex: UniswapDexAdapter, chain: ChainConfig) {
        this.dex = dex;
        this.chain = chain;
    }

    setEthPriceUsd(price: number): void {
        this.ethPriceUsd = price;
    }

    async refreshGasPrice(): Promise<bigint> {
        this.lastGasPrice = await this.dex.getGasPrice();
        return this.lastGasPrice;
    }

    async estimateSwapGas(): Promise<bigint> {
        const gasPrice = await this.refreshGasPrice();
        return gasPrice * SWAP_GAS_ESTIMATE;
    }

    async estimateSwapCostUsd(): Promise<number> {
        if (this.ethPriceUsd <= 0) return 0;
        const gasCostWei = await this.estimateSwapGas();
        const gasCostEth = Number(gasCostWei) / 1e18;
        return gasCostEth * this.ethPriceUsd;
    }

    async estimateApprovalCostUsd(): Promise<number> {
        if (this.ethPriceUsd <= 0) return 0;
        const gasPrice = this.lastGasPrice || (await this.refreshGasPrice());
        const gasCostWei = gasPrice * APPROVAL_GAS_ESTIMATE;
        const gasCostEth = Number(gasCostWei) / 1e18;
        return gasCostEth * this.ethPriceUsd;
    }

    getGasPriceGwei(): number {
        return Number(this.lastGasPrice) / 1e9;
    }

    isGasTooHigh(maxGasGwei: number): boolean {
        return this.getGasPriceGwei() > maxGasGwei;
    }
}
