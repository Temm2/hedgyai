// CoinGecko API Integration for Enhanced Price Data
const API_KEY = "CG-TXsYHY4YdXPK3HiPuVNdfM2r";
const BASE_URL = "https://api.coingecko.com/api/v3";

export interface CoinGeckoPriceData {
  id: string;
  symbol: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
}

export interface CoinGeckoMarketData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export class CoinGeckoAPI {
  private headers = {
    'x-cg-demo-api-key': API_KEY,
    'Content-Type': 'application/json',
  };

  // Get current prices for multiple coins
  async getCoinsMarket(coinIds: string[], vsCurrency: string = 'usd'): Promise<CoinGeckoPriceData[]> {
    try {
      const response = await fetch(
        `${BASE_URL}/coins/markets?ids=${coinIds.join(',')}&vs_currency=${vsCurrency}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching CoinGecko market data:', error);
      return [];
    }
  }

  // Get simple price for quick lookups
  async getSimplePrice(coinIds: string[], vsCurrency: string = 'usd'): Promise<Record<string, { usd: number }>> {
    try {
      const response = await fetch(
        `${BASE_URL}/simple/price?ids=${coinIds.join(',')}&vs_currencies=${vsCurrency}&include_24hr_change=true`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching CoinGecko simple price:', error);
      return {};
    }
  }

  // Get historical market data
  async getMarketChart(coinId: string, vsCurrency: string = 'usd', days: number = 30): Promise<CoinGeckoMarketData | null> {
    try {
      const response = await fetch(
        `${BASE_URL}/coins/${coinId}/market_chart?vs_currency=${vsCurrency}&days=${days}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching CoinGecko market chart:', error);
      return null;
    }
  }

  // Get price for ETH/BTC pair specifically
  async getETHBTCPrice(): Promise<{ eth_to_btc: number; btc_to_eth: number } | null> {
    try {
      const prices = await this.getSimplePrice(['ethereum', 'bitcoin'], 'usd');
      
      if (prices.ethereum?.usd && prices.bitcoin?.usd) {
        const ethPrice = prices.ethereum.usd;
        const btcPrice = prices.bitcoin.usd;
        
        return {
          eth_to_btc: ethPrice / btcPrice,
          btc_to_eth: btcPrice / ethPrice
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching ETH/BTC price:', error);
      return null;
    }
  }

  // Map token symbols to CoinGecko IDs
  getTokenCoinGeckoId(symbol: string): string {
    const tokenMap: Record<string, string> = {
      'ETH': 'ethereum',
      'BTC': 'bitcoin',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'DAI': 'dai',
      'WBTC': 'wrapped-bitcoin'
    };
    return tokenMap[symbol.toUpperCase()] || symbol.toLowerCase();
  }
}

export const coinGeckoAPI = new CoinGeckoAPI();