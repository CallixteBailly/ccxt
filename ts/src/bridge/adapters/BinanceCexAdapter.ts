// ---------------------------------------------------------------------------
// Binance CEX Adapter -- wraps CCXT Binance (REST + WebSocket pro)
// ---------------------------------------------------------------------------

import type { Order, Transaction, Balances, Ticker } from '../../base/types.js';
import { BaseCexAdapter } from './BaseCexAdapter.js';

interface BinanceCexConfig {
    apiKey: string;
    secret: string;
    sandbox?: boolean;
}

export class BinanceCexAdapter extends BaseCexAdapter {
    private config: BinanceCexConfig;
    private restExchange: any = null;       // ccxt.binance instance
    private wsExchange: any = null;         // ccxt.pro.binance instance
    private initialized = false;

    constructor(config: BinanceCexConfig) {
        super();
        this.config = config;
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;
        // Dynamic imports to avoid hard dependency at module level
        const ccxt = await import('../../ccxt.js');
        const ccxtPro = await import('../../pro/binance.js');

        this.restExchange = new (ccxt as any).binance({
            apiKey: this.config.apiKey,
            secret: this.config.secret,
            enableRateLimit: true,
        });

        this.wsExchange = new ccxtPro.default({
            apiKey: this.config.apiKey,
            secret: this.config.secret,
            enableRateLimit: true,
        });

        if (this.config.sandbox) {
            this.restExchange.setSandboxMode(true);
            this.wsExchange.setSandboxMode(true);
        }

        await this.restExchange.loadMarkets();
        this.initialized = true;
    }

    async shutdown(): Promise<void> {
        if (this.wsExchange) {
            await this.wsExchange.close();
        }
        this.initialized = false;
    }

    async *watchPrices(symbols: string[]): AsyncGenerator<Ticker> {
        this.ensureInitialized();
        while (true) {
            const tickers = await this.wsExchange.watchBidsAsks(symbols);
            for (const symbol of Object.keys(tickers)) {
                yield tickers[symbol] as Ticker;
            }
        }
    }

    async getOrderBook(symbol: string, limit = 20): Promise<any> {
        this.ensureInitialized();
        return this.restExchange.fetchOrderBook(symbol, limit);
    }

    async createOrder(
        symbol: string,
        type: string,
        side: string,
        amount: number,
        price?: number,
    ): Promise<Order> {
        this.ensureInitialized();
        return this.restExchange.createOrder(symbol, type, side, amount, price);
    }

    async cancelOrder(id: string, symbol: string): Promise<any> {
        this.ensureInitialized();
        return this.restExchange.cancelOrder(id, symbol);
    }

    async fetchBalance(): Promise<Balances> {
        this.ensureInitialized();
        return this.restExchange.fetchBalance();
    }

    async withdraw(
        currency: string,
        amount: number,
        address: string,
        params: Record<string, any> = {},
    ): Promise<Transaction> {
        this.ensureInitialized();
        return this.restExchange.withdraw(currency, amount, address, undefined, params);
    }

    async fetchDepositAddress(
        currency: string,
        params: Record<string, any> = {},
    ): Promise<{ address: string; tag?: string }> {
        this.ensureInitialized();
        const result = await this.restExchange.fetchDepositAddress(currency, params);
        return { address: result.address, tag: result.tag };
    }

    async fetchWithdrawalFees(currency: string): Promise<Record<string, number>> {
        this.ensureInitialized();
        const fees = await this.restExchange.fetchDepositWithdrawFees([currency]);
        const feeInfo = fees[currency];
        if (!feeInfo) return {};
        const result: Record<string, number> = {};
        if (feeInfo.withdraw && feeInfo.withdraw.networks) {
            for (const [network, info] of Object.entries(feeInfo.withdraw.networks) as any) {
                result[network] = info.fee ?? 0;
            }
        }
        return result;
    }

    async fetchTradingFees(symbol: string): Promise<{ maker: number; taker: number }> {
        this.ensureInitialized();
        const fees = await this.restExchange.fetchTradingFee(symbol);
        return { maker: fees.maker, taker: fees.taker };
    }

    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error('BinanceCexAdapter not initialized. Call initialize() first.');
        }
    }
}
