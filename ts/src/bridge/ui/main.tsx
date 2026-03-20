// ---------------------------------------------------------------------------
// main.tsx -- React entry point with wagmi configuration
// ---------------------------------------------------------------------------

import React from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiConfig, createConfig, http } from 'wagmi';
import { mainnet, arbitrum, optimism, base, polygon } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { CexDexBridgeProvider } from '../wagmi/provider.js';
import type { BridgeConfig } from '../types.js';
import { CHAIN_CONFIGS } from '../constants/addresses.js';
import { App } from './App.js';

// Wagmi config -- supports MetaMask and other injected wallets
const wagmiConfig = createConfig({
    chains: [mainnet, arbitrum, optimism, base, polygon],
    connectors: [injected()],
    transports: {
        [mainnet.id]: http(),
        [arbitrum.id]: http(),
        [optimism.id]: http(),
        [base.id]: http(),
        [polygon.id]: http(),
    },
});

// Default bridge config -- override via UI settings
const defaultBridgeConfig: BridgeConfig = {
    binance: {
        apiKey: '',
        secret: '',
        sandbox: true,
    },
    wallet: {},
    chains: [
        { ...CHAIN_CONFIGS[42161], rpcUrl: 'https://arb1.arbitrum.io/rpc' },
        { ...CHAIN_CONFIGS[8453], rpcUrl: 'https://mainnet.base.org' },
        { ...CHAIN_CONFIGS[10], rpcUrl: 'https://mainnet.optimism.io' },
        { ...CHAIN_CONFIGS[137], rpcUrl: 'https://polygon-rpc.com' },
        { ...CHAIN_CONFIGS[1], rpcUrl: 'https://eth.llamarpc.com' },
    ],
    defaultChainId: 42161,
    monitoring: {
        symbols: ['ETH/USDT', 'WBTC/USDT'],
        pollIntervalMs: 1000,
        minSpreadBps: 30,
        minProfitUsd: 5,
        stalenessMs: 2000,
    },
    execution: {
        maxSlippageBps: 50,
        maxPositionUsd: 10000,
        maxGasGwei: 100,
        dryRun: true,
        legTimeoutMs: 30000,
    },
};

function Root() {
    const [config, setConfig] = React.useState(defaultBridgeConfig);

    return (
        <WagmiConfig config={wagmiConfig}>
            <CexDexBridgeProvider config={config}>
                <App config={config} onConfigChange={setConfig} />
            </CexDexBridgeProvider>
        </WagmiConfig>
    );
}

// Mount
const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<Root />);
}
