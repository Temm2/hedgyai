import { ethers } from 'ethers';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory, ECPairInterface } from 'ecpair';

// Initialize ECPair factory
const ECPair = ECPairFactory(ecc);

export interface ProgrammaticWallet {
  address: string;
  balance: string;
  chainId: string;
  symbol: string;
}

export class EthereumProgrammaticWallet {
  private wallet: ethers.HDNodeWallet | ethers.Wallet;
  private provider: ethers.Provider;

  constructor(privateKey?: string) {
    // For demo purposes, generate a new wallet if no private key provided
    this.wallet = privateKey ? new ethers.Wallet(privateKey) : ethers.Wallet.createRandom();
    // Use a public RPC endpoint for demo
    this.provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
    this.wallet = this.wallet.connect(this.provider);
  }

  async getBalance(): Promise<string> {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get ETH balance:', error);
      return '0.0';
    }
  }

  getAddress(): string {
    return this.wallet.address;
  }

  async sendTransaction(to: string, amount: string): Promise<string> {
    try {
      const tx = await this.wallet.sendTransaction({
        to,
        value: ethers.parseEther(amount)
      });
      return tx.hash;
    } catch (error) {
      console.error('Failed to send ETH transaction:', error);
      throw error;
    }
  }

  getPrivateKey(): string {
    return this.wallet.privateKey;
  }
}

export class BitcoinProgrammaticWallet {
  private keyPair: ECPairInterface;
  private network: bitcoin.Network;

  constructor(privateKey?: Buffer) {
    this.network = bitcoin.networks.bitcoin;
    
    if (privateKey) {
      this.keyPair = ECPair.fromPrivateKey(privateKey, { network: this.network });
    } else {
      // Generate random key pair for demo
      this.keyPair = ECPair.makeRandom({ network: this.network });
    }
  }

  getAddress(): string {
    const { address } = bitcoin.payments.p2wpkh({ 
      pubkey: this.keyPair.publicKey, 
      network: this.network 
    });
    return address || '';
  }

  async getBalance(): Promise<string> {
    // For demo purposes, return mock balance
    // In production, you'd query a Bitcoin API like Blockstream or BitPay
    return '0.025';
  }

  async sendTransaction(to: string, amount: number): Promise<string> {
    try {
      // For demo purposes, return mock transaction hash
      // In production, you'd build and broadcast the transaction
      const mockTxHash = bitcoin.crypto.sha256(Buffer.from(`${to}${amount}${Date.now()}`)).toString('hex');
      return mockTxHash;
    } catch (error) {
      console.error('Failed to send BTC transaction:', error);
      throw error;
    }
  }

  getPrivateKey(): string {
    return this.keyPair.privateKey?.toString('hex') || '';
  }
}

export class AgentWalletManager {
  private ethWallet: EthereumProgrammaticWallet;
  private btcWallet: BitcoinProgrammaticWallet;

  constructor() {
    // Initialize with demo wallets
    this.ethWallet = new EthereumProgrammaticWallet();
    this.btcWallet = new BitcoinProgrammaticWallet();
  }

  async getWallets(): Promise<ProgrammaticWallet[]> {
    const [ethBalance, btcBalance] = await Promise.all([
      this.ethWallet.getBalance(),
      this.btcWallet.getBalance()
    ]);

    return [
      {
        address: this.ethWallet.getAddress(),
        balance: ethBalance,
        chainId: '1',
        symbol: 'ETH'
      },
      {
        address: this.btcWallet.getAddress(),
        balance: btcBalance,
        chainId: 'bitcoin',
        symbol: 'BTC'
      }
    ];
  }

  async executeArbitrage(fromChain: string, toChain: string, amount: string): Promise<string> {
    try {
      if (fromChain === 'ethereum' && toChain === 'bitcoin') {
        // Simulate cross-chain arbitrage
        const txHash = await this.ethWallet.sendTransaction(
          '0x742d35cc6634c0532925a3b8d4e382dd2cface1c',
          amount
        );
        console.log(`Arbitrage executed: ETH -> BTC, Hash: ${txHash}`);
        return txHash;
      }
      
      if (fromChain === 'bitcoin' && toChain === 'ethereum') {
        const txHash = await this.btcWallet.sendTransaction(
          'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          parseFloat(amount)
        );
        console.log(`Arbitrage executed: BTC -> ETH, Hash: ${txHash}`);
        return txHash;
      }

      throw new Error('Unsupported arbitrage pair');
    } catch (error) {
      console.error('Arbitrage execution failed:', error);
      throw error;
    }
  }

  getEthWallet(): EthereumProgrammaticWallet {
    return this.ethWallet;
  }

  getBtcWallet(): BitcoinProgrammaticWallet {
    return this.btcWallet;
  }
}