// ---------------------------------------------------------------------------
// TradeHistory -- list of past arbitrage executions
// ---------------------------------------------------------------------------

import React from 'react';
import type { ArbitrageExecution } from '../../types.js';
import { StatusBadge } from './StatusBadge.js';
import { colors, fontSize, spacing, cardStyle, tableStyle, thStyle, tdStyle } from '../styles.js';

interface TradeHistoryProps {
    executions: ArbitrageExecution[];
}

export function TradeHistory({ executions }: TradeHistoryProps) {
    if (executions.length === 0) {
        return (
            <div style={cardStyle}>
                <h2 style={{ margin: 0, fontSize: fontSize.lg, color: colors.text, marginBottom: spacing.lg }}>
                    Trade History
                </h2>
                <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
                    No trades executed yet
                </div>
            </div>
        );
    }

    return (
        <div style={cardStyle}>
            <h2 style={{ margin: 0, fontSize: fontSize.lg, color: colors.text, marginBottom: spacing.lg }}>
                Trade History
                <span style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginLeft: spacing.sm }}>
                    ({executions.length})
                </span>
            </h2>

            <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Time</th>
                            <th style={thStyle}>Symbol</th>
                            <th style={thStyle}>Direction</th>
                            <th style={thStyle}>Spread</th>
                            <th style={thStyle}>Profit</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Legs</th>
                        </tr>
                    </thead>
                    <tbody>
                        {executions.map((exec, i) => {
                            const time = new Date(exec.startedAt).toLocaleTimeString();
                            const profit = exec.actualProfitUsd ?? exec.opportunity.estimatedProfitUsd;
                            const profitColor = profit >= 0 ? colors.green : colors.red;

                            return (
                                <tr key={i}>
                                    <td style={{ ...tdStyle, fontSize: fontSize.xs, color: colors.textSecondary }}>
                                        {time}
                                    </td>
                                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                                        {exec.opportunity.symbol}
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{ fontSize: fontSize.xs }}>
                                            {exec.opportunity.direction === 'cex-to-dex' ? 'CEX->DEX' : 'DEX->CEX'}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        {exec.opportunity.spreadBps.toFixed(1)} bps
                                    </td>
                                    <td style={{ ...tdStyle, color: profitColor, fontWeight: 600 }}>
                                        ${profit.toFixed(2)}
                                    </td>
                                    <td style={tdStyle}>
                                        <StatusBadge status={exec.status} />
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', gap: spacing.xs }}>
                                            {exec.legs.map((leg, j) => (
                                                <StatusBadge
                                                    key={j}
                                                    status={leg.status}
                                                    label={`${leg.venue.slice(0, 3).toUpperCase()}`}
                                                />
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
