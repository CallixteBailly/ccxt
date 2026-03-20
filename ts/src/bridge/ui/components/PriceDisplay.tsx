// ---------------------------------------------------------------------------
// PriceDisplay -- shows CEX/DEX prices with spread
// ---------------------------------------------------------------------------

import React from 'react';
import type { PriceSnapshot } from '../../types.js';
import { colors, fontSize, spacing, cardStyle } from '../styles.js';

interface PriceDisplayProps {
    snapshot: PriceSnapshot;
}

export function PriceDisplay({ snapshot }: PriceDisplayProps) {
    const cexSpread = snapshot.cexAsk - snapshot.cexBid;
    const cexSpreadBps = (cexSpread / snapshot.cexBid) * 10000;

    const crossSpreadCexToDex = ((snapshot.dexSellPrice - snapshot.cexAsk) / snapshot.cexAsk) * 10000;
    const crossSpreadDexToCex = ((snapshot.cexBid - snapshot.dexBuyPrice) / snapshot.dexBuyPrice) * 10000;
    const bestSpread = Math.max(crossSpreadCexToDex, crossSpreadDexToCex);
    const isProfitable = bestSpread > 0;

    const ageMs = Date.now() - snapshot.timestamp;
    const freshnessColor = ageMs < 500 ? colors.green : ageMs < 1000 ? colors.yellow : colors.red;

    return (
        <div style={{ ...cardStyle, marginBottom: spacing.md }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                <span style={{ fontSize: fontSize.lg, fontWeight: 700, color: colors.text }}>
                    {snapshot.symbol}
                </span>
                <span style={{ fontSize: fontSize.xs, color: freshnessColor }}>
                    {ageMs < 1000 ? `${ageMs}ms` : `${(ageMs / 1000).toFixed(1)}s`} ago
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
                {/* CEX */}
                <div>
                    <div style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.xs }}>
                        BINANCE (CEX)
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: colors.green, fontSize: fontSize.md }}>
                            Bid: {snapshot.cexBid.toFixed(2)}
                        </span>
                        <span style={{ color: colors.red, fontSize: fontSize.md }}>
                            Ask: {snapshot.cexAsk.toFixed(2)}
                        </span>
                    </div>
                    <div style={{ fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs }}>
                        Spread: {cexSpreadBps.toFixed(1)} bps
                    </div>
                </div>

                {/* DEX */}
                <div>
                    <div style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.xs }}>
                        UNISWAP (DEX)
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: colors.green, fontSize: fontSize.md }}>
                            Buy: {snapshot.dexBuyPrice.toFixed(2)}
                        </span>
                        <span style={{ color: colors.red, fontSize: fontSize.md }}>
                            Sell: {snapshot.dexSellPrice.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Cross-venue spread */}
            <div style={{
                marginTop: spacing.md,
                padding: spacing.sm,
                borderRadius: '6px',
                background: isProfitable ? colors.greenBg : colors.redBg,
                textAlign: 'center',
            }}>
                <span style={{
                    color: isProfitable ? colors.green : colors.red,
                    fontSize: fontSize.md,
                    fontWeight: 700,
                }}>
                    Cross-Spread: {bestSpread.toFixed(1)} bps
                    {isProfitable ? ' (Profitable)' : ' (No arb)'}
                </span>
            </div>
        </div>
    );
}
