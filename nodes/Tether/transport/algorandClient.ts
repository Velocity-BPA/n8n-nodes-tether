/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Algorand Client for ASA USDT operations
 * 
 * @author Velocity BPA
 * @website https://velobpa.com
 */

import algosdk from 'algosdk';
import { NETWORKS } from '../constants/networks';
import { USDT_CONTRACTS } from '../constants/contracts';
import { formatUsdtAmount, parseUsdtAmount } from '../utils/amountUtils';

export interface AlgorandClientConfig {
  network: 'algorand';
  algodServer?: string;
  algodPort?: number;
  algodToken?: string;
  indexerServer?: string;
  indexerPort?: number;
  indexerToken?: string;
  mnemonic?: string;
}

export interface AlgorandTransferResult {
  success: boolean;
  txId: string;
  from: string;
  to: string;
  amount: string;
  network: string;
  explorerUrl: string;
  fee?: string;
}

export interface AlgorandBalanceResult {
  address: string;
  balance: string;
  balanceRaw: string;
  network: string;
  decimals: number;
  optedIn: boolean;
}

export class AlgorandClient {
  private algodClient: algosdk.Algodv2;
  private indexerClient: algosdk.Indexer | null = null;
  private account: algosdk.Account | null = null;
  private network: string;
  private networkConfig: typeof NETWORKS[string];
  private assetId: number;

  constructor(config: AlgorandClientConfig) {
    const networkConfig = NETWORKS[config.network];
    if (!networkConfig) {
      throw new Error(`Unknown network: ${config.network}`);
    }
    if (networkConfig.type !== 'algorand') {
      throw new Error(`Network ${config.network} is not an Algorand network`);
    }

    this.network = config.network;
    this.networkConfig = networkConfig;
    this.assetId = parseInt(USDT_CONTRACTS[config.network], 10);

    const algodServer = config.algodServer || 'https://mainnet-api.algonode.cloud';
    const algodToken = config.algodToken || '';

    this.algodClient = new algosdk.Algodv2(algodToken, algodServer, config.algodPort || 443);

    if (config.indexerServer) {
      const indexerToken = config.indexerToken || '';
      this.indexerClient = new algosdk.Indexer(
        indexerToken,
        config.indexerServer,
        config.indexerPort || 443
      );
    }

    if (config.mnemonic) {
      this.account = algosdk.mnemonicToSecretKey(config.mnemonic);
    }
  }

  /**
   * Get USDT balance for an Algorand address
   */
  async getBalance(address: string): Promise<AlgorandBalanceResult> {
    const accountInfo = await this.algodClient.accountInformation(address).do();
    const decimals = this.networkConfig.usdtDecimals;

    // Find USDT asset in account's assets
    const asset = accountInfo.assets?.find(
      (a: { 'asset-id': number }) => a['asset-id'] === this.assetId
    );

    if (!asset) {
      return {
        address,
        balance: '0',
        balanceRaw: '0',
        network: this.network,
        decimals,
        optedIn: false,
      };
    }

    return {
      address,
      balance: formatUsdtAmount(asset.amount.toString(), this.network),
      balanceRaw: asset.amount.toString(),
      network: this.network,
      decimals,
      optedIn: true,
    };
  }

  /**
   * Get asset info
   */
  async getAssetInfo(): Promise<{
    assetId: number;
    name: string;
    unitName: string;
    decimals: number;
    totalSupply: string;
    creator: string;
    manager: string | null;
    reserve: string | null;
    freeze: string | null;
    clawback: string | null;
  }> {
    const assetInfo = await this.algodClient.getAssetByID(this.assetId).do();

    return {
      assetId: this.assetId,
      name: assetInfo.params.name || 'USDT',
      unitName: assetInfo.params['unit-name'] || 'USDT',
      decimals: assetInfo.params.decimals,
      totalSupply: formatUsdtAmount(assetInfo.params.total.toString(), this.network),
      creator: assetInfo.params.creator,
      manager: assetInfo.params.manager || null,
      reserve: assetInfo.params.reserve || null,
      freeze: assetInfo.params.freeze || null,
      clawback: assetInfo.params.clawback || null,
    };
  }

