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

export class TetherApi implements ICredentialType {
  name = 'tetherApi';
  displayName = 'Tether API';
  documentationUrl = 'https://github.com/Velocity-BPA/n8n-nodes-tether';
  
  properties: INodeProperties[] = [
    {
      displayName: 'API Type',
      name: 'apiType',
      type: 'options',
      options: [
        { name: 'Transparency API', value: 'transparency' },
        { name: 'Market Data (CoinGecko)', value: 'coingecko' },
        { name: 'Custom API', value: 'custom' },
      ],
      default: 'transparency',
      description: 'Type of API to connect to',
    },
    {
      displayName: 'API Endpoint',
      name: 'apiEndpoint',
      type: 'string',
      default: 'https://app.tether.to/api/v1',
      description: 'Base URL for the API',
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'API key (if required)',
    },
    {
      displayName: 'CoinGecko API Key',
      name: 'coingeckoApiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      displayOptions: {
        show: {
          apiType: ['coingecko'],
        },
      },
      description: 'CoinGecko API key (optional, for higher rate limits)',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.apiEndpoint}}',
      url: '/transparency',
      method: 'GET',
    },
  };
}
