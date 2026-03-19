// ---------------------------------------------------------------------------
// React hooks for CEX-DEX Bridge (requires wagmi as peer dependency)
// ---------------------------------------------------------------------------

// NOTE: These hooks require wagmi and React as peer dependencies.
// They use wagmi's usePublicClient/useWalletClient internally.
// Import from 'ccxt/bridge/wagmi' only in React applications.

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import type {
    BridgeConfig,
    ArbitrageOpportunity,
    ArbitrageExecution,
    TransferParams,
    TransferResult,
    TransferStatus,
} from '../types.js';
import { CexDexBridge } from '../CexDexBridge.js';

/**
 * Monitor arbitrage opportunities in real-time
 */
export function useArbitrageMonitor(config: BridgeConfig) {
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const bridgeRef = useRef<CexDexBridge | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const start = useCallback(async () => {
        if (!publicClient || !walletClient || isMonitoring) return;

        const bridge = CexDexBridge.withClients(config, publicClient, walletClient);
        bridgeRef.current = bridge;
        await bridge.initialize();
        setIsMonitoring(true);

        abortRef.current = new AbortController();

        // Collect opportunities
        (async () => {
            try {
                for await (const opp of bridge.watchOpportunities()) {
                    if (abortRef.current?.signal.aborted) break;
                    setOpportunities((prev) => {
                        // Keep last 50 opportunities, newest first
                        const updated = [opp, ...prev];
                        return updated.slice(0, 50);
                    });
                }
            } catch {
                // Stream ended
            }
        })();
    }, [publicClient, walletClient, config, isMonitoring]);

    const stop = useCallback(async () => {
        abortRef.current?.abort();
        if (bridgeRef.current) {
            await bridgeRef.current.shutdown();
            bridgeRef.current = null;
        }
        setIsMonitoring(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stop();
        };
    }, [stop]);

    return { opportunities, isMonitoring, start, stop };
}

/**
 * Execute an arbitrage opportunity
 */
export function useArbitrageExecution(config: BridgeConfig) {
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const [status, setStatus] = useState<ArbitrageExecution | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);

    const execute = useCallback(async (opp: ArbitrageOpportunity): Promise<ArbitrageExecution> => {
        if (!publicClient || !walletClient) {
            throw new Error('Wallet not connected');
        }

        setIsExecuting(true);
        const bridge = CexDexBridge.withClients(config, publicClient, walletClient);
        await bridge.initialize();

        try {
            const result = await bridge.executeArbitrage(opp);
            setStatus(result);
            return result;
        } finally {
            setIsExecuting(false);
            await bridge.shutdown();
        }
    }, [publicClient, walletClient, config]);

    return { execute, status, isExecuting };
}

/**
 * Get balances from both CEX and DEX
 */
export function useBridgeBalances(config: BridgeConfig) {
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const [cexBalances, setCexBalances] = useState<Record<string, number> | null>(null);
    const [dexBalances, setDexBalances] = useState<Record<string, number> | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const refetch = useCallback(async () => {
        if (!publicClient || !walletClient) return;

        setIsLoading(true);
        const bridge = CexDexBridge.withClients(config, publicClient, walletClient);
        await bridge.initialize();

        try {
            const balances = await bridge.getBalances();
            setCexBalances(balances.cex);
            setDexBalances(balances.dex);
        } finally {
            setIsLoading(false);
            await bridge.shutdown();
        }
    }, [publicClient, walletClient, config]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { cexBalances, dexBalances, isLoading, refetch };
}

/**
 * Transfer funds between CEX and DEX
 */
export function useBridgeTransfer(config: BridgeConfig) {
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const [status, setStatus] = useState<TransferStatus>('idle');
    const [lastResult, setLastResult] = useState<TransferResult | null>(null);

    const transfer = useCallback(async (
        direction: 'to-dex' | 'to-cex',
        params: TransferParams,
    ): Promise<TransferResult> => {
        if (!publicClient || !walletClient) {
            throw new Error('Wallet not connected');
        }

        setStatus('pending');
        const bridge = CexDexBridge.withClients(config, publicClient, walletClient);
        await bridge.initialize();

        try {
            const result = direction === 'to-dex'
                ? await bridge.transferToDex(params.currency, params.amount, params.chain)
                : await bridge.transferToCex(params.currency, params.amount, params.chain);

            setLastResult(result);
            setStatus(result.status);
            return result;
        } catch (err: any) {
            setStatus('failed');
            throw err;
        } finally {
            await bridge.shutdown();
        }
    }, [publicClient, walletClient, config]);

    const transferToDex = useCallback(
        (params: TransferParams) => transfer('to-dex', params),
        [transfer],
    );

    const transferToCex = useCallback(
        (params: TransferParams) => transfer('to-cex', params),
        [transfer],
    );

    return { transferToDex, transferToCex, status, lastResult };
}
