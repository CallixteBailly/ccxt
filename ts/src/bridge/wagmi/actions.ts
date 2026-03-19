// ---------------------------------------------------------------------------
// viem-compatible actions (non-React, standalone usage)
// ---------------------------------------------------------------------------

import type { PublicClient, WalletClient } from 'viem';
import type { ChainConfig, DexQuote, BridgeConfig } from '../types.js';
import { UniswapDexAdapter } from '../adapters/UniswapDexAdapter.js';
import { CexDexBridge } from '../CexDexBridge.js';

/**
 * Create a DEX adapter from viem clients (no React required)
 */
export function createDexAdapter(
    publicClient: PublicClient,
    walletClient: WalletClient,
    chain: ChainConfig,
): UniswapDexAdapter {
    return new UniswapDexAdapter({ publicClient, walletClient, chain });
}

/**
 * Get a Uniswap V3 quote using viem clients directly
 */
export async function quoteDexPrice(
    publicClient: PublicClient,
    chain: ChainConfig,
    params: {
        tokenIn: `0x${string}`;
        tokenOut: `0x${string}`;
        amountIn: bigint;
        poolFee: number;
    },
): Promise<DexQuote> {
    const adapter = new UniswapDexAdapter({ publicClient, walletClient: {} as WalletClient, chain });
    await adapter.initialize();
    try {
        return await adapter.getQuote(params.tokenIn, params.tokenOut, params.amountIn, params.poolFee);
    } finally {
        await adapter.shutdown();
    }
}

/**
 * Execute a Uniswap V3 swap using viem clients directly
 */
export async function executeDexSwap(
    walletClient: WalletClient,
    publicClient: PublicClient,
    chain: ChainConfig,
    params: {
        tokenIn: `0x${string}`;
        tokenOut: `0x${string}`;
        amountIn: bigint;
        minAmountOut: bigint;
        poolFee: number;
    },
): Promise<`0x${string}`> {
    const adapter = new UniswapDexAdapter({ publicClient, walletClient, chain });
    await adapter.initialize();
    try {
        return await adapter.swap(
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            params.minAmountOut,
            params.poolFee,
        );
    } finally {
        await adapter.shutdown();
    }
}

/**
 * Create a full CexDexBridge using wagmi/viem clients
 */
export function createBridgeWithClients(
    config: BridgeConfig,
    publicClient: PublicClient,
    walletClient: WalletClient,
): CexDexBridge {
    return CexDexBridge.withClients(config, publicClient, walletClient);
}
