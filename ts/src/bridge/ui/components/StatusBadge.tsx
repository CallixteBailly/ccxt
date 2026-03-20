// ---------------------------------------------------------------------------
// StatusBadge -- colored status indicator
// ---------------------------------------------------------------------------

import React from 'react';
import { colors, fontSize, spacing } from '../styles.js';
import type { ExecutionStatus, LegStatus, TransferStatus } from '../../types.js';

type BadgeStatus = ExecutionStatus | LegStatus | TransferStatus | 'active' | 'inactive';

interface StatusBadgeProps {
    status: BadgeStatus;
    label?: string;
    pulse?: boolean;
}

const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: colors.yellowBg, text: colors.yellow },
    confirming: { bg: colors.yellowBg, text: colors.yellow },
    partial: { bg: colors.yellowBg, text: colors.yellow },
    filled: { bg: colors.greenBg, text: colors.green },
    completed: { bg: colors.greenBg, text: colors.green },
    active: { bg: colors.greenBg, text: colors.green },
    failed: { bg: colors.redBg, text: colors.red },
    cancelled: { bg: 'rgba(72, 79, 88, 0.3)', text: colors.gray },
    idle: { bg: 'rgba(72, 79, 88, 0.3)', text: colors.gray },
    inactive: { bg: 'rgba(72, 79, 88, 0.3)', text: colors.gray },
};

export function StatusBadge({ status, label, pulse }: StatusBadgeProps) {
    const color = statusColors[status] ?? statusColors.idle;
    const shouldPulse = pulse ?? (status === 'pending' || status === 'confirming');

    const style: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.xs,
        padding: `2px ${spacing.sm}`,
        borderRadius: '12px',
        background: color.bg,
        color: color.text,
        fontSize: fontSize.xs,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    };

    const dotStyle: React.CSSProperties = {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: color.text,
        animation: shouldPulse ? 'pulse 1.5s ease-in-out infinite' : 'none',
    };

    return (
        <span style={style}>
            <span style={dotStyle} />
            {label ?? status}
        </span>
    );
}
