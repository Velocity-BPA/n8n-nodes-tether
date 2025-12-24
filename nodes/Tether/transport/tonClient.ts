/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * TON Client for USDT Jetton operations
 * 
 * @author Velocity BPA
 * @website https://velobpa.com
 */

import { TonClient, WalletContractV4, internal, Address, toNano, fromNano } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { NETWORKS } from '../constants/networks';
import { USDT_CONTRACTS } from '../constants/contracts';
import { formatUsdtAmount, parseUsdtAmount } from '../utils/amountUtils';

export interface TonClientConfig {
  network: 'ton';
  endpoint?: string;
  apiKey?: string;
  mnemonic?: string[];
}

export interface TonTransferResult {
  success: boolean;
  msgHash: string;
  from: string;
  to: string;
  amount: string;
  network: string;
  explorerUrl: string;
  fee?: string;
}

export interface TonBalanceResult {
  address: string;
  balance: string;
  balanceRaw: string;
  network: string;
  decimals: number;
  jettonWallet?: string;
}

export class TonClientWrapper {
  private client: TonClient;
  private wallet: WalletContractV4 | null = null;
  private keyPair: { publicKey: Buffer; secretKey: Buffer } | null = null;
  private network: string;
  private networkConfig: typeof NETWORKS[string];
  private jettonMasterAddress: Address;

  constructor(config: TonClientConfig) {
    const networkConfig = NETWORKS[config.network];
    if (!networkConfig) {
      throw new Error(`Unknown network: ${config.network}`);
    }
    if (networkConfig.type !== 'ton') {
      throw new Error(`Network ${config.network} is not a TON network`);
    }

    this.network = config.network;
    this.networkConfig = networkConfig;

    const endpoint = config.endpoint || 'https://toncenter.com/api/v2/jsonRPC';
    this.client = new TonClient({
      endpoint,
      apiKey: config.apiKey,
    });

    this.jettonMasterAddress = Address.parse(USDT_CONTRACTS[config.network]);
  }

  /**
   * Initialize wallet from mnemonic
   */
  async initWallet(mnemonic: string[]): Promise<void> {
    this.keyPair = await mnemonicToPrivateKey(mnemonic);
    this.wallet = WalletContractV4.create({
      publicKey: this.keyPair.publicKey,
      workchain: 0,
    });
  }

  /**
   * Get jetton wallet address for an owner
   */
  async getJettonWalletAddress(ownerAddress: string): Promise<string> {
    const owner = Address.parse(ownerAddress);
    
    // Call getWalletAddress on jetton master
    const result = await this.client.runMethod(
      this.jettonMasterAddress,
      'get_wallet_address',
      [{ type: 'slice', cell: owner.toCell() }]
    );

    const jettonWallet = result.stack.readAddress();
    return jettonWallet.toString();
  }

  /**
   * Get USDT balance for a TON address
   */
  async getBalance(address: string): Promise<TonBalanceResult> {
    try {
      const jettonWalletAddress = await this.getJettonWalletAddress(address);
      const jettonWallet = Address.parse(jettonWalletAddress);

      const result = await this.client.runMethod(
        jettonWallet,
        'get_wallet_data',
        []
      );

      const balance = result.stack.readBigNumber();
      const decimals = this.networkConfig.usdtDecimals;

      return {
        address,
        balance: formatUsdtAmount(balance.toString(), this.network),
        balanceRaw: balance.toString(),
        network: this.network,
        decimals,
        jettonWallet: jettonWalletAddress,
      };
    } catch {
      // Jetton wallet doesn't exist - balance is 0
      return {
        address,
        balance: '0',
        balanceRaw: '0',
        network: this.network,
        decimals: this.networkConfig.usdtDecimals,
        jettonWallet: undefined,
      };
    }
  }

  /**
   * Get jetton master info
   */
  async getJettonMasterInfo(): Promise<{
    address: string;
    totalSupply: string;
    mintable: boolean;
    adminAddress: string | null;
  }> {
    const result = await this.client.runMethod(
      this.jettonMasterAddress,
      'get_jetton_data',
      []
    );

    const totalSupply = result.stack.readBigNumber();
    const mintable = result.stack.readBoolean();
    const adminAddress = result.stack.readAddressOpt();

    return {
      address: this.jettonMasterAddress.toString(),
      totalSupply: formatUsdtAmount(totalSupply.toString(), this.network),
      mintable,
      adminAddress: adminAddress?.toString() || null,
    };
  }

