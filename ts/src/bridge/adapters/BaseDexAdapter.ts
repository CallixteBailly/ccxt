// ---------------------------------------------------------------------------
// Abstract DEX Adapter
// ---------------------------------------------------------------------------

import type { IDexAdapter, DexQuote } from '../types.js';

export abstract class BaseDexAdapter implements IDexAdapter {
    abstract initialize(): Promise<void>;
    abstract shutdown(): Promise<void>;
    abstract getQuote(tokenIn: `0x${string}`, tokenOut: `0x${string}`, amountIn: bigint, poolFee: number): Promise<DexQuote>;
    abstract swap(tokenIn: `0x${string}`, tokenOut: `0x${string}`, amountIn: bigint, minAmountOut: bigint, poolFee: number): Promise<`0x${string}`>;
    abstract getBalance(token: `0x${string}`): Promise<bigint>;
    abstract getNativeBalance(): Promise<bigint>;
    abstract getGasPrice(): Promise<bigint>;
    abstract watchSwapEvents(poolAddress: `0x${string}`, callback: (price: number) => void): () => void;
}
