/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Tests for Constants
 * 
 * @author Velocity BPA
 * @website https://velobpa.com
 */

import { NETWORKS, NETWORK_OPTIONS, EVM_NETWORKS, MAINNET_NETWORKS, TESTNET_NETWORKS } from '../nodes/Tether/constants/networks';
import { USDT_CONTRACTS, USDT_DECIMALS, ERC20_USDT_ABI } from '../nodes/Tether/constants/contracts';
import { BRIDGES, getBridgesForRoute } from '../nodes/Tether/constants/bridges';
import { DECIMAL_PLACES, getDecimals, getMultiplier } from '../nodes/Tether/constants/decimals';

describe('Network Constants', () => {
  it('should have all major networks defined', () => {
    expect(NETWORKS.ethereum).toBeDefined();
    expect(NETWORKS.tron).toBeDefined();
    expect(NETWORKS.solana).toBeDefined();
    expect(NETWORKS.polygon).toBeDefined();
    expect(NETWORKS.arbitrum).toBeDefined();
    expect(NETWORKS.optimism).toBeDefined();
    expect(NETWORKS.bnbChain).toBeDefined();
    expect(NETWORKS.avalanche).toBeDefined();
    expect(NETWORKS.ton).toBeDefined();
    expect(NETWORKS.algorand).toBeDefined();
  });

  it('should have correct network types', () => {
    expect(NETWORKS.ethereum.type).toBe('evm');
    expect(NETWORKS.tron.type).toBe('tron');
    expect(NETWORKS.solana.type).toBe('solana');
    expect(NETWORKS.algorand.type).toBe('algorand');
    expect(NETWORKS.ton.type).toBe('ton');
    expect(NETWORKS.omni.type).toBe('omni');
  });

  it('should have chain IDs for EVM networks', () => {
    expect(NETWORKS.ethereum.chainId).toBe(1);
    expect(NETWORKS.polygon.chainId).toBe(137);
    expect(NETWORKS.arbitrum.chainId).toBe(42161);
    expect(NETWORKS.optimism.chainId).toBe(10);
    expect(NETWORKS.bnbChain.chainId).toBe(56);
  });

  it('should have valid RPC URLs', () => {
    Object.values(NETWORKS).forEach(network => {
      expect(network.rpcUrl).toBeTruthy();
      expect(network.rpcUrl.startsWith('http')).toBe(true);
    });
  });

  it('should have valid explorer URLs', () => {
    Object.values(NETWORKS).forEach(network => {
      expect(network.explorerUrl).toBeTruthy();
      expect(network.explorerUrl.startsWith('http')).toBe(true);
    });
  });

  it('should categorize networks correctly', () => {
    expect(EVM_NETWORKS).toContain('ethereum');
    expect(EVM_NETWORKS).toContain('polygon');
    expect(EVM_NETWORKS).not.toContain('tron');
    expect(EVM_NETWORKS).not.toContain('solana');

    expect(MAINNET_NETWORKS).toContain('ethereum');
    expect(MAINNET_NETWORKS).not.toContain('sepolia');

    expect(TESTNET_NETWORKS).toContain('sepolia');
    expect(TESTNET_NETWORKS).toContain('tronShasta');
    expect(TESTNET_NETWORKS).not.toContain('ethereum');
  });

  it('should have network options for UI', () => {
    expect(NETWORK_OPTIONS.length).toBeGreaterThan(0);
    expect(NETWORK_OPTIONS[0]).toHaveProperty('name');
    expect(NETWORK_OPTIONS[0]).toHaveProperty('value');
  });
});

describe('Contract Constants', () => {
  it('should have USDT contracts for all networks', () => {
    expect(USDT_CONTRACTS.ethereum).toBe('0xdAC17F958D2ee523a2206206994597C13D831ec7');
    expect(USDT_CONTRACTS.tron).toBe('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
    expect(USDT_CONTRACTS.solana).toBe('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
  });

  it('should have decimals for all networks', () => {
    expect(USDT_DECIMALS.ethereum).toBe(6);
    expect(USDT_DECIMALS.bnbChain).toBe(18);
    expect(USDT_DECIMALS.omni).toBe(8);
    expect(USDT_DECIMALS.eos).toBe(4);
  });

  it('should have a valid ERC20 ABI', () => {
    expect(ERC20_USDT_ABI).toBeInstanceOf(Array);
    expect(ERC20_USDT_ABI.length).toBeGreaterThan(0);
    expect(ERC20_USDT_ABI).toContain(expect.stringContaining('balanceOf'));
    expect(ERC20_USDT_ABI).toContain(expect.stringContaining('transfer'));
    expect(ERC20_USDT_ABI).toContain(expect.stringContaining('approve'));
  });
});

describe('Bridge Constants', () => {
  it('should have bridge configurations', () => {
    expect(Object.keys(BRIDGES).length).toBeGreaterThan(0);
    expect(BRIDGES.arbitrumBridge).toBeDefined();
    expect(BRIDGES.optimismBridge).toBeDefined();
    expect(BRIDGES.polygonBridge).toBeDefined();
  });

  it('should have valid bridge properties', () => {
    Object.values(BRIDGES).forEach(bridge => {
      expect(bridge.name).toBeTruthy();
      expect(bridge.website).toBeTruthy();
      expect(bridge.supportedChains).toBeInstanceOf(Array);
      expect(bridge.type).toMatch(/^(native|third-party)$/);
      expect(bridge.estimatedTime).toBeTruthy();
    });
  });

  it('should find bridges for valid routes', () => {
    const bridges = getBridgesForRoute('ethereum', 'polygon');
    expect(bridges.length).toBeGreaterThan(0);
  });

  it('should return empty for invalid routes', () => {
    const bridges = getBridgesForRoute('omni', 'ton');
    expect(bridges.length).toBe(0);
  });
});

describe('Decimal Constants', () => {
  it('should have decimal places defined', () => {
    expect(DECIMAL_PLACES.ethereum).toBe(6);
    expect(DECIMAL_PLACES.bnbChain).toBe(18);
  });

  it('should get correct decimals', () => {
    expect(getDecimals('ethereum')).toBe(6);
    expect(getDecimals('bnbChain')).toBe(18);
    expect(getDecimals('unknown')).toBe(6); // Default
  });

  it('should get correct multipliers', () => {
    expect(getMultiplier('ethereum')).toBe(BigInt(1000000));
    expect(getMultiplier('bnbChain')).toBe(BigInt('1000000000000000000'));
  });
});
