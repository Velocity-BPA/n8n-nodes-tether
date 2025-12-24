/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Network configurations for all supported blockchain networks
 * 
 * @author Velocity BPA
 * @website https://velobpa.com
 */

export interface NetworkConfig {
  name: string;
  chainId?: number;
  rpcUrl: string;
  explorerUrl: string;
  explorerApiUrl?: string;
  nativeCurrency: string;
  type: 'evm' | 'tron' | 'solana' | 'algorand' | 'ton' | 'omni' | 'cosmos' | 'eos' | 'near' | 'liquid';
  usdtDecimals: number;
  usdtContract: string;
  isTestnet?: boolean;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  // EVM Networks
  ethereum: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    explorerApiUrl: 'https://api.etherscan.io/api',
    nativeCurrency: 'ETH',
    type: 'evm',
    usdtDecimals: 6,
    usdtContract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  },
  polygon: {
    name: 'Polygon Mainnet',
    chainId: 137,
    rpcUrl: 'https://polygon.llamarpc.com',
    explorerUrl: 'https://polygonscan.com',
    explorerApiUrl: 'https://api.polygonscan.com/api',
    nativeCurrency: 'MATIC',
    type: 'evm',
    usdtDecimals: 6,
    usdtContract: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  },
  arbitrum: {
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    explorerApiUrl: 'https://api.arbiscan.io/api',
    nativeCurrency: 'ETH',
    type: 'evm',
    usdtDecimals: 6,
    usdtContract: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  },
  optimism: {
    name: 'Optimism',
    chainId: 10,
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    explorerApiUrl: 'https://api-optimistic.etherscan.io/api',
    nativeCurrency: 'ETH',
    type: 'evm',
    usdtDecimals: 6,
    usdtContract: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
  },
  bnbChain: {
    name: 'BNB Smart Chain',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    explorerApiUrl: 'https://api.bscscan.com/api',
    nativeCurrency: 'BNB',
    type: 'evm',
    usdtDecimals: 18,
    usdtContract: '0x55d398326f99059fF775485246999027B3197955',
  },
  avalanche: {
    name: 'Avalanche C-Chain',
    chainId: 43114,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    explorerApiUrl: 'https://api.snowtrace.io/api',
    nativeCurrency: 'AVAX',
    type: 'evm',
    usdtDecimals: 6,
    usdtContract: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
  },
  fantom: {
    name: 'Fantom Opera',
    chainId: 250,
    rpcUrl: 'https://rpc.ftm.tools',
    explorerUrl: 'https://ftmscan.com',
    explorerApiUrl: 'https://api.ftmscan.com/api',
    nativeCurrency: 'FTM',
    type: 'evm',
    usdtDecimals: 6,
    usdtContract: '0x049d68029688eAbF473097a2fC38ef61633A3C7A',
  },
  celo: {
    name: 'Celo',
    chainId: 42220,
    rpcUrl: 'https://forno.celo.org',
    explorerUrl: 'https://celoscan.io',
    nativeCurrency: 'CELO',
    type: 'evm',
    usdtDecimals: 6,
    usdtContract: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
  },

  // Non-EVM Networks
  tron: {
    name: 'Tron',
    rpcUrl: 'https://api.trongrid.io',
    explorerUrl: 'https://tronscan.org',
    nativeCurrency: 'TRX',
    type: 'tron',
    usdtDecimals: 6,
    usdtContract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  },
  solana: {
    name: 'Solana',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://solscan.io',
    nativeCurrency: 'SOL',
    type: 'solana',
    usdtDecimals: 6,
    usdtContract: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  },
  algorand: {
    name: 'Algorand',
    rpcUrl: 'https://mainnet-api.algonode.cloud',
    explorerUrl: 'https://algoexplorer.io',
    nativeCurrency: 'ALGO',
    type: 'algorand',
    usdtDecimals: 6,
    usdtContract: '312769', // Asset ID
  },
  ton: {
    name: 'TON',
    rpcUrl: 'https://toncenter.com/api/v2/jsonRPC',
    explorerUrl: 'https://tonscan.org',
    nativeCurrency: 'TON',
    type: 'ton',
    usdtDecimals: 6,
    usdtContract: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
  },
  omni: {
    name: 'Omni Layer (Bitcoin)',
    rpcUrl: 'https://api.omniexplorer.info',
    explorerUrl: 'https://omniexplorer.info',
    nativeCurrency: 'BTC',
    type: 'omni',
    usdtDecimals: 8,
    usdtContract: '31', // Property ID
  },
  near: {
    name: 'NEAR Protocol',
    rpcUrl: 'https://rpc.mainnet.near.org',
    explorerUrl: 'https://nearblocks.io',
    nativeCurrency: 'NEAR',
    type: 'near',
    usdtDecimals: 6,
    usdtContract: 'usdt.tether-token.near',
  },
  kava: {
    name: 'Kava (Cosmos)',
    rpcUrl: 'https://evm.kava.io',
    explorerUrl: 'https://kavascan.com',
    nativeCurrency: 'KAVA',
    type: 'evm',
    chainId: 2222,
    usdtDecimals: 6,
    usdtContract: '0x919C1c267BC06a7039e03fcc2eF738525769109c',
  },
  eos: {
    name: 'EOS',
    rpcUrl: 'https://eos.greymass.com',
    explorerUrl: 'https://bloks.io',
    nativeCurrency: 'EOS',
    type: 'eos',
    usdtDecimals: 4,
    usdtContract: 'tethertether',
  },
  liquid: {
    name: 'Liquid Network',
    rpcUrl: 'https://blockstream.info/liquid/api',
    explorerUrl: 'https://blockstream.info/liquid',
    nativeCurrency: 'L-BTC',
    type: 'liquid',
    usdtDecimals: 8,
    usdtContract: 'ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2',
  },

  // Testnets
  sepolia: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: 'ETH',
    type: 'evm',
    usdtDecimals: 6,
    usdtContract: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
    isTestnet: true,
  },
  tronShasta: {
    name: 'Tron Shasta Testnet',
    rpcUrl: 'https://api.shasta.trongrid.io',
    explorerUrl: 'https://shasta.tronscan.org',
    nativeCurrency: 'TRX',
    type: 'tron',
    usdtDecimals: 6,
    usdtContract: 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs',
    isTestnet: true,
  },
  solanaDevnet: {
    name: 'Solana Devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    explorerUrl: 'https://solscan.io?cluster=devnet',
    nativeCurrency: 'SOL',
    type: 'solana',
    usdtDecimals: 6,
    usdtContract: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    isTestnet: true,
  },
};

export const EVM_NETWORKS = Object.entries(NETWORKS)
  .filter(([, config]) => config.type === 'evm')
  .map(([key]) => key);

export const MAINNET_NETWORKS = Object.entries(NETWORKS)
  .filter(([, config]) => !config.isTestnet)
  .map(([key]) => key);

export const TESTNET_NETWORKS = Object.entries(NETWORKS)
  .filter(([, config]) => config.isTestnet)
  .map(([key]) => key);

export const NETWORK_OPTIONS = Object.entries(NETWORKS).map(([key, config]) => ({
  name: config.name,
  value: key,
}));
