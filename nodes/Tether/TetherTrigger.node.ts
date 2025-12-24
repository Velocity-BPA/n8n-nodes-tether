/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  ITriggerFunctions,
  INodeType,
  INodeTypeDescription,
  ITriggerResponse,
  IDataObject,
} from 'n8n-workflow';

import { EvmClient } from './transport/evmClient';
import { MarketDataClient } from './transport/marketDataApi';
import { NETWORK_OPTIONS, NETWORKS } from './constants/networks';
import { formatUsdtAmount } from './utils/amountUtils';

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

export class TetherTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Tether Trigger',
    name: 'tetherTrigger',
    icon: 'file:tether.svg',
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["event"]}}',
    description: 'Trigger on Tether USDT events across multiple blockchains',
    defaults: {
      name: 'Tether Trigger',
    },
    inputs: [],
    outputs: ['main'],
    credentials: [
      {
        name: 'tetherBlockchain',
        required: false,
      },
    ],
    polling: true,
    properties: [
      {
        displayName: 'Event',
        name: 'event',
        type: 'options',
        options: [
          { name: 'Transfer Received', value: 'transferReceived', description: 'Trigger when USDT is received' },
          { name: 'Transfer Sent', value: 'transferSent', description: 'Trigger when USDT is sent' },
          { name: 'Large Transfer', value: 'largeTransfer', description: 'Trigger on large USDT transfers' },
          { name: 'Balance Changed', value: 'balanceChanged', description: 'Trigger when balance changes' },
          { name: 'Balance Threshold', value: 'balanceThreshold', description: 'Trigger when balance crosses threshold' },
          { name: 'Price Deviation', value: 'priceDeviation', description: 'Trigger on USDT depeg' },
          { name: 'Supply Changed', value: 'supplyChanged', description: 'Trigger when total supply changes' },
        ],
        default: 'transferReceived',
        description: 'Event to trigger on',
      },
      {
        displayName: 'Network',
        name: 'network',
        type: 'options',
        options: NETWORK_OPTIONS,
        default: 'ethereum',
        displayOptions: {
          show: {
            event: ['transferReceived', 'transferSent', 'largeTransfer', 'balanceChanged', 'balanceThreshold', 'supplyChanged'],
          },
        },
        description: 'Blockchain network to monitor',
      },
      {
        displayName: 'Watch Address',
        name: 'watchAddress',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            event: ['transferReceived', 'transferSent', 'balanceChanged', 'balanceThreshold'],
          },
        },
        description: 'Address to monitor',
      },
      {
        displayName: 'Threshold Amount',
        name: 'thresholdAmount',
        type: 'string',
        default: '1000000',
        displayOptions: {
          show: {
            event: ['largeTransfer'],
          },
        },
        description: 'Minimum USDT amount to trigger on (e.g., 1000000 for $1M)',
      },
      {
        displayName: 'Balance Threshold',
        name: 'balanceThreshold',
        type: 'string',
        default: '10000',
        displayOptions: {
          show: {
            event: ['balanceThreshold'],
          },
        },
        description: 'USDT balance threshold',
      },
      {
        displayName: 'Threshold Type',
        name: 'thresholdType',
        type: 'options',
        options: [
          { name: 'Below', value: 'below' },
          { name: 'Above', value: 'above' },
        ],
        default: 'below',
        displayOptions: {
          show: {
            event: ['balanceThreshold'],
          },
        },
        description: 'Trigger when balance goes below or above threshold',
      },
      {
        displayName: 'Deviation Threshold (%)',
        name: 'deviationThreshold',
        type: 'number',
        default: 1,
        displayOptions: {
          show: {
            event: ['priceDeviation'],
          },
        },
        description: 'Price deviation percentage to trigger alert (e.g., 1 = 1%)',
      },
      {
        displayName: 'Poll Interval',
        name: 'pollInterval',
        type: 'number',
        default: 60,
        description: 'How often to check for events (in seconds)',
      },
    ],
  };

  async poll(this: ITriggerFunctions): Promise<ITriggerResponse | null> {
    // Show licensing notice once per node load
    showLicensingNotice();

    const event = this.getNodeParameter('event') as string;
    const pollInterval = this.getNodeParameter('pollInterval') as number;
    const webhookData = this.getWorkflowStaticData('node');
    const returnData: IDataObject[] = [];

    try {
      let blockchainCreds: IDataObject | undefined;
      try {
        blockchainCreds = await this.getCredentials('tetherBlockchain') as IDataObject;
      } catch {
        // Credentials may not be required for all events
      }

      // Transfer Received / Transfer Sent / Large Transfer
      if (['transferReceived', 'transferSent', 'largeTransfer'].includes(event)) {
        const network = this.getNodeParameter('network') as string;
        const networkConfig = NETWORKS[network];

        if (networkConfig?.type === 'evm') {
          const client = new EvmClient({
            network,
            rpcUrl: blockchainCreds?.rpcUrl as string,
          });

          const currentBlock = await client.getBlockNumber();
          const lastProcessedBlock = (webhookData.lastBlock as number) || currentBlock - 100;

          if (event === 'largeTransfer') {
            const thresholdAmount = this.getNodeParameter('thresholdAmount') as string;
            const thresholdRaw = BigInt(thresholdAmount) * BigInt(10 ** 6); // Assuming 6 decimals

            // This would require more sophisticated event filtering
            // For now, return basic monitoring data
            returnData.push({
              event: 'largeTransfer',
              network,
              monitoring: true,
              threshold: thresholdAmount,
              currentBlock,
              lastProcessedBlock,
            });
          } else {
            const watchAddress = this.getNodeParameter('watchAddress') as string;
            
            if (watchAddress) {
              const events = await client.getTransferEvents(
                watchAddress,
                lastProcessedBlock + 1,
                currentBlock
              );

              for (const transferEvent of events) {
                if (event === 'transferReceived' && transferEvent.to.toLowerCase() === watchAddress.toLowerCase()) {
                  returnData.push({
                    event: 'transferReceived',
                    ...transferEvent,
                    network,
                    timestamp: new Date().toISOString(),
                  });
                }
                if (event === 'transferSent' && transferEvent.from.toLowerCase() === watchAddress.toLowerCase()) {
                  returnData.push({
                    event: 'transferSent',
                    ...transferEvent,
                    network,
                    timestamp: new Date().toISOString(),
                  });
                }
              }
            }
          }

          webhookData.lastBlock = currentBlock;
        }
      }

      // Balance Changed / Balance Threshold
      if (['balanceChanged', 'balanceThreshold'].includes(event)) {
        const network = this.getNodeParameter('network') as string;
        const watchAddress = this.getNodeParameter('watchAddress') as string;
        const networkConfig = NETWORKS[network];

        if (networkConfig?.type === 'evm') {
          const client = new EvmClient({
            network,
            rpcUrl: blockchainCreds?.rpcUrl as string,
          });

          const balanceResult = await client.getBalance(watchAddress);
          const currentBalance = parseFloat(balanceResult.balance);
          const lastBalance = webhookData.lastBalance as number;

          if (event === 'balanceChanged') {
            if (lastBalance !== undefined && currentBalance !== lastBalance) {
              returnData.push({
                event: 'balanceChanged',
                address: watchAddress,
                network,
                previousBalance: lastBalance.toString(),
                currentBalance: currentBalance.toString(),
                change: (currentBalance - lastBalance).toString(),
                timestamp: new Date().toISOString(),
              });
            }
          }

          if (event === 'balanceThreshold') {
            const balanceThreshold = parseFloat(this.getNodeParameter('balanceThreshold') as string);
            const thresholdType = this.getNodeParameter('thresholdType') as string;
            const wasAboveThreshold = (webhookData.wasAboveThreshold as boolean) ?? currentBalance >= balanceThreshold;

            if (thresholdType === 'below' && wasAboveThreshold && currentBalance < balanceThreshold) {
              returnData.push({
                event: 'balanceThreshold',
                type: 'below',
                address: watchAddress,
                network,
                threshold: balanceThreshold.toString(),
                currentBalance: currentBalance.toString(),
                timestamp: new Date().toISOString(),
              });
            }

            if (thresholdType === 'above' && !wasAboveThreshold && currentBalance >= balanceThreshold) {
              returnData.push({
                event: 'balanceThreshold',
                type: 'above',
                address: watchAddress,
                network,
                threshold: balanceThreshold.toString(),
                currentBalance: currentBalance.toString(),
                timestamp: new Date().toISOString(),
              });
            }

            webhookData.wasAboveThreshold = currentBalance >= balanceThreshold;
          }

          webhookData.lastBalance = currentBalance;
        }
      }

      // Price Deviation (Depeg Alert)
      if (event === 'priceDeviation') {
        const deviationThreshold = this.getNodeParameter('deviationThreshold') as number;
        const marketClient = new MarketDataClient();
        const depegCheck = await marketClient.checkDepeg(deviationThreshold / 100);

        if (depegCheck.isDepegged) {
          const wasDepegged = webhookData.wasDepegged as boolean;
          
          if (!wasDepegged) {
            returnData.push({
              event: 'priceDeviation',
              isDepegged: true,
              currentPrice: depegCheck.currentPrice,
              deviation: depegCheck.deviation,
              deviationPercentage: depegCheck.deviationPercentage,
              alertLevel: depegCheck.alertLevel,
              timestamp: new Date().toISOString(),
            });
          }
        }

        webhookData.wasDepegged = depegCheck.isDepegged;
      }

      // Supply Changed
      if (event === 'supplyChanged') {
        const network = this.getNodeParameter('network') as string;
        const networkConfig = NETWORKS[network];

        if (networkConfig?.type === 'evm') {
          const client = new EvmClient({
            network,
            rpcUrl: blockchainCreds?.rpcUrl as string,
          });

          const currentSupply = await client.getTotalSupply();
          const lastSupply = webhookData.lastSupply as string;

          if (lastSupply && currentSupply !== lastSupply) {
            returnData.push({
              event: 'supplyChanged',
              network,
              previousSupply: lastSupply,
              currentSupply,
              change: (parseFloat(currentSupply) - parseFloat(lastSupply)).toString(),
              timestamp: new Date().toISOString(),
            });
          }

          webhookData.lastSupply = currentSupply;
        }
      }

    } catch (error) {
      // Log error but don't throw to keep polling
      console.error('TetherTrigger error:', error);
    }

    if (returnData.length === 0) {
      return null;
    }

    return {
      workflowData: [this.helpers.returnJsonArray(returnData)],
    };
  }
}
