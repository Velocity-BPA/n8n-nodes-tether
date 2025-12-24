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

export class ExchangeApi implements ICredentialType {
  name = 'exchangeApi';
  displayName = 'Exchange API (for USDT)';
  documentationUrl = 'https://github.com/Velocity-BPA/n8n-nodes-tether';
  
  properties: INodeProperties[] = [
    {
      displayName: 'Exchange',
      name: 'exchange',
      type: 'options',
      options: [
        { name: 'Binance', value: 'binance' },
        { name: 'Coinbase', value: 'coinbase' },
        { name: 'Kraken', value: 'kraken' },
        { name: 'Bitfinex', value: 'bitfinex' },
        { name: 'OKX', value: 'okx' },
        { name: 'Bybit', value: 'bybit' },
        { name: 'KuCoin', value: 'kucoin' },
        { name: 'Huobi', value: 'huobi' },
        { name: 'Gate.io', value: 'gateio' },
        { name: 'Custom', value: 'custom' },
      ],
      default: 'binance',
      description: 'Select the exchange',
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'Exchange API key',
    },
    {
      displayName: 'API Secret',
      name: 'apiSecret',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'Exchange API secret',
    },
    {
      displayName: 'API Passphrase',
      name: 'apiPassphrase',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      displayOptions: {
        show: {
          exchange: ['coinbase', 'okx', 'kucoin'],
        },
      },
      description: 'API passphrase (required for some exchanges)',
    },
    {
      displayName: 'Use Testnet',
      name: 'testnet',
      type: 'boolean',
      default: false,
      description: 'Whether to use the exchange testnet',
    },
    {
      displayName: 'Custom API URL',
      name: 'customApiUrl',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          exchange: ['custom'],
        },
      },
      description: 'Custom exchange API base URL',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'X-MBX-APIKEY': '={{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.binance.com',
      url: '/api/v3/ping',
      method: 'GET',
    },
  };
}
