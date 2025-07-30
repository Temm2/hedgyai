// Infura Gas Price API Integration
const INFURA_GAS_API_URL = 'https://gas.api.infura.io/v3/86f7c245ec6b41e29725c815457d8c66';

export interface InfuraGasPrice {
  low: {
    suggestedMaxPriorityFeePerGas: string;
    suggestedMaxFeePerGas: string;
    minWaitTimeEstimate: number;
    maxWaitTimeEstimate: number;
  };
  medium: {
    suggestedMaxPriorityFeePerGas: string;
    suggestedMaxFeePerGas: string;
    minWaitTimeEstimate: number;
    maxWaitTimeEstimate: number;
  };
  high: {
    suggestedMaxPriorityFeePerGas: string;
    suggestedMaxFeePerGas: string;
    minWaitTimeEstimate: number;
    maxWaitTimeEstimate: number;
  };
  estimatedBaseFee: string;
  networkCongestion: number;
  latestPriorityFeeRange: string[];
  historicalPriorityFeeRange: string[];
  historicalBaseFeeRange: string[];
  priorityFeeTrend: string;
  baseFeeTrend: string;
}

export class InfuraGasAPI {
  async getGasPrices(): Promise<InfuraGasPrice | null> {
    try {
      const response = await fetch(`${INFURA_GAS_API_URL}/networks/1/suggestedGasFees`);
      
      if (!response.ok) {
        throw new Error(`Infura Gas API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Infura gas prices:', error);
      return null;
    }
  }

  async getEstimatedGasCost(priority: 'low' | 'medium' | 'high' = 'medium'): Promise<number> {
    try {
      const gasData = await this.getGasPrices();
      
      if (!gasData) {
        return this.getFallbackGasCost();
      }

      const gasPrice = parseFloat(gasData[priority].suggestedMaxFeePerGas);
      const gasLimit = 150000; // Complex DeFi transaction estimate
      
      // Convert from gwei to ETH (gasPrice is in gwei)
      return (gasPrice * gasLimit) / 1e9;
    } catch (error) {
      console.error('Error calculating Infura gas cost:', error);
      return this.getFallbackGasCost();
    }
  }

  private getFallbackGasCost(): number {
    return 0.002; // 0.002 ETH fallback
  }
}

export const infuraGasAPI = new InfuraGasAPI();