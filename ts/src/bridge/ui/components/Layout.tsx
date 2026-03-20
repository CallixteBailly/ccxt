// ---------------------------------------------------------------------------
// Layout -- app shell with sidebar navigation and header
// ---------------------------------------------------------------------------

import React from 'react';
import type { ReactNode } from 'react';
import { colors, fontSize, spacing, fontFamily } from '../styles.js';
import { StatusBadge } from './StatusBadge.js';

export type Page = 'dashboard' | 'monitor' | 'balances' | 'settings';

interface LayoutProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
    isConnected: boolean;
    isBridgeReady: boolean;
    children: ReactNode;
}

const navItems: Array<{ page: Page; label: string }> = [
    { page: 'dashboard', label: 'Dashboard' },
    { page: 'monitor', label: 'Monitor' },
    { page: 'balances', label: 'Balances' },
    { page: 'settings', label: 'Settings' },
];

export function Layout({ currentPage, onNavigate, isConnected, isBridgeReady, children }: LayoutProps) {
    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            background: colors.bg,
            color: colors.text,
            fontFamily,
        }}>
            {/* Sidebar */}
            <nav style={{
                width: '200px',
                background: colors.bgCard,
                borderRight: `1px solid ${colors.border}`,
                padding: spacing.lg,
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* Logo */}
                <div style={{
                    fontSize: fontSize.xl,
                    fontWeight: 700,
                    color: colors.blue,
                    marginBottom: spacing.xxl,
                    letterSpacing: '-0.5px',
                }}>
                    CEX-DEX
                    <span style={{ fontSize: fontSize.xs, color: colors.textSecondary, display: 'block' }}>
                        Arbitrage Bridge
                    </span>
                </div>

                {/* Nav items */}
                {navItems.map(({ page, label }) => (
                    <button
                        key={page}
                        onClick={() => onNavigate(page)}
                        style={{
                            display: 'block',
                            width: '100%',
                            padding: `${spacing.sm} ${spacing.md}`,
                            marginBottom: spacing.xs,
                            borderRadius: '6px',
                            border: 'none',
                            background: currentPage === page ? colors.blueBg : 'transparent',
                            color: currentPage === page ? colors.blue : colors.textSecondary,
                            fontFamily,
                            fontSize: fontSize.sm,
                            fontWeight: currentPage === page ? 600 : 400,
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                        }}
                    >
                        {label}
                    </button>
                ))}

                {/* Status at bottom */}
                <div style={{ marginTop: 'auto' }}>
                    <div style={{ marginBottom: spacing.sm }}>
                        <StatusBadge
                            status={isConnected ? 'active' : 'inactive'}
                            label={isConnected ? 'Wallet' : 'No wallet'}
                        />
                    </div>
                    <div>
                        <StatusBadge
                            status={isBridgeReady ? 'active' : 'inactive'}
                            label={isBridgeReady ? 'Bridge OK' : 'Bridge off'}
                        />
                    </div>
                </div>
            </nav>

            {/* Main content */}
            <main style={{
                flex: 1,
                padding: spacing.xl,
                overflowY: 'auto',
            }}>
                {children}
            </main>
        </div>
    );
}