  /**
   * Transfer USDT to a TON address
   */
  async transfer(to: string, amount: string): Promise<TonTransferResult> {
    if (!this.wallet || !this.keyPair) {
      throw new Error('Wallet not initialized. Call initWallet first.');
    }

    const amountRaw = parseUsdtAmount(amount, this.network);
    const toAddress = Address.parse(to);
    const fromAddress = this.wallet.address;

    // Get sender's jetton wallet
    const jettonWalletAddress = await this.getJettonWalletAddress(fromAddress.toString());
    const jettonWallet = Address.parse(jettonWalletAddress);

    // Build transfer message
    const forwardPayload = Buffer.alloc(0);
    const transferBody = Buffer.concat([
      Buffer.from([0x0f, 0x8a, 0x7e, 0xa5]), // transfer op code
      Buffer.alloc(8), // query_id
      amountRaw.toString(16).padStart(32, '0'), // amount
      toAddress.toCell().toBoc(), // destination
      fromAddress.toCell().toBoc(), // response_destination
      Buffer.from([0]), // custom_payload (empty)
      toNano('0.05').toString(16).padStart(32, '0'), // forward_ton_amount
      forwardPayload,
    ]);

    // Create and send transaction
    const contract = this.client.open(this.wallet);
    const seqno = await contract.getSeqno();

    await contract.sendTransfer({
      secretKey: this.keyPair.secretKey,
      seqno,
      messages: [
        internal({
          to: jettonWallet,
          value: toNano('0.1'),
          body: transferBody.toString('base64'),
        }),
      ],
    });

    return {
      success: true,
      msgHash: 'pending', // TON doesn't return hash immediately
      from: fromAddress.toString(),
      to,
      amount,
      network: this.network,
      explorerUrl: `${this.networkConfig.explorerUrl}/address/${fromAddress.toString()}`,
      fee: '~0.1 TON',
    };
  }

  /**
   * Get TON balance for an address
   */
  async getTonBalance(address: string): Promise<string> {
    const addr = Address.parse(address);
    const balance = await this.client.getBalance(addr);
    return fromNano(balance);
  }

  /**
   * Get transaction history for an address
   */
  async getTransactionHistory(
    address: string,
    options: { limit?: number; lt?: bigint; hash?: string } = {}
  ): Promise<Array<{
    lt: string;
    hash: string;
    time: number;
    fee: string;
    inMsg: boolean;
    outMsgs: number;
  }>> {
    const addr = Address.parse(address);
    const transactions = await this.client.getTransactions(addr, {
      limit: options.limit || 20,
      lt: options.lt?.toString(),
      hash: options.hash,
    });

    return transactions.map((tx) => ({
      lt: tx.lt.toString(),
      hash: tx.hash().toString('hex'),
      time: tx.now,
      fee: fromNano(tx.totalFees.coins),
      inMsg: tx.inMessage !== undefined,
      outMsgs: tx.outMessages.size,
    }));
  }

  /**
   * Estimate transfer fee
   */
  async estimateFee(): Promise<{
    fee: string;
    forwardAmount: string;
    total: string;
  }> {
    return {
      fee: '~0.05 TON',
      forwardAmount: '~0.05 TON',
      total: '~0.1 TON',
    };
  }

  /**
   * Get the connected wallet address
   */
  getWalletAddress(): string | null {
    return this.wallet?.address.toString() || null;
  }

  /**
   * Validate a TON address
   */
  isValidAddress(address: string): boolean {
    try {
      Address.parse(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get network information
   */
  getNetworkInfo(): {
    name: string;
    rpcUrl: string;
    explorerUrl: string;
    usdtJettonMaster: string;
    usdtDecimals: number;
  } {
    return {
      name: this.networkConfig.name,
      rpcUrl: this.networkConfig.rpcUrl,
      explorerUrl: this.networkConfig.explorerUrl,
      usdtJettonMaster: USDT_CONTRACTS[this.network],
      usdtDecimals: this.networkConfig.usdtDecimals,
    };
  }
}

/**
 * Create a TON client for USDT operations
 */
export function createTonClient(config: TonClientConfig): TonClientWrapper {
  return new TonClientWrapper(config);
}
