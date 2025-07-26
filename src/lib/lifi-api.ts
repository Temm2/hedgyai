// Li.Fi API Integration for Cross-Chain Bridging
const API_KEY = "380d4673-882d-439d-8646-8c161d403451.96419331-65a9-489f-839e-fc2a04bb9e5b";
const BASE_URL = "https://li.quest/v1";

export interface BridgeQuote {
  id: string;
  fromToken: string;
  toToken: string;
  fromChain: number;
  toChain: number;
  fromAmount: string;
  toAmount: string;
  estimatedGas: string;
  fees: string;
  route: any;
  executionTime: number; // seconds
}

export interface BridgeParams {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress: string;
  toAddress: string;
}

export class LiFiAPI {
  private headers = {
    'x-lifi-api-key': API_KEY,
    'Content-Type': 'application/json',
  };

  // Get supported chains
  async getChains() {
    try {
      const response = await fetch(`${BASE_URL}/chains`, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error(`Li.Fi API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Li.Fi chains:', error);
      return this.getDemoChains();
    }
  }

  // Get supported tokens for a chain
  async getTokens(chainId: number) {
    try {
      const response = await fetch(`${BASE_URL}/tokens?chains=${chainId}`, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error(`Li.Fi API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Li.Fi tokens:', error);
      return this.getDemoTokens(chainId);
    }
  }

  // Get bridge quote
  async getQuote(params: BridgeParams): Promise<BridgeQuote> {
    try {
      const queryParams = new URLSearchParams({
        fromChain: params.fromChain.toString(),
        toChain: params.toChain.toString(),
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.fromAmount,
        fromAddress: params.fromAddress,
        toAddress: params.toAddress,
      });

      const response = await fetch(`${BASE_URL}/quote?${queryParams}`, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error(`Li.Fi API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        id: data.id || Date.now().toString(),
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromChain: params.fromChain,
        toChain: params.toChain,
        fromAmount: params.fromAmount,
        toAmount: data.estimate?.toAmount || params.fromAmount,
        estimatedGas: data.estimate?.gasCosts?.[0]?.estimate || "0.001",
        fees: data.estimate?.feeCosts?.[0]?.amount || "0",
        route: data,
        executionTime: data.estimate?.executionDuration || 300
      };
    } catch (error) {
      console.error('Error getting Li.Fi quote:', error);
      return this.getDemoQuote(params);
    }
  }

  // Execute bridge transaction
  async executeBridge(quote: BridgeQuote, fromAddress: string): Promise<string> {
    try {
      const response = await fetch(`${BASE_URL}/advanced/stepTransaction`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          route: quote.route,
          stepIndex: 0,
          fromAddress: fromAddress,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Li.Fi API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Return transaction hash (in real implementation, this would be sent to wallet)
      return data.transactionRequest?.data || `0x${Date.now().toString(16)}`;
    } catch (error) {
      console.error('Error executing Li.Fi bridge:', error);
      // Return demo transaction hash
      return `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
    }
  }

  // Get transaction status
  async getTransactionStatus(txHash: string, bridge: string = 'lifi'): Promise<'pending' | 'success' | 'failed'> {
    try {
      const response = await fetch(`${BASE_URL}/status?txHash=${txHash}&bridge=${bridge}`, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error(`Li.Fi API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.status || 'pending';
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return 'pending';
    }
  }

  // Demo data for hackathon fallbacks
  private getDemoChains() {
    return {
      chains: [
        { id: 1, name: 'Ethereum', nativeToken: { symbol: 'ETH' } },
        { id: 137, name: 'Polygon', nativeToken: { symbol: 'MATIC' } },
        { id: 56, name: 'BSC', nativeToken: { symbol: 'BNB' } },
        { id: 42161, name: 'Arbitrum', nativeToken: { symbol: 'ETH' } },
      ]
    };
  }

  private getDemoTokens(chainId: number) {
    const tokens = {
      1: [ // Ethereum
        { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', decimals: 18 },
        { address: '0xA0b86a33E6441b8F5C3c7Ba2E86E93797AC3b2dF', symbol: 'USDC', decimals: 6 },
        { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', decimals: 6 },
      ],
      137: [ // Polygon
        { address: '0x0000000000000000000000000000000000001010', symbol: 'MATIC', decimals: 18 },
        { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', decimals: 6 },
      ]
    };
    
    return { tokens: tokens[chainId as keyof typeof tokens] || tokens[1] };
  }

  private getDemoQuote(params: BridgeParams): BridgeQuote {
    const rate = 0.95 + Math.random() * 0.1; // 0.95-1.05 conversion rate
    const toAmount = (parseFloat(params.fromAmount) * rate).toString();
    
    return {
      id: Date.now().toString(),
      fromToken: params.fromToken,
      toToken: params.toToken,
      fromChain: params.fromChain,
      toChain: params.toChain,
      fromAmount: params.fromAmount,
      toAmount: toAmount,
      estimatedGas: "0.002",
      fees: "0.001",
      route: {},
      executionTime: 180 + Math.floor(Math.random() * 300) // 3-8 minutes
    };
  }
}

export const lifiAPI = new LiFiAPI();