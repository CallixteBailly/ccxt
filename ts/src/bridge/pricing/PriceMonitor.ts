// ---------------------------------------------------------------------------
// PriceMonitor -- merges CEX (WebSocket) and DEX (poll + events) price feeds
// ---------------------------------------------------------------------------

import type { Ticker } from '../../base/types.js';
import type { BinanceCexAdapter } from '../adapters/BinanceCexAdapter.js';
import type { UniswapDexAdapter } from '../adapters/UniswapDexAdapter.js';
import type { PriceSnapshot, ChainConfig, BridgeConfig } from '../types.js';
import { resolveTokenPair, POOL_FEES } from '../constants/tokens.js';

export class PriceMonitor {
    private cex: BinanceCexAdapter;
    private dex: UniswapDexAdapter;
    private chain: ChainConfig;
    private symbols: string[];
    private pollIntervalMs: number;
    private running = false;
    private pollTimer: ReturnType<typeof setInterval> | null = null;
    private cexAbort: AbortController | null = null;
    private listeners: Array<(snapshot: PriceSnapshot) => void> = [];

    // Latest known prices
    private cexPrices: Map<string, { bid: number; ask: number; timestamp: number }> = new Map();
    private dexPrices: Map<string, { buyPrice: number; sellPrice: number; timestamp: number }> = new Map();

    constructor(
        cex: BinanceCexAdapter,
        dex: UniswapDexAdapter,
        chain: ChainConfig,
        config: BridgeConfig['monitoring'],
    ) {
        this.cex = cex;
        this.dex = dex;
        this.chain = chain;
        this.symbols = config.symbols;
        this.pollIntervalMs = config.pollIntervalMs ?? 1000;
    }

    onPrice(listener: (snapshot: PriceSnapshot) => void): void {
        this.listeners.push(listener);
    }

    getSnapshot(symbol: string): PriceSnapshot | undefined {
        const cex = this.cexPrices.get(symbol);
        const dex = this.dexPrices.get(symbol);
        if (!cex || !dex) return undefined;
        return {
            symbol,
            timestamp: Math.max(cex.timestamp, dex.timestamp),
            cexBid: cex.bid,
            cexAsk: cex.ask,
            dexBuyPrice: dex.buyPrice,
            dexSellPrice: dex.sellPrice,
        };
    }

    getAllSnapshots(): PriceSnapshot[] {
        const snapshots: PriceSnapshot[] = [];
        for (const symbol of this.symbols) {
            const snap = this.getSnapshot(symbol);
            if (snap) snapshots.push(snap);
        }
        return snapshots;
    }

    async start(): Promise<void> {
        if (this.running) return;
        this.running = true;

        // Start CEX price stream
        this.startCexStream();
        // Start DEX price polling
        this.startDexPolling();
    }

    stop(): void {
        this.running = false;
        if (this.cexAbort) {
            this.cexAbort.abort();
            this.cexAbort = null;
        }
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }

    // --- Private ---

    private async startCexStream(): Promise<void> {
        this.cexAbort = new AbortController();
        try {
            const stream = this.cex.watchPrices(this.symbols);
            for await (const ticker of stream) {
                if (!this.running) break;
                if (ticker.symbol && ticker.bid !== undefined && ticker.ask !== undefined) {
                    this.cexPrices.set(ticker.symbol, {
                        bid: ticker.bid,
                        ask: ticker.ask,
                        timestamp: Date.now(),
                    });
                    this.emitIfComplete(ticker.symbol);
                }
            }
        } catch (err) {
            if (this.running) {
                // Reconnect after brief pause
                setTimeout(() => this.startCexStream(), 1000);
            }
        }
    }

    private startDexPolling(): void {
        const poll = async () => {
            if (!this.running) return;
            const promises = this.symbols.map((symbol) => this.pollDexPrice(symbol));
            await Promise.allSettled(promises);
        };

        // Initial poll
        poll();
        // Recurring poll
        this.pollTimer = setInterval(poll, this.pollIntervalMs);
    }

    private async pollDexPrice(symbol: string): Promise<void> {
        const pair = resolveTokenPair(symbol, this.chain.chainId);
        if (!pair) return;

        const amountIn = BigInt(10 ** pair.quote.decimals); // 1 unit of quote for buy price

        try {
            // Buy price: how much base token you get for 1 quote token
            const buyQuote = await this.dex.getQuote(
                pair.quote.address,
                pair.base.address,
                amountIn,
                POOL_FEES.MEDIUM,
            );
            const buyPrice = 1 / buyQuote.price; // Invert: price of base in quote terms

            // Sell price: how much quote token you get for 1 base token
            const baseAmountIn = BigInt(10 ** pair.base.decimals);
            const sellQuote = await this.dex.getQuote(
                pair.base.address,
                pair.quote.address,
                baseAmountIn,
                POOL_FEES.MEDIUM,
            );
            const sellPrice = Number(sellQuote.amountOut) / (10 ** pair.quote.decimals);

            this.dexPrices.set(symbol, {
                buyPrice,
                sellPrice,
                timestamp: Date.now(),
            });
            this.emitIfComplete(symbol);
        } catch {
            // Silently skip failed quotes -- will retry on next poll
        }
    }

    private emitIfComplete(symbol: string): void {
        const snapshot = this.getSnapshot(symbol);
        if (snapshot) {
            for (const listener of this.listeners) {
                listener(snapshot);
            }
        }
    }
}
