/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Amount utilities for handling USDT amounts across different decimal places
 * 
 * @author Velocity BPA
 * @website https://velobpa.com
 */

import { getDecimals, getMultiplier } from '../constants/decimals';

/**
 * Parse a human-readable USDT amount to the smallest unit for a specific network
 * @param amount Human-readable amount (e.g., "100.50")
 * @param network Network identifier
 * @returns Amount in smallest unit as bigint
 */
export function parseUsdtAmount(amount: string | number, network: string): bigint {
  const decimals = getDecimals(network);
  const amountStr = amount.toString();
  
  // Handle decimal point
  const parts = amountStr.split('.');
  const wholePart = parts[0] || '0';
  let decimalPart = parts[1] || '';
  
  // Pad or truncate decimal part to match network decimals
  if (decimalPart.length > decimals) {
    decimalPart = decimalPart.slice(0, decimals);
  } else {
    decimalPart = decimalPart.padEnd(decimals, '0');
  }
  
  // Combine and convert to bigint
  const combined = wholePart + decimalPart;
  return BigInt(combined);
}

/**
 * Format a raw USDT amount to human-readable form for a specific network
 * @param amount Raw amount in smallest unit
 * @param network Network identifier
 * @param precision Optional precision for formatting (default: network decimals)
 * @returns Formatted human-readable amount
 */
export function formatUsdtAmount(
  amount: bigint | string | number,
  network: string,
  precision?: number
): string {
  const decimals = getDecimals(network);
  const displayPrecision = precision ?? decimals;
  const multiplier = getMultiplier(network);
  
  const amountBigInt = BigInt(amount);
  const wholePart = amountBigInt / multiplier;
  const decimalPart = amountBigInt % multiplier;
  
  // Format decimal part with proper padding
  let decimalStr = decimalPart.toString().padStart(decimals, '0');
  
  // Truncate to display precision
  if (displayPrecision < decimals) {
    decimalStr = decimalStr.slice(0, displayPrecision);
  }
  
  // Remove trailing zeros
  decimalStr = decimalStr.replace(/0+$/, '');
  
  if (decimalStr === '') {
    return wholePart.toString();
  }
  
  return `${wholePart}.${decimalStr}`;
}

/**
 * Convert USDT amount between networks with different decimal places
 * @param amount Raw amount in source network's smallest unit
 * @param fromNetwork Source network
 * @param toNetwork Target network
 * @returns Amount in target network's smallest unit
 */
export function convertUsdtBetweenNetworks(
  amount: bigint | string | number,
  fromNetwork: string,
  toNetwork: string
): bigint {
  const fromDecimals = getDecimals(fromNetwork);
  const toDecimals = getDecimals(toNetwork);
  
  const amountBigInt = BigInt(amount);
  
  if (fromDecimals === toDecimals) {
    return amountBigInt;
  }
  
  if (fromDecimals > toDecimals) {
    // Scale down
    const factor = BigInt(10 ** (fromDecimals - toDecimals));
    return amountBigInt / factor;
  } else {
    // Scale up
    const factor = BigInt(10 ** (toDecimals - fromDecimals));
    return amountBigInt * factor;
  }
}

/**
 * Validate that an amount string is properly formatted
 * @param amount Amount string to validate
 * @param network Network identifier
 * @returns True if valid, false otherwise
 */
export function isValidUsdtAmount(amount: string, network: string): boolean {
  const decimals = getDecimals(network);
  
  // Check basic format
  const regex = /^[0-9]+(\.[0-9]+)?$/;
  if (!regex.test(amount)) {
    return false;
  }
  
  // Check decimal places
  const parts = amount.split('.');
  if (parts[1] && parts[1].length > decimals) {
    return false;
  }
  
  // Check for valid number
  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed < 0) {
    return false;
  }
  
  return true;
}

/**
 * Add commas to large numbers for display
 * @param amount Amount string
 * @returns Formatted amount with commas
 */
export function formatWithCommas(amount: string): string {
  const parts = amount.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

/**
 * Convert USD value to USDT amount (1:1 assuming peg)
 * @param usdValue USD value
 * @param network Target network
 * @returns USDT amount in smallest unit
 */
export function usdToUsdt(usdValue: number, network: string): bigint {
  return parseUsdtAmount(usdValue.toString(), network);
}

/**
 * Get the minimum transfer amount for a network (typically related to gas costs)
 * @param network Network identifier
 * @returns Minimum recommended transfer amount in human-readable form
 */
export function getMinimumTransferAmount(network: string): string {
  // Minimum amounts based on typical gas costs
  const minimums: Record<string, string> = {
    ethereum: '10', // Higher due to gas costs
    polygon: '0.01',
    arbitrum: '1',
    optimism: '1',
    bnbChain: '0.1',
    avalanche: '1',
    fantom: '0.1',
    tron: '0.01', // Very low fees
    solana: '0.01',
    algorand: '0.01',
    ton: '0.01',
  };
  
  return minimums[network] ?? '1';
}
