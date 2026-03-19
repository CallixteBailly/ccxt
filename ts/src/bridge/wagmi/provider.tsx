// ---------------------------------------------------------------------------
// CexDexBridgeProvider -- React Context provider for the bridge
// ---------------------------------------------------------------------------

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import type { BridgeConfig, ArbitrageOpportunity, ArbitrageExecution } from '../types.js';
import { CexDexBridge } from '../CexDexBridge.js';

interface BridgeContextValue {
    bridge: CexDexBridge | null;
    isReady: boolean;
    error: Error | null;
}

const BridgeContext = createContext<BridgeContextValue>({
    bridge: null,
    isReady: false,
    error: null,
});

interface BridgeProviderProps {
    config: BridgeConfig;
    children: ReactNode;
    autoConnect?: boolean;
}

export function CexDexBridgeProvider({ config, children, autoConnect = true }: BridgeProviderProps) {
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const bridgeRef = useRef<CexDexBridge | null>(null);

    useEffect(() => {
        if (!autoConnect || !publicClient || !walletClient) return;

        let cancelled = false;

        (async () => {
            try {
                const bridge = CexDexBridge.withClients(config, publicClient, walletClient);
                await bridge.initialize();
                if (cancelled) {
                    await bridge.shutdown();
                    return;
                }
                bridgeRef.current = bridge;
                setIsReady(true);
            } catch (err) {
                if (!cancelled) {
                    setError(err as Error);
                }
            }
        })();

        return () => {
            cancelled = true;
            if (bridgeRef.current) {
                bridgeRef.current.shutdown();
                bridgeRef.current = null;
            }
            setIsReady(false);
        };
    }, [publicClient, walletClient, config, autoConnect]);

    return (
        <BridgeContext.Provider value={{ bridge: bridgeRef.current, isReady, error }}>
            {children}
        </BridgeContext.Provider>
    );
}

/**
 * Access the bridge instance from context
 */
export function useBridge(): BridgeContextValue {
    return useContext(BridgeContext);
}
