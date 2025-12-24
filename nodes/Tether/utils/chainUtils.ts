/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Chain utilities for multi-chain USDT operations
 * 
 * @author Velocity BPA
 * @website https://velobpa.com
 */

import { NETWORKS, NetworkConfig, EVM_NETWORKS } from '../constants/networks';
import { USDT_CONTRACTS, USDT_DECIMALS } from '../constants/contracts';
import { getBridgesForRoute, BridgeConfig } from '../constants/bridges';

/**
 * Get network configuration by identifier
 * @param network Network identifier
 * @returns Network configuration
 */
export function getNetworkConfig(network: string): NetworkConfig {
  const config = NETWORKS[network];
  if (!config) {
    throw new Error(`Unknown network: ${network}`);
  }
  return config;
}

/**
 * Check if a network is an EVM-compatible chain
 * @param network Network identifier
 * @returns True if EVM-compatible
 */
export function isEvmNetwork(network: string): boolean {
  return EVM_NETWORKS.includes(network);
}

/**
 * Get USDT contract address for a network
 * @param network Network identifier
 * @returns USDT contract address
 */
export function getUsdtContractAddress(network: string): string {
  const address = USDT_CONTRACTS[network];
  if (!address) {
    throw new Error(`No USDT contract address for network: ${network}`);
  }
  return address;
}

/**
 * Get USDT decimals for a network
 * @param network Network identifier
 * @returns Number of decimal places
 */
export function getUsdtDecimals(network: string): number {
  return USDT_DECIMALS[network] ?? 6;
}

/**
 * Get the best chain for a transfer based on fees and speed
 * @param amount Transfer amount in USD
 * @returns Recommended network identifier
 */
export function getBestChainForTransfer(amount: number): string {
  // For small amounts, use low-fee chains
  if (amount < 100) {
    return 'tron'; // Very low fees
  }
  
  // For medium amounts, balance fees and security
  if (amount < 10000) {
    return 'polygon'; // Low fees, good security
  }
  
  // For large amounts, prioritize security
  return 'ethereum'; // Highest security
}

/**
 * Estimate transfer fee for a network
 * @param network Network identifier
 * @returns Estimated fee in USD
 */
export function estimateTransferFee(network: string): { fee: number; currency: string; note: string } {
  const estimates: Record<string, { fee: number; currency: string; note: string }> = {
    ethereum: { fee: 5.0, currency: 'ETH', note: 'Gas prices vary significantly' },
    polygon: { fee: 0.01, currency: 'MATIC', note: 'Very low fees' },
    arbitrum: { fee: 0.5, currency: 'ETH', note: 'L2 fees plus L1 data fee' },
    optimism: { fee: 0.5, currency: 'ETH', note: 'L2 fees plus L1 data fee' },
    bnbChain: { fee: 0.1, currency: 'BNB', note: 'Low fees' },
    avalanche: { fee: 0.1, currency: 'AVAX', note: 'Fast finality' },
    fantom: { fee: 0.01, currency: 'FTM', note: 'Very low fees' },
    tron: { fee: 0.001, currency: 'TRX', note: 'Energy/bandwidth based' },
    solana: { fee: 0.001, currency: 'SOL', note: 'Very low fees' },
    algorand: { fee: 0.001, currency: 'ALGO', note: 'Fixed low fee' },
    ton: { fee: 0.01, currency: 'TON', note: 'Low fees' },
    omni: { fee: 2.0, currency: 'BTC', note: 'Bitcoin network fees apply' },
  };
  
  return estimates[network] ?? { fee: 1.0, currency: 'USD', note: 'Estimate' };
}

/**
 * Compare transfer fees across networks
 * @returns Array of networks sorted by estimated fee
 */
export function compareTransferFees(): Array<{ network: string; fee: number; currency: string }> {
  const fees = Object.keys(NETWORKS)
    .filter((network) => !NETWORKS[network].isTestnet)
    .map((network) => ({
      network,
      ...estimateTransferFee(network),
    }))
    .sort((a, b) => a.fee - b.fee);
  
  return fees;
}

/**
 * Get available bridges between two networks
 * @param fromNetwork Source network
 * @param toNetwork Destination network
 * @returns Available bridge configurations
 */
