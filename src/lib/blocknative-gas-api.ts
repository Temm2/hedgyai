// Blocknative Gas Price API Integration
const API_KEY = "ef9929c9-8d02-47d0-8026-93e317b8c15b";
const BASE_URL = "https://api.blocknative.com";

export interface GasPrice {
  chainId: number;
  estimatedPrices: {
    confidence: number;
    price: number;
    maxPriorityFeePerGas: number;
    maxFeePerGas: number;
  }[];
  estimatedBaseFee: number;
  pendingBlockNumberVal: number;
  network: string;
  unit: string;
  maxPrice: number;
  currentBlockNumber: number;
  msSinceLastBlock: number;
  blockPrices: any[];
}

export class BlocknativeGasAPI {
  private headers = {
    'Authorization': API_KEY,
    'Content-Type': 'application/json',
  };

  // Get real-time gas prices for a specific chain
  async getGasPrices(chainId: number): Promise<GasPrice | null> {
    try {
      const response = await fetch(`${BASE_URL}/gasprices/blockprices`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Blocknative API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Filter for the specific chain
      const chainData = data.blockPrices?.find((block: any) => 
        block.network === this.getNetworkName(chainId)
      );

      return chainData || null;
    } catch (error) {
      console.error('Error fetching Blocknative gas prices:', error);
      return null;
    }
  }

  // Get estimated gas cost in ETH for a transaction
  async getEstimatedGasCost(chainId: number, gasUnits: number = 21000): Promise<number> {
    try {
      const gasData = await this.getGasPrices(chainId);
      
      if (!gasData || !gasData.estimatedPrices?.length) {
        return this.getFallbackGasCost(chainId);
      }

      // Use medium confidence estimate (usually index 1)
      const mediumEstimate = gasData.estimatedPrices[1] || gasData.estimatedPrices[0];
      const gasPriceWei = mediumEstimate.price;
      
      // Convert to ETH (wei to ETH: divide by 10^18)
      const gasCostEth = (gasPriceWei * gasUnits) / 1e18;
      
      return gasCostEth;
    } catch (error) {
      console.error('Error calculating gas cost:', error);
      return this.getFallbackGasCost(chainId);
    }
  }

  private getNetworkName(chainId: number): string {
    const networks: Record<number, string> = {
      1: 'main',
      137: 'matic-main',
      56: 'bsc-main',
      42161: 'arbitrum-main',
      0: 'main' // Bitcoin fallback
    };
    return networks[chainId] || 'main';
  }

  private getFallbackGasCost(chainId: number): number {
    const fallbackCosts: Record<number, number> = {
      1: 0.02,    // Ethereum
      137: 0.01,  // Polygon
      56: 0.005,  // BSC
      42161: 0.005, // Arbitrum
      0: 0.0001,  // Bitcoin
    };
    return fallbackCosts[chainId] || 0.02;
  }
}

export const blocknativeGasAPI = new BlocknativeGasAPI();