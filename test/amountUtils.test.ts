/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Tests for Amount Utilities
 * 
 * @author Velocity BPA
 * @website https://velobpa.com
 */

import {
  parseUsdtAmount,
  formatUsdtAmount,
  convertUsdtBetweenNetworks,
  isValidUsdtAmount,
  formatWithCommas,
} from '../nodes/Tether/utils/amountUtils';

describe('Amount Utilities', () => {
  describe('parseUsdtAmount', () => {
    it('should parse whole numbers correctly', () => {
      expect(parseUsdtAmount('100', 'ethereum')).toBe(BigInt(100000000));
      expect(parseUsdtAmount('1', 'ethereum')).toBe(BigInt(1000000));
    });

    it('should parse decimal amounts correctly', () => {
      expect(parseUsdtAmount('100.50', 'ethereum')).toBe(BigInt(100500000));
      expect(parseUsdtAmount('0.000001', 'ethereum')).toBe(BigInt(1));
    });

    it('should handle different decimal places for BNB Chain (18 decimals)', () => {
      const result = parseUsdtAmount('1', 'bnbChain');
      expect(result).toBe(BigInt('1000000000000000000'));
    });

    it('should handle Omni Layer (8 decimals)', () => {
      const result = parseUsdtAmount('1', 'omni');
      expect(result).toBe(BigInt(100000000));
    });

    it('should truncate excess decimals', () => {
      expect(parseUsdtAmount('1.0000001', 'ethereum')).toBe(BigInt(1000000));
    });
  });

  describe('formatUsdtAmount', () => {
    it('should format amounts correctly', () => {
      expect(formatUsdtAmount(BigInt(100000000), 'ethereum')).toBe('100');
      expect(formatUsdtAmount(BigInt(1000000), 'ethereum')).toBe('1');
    });

    it('should handle decimal amounts', () => {
      expect(formatUsdtAmount(BigInt(100500000), 'ethereum')).toBe('100.5');
      expect(formatUsdtAmount(BigInt(1), 'ethereum')).toBe('0.000001');
    });

    it('should handle BNB Chain 18 decimals', () => {
      const result = formatUsdtAmount(BigInt('1000000000000000000'), 'bnbChain');
      expect(result).toBe('1');
    });

    it('should remove trailing zeros', () => {
      expect(formatUsdtAmount(BigInt(1000000), 'ethereum')).toBe('1');
      expect(formatUsdtAmount(BigInt(1100000), 'ethereum')).toBe('1.1');
    });
  });

  describe('convertUsdtBetweenNetworks', () => {
    it('should convert between networks with same decimals', () => {
      const amount = BigInt(1000000); // 1 USDT on Ethereum
      const result = convertUsdtBetweenNetworks(amount, 'ethereum', 'polygon');
      expect(result).toBe(BigInt(1000000));
    });

    it('should scale up when converting to more decimals', () => {
      const amount = BigInt(1000000); // 1 USDT on Ethereum (6 decimals)
      const result = convertUsdtBetweenNetworks(amount, 'ethereum', 'bnbChain');
      expect(result).toBe(BigInt('1000000000000'));
    });

    it('should scale down when converting to fewer decimals', () => {
      const amount = BigInt('1000000000000000000'); // 1 USDT on BNB Chain (18 decimals)
      const result = convertUsdtBetweenNetworks(amount, 'bnbChain', 'ethereum');
      expect(result).toBe(BigInt(1000000));
    });
  });

  describe('isValidUsdtAmount', () => {
    it('should validate correct amounts', () => {
      expect(isValidUsdtAmount('100', 'ethereum')).toBe(true);
      expect(isValidUsdtAmount('100.50', 'ethereum')).toBe(true);
      expect(isValidUsdtAmount('0.000001', 'ethereum')).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(isValidUsdtAmount('abc', 'ethereum')).toBe(false);
      expect(isValidUsdtAmount('-100', 'ethereum')).toBe(false);
      expect(isValidUsdtAmount('100.0000001', 'ethereum')).toBe(false); // Too many decimals
    });
  });

  describe('formatWithCommas', () => {
    it('should add commas to large numbers', () => {
      expect(formatWithCommas('1000000')).toBe('1,000,000');
      expect(formatWithCommas('1234567890')).toBe('1,234,567,890');
    });

    it('should handle decimals correctly', () => {
      expect(formatWithCommas('1000000.50')).toBe('1,000,000.50');
    });

    it('should not add commas to small numbers', () => {
      expect(formatWithCommas('100')).toBe('100');
      expect(formatWithCommas('999')).toBe('999');
    });
  });
});
