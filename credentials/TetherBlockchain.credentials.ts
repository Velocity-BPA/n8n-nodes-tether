/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class TetherBlockchain implements ICredentialType {
  name = 'tetherBlockchain';
  displayName = 'Tether Blockchain';
  documentationUrl = 'https://github.com/Velocity-BPA/n8n-nodes-tether';
  
  properties: INodeProperties[] = [
    {
      displayName: 'Network',
      name: 'network',
      type: 'options',
      options: [
        { name: 'Ethereum Mainnet', value: 'ethereum' },
        { name: 'Tron', value: 'tron' },
        { name: 'Solana', value: 'solana' },
        { name: 'Polygon', value: 'polygon' },
        { name: 'Arbitrum', value: 'arbitrum' },
        { name: 'Optimism', value: 'optimism' },
        { name: 'BNB Smart Chain', value: 'bnbChain' },
        { name: 'Avalanche C-Chain', value: 'avalanche' },
        { name: 'TON', value: 'ton' },
        { name: 'Algorand', value: 'algorand' },
        { name: 'Fantom', value: 'fantom' },
        { name: 'Celo', value: 'celo' },
        { name: 'NEAR', value: 'near' },
        { name: 'Kava', value: 'kava' },
        { name: 'Omni (Bitcoin)', value: 'omni' },
        { name: 'Sepolia Testnet', value: 'sepolia' },
        { name: 'Tron Shasta Testnet', value: 'tronShasta' },
        { name: 'Solana Devnet', value: 'solanaDevnet' },
        { name: 'Custom', value: 'custom' },
      ],
      default: 'ethereum',
      description: 'The blockchain network to connect to',
    },
    {
      displayName: 'RPC Endpoint URL',
      name: 'rpcUrl',
      type: 'string',
      default: '',
      placeholder: 'https://eth.llamarpc.com',
      description: 'Custom RPC endpoint URL (leave empty to use default)',
    },
    {
      displayName: 'Private Key',
      name: 'privateKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'Private key for signing transactions (required for transfers, optional for read operations)',
    },
    {
      displayName: 'Chain ID',
      name: 'chainId',
      type: 'number',
      default: 1,
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
      description: 'Chain ID for custom EVM networks',
    },
    {
      displayName: 'USDT Contract Address',
      name: 'usdtContract',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
      description: 'USDT contract address for custom networks',
    },
    {
      displayName: 'USDT Decimals',
      name: 'usdtDecimals',
      type: 'number',
      default: 6,
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
      description: 'Number of decimal places for USDT on this network',
    },
    // Tron-specific fields
    {
      displayName: 'Solidity Node URL',
      name: 'solidityNode',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          network: ['tron', 'tronShasta'],
        },
      },
      description: 'Tron Solidity Node URL (optional, defaults to full node)',
    },
    {
      displayName: 'Event Server URL',
      name: 'eventServer',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          network: ['tron', 'tronShasta'],
        },
      },
      description: 'Tron Event Server URL (optional)',
    },
    // TON-specific fields
    {
      displayName: 'TON API Key',
      name: 'tonApiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      displayOptions: {
        show: {
          network: ['ton'],
        },
      },
      description: 'API key for TON Center (optional but recommended)',
    },
    {
      displayName: 'Wallet Mnemonic',
      name: 'mnemonic',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      displayOptions: {
        show: {
          network: ['ton', 'algorand'],
        },
      },
      description: 'Wallet mnemonic phrase (24 words)',
    },
    // Algorand-specific fields
    {
      displayName: 'Indexer Server URL',
      name: 'indexerServer',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          network: ['algorand'],
        },
      },
      description: 'Algorand Indexer Server URL (optional, for transaction history)',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {},
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.rpcUrl || "https://eth.llamarpc.com"}}',
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    },
  };
}
