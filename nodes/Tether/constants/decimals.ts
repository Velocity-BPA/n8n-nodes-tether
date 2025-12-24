/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Decimal handling utilities and constants for USDT across chains
 * 
 * @author Velocity BPA
 * @website https://velobpa.com
 */

export const DECIMAL_PLACES: Record<string, number> = {
  ethereum: 6,
  polygon: 6,
  arbitrum: 6,
  optimism: 6,
  bnbChain: 18,
  avalanche: 6,
  fantom: 6,
  celo: 6,
  kava: 6,
  tron: 6,
  solana: 6,
  algorand: 6,
  ton: 6,
  omni: 8,
  near: 6,
  eos: 4,
  liquid: 8,
  sepolia: 6,
  tronShasta: 6,
};

export const MULTIPLIERS: Record<number, bigint> = {
  4: BigInt(10000),
  6: BigInt(1000000),
  8: BigInt(100000000),
  18: BigInt(1000000000000000000),
};

export function getDecimals(network: string): number {
  return DECIMAL_PLACES[network] ?? 6;
}

export function getMultiplier(network: string): bigint {
  const decimals = getDecimals(network);
  return MULTIPLIERS[decimals] ?? BigInt(10 ** decimals);
}
