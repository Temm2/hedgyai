// Technical Indicators Integration for Strategy Calculations
import { SMA, RSI, MACD, BollingerBands, EMA, StochasticRSI, ATR, OBV } from 'technicalindicators';

export interface TechnicalIndicatorInputs {
  close: number[];
  high?: number[];
  low?: number[];
  volume?: number[];
  period?: number;
}

export interface TechnicalSignals {
  trend: 'bullish' | 'bearish' | 'neutral';
  momentum: 'strong' | 'weak' | 'neutral';
  volatility: 'high' | 'medium' | 'low';
  volume: 'high' | 'low' | 'normal';
  score: number; // 0-100
  signals: {
    sma: number;
    ema: number;
    rsi: number;
    macd: { MACD: number; signal: number; histogram: number };
    bollinger: { upper: number; middle: number; lower: number; position: string };
    stochRsi: number;
    atr: number;
    obv: number;
  };
}

export class TechnicalAnalyzer {
  // Calculate all technical indicators
  static calculateSignals(inputs: TechnicalIndicatorInputs): TechnicalSignals {
    const { close, high, low, volume, period = 14 } = inputs;
    
    if (close.length < period) {
      throw new Error(`Insufficient data: need at least ${period} periods`);
    }

    // Calculate indicators
    const sma = SMA.calculate({ period: period, values: close });
    const ema = EMA.calculate({ period: period, values: close });
    const rsi = RSI.calculate({ period: period, values: close });
    
    // Simple MACD calculation using EMAs
    const ema12 = EMA.calculate({ period: 12, values: close });
    const ema26 = EMA.calculate({ period: 26, values: close });
    const macdLine = [];
    
    for (let i = 0; i < Math.min(ema12.length, ema26.length); i++) {
      macdLine.push(ema12[ema12.length - 1 - i] - ema26[ema26.length - 1 - i]);
    }
    
    const macdSignal = EMA.calculate({ period: 9, values: macdLine.reverse() });
    const macd = macdLine.map((line, i) => ({
      MACD: line,
      signal: macdSignal[i] || 0,
      histogram: line - (macdSignal[i] || 0)
    }));
    
    const bollingerInput = { 
      period: 20, 
      stdDev: 2, 
      values: close 
    };
    const bollinger = BollingerBands.calculate(bollingerInput);
    
    const stochRsi = StochasticRSI.calculate({
      rsiPeriod: 14,
      stochasticPeriod: 14,
      kPeriod: 3,
      dPeriod: 3,
      values: close
    });

    let atr: number[] = [];
    let obv: number[] = [];

    if (high && low) {
      atr = ATR.calculate({ 
        period: period, 
        high, 
        low, 
        close 
      });
    }

    if (volume) {
      obv = OBV.calculate({ close, volume });
    }

    // Get latest values
    const latest = {
      sma: sma[sma.length - 1] || 0,
      ema: ema[ema.length - 1] || 0,
      rsi: rsi[rsi.length - 1] || 50,
      macd: macd[macd.length - 1] || { MACD: 0, signal: 0, histogram: 0 },
      bollinger: bollinger[bollinger.length - 1] || { upper: 0, middle: 0, lower: 0 },
      stochRsi: stochRsi[stochRsi.length - 1]?.k || 50,
      atr: atr[atr.length - 1] || 0,
      obv: obv[obv.length - 1] || 0,
      currentPrice: close[close.length - 1]
    };

    // Analyze signals
    const trend = this.analyzeTrend(latest);
    const momentum = this.analyzeMomentum(latest);
    const volatility = this.analyzeVolatility(latest, close);
    const volumeSignal = this.analyzeVolume(latest, volume);
    
    // Calculate composite score
    const score = this.calculateCompositeScore({
      trend,
      momentum,
      volatility,
      volume: volumeSignal,
      rsi: latest.rsi,
      macd: latest.macd,
      bollinger: latest.bollinger,
      currentPrice: latest.currentPrice
    });

    return {
      trend,
      momentum,
      volatility,
      volume: volumeSignal,
      score,
      signals: {
        sma: latest.sma,
        ema: latest.ema,
        rsi: latest.rsi,
        macd: { MACD: latest.macd.MACD, signal: latest.macd.signal, histogram: latest.macd.histogram },
        bollinger: {
          upper: latest.bollinger.upper || 0,
          middle: latest.bollinger.middle || 0,
          lower: latest.bollinger.lower || 0,
          position: this.getBollingerPosition(latest.currentPrice, latest.bollinger)
        },
        stochRsi: latest.stochRsi,
        atr: latest.atr,
        obv: latest.obv
      }
    };
  }

  private static analyzeTrend(signals: any): 'bullish' | 'bearish' | 'neutral' {
    const { currentPrice, sma, ema, macd } = signals;
    
    let bullishSignals = 0;
    let bearishSignals = 0;

    // Price above moving averages
    if (currentPrice > sma) bullishSignals++;
    else bearishSignals++;

    if (currentPrice > ema) bullishSignals++;
    else bearishSignals++;

    // MACD signals
    if (macd.MACD > macd.signal) bullishSignals++;
    else bearishSignals++;

    if (bullishSignals >= 2) return 'bullish';
    if (bearishSignals >= 2) return 'bearish';
    return 'neutral';
  }

