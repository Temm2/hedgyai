import { useState, useEffect } from 'react';
import { oneInchAPI } from '@/lib/oneinch-api';
import { tokenMetricsAPI } from '@/lib/tokenmetrics-api';
import { blocknativeGasAPI } from '@/lib/blocknative-gas-api';
import { coinGeckoAPI } from '@/lib/coingecko-api';
import { aaveAPI } from '@/lib/aave-api';
import { messariAPI } from '@/lib/messari-api';
import { infuraGasAPI } from '@/lib/infura-gas-api';
import { TechnicalAnalyzer } from '@/lib/technical-indicators';

interface InvestmentCalculation {
  spotPrice: number;
  gasPrice: number;
  minReturn: string;
  guaranteedReturn: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  isLoading: boolean;
  error?: string;
}

export function useInvestmentCalculations(
  amount: string,
  tokenType: string,
  strategy: string,
  lockPeriod: string,
  chainId: number
) {
  const [calculation, setCalculation] = useState<InvestmentCalculation>({
    spotPrice: 0,
    gasPrice: 0,
    minReturn: '0',
    guaranteedReturn: '0',
    riskLevel: 'Medium',
    isLoading: false,
  });

  useEffect(() => {
    if (!amount || !tokenType || !strategy || !chainId) return;

    const calculateInvestment = async () => {
      setCalculation(prev => ({ ...prev, isLoading: true, error: undefined }));

      try {
        // Get real-time data from multiple APIs with fallback handling
        let spotPrice = 0;
        let signals: any[] = [];
        let gasCost = 0;
        let defiYield = 0;
        
        // 1. Get spot price from multiple sources
        try {
          // Try CoinGecko first for better price data
          const coinGeckoId = coinGeckoAPI.getTokenCoinGeckoId(tokenType);
          const priceData = await coinGeckoAPI.getSimplePrice([coinGeckoId]);
          spotPrice = priceData[coinGeckoId]?.usd || 0;
          
          // Fallback to 1inch if CoinGecko fails
          if (!spotPrice) {
            const spotPrices = await oneInchAPI.getTokenPrices([getTokenAddress(tokenType)], chainId);
            spotPrice = spotPrices[getTokenAddress(tokenType)]?.price || 0;
          }
        } catch (error) {
          console.warn('Price APIs failed, using fallback:', error);
        }
        
        if (!spotPrice) spotPrice = getTokenFallbackPrice(tokenType);
        
        // 2. Get trading signals from TokenMetrics
        try {
          signals = await tokenMetricsAPI.getSignals([tokenType]);
        } catch (error) {
          console.warn('TokenMetrics API failed, using demo signals:', error);
          signals = [];
        }
        
        // 3. Get gas costs from multiple sources with fallbacks
        try {
          if (chainId === 1) {
            // Try Infura first for Ethereum
            gasCost = await infuraGasAPI.getEstimatedGasCost('medium');
          }
          
          // Fallback to Blocknative for all chains
          if (!gasCost || gasCost === 0) {
            gasCost = await blocknativeGasAPI.getEstimatedGasCost(chainId);
          }
        } catch (error) {
          console.warn('Gas APIs failed, using fallback:', error);
          gasCost = getFallbackGasCost(chainId);
        }
        
        // 4. Get DeFi yield data from Aave and Messari
        try {
          const [aaveAPY, messariYield] = await Promise.all([
            aaveAPI.getLendingAPY(tokenType),
            messariAPI.getDeFiYieldData(messariAPI.getAssetSlug(tokenType))
          ]);
          
          defiYield = Math.max(aaveAPY, messariYield?.yield || 0);
        } catch (error) {
          console.warn('DeFi yield APIs failed, using fallback:', error);
          defiYield = 0;
        }
        
        // Enhanced calculation with technical indicators
        const baseRate = getStrategyBaseRate(strategy);
        const signalMultiplier = getSignalMultiplier(signals[0]);
        const defiMultiplier = getDefiYieldMultiplier(defiYield, strategy);
        const lockMultiplier = parseInt(lockPeriod) / 30;
        
        // Add technical analysis if we have price data
        let technicalMultiplier = 1;
        try {
          if (spotPrice > 0) {
            // Generate mock OHLC data for demo (in production, fetch real data)
            const mockPrices = generateMockPriceData(spotPrice, 30);
            const technicalSignals = TechnicalAnalyzer.analyzeForStrategy({
              close: mockPrices,
              period: 14
            }, strategy);
            
            technicalMultiplier = technicalSignals.strategyMultiplier;
          }
        } catch (error) {
          console.warn('Technical analysis failed:', error);
        }
        
        const adjustedRate = baseRate * signalMultiplier * defiMultiplier * technicalMultiplier;
        const minReturn = parseFloat(amount) * (adjustedRate / 100) * lockMultiplier;
        const guaranteedReturn = minReturn * 0.8; // 80% of calculated return

        // Determine risk level based on strategy and market signals
        const riskLevel = calculateRiskLevel(strategy, signals[0]);

        setCalculation({
          spotPrice,
          gasPrice: gasCost,
          minReturn: minReturn.toFixed(4),
          guaranteedReturn: guaranteedReturn.toFixed(4),
          riskLevel,
          isLoading: false,
        });

      } catch (error) {
        console.error('Investment calculation error:', error);
        setCalculation(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to calculate returns with real-time data',
          // Fallback to static calculations
          minReturn: calculateFallbackReturn(amount, strategy, lockPeriod),
          guaranteedReturn: (parseFloat(calculateFallbackReturn(amount, strategy, lockPeriod)) * 0.8).toFixed(4),
          riskLevel: getStrategyRiskLevel(strategy),
        }));
      }
    };

    calculateInvestment();
  }, [amount, tokenType, strategy, lockPeriod, chainId]);

  return calculation;
}

