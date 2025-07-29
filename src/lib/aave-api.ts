// Aave API Integration for DeFi Lending Rates
const BASE_URL = "https://dlp-api-dev.testing.aave.com";

export interface AaveReserveData {
  id: string;
  underlyingAsset: string;
  name: string;
  symbol: string;
  decimals: number;
  liquidityRate: string;
  variableBorrowRate: string;
  stableBorrowRate: string;
  liquidityIndex: string;
  variableBorrowIndex: string;
  lastUpdateTimestamp: number;
  aTokenAddress: string;
  stableDebtTokenAddress: string;
  variableDebtTokenAddress: string;
  totalATokenSupply: string;
  totalCurrentVariableDebt: string;
  totalCurrentStableDebt: string;
  utilizationRate: string;
}

export interface AavePoolData {
  reserves: AaveReserveData[];
  totalLiquidity: string;
  totalBorrow: string;
  totalCollateral: string;
}

export class AaveAPI {
  private headers = {
    'Content-Type': 'application/json',
  };

  // Get all reserve data for a specific pool
  async getPoolReserves(poolId: string = 'ethereum-mainnet'): Promise<AaveReserveData[]> {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/pools/${poolId}/reserves`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Aave API error: ${response.status}`);
      }

      const data = await response.json();
      return data.reserves || [];
    } catch (error) {
      console.error('Error fetching Aave reserves:', error);
      return [];
    }
  }

  // Get specific reserve data by asset symbol
  async getReserveBySymbol(symbol: string, poolId: string = 'ethereum-mainnet'): Promise<AaveReserveData | null> {
    try {
      const reserves = await this.getPoolReserves(poolId);
      return reserves.find(reserve => 
        reserve.symbol.toLowerCase() === symbol.toLowerCase()
      ) || null;
    } catch (error) {
      console.error('Error fetching Aave reserve by symbol:', error);
      return null;
    }
  }

  // Get current APY for lending a specific asset
  async getLendingAPY(symbol: string, poolId: string = 'ethereum-mainnet'): Promise<number> {
    try {
      const reserve = await this.getReserveBySymbol(symbol, poolId);
      
      if (!reserve) {
        return this.getFallbackAPY(symbol);
      }

      // Convert liquidityRate from ray format (27 decimals) to percentage
      const liquidityRate = parseFloat(reserve.liquidityRate);
      const apy = (liquidityRate / 1e27) * 100;
      
      return apy;
    } catch (error) {
      console.error('Error calculating Aave lending APY:', error);
      return this.getFallbackAPY(symbol);
    }
  }

  // Get borrowing rates for an asset
  async getBorrowingRates(symbol: string, poolId: string = 'ethereum-mainnet'): Promise<{ stable: number; variable: number }> {
    try {
      const reserve = await this.getReserveBySymbol(symbol, poolId);
      
      if (!reserve) {
        return { stable: 0, variable: 0 };
      }

      const stableRate = (parseFloat(reserve.stableBorrowRate) / 1e27) * 100;
      const variableRate = (parseFloat(reserve.variableBorrowRate) / 1e27) * 100;
      
      return {
        stable: stableRate,
        variable: variableRate
      };
    } catch (error) {
      console.error('Error fetching Aave borrowing rates:', error);
      return { stable: 0, variable: 0 };
    }
  }

  // Get utilization rate for an asset
  async getUtilizationRate(symbol: string, poolId: string = 'ethereum-mainnet'): Promise<number> {
    try {
      const reserve = await this.getReserveBySymbol(symbol, poolId);
      
      if (!reserve) {
        return 0;
      }

      return parseFloat(reserve.utilizationRate) / 1e27 * 100;
    } catch (error) {
      console.error('Error fetching Aave utilization rate:', error);
      return 0;
    }
  }

  private getFallbackAPY(symbol: string): number {
    const fallbackAPYs: Record<string, number> = {
      'ETH': 4.2,
      'USDC': 5.8,
      'USDT': 6.1,
      'DAI': 5.5,
      'WBTC': 3.8,
      'BTC': 3.8
    };
    return fallbackAPYs[symbol.toUpperCase()] || 4.0;
  }
}

export const aaveAPI = new AaveAPI();