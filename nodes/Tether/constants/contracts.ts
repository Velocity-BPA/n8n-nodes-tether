/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * USDT Contract addresses and ABIs for all supported networks
 * 
 * @author Velocity BPA
 * @website https://velobpa.com
 */

// Standard ERC-20 ABI for USDT (includes Tether-specific functions)
export const ERC20_USDT_ABI = [
  // ERC-20 Standard
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  
  // Tether-specific functions
  'function owner() view returns (address)',
  'function paused() view returns (bool)',
  'function getBlacklist(address addr) view returns (bool)',
  'function isBlackListed(address addr) view returns (bool)',
  'function addBlackList(address addr)',
  'function removeBlackList(address addr)',
  'function destroyBlackFunds(address addr)',
  'function pause()',
  'function unpause()',
  'function issue(uint256 amount)',
  'function redeem(uint256 amount)',
  'function setParams(uint256 newBasisPoints, uint256 newMaxFee)',
  'function basisPointsRate() view returns (uint256)',
  'function maximumFee() view returns (uint256)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'event Issue(uint256 amount)',
  'event Redeem(uint256 amount)',
  'event Params(uint256 feeBasisPoints, uint256 maxFee)',
  'event AddedBlackList(address indexed addr)',
  'event RemovedBlackList(address indexed addr)',
  'event DestroyedBlackFunds(address indexed addr, uint256 balance)',
  'event Pause()',
  'event Unpause()',
];

// Full JSON ABI for advanced use cases
export const ERC20_USDT_FULL_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'paused',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: 'addr', type: 'address' }],
    name: 'isBlackListed',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
];

// TRC-20 USDT ABI for Tron
export const TRC20_USDT_ABI = [
  {
    outputs: [{ type: 'string' }],
    constant: true,
    name: 'name',
    stateMutability: 'View',
    type: 'Function',
  },
  {
    outputs: [{ type: 'string' }],
    constant: true,
    name: 'symbol',
    stateMutability: 'View',
    type: 'Function',
  },
  {
    outputs: [{ type: 'uint8' }],
    constant: true,
    name: 'decimals',
    stateMutability: 'View',
    type: 'Function',
  },
  {
    outputs: [{ type: 'uint256' }],
    constant: true,
    name: 'totalSupply',
    stateMutability: 'View',
    type: 'Function',
  },
  {
    outputs: [{ type: 'uint256' }],
    inputs: [{ name: 'who', type: 'address' }],
    constant: true,
    name: 'balanceOf',
    stateMutability: 'View',
    type: 'Function',
  },
  {
    outputs: [{ type: 'bool' }],
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    stateMutability: 'Nonpayable',
    type: 'Function',
  },
  {
    outputs: [{ type: 'uint256' }],
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    constant: true,
    name: 'allowance',
    stateMutability: 'View',
    type: 'Function',
  },
  {
    outputs: [{ type: 'bool' }],
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    stateMutability: 'Nonpayable',
    type: 'Function',
  },
  {
    outputs: [{ type: 'bool' }],
    inputs: [
      { name: '_from', type: 'address' },
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transferFrom',
    stateMutability: 'Nonpayable',
    type: 'Function',
  },
];

// USDT Contract addresses by network
export const USDT_CONTRACTS: Record<string, string> = {
  // EVM Networks
  ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  arbitrum: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  optimism: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
  bnbChain: '0x55d398326f99059fF775485246999027B3197955',
  avalanche: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
  fantom: '0x049d68029688eAbF473097a2fC38ef61633A3C7A',
  celo: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
  kava: '0x919C1c267BC06a7039e03fcc2eF738525769109c',
  
  // Non-EVM Networks
  tron: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  solana: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  algorand: '312769',
  ton: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
  omni: '31',
  near: 'usdt.tether-token.near',
  eos: 'tethertether',
  liquid: 'ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2',
  
  // Testnets
  sepolia: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
  tronShasta: 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs',
};

// USDT decimals by network (most are 6, but some differ)
export const USDT_DECIMALS: Record<string, number> = {
  ethereum: 6,
  polygon: 6,
  arbitrum: 6,
  optimism: 6,
  bnbChain: 18, // BEP-20 USDT uses 18 decimals
  avalanche: 6,
  fantom: 6,
  celo: 6,
  kava: 6,
  tron: 6,
  solana: 6,
  algorand: 6,
  ton: 6,
  omni: 8, // Omni uses 8 decimals
  near: 6,
  eos: 4, // EOS uses 4 decimals
  liquid: 8,
  sepolia: 6,
  tronShasta: 6,
};

// Bridge contract addresses
export const BRIDGE_CONTRACTS: Record<string, Record<string, string>> = {
  arbitrum: {
    l1Gateway: '0xcEe284F754E854890e311e3280b767F80797180d',
    l2Gateway: '0x096760F208390250649E3e8763348E783AEF5562',
  },
  optimism: {
    l1StandardBridge: '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1',
    l2StandardBridge: '0x4200000000000000000000000000000000000010',
  },
  polygon: {
    rootChainManager: '0xA0c68C638235ee32657e8f720a23ceC1bFc77C77',
    erc20Predicate: '0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf',
  },
};

// Tether Treasury addresses (for monitoring issuance/redemption)
export const TETHER_TREASURY_ADDRESSES: Record<string, string[]> = {
  ethereum: [
    '0x5754284f345afc66a98fbB0a0Afe71e0F007B949', // Tether Treasury
    '0x36928500Bc1dCd7af6a2B4008875CC336b927D57', // Bitfinex Hot Wallet
  ],
  tron: [
    'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL', // Tether Treasury
  ],
};
