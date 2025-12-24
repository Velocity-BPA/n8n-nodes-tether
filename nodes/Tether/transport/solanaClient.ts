/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Solana Client for SPL USDT operations
 * 
 * @author Velocity BPA
 * @website https://velobpa.com
 */

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getMint,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { NETWORKS } from '../constants/networks';
import { USDT_CONTRACTS } from '../constants/contracts';
import { formatUsdtAmount, parseUsdtAmount } from '../utils/amountUtils';

export interface SolanaClientConfig {
  network: 'solana' | 'solanaDevnet';
  rpcUrl?: string;
  privateKey?: string; // Base58 encoded or Uint8Array
}

export interface SolanaTransferResult {
  success: boolean;
  signature: string;
  from: string;
  to: string;
  amount: string;
  network: string;
  explorerUrl: string;
  fee?: string;
}

export interface SolanaBalanceResult {
  address: string;
  balance: string;
  balanceRaw: string;
  network: string;
  decimals: number;
  tokenAccount?: string;
}

export class SolanaClient {
  private connection: Connection;
  private keypair: Keypair | null = null;
  private network: string;
  private networkConfig: typeof NETWORKS[string];
  private mintAddress: PublicKey;

  constructor(config: SolanaClientConfig) {
    const networkConfig = NETWORKS[config.network];
    if (!networkConfig) {
      throw new Error(`Unknown network: ${config.network}`);
    }
    if (networkConfig.type !== 'solana') {
      throw new Error(`Network ${config.network} is not a Solana network`);
    }

    this.network = config.network;
    this.networkConfig = networkConfig;

    const rpcUrl = config.rpcUrl || networkConfig.rpcUrl;
    this.connection = new Connection(rpcUrl, 'confirmed');

    if (config.privateKey) {
      if (typeof config.privateKey === 'string') {
        // Assume base58 encoded
        const bs58 = require('bs58');
        const secretKey = bs58.decode(config.privateKey);
        this.keypair = Keypair.fromSecretKey(secretKey);
      } else {
        this.keypair = Keypair.fromSecretKey(config.privateKey as unknown as Uint8Array);
      }
    }

    this.mintAddress = new PublicKey(USDT_CONTRACTS[config.network]);
  }

  /**
   * Get USDT balance for a Solana address
   */
  async getBalance(address: string): Promise<SolanaBalanceResult> {
    const ownerPubkey = new PublicKey(address);
    const tokenAccount = await getAssociatedTokenAddress(
      this.mintAddress,
      ownerPubkey
    );

    try {
      const account = await getAccount(this.connection, tokenAccount);
      const decimals = this.networkConfig.usdtDecimals;

      return {
        address,
        balance: formatUsdtAmount(account.amount.toString(), this.network),
        balanceRaw: account.amount.toString(),
        network: this.network,
        decimals,
        tokenAccount: tokenAccount.toBase58(),
      };
    } catch {
      // Token account doesn't exist - balance is 0
      return {
        address,
        balance: '0',
        balanceRaw: '0',
        network: this.network,
        decimals: this.networkConfig.usdtDecimals,
        tokenAccount: undefined,
      };
    }
  }

  /**
   * Get total USDT supply on Solana
   */
  async getTotalSupply(): Promise<string> {
    const mint = await getMint(this.connection, this.mintAddress);
    return formatUsdtAmount(mint.supply.toString(), this.network);
  }

  /**
   * Get mint info
   */
  async getMintInfo(): Promise<{
    address: string;
    supply: string;
    decimals: number;
    mintAuthority: string | null;
    freezeAuthority: string | null;
  }> {
    const mint = await getMint(this.connection, this.mintAddress);

    return {
      address: this.mintAddress.toBase58(),
      supply: formatUsdtAmount(mint.supply.toString(), this.network),
      decimals: mint.decimals,
      mintAuthority: mint.mintAuthority?.toBase58() || null,
      freezeAuthority: mint.freezeAuthority?.toBase58() || null,
    };
  }

  /**
   * Get associated token account address
   */
  async getAssociatedTokenAccount(owner: string): Promise<string> {
    const ownerPubkey = new PublicKey(owner);
    const tokenAccount = await getAssociatedTokenAddress(
      this.mintAddress,
      ownerPubkey
    );
    return tokenAccount.toBase58();
  }

  /**
   * Create associated token account if it doesn't exist
   */
  async createTokenAccount(owner: string): Promise<{
    tokenAccount: string;
    signature?: string;
    alreadyExists: boolean;
  }> {
    if (!this.keypair) {
      throw new Error('Wallet not configured. Private key required.');
    }

    const ownerPubkey = new PublicKey(owner);
    const tokenAccount = await getAssociatedTokenAddress(
      this.mintAddress,
      ownerPubkey
    );

    try {
      await getAccount(this.connection, tokenAccount);
      return {
        tokenAccount: tokenAccount.toBase58(),
        alreadyExists: true,
      };
    } catch {
      // Account doesn't exist, create it
      const instruction = createAssociatedTokenAccountInstruction(
        this.keypair.publicKey,
        tokenAccount,
        ownerPubkey,
        this.mintAddress
      );

      const transaction = new Transaction().add(instruction);
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.keypair]
      );

