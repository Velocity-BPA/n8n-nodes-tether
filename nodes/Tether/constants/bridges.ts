/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Bridge configurations for cross-chain USDT transfers
 * 
 * @author Velocity BPA
 * @website https://velobpa.com
 */

export interface BridgeConfig {
  name: string;
  website: string;
  supportedChains: string[];
  type: 'native' | 'third-party';
  estimatedTime: string;
  minAmount?: number;
  maxAmount?: number;
}

export const BRIDGES: Record<string, BridgeConfig> = {
  arbitrumBridge: {
    name: 'Arbitrum Bridge',
    website: 'https://bridge.arbitrum.io',
    supportedChains: ['ethereum', 'arbitrum'],
    type: 'native',
    estimatedTime: '~10 minutes (L1→L2), ~7 days (L2→L1)',
  },
  optimismBridge: {
    name: 'Optimism Bridge',
    website: 'https://app.optimism.io/bridge',
    supportedChains: ['ethereum', 'optimism'],
    type: 'native',
    estimatedTime: '~10 minutes (L1→L2), ~7 days (L2→L1)',
  },
  polygonBridge: {
    name: 'Polygon Bridge',
    website: 'https://wallet.polygon.technology/bridge',
    supportedChains: ['ethereum', 'polygon'],
    type: 'native',
    estimatedTime: '~7-8 minutes (L1→L2), ~45 minutes (L2→L1)',
  },
  stargateFinance: {
    name: 'Stargate Finance',
    website: 'https://stargate.finance',
    supportedChains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bnbChain', 'avalanche', 'fantom'],
    type: 'third-party',
    estimatedTime: '~1-5 minutes',
  },
  hopProtocol: {
    name: 'Hop Protocol',
    website: 'https://hop.exchange',
    supportedChains: ['ethereum', 'polygon', 'arbitrum', 'optimism'],
    type: 'third-party',
    estimatedTime: '~5-15 minutes',
  },
  celerNetwork: {
    name: 'Celer cBridge',
    website: 'https://cbridge.celer.network',
    supportedChains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bnbChain', 'avalanche', 'fantom'],
    type: 'third-party',
    estimatedTime: '~5-20 minutes',
  },
  across: {
    name: 'Across Protocol',
    website: 'https://across.to',
    supportedChains: ['ethereum', 'polygon', 'arbitrum', 'optimism'],
    type: 'third-party',
    estimatedTime: '~2-10 minutes',
  },
  synapseBridge: {
    name: 'Synapse Bridge',
    website: 'https://synapseprotocol.com',
    supportedChains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bnbChain', 'avalanche', 'fantom'],
    type: 'third-party',
    estimatedTime: '~5-15 minutes',
  },
  multichain: {
    name: 'Multichain',
    website: 'https://multichain.org',
    supportedChains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bnbChain', 'avalanche', 'fantom', 'tron'],
    type: 'third-party',
    estimatedTime: '~10-30 minutes',
  },
};

export const BRIDGE_OPTIONS = Object.entries(BRIDGES).map(([key, config]) => ({
  name: config.name,
  value: key,
}));

export function getBridgesForRoute(fromChain: string, toChain: string): BridgeConfig[] {
  return Object.values(BRIDGES).filter(
    (bridge) => bridge.supportedChains.includes(fromChain) && bridge.supportedChains.includes(toChain)
  );
}
