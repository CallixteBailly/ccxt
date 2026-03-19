// ---------------------------------------------------------------------------
// Abstract CEX Adapter
// ---------------------------------------------------------------------------

import type { Order, Transaction, Balances, Ticker } from '../../base/types.js';
import type { ICexAdapter } from '../types.js';

export abstract class BaseCexAdapter implements ICexAdapter {
    abstract initialize(): Promise<void>;
    abstract shutdown(): Promise<void>;
    abstract watchPrices(symbols: string[]): AsyncGenerator<Ticker>;
    abstract getOrderBook(symbol: string, limit?: number): Promise<any>;
    abstract createOrder(symbol: string, type: string, side: string, amount: number, price?: number): Promise<Order>;
    abstract cancelOrder(id: string, symbol: string): Promise<any>;
    abstract fetchBalance(): Promise<Balances>;
    abstract withdraw(currency: string, amount: number, address: string, params?: Record<string, any>): Promise<Transaction>;
    abstract fetchDepositAddress(currency: string, params?: Record<string, any>): Promise<{ address: string; tag?: string }>;
    abstract fetchWithdrawalFees(currency: string): Promise<Record<string, number>>;
    abstract fetchTradingFees(symbol: string): Promise<{ maker: number; taker: number }>;
}
