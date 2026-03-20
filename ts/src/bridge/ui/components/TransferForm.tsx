// ---------------------------------------------------------------------------
// TransferForm -- transfer funds between CEX and DEX
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import type { BridgeConfig } from '../../types.js';
import { useBridgeTransfer } from '../../wagmi/hooks.js';
import { ChainSelector } from './ChainSelector.js';
import { StatusBadge } from './StatusBadge.js';
import { colors, fontSize, spacing, cardStyle, inputStyle, buttonPrimary, buttonSecondary, labelStyle } from '../styles.js';

interface TransferFormProps {
    config: BridgeConfig;
}

export function TransferForm({ config }: TransferFormProps) {
    const { transferToDex, transferToCex, status, lastResult } = useBridgeTransfer(config);
    const [direction, setDirection] = useState<'to-dex' | 'to-cex'>('to-dex');
    const [currency, setCurrency] = useState('USDT');
    const [amount, setAmount] = useState('');
    const [chainId, setChainId] = useState(config.defaultChainId);

    const chain = config.chains.find((c) => c.chainId === chainId) ?? config.chains[0];
    const isTransferring = status === 'pending' || status === 'confirming';

    const handleTransfer = async () => {
        if (!amount || Number(amount) <= 0) return;
        const params = { currency, amount: Number(amount), chain };
        if (direction === 'to-dex') {
            await transferToDex(params);
        } else {
            await transferToCex(params);
        }
    };

    return (
        <div style={cardStyle}>
            <h2 style={{ margin: 0, fontSize: fontSize.lg, color: colors.text, marginBottom: spacing.lg }}>
                Transfer Funds
            </h2>

            {/* Direction toggle */}
            <div style={{ display: 'flex', gap: '2px', marginBottom: spacing.lg, borderRadius: '6px', overflow: 'hidden' }}>
                <button
                    style={{
                        ...buttonSecondary,
                        flex: 1,
                        borderRadius: 0,
                        background: direction === 'to-dex' ? colors.blue : colors.bgHover,
                        color: direction === 'to-dex' ? '#fff' : colors.text,
                        border: 'none',
                    }}
                    onClick={() => setDirection('to-dex')}
                >
                    Binance -> Wallet
                </button>
                <button
                    style={{
                        ...buttonSecondary,
                        flex: 1,
                        borderRadius: 0,
                        background: direction === 'to-cex' ? colors.blue : colors.bgHover,
                        color: direction === 'to-cex' ? '#fff' : colors.text,
                        border: 'none',
                    }}
                    onClick={() => setDirection('to-cex')}
                >
                    Wallet -> Binance
                </button>
            </div>

            {/* Currency */}
            <div style={{ marginBottom: spacing.md }}>
                <label style={labelStyle}>Currency</label>
                <select
                    style={inputStyle}
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                >
                    {['USDT', 'USDC', 'ETH', 'WBTC', 'DAI'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            {/* Amount */}
            <div style={{ marginBottom: spacing.md }}>
                <label style={labelStyle}>Amount</label>
                <input
                    style={inputStyle}
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="any"
                />
            </div>

            {/* Chain */}
            <ChainSelector
                chains={config.chains}
                selected={chainId}
                onChange={setChainId}
                label="Network"
            />

            {/* Submit */}
            <button
                style={{
                    ...buttonPrimary,
                    width: '100%',
                    marginTop: spacing.sm,
                    opacity: isTransferring ? 0.6 : 1,
                }}
                onClick={handleTransfer}
                disabled={isTransferring || !amount}
            >
                {isTransferring ? 'Transferring...' : `Transfer ${currency}`}
            </button>

            {/* Result */}
            {lastResult && (
                <div style={{ marginTop: spacing.lg, padding: spacing.md, background: colors.bg, borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
                            {lastResult.amount} {lastResult.currency}
                        </span>
                        <StatusBadge status={lastResult.status} />
                    </div>
                    {lastResult.txHash && (
                        <div style={{ fontSize: fontSize.xs, color: colors.blue, marginTop: spacing.xs }}>
                            Tx: {lastResult.txHash.slice(0, 14)}...{lastResult.txHash.slice(-8)}
                        </div>
                    )}
                    {lastResult.error && (
                        <div style={{ fontSize: fontSize.xs, color: colors.red, marginTop: spacing.xs }}>
                            {lastResult.error}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