export function getAvailableBridges(fromNetwork: string, toNetwork: string): BridgeConfig[] {
  return getBridgesForRoute(fromNetwork, toNetwork);
}

/**
 * Get the fastest bridge option between two networks
 * @param fromNetwork Source network
 * @param toNetwork Destination network
 * @returns Fastest bridge configuration or null
 */
export function getFastestBridge(fromNetwork: string, toNetwork: string): BridgeConfig | null {
  const bridges = getBridgesForRoute(fromNetwork, toNetwork);
  
  if (bridges.length === 0) {
    return null;
  }
  
  // Prefer third-party bridges for speed (native bridges have withdrawal delays)
  const thirdParty = bridges.filter((b) => b.type === 'third-party');
  if (thirdParty.length > 0) {
    return thirdParty[0];
  }
  
  return bridges[0];
}

/**
 * Check if direct bridge exists between networks
 * @param fromNetwork Source network
 * @param toNetwork Destination network
 * @returns True if direct bridge exists
 */
export function hasDirectBridge(fromNetwork: string, toNetwork: string): boolean {
  return getBridgesForRoute(fromNetwork, toNetwork).length > 0;
}

/**
 * Get all networks where USDT is available
 * @param includeTestnets Whether to include testnet networks
 * @returns Array of network identifiers
 */
export function getUsdtNetworks(includeTestnets = false): string[] {
  return Object.keys(NETWORKS).filter((network) => {
    const config = NETWORKS[network];
    if (!includeTestnets && config.isTestnet) {
      return false;
    }
    return USDT_CONTRACTS[network] !== undefined;
  });
}

/**
 * Get network statistics (for comparison)
 * @param network Network identifier
 * @returns Network statistics
 */
export function getNetworkStats(network: string): {
  avgBlockTime: number;
  finality: string;
  tps: number;
  securityLevel: 'high' | 'medium' | 'low';
} {
  const stats: Record<string, { avgBlockTime: number; finality: string; tps: number; securityLevel: 'high' | 'medium' | 'low' }> = {
    ethereum: { avgBlockTime: 12, finality: '~15 minutes', tps: 15, securityLevel: 'high' },
    polygon: { avgBlockTime: 2, finality: '~5 minutes', tps: 7000, securityLevel: 'medium' },
    arbitrum: { avgBlockTime: 0.25, finality: '~10 minutes', tps: 4500, securityLevel: 'high' },
    optimism: { avgBlockTime: 2, finality: '~10 minutes', tps: 2000, securityLevel: 'high' },
    bnbChain: { avgBlockTime: 3, finality: '~15 seconds', tps: 300, securityLevel: 'medium' },
    avalanche: { avgBlockTime: 2, finality: '~1 second', tps: 4500, securityLevel: 'medium' },
    tron: { avgBlockTime: 3, finality: '~1 minute', tps: 2000, securityLevel: 'medium' },
    solana: { avgBlockTime: 0.4, finality: '~400ms', tps: 65000, securityLevel: 'medium' },
    algorand: { avgBlockTime: 4.5, finality: '~4.5 seconds', tps: 1000, securityLevel: 'medium' },
    ton: { avgBlockTime: 5, finality: '~5 seconds', tps: 100000, securityLevel: 'medium' },
  };
  
  return stats[network] ?? { avgBlockTime: 10, finality: 'Unknown', tps: 100, securityLevel: 'low' };
}

/**
 * Get the recommended confirmation count for a network
 * @param network Network identifier
 * @param securityLevel Required security level
 * @returns Recommended number of confirmations
 */
export function getRecommendedConfirmations(
  network: string,
  securityLevel: 'fast' | 'standard' | 'secure' = 'standard'
): number {
  const confirmations: Record<string, Record<string, number>> = {
    ethereum: { fast: 1, standard: 12, secure: 35 },
    polygon: { fast: 1, standard: 128, secure: 512 },
    arbitrum: { fast: 1, standard: 1, secure: 1 },
    optimism: { fast: 1, standard: 1, secure: 1 },
    bnbChain: { fast: 1, standard: 15, secure: 35 },
    avalanche: { fast: 1, standard: 1, secure: 1 },
    tron: { fast: 1, standard: 19, secure: 50 },
    solana: { fast: 1, standard: 1, secure: 32 },
  };
  
  return confirmations[network]?.[securityLevel] ?? 12;
}
