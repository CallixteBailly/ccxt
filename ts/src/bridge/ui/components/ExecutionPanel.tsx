// ---------------------------------------------------------------------------
// ExecutionPanel -- arbitrage execution with leg status tracking
// ---------------------------------------------------------------------------

import React from 'react';
import type { ArbitrageOpportunity, ArbitrageExecution, BridgeConfig } from '../../types.js';
import { useArbitrageExecution } from '../../wagmi/hooks.js';
import { StatusBadge } from './StatusBadge.js';
import { colors, fontSize, spacing, cardStyle, buttonSuccess, buttonSecondary } from '../styles.js';

interface ExecutionPanelProps {
    config: BridgeConfig;
    opportunity: ArbitrageOpportunity | null;
    onClose: () => void;
}

export function ExecutionPanel({ config, opportunity, onClose }: ExecutionPanelProps) {
    const { execute, status, isExecuting } = useArbitrageExecution(config);

    if (!opportunity) return null;

    const handleExecute = async () => {
        await execute(opportunity);
    };

    const directionLabel = opportunity.direction === 'cex-to-dex' ? 'CEX -> DEX' : 'DEX -> CEX';

    return (
        <div style={{
            ...cardStyle,
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '500px',
            maxHeight: '80vh',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
                <h3 style={{ margin: 0, fontSize: fontSize.lg, color: colors.text }}>
                    Execute Arbitrage
                </h3>
                <button
                    style={{ ...buttonSecondary, padding: '4px 8px', fontSize: fontSize.sm }}
                    onClick={onClose}
                >
                    X
                </button>
            </div>

            {/* Opportunity details */}
            <div style={{ marginBottom: spacing.lg }}>
                <InfoRow label="Symbol" value={opportunity.symbol} />
                <InfoRow label="Direction" value={directionLabel} />
                <InfoRow label="Spread" value={`${opportunity.spreadBps.toFixed(1)} bps`} />
                <InfoRow label="Est. Profit" value={`$${opportunity.estimatedProfitUsd.toFixed(2)}`} valueColor={colors.green} />
                <InfoRow label="Size" value={`${opportunity.maxSize.toFixed(4)}`} />
                <InfoRow label="CEX Price" value={opportunity.cexPrice.toFixed(2)} />
                <InfoRow label="DEX Price" value={opportunity.dexPrice.toFixed(2)} />
                <InfoRow label="Confidence" value={`${(opportunity.confidence * 100).toFixed(0)}%`} />
                <InfoRow label="Chain" value={opportunity.chain.name} />
            </div>

            {/* Execution status */}
            {status && (
                <div style={{ marginBottom: spacing.lg }}>
                    <div style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.sm, textTransform: 'uppercase' }}>
                        Execution Status
                    </div>
                    <div style={{ marginBottom: spacing.sm }}>
                        <StatusBadge status={status.status} />
                    </div>

                    {/* Legs */}
                    {status.legs.map((leg, i) => (
                        <div key={i} style={{
                            padding: spacing.md,
                            background: colors.bg,
                            borderRadius: '6px',
                            marginBottom: spacing.sm,
                            border: `1px solid ${colors.border}`,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                                <span style={{ fontSize: fontSize.sm, fontWeight: 600, color: colors.text }}>
                                    Leg {i + 1}: {leg.venue.toUpperCase()} ({leg.side})
                                </span>
                                <StatusBadge status={leg.status} />
                            </div>
                            {leg.price && (
                                <div style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                                    Price: {leg.price.toFixed(2)} | Amount: {leg.amount?.toFixed(4)}
                                </div>
                            )}
                            {leg.txHash && (
                                <div style={{ fontSize: fontSize.xs, color: colors.blue, marginTop: spacing.xs }}>
                                    Tx: {leg.txHash.slice(0, 10)}...{leg.txHash.slice(-8)}
                                </div>
                            )}
                            {leg.orderId && (
                                <div style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.xs }}>
                                    Order: {leg.orderId}
                                </div>
                            )}
                        </div>
                    ))}

                    {status.actualProfitUsd !== undefined && (
                        <InfoRow
                            label="Actual Profit"
                            value={`$${status.actualProfitUsd.toFixed(2)}`}
                            valueColor={status.actualProfitUsd >= 0 ? colors.green : colors.red}
                        />
                    )}

                    {status.error && (
                        <div style={{
                            padding: spacing.sm,
                            background: colors.redBg,
                            borderRadius: '6px',
                            color: colors.red,
                            fontSize: fontSize.sm,
                        }}>
                            {status.error}
                        </div>
                    )}
                </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: spacing.md }}>
                <button
                    style={{
                        ...buttonSuccess,
                        flex: 1,
                        opacity: isExecuting ? 0.6 : 1,
                    }}
                    onClick={handleExecute}
                    disabled={isExecuting}
                >
                    {isExecuting ? 'Executing...' : 'Confirm Execute'}
                </button>
                <button style={buttonSecondary} onClick={onClose}>
                    Cancel
                </button>
            </div>
        </div>
    );
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: `${spacing.xs} 0`,
            borderBottom: `1px solid ${colors.border}`,
        }}>
            <span style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>{label}</span>
            <span style={{ fontSize: fontSize.sm, color: valueColor ?? colors.text, fontWeight: 600 }}>{value}</span>
        </div>
    );
}
