/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Tron Client for TRC-20 USDT operations
 * 
 * @author Velocity BPA
 * @website https://velobpa.com
 */

import TronWeb from 'tronweb';
import { NETWORKS } from '../constants/networks';
import { USDT_CONTRACTS, TRC20_USDT_ABI } from '../constants/contracts';
import { parseUsdtAmount, formatUsdtAmount } from '../utils/amountUtils';

export interface TronClientConfig {
  network: 'tron' | 'tronShasta';
  fullNode?: string;
  solidityNode?: string;
  eventServer?: string;
  privateKey?: string;
}

export interface TronTransferResult {
  success: boolean;
  txId: string;
  from: string;
  to: string;
  amount: string;
  network: string;
  explorerUrl: string;
  energyUsed?: number;
  bandwidthUsed?: number;
}

export interface TronBalanceResult {
  address: string;
  balance: string;
  balanceRaw: string;
  network: string;
  decimals: number;
}

export class TronClient {
  private tronWeb: TronWeb;
  private network: string;
  private networkConfig: typeof NETWORKS[string];
  private contractAddress: string;

  constructor(config: TronClientConfig) {
    const networkConfig = NETWORKS[config.network];
    if (!networkConfig) {
      throw new Error(`Unknown network: ${config.network}`);
    }
    if (networkConfig.type !== 'tron') {
      throw new Error(`Network ${config.network} is not a Tron network`);
    }

    this.network = config.network;
    this.networkConfig = networkConfig;
    this.contractAddress = USDT_CONTRACTS[config.network];

    const fullNode = config.fullNode || networkConfig.rpcUrl;
    const solidityNode = config.solidityNode || fullNode;
    const eventServer = config.eventServer || fullNode;

    this.tronWeb = new TronWeb({
      fullNode,
      solidityNode,
      eventServer,
      privateKey: config.privateKey,
    });
  }

  /**
   * Get USDT balance for a Tron address
   */
  async getBalance(address: string): Promise<TronBalanceResult> {
    const contract = await this.tronWeb.contract(TRC20_USDT_ABI, this.contractAddress);
    const balance = await contract.methods.balanceOf(address).call();
    const decimals = this.networkConfig.usdtDecimals;

    return {
      address,
      balance: formatUsdtAmount(balance.toString(), this.network),
      balanceRaw: balance.toString(),
      network: this.network,
      decimals,
    };
  }

  /**
   * Get total USDT supply on Tron
   */
  async getTotalSupply(): Promise<string> {
    const contract = await this.tronWeb.contract(TRC20_USDT_ABI, this.contractAddress);
    const supply = await contract.methods.totalSupply().call();
    return formatUsdtAmount(supply.toString(), this.network);
  }

  /**
   * Transfer USDT to a Tron address
   */
  async transfer(to: string, amount: string): Promise<TronTransferResult> {
    const amountRaw = parseUsdtAmount(amount, this.network);
    const contract = await this.tronWeb.contract(TRC20_USDT_ABI, this.contractAddress);
    
    const tx = await contract.methods.transfer(to, amountRaw.toString()).send({
      feeLimit: 100000000,
    });

    const from = this.tronWeb.defaultAddress.base58;

    return {
      success: true,
      txId: tx,
      from: from || '',
      to,
      amount,
      network: this.network,
      explorerUrl: `${this.networkConfig.explorerUrl}/#/transaction/${tx}`,
    };
  }

  /**
   * Approve spending allowance
   */
  async approve(spender: string, amount: string): Promise<TronTransferResult> {
    const amountRaw = parseUsdtAmount(amount, this.network);
    const contract = await this.tronWeb.contract(TRC20_USDT_ABI, this.contractAddress);
    
    const tx = await contract.methods.approve(spender, amountRaw.toString()).send({
      feeLimit: 100000000,
    });

    const from = this.tronWeb.defaultAddress.base58;

    return {
      success: true,
      txId: tx,
      from: from || '',
      to: spender,
      amount,
      network: this.network,
      explorerUrl: `${this.networkConfig.explorerUrl}/#/transaction/${tx}`,
    };
  }

  /**
   * Get allowance for a spender
   */
  async getAllowance(owner: string, spender: string): Promise<string> {
    const contract = await this.tronWeb.contract(TRC20_USDT_ABI, this.contractAddress);
    const allowance = await contract.methods.allowance(owner, spender).call();
    return formatUsdtAmount(allowance.toString(), this.network);
  }

  /**
   * Transfer USDT from one address to another
   */
  async transferFrom(from: string, to: string, amount: string): Promise<TronTransferResult> {
    const amountRaw = parseUsdtAmount(amount, this.network);
    const contract = await this.tronWeb.contract(TRC20_USDT_ABI, this.contractAddress);
    
    const tx = await contract.methods.transferFrom(from, to, amountRaw.toString()).send({
      feeLimit: 100000000,
    });

    return {
      success: true,
      txId: tx,
      from,
      to,
      amount,
      network: this.network,
      explorerUrl: `${this.networkConfig.explorerUrl}/#/transaction/${tx}`,
    };
  }

