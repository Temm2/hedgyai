// Chainflip API for cross-protocol swaps (ETH/USDC/USDT to BTC)
export interface ChainflipQuote {
  inputAsset: string;
  outputAsset: string;
  inputAmount: string;
  outputAmount: string;
  rate: number;
  networkFee: string;
  brokerFee: string;
  estimatedDuration: number;
}

export interface ChainflipSwapParams {
  srcAsset: string;
  destAsset: string;
  amount: string;
  destAddress: string;
  ccmMetadata?: string;
}

export class ChainflipAPI {
  private baseUrl = 'https://api.chainflip.io';

  async getQuote(params: {
    srcAsset: string;
    destAsset: string;
    amount: string;
  }): Promise<ChainflipQuote> {
    try {
      // Map tokens to Chainflip format
      const srcAsset = this.mapTokenToChainflip(params.srcAsset);
      const destAsset = this.mapTokenToChainflip(params.destAsset);

      const response = await fetch(
        `${this.baseUrl}/v1/quote?srcAsset=${srcAsset}&destAsset=${destAsset}&amount=${params.amount}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Chainflip API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        inputAsset: params.srcAsset,
        outputAsset: params.destAsset,
        inputAmount: params.amount,
        outputAmount: data.outputAmount || data.egressAmount,
        rate: parseFloat(data.outputAmount || data.egressAmount) / parseFloat(params.amount),
        networkFee: data.networkFee || '0',
        brokerFee: data.brokerFee || '0',
        estimatedDuration: data.estimatedDurationSeconds || 300
      };
    } catch (error) {
      console.error('Chainflip quote error:', error);
      // Fallback quote for development
      return this.getFallbackQuote(params);
    }
  }

  async initiateSwap(params: ChainflipSwapParams): Promise<{
    swapId: string;
    depositAddress: string;
    depositChannelId: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          srcAsset: this.mapTokenToChainflip(params.srcAsset),
          destAsset: this.mapTokenToChainflip(params.destAsset),
          amount: params.amount,
          destAddress: params.destAddress,
          ccmMetadata: params.ccmMetadata,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chainflip swap error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        swapId: data.id,
        depositAddress: data.depositAddress,
        depositChannelId: data.depositChannelId,
      };
    } catch (error) {
      console.error('Chainflip swap error:', error);
      throw error;
    }
  }

  private mapTokenToChainflip(token: string): string {
    const tokenMap: { [key: string]: string } = {
      'ETH': 'Eth',
      'USDC': 'Usdc',
      'USDT': 'Usdt',
      'BTC': 'Btc',
      'WBTC': 'Btc',
    };
    return tokenMap[token.toUpperCase()] || token;
  }

  private getFallbackQuote(params: {
    srcAsset: string;
    destAsset: string;
    amount: string;
  }): ChainflipQuote {
    // Fallback rates for development
    const rates: { [key: string]: number } = {
      'ETH-BTC': 0.04,
      'USDC-BTC': 0.000015,
      'USDT-BTC': 0.000015,
    };

    const key = `${params.srcAsset.toUpperCase()}-${params.destAsset.toUpperCase()}`;
    const rate = rates[key] || 0.001;
    const outputAmount = (parseFloat(params.amount) * rate).toString();

    return {
      inputAsset: params.srcAsset,
      outputAsset: params.destAsset,
      inputAmount: params.amount,
      outputAmount,
      rate,
      networkFee: '0.001',
      brokerFee: '0.0005',
      estimatedDuration: 300
    };
  }
}

export const chainflipAPI = new ChainflipAPI();