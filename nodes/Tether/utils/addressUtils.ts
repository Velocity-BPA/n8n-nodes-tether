/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Address validation utilities for multi-chain USDT addresses
 * 
 * @author Velocity BPA
 * @website https://velobpa.com
 */

import { NETWORKS } from '../constants/networks';

/**
 * Validate an Ethereum/EVM address
 * @param address Address to validate
 * @returns True if valid EVM address
 */
export function isValidEvmAddress(address: string): boolean {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate a Tron address
 * @param address Address to validate
 * @returns True if valid Tron address
 */
export function isValidTronAddress(address: string): boolean {
  if (!address) return false;
  // Tron addresses start with T and are 34 characters (base58)
  return /^T[a-zA-Z0-9]{33}$/.test(address);
}

/**
 * Validate a Solana address
 * @param address Address to validate
 * @returns True if valid Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address) return false;
  // Solana addresses are base58 encoded, 32-44 characters
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/**
 * Validate an Algorand address
 * @param address Address to validate
 * @returns True if valid Algorand address
 */
export function isValidAlgorandAddress(address: string): boolean {
  if (!address) return false;
  // Algorand addresses are 58 characters, uppercase letters and numbers
  return /^[A-Z2-7]{58}$/.test(address);
}

/**
 * Validate a TON address
 * @param address Address to validate
 * @returns True if valid TON address
 */
export function isValidTonAddress(address: string): boolean {
  if (!address) return false;
  // TON addresses can be raw (0: prefix) or user-friendly (EQ/UQ prefix)
  const rawFormat = /^-?[0-9]+:[a-fA-F0-9]{64}$/.test(address);
  const userFriendly = /^(EQ|UQ)[a-zA-Z0-9_-]{46}$/.test(address);
  return rawFormat || userFriendly;
}

/**
 * Validate a Bitcoin address (for Omni Layer)
 * @param address Address to validate
 * @returns True if valid Bitcoin address
 */
export function isValidBitcoinAddress(address: string): boolean {
  if (!address) return false;
  // P2PKH (1...), P2SH (3...), Bech32 (bc1...)
  const p2pkh = /^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
  const p2sh = /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
  const bech32 = /^bc1[a-zA-HJ-NP-Z0-9]{39,59}$/.test(address);
  return p2pkh || p2sh || bech32;
}

/**
 * Validate a NEAR address
 * @param address Address to validate
 * @returns True if valid NEAR address
 */
export function isValidNearAddress(address: string): boolean {
  if (!address) return false;
  // NEAR addresses are account IDs (lowercase letters, digits, - and _)
  // 2-64 characters, can end with .near
  return /^[a-z0-9_-]{2,64}(\.near)?$/.test(address.toLowerCase());
}

/**
 * Validate an EOS address
 * @param address Address to validate
 * @returns True if valid EOS address
 */
export function isValidEosAddress(address: string): boolean {
  if (!address) return false;
  // EOS account names are 12 characters, lowercase letters and numbers 1-5
  return /^[a-z1-5.]{1,12}$/.test(address);
}

/**
 * Validate an address for a specific network
 * @param address Address to validate
 * @param network Network identifier
 * @returns True if valid address for the network
 */
export function isValidAddress(address: string, network: string): boolean {
  const networkConfig = NETWORKS[network];
  if (!networkConfig) {
    throw new Error(`Unknown network: ${network}`);
  }
  
  switch (networkConfig.type) {
    case 'evm':
      return isValidEvmAddress(address);
    case 'tron':
      return isValidTronAddress(address);
    case 'solana':
      return isValidSolanaAddress(address);
    case 'algorand':
      return isValidAlgorandAddress(address);
    case 'ton':
      return isValidTonAddress(address);
    case 'omni':
      return isValidBitcoinAddress(address);
    case 'near':
      return isValidNearAddress(address);
    case 'eos':
      return isValidEosAddress(address);
    default:
      // For unknown types, do basic validation
      return address.length > 0;
  }
}

/**
 * Normalize an address (checksum for EVM, etc.)
 * @param address Address to normalize
 * @param network Network identifier
 * @returns Normalized address
 */
export function normalizeAddress(address: string, network: string): string {
  const networkConfig = NETWORKS[network];
  if (!networkConfig) {
    return address;
  }
  
  switch (networkConfig.type) {
    case 'evm':
      // Return lowercase for consistency (proper checksum requires keccak256)
      return address.toLowerCase();
    case 'tron':
      return address; // Tron addresses are case-sensitive
    case 'algorand':
      return address.toUpperCase();
    default:
      return address;
  }
}

/**
 * Get the address format hint for a network
 * @param network Network identifier
 * @returns Description of the expected address format
 */
export function getAddressFormatHint(network: string): string {
  const networkConfig = NETWORKS[network];
  if (!networkConfig) {
    return 'Enter a valid address';
  }
  
  const hints: Record<string, string> = {
    evm: 'Ethereum address starting with 0x (42 characters)',
    tron: 'Tron address starting with T (34 characters)',
    solana: 'Solana address (32-44 base58 characters)',
    algorand: 'Algorand address (58 uppercase characters)',
    ton: 'TON address (EQ/UQ prefix or raw format)',
    omni: 'Bitcoin address (P2PKH, P2SH, or Bech32)',
    near: 'NEAR account ID (2-64 lowercase characters)',
    eos: 'EOS account name (up to 12 characters)',
  };
  
  return hints[networkConfig.type] ?? 'Enter a valid address';
}

/**
 * Get the block explorer URL for an address
 * @param address Address to look up
 * @param network Network identifier
 * @returns Block explorer URL
 */
export function getAddressExplorerUrl(address: string, network: string): string {
  const networkConfig = NETWORKS[network];
  if (!networkConfig) {
    return '';
  }
  
  const baseUrl = networkConfig.explorerUrl;
  
  switch (networkConfig.type) {
    case 'evm':
      return `${baseUrl}/address/${address}`;
    case 'tron':
      return `${baseUrl}/#/address/${address}`;
    case 'solana':
      return `${baseUrl}/account/${address}`;
    case 'algorand':
      return `${baseUrl}/address/${address}`;
    case 'ton':
      return `${baseUrl}/address/${address}`;
    case 'omni':
      return `${baseUrl}/address/${address}`;
    case 'near':
      return `${baseUrl}/address/${address}`;
    case 'eos':
      return `${baseUrl}/account/${address}`;
    default:
      return `${baseUrl}/address/${address}`;
  }
}

/**
 * Get the block explorer URL for a transaction
 * @param txHash Transaction hash
 * @param network Network identifier
 * @returns Block explorer URL
 */
export function getTxExplorerUrl(txHash: string, network: string): string {
  const networkConfig = NETWORKS[network];
  if (!networkConfig) {
    return '';
  }
  
  const baseUrl = networkConfig.explorerUrl;
  
  switch (networkConfig.type) {
    case 'evm':
      return `${baseUrl}/tx/${txHash}`;
    case 'tron':
      return `${baseUrl}/#/transaction/${txHash}`;
    case 'solana':
      return `${baseUrl}/tx/${txHash}`;
    case 'algorand':
      return `${baseUrl}/tx/${txHash}`;
    case 'ton':
      return `${baseUrl}/transaction/${txHash}`;
    case 'omni':
      return `${baseUrl}/tx/${txHash}`;
    case 'near':
      return `${baseUrl}/txns/${txHash}`;
    case 'eos':
      return `${baseUrl}/transaction/${txHash}`;
    default:
      return `${baseUrl}/tx/${txHash}`;
  }
}
