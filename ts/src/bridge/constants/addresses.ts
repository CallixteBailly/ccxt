// ---------------------------------------------------------------------------
// Uniswap V3 contract addresses per chain
// ---------------------------------------------------------------------------

import type { ChainConfig } from '../types.js';

// Uniswap V3 deployments (Universal Router / SwapRouter02 + QuoterV2)
export const UNISWAP_ADDRESSES: Record<number, { router: `0x${string}`; quoter: `0x${string}` }> = {
    // Ethereum Mainnet
    1: {
        router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
    },
    // Arbitrum One
    42161: {
        router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
    },
    // Optimism
    10: {
        router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
    },
    // Base
    8453: {
        router: '0x2626664c2603336E57B271c5C0b26F421741e481',
        quoter: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
    },
    // Polygon
    137: {
        router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
    },
};

// WETH (or equivalent wrapped native token) per chain
export const WETH_ADDRESSES: Record<number, `0x${string}`> = {
    1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',       // WETH
    42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',     // WETH (Arbitrum)
    10: '0x4200000000000000000000000000000000000006',         // WETH (Optimism)
    8453: '0x4200000000000000000000000000000000000006',       // WETH (Base)
    137: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',      // WMATIC (Polygon)
};

// Binance network name mapping
export const BINANCE_NETWORK_MAP: Record<number, string> = {
    1: 'ETH',
    42161: 'ARBITRUM',
    10: 'OPTIMISM',
    8453: 'BASE',
    137: 'MATIC',
};

// Pre-built chain configs
export const CHAIN_CONFIGS: Record<number, Omit<ChainConfig, 'rpcUrl'>> = {
    1: {
        chainId: 1,
        name: 'ethereum',
        binanceNetwork: 'ETH',
        uniswapRouter: UNISWAP_ADDRESSES[1].router,
        uniswapQuoter: UNISWAP_ADDRESSES[1].quoter,
        wethAddress: WETH_ADDRESSES[1],
        blockTimeMs: 12000,
    },
    42161: {
        chainId: 42161,
        name: 'arbitrum',
        binanceNetwork: 'ARBITRUM',
        uniswapRouter: UNISWAP_ADDRESSES[42161].router,
        uniswapQuoter: UNISWAP_ADDRESSES[42161].quoter,
        wethAddress: WETH_ADDRESSES[42161],
        blockTimeMs: 250,
    },
    10: {
        chainId: 10,
        name: 'optimism',
        binanceNetwork: 'OPTIMISM',
        uniswapRouter: UNISWAP_ADDRESSES[10].router,
        uniswapQuoter: UNISWAP_ADDRESSES[10].quoter,
        wethAddress: WETH_ADDRESSES[10],
        blockTimeMs: 2000,
    },
    8453: {
        chainId: 8453,
        name: 'base',
        binanceNetwork: 'BASE',
        uniswapRouter: UNISWAP_ADDRESSES[8453].router,
        uniswapQuoter: UNISWAP_ADDRESSES[8453].quoter,
        wethAddress: WETH_ADDRESSES[8453],
        blockTimeMs: 2000,
    },
    137: {
        chainId: 137,
        name: 'polygon',
        binanceNetwork: 'MATIC',
        uniswapRouter: UNISWAP_ADDRESSES[137].router,
        uniswapQuoter: UNISWAP_ADDRESSES[137].quoter,
        wethAddress: WETH_ADDRESSES[137],
        blockTimeMs: 2000,
    },
};
