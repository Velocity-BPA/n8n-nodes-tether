/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * EVM Client for Ethereum and EVM-compatible chains
 * Handles all ERC-20 USDT operations
 * 
 * @author Velocity BPA
 * @website https://velobpa.com
 */

import { ethers, Contract, Provider, Wallet, TransactionResponse, TransactionReceipt } from 'ethers';
import { NETWORKS } from '../constants/networks';
import { ERC20_USDT_ABI, USDT_CONTRACTS } from '../constants/contracts';
import { parseUsdtAmount, formatUsdtAmount } from '../utils/amountUtils';

export interface EvmClientConfig {
  network: string;
  rpcUrl?: string;
  privateKey?: string;
}

export interface TransferResult {
  success: boolean;
  txHash: string;
  from: string;
  to: string;
  amount: string;
  network: string;
  explorerUrl: string;
  gasUsed?: string;
  effectiveGasPrice?: string;
}

export interface BalanceResult {
  address: string;
  balance: string;
  balanceRaw: string;
  network: string;
  decimals: number;
}

export class EvmClient {
  private provider: Provider;
  private wallet: Wallet | null = null;
  private contract: Contract;
  private network: string;
  private networkConfig: typeof NETWORKS[string];

  constructor(config: EvmClientConfig) {
    const networkConfig = NETWORKS[config.network];
    if (!networkConfig) {
      throw new Error(`Unknown network: ${config.network}`);
    }
    if (networkConfig.type !== 'evm') {
      throw new Error(`Network ${config.network} is not EVM-compatible`);
    }

    this.network = config.network;
    this.networkConfig = networkConfig;
    const rpcUrl = config.rpcUrl || networkConfig.rpcUrl;
    
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    if (config.privateKey) {
      this.wallet = new Wallet(config.privateKey, this.provider);
    }

    const contractAddress = USDT_CONTRACTS[config.network];
    if (!contractAddress) {
      throw new Error(`No USDT contract address for network: ${config.network}`);
    }

    this.contract = new Contract(
      contractAddress,
      ERC20_USDT_ABI,
      this.wallet || this.provider
    );
  }

  /**
   * Get USDT balance for an address
   */
  async getBalance(address: string): Promise<BalanceResult> {
    const balance = await this.contract.balanceOf(address);
    const decimals = this.networkConfig.usdtDecimals;
    
    return {
      address,
      balance: formatUsdtAmount(balance, this.network),
      balanceRaw: balance.toString(),
      network: this.network,
      decimals,
    };
  }

  /**
   * Get total USDT supply on this network
   */
  async getTotalSupply(): Promise<string> {
    const supply = await this.contract.totalSupply();
    return formatUsdtAmount(supply, this.network);
  }

  /**
   * Transfer USDT to an address
   */
  async transfer(to: string, amount: string): Promise<TransferResult> {
    if (!this.wallet) {
      throw new Error('Wallet not configured. Private key required for transfers.');
    }

    const amountRaw = parseUsdtAmount(amount, this.network);
    const tx: TransactionResponse = await this.contract.transfer(to, amountRaw);
    const receipt: TransactionReceipt | null = await tx.wait();

    if (!receipt) {
      throw new Error('Transaction failed - no receipt');
    }

    return {
      success: receipt.status === 1,
      txHash: tx.hash,
      from: tx.from,
      to,
      amount,
      network: this.network,
      explorerUrl: `${this.networkConfig.explorerUrl}/tx/${tx.hash}`,
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.gasPrice?.toString(),
    };
  }

  /**
   * Approve spending allowance
   */
  async approve(spender: string, amount: string): Promise<TransferResult> {
    if (!this.wallet) {
      throw new Error('Wallet not configured. Private key required for approvals.');
    }

    const amountRaw = parseUsdtAmount(amount, this.network);
    const tx: TransactionResponse = await this.contract.approve(spender, amountRaw);
    const receipt: TransactionReceipt | null = await tx.wait();

    if (!receipt) {
      throw new Error('Transaction failed - no receipt');
    }

    return {
      success: receipt.status === 1,
      txHash: tx.hash,
      from: tx.from,
      to: spender,
      amount,
      network: this.network,
      explorerUrl: `${this.networkConfig.explorerUrl}/tx/${tx.hash}`,
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.gasPrice?.toString(),
    };
  }

  /**
   * Get allowance for a spender
   */
  async getAllowance(owner: string, spender: string): Promise<string> {
    const allowance = await this.contract.allowance(owner, spender);
    return formatUsdtAmount(allowance, this.network);
  }