function getTokenAddress(tokenType: string): string {
  const addresses: Record<string, string> = {
    'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    'USDC': '0xA0b86a33E6417D05E60F0fe20b7A2a57f62fE1c6',
    'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    'BTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
  };
  return addresses[tokenType] || addresses['ETH'];
}

function getStrategyBaseRate(strategy: string): number {
  const rates: Record<string, number> = {
    "Stablecoin Farming": 8,
    "Momentum Rotation": 15,
    "Mean Reversion": 12,
    "Multi-Chain Arbitrage": 12,
    "High-Yield Crypto Credit": 25,
    "Options Writing": 18,
    "Structured Products": 20,
    "Meta Model Blend": 16
  };
  return rates[strategy] || 10;
}

function getSignalMultiplier(signal: any): number {
  if (!signal) return 1;
  
  const confidence = signal.confidence || 50;
  const action = signal.action?.toLowerCase();
  
  if (action === 'buy' && confidence > 80) return 1.3;
  if (action === 'buy' && confidence > 60) return 1.15;
  if (action === 'sell' && confidence > 80) return 0.7;
  if (action === 'sell' && confidence > 60) return 0.85;
  
  return 1;
}

function calculateRiskLevel(strategy: string, signal: any): 'Low' | 'Medium' | 'High' {
  const baseRisk = getStrategyRiskLevel(strategy);
  
  if (!signal) return baseRisk;
  
  const riskLevel = signal.riskLevel?.toLowerCase();
  if (riskLevel === 'high') return 'High';
  if (riskLevel === 'low') return 'Low';
  
  return baseRisk;
}

function getStrategyRiskLevel(strategy: string): 'Low' | 'Medium' | 'High' {
  if (['Stablecoin Farming'].includes(strategy)) return 'Low';
  if (['High-Yield Crypto Credit', 'Structured Products'].includes(strategy)) return 'High';
  return 'Medium';
}

function getFallbackGasCost(chainId: number): number {
  const gasEstimates: Record<number, number> = {
    1: 0.008,    // Ethereum - more realistic for DeFi
    137: 0.001,  // Polygon
    56: 0.002,   // BSC
    42161: 0.001, // Arbitrum
    0: 0.0001,   // Bitcoin
  };
  return gasEstimates[chainId] || 0.008;
}

function getDefiYieldMultiplier(defiYield: number, strategy: string): number {
  // Adjust strategy returns based on real DeFi yields
  if (strategy.includes('Stablecoin') && defiYield > 0) {
    return Math.min(1 + (defiYield / 100), 1.5); // Cap at 50% boost
  }
  
  if (strategy.includes('High-Yield') && defiYield > 0) {
    return Math.min(1 + (defiYield / 200), 1.3); // Cap at 30% boost
  }
  
  return 1; // No adjustment for other strategies
}

function calculateFallbackReturn(amount: string, strategy: string, lockPeriod: string): string {
  const baseRate = getStrategyBaseRate(strategy);
  const lockMultiplier = parseInt(lockPeriod) / 30;
  const minReturn = parseFloat(amount) * (baseRate / 100) * lockMultiplier;
  return minReturn.toFixed(4);
}

function getTokenFallbackPrice(tokenType: string): number {
  const fallbackPrices: Record<string, number> = {
    'ETH': 3766,
    'BTC': 98000,
    'USDC': 1,
    'USDT': 1,
    'DAI': 1,
  };
  return fallbackPrices[tokenType] || 100;
}

function generateMockPriceData(currentPrice: number, periods: number): number[] {
  const prices = [];
  let price = currentPrice * 0.9; // Start 10% lower
  
  for (let i = 0; i < periods; i++) {
    // Add some realistic price movement
    const change = (Math.random() - 0.5) * 0.05; // ±2.5% random movement
    price *= (1 + change);
    prices.push(price);
  }
  
  // Ensure last price is close to current price
  prices[prices.length - 1] = currentPrice;
  
  return prices;
}