      return {
        tokenAccount: tokenAccount.toBase58(),
        signature,
        alreadyExists: false,
      };
    }
  }

  /**
   * Transfer USDT to a Solana address
   */
  async transfer(to: string, amount: string): Promise<SolanaTransferResult> {
    if (!this.keypair) {
      throw new Error('Wallet not configured. Private key required.');
    }

    const amountRaw = parseUsdtAmount(amount, this.network);
    const toPubkey = new PublicKey(to);

    // Get source token account
    const sourceAccount = await getAssociatedTokenAddress(
      this.mintAddress,
      this.keypair.publicKey
    );

    // Get or create destination token account
    const destAccount = await getAssociatedTokenAddress(
      this.mintAddress,
      toPubkey
    );

    const transaction = new Transaction();

    // Check if destination account exists
    try {
      await getAccount(this.connection, destAccount);
    } catch {
      // Create the account
      transaction.add(
        createAssociatedTokenAccountInstruction(
          this.keypair.publicKey,
          destAccount,
          toPubkey,
          this.mintAddress
        )
      );
    }

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        sourceAccount,
        destAccount,
        this.keypair.publicKey,
        BigInt(amountRaw.toString()),
        [],
        TOKEN_PROGRAM_ID
      )
    );

    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [this.keypair]
    );

    return {
      success: true,
      signature,
      from: this.keypair.publicKey.toBase58(),
      to,
      amount,
      network: this.network,
      explorerUrl: `${this.networkConfig.explorerUrl}/tx/${signature}`,
    };
  }

  /**
   * Get transfer history for an address
   */
  async getTransferHistory(
    address: string,
    options: { limit?: number; before?: string } = {}
  ): Promise<Array<{
    signature: string;
    blockTime: number | null;
    slot: number;
    fee: number;
    status: string;
  }>> {
    const pubkey = new PublicKey(address);
    const signatures = await this.connection.getSignaturesForAddress(pubkey, {
      limit: options.limit || 20,
      before: options.before,
    });

    return signatures.map((sig) => ({
      signature: sig.signature,
      blockTime: sig.blockTime,
      slot: sig.slot,
      fee: 0, // Would need to fetch transaction details for actual fee
      status: sig.err ? 'failed' : 'success',
    }));
  }

  /**
   * Estimate transfer fee
   */
  async estimateFee(): Promise<{
    fee: string;
    feeInLamports: number;
    rentExemption: string;
  }> {
    const { blockhash } = await this.connection.getLatestBlockhash();
    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: this.keypair?.publicKey || new PublicKey('11111111111111111111111111111111'),
    });

    // Add a dummy instruction to estimate
    const dummyInstruction = createTransferInstruction(
      new PublicKey('11111111111111111111111111111111'),
      new PublicKey('11111111111111111111111111111112'),
      new PublicKey('11111111111111111111111111111111'),
      BigInt(1000000),
      [],
      TOKEN_PROGRAM_ID
    );
    transaction.add(dummyInstruction);

    const fee = await this.connection.getFeeForMessage(
      transaction.compileMessage()
    );

    const rentExemption = await this.connection.getMinimumBalanceForRentExemption(165);

    return {
      fee: (fee.value || 5000) / LAMPORTS_PER_SOL + ' SOL',
      feeInLamports: fee.value || 5000,
      rentExemption: rentExemption / LAMPORTS_PER_SOL + ' SOL',
    };
  }

  /**
   * Get SOL balance for an address
   */
  async getSolBalance(address: string): Promise<string> {
    const pubkey = new PublicKey(address);
    const balance = await this.connection.getBalance(pubkey);
    return (balance / LAMPORTS_PER_SOL).toString();
  }

  /**
   * Get the connected wallet address
   */
  getWalletAddress(): string | null {
    return this.keypair?.publicKey.toBase58() || null;
  }

  /**
   * Get current slot number
   */
  async getSlot(): Promise<number> {
    return await this.connection.getSlot();
  }

  /**
   * Get network information
   */
  getNetworkInfo(): {
    name: string;
    rpcUrl: string;
    explorerUrl: string;
    usdtMint: string;
    usdtDecimals: number;
  } {
    return {
      name: this.networkConfig.name,
      rpcUrl: this.networkConfig.rpcUrl,
      explorerUrl: this.networkConfig.explorerUrl,
      usdtMint: USDT_CONTRACTS[this.network],
      usdtDecimals: this.networkConfig.usdtDecimals,
    };
  }
}

/**
 * Create a Solana client for USDT operations
 */
export function createSolanaClient(config: SolanaClientConfig): SolanaClient {
  return new SolanaClient(config);
}
