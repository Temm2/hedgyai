// Messari API Integration for On-Chain Metrics
const API_KEY = "tPArlg7dwtyYJdyEUm0PZFFhp4FnG22Rot10KFxnNcdpa0q4";
const BASE_URL = "https://data.messari.io/api";

export interface MessariMetrics {
  id: string;
  symbol: string;
  name: string;
  market_data: {
    price_usd: number;
    price_btc: number;
    price_eth: number;
    volume_last_24_hours: number;
    real_volume_last_24_hours: number;
    volume_last_24_hours_overstatement_multiple: number;
    percent_change_usd_last_1_hour: number;
    percent_change_usd_last_24_hours: number;
    percent_change_usd_last_7_days: number;
    percent_change_usd_last_30_days: number;
    percent_change_usd_last_1_year: number;
  };
  marketcap: {
    rank: number;
    marketcap_dominance_percent: number;
    current_marketcap_usd: number;
    y_2050_marketcap_usd: number;
    y_plus10_marketcap_usd: number;
    liquid_marketcap_usd: number;
    volume_turnover_last_24_hours_percent: number;
  };
  supply: {
    y_2050: number;
    y_plus10: number;
    liquid: number;
    circulating: number;
    y_2050_issued_percent: number;
    annual_inflation_percent: number;
    stock_to_flow: number;
  };
}

export interface MessariTimeSeries {
  status: {
    elapsed: number;
    timestamp: string;
  };
  data: {
    parameters: {
      asset_key: string;
      asset_slugs: string[];
      metric_slugs: string[];
      start: string;
      end: string;
      interval: string;
      order: string;
      format: string;
      timestamp_format: string;
    };
    values: Array<[string, number]>;
  };
}

export class MessariAPI {
  private headers = {
    'x-messari-api-key': API_KEY,
    'Content-Type': 'application/json',
  };

  // Get asset metrics
  async getAssetMetrics(assetSlug: string): Promise<MessariMetrics | null> {
    try {
      const response = await fetch(`${BASE_URL}/v1/assets/${assetSlug}/metrics`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Messari API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error fetching Messari asset metrics:', error);
      return null;
    }
  }

  // Get time series data for specific metrics
  async getTimeSeries(
    assetSlug: string, 
    metric: string, 
    start?: string, 
    end?: string, 
    interval: string = '1d'
  ): Promise<MessariTimeSeries | null> {
    try {
      let url = `${BASE_URL}/v1/assets/${assetSlug}/metrics/${metric}/time-series?interval=${interval}`;
      
      if (start) url += `&start=${start}`;
      if (end) url += `&end=${end}`;

      const response = await fetch(url, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Messari API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Messari time series:', error);
      return null;
    }
  }

  // Get all assets
  async getAssets(limit: number = 100): Promise<any[]> {
    try {
      const response = await fetch(`${BASE_URL}/v2/assets?limit=${limit}`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Messari API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching Messari assets:', error);
      return [];
    }
  }

  // Get market data for ETH and BTC specifically
  async getETHBTCMetrics(): Promise<{ eth: MessariMetrics | null; btc: MessariMetrics | null }> {
    try {
      const [ethMetrics, btcMetrics] = await Promise.all([
        this.getAssetMetrics('ethereum'),
        this.getAssetMetrics('bitcoin')
      ]);

      return {
        eth: ethMetrics,
        btc: btcMetrics
      };
    } catch (error) {
      console.error('Error fetching ETH/BTC metrics:', error);
      return { eth: null, btc: null };
    }
  }

  // Get DeFi yield data (using TVL and volume metrics)
  async getDeFiYieldData(assetSlug: string): Promise<{ tvl: number; yield: number } | null> {
    try {
      const metrics = await this.getAssetMetrics(assetSlug);
      
      if (!metrics) return null;

      // Calculate estimated yield based on volume/TVL ratio
      const volume24h = metrics.market_data.real_volume_last_24_hours;
      const marketCap = metrics.marketcap.current_marketcap_usd;
      
      // Simple yield estimation: (volume/marketcap) * 365 * fee_rate
      const estimatedYield = (volume24h / marketCap) * 365 * 0.003 * 100; // Assuming 0.3% fee rate
      
      return {
        tvl: marketCap,
        yield: Math.min(estimatedYield, 100) // Cap at 100% APY
      };
    } catch (error) {
      console.error('Error calculating DeFi yield:', error);
      return null;
    }
  }

  // Map token symbols to Messari slugs
  getAssetSlug(symbol: string): string {
    const slugMap: Record<string, string> = {
      'ETH': 'ethereum',
      'BTC': 'bitcoin',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'DAI': 'multi-collateral-dai',
      'WBTC': 'wrapped-bitcoin'
    };
    return slugMap[symbol.toUpperCase()] || symbol.toLowerCase();
  }
}

export const messariAPI = new MessariAPI();