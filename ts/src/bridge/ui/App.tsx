// ---------------------------------------------------------------------------
// App -- main application component with page routing
// ---------------------------------------------------------------------------

import React, { useState, useCallback } from 'react';
import type { ArbitrageOpportunity, ArbitrageExecution, BridgeConfig } from '../types.js';
import { useBridge } from '../wagmi/provider.js';
import { useArbitrageMonitor } from '../wagmi/hooks.js';
import { Layout, type Page } from './components/Layout.js';
import { Dashboard } from './components/Dashboard.js';
import { OpportunityList } from './components/OpportunityList.js';
import { ExecutionPanel } from './components/ExecutionPanel.js';
import { BalancePanel } from './components/BalancePanel.js';
import { TransferForm } from './components/TransferForm.js';
import { ConfigPanel } from './components/ConfigPanel.js';
import { TradeHistory } from './components/TradeHistory.js';
import { spacing } from './styles.js';

interface AppProps {
    config: BridgeConfig;
    onConfigChange?: (config: BridgeConfig) => void;
}

export function App({ config, onConfigChange }: AppProps) {
    const { isReady, error } = useBridge();
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [selectedOpp, setSelectedOpp] = useState<ArbitrageOpportunity | null>(null);
    const [executions, setExecutions] = useState<ArbitrageExecution[]>([]);

    const { opportunities, isMonitoring } = useArbitrageMonitor(config);

    const handleExecute = useCallback((opp: ArbitrageOpportunity) => {
        setSelectedOpp(opp);
    }, []);

    const handleCloseExecution = useCallback(() => {
        setSelectedOpp(null);
    }, []);

    const handleConfigSave = useCallback((updates: Partial<BridgeConfig>) => {
        if (onConfigChange) {
            onConfigChange({ ...config, ...updates } as BridgeConfig);
        }
    }, [config, onConfigChange]);

    // Simple wallet connected check (based on bridge readiness)
    const isConnected = isReady;

    return (
        <Layout
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            isConnected={isConnected}
            isBridgeReady={isReady}
        >
            {/* Error banner */}
            {error && (
                <div style={{
                    padding: spacing.md,
                    marginBottom: spacing.lg,
                    borderRadius: '6px',
                    background: 'rgba(248, 81, 73, 0.15)',
                    color: '#f85149',
                    fontSize: '13px',
                }}>
                    Bridge error: {error.message}
                </div>
            )}

            {/* Page content */}
            {currentPage === 'dashboard' && (
                <Dashboard
                    config={config}
                    opportunities={opportunities}
                    executions={executions}
                    isMonitoring={isMonitoring}
                />
            )}

            {currentPage === 'monitor' && (
                <div>
                    <OpportunityList config={config} onExecute={handleExecute} />
                    <div style={{ marginTop: spacing.lg }}>
                        <TradeHistory executions={executions} />
                    </div>
                </div>
            )}

            {currentPage === 'balances' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: spacing.lg }}>
                    <BalancePanel config={config} />
                    <TransferForm config={config} />
                </div>
            )}

            {currentPage === 'settings' && (
                <ConfigPanel config={config} onSave={handleConfigSave} />
            )}

            {/* Execution modal overlay */}
            {selectedOpp && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.6)',
                            zIndex: 999,
                        }}
                        onClick={handleCloseExecution}
                    />
                    <ExecutionPanel
                        config={config}
                        opportunity={selectedOpp}
                        onClose={handleCloseExecution}
                    />
                </>
            )}
        </Layout>
    );
}