  /**
   * Opt-in to USDT (required before receiving)
   */
  async optIn(): Promise<AlgorandTransferResult> {
    if (!this.account) {
      throw new Error('Account not configured. Mnemonic required.');
    }

    const params = await this.algodClient.getTransactionParams().do();
    
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: this.account.addr,
      to: this.account.addr,
      amount: 0,
      assetIndex: this.assetId,
      suggestedParams: params,
    });

    const signedTxn = txn.signTxn(this.account.sk);
    const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();
    await algosdk.waitForConfirmation(this.algodClient, txId, 4);

    return {
      success: true,
      txId,
      from: this.account.addr,
      to: this.account.addr,
      amount: '0',
      network: this.network,
      explorerUrl: `${this.networkConfig.explorerUrl}/tx/${txId}`,
      fee: (params.fee / 1000000).toString() + ' ALGO',
    };
  }

  /**
   * Transfer USDT to an Algorand address
   */
  async transfer(to: string, amount: string): Promise<AlgorandTransferResult> {
    if (!this.account) {
      throw new Error('Account not configured. Mnemonic required.');
    }

    const amountRaw = parseUsdtAmount(amount, this.network);
    const params = await this.algodClient.getTransactionParams().do();

    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: this.account.addr,
      to,
      amount: Number(amountRaw),
      assetIndex: this.assetId,
      suggestedParams: params,
    });

    const signedTxn = txn.signTxn(this.account.sk);
    const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();
    await algosdk.waitForConfirmation(this.algodClient, txId, 4);

    return {
      success: true,
      txId,
      from: this.account.addr,
      to,
      amount,
      network: this.network,
      explorerUrl: `${this.networkConfig.explorerUrl}/tx/${txId}`,
      fee: (params.fee / 1000000).toString() + ' ALGO',
    };
  }

  /**
   * Close USDT position (opt-out and send remaining to another address)
   */
  async closePosition(closeTo: string): Promise<AlgorandTransferResult> {
    if (!this.account) {
      throw new Error('Account not configured. Mnemonic required.');
    }

    const params = await this.algodClient.getTransactionParams().do();

    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: this.account.addr,
      to: closeTo,
      amount: 0,
      assetIndex: this.assetId,
      closeRemainderTo: closeTo,
      suggestedParams: params,
    });

    const signedTxn = txn.signTxn(this.account.sk);
    const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();
    await algosdk.waitForConfirmation(this.algodClient, txId, 4);

    return {
      success: true,
      txId,
      from: this.account.addr,
      to: closeTo,
      amount: 'All',
      network: this.network,
      explorerUrl: `${this.networkConfig.explorerUrl}/tx/${txId}`,
      fee: (params.fee / 1000000).toString() + ' ALGO',
    };
  }

  /**
   * Get ALGO balance for an address
   */
  async getAlgoBalance(address: string): Promise<string> {
    const accountInfo = await this.algodClient.accountInformation(address).do();
    return (accountInfo.amount / 1000000).toString();
  }

  /**
   * Get transfer history (requires indexer)
   */
  async getTransferHistory(
    address: string,
    options: { limit?: number } = {}
  ): Promise<Array<{
    txId: string;
    roundTime: number;
    sender: string;
    receiver: string;
    amount: string;
    fee: string;
  }>> {
    if (!this.indexerClient) {
      throw new Error('Indexer not configured');
    }

    const response = await this.indexerClient
      .searchForTransactions()
      .address(address)
      .assetID(this.assetId)
      .limit(options.limit || 20)
      .do();

    return response.transactions.map((tx: {
      id: string;
      'round-time': number;
      sender: string;
      'asset-transfer-transaction': { receiver: string; amount: number };
      fee: number;
    }) => ({
      txId: tx.id,
      roundTime: tx['round-time'],
      sender: tx.sender,
      receiver: tx['asset-transfer-transaction']?.receiver || '',
      amount: formatUsdtAmount(
        (tx['asset-transfer-transaction']?.amount || 0).toString(),
        this.network
      ),
      fee: (tx.fee / 1000000).toString() + ' ALGO',
    }));
  }

  /**
   * Estimate transfer fee
   */
  async estimateFee(): Promise<{
    fee: string;
    minBalance: string;
    note: string;
  }> {
    const params = await this.algodClient.getTransactionParams().do();

    return {
      fee: (params.fee / 1000000).toString() + ' ALGO',
      minBalance: '0.1 ALGO (for asset opt-in)',
      note: 'Algorand has very low fixed fees',
    };
  }

  /**
   * Get the connected wallet address
   */
  getWalletAddress(): string | null {
    return this.account?.addr || null;
  }

  /**
   * Validate an Algorand address
   */
  isValidAddress(address: string): boolean {
    return algosdk.isValidAddress(address);
  }

  /**
   * Get current round number
   */
  async getRound(): Promise<number> {
    const status = await this.algodClient.status().do();
    return status['last-round'];
  }

  /**
   * Get network information
   */
  getNetworkInfo(): {
    name: string;
    rpcUrl: string;
    explorerUrl: string;
    usdtAssetId: number;
    usdtDecimals: number;
  } {
    return {
      name: this.networkConfig.name,
      rpcUrl: this.networkConfig.rpcUrl,
      explorerUrl: this.networkConfig.explorerUrl,
      usdtAssetId: this.assetId,
      usdtDecimals: this.networkConfig.usdtDecimals,
    };
  }
}

/**
 * Create an Algorand client for USDT operations
 */
export function createAlgorandClient(config: AlgorandClientConfig): AlgorandClient {
  return new AlgorandClient(config);
}
