// ---------------------------------------------------------------------------
// Common token addresses per chain
// ---------------------------------------------------------------------------

import type { TokenInfo } from '../types.js';

type TokenMap = Record<string, TokenInfo>;

// Ethereum Mainnet
const ETHEREUM_TOKENS: TokenMap = {
    WETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 },
    USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', decimals: 6 },
    USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
    WBTC: { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', decimals: 8 },
    DAI:  { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', decimals: 18 },
};

// Arbitrum One
const ARBITRUM_TOKENS: TokenMap = {
    WETH: { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH', decimals: 18 },
    USDT: { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', decimals: 6 },
    USDC: { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', decimals: 6 },
    WBTC: { address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', symbol: 'WBTC', decimals: 8 },
    ARB:  { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', symbol: 'ARB', decimals: 18 },
};

// Optimism
const OPTIMISM_TOKENS: TokenMap = {
    WETH: { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 },
    USDT: { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', symbol: 'USDT', decimals: 6 },
    USDC: { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', symbol: 'USDC', decimals: 6 },
    WBTC: { address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095', symbol: 'WBTC', decimals: 8 },
    OP:   { address: '0x4200000000000000000000000000000000000042', symbol: 'OP', decimals: 18 },
};

// Base
const BASE_TOKENS: TokenMap = {
    WETH: { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 },
    USDC: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', decimals: 6 },
    DAI:  { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', symbol: 'DAI', decimals: 18 },
};

// Polygon
const POLYGON_TOKENS: TokenMap = {
    WMATIC: { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', symbol: 'WMATIC', decimals: 18 },
    WETH:   { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', symbol: 'WETH', decimals: 18 },
    USDT:   { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', decimals: 6 },
    USDC:   { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', symbol: 'USDC', decimals: 6 },
    WBTC:   { address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', symbol: 'WBTC', decimals: 8 },
};

export const TOKENS: Record<number, TokenMap> = {
    1: ETHEREUM_TOKENS,
    42161: ARBITRUM_TOKENS,
    10: OPTIMISM_TOKENS,
    8453: BASE_TOKENS,
    137: POLYGON_TOKENS,
};

// Uniswap V3 pool fee tiers (in hundredths of a bip)
export const POOL_FEES = {
    LOWEST: 100,    // 0.01%
    LOW: 500,       // 0.05%
    MEDIUM: 3000,   // 0.30%
    HIGH: 10000,    // 1.00%
} as const;

export type PoolFee = typeof POOL_FEES[keyof typeof POOL_FEES];

// Helper: resolve a CCXT unified symbol to token pair for a given chain
export function resolveTokenPair(
    symbol: string,
    chainId: number,
): { base: TokenInfo; quote: TokenInfo } | undefined {
    const chainTokens = TOKENS[chainId];
    if (!chainTokens) return undefined;
    const [baseSymbol, quoteSymbol] = symbol.split('/');
    // Map ETH -> WETH for on-chain
    const baseKey = baseSymbol === 'ETH' ? 'WETH' : baseSymbol;
    const quoteKey = quoteSymbol === 'ETH' ? 'WETH' : quoteSymbol;
    const base = chainTokens[baseKey];
    const quote = chainTokens[quoteKey];
    if (!base || !quote) return undefined;
    return { base, quote };
}
