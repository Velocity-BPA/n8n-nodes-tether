/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IDataObject,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { EvmClient } from './transport/evmClient';
import { TronClient } from './transport/tronClient';
import { SolanaClient } from './transport/solanaClient';
import { TonClientWrapper } from './transport/tonClient';
import { AlgorandClient } from './transport/algorandClient';
import { TransparencyClient } from './transport/transparencyApi';
import { MarketDataClient } from './transport/marketDataApi';
import { NETWORKS, NETWORK_OPTIONS } from './constants/networks';
import { USDT_CONTRACTS, USDT_DECIMALS } from './constants/contracts';
import { isValidAddress, getTxExplorerUrl, getAddressExplorerUrl } from './utils/addressUtils';
import { formatUsdtAmount, parseUsdtAmount, convertUsdtBetweenNetworks } from './utils/amountUtils';
import { estimateTransferFee, compareTransferFees, getAvailableBridges } from './utils/chainUtils';

// Licensing notice - logged once per node load
let licensingNoticeShown = false;
function showLicensingNotice(): void {
  if (!licensingNoticeShown) {
    console.warn(`[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
`);
    licensingNoticeShown = true;
  }
}

export class Tether implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Tether',
    name: 'tether',
    icon: 'file:tether.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with Tether USDT across 15+ blockchain networks',
    defaults: {
      name: 'Tether',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'tetherBlockchain',
        required: false,
      },
      {
        name: 'tetherApi',
        required: false,
      },
      {
        name: 'exchangeApi',
        required: false,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'USDT (Multi-Chain)', value: 'usdt' },
          { name: 'Ethereum (ERC-20)', value: 'ethereum' },
          { name: 'Tron (TRC-20)', value: 'tron' },
          { name: 'Solana (SPL)', value: 'solana' },
          { name: 'Polygon', value: 'polygon' },
          { name: 'Arbitrum', value: 'arbitrum' },
          { name: 'Optimism', value: 'optimism' },
          { name: 'BNB Chain (BEP-20)', value: 'bnbChain' },
          { name: 'Avalanche', value: 'avalanche' },
          { name: 'TON', value: 'ton' },
          { name: 'Algorand (ASA)', value: 'algorand' },
          { name: 'Transparency', value: 'transparency' },
          { name: 'Compliance', value: 'compliance' },
          { name: 'Market Data', value: 'marketData' },
          { name: 'Bridge', value: 'bridge' },
          { name: 'Contract', value: 'contract' },
          { name: 'Utility', value: 'utility' },
        ],
        default: 'usdt',
      },

      // USDT Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['usdt'] } },
        options: [
          { name: 'Get Balance', value: 'getBalance', action: 'Get USDT balance' },
          { name: 'Transfer', value: 'transfer', action: 'Transfer USDT' },
          { name: 'Get Total Supply', value: 'getTotalSupply', action: 'Get total supply' },
          { name: 'Approve Spending', value: 'approve', action: 'Approve spending' },
          { name: 'Get Allowance', value: 'getAllowance', action: 'Get allowance' },
          { name: 'Check Blacklist', value: 'checkBlacklist', action: 'Check blacklist status' },
          { name: 'Get Price', value: 'getPrice', action: 'Get USDT price' },
        ],
        default: 'getBalance',
      },

      // Ethereum Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bnbChain', 'avalanche'] } },
        options: [
          { name: 'Get Balance', value: 'getBalance', action: 'Get balance' },
          { name: 'Transfer', value: 'transfer', action: 'Transfer' },
          { name: 'Approve Spending', value: 'approve', action: 'Approve spending' },
          { name: 'Get Allowance', value: 'getAllowance', action: 'Get allowance' },
          { name: 'Transfer From', value: 'transferFrom', action: 'Transfer from' },
          { name: 'Get Transfer Events', value: 'getTransferEvents', action: 'Get transfer events' },
          { name: 'Get Contract Info', value: 'getContractInfo', action: 'Get contract info' },
          { name: 'Check Blacklist', value: 'checkBlacklist', action: 'Check blacklist' },
          { name: 'Check Paused', value: 'checkPaused', action: 'Check if paused' },
          { name: 'Estimate Gas', value: 'estimateGas', action: 'Estimate gas' },
        ],
        default: 'getBalance',
      },

      // Tron Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['tron'] } },
        options: [
          { name: 'Get Balance', value: 'getBalance', action: 'Get balance' },
          { name: 'Transfer', value: 'transfer', action: 'Transfer' },
          { name: 'Approve Spending', value: 'approve', action: 'Approve spending' },
          { name: 'Get Allowance', value: 'getAllowance', action: 'Get allowance' },
          { name: 'Get Account Resources', value: 'getAccountResources', action: 'Get resources' },
          { name: 'Estimate Energy', value: 'estimateEnergy', action: 'Estimate energy' },
          { name: 'Get Transaction Info', value: 'getTransactionInfo', action: 'Get transaction' },
          { name: 'Get Contract Info', value: 'getContractInfo', action: 'Get contract info' },
        ],
        default: 'getBalance',
      },

      // Solana Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['solana'] } },
        options: [
          { name: 'Get Balance', value: 'getBalance', action: 'Get balance' },
          { name: 'Transfer', value: 'transfer', action: 'Transfer' },
          { name: 'Get Token Account', value: 'getTokenAccount', action: 'Get token account' },
          { name: 'Create Token Account', value: 'createTokenAccount', action: 'Create account' },
          { name: 'Get Mint Info', value: 'getMintInfo', action: 'Get mint info' },
          { name: 'Get Transfer History', value: 'getTransferHistory', action: 'Get history' },
          { name: 'Estimate Fee', value: 'estimateFee', action: 'Estimate fee' },
        ],
        default: 'getBalance',
      },

      // TON Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['ton'] } },
        options: [
          { name: 'Get Balance', value: 'getBalance', action: 'Get balance' },
          { name: 'Transfer', value: 'transfer', action: 'Transfer' },
          { name: 'Get Jetton Wallet', value: 'getJettonWallet', action: 'Get jetton wallet' },
          { name: 'Get Jetton Master', value: 'getJettonMaster', action: 'Get jetton master' },
          { name: 'Get Transaction History', value: 'getTransactionHistory', action: 'Get history' },
          { name: 'Estimate Fee', value: 'estimateFee', action: 'Estimate fee' },
        ],
        default: 'getBalance',
      },

      // Algorand Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['algorand'] } },
        options: [
          { name: 'Get Balance', value: 'getBalance', action: 'Get balance' },
          { name: 'Transfer', value: 'transfer', action: 'Transfer' },
          { name: 'Opt-In', value: 'optIn', action: 'Opt-in to USDT' },
          { name: 'Close Position', value: 'closePosition', action: 'Close position' },
          { name: 'Get Asset Info', value: 'getAssetInfo', action: 'Get asset info' },
          { name: 'Estimate Fee', value: 'estimateFee', action: 'Estimate fee' },
        ],
        default: 'getBalance',
      },

      // Transparency Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['transparency'] } },
        options: [
          { name: 'Get Total Supply', value: 'getTotalSupply', action: 'Get total supply' },
          { name: 'Get Supply by Chain', value: 'getSupplyByChain', action: 'Get supply by chain' },
          { name: 'Get Reserve Breakdown', value: 'getReserveBreakdown', action: 'Get reserves' },
          { name: 'Get Historical Supply', value: 'getHistoricalSupply', action: 'Get history' },
          { name: 'Get Issuance Events', value: 'getIssuanceEvents', action: 'Get issuance events' },
          { name: 'Get Audit Reports', value: 'getAuditReports', action: 'Get audit reports' },
        ],
        default: 'getTotalSupply',
      },

      // Market Data Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['marketData'] } },
        options: [
          { name: 'Get Price', value: 'getPrice', action: 'Get USDT price' },
          { name: 'Get Market Data', value: 'getMarketData', action: 'Get market data' },
          { name: 'Get Volume', value: 'getVolume', action: 'Get trading volume' },
          { name: 'Get Price History', value: 'getPriceHistory', action: 'Get price history' },
          { name: 'Check Depeg', value: 'checkDepeg', action: 'Check depeg status' },
          { name: 'Get Spread Data', value: 'getSpreadData', action: 'Get spread data' },
          { name: 'Get Stablecoin Dominance', value: 'getDominance', action: 'Get dominance' },
        ],
        default: 'getPrice',
      },

      // Bridge Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['bridge'] } },
        options: [
          { name: 'Get Available Bridges', value: 'getAvailableBridges', action: 'Get bridges' },
          { name: 'Compare Bridge Options', value: 'compareBridges', action: 'Compare bridges' },
          { name: 'Get Recommended Route', value: 'getRecommendedRoute', action: 'Get route' },
        ],
        default: 'getAvailableBridges',
      },

      // Utility Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['utility'] } },
        options: [
          { name: 'Convert Units', value: 'convertUnits', action: 'Convert units' },
          { name: 'Validate Address', value: 'validateAddress', action: 'Validate address' },
          { name: 'Get Chain Info', value: 'getChainInfo', action: 'Get chain info' },
          { name: 'Compare Fees', value: 'compareFees', action: 'Compare fees' },
          { name: 'Get Explorer URL', value: 'getExplorerUrl', action: 'Get explorer URL' },
        ],
        default: 'validateAddress',
      },

      // Common Parameters
      {
        displayName: 'Network',
        name: 'network',
        type: 'options',
        options: NETWORK_OPTIONS,
        default: 'ethereum',
        displayOptions: {
          show: {
            resource: ['usdt', 'contract', 'compliance'],
          },
        },
        description: 'Blockchain network',
      },
      {
        displayName: 'Address',
        name: 'address',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['getBalance', 'checkBlacklist', 'getTransferEvents', 'getAccountResources', 'getTokenAccount', 'getJettonWallet', 'validateAddress'],
          },
        },
        description: 'Wallet or contract address',
      },
      {
        displayName: 'To Address',
        name: 'toAddress',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['transfer', 'approve', 'transferFrom', 'closePosition'],
          },
        },
        description: 'Recipient address',
      },
      {
        displayName: 'Amount',
        name: 'amount',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['transfer', 'approve', 'transferFrom', 'convertUnits'],
          },
        },
        description: 'Amount in USDT',
      },
      {
        displayName: 'Owner Address',
        name: 'ownerAddress',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['getAllowance', 'transferFrom', 'createTokenAccount'],
          },
        },
        description: 'Owner address',
      },
      {
        displayName: 'Spender Address',
        name: 'spenderAddress',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['getAllowance'],
          },
        },
        description: 'Spender address',
      },
      {
        displayName: 'From Address',
        name: 'fromAddress',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['transferFrom'],
          },
        },
        description: 'Address to transfer from',
      },
      {
        displayName: 'Transaction Hash',
        name: 'txHash',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['getTransactionInfo', 'getExplorerUrl'],
          },
        },
        description: 'Transaction hash/ID',
      },
      {
        displayName: 'Days',
        name: 'days',
        type: 'number',
        default: 30,
        displayOptions: {
          show: {
            operation: ['getHistoricalSupply', 'getPriceHistory'],
          },
        },
        description: 'Number of days for historical data',
      },
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        default: 20,
        displayOptions: {
          show: {
            operation: ['getTransferEvents', 'getIssuanceEvents', 'getTransferHistory', 'getTransactionHistory'],
          },
        },
        description: 'Maximum number of results',
      },
      {
        displayName: 'From Network',
        name: 'fromNetwork',
        type: 'options',
        options: NETWORK_OPTIONS,
        default: 'ethereum',
        displayOptions: {
          show: {
            operation: ['getAvailableBridges', 'compareBridges', 'getRecommendedRoute', 'convertUnits'],
          },
        },
        description: 'Source network',
      },
      {
        displayName: 'To Network',
        name: 'toNetwork',
        type: 'options',
        options: NETWORK_OPTIONS,
        default: 'polygon',
        displayOptions: {
          show: {
            operation: ['getAvailableBridges', 'compareBridges', 'getRecommendedRoute', 'convertUnits'],
          },
        },
        description: 'Destination network',
      },
      {
        displayName: 'Depeg Threshold',
        name: 'depegThreshold',
        type: 'number',
        default: 0.02,
        displayOptions: {
          show: {
            operation: ['checkDepeg'],
          },
        },
        description: 'Threshold for depeg alert (e.g., 0.02 = 2%)',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Show licensing notice once per node load
    showLicensingNotice();

    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const resource = this.getNodeParameter('resource', i) as string;
        const operation = this.getNodeParameter('operation', i) as string;
        let result: IDataObject = {};

        // Get credentials
        let blockchainCreds: IDataObject | undefined;
        let apiCreds: IDataObject | undefined;

        try {
          blockchainCreds = await this.getCredentials('tetherBlockchain', i) as IDataObject;
        } catch {
          // Credentials not required for all operations
        }

        try {
          apiCreds = await this.getCredentials('tetherApi', i) as IDataObject;
        } catch {
          // Credentials not required for all operations
        }

        // USDT Multi-Chain Resource
        if (resource === 'usdt') {
          const network = this.getNodeParameter('network', i) as string;
          const networkConfig = NETWORKS[network];

          if (!networkConfig) {
            throw new NodeOperationError(this.getNode(), `Unknown network: ${network}`);
          }

          if (operation === 'getBalance') {
            const address = this.getNodeParameter('address', i) as string;
            
            if (networkConfig.type === 'evm') {
              const client = new EvmClient({
                network,
                rpcUrl: blockchainCreds?.rpcUrl as string,
                privateKey: blockchainCreds?.privateKey as string,
              });
              const balance = await client.getBalance(address);
              result = balance as unknown as IDataObject;
            } else if (networkConfig.type === 'tron') {
              const client = new TronClient({
                network: network as 'tron' | 'tronShasta',
                fullNode: blockchainCreds?.rpcUrl as string,
                privateKey: blockchainCreds?.privateKey as string,
              });
              const balance = await client.getBalance(address);
              result = balance as unknown as IDataObject;
            } else if (networkConfig.type === 'solana') {
              const client = new SolanaClient({
                network: network as 'solana' | 'solanaDevnet',
                rpcUrl: blockchainCreds?.rpcUrl as string,
                privateKey: blockchainCreds?.privateKey as string,
              });
              const balance = await client.getBalance(address);
              result = balance as unknown as IDataObject;
            }
          }

          if (operation === 'transfer') {
            const toAddress = this.getNodeParameter('toAddress', i) as string;
            const amount = this.getNodeParameter('amount', i) as string;

            if (!blockchainCreds?.privateKey) {
              throw new NodeOperationError(this.getNode(), 'Private key required for transfers');
            }

            if (networkConfig.type === 'evm') {
              const client = new EvmClient({
                network,
                rpcUrl: blockchainCreds?.rpcUrl as string,
                privateKey: blockchainCreds.privateKey as string,
              });
              const transferResult = await client.transfer(toAddress, amount);
              result = transferResult as unknown as IDataObject;
            } else if (networkConfig.type === 'tron') {
              const client = new TronClient({
                network: network as 'tron' | 'tronShasta',
                fullNode: blockchainCreds?.rpcUrl as string,
                privateKey: blockchainCreds.privateKey as string,
              });
              const transferResult = await client.transfer(toAddress, amount);
              result = transferResult as unknown as IDataObject;
            }
          }

          if (operation === 'getTotalSupply') {
            if (networkConfig.type === 'evm') {
              const client = new EvmClient({ network, rpcUrl: blockchainCreds?.rpcUrl as string });
              const supply = await client.getTotalSupply();
              result = { network, totalSupply: supply, decimals: USDT_DECIMALS[network] };
            }
          }

          if (operation === 'getPrice') {
            const marketClient = new MarketDataClient();
            const price = await marketClient.getPrice();
            result = price as unknown as IDataObject;
          }

          if (operation === 'checkBlacklist') {
            const address = this.getNodeParameter('address', i) as string;
            if (networkConfig.type === 'evm') {
              const client = new EvmClient({ network, rpcUrl: blockchainCreds?.rpcUrl as string });
              const isBlacklisted = await client.isBlacklisted(address);
              result = { address, network, isBlacklisted };
            }
          }
        }

        // EVM Chain Resources (Ethereum, Polygon, etc.)
        if (['ethereum', 'polygon', 'arbitrum', 'optimism', 'bnbChain', 'avalanche'].includes(resource)) {
          const client = new EvmClient({
            network: resource,
            rpcUrl: blockchainCreds?.rpcUrl as string,
            privateKey: blockchainCreds?.privateKey as string,
          });

          if (operation === 'getBalance') {
            const address = this.getNodeParameter('address', i) as string;
            const balance = await client.getBalance(address);
            result = balance as unknown as IDataObject;
          }

          if (operation === 'transfer') {
            const toAddress = this.getNodeParameter('toAddress', i) as string;
            const amount = this.getNodeParameter('amount', i) as string;
            const transferResult = await client.transfer(toAddress, amount);
            result = transferResult as unknown as IDataObject;
          }

          if (operation === 'approve') {
            const toAddress = this.getNodeParameter('toAddress', i) as string;
            const amount = this.getNodeParameter('amount', i) as string;
            const approveResult = await client.approve(toAddress, amount);
            result = approveResult as unknown as IDataObject;
          }

          if (operation === 'getAllowance') {
            const ownerAddress = this.getNodeParameter('ownerAddress', i) as string;
            const spenderAddress = this.getNodeParameter('spenderAddress', i) as string;
            const allowance = await client.getAllowance(ownerAddress, spenderAddress);
            result = { owner: ownerAddress, spender: spenderAddress, allowance };
          }

          if (operation === 'getContractInfo') {
            const info = await client.getContractInfo();
            result = info as unknown as IDataObject;
          }

          if (operation === 'checkBlacklist') {
            const address = this.getNodeParameter('address', i) as string;
            const isBlacklisted = await client.isBlacklisted(address);
            result = { address, isBlacklisted };
          }

          if (operation === 'checkPaused') {
            const isPaused = await client.isPaused();
            result = { network: resource, isPaused };
          }

          if (operation === 'estimateGas') {
            const toAddress = this.getNodeParameter('toAddress', i) as string;
            const amount = this.getNodeParameter('amount', i) as string;
            const estimate = await client.estimateTransferGas(toAddress, amount);
            result = estimate as unknown as IDataObject;
          }
        }

        // Tron Resource
        if (resource === 'tron') {
          const client = new TronClient({
            network: 'tron',
            fullNode: blockchainCreds?.rpcUrl as string,
            privateKey: blockchainCreds?.privateKey as string,
          });

          if (operation === 'getBalance') {
            const address = this.getNodeParameter('address', i) as string;
            const balance = await client.getBalance(address);
            result = balance as unknown as IDataObject;
          }

          if (operation === 'transfer') {
            const toAddress = this.getNodeParameter('toAddress', i) as string;
            const amount = this.getNodeParameter('amount', i) as string;
            const transferResult = await client.transfer(toAddress, amount);
            result = transferResult as unknown as IDataObject;
          }

          if (operation === 'getAccountResources') {
            const address = this.getNodeParameter('address', i) as string;
            const resources = await client.getAccountResources(address);
            result = resources as unknown as IDataObject;
          }

          if (operation === 'getContractInfo') {
            const info = await client.getContractInfo();
            result = info as unknown as IDataObject;
          }
        }

        // Solana Resource
        if (resource === 'solana') {
          const client = new SolanaClient({
            network: 'solana',
            rpcUrl: blockchainCreds?.rpcUrl as string,
            privateKey: blockchainCreds?.privateKey as string,
          });

          if (operation === 'getBalance') {
            const address = this.getNodeParameter('address', i) as string;
            const balance = await client.getBalance(address);
            result = balance as unknown as IDataObject;
          }

          if (operation === 'transfer') {
            const toAddress = this.getNodeParameter('toAddress', i) as string;
            const amount = this.getNodeParameter('amount', i) as string;
            const transferResult = await client.transfer(toAddress, amount);
            result = transferResult as unknown as IDataObject;
          }

          if (operation === 'getMintInfo') {
            const info = await client.getMintInfo();
            result = info as unknown as IDataObject;
          }

          if (operation === 'estimateFee') {
            const fee = await client.estimateFee();
            result = fee as unknown as IDataObject;
          }
        }

        // Transparency Resource
        if (resource === 'transparency') {
          const client = new TransparencyClient();

          if (operation === 'getTotalSupply') {
            const supply = await client.getTotalSupply();
            result = supply as unknown as IDataObject;
          }

          if (operation === 'getSupplyByChain') {
            const supply = await client.getSupplyByChain();
            result = { chains: supply };
          }

          if (operation === 'getReserveBreakdown') {
            const reserves = await client.getReserveBreakdown();
            result = reserves as unknown as IDataObject;
          }

          if (operation === 'getAuditReports') {
            const reports = await client.getAuditReports();
            result = { reports };
          }
        }

        // Market Data Resource
        if (resource === 'marketData') {
          const client = new MarketDataClient({
            coingeckoApiKey: apiCreds?.coingeckoApiKey as string,
          });

          if (operation === 'getPrice') {
            const price = await client.getPrice();
            result = price as unknown as IDataObject;
          }

          if (operation === 'getMarketData') {
            const data = await client.getMarketData();
            result = data as unknown as IDataObject;
          }

          if (operation === 'getVolume') {
            const volume = await client.getVolumeData();
            result = volume as unknown as IDataObject;
          }

          if (operation === 'getPriceHistory') {
            const days = this.getNodeParameter('days', i) as number;
            const history = await client.getPriceHistory(days);
            result = { history };
          }

          if (operation === 'checkDepeg') {
            const threshold = this.getNodeParameter('depegThreshold', i) as number;
            const depeg = await client.checkDepeg(threshold);
            result = depeg as unknown as IDataObject;
          }

          if (operation === 'getSpreadData') {
            const spread = await client.getSpreadData();
            result = { exchanges: spread };
          }

          if (operation === 'getDominance') {
            const dominance = await client.getStablecoinDominance();
            result = dominance as unknown as IDataObject;
          }
        }

        // Bridge Resource
        if (resource === 'bridge') {
          if (operation === 'getAvailableBridges') {
            const fromNetwork = this.getNodeParameter('fromNetwork', i) as string;
            const toNetwork = this.getNodeParameter('toNetwork', i) as string;
            const bridges = getAvailableBridges(fromNetwork, toNetwork);
            result = { fromNetwork, toNetwork, bridges };
          }

          if (operation === 'compareBridges') {
            const fromNetwork = this.getNodeParameter('fromNetwork', i) as string;
            const toNetwork = this.getNodeParameter('toNetwork', i) as string;
            const bridges = getAvailableBridges(fromNetwork, toNetwork);
            result = {
              fromNetwork,
              toNetwork,
              bridges: bridges.map((b) => ({
                name: b.name,
                type: b.type,
                estimatedTime: b.estimatedTime,
                website: b.website,
              })),
            };
          }
        }

        // Utility Resource
        if (resource === 'utility') {
          if (operation === 'validateAddress') {
            const address = this.getNodeParameter('address', i) as string;
            const network = this.getNodeParameter('network', i) as string;
            const valid = isValidAddress(address, network);
            result = { address, network, valid };
          }

          if (operation === 'getChainInfo') {
            const network = this.getNodeParameter('network', i) as string;
            const config = NETWORKS[network];
            result = {
              network,
              name: config?.name,
              type: config?.type,
              chainId: config?.chainId,
              usdtContract: USDT_CONTRACTS[network],
              usdtDecimals: USDT_DECIMALS[network],
              explorerUrl: config?.explorerUrl,
            };
          }

          if (operation === 'compareFees') {
            const fees = compareTransferFees();
            result = { fees };
          }

          if (operation === 'convertUnits') {
            const amount = this.getNodeParameter('amount', i) as string;
            const fromNetwork = this.getNodeParameter('fromNetwork', i) as string;
            const toNetwork = this.getNodeParameter('toNetwork', i) as string;
            const fromRaw = parseUsdtAmount(amount, fromNetwork);
            const toRaw = convertUsdtBetweenNetworks(fromRaw, fromNetwork, toNetwork);
            result = {
              originalAmount: amount,
              fromNetwork,
              toNetwork,
              fromRaw: fromRaw.toString(),
              toRaw: toRaw.toString(),
              toFormatted: formatUsdtAmount(toRaw, toNetwork),
            };
          }

          if (operation === 'getExplorerUrl') {
            const txHash = this.getNodeParameter('txHash', i) as string;
            const network = this.getNodeParameter('network', i) as string;
            const url = getTxExplorerUrl(txHash, network);
            result = { txHash, network, explorerUrl: url };
          }
        }

        returnData.push({ json: result });
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({ json: { error: (error as Error).message } });
        } else {
          throw error;
        }
      }
    }

    return [returnData];
  }
}
