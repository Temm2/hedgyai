// Price Oracle Service for Grid Trading and Stop Loss
import { oneInchAPI } from './oneinch-api';
import { chainflipAPI } from './chainflip-api';

export interface PriceData {
  pair: string;
  price: number;
  timestamp: number;
  source: 'oneinch' | 'chainflip' | 'coingecko' | 'mock';
}

export interface PriceAlert {
  id: string;
  pair: string;
  condition: 'above' | 'below';
  targetPrice: number;
  currentPrice: number;
  triggered: boolean;
  callback?: (price: PriceData) => void;
}

export class PriceOracle {
  private prices: Map<string, PriceData> = new Map();
  private alerts: Map<string, PriceAlert> = new Map();
  private updateInterval: number = 10000; // 10 seconds
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.startPriceUpdates();
  }

  // Start automatic price updates
  startPriceUpdates() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.updateAllPrices();
    }, this.updateInterval);
  }

  // Stop automatic price updates
  stopPriceUpdates() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  // Get current price for a trading pair
  async getPrice(pair: string): Promise<PriceData> {
    // Check cache first
    const cached = this.prices.get(pair);
    if (cached && Date.now() - cached.timestamp < 30000) { // 30 seconds cache
      return cached;
    }

    try {
      let priceData: PriceData;

      // Determine source based on pair
      if (pair.includes('BTC') && pair.includes('ETH')) {
        // Use Chainflip for BTC/ETH pairs
        priceData = await this.getPriceFromChainflip(pair);
      } else {
        // Use 1inch for EVM pairs
        priceData = await this.getPriceFrom1inch(pair);
      }

      this.prices.set(pair, priceData);
      this.checkAlerts(priceData);
      
      return priceData;
    } catch (error) {
      console.error('Error fetching price:', error);
      return this.getMockPrice(pair);
    }
  }

  // Get price from 1inch API
  private async getPriceFrom1inch(pair: string): Promise<PriceData> {
    const [base, quote] = pair.split('/');
    
    try {
      // Get token addresses (simplified - in production, use a token registry)
      const tokenMap: Record<string, string> = {
        'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        'USDC': '0xA0b86a33E6417c479B6F3b44F1676c9dA9e94A9e',
        'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      };

      const baseToken = tokenMap[base];
      const quoteToken = tokenMap[quote];

      if (!baseToken || !quoteToken) {
        throw new Error(`Unsupported token pair: ${pair}`);
      }

      const prices = await oneInchAPI.getTokenPrices([baseToken, quoteToken], 1);
      const basePrice = prices[baseToken] || 1;
      const quotePrice = prices[quoteToken] || 1;
      
      return {
        pair,
        price: basePrice / quotePrice,
        timestamp: Date.now(),
        source: 'oneinch'
      };
    } catch (error) {
      console.error('1inch price fetch failed:', error);
      throw error;
    }
  }

  // Get price from Chainflip API
  private async getPriceFromChainflip(pair: string): Promise<PriceData> {
    const [base, quote] = pair.split('/');
    
    try {
      const price = await chainflipAPI.getMarketPrice(base, quote);
      
      return {
        pair,
        price,
        timestamp: Date.now(),
        source: 'chainflip'
      };
    } catch (error) {
      console.error('Chainflip price fetch failed:', error);
      throw error;
    }
  }

  // Get mock price for development
  private getMockPrice(pair: string): PriceData {
    const mockPrices: Record<string, number> = {
      'ETH/USD': 2500,
      'BTC/USD': 45000,
      'ETH/BTC': 0.055,
      'BTC/ETH': 18.18,
      'USDC/USD': 1,
      'USDT/USD': 1,
    };

    const basePrice = mockPrices[pair] || 1;
    // Add some random variation
    const variation = (Math.random() - 0.5) * 0.02; // ±1%
    const price = basePrice * (1 + variation);

    return {
      pair,
      price,
      timestamp: Date.now(),
      source: 'mock'
    };
  }

  // Update all tracked prices
  private async updateAllPrices() {
    const pairs = Array.from(this.prices.keys());
    
    for (const pair of pairs) {
      try {
        await this.getPrice(pair);
      } catch (error) {
        console.error(`Failed to update price for ${pair}:`, error);
      }
    }
  }

  // Set price alert
  setAlert(
    pair: string,
    condition: 'above' | 'below',
    targetPrice: number,
    callback?: (price: PriceData) => void
  ): string {
    const id = `${pair}_${condition}_${targetPrice}_${Date.now()}`;
    
    this.alerts.set(id, {
      id,
      pair,
      condition,
      targetPrice,
      currentPrice: 0,
      triggered: false,
      callback
    });

    return id;
  }

  // Remove price alert
  removeAlert(id: string): boolean {
    return this.alerts.delete(id);
  }

  // Check all alerts against current prices
  private checkAlerts(priceData: PriceData) {
    for (const alert of this.alerts.values()) {
      if (alert.pair === priceData.pair && !alert.triggered) {
        const shouldTrigger = 
          (alert.condition === 'above' && priceData.price >= alert.targetPrice) ||
          (alert.condition === 'below' && priceData.price <= alert.targetPrice);

        if (shouldTrigger) {
          alert.triggered = true;
          alert.currentPrice = priceData.price;
          
          if (alert.callback) {
            try {
              alert.callback(priceData);
            } catch (error) {
              console.error('Error in price alert callback:', error);
            }
          }

          console.log(`Price alert triggered: ${alert.pair} is ${alert.condition} ${alert.targetPrice}`);
        }
      }
    }
  }

  // Get price history (simplified - in production, would use a time-series database)
  getPriceHistory(pair: string, timeframe: '1h' | '1d' | '1w' = '1h'): PriceData[] {
    // Mock historical data
    const now = Date.now();
    const intervals = timeframe === '1h' ? 60 : timeframe === '1d' ? 24 : 168;
    const intervalMs = timeframe === '1h' ? 60000 : timeframe === '1d' ? 3600000 : 3600000;
    
    const history: PriceData[] = [];
    const currentPrice = this.prices.get(pair);
    const basePrice = currentPrice?.price || this.getMockPrice(pair).price;
    
    for (let i = intervals; i >= 0; i--) {
      const variation = (Math.random() - 0.5) * 0.05; // ±2.5%
      const price = basePrice * (1 + variation);
      
      history.push({
        pair,
        price,
        timestamp: now - (i * intervalMs),
        source: 'mock'
      });
    }
    
    return history;
  }

  // Calculate price change percentage
  getPriceChange(pair: string, timeframe: '1h' | '1d' | '1w' = '1d'): number {
    const history = this.getPriceHistory(pair, timeframe);
    if (history.length < 2) return 0;
    
    const oldPrice = history[0].price;
    const newPrice = history[history.length - 1].price;
    
    return ((newPrice - oldPrice) / oldPrice) * 100;
  }

  // Get all tracked pairs
  getTrackedPairs(): string[] {
    return Array.from(this.prices.keys());
  }

  // Get all active alerts
  getActiveAlerts(): PriceAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.triggered);
  }

  // Cleanup
  destroy() {
    this.stopPriceUpdates();
    this.prices.clear();
    this.alerts.clear();
  }
}

export const priceOracle = new PriceOracle();