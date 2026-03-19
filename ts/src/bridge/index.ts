// ---------------------------------------------------------------------------
// CEX-DEX Bridge -- Public API
// ---------------------------------------------------------------------------

// Main orchestrator
export { CexDexBridge } from './CexDexBridge.js';

// Types
export type {
    ChainConfig,
    TokenInfo,
    PriceSnapshot,
    DexQuote,
    ArbitrageOpportunity,
    ArbitrageExecution,
    ExecutionLeg,
    ExecutionStatus,
    LegStatus,
    TransferParams,
    TransferResult,
    TransferDirection,
    TransferStatus,
    BridgeConfig,
    BridgeEvent,
    BridgeEventMap,
    ICexAdapter,
    IDexAdapter,
} from './types.js';

// Adapters
export { BinanceCexAdapter } from './adapters/BinanceCexAdapter.js';
export { UniswapDexAdapter } from './adapters/UniswapDexAdapter.js';
export { BaseCexAdapter } from './adapters/BaseCexAdapter.js';
export { BaseDexAdapter } from './adapters/BaseDexAdapter.js';

// Pricing
export { PriceMonitor } from './pricing/PriceMonitor.js';
export { ArbitrageDetector } from './pricing/ArbitrageDetector.js';

// Execution
export { ArbitrageExecutor } from './execution/ArbitrageExecutor.js';
export { TransferManager } from './execution/TransferManager.js';
export { GasEstimator } from './execution/GasEstimator.js';

// Safety
export { RiskManager } from './safety/RiskManager.js';
export { NonceManager } from './safety/NonceManager.js';

// Constants
export { TOKENS, POOL_FEES, resolveTokenPair } from './constants/tokens.js';
export { CHAIN_CONFIGS, UNISWAP_ADDRESSES, WETH_ADDRESSES, BINANCE_NETWORK_MAP } from './constants/addresses.js';
export { SwapRouterABI, QuoterV2ABI, UniswapV3PoolABI, ERC20ABI } from './constants/abis.js';

// viem-compatible actions (non-React)
export { createDexAdapter, quoteDexPrice, executeDexSwap, createBridgeWithClients } from './wagmi/actions.js';