  /**
   * Transfer USDT from one address to another (requires prior approval)
   */
  async transferFrom(from: string, to: string, amount: string): Promise<TransferResult> {
    if (!this.wallet) {
      throw new Error('Wallet not configured. Private key required for transfers.');
    }

    const amountRaw = parseUsdtAmount(amount, this.network);
    const tx: TransactionResponse = await this.contract.transferFrom(from, to, amountRaw);
    const receipt: TransactionReceipt | null = await tx.wait();

    if (!receipt) {
      throw new Error('Transaction failed - no receipt');
    }

    return {
      success: receipt.status === 1,
      txHash: tx.hash,
      from,
      to,
      amount,
      network: this.network,
      explorerUrl: `${this.networkConfig.explorerUrl}/tx/${tx.hash}`,
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.gasPrice?.toString(),
    };
  }

  /**
   * Check if an address is blacklisted
   */
  async isBlacklisted(address: string): Promise<boolean> {
    try {
      // Different contracts use different function names
      try {
        return await this.contract.isBlackListed(address);
      } catch {
        return await this.contract.getBlacklist(address);
      }
    } catch {
      // If function doesn't exist, assume not blacklisted
      return false;
    }
  }

  /**
   * Check if the contract is paused
   */
  async isPaused(): Promise<boolean> {
    try {
      return await this.contract.paused();
    } catch {
      return false;
    }
  }

  /**
   * Get contract owner
   */
  async getOwner(): Promise<string> {
    try {
      return await this.contract.owner();
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Get contract decimals
   */
  async getDecimals(): Promise<number> {
    return await this.contract.decimals();
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
    owner: string;
    paused: boolean;
  }> {
    const [name, symbol, decimals, totalSupply, owner, paused] = await Promise.all([
      this.contract.name(),
      this.contract.symbol(),
      this.contract.decimals(),
      this.contract.totalSupply(),
      this.getOwner(),
      this.isPaused(),
    ]);

    return {
      address: USDT_CONTRACTS[this.network],
      name,
      symbol,
      decimals,
      totalSupply: formatUsdtAmount(totalSupply, this.network),
      owner,
      paused,
    };
  }

  /**
   * Estimate gas for a transfer
   */
  async estimateTransferGas(to: string, amount: string): Promise<{
    gasLimit: string;
    gasPrice: string;
    estimatedCost: string;
    estimatedCostUsd: string;
  }> {
    const amountRaw = parseUsdtAmount(amount, this.network);
    const gasLimit = await this.contract.transfer.estimateGas(to, amountRaw);
    const feeData = await this.provider.getFeeData();
    const gasPrice = feeData.gasPrice || BigInt(0);
    const estimatedCost = gasLimit * gasPrice;

    return {
      gasLimit: gasLimit.toString(),
      gasPrice: gasPrice.toString(),
      estimatedCost: ethers.formatEther(estimatedCost),
      estimatedCostUsd: 'Varies based on native token price',
    };
  }

  /**
   * Get transfer events for an address
   */
  async getTransferEvents(
    address: string,
    fromBlock: number | string = 'earliest',
    toBlock: number | string = 'latest'
  ): Promise<Array<{
    from: string;
    to: string;
    amount: string;
    blockNumber: number;
    txHash: string;
  }>> {
    // Get events where address is sender
    const sentFilter = this.contract.filters.Transfer(address, null);
    const sentEvents = await this.contract.queryFilter(sentFilter, fromBlock, toBlock);

    // Get events where address is receiver
    const receivedFilter = this.contract.filters.Transfer(null, address);
    const receivedEvents = await this.contract.queryFilter(receivedFilter, fromBlock, toBlock);

    const allEvents = [...sentEvents, ...receivedEvents];
    
    return allEvents.map((event) => {
      const args = (event as ethers.EventLog).args;
      return {
        from: args[0],
        to: args[1],
        amount: formatUsdtAmount(args[2], this.network),
        blockNumber: event.blockNumber,
        txHash: event.transactionHash,
      };
    });
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  /**
   * Get native token balance (ETH, MATIC, etc.)
   */
  async getNativeBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  /**
   * Get the connected wallet address
   */
  getWalletAddress(): string | null {
    return this.wallet?.address || null;
  }

  /**
   * Get network information
   */
  getNetworkInfo(): {
    name: string;
    chainId: number | undefined;
    rpcUrl: string;
    explorerUrl: string;
    usdtContract: string;
    usdtDecimals: number;
  } {
    return {
      name: this.networkConfig.name,
      chainId: this.networkConfig.chainId,
      rpcUrl: this.networkConfig.rpcUrl,
      explorerUrl: this.networkConfig.explorerUrl,
      usdtContract: USDT_CONTRACTS[this.network],
      usdtDecimals: this.networkConfig.usdtDecimals,
    };
  }
}

/**
 * Create an EVM client for a specific network
 */
export function createEvmClient(config: EvmClientConfig): EvmClient {
  return new EvmClient(config);
}
