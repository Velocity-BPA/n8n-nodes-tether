/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Tests for Chain Utilities
 * 
 * @author Velocity BPA
 * @website https://velobpa.com
 */

import {
  getNetworkConfig,
  isEvmNetwork,
  getUsdtContractAddress,
  getUsdtDecimals,
  getBestChainForTransfer,
  estimateTransferFee,
  compareTransferFees,
  getAvailableBridges,
  hasDirectBridge,
  getUsdtNetworks,
  getNetworkStats,
  getRecommendedConfirmations,
} from '../nodes/Tether/utils/chainUtils';

describe('Chain Utilities', () => {
  describe('getNetworkConfig', () => {
    it('should return config for valid networks', () => {
      const ethConfig = getNetworkConfig('ethereum');
      expect(ethConfig.name).toBe('Ethereum Mainnet');
      expect(ethConfig.type).toBe('evm');
      expect(ethConfig.chainId).toBe(1);
    });

    it('should throw for unknown networks', () => {
      expect(() => getNetworkConfig('unknownNetwork')).toThrow();
    });
  });

  describe('isEvmNetwork', () => {
    it('should return true for EVM networks', () => {
      expect(isEvmNetwork('ethereum')).toBe(true);
      expect(isEvmNetwork('polygon')).toBe(true);
      expect(isEvmNetwork('arbitrum')).toBe(true);
      expect(isEvmNetwork('bnbChain')).toBe(true);
    });

    it('should return false for non-EVM networks', () => {
      expect(isEvmNetwork('tron')).toBe(false);
      expect(isEvmNetwork('solana')).toBe(false);
      expect(isEvmNetwork('algorand')).toBe(false);
    });
  });

  describe('getUsdtContractAddress', () => {
    it('should return correct contract addresses', () => {
      expect(getUsdtContractAddress('ethereum')).toBe('0xdAC17F958D2ee523a2206206994597C13D831ec7');
      expect(getUsdtContractAddress('tron')).toBe('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
      expect(getUsdtContractAddress('solana')).toBe('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
    });

    it('should throw for networks without USDT', () => {
      expect(() => getUsdtContractAddress('unknownNetwork')).toThrow();
    });
  });

  describe('getUsdtDecimals', () => {
    it('should return correct decimals', () => {
      expect(getUsdtDecimals('ethereum')).toBe(6);
      expect(getUsdtDecimals('bnbChain')).toBe(18);
      expect(getUsdtDecimals('omni')).toBe(8);
      expect(getUsdtDecimals('eos')).toBe(4);
    });

    it('should return default 6 for unknown networks', () => {
      expect(getUsdtDecimals('unknownNetwork')).toBe(6);
    });
  });

  describe('getBestChainForTransfer', () => {
    it('should recommend tron for small amounts', () => {
      expect(getBestChainForTransfer(50)).toBe('tron');
    });

    it('should recommend polygon for medium amounts', () => {
      expect(getBestChainForTransfer(5000)).toBe('polygon');
    });

    it('should recommend ethereum for large amounts', () => {
      expect(getBestChainForTransfer(50000)).toBe('ethereum');
    });
  });

  describe('estimateTransferFee', () => {
    it('should return fee estimates with currency', () => {
      const ethFee = estimateTransferFee('ethereum');
      expect(ethFee.currency).toBe('ETH');
      expect(ethFee.fee).toBeGreaterThan(0);

      const tronFee = estimateTransferFee('tron');
      expect(tronFee.currency).toBe('TRX');
      expect(tronFee.fee).toBeLessThan(ethFee.fee);
    });
  });

  describe('compareTransferFees', () => {
    it('should return sorted fee comparison', () => {
      const fees = compareTransferFees();
      expect(fees.length).toBeGreaterThan(0);
      
      // Should be sorted by fee (ascending)
      for (let i = 1; i < fees.length; i++) {
        expect(fees[i].fee).toBeGreaterThanOrEqual(fees[i - 1].fee);
      }
    });
  });

  describe('getAvailableBridges', () => {
    it('should return bridges for supported routes', () => {
      const bridges = getAvailableBridges('ethereum', 'polygon');
      expect(bridges.length).toBeGreaterThan(0);
    });

    it('should return empty array for unsupported routes', () => {
      const bridges = getAvailableBridges('omni', 'ton');
      expect(bridges.length).toBe(0);
    });
  });

  describe('hasDirectBridge', () => {
    it('should return true for bridgeable routes', () => {
      expect(hasDirectBridge('ethereum', 'polygon')).toBe(true);
      expect(hasDirectBridge('ethereum', 'arbitrum')).toBe(true);
    });

    it('should return false for non-bridgeable routes', () => {
      expect(hasDirectBridge('omni', 'ton')).toBe(false);
    });
  });

  describe('getUsdtNetworks', () => {
    it('should return mainnet networks by default', () => {
      const networks = getUsdtNetworks();
      expect(networks).toContain('ethereum');
      expect(networks).toContain('tron');
      expect(networks).not.toContain('sepolia');
    });

    it('should include testnets when requested', () => {
      const networks = getUsdtNetworks(true);
      expect(networks).toContain('sepolia');
      expect(networks).toContain('tronShasta');
    });
  });

  describe('getNetworkStats', () => {
    it('should return stats for known networks', () => {
      const ethStats = getNetworkStats('ethereum');
      expect(ethStats.securityLevel).toBe('high');
      expect(ethStats.avgBlockTime).toBe(12);

      const solanaStats = getNetworkStats('solana');
      expect(solanaStats.tps).toBeGreaterThan(10000);
    });
  });

  describe('getRecommendedConfirmations', () => {
    it('should return confirmations based on security level', () => {
      const fastConf = getRecommendedConfirmations('ethereum', 'fast');
      const standardConf = getRecommendedConfirmations('ethereum', 'standard');
      const secureConf = getRecommendedConfirmations('ethereum', 'secure');

      expect(fastConf).toBeLessThan(standardConf);
      expect(standardConf).toBeLessThan(secureConf);
    });
  });
});
