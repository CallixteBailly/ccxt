// ---------------------------------------------------------------------------
// OpportunityRow -- single arbitrage opportunity table row
// ---------------------------------------------------------------------------

import React from 'react';
import type { ArbitrageOpportunity } from '../../types.js';
import { StatusBadge } from './StatusBadge.js';
import { colors, fontSize, spacing, tdStyle, buttonPrimary } from '../styles.js';

interface OpportunityRowProps {
    opportunity: ArbitrageOpportunity;
    onExecute: (opp: ArbitrageOpportunity) => void;
}

export function OpportunityRow({ opportunity: opp, onExecute }: OpportunityRowProps) {
    const ttl = opp.expiresAt - Date.now();
    const isExpired = ttl <= 0;
    const directionColor = opp.direction === 'cex-to-dex' ? colors.blue : colors.purple;
    const directionLabel = opp.direction === 'cex-to-dex' ? 'CEX->DEX' : 'DEX->CEX';

    const confidenceColor = opp.confidence >= 0.7
        ? colors.green
        : opp.confidence >= 0.4
            ? colors.yellow
            : colors.red;

    return (
        <tr style={{ opacity: isExpired ? 0.4 : 1 }}>
            <td style={tdStyle}>
                <span style={{ fontWeight: 600 }}>{opp.symbol}</span>
            </td>
            <td style={tdStyle}>
                <span style={{
                    color: directionColor,
                    fontSize: fontSize.xs,
                    fontWeight: 600,
                    padding: `2px ${spacing.sm}`,
                    borderRadius: '4px',
                    background: opp.direction === 'cex-to-dex' ? colors.blueBg : 'rgba(188, 140, 255, 0.15)',
                }}>
                    {directionLabel}
                </span>
            </td>
            <td style={{ ...tdStyle, fontWeight: 700, color: opp.spreadBps >= 50 ? colors.green : colors.text }}>
                {opp.spreadBps.toFixed(1)}
            </td>
            <td style={{ ...tdStyle, color: colors.green, fontWeight: 600 }}>
                ${opp.estimatedProfitUsd.toFixed(2)}
            </td>
            <td style={tdStyle}>
                {opp.maxSize.toFixed(4)}
            </td>
            <td style={tdStyle}>
                <span style={{ color: confidenceColor, fontWeight: 600 }}>
                    {(opp.confidence * 100).toFixed(0)}%
                </span>
            </td>
            <td style={tdStyle}>
                <span style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                    {opp.chain.name}
                </span>
            </td>
            <td style={tdStyle}>
                {isExpired ? (
                    <StatusBadge status="cancelled" label="expired" />
                ) : (
                    <span style={{ fontSize: fontSize.xs, color: colors.yellow }}>
                        {(ttl / 1000).toFixed(1)}s
                    </span>
                )}
            </td>
            <td style={tdStyle}>
                <button
                    style={{ ...buttonPrimary, padding: `4px ${spacing.md}`, fontSize: fontSize.xs }}
                    onClick={() => onExecute(opp)}
                    disabled={isExpired}
                >
                    Execute
                </button>
            </td>
        </tr>
    );
}
