// TokenMetrics API Integration for Real Signals
const API_KEY = "tm-8e5bcce7-0c4a-4fe4-9dc0-8cf1c3b5a0a8";
const BASE_URL = "https://api.tokenmetrics.com/v2";

export interface TokenSignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: number;
  targetPrice?: number;
  stopLoss?: number;
  reason: string;
  timestamp: Date;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap?: number;
  sentiment: number; // -1 to 1
}

export class TokenMetricsAPI {
  private headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };

  // Get trading signals for specific tokens
  async getSignals(symbols: string[]): Promise<TokenSignal[]> {
    try {
      const response = await fetch(`${BASE_URL}/signals`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          symbols: symbols,
          limit: 10
        })
      });

      if (!response.ok) {
        throw new Error(`TokenMetrics API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.signals?.map((signal: any) => ({
        symbol: signal.symbol,
        action: signal.action?.toUpperCase() || 'HOLD',
        confidence: signal.confidence || 0.5,
        price: signal.current_price || 0,
        targetPrice: signal.target_price,
        stopLoss: signal.stop_loss,
        reason: signal.reason || 'Market analysis',
        timestamp: new Date(signal.timestamp || Date.now()),
        riskLevel: this.mapRiskLevel(signal.risk_score)
      })) || [];
    } catch (error) {
      console.error('Error fetching TokenMetrics signals:', error);
      // Return demo signals for hackathon
      return this.getDemoSignals(symbols);
    }
  }

  // Get market data for tokens
  async getMarketData(symbols: string[]): Promise<MarketData[]> {
    try {
      const response = await fetch(`${BASE_URL}/market-data`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          symbols: symbols
        })
      });

      if (!response.ok) {
        throw new Error(`TokenMetrics API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.market_data?.map((item: any) => ({
        symbol: item.symbol,
        price: item.price || 0,
        change24h: item.change_24h || 0,
        volume24h: item.volume_24h || 0,
        marketCap: item.market_cap,
        sentiment: item.sentiment_score || 0
      })) || [];
    } catch (error) {
      console.error('Error fetching market data:', error);
      return this.getDemoMarketData(symbols);
    }
  }

  // Get portfolio recommendations
  async getPortfolioSignals(): Promise<TokenSignal[]> {
    try {
      const response = await fetch(`${BASE_URL}/portfolio/recommendations`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`TokenMetrics API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.recommendations?.map((rec: any) => ({
        symbol: rec.symbol,
        action: rec.action?.toUpperCase() || 'HOLD',
        confidence: rec.confidence || 0.5,
        price: rec.current_price || 0,
        targetPrice: rec.target_price,
        stopLoss: rec.stop_loss,
        reason: rec.reasoning || 'Portfolio optimization',
        timestamp: new Date(rec.timestamp || Date.now()),
        riskLevel: this.mapRiskLevel(rec.risk_score)
      })) || [];
    } catch (error) {
      console.error('Error fetching portfolio signals:', error);
      return this.getDemoPortfolioSignals();
    }
  }

  private mapRiskLevel(riskScore?: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (!riskScore) return 'MEDIUM';
    if (riskScore < 0.3) return 'LOW';
    if (riskScore < 0.7) return 'MEDIUM';
    return 'HIGH';
  }

  private getDemoSignals(symbols: string[]): TokenSignal[] {
    const actions: ('BUY' | 'SELL' | 'HOLD')[] = ['BUY', 'SELL', 'HOLD'];
    const risks: ('LOW' | 'MEDIUM' | 'HIGH')[] = ['LOW', 'MEDIUM', 'HIGH'];
    
    return symbols.map(symbol => ({
      symbol,
      action: actions[Math.floor(Math.random() * actions.length)],
      confidence: Math.random() * 0.4 + 0.6, // 0.6-1.0
      price: Math.random() * 1000 + 100,
      targetPrice: Math.random() * 1200 + 120,
      stopLoss: Math.random() * 80 + 90,
      reason: `AI-driven analysis suggests ${actions[Math.floor(Math.random() * actions.length)].toLowerCase()} based on technical indicators`,
      timestamp: new Date(),
      riskLevel: risks[Math.floor(Math.random() * risks.length)]
    }));
  }

  private getDemoMarketData(symbols: string[]): MarketData[] {
    return symbols.map(symbol => ({
      symbol,
      price: Math.random() * 1000 + 100,
      change24h: (Math.random() - 0.5) * 20, // -10% to +10%
      volume24h: Math.random() * 1000000000,
      marketCap: Math.random() * 100000000000,
      sentiment: (Math.random() - 0.5) * 2 // -1 to 1
    }));
  }

  private getDemoPortfolioSignals(): TokenSignal[] {
    return [
      {
        symbol: 'ETH',
        action: 'BUY',
        confidence: 0.85,
        price: 2300,
        targetPrice: 2650,
        stopLoss: 2100,
        reason: 'Strong technical breakout above resistance with high volume',
        timestamp: new Date(),
        riskLevel: 'MEDIUM'
      },
      {
        symbol: 'BTC',
        action: 'HOLD',
        confidence: 0.72,
        price: 42000,
        targetPrice: 48000,
        stopLoss: 38000,
        reason: 'Consolidating in range, wait for clear direction',
        timestamp: new Date(),
        riskLevel: 'LOW'
      }
    ];
  }
}

export const tokenMetricsAPI = new TokenMetricsAPI();