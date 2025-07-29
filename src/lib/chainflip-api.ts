// Chainflip SDK Integration for Bitcoin ↔ Ethereum swaps
import { ethers } from 'ethers';

const CHAINFLIP_API_URL = 'https://api.chainflip.io';
const CHAINFLIP_BROKER_URL = 'https://broker.chainflip.io';

export interface ChainflipQuote {
  srcAsset: string;
  destAsset: string;
  amount: string;
  quote: {
    intermediateAmount?: string;
    outputAmount: string;
    includedFees: Array<{
      type: string;
      asset: string;
      amount: string;
    }>;
  };
  estimatedDurationSeconds: number;
  estimatedPrice: string;
}

export interface ChainflipSwapParams {
  srcAsset: string;
  destAsset: string;
  amount: string;
  destAddress: string;
  srcAddress?: string;
  brokerCommissionBps?: number;
}

export interface SwapStatus {
  state: 'AWAITING_DEPOSIT' | 'DEPOSIT_RECEIVED' | 'SWAP_EXECUTED' | 'EGRESS_SCHEDULED' | 'COMPLETE' | 'FAILED';
  srcAsset: string;
  destAsset: string;
  depositAddress?: string;
  depositChannelId?: string;
  srcChainRequiredBlockConfirmations?: number;
  estimatedDepositChannelExpiryTime?: number;
  isDepositChannelExpired?: boolean;
  ignoredEgressAmount?: string;
  swapId?: string;
  error?: string;
}

export class ChainflipAPI {
  private apiUrl = CHAINFLIP_API_URL;
  private brokerUrl = CHAINFLIP_BROKER_URL;

  // Get supported assets
  async getSupportedAssets() {
    try {
      const response = await fetch(`${this.apiUrl}/v2/assets`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching supported assets:', error);
      throw error;
    }
  }

  // Get swap quote
  async getQuote(
    srcAsset: string,
    destAsset: string,
    amount: string
  ): Promise<ChainflipQuote> {
    try {
      const response = await fetch(
        `${this.apiUrl}/v2/quote?srcAsset=${srcAsset}&destAsset=${destAsset}&amount=${amount}`
      );
      
      if (!response.ok) {
        throw new Error(`Quote request failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting quote:', error);
      throw error;
    }
  }

  // Create swap deposit channel
  async createSwap(params: ChainflipSwapParams): Promise<any> {
    try {
      const response = await fetch(`${this.brokerUrl}/v2/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          srcAsset: params.srcAsset,
          destAsset: params.destAsset,
          amount: params.amount,
          destAddress: params.destAddress,
          srcAddress: params.srcAddress,
          brokerCommissionBps: params.brokerCommissionBps || 0,
        }),
      });

      if (!response.ok) {
        throw new Error(`Swap creation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating swap:', error);
      throw error;
    }
  }

  // Get swap status
  async getSwapStatus(swapId: string): Promise<SwapStatus> {
    try {
      const response = await fetch(`${this.apiUrl}/v2/swaps/${swapId}`);
      
      if (!response.ok) {
        throw new Error(`Status request failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting swap status:', error);
      throw error;
    }
  }

  // Monitor swap progress
  async monitorSwap(
    swapId: string,
    onStatusUpdate: (status: SwapStatus) => void,
    pollInterval: number = 10000
  ): Promise<void> {
    const checkStatus = async () => {
      try {
        const status = await this.getSwapStatus(swapId);
        onStatusUpdate(status);

        if (status.state === 'COMPLETE' || status.state === 'FAILED') {
          return; // Stop monitoring
        }

        setTimeout(checkStatus, pollInterval);
      } catch (error) {
        console.error('Error monitoring swap:', error);
        setTimeout(checkStatus, pollInterval * 2); // Retry with longer interval
      }
    };

    checkStatus();
  }

  // Get current market prices
  async getMarketPrice(baseAsset: string, quoteAsset: string): Promise<number> {
    try {
      const response = await fetch(
        `${this.apiUrl}/v2/market-data/price?baseAsset=${baseAsset}&quoteAsset=${quoteAsset}`
      );
      
      if (!response.ok) {
        throw new Error(`Price request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return parseFloat(data.price);
    } catch (error) {
      console.error('Error getting market price:', error);
      throw error;
    }
  }

  // Estimate cross-chain swap duration
  async getEstimatedDuration(srcAsset: string, destAsset: string): Promise<number> {
    try {
      const response = await fetch(
        `${this.apiUrl}/v2/estimated-duration?srcAsset=${srcAsset}&destAsset=${destAsset}`
      );
      
      if (!response.ok) {
        throw new Error(`Duration request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.estimatedDurationSeconds;
    } catch (error) {
      console.error('Error getting estimated duration:', error);
      return 300; // Default to 5 minutes
    }
  }

  // Get deposit address for Bitcoin
  async getBitcoinDepositAddress(destAsset: string, destAddress: string): Promise<string> {
    try {
      const swap = await this.createSwap({
        srcAsset: 'BTC',
        destAsset,
        amount: '0', // Amount will be determined by actual deposit
        destAddress,
      });
      
      return swap.depositAddress;
    } catch (error) {
      console.error('Error getting Bitcoin deposit address:', error);
      throw error;
    }
  }

  // Helper: Convert asset symbols to Chainflip format
  formatAsset(symbol: string, chain?: string): string {
    const assetMap: Record<string, string> = {
      'ETH': 'ETH',
      'BTC': 'BTC',
      'USDC': 'USDC',
      'USDT': 'USDT',
      'DOT': 'DOT',
      'FLIP': 'FLIP'
    };

    return assetMap[symbol.toUpperCase()] || symbol.toUpperCase();
  }

  // Helper: Validate swap parameters
  validateSwapParams(params: ChainflipSwapParams): boolean {
    const supportedAssets = ['BTC', 'ETH', 'USDC', 'USDT', 'DOT', 'FLIP'];
    
    if (!supportedAssets.includes(params.srcAsset.toUpperCase())) {
      throw new Error(`Unsupported source asset: ${params.srcAsset}`);
    }
    
    if (!supportedAssets.includes(params.destAsset.toUpperCase())) {
      throw new Error(`Unsupported destination asset: ${params.destAsset}`);
    }
    
    if (parseFloat(params.amount) <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    if (!params.destAddress) {
      throw new Error('Destination address is required');
    }
    
    return true;
  }

  // Demo data for development
  getDemoQuote(srcAsset: string, destAsset: string, amount: string): ChainflipQuote {
    const mockRate = srcAsset === 'BTC' && destAsset === 'ETH' ? 15.5 : 0.065;
    const outputAmount = (parseFloat(amount) * mockRate * 0.997).toString(); // 0.3% fee
    
    return {
      srcAsset,
      destAsset,
      amount,
      quote: {
        outputAmount,
        includedFees: [
          {
            type: 'NETWORK',
            asset: srcAsset,
            amount: (parseFloat(amount) * 0.002).toString()
          },
          {
            type: 'CHAINFLIP',
            asset: srcAsset,
            amount: (parseFloat(amount) * 0.001).toString()
          }
        ]
      },
      estimatedDurationSeconds: 180,
      estimatedPrice: mockRate.toString()
    };
  }
}

export const chainflipAPI = new ChainflipAPI();