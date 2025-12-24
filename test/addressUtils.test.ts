/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Tests for Address Utilities
 * 
 * @author Velocity BPA
 * @website https://velobpa.com
 */

import {
  isValidEvmAddress,
  isValidTronAddress,
  isValidSolanaAddress,
  isValidAlgorandAddress,
  isValidTonAddress,
  isValidAddress,
  getAddressExplorerUrl,
  getTxExplorerUrl,
} from '../nodes/Tether/utils/addressUtils';

describe('Address Utilities', () => {
  describe('isValidEvmAddress', () => {
    it('should validate correct EVM addresses', () => {
      expect(isValidEvmAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7')).toBe(true);
      expect(isValidEvmAddress('0x0000000000000000000000000000000000000000')).toBe(true);
    });

    it('should reject invalid EVM addresses', () => {
      expect(isValidEvmAddress('dAC17F958D2ee523a2206206994597C13D831ec7')).toBe(false); // Missing 0x
      expect(isValidEvmAddress('0xdAC17F958D2ee523a2206206994597C13D831ec')).toBe(false); // Too short
      expect(isValidEvmAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7G')).toBe(false); // Invalid char
      expect(isValidEvmAddress('')).toBe(false);
    });
  });

  describe('isValidTronAddress', () => {
    it('should validate correct Tron addresses', () => {
      expect(isValidTronAddress('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t')).toBe(true);
      expect(isValidTronAddress('TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL')).toBe(true);
    });

    it('should reject invalid Tron addresses', () => {
      expect(isValidTronAddress('AR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t')).toBe(false); // Wrong prefix
      expect(isValidTronAddress('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6')).toBe(false); // Too short
      expect(isValidTronAddress('')).toBe(false);
    });
  });

  describe('isValidSolanaAddress', () => {
    it('should validate correct Solana addresses', () => {
      expect(isValidSolanaAddress('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB')).toBe(true);
      expect(isValidSolanaAddress('11111111111111111111111111111111')).toBe(true);
    });

    it('should reject invalid Solana addresses', () => {
      expect(isValidSolanaAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7')).toBe(false);
      expect(isValidSolanaAddress('')).toBe(false);
    });
  });

  describe('isValidAlgorandAddress', () => {
    it('should validate correct Algorand addresses', () => {
      expect(isValidAlgorandAddress('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ')).toBe(true);
    });

    it('should reject invalid Algorand addresses', () => {
      expect(isValidAlgorandAddress('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaay5hfkq')).toBe(false); // Lowercase
      expect(isValidAlgorandAddress('')).toBe(false);
    });
  });

  describe('isValidTonAddress', () => {
    it('should validate correct TON addresses', () => {
      expect(isValidTonAddress('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs')).toBe(true);
      expect(isValidTonAddress('0:83dfe8e59adcf83c8de50b48b3a6b95f5b7e5f7e8de50b48b3a6b95f5b7e5f7e')).toBe(true);
    });

    it('should reject invalid TON addresses', () => {
      expect(isValidTonAddress('invalid')).toBe(false);
      expect(isValidTonAddress('')).toBe(false);
    });
  });

  describe('isValidAddress (multi-chain)', () => {
    it('should validate addresses for correct networks', () => {
      expect(isValidAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7', 'ethereum')).toBe(true);
      expect(isValidAddress('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', 'tron')).toBe(true);
      expect(isValidAddress('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', 'solana')).toBe(true);
    });

    it('should reject addresses for wrong networks', () => {
      expect(isValidAddress('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', 'ethereum')).toBe(false);
      expect(isValidAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7', 'tron')).toBe(false);
    });

    it('should throw for unknown networks', () => {
      expect(() => isValidAddress('test', 'unknownNetwork')).toThrow();
    });
  });

  describe('getAddressExplorerUrl', () => {
    it('should return correct explorer URLs', () => {
      const ethUrl = getAddressExplorerUrl('0xdAC17F958D2ee523a2206206994597C13D831ec7', 'ethereum');
      expect(ethUrl).toContain('etherscan.io');
      expect(ethUrl).toContain('0xdAC17F958D2ee523a2206206994597C13D831ec7');

      const tronUrl = getAddressExplorerUrl('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', 'tron');
      expect(tronUrl).toContain('tronscan.org');
    });
  });

  describe('getTxExplorerUrl', () => {
    it('should return correct transaction explorer URLs', () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const ethUrl = getTxExplorerUrl(txHash, 'ethereum');
      expect(ethUrl).toContain('etherscan.io/tx/');
      expect(ethUrl).toContain(txHash);
    });
  });
});
