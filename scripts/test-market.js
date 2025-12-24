#!/usr/bin/env node

/**
 * Test Script: Market Data
 * Tests the market data API client
 * 
 * Usage: node scripts/test-market.js [operation]
 * Operations: price, market, depeg, volume, dominance
 * 
 * @author Velocity BPA
 * @website https://velobpa.com
 */

const path = require('path');

async function main() {
  const operation = process.argv[2] || 'price';

  try {
    const { MarketDataClient } = require(path.join(__dirname, '../dist/nodes/Tether/transport/marketDataApi'));
    
    const client = new MarketDataClient();
    
    console.log(`\n📊 Fetching USDT ${operation} data...\n`);

    let result;
    switch (operation) {
      case 'price':
        result = await client.getPrice();
        console.log('💰 USDT Price:');
        console.log(`   Price: $${result.price}`);
        console.log(`   24h Change: ${result.priceChangePercentage24h}%`);
        console.log(`   Source: ${result.source}`);
        break;

      case 'market':
        result = await client.getMarketData();
        console.log('📈 Market Data:');
        console.log(`   Price: $${result.price}`);
        console.log(`   Market Cap: $${result.marketCap.toLocaleString()}`);
        console.log(`   24h Volume: $${result.volume24h.toLocaleString()}`);
        console.log(`   Circulating Supply: ${result.circulatingSupply.toLocaleString()}`);
        break;

      case 'depeg':
        result = await client.checkDepeg(0.01);
        console.log('⚠️ Depeg Check:');
        console.log(`   Is Depegged: ${result.isDepegged ? 'YES ⚠️' : 'NO ✅'}`);
        console.log(`   Current Price: $${result.currentPrice}`);
        console.log(`   Deviation: ${(result.deviationPercentage).toFixed(4)}%`);
        console.log(`   Alert Level: ${result.alertLevel}`);
        break;

      case 'volume':
        result = await client.getVolumeData();
        console.log('📊 Volume Data:');
        console.log(`   24h Volume: $${result.volume24h.toLocaleString()}`);
        console.log('   Top Exchanges:');
        Object.entries(result.volumeByExchange).slice(0, 5).forEach(([exchange, vol]) => {
          console.log(`   - ${exchange}: $${vol.toLocaleString()}`);
        });
        break;

      case 'dominance':
        result = await client.getStablecoinDominance();
        console.log('🏆 Stablecoin Dominance:');
        console.log(`   USDT Dominance: ${result.usdtDominance.toFixed(2)}%`);
        console.log('   Market Share:');
        Object.entries(result.marketShare).forEach(([coin, share]) => {
          console.log(`   - ${coin}: ${share.toFixed(2)}%`);
        });
        break;

      default:
        console.log('Unknown operation. Use: price, market, depeg, volume, dominance');
    }

    console.log('\n✅ Test completed successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