  private static analyzeMomentum(signals: any): 'strong' | 'weak' | 'neutral' {
    const { rsi, stochRsi, macd } = signals;
    
    // RSI momentum
    if (rsi > 70 || rsi < 30) return 'strong';
    if (rsi > 60 || rsi < 40) return 'weak';
    
    // Stochastic RSI
    if (stochRsi > 80 || stochRsi < 20) return 'strong';
    
    // MACD histogram growing
    if (Math.abs(macd.histogram) > 0.5) return 'strong';
    
    return 'neutral';
  }

  private static analyzeVolatility(signals: any, prices: number[]): 'high' | 'medium' | 'low' {
    const { atr, bollinger, currentPrice } = signals;
    
    if (atr > 0) {
      const atrPercentage = (atr / currentPrice) * 100;
      if (atrPercentage > 3) return 'high';
      if (atrPercentage > 1.5) return 'medium';
      return 'low';
    }

    // Fallback: Calculate price volatility from recent data
    if (prices.length >= 10) {
      const recent = prices.slice(-10);
      const volatility = this.calculateVolatility(recent);
      if (volatility > 0.03) return 'high';
      if (volatility > 0.015) return 'medium';
      return 'low';
    }

    return 'medium';
  }

  private static analyzeVolume(signals: any, volume?: number[]): 'high' | 'low' | 'normal' {
    const { obv } = signals;
    
    if (!volume || volume.length < 10) return 'normal';
    
    const recentVolume = volume.slice(-5);
    const averageVolume = volume.slice(-20, -5).reduce((a, b) => a + b, 0) / 15;
    const currentAvg = recentVolume.reduce((a, b) => a + b, 0) / 5;
    
    if (currentAvg > averageVolume * 1.5) return 'high';
    if (currentAvg < averageVolume * 0.7) return 'low';
    return 'normal';
  }

  private static getBollingerPosition(price: number, bollinger: any): string {
    const { upper, middle, lower } = bollinger;
    
    if (price > upper) return 'above_upper';
    if (price > middle) return 'upper_half';
    if (price > lower) return 'lower_half';
    return 'below_lower';
  }

  private static calculateCompositeScore(analysis: any): number {
    let score = 50; // Neutral baseline
    
    // Trend scoring
    if (analysis.trend === 'bullish') score += 15;
    else if (analysis.trend === 'bearish') score -= 15;
    
    // Momentum scoring
    if (analysis.momentum === 'strong') {
      score += analysis.rsi > 50 ? 10 : -10;
    }
    
    // RSI scoring
    if (analysis.rsi > 70) score += 5;
    else if (analysis.rsi < 30) score -= 5;
    
    // MACD scoring
    if (analysis.macd.histogram > 0) score += 5;
    else score -= 5;
    
    // Bollinger position
    const bollPos = analysis.bollinger.position;
    if (bollPos === 'above_upper') score += 10;
    else if (bollPos === 'below_lower') score -= 10;
    
    // Volume confirmation
    if (analysis.volume === 'high' && analysis.trend === 'bullish') score += 5;
    else if (analysis.volume === 'low' && analysis.trend === 'bearish') score -= 5;
    
    // Volatility adjustment
    if (analysis.volatility === 'high') score *= 1.1; // Amplify signals in high volatility
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private static calculateVolatility(prices: number[]): number {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  // Strategy-specific analysis
  static analyzeForStrategy(inputs: TechnicalIndicatorInputs, strategy: string): TechnicalSignals & { strategyMultiplier: number } {
    const signals = this.calculateSignals(inputs);
    const strategyMultiplier = this.getStrategyMultiplier(signals, strategy);
    
    return {
      ...signals,
      strategyMultiplier
    };
  }

  private static getStrategyMultiplier(signals: TechnicalSignals, strategy: string): number {
    switch (strategy) {
      case "Momentum Rotation":
        return signals.momentum === 'strong' && signals.trend === 'bullish' ? 1.3 : 
               signals.momentum === 'weak' ? 0.8 : 1.0;
      
      case "Mean Reversion":
        return signals.signals.rsi < 30 || signals.signals.rsi > 70 ? 1.2 : 
               signals.trend === 'neutral' ? 1.1 : 0.9;
      
      case "Options Writing":
        return signals.volatility === 'high' ? 1.25 : 
               signals.volatility === 'low' ? 0.85 : 1.0;
      
      case "High-Yield Crypto Credit":
        return signals.volatility === 'low' && signals.trend === 'bullish' ? 1.15 : 0.95;
      
      default:
        return signals.score > 65 ? 1.1 : signals.score < 35 ? 0.9 : 1.0;
    }
  }
}