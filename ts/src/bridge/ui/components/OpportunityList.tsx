// ---------------------------------------------------------------------------
// OpportunityList -- real-time arbitrage opportunities table
// ---------------------------------------------------------------------------

import React, { useState, useMemo } from 'react';
import type { ArbitrageOpportunity, BridgeConfig } from '../../types.js';
import { useArbitrageMonitor } from '../../wagmi/hooks.js';
import { OpportunityRow } from './OpportunityRow.js';
import { colors, fontSize, spacing, cardStyle, tableStyle, thStyle, buttonPrimary, buttonDanger, inputStyle } from '../styles.js';

interface OpportunityListProps {
    config: BridgeConfig;
    onExecute: (opp: ArbitrageOpportunity) => void;
}

export function OpportunityList({ config, onExecute }: OpportunityListProps) {
    const { opportunities, isMonitoring, start, stop } = useArbitrageMonitor(config);
    const [minProfit, setMinProfit] = useState(0);
    const [filterSymbol, setFilterSymbol] = useState('');

    const filtered = useMemo(() => {
        return opportunities
            .filter((opp) => opp.estimatedProfitUsd >= minProfit)
            .filter((opp) => !filterSymbol || opp.symbol.includes(filterSymbol.toUpperCase()))
            .sort((a, b) => b.estimatedProfitUsd - a.estimatedProfitUsd);
    }, [opportunities, minProfit, filterSymbol]);

    return (
        <div style={cardStyle}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
                <h2 style={{ margin: 0, fontSize: fontSize.lg, color: colors.text }}>
                    Arbitrage Opportunities
                    <span style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginLeft: spacing.sm }}>
                        ({filtered.length})
                    </span>
                </h2>
                <button
                    style={isMonitoring ? buttonDanger : buttonPrimary}
                    onClick={isMonitoring ? stop : start}
                >
                    {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.md }}>
                <input
                    style={{ ...inputStyle, width: '160px' }}
                    placeholder="Filter symbol..."
                    value={filterSymbol}
                    onChange={(e) => setFilterSymbol(e.target.value)}
                />
                <input
                    style={{ ...inputStyle, width: '140px' }}
                    type="number"
                    placeholder="Min profit ($)"
                    value={minProfit || ''}
                    onChange={(e) => setMinProfit(Number(e.target.value) || 0)}
                />
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div style={{
                    padding: spacing.xxl,
                    textAlign: 'center',
                    color: colors.textSecondary,
                    fontSize: fontSize.md,
                }}>
                    {isMonitoring
                        ? 'Scanning for opportunities...'
                        : 'Press "Start Monitoring" to begin scanning'}
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Symbol</th>
                                <th style={thStyle}>Direction</th>
                                <th style={thStyle}>Spread (bps)</th>
                                <th style={thStyle}>Profit</th>
                                <th style={thStyle}>Size</th>
                                <th style={thStyle}>Confidence</th>
                                <th style={thStyle}>Chain</th>
                                <th style={thStyle}>TTL</th>
                                <th style={thStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((opp) => (
                                <OpportunityRow
                                    key={opp.id}
                                    opportunity={opp}
                                    onExecute={onExecute}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
