#!/usr/bin/env node

/**
 * Test Script: Check USDT Balance
 * Tests the EVM client for balance queries
 * 
 * Usage: node scripts/test-balance.js <network> <address>
 * Example: node scripts/test-balance.js ethereum 0xdAC17F958D2ee523a2206206994597C13D831ec7
 * 
 * @author Velocity BPA
 * @website https://velobpa.com
 */

const path = require('path');

// Dynamically load the compiled module
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node scripts/test-balance.js <network> <address>');
    console.log('Example: node scripts/test-balance.js ethereum 0xdAC17F958D2ee523a2206206994597C13D831ec7');
    console.log('\nAvailable networks: ethereum, polygon, arbitrum, optimism, bnbChain, avalanche');
    process.exit(1);
  }

  const [network, address] = args;

  try {
    // Load the compiled EVM client
    const { EvmClient } = require(path.join(__dirname, '../dist/nodes/Tether/transport/evmClient'));
    
    console.log(`\n🔍 Checking USDT balance on ${network}...`);
    console.log(`   Address: ${address}\n`);

    const client = new EvmClient({ network });
    const balance = await client.getBalance(address);

    console.log('✅ Balance Result:');
    console.log(`   Balance: ${balance.balance} USDT`);
    console.log(`   Raw: ${balance.balanceRaw}`);
    console.log(`   Network: ${balance.network}`);
    console.log(`   Decimals: ${balance.decimals}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
