import { useState, useEffect } from 'react';
import { oneInchAPI, type SwapParams, type LimitOrderParams, type FusionQuoteParams } from '@/lib/oneinch-api';

export const useOneInch = () => {
  const [tokens, setTokens] = useState<any>(null);
  const [balances, setBalances] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tokens for a specific chain
  const loadTokens = async (chainId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await oneInchAPI.getTokens(chainId);
      setTokens(data);
    } catch (err) {
      setError('Failed to load tokens');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load wallet balances
  const loadBalances = async (walletAddress: string, chainId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await oneInchAPI.getBalances(walletAddress, chainId);
      setBalances(data);
    } catch (err) {
      setError('Failed to load balances');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get Fusion+ quote
  const getFusionQuote = async (params: FusionQuoteParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const quote = await oneInchAPI.getFusionQuote(params);
      return quote;
    } catch (err) {
      setError('Failed to get Fusion quote');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Execute Fusion+ swap
  const executeFusionSwap = async (params: FusionQuoteParams & { permit?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const swap = await oneInchAPI.createFusionSwap(params);
      return swap;
    } catch (err) {
      setError('Failed to execute Fusion swap');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Create limit order
  const createLimitOrder = async (params: LimitOrderParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const order = await oneInchAPI.createLimitOrder(params);
      return order;
    } catch (err) {
      setError('Failed to create limit order');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get limit orders
  const getLimitOrders = async (maker: string, chainId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const orders = await oneInchAPI.getLimitOrders(maker, chainId);
      return orders;
    } catch (err) {
      setError('Failed to get limit orders');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get token prices
  const getTokenPrices = async (tokens: string[], chainId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const prices = await oneInchAPI.getTokenPrices(tokens, chainId);
      return prices;
    } catch (err) {
      setError('Failed to get token prices');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    tokens,
    balances,
    isLoading,
    error,
    loadTokens,
    loadBalances,
    getFusionQuote,
    executeFusionSwap,
    createLimitOrder,
    getLimitOrders,
    getTokenPrices,
  };
};

// Chain IDs for supported networks
export const SUPPORTED_CHAINS = {
  ETHEREUM: 1,
  POLYGON: 137,
  BSC: 56,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  AVALANCHE: 43114,
} as const;

// Common token addresses
export const TOKEN_ADDRESSES = {
  ETH: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  USDC: '0xA0b86a33E6441b8F5C3c7Ba2E86E93797AC3b2dF',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
} as const;