// ---------------------------------------------------------------------------
// ConfigPanel -- monitoring & execution settings
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import type { BridgeConfig } from '../../types.js';
import { ChainSelector } from './ChainSelector.js';
import { colors, fontSize, spacing, cardStyle, inputStyle, labelStyle, buttonPrimary } from '../styles.js';

interface ConfigPanelProps {
    config: BridgeConfig;
    onSave: (updates: Partial<BridgeConfig>) => void;
}

export function ConfigPanel({ config, onSave }: ConfigPanelProps) {
    const [pollInterval, setPollInterval] = useState(config.monitoring.pollIntervalMs ?? 1000);
    const [minSpread, setMinSpread] = useState(config.monitoring.minSpreadBps ?? 30);
    const [minProfit, setMinProfit] = useState(config.monitoring.minProfitUsd ?? 5);
    const [staleness, setStaleness] = useState(config.monitoring.stalenessMs ?? 2000);
    const [maxSlippage, setMaxSlippage] = useState(config.execution.maxSlippageBps ?? 50);
    const [maxPosition, setMaxPosition] = useState(config.execution.maxPositionUsd ?? 10000);
    const [maxGas, setMaxGas] = useState(config.execution.maxGasGwei ?? 100);
    const [dryRun, setDryRun] = useState(config.execution.dryRun ?? false);
    const [legTimeout, setLegTimeout] = useState(config.execution.legTimeoutMs ?? 30000);
    const [defaultChain, setDefaultChain] = useState(config.defaultChainId);

    const handleSave = () => {
        onSave({
            defaultChainId: defaultChain,
            monitoring: {
                ...config.monitoring,
                pollIntervalMs: pollInterval,
                minSpreadBps: minSpread,
                minProfitUsd: minProfit,
                stalenessMs: staleness,
            },
            execution: {
                ...config.execution,
                maxSlippageBps: maxSlippage,
                maxPositionUsd: maxPosition,
                maxGasGwei: maxGas,
                dryRun,
                legTimeoutMs: legTimeout,
            },
        });
    };

    const sectionTitle: React.CSSProperties = {
        fontSize: fontSize.md,
        fontWeight: 600,
        color: colors.text,
        marginBottom: spacing.md,
        marginTop: spacing.lg,
    };

    return (
        <div style={cardStyle}>
            <h2 style={{ margin: 0, fontSize: fontSize.lg, color: colors.text, marginBottom: spacing.sm }}>
                Settings
            </h2>

            {/* Monitoring */}
            <div style={sectionTitle}>Monitoring</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
                <FieldInput label="Poll Interval (ms)" value={pollInterval} onChange={setPollInterval} />
                <FieldInput label="Min Spread (bps)" value={minSpread} onChange={setMinSpread} />
                <FieldInput label="Min Profit ($)" value={minProfit} onChange={setMinProfit} />
                <FieldInput label="Staleness (ms)" value={staleness} onChange={setStaleness} />
            </div>

            {/* Execution */}
            <div style={sectionTitle}>Execution</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
                <FieldInput label="Max Slippage (bps)" value={maxSlippage} onChange={setMaxSlippage} />
                <FieldInput label="Max Position ($)" value={maxPosition} onChange={setMaxPosition} />
                <FieldInput label="Max Gas (gwei)" value={maxGas} onChange={setMaxGas} />
                <FieldInput label="Leg Timeout (ms)" value={legTimeout} onChange={setLegTimeout} />
            </div>

            {/* Dry run toggle */}
            <div style={{ marginTop: spacing.lg, display: 'flex', alignItems: 'center', gap: spacing.md }}>
                <label style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                    <input
                        type="checkbox"
                        checked={dryRun}
                        onChange={(e) => setDryRun(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: fontSize.sm, color: colors.text, textTransform: 'none' }}>
                        Dry Run Mode (simulate without executing)
                    </span>
                </label>
            </div>

            {/* Chain */}
            <div style={{ marginTop: spacing.lg }}>
                <ChainSelector
                    chains={config.chains}
                    selected={defaultChain}
                    onChange={setDefaultChain}
                    label="Default Chain"
                />
            </div>

            {/* Save */}
            <button style={{ ...buttonPrimary, width: '100%', marginTop: spacing.lg }} onClick={handleSave}>
                Save Settings
            </button>
        </div>
    );
}

function FieldInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <div>
            <label style={labelStyle}>{label}</label>
            <input
                style={inputStyle}
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
            />
        </div>
    );
}
