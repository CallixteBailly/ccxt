// ---------------------------------------------------------------------------
// BalancePanel -- side-by-side CEX/DEX balances
// ---------------------------------------------------------------------------

import React from 'react';
import type { BridgeConfig } from '../../types.js';
import { useBridgeBalances } from '../../wagmi/hooks.js';
import { colors, fontSize, spacing, cardStyle, tableStyle, thStyle, tdStyle, buttonSecondary } from '../styles.js';

interface BalancePanelProps {
    config: BridgeConfig;
}

export function BalancePanel({ config }: BalancePanelProps) {
    const { cexBalances, dexBalances, isLoading, refetch } = useBridgeBalances(config);

    // Merge all currencies from both venues
    const currencies = new Set<string>();
    if (cexBalances) Object.keys(cexBalances).forEach((k) => currencies.add(k));
    if (dexBalances) Object.keys(dexBalances).forEach((k) => currencies.add(k));
    const sortedCurrencies = Array.from(currencies).sort();

    return (
        <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
                <h2 style={{ margin: 0, fontSize: fontSize.lg, color: colors.text }}>
                    Balances
                </h2>
                <button
                    style={{ ...buttonSecondary, opacity: isLoading ? 0.6 : 1 }}
                    onClick={refetch}
                    disabled={isLoading}
                >
                    {isLoading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {sortedCurrencies.size === 0 ? (
                <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
                    {isLoading ? 'Loading balances...' : 'Connect wallet to view balances'}
                </div>
            ) : (
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Currency</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>CEX (Binance)</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>DEX (Wallet)</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedCurrencies.map((currency) => {
                            const cex = cexBalances?.[currency] ?? 0;
                            const dex = dexBalances?.[currency] ?? 0;
                            const total = cex + dex;
                            if (total === 0) return null;
                            return (
                                <tr key={currency}>
                                    <td style={{ ...tdStyle, fontWeight: 600 }}>{currency}</td>
                                    <td style={{ ...tdStyle, textAlign: 'right', color: cex > 0 ? colors.text : colors.textMuted }}>
                                        {cex > 0 ? formatBalance(cex) : '-'}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'right', color: dex > 0 ? colors.text : colors.textMuted }}>
                                        {dex > 0 ? formatBalance(dex) : '-'}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: colors.blue }}>
                                        {formatBalance(total)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}

function formatBalance(amount: number): string {
    if (amount >= 1000) return amount.toFixed(2);
    if (amount >= 1) return amount.toFixed(4);
    if (amount >= 0.0001) return amount.toFixed(6);
    return amount.toExponential(2);
}
