/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Market Data API client for USDT price and market information
 * 
 * @author Velocity BPA
 * @website https://velobpa.com
 */

import axios, { AxiosInstance } from 'axios';

export interface MarketDataClientConfig {
  coingeckoApiKey?: string;
  timeout?: number;
}

export interface UsdtPrice {
  price: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  source: string;
  timestamp: string;
}

export interface MarketData {
  price: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply: number;
  athPrice: number;
  athDate: string;
  atlPrice: number;
  atlDate: string;
}

export interface VolumeData {
  volume24h: number;
  volumeByExchange: Record<string, number>;
  timestamp: string;
}

export interface DepegAlert {
  isDepegged: boolean;
  currentPrice: number;
  deviation: number;
  deviationPercentage: number;
  threshold: number;
  alertLevel: 'none' | 'warning' | 'critical';
}

export class MarketDataClient {
  private coingeckoClient: AxiosInstance;

  constructor(config: MarketDataClientConfig = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (config.coingeckoApiKey) {
      headers['x-cg-demo-api-key'] = config.coingeckoApiKey;
    }

    this.coingeckoClient = axios.create({
      baseURL: 'https://api.coingecko.com/api/v3',
      timeout: config.timeout || 30000,
      headers,
    });
  }

  /**
   * Get current USDT price
   */
  async getPrice(): Promise<UsdtPrice> {
    try {
      const response = await this.coingeckoClient.get('/simple/price', {
        params: {
          ids: 'tether',
          vs_currencies: 'usd',
          include_24hr_change: true,
        },
      });

      const data = response.data.tether;
      
      return {
        price: data.usd || 1,
        priceChange24h: data.usd_24h_change || 0,
        priceChangePercentage24h: data.usd_24h_change || 0,
        source: 'CoinGecko',
        timestamp: new Date().toISOString(),
      };
    } catch {
      // Return default peg value if API fails
      return {
        price: 1,
        priceChange24h: 0,
        priceChangePercentage24h: 0,
        source: 'Default',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get comprehensive market data
   */
  async getMarketData(): Promise<MarketData> {
    try {
      const response = await this.coingeckoClient.get('/coins/tether');
      const data = response.data;
      const market = data.market_data;

      return {
        price: market.current_price?.usd || 1,
        marketCap: market.market_cap?.usd || 0,
        volume24h: market.total_volume?.usd || 0,
        circulatingSupply: market.circulating_supply || 0,
        totalSupply: market.total_supply || 0,
        athPrice: market.ath?.usd || 1,
        athDate: market.ath_date?.usd || '',
        atlPrice: market.atl?.usd || 0,
        atlDate: market.atl_date?.usd || '',
      };
    } catch {
      return {
        price: 1,
        marketCap: 0,
        volume24h: 0,
        circulatingSupply: 0,
        totalSupply: 0,
        athPrice: 1,
        athDate: '',
        atlPrice: 0,
        atlDate: '',
      };
    }
  }

  /**
   * Get trading volume data
   */
  async getVolumeData(): Promise<VolumeData> {
    try {
      const response = await this.coingeckoClient.get('/coins/tether/tickers');
      const tickers = response.data.tickers || [];

      const volumeByExchange: Record<string, number> = {};
      let totalVolume = 0;

      for (const ticker of tickers.slice(0, 20)) {
        const exchangeName = ticker.market?.name || 'Unknown';
        const volume = ticker.converted_volume?.usd || 0;
        volumeByExchange[exchangeName] = (volumeByExchange[exchangeName] || 0) + volume;
        totalVolume += volume;
      }

      return {
        volume24h: totalVolume,
        volumeByExchange,
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        volume24h: 0,
        volumeByExchange: {},
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get price history
   */
  async getPriceHistory(
    days: number = 30
  ): Promise<Array<{ timestamp: number; price: number }>> {
    try {
      const response = await this.coingeckoClient.get('/coins/tether/market_chart', {
        params: {
          vs_currency: 'usd',
          days,
        },
      });

      return response.data.prices.map((point: [number, number]) => ({
        timestamp: point[0],
        price: point[1],
      }));
    } catch {
      return [];
    }
  }

  /**
   * Check for depeg condition
   */
  async checkDepeg(threshold: number = 0.02): Promise<DepegAlert> {
    const price = await this.getPrice();
    const deviation = Math.abs(price.price - 1);
    const deviationPercentage = deviation * 100;

    let alertLevel: 'none' | 'warning' | 'critical' = 'none';
    if (deviation >= threshold) {
      alertLevel = 'critical';
    } else if (deviation >= threshold / 2) {
      alertLevel = 'warning';
    }

    return {
      isDepegged: deviation >= threshold,
      currentPrice: price.price,
      deviation,
      deviationPercentage,
      threshold,
      alertLevel,
    };
  }

  /**
   * Get spread vs USD across exchanges
   */
  async getSpreadData(): Promise<Array<{
    exchange: string;
    price: number;
    spread: number;
    volume24h: number;
  }>> {
    try {
      const response = await this.coingeckoClient.get('/coins/tether/tickers');
      const tickers = response.data.tickers || [];

      return tickers
        .filter((t: { target: string }) => t.target === 'USD' || t.target === 'USDC')
        .slice(0, 20)
        .map((ticker: {
          market: { name: string };
          last: number;
          bid_ask_spread_percentage: number;
          converted_volume: { usd: number };
        }) => ({
          exchange: ticker.market?.name || 'Unknown',
          price: ticker.last || 1,
          spread: ticker.bid_ask_spread_percentage || 0,
          volume24h: ticker.converted_volume?.usd || 0,
        }));
    } catch {
      return [];
    }
  }

  /**
   * Get liquidity depth (simplified)
   */
  async getLiquidityInfo(): Promise<{
    totalLiquidity: string;
    topPairs: Array<{ pair: string; exchange: string; liquidity: string }>;
  }> {
    try {
      const response = await this.coingeckoClient.get('/coins/tether/tickers');
      const tickers = response.data.tickers || [];

      const topPairs = tickers
        .slice(0, 10)
        .map((ticker: {
          base: string;
          target: string;
          market: { name: string };
          converted_volume: { usd: number };
        }) => ({
          pair: `${ticker.base}/${ticker.target}`,
          exchange: ticker.market?.name || 'Unknown',
          liquidity: `$${(ticker.converted_volume?.usd || 0).toLocaleString()}`,
        }));

      return {
        totalLiquidity: 'See volume data',
        topPairs,
      };
    } catch {
      return {
        totalLiquidity: 'Unable to fetch',
        topPairs: [],
      };
    }
  }

  /**
   * Get USDT dominance in stablecoin market
   */
  async getStablecoinDominance(): Promise<{
    usdtDominance: number;
    marketShare: Record<string, number>;
  }> {
    try {
      const stablecoins = ['tether', 'usd-coin', 'dai', 'true-usd', 'frax'];
      const response = await this.coingeckoClient.get('/simple/price', {
        params: {
          ids: stablecoins.join(','),
          vs_currencies: 'usd',
          include_market_cap: true,
        },
      });

      const data = response.data;
      const marketCaps: Record<string, number> = {};
      let totalMarketCap = 0;

      for (const coin of stablecoins) {
        const mcap = data[coin]?.usd_market_cap || 0;
        marketCaps[coin] = mcap;
        totalMarketCap += mcap;
      }

      const marketShare: Record<string, number> = {};
      for (const [coin, mcap] of Object.entries(marketCaps)) {
        marketShare[coin] = totalMarketCap > 0 ? (mcap / totalMarketCap) * 100 : 0;
      }

      return {
        usdtDominance: marketShare['tether'] || 0,
        marketShare,
      };
    } catch {
      return {
        usdtDominance: 0,
        marketShare: {},
      };
    }
  }
}

/**
 * Create a Market Data client
 */
export function createMarketDataClient(config?: MarketDataClientConfig): MarketDataClient {
  return new MarketDataClient(config);
}
