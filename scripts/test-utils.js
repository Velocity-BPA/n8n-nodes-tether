#!/usr/bin/env node

/**
 * Test Script: Utility Functions
 * Tests address validation and amount conversion utilities
 * 
 * Usage: node scripts/test-utils.js
 * 
 * @author Velocity BPA
 * @website https://velobpa.com
 */

const path = require('path');

async function main() {
  try {
    const addressUtils = require(path.join(__dirname, '../dist/nodes/Tether/utils/addressUtils'));
    const amountUtils = require(path.join(__dirname, '../dist/nodes/Tether/utils/amountUtils'));
    const chainUtils = require(path.join(__dirname, '../dist/nodes/Tether/utils/chainUtils'));

    console.log('\n🧪 Testing Utility Functions\n');
    console.log('=' .repeat(50));

    // Test address validation
    console.log('\n📍 Address Validation Tests:\n');
    
    const testAddresses = [
      { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', network: 'ethereum', expected: true },
      { address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', network: 'tron', expected: true },
      { address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', network: 'solana', expected: true },
      { address: 'invalid', network: 'ethereum', expected: false },
    ];

    testAddresses.forEach(({ address, network, expected }) => {
      const result = addressUtils.isValidAddress(address, network);
      const status = result === expected ? '✅' : '❌';
      console.log(`   ${status} ${network}: ${address.slice(0, 20)}... = ${result}`);
    });

    // Test amount conversion
    console.log('\n💰 Amount Conversion Tests:\n');
    
    const amount = '1000.50';
    console.log(`   Input: ${amount} USDT\n`);

    const networks = ['ethereum', 'bnbChain', 'omni'];
    networks.forEach(network => {
      const parsed = amountUtils.parseUsdtAmount(amount, network);
      const formatted = amountUtils.formatUsdtAmount(parsed, network);
      console.log(`   ${network}:`);
      console.log(`     Parsed (raw): ${parsed.toString()}`);
      console.log(`     Formatted: ${formatted} USDT`);
    });

    // Test cross-network conversion
    console.log('\n🔄 Cross-Network Conversion:\n');
    const ethAmount = amountUtils.parseUsdtAmount('100', 'ethereum');
    const bnbAmount = amountUtils.convertUsdtBetweenNetworks(ethAmount, 'ethereum', 'bnbChain');
    console.log(`   100 USDT on Ethereum (6 decimals): ${ethAmount.toString()}`);
    console.log(`   Converted to BNB Chain (18 decimals): ${bnbAmount.toString()}`);
    console.log(`   Formatted: ${amountUtils.formatUsdtAmount(bnbAmount, 'bnbChain')} USDT`);

    // Test fee comparison
    console.log('\n⛽ Fee Comparison:\n');
    const fees = chainUtils.compareTransferFees().slice(0, 5);
    fees.forEach(({ network, fee, currency }) => {
      console.log(`   ${network}: ~${fee} ${currency}`);
    });

    // Test bridge availability
    console.log('\n🌉 Bridge Availability:\n');
    const bridges = chainUtils.getAvailableBridges('ethereum', 'polygon');
    console.log(`   Ethereum → Polygon bridges: ${bridges.length}`);
    bridges.slice(0, 3).forEach(b => {
      console.log(`   - ${b.name} (${b.type}): ${b.estimatedTime}`);
    });

    console.log('\n' + '=' .repeat(50));
    console.log('✅ All utility tests completed!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
