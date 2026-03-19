// ---------------------------------------------------------------------------
// CEX-DEX Bridge Types
// ---------------------------------------------------------------------------

import type { Order, Trade, Transaction, Balances, Ticker } from '../base/types.js';

// --- Chain Configuration ---

export interface ChainConfig {
    chainId: number;
    name: string;
    rpcUrl: string;
    binanceNetwork: string;         // Maps to Binance network param: 'ETH', 'ARBITRUM', etc.
    uniswapRouter: `0x${string}`;
    uniswapQuoter: `0x${string}`;
    wethAddress: `0x${string}`;
    blockTimeMs: number;
}

// --- Token ---

export interface TokenInfo {
    address: `0x${string}`;
    symbol: string;
    decimals: number;
}

// --- Pricing ---

export interface PriceSnapshot {
    symbol: string;
    timestamp: number;
    cexBid: number;
    cexAsk: number;
    dexBuyPrice: number;    // cost to buy token on DEX (USDT -> TOKEN)
    dexSellPrice: number;   // proceeds from selling token on DEX (TOKEN -> USDT)
}

export interface DexQuote {
    tokenIn: `0x${string}`;
    tokenOut: `0x${string}`;
    amountIn: bigint;
    amountOut: bigint;
    price: number;
    poolFee: number;
    timestamp: number;
}

// --- Arbitrage ---

export interface ArbitrageOpportunity {
    id: string;
    timestamp: number;
    direction: 'cex-to-dex' | 'dex-to-cex';
    symbol: string;                  // CCXT unified symbol, e.g. 'ETH/USDT'
    cexPrice: number;                // Best executable price on Binance
    dexPrice: number;                // Best executable price on Uniswap
    spreadBps: number;               // Basis points spread
    estimatedProfitUsd: number;      // After fees + gas
    maxSize: number;                 // Max tradeable amount
    chain: ChainConfig;
    cexFees: { trading: number; withdrawal: number };
    dexFees: { trading: number; gas: bigint };
    confidence: number;              // 0-1
    expiresAt: number;               // Opportunity TTL timestamp
}

export type ExecutionStatus = 'pending' | 'partial' | 'completed' | 'failed';
export type LegStatus = 'pending' | 'filled' | 'failed' | 'cancelled';

export interface ExecutionLeg {
    venue: 'binance' | 'uniswap';
    side: 'buy' | 'sell';
    status: LegStatus;
    price?: number;
    amount?: number;
    timestamp?: number;
    orderId?: string;
    txHash?: `0x${string}`;
}

export interface ArbitrageExecution {
    opportunity: ArbitrageOpportunity;
    status: ExecutionStatus;
    cexOrder?: Order;
    dexTxHash?: `0x${string}`;
    actualProfitUsd?: number;
    error?: string;
    legs: ExecutionLeg[];
    startedAt: number;
    completedAt?: number;
}

// --- Transfer ---

export type TransferDirection = 'to-dex' | 'to-cex';
export type TransferStatus = 'idle' | 'pending' | 'confirming' | 'completed' | 'failed';

export interface TransferParams {
    currency: string;
    amount: number;
    chain: ChainConfig;
}

export interface TransferResult {
    direction: TransferDirection;
    currency: string;
    amount: number;
    chain: ChainConfig;
    status: TransferStatus;
    txHash?: `0x${string}`;
    cexTxId?: string;
    error?: string;
}

// --- Configuration ---

export interface BridgeConfig {
    binance: {
        apiKey: string;
        secret: string;
        sandbox?: boolean;
    };
    wallet: {
        privateKey?: `0x${string}`;
    };
    chains: ChainConfig[];
    defaultChainId: number;
    monitoring: {
        symbols: string[];
        pollIntervalMs?: number;        // DEX price poll rate (default 1000)
        minSpreadBps?: number;          // Minimum spread to flag (default 30)
        minProfitUsd?: number;          // Minimum profit threshold (default 5)
        stalenessMs?: number;           // Max price age (default 2000)
    };
    execution: {
        maxSlippageBps?: number;        // Default 50 (0.5%)
        maxPositionUsd?: number;        // Per-trade limit
        maxGasGwei?: number;            // Circuit breaker
        dryRun?: boolean;
        legTimeoutMs?: number;          // Timeout per leg (default 30000)
    };
}

// --- Events ---

export type BridgeEvent = 'opportunity' | 'execution' | 'price' | 'error';

export type BridgeEventMap = {
    opportunity: ArbitrageOpportunity;
    execution: ArbitrageExecution;
    price: PriceSnapshot;
    error: Error;
};

// --- Adapter interfaces ---

export interface ICexAdapter {
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    watchPrices(symbols: string[]): AsyncGenerator<Ticker>;
    getOrderBook(symbol: string, limit?: number): Promise<any>;
    createOrder(symbol: string, type: string, side: string, amount: number, price?: number): Promise<Order>;
    cancelOrder(id: string, symbol: string): Promise<any>;
    fetchBalance(): Promise<Balances>;
    withdraw(currency: string, amount: number, address: string, params?: Record<string, any>): Promise<Transaction>;
    fetchDepositAddress(currency: string, params?: Record<string, any>): Promise<{ address: string; tag?: string }>;
    fetchWithdrawalFees(currency: string): Promise<Record<string, number>>;
    fetchTradingFees(symbol: string): Promise<{ maker: number; taker: number }>;
}

export interface IDexAdapter {
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    getQuote(tokenIn: `0x${string}`, tokenOut: `0x${string}`, amountIn: bigint, poolFee: number): Promise<DexQuote>;
    swap(tokenIn: `0x${string}`, tokenOut: `0x${string}`, amountIn: bigint, minAmountOut: bigint, poolFee: number): Promise<`0x${string}`>;
    getBalance(token: `0x${string}`): Promise<bigint>;
    getNativeBalance(): Promise<bigint>;
    getGasPrice(): Promise<bigint>;
    watchSwapEvents(poolAddress: `0x${string}`, callback: (price: number) => void): () => void;
}