  /**
   * Get account resources (energy, bandwidth)
   */
  async getAccountResources(address: string): Promise<{
    freeNetUsed: number;
    freeNetLimit: number;
    netUsed: number;
    netLimit: number;
    energyUsed: number;
    energyLimit: number;
    trxBalance: string;
  }> {
    const resources = await this.tronWeb.trx.getAccountResources(address);
    const balance = await this.tronWeb.trx.getBalance(address);

    return {
      freeNetUsed: resources.freeNetUsed || 0,
      freeNetLimit: resources.freeNetLimit || 0,
      netUsed: resources.NetUsed || 0,
      netLimit: resources.NetLimit || 0,
      energyUsed: resources.EnergyUsed || 0,
      energyLimit: resources.EnergyLimit || 0,
      trxBalance: this.tronWeb.fromSun(balance),
    };
  }

  /**
   * Estimate energy for a transfer
   */
  async estimateEnergy(to: string, amount: string): Promise<{
    energyRequired: number;
    bandwidthRequired: number;
    estimatedTrxCost: string;
  }> {
    void to;
    void amount;
    const energyRequired = 65000;
    const bandwidthRequired = 350;
    const energyCost = energyRequired * 420;

    return {
      energyRequired,
      bandwidthRequired,
      estimatedTrxCost: this.tronWeb.fromSun(energyCost),
    };
  }

  /**
   * Get transaction info by ID
   */
  async getTransactionInfo(txId: string): Promise<{
    id: string;
    blockNumber: number;
    blockTimeStamp: number;
    contractResult: string[];
    receipt: {
      energyUsage: number;
      energyUsageTotal: number;
      netUsage: number;
      result: string;
    };
  }> {
    const info = await this.tronWeb.trx.getTransactionInfo(txId);
    return {
      id: info.id,
      blockNumber: info.blockNumber,
      blockTimeStamp: info.blockTimeStamp,
      contractResult: info.contractResult,
      receipt: {
        energyUsage: info.receipt?.energy_usage || 0,
        energyUsageTotal: info.receipt?.energy_usage_total || 0,
        netUsage: info.receipt?.net_usage || 0,
        result: info.receipt?.result || 'UNKNOWN',
      },
    };
  }

  /**
   * Get contract info
   */
  async getContractInfo(): Promise<{
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
  }> {
    const contract = await this.tronWeb.contract(TRC20_USDT_ABI, this.contractAddress);
    
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.methods.name().call(),
      contract.methods.symbol().call(),
      contract.methods.decimals().call(),
      contract.methods.totalSupply().call(),
    ]);

    return {
      address: this.contractAddress,
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply: formatUsdtAmount(totalSupply.toString(), this.network),
    };
  }

  /**
   * Get transfer events for an address
   */
  async getTransferEvents(
    address: string,
    options: { limit?: number; fingerprint?: string } = {}
  ): Promise<Array<{
    from: string;
    to: string;
    amount: string;
    blockNumber: number;
    txId: string;
    timestamp: number;
  }>> {
    const events = await this.tronWeb.getEventResult(this.contractAddress, {
      eventName: 'Transfer',
      size: options.limit || 50,
      fingerprint: options.fingerprint,
    });

    interface TronEvent {
      result: { from: string; to: string; value: string };
      block: number;
      transaction: string;
      timestamp: number;
    }

    return events
      .filter((event: TronEvent) => 
        event.result.from === address || event.result.to === address
      )
      .map((event: TronEvent) => ({
        from: event.result.from,
        to: event.result.to,
        amount: formatUsdtAmount(event.result.value, this.network),
        blockNumber: event.block,
        txId: event.transaction,
        timestamp: event.timestamp,
      }));
  }

  /**
   * Validate a Tron address
   */
  isValidAddress(address: string): boolean {
    return this.tronWeb.isAddress(address);
  }

  /**
   * Convert hex address to base58
   */
  hexToBase58(hexAddress: string): string {
    return this.tronWeb.address.fromHex(hexAddress);
  }

  /**
   * Convert base58 address to hex
   */
  base58ToHex(base58Address: string): string {
    return this.tronWeb.address.toHex(base58Address);
  }

  /**
   * Get the connected wallet address
   */
  getWalletAddress(): string | null {
    return this.tronWeb.defaultAddress.base58 || null;
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    const block = await this.tronWeb.trx.getCurrentBlock();
    return block.block_header.raw_data.number;
  }

  /**
   * Get network information
   */
  getNetworkInfo(): {
    name: string;
    rpcUrl: string;
    explorerUrl: string;
    usdtContract: string;
    usdtDecimals: number;
  } {
    return {
      name: this.networkConfig.name,
      rpcUrl: this.networkConfig.rpcUrl,
      explorerUrl: this.networkConfig.explorerUrl,
      usdtContract: this.contractAddress,
      usdtDecimals: this.networkConfig.usdtDecimals,
    };
  }
}

/**
 * Create a Tron client for USDT operations
 */
export function createTronClient(config: TronClientConfig): TronClient {
  return new TronClient(config);
}
