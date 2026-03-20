// ---------------------------------------------------------------------------
// ChainSelector -- dropdown to pick a blockchain network
// ---------------------------------------------------------------------------

import React from 'react';
import type { ChainConfig } from '../../types.js';
import { selectStyle, labelStyle, spacing } from '../styles.js';

interface ChainSelectorProps {
    chains: ChainConfig[];
    selected: number;
    onChange: (chainId: number) => void;
    label?: string;
}

const chainLabels: Record<number, string> = {
    1: 'Ethereum',
    42161: 'Arbitrum',
    10: 'Optimism',
    8453: 'Base',
    137: 'Polygon',
};

export function ChainSelector({ chains, selected, onChange, label }: ChainSelectorProps) {
    return (
        <div style={{ marginBottom: spacing.md }}>
            {label && <label style={labelStyle}>{label}</label>}
            <select
                style={selectStyle}
                value={selected}
                onChange={(e) => onChange(Number(e.target.value))}
            >
                {chains.map((chain) => (
                    <option key={chain.chainId} value={chain.chainId}>
                        {chainLabels[chain.chainId] ?? chain.name} (ID: {chain.chainId})
                    </option>
                ))}
            </select>
        </div>
    );
}
