// ---------------------------------------------------------------------------
// TransferManager -- handles fund transfers between CEX and DEX wallets
// ---------------------------------------------------------------------------

import type { BinanceCexAdapter } from '../adapters/BinanceCexAdapter.js';
import type { UniswapDexAdapter } from '../adapters/UniswapDexAdapter.js';
import type { ChainConfig, TransferResult } from '../types.js';

export class TransferManager {
    private cex: BinanceCexAdapter;
    private dex: UniswapDexAdapter;
    private walletAddress: string;

    constructor(cex: BinanceCexAdapter, dex: UniswapDexAdapter, walletAddress: string) {
        this.cex = cex;
        this.dex = dex;
        this.walletAddress = walletAddress;
    }

    /**
     * Withdraw from Binance to on-chain wallet
     */
    async transferToDex(
        currency: string,
        amount: number,
        chain: ChainConfig,
    ): Promise<TransferResult> {
        try {
            const tx = await this.cex.withdraw(currency, amount, this.walletAddress, {
                network: chain.binanceNetwork,
            });
            return {
                direction: 'to-dex',
                currency,
                amount,
                chain,
                status: 'pending',
                cexTxId: tx.id,
            };
        } catch (err: any) {
            return {
                direction: 'to-dex',
                currency,
                amount,
                chain,
                status: 'failed',
                error: err.message,
            };
        }
    }

    /**
     * Deposit from on-chain wallet to Binance
     * This requires sending tokens to Binance's deposit address on the given chain.
     */
    async transferToCex(
        currency: string,
        amount: number,
        chain: ChainConfig,
    ): Promise<TransferResult> {
        try {
            // Get Binance deposit address for this currency/network
            const depositAddr = await this.cex.fetchDepositAddress(currency, {
                network: chain.binanceNetwork,
            });

            // For now return pending status -- the actual on-chain transfer
            // would be done via the DEX adapter's wallet client
            return {
                direction: 'to-cex',
                currency,
                amount,
                chain,
                status: 'pending',
            };
        } catch (err: any) {
            return {
                direction: 'to-cex',
                currency,
                amount,
                chain,
                status: 'failed',
                error: err.message,
            };
        }
    }

    /**
     * Get consolidated balances from both venues
     */
    async getBalances(
        tokens: Array<{ symbol: string; address: `0x${string}`; decimals: number }>,
    ): Promise<{
        cex: Record<string, number>;
        dex: Record<string, number>;
    }> {
        const cexBalances = await this.cex.fetchBalance();
        const dexBalances: Record<string, number> = {};

        const dexPromises = tokens.map(async (token) => {
            const balance = await this.dex.getBalance(token.address);
            dexBalances[token.symbol] = Number(balance) / (10 ** token.decimals);
        });
        await Promise.allSettled(dexPromises);

        // Add native balance
        const nativeBalance = await this.dex.getNativeBalance();
        dexBalances['ETH'] = Number(nativeBalance) / 1e18;

        const cexResult: Record<string, number> = {};
        if (cexBalances.free) {
            for (const [currency, amount] of Object.entries(cexBalances.free)) {
                if (typeof amount === 'number' && amount > 0) {
                    cexResult[currency] = amount;
                }
            }
        }

        return { cex: cexResult, dex: dexBalances };
    }
}
