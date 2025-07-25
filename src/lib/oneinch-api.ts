// 1inch API Integration for Hackathon
const API_KEY = "xywd5Quc3E4K65FBZVDnbJvpdU2nJPh6";
const BASE_URL = "https://api.1inch.dev";

export interface SwapParams {
  src: string;
  dst: string;
  amount: string;
  from: string;
  slippage: number;
  chainId: number;
}

export interface LimitOrderParams {
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  maker: string;
  chainId: number;
}

export interface FusionQuoteParams {
  srcToken: string;
  dstToken: string;
  amount: string;
  walletAddress: string;
  chainId: number;
}

// Fusion+ API Integration
export class OneInchAPI {
  private headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };

  // Get supported tokens for a chain
  async getTokens(chainId: number) {
    try {
      const response = await fetch(`${BASE_URL}/token/v1.2/${chainId}`, {
        headers: this.headers,
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching tokens:', error);
      throw error;
    }
  }

  // Get token balances for wallet
  async getBalances(walletAddress: string, chainId: number) {
    try {
      const response = await fetch(`${BASE_URL}/balance/v1.2/${chainId}/balances/${walletAddress}`, {
        headers: this.headers,
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching balances:', error);
      throw error;
    }
  }

  // Fusion+ Quote
  async getFusionQuote(params: FusionQuoteParams) {
    try {
      const queryParams = new URLSearchParams({
        srcToken: params.srcToken,
        dstToken: params.dstToken,
        amount: params.amount,
        walletAddress: params.walletAddress,
      });

      const response = await fetch(`${BASE_URL}/fusion/v1.0/${params.chainId}/quote?${queryParams}`, {
        headers: this.headers,
      });
      return await response.json();
    } catch (error) {
      console.error('Error getting Fusion quote:', error);
      throw error;
    }
  }

  // Fusion+ Swap
  async createFusionSwap(params: FusionQuoteParams & { permit?: string }) {
    try {
      const response = await fetch(`${BASE_URL}/fusion/v1.0/${params.chainId}/swap`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          srcToken: params.srcToken,
          dstToken: params.dstToken,
          amount: params.amount,
          walletAddress: params.walletAddress,
          permit: params.permit,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating Fusion swap:', error);
      throw error;
    }
  }

  // Limit Order Protocol
  async createLimitOrder(params: LimitOrderParams) {
    try {
      const response = await fetch(`${BASE_URL}/orderbook/v4.0/${params.chainId}/order`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          makerAsset: params.makerAsset,
          takerAsset: params.takerAsset,
          makingAmount: params.makingAmount,
          takingAmount: params.takingAmount,
          maker: params.maker,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating limit order:', error);
      throw error;
    }
  }

  // Get active limit orders
  async getLimitOrders(maker: string, chainId: number) {
    try {
      const response = await fetch(`${BASE_URL}/orderbook/v4.0/${chainId}/orders?maker=${maker}`, {
        headers: this.headers,
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching limit orders:', error);
      throw error;
    }
  }

  // Classic Swap Quote (backup)
  async getSwapQuote(params: SwapParams) {
    try {
      const queryParams = new URLSearchParams({
        src: params.src,
        dst: params.dst,
        amount: params.amount,
        from: params.from,
        slippage: params.slippage.toString(),
      });

      const response = await fetch(`${BASE_URL}/swap/v6.0/${params.chainId}/quote?${queryParams}`, {
        headers: this.headers,
      });
      return await response.json();
    } catch (error) {
      console.error('Error getting swap quote:', error);
      throw error;
    }
  }

  // Price API
  async getTokenPrices(tokens: string[], chainId: number) {
    try {
      const tokenList = tokens.join(',');
      const response = await fetch(`${BASE_URL}/price/v1.1/${chainId}/${tokenList}`, {
        headers: this.headers,
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching token prices:', error);
      throw error;
    }
  }
}

export const oneInchAPI = new OneInchAPI();