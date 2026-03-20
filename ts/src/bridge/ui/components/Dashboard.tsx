// ---------------------------------------------------------------------------
// Dashboard -- overview with KPI cards, recent opportunities, balances
// ---------------------------------------------------------------------------

import React from 'react';
import type { ArbitrageOpportunity, ArbitrageExecution, BridgeConfig } from '../../types.js';
import { useBridgeBalances } from '../../wagmi/hooks.js';
import { StatusBadge } from './StatusBadge.js';
import { colors, fontSize, spacing, cardStyle } from '../styles.js';

interface DashboardProps {
    config: BridgeConfig;
    opportunities: ArbitrageOpportunity[];
    executions: ArbitrageExecution[];
    isMonitoring: boolean;
}

export function Dashboard({ config, opportunities, executions, isMonitoring }: DashboardProps) {
    const { cexBalances, dexBalances } = useBridgeBalances(config);

    const totalProfit = executions.reduce((sum, e) => sum + (e.actualProfitUsd ?? e.opportunity.estimatedProfitUsd), 0);
    const bestSpread = opportunities.length > 0
        ? Math.max(...opportunities.map((o) => o.spreadBps))
        : 0;
    const completedTrades = executions.filter((e) => e.status === 'completed').length;

    return (
        <div>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: spacing.lg, marginBottom: spacing.xl }}>
                <KpiCard
                    label="Total Profit"
                    value={`$${totalProfit.toFixed(2)}`}
                    color={totalProfit >= 0 ? colors.green : colors.red}
                />
                <KpiCard
                    label="Opportunities"
                    value={String(opportunities.length)}
                    color={colors.blue}
                />
                <KpiCard
                    label="Trades Executed"
                    value={String(completedTrades)}
                    color={colors.purple}
                />
                <KpiCard
                    label="Best Spread"
                    value={`${bestSpread.toFixed(1)} bps`}
                    color={bestSpread > 50 ? colors.green : colors.yellow}
                />
            </div>

            {/* Status bar */}
            <div style={{
                ...cardStyle,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.lg,
                padding: spacing.md,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                    <StatusBadge status={isMonitoring ? 'active' : 'inactive'} label={isMonitoring ? 'LIVE' : 'OFFLINE'} />
                    <span style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
                        Monitoring {config.monitoring.symbols.join(', ')}
                    </span>
                </div>
                <span style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
                    Chain: {config.chains.find((c) => c.chainId === config.defaultChainId)?.name ?? 'unknown'}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
                {/* Recent opportunities */}
                <div style={cardStyle}>
                    <h3 style={{ margin: 0, fontSize: fontSize.md, color: colors.text, marginBottom: spacing.md }}>
                        Recent Opportunities
                    </h3>
                    {opportunities.length === 0 ? (
                        <div style={{ padding: spacing.lg, textAlign: 'center', color: colors.textSecondary, fontSize: fontSize.sm }}>
                            {isMonitoring ? 'Scanning...' : 'Not monitoring'}
                        </div>
                    ) : (
                        <div>
                            {opportunities.slice(0, 5).map((opp) => (
                                <div key={opp.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: `${spacing.sm} 0`,
                                    borderBottom: `1px solid ${colors.border}`,
                                }}>
                                    <div>
                                        <span style={{ fontWeight: 600, fontSize: fontSize.sm }}>{opp.symbol}</span>
                                        <span style={{
                                            fontSize: fontSize.xs,
                                            color: opp.direction === 'cex-to-dex' ? colors.blue : colors.purple,
                                            marginLeft: spacing.sm,
                                        }}>
                                            {opp.direction === 'cex-to-dex' ? 'C->D' : 'D->C'}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ color: colors.green, fontWeight: 600, fontSize: fontSize.sm }}>
                                            ${opp.estimatedProfitUsd.toFixed(2)}
                                        </span>
                                        <span style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginLeft: spacing.sm }}>
                                            {opp.spreadBps.toFixed(0)}bps
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Balance summary */}
                <div style={cardStyle}>
                    <h3 style={{ margin: 0, fontSize: fontSize.md, color: colors.text, marginBottom: spacing.md }}>
                        Balance Summary
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
                        <div>
                            <div style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.sm }}>
                                CEX (BINANCE)
                            </div>
                            {cexBalances ? (
                                Object.entries(cexBalances)
                                    .filter(([, v]) => v > 0)
                                    .slice(0, 5)
                                    .map(([k, v]) => (
                                        <div key={k} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: fontSize.sm,
                                            padding: `2px 0`,
                                        }}>
                                            <span style={{ color: colors.textSecondary }}>{k}</span>
                                            <span>{typeof v === 'number' ? v.toFixed(4) : v}</span>
                                        </div>
                                    ))
                            ) : (
                                <span style={{ fontSize: fontSize.xs, color: colors.textMuted }}>--</span>
                            )}
                        </div>
                        <div>
                            <div style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.sm }}>
                                DEX (WALLET)
                            </div>
                            {dexBalances ? (
                                Object.entries(dexBalances)
                                    .filter(([, v]) => v > 0)
                                    .slice(0, 5)
                                    .map(([k, v]) => (
                                        <div key={k} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: fontSize.sm,
                                            padding: `2px 0`,
                                        }}>
                                            <span style={{ color: colors.textSecondary }}>{k}</span>
                                            <span>{typeof v === 'number' ? v.toFixed(4) : v}</span>
                                        </div>
                                    ))
                            ) : (
                                <span style={{ fontSize: fontSize.xs, color: colors.textMuted }}>--</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div style={{
            ...cardStyle,
            textAlign: 'center',
            padding: spacing.lg,
        }}>
            <div style={{ fontSize: fontSize.xs, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: spacing.sm }}>
                {label}
            </div>
            <div style={{ fontSize: fontSize.xxl, fontWeight: 700, color }}>
                {value}
            </div>
        </div>
    );
}
