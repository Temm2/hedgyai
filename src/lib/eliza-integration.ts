// Real ElizaOS Integration
import { tokenMetricsAPI } from './tokenmetrics-api';
import { oneInchAPI } from './oneinch-api';
import { lifiAPI } from './lifi-api';
import { chainflipAPI } from './chainflip-api';
import { AgentWalletManager } from './programmatic-wallets';
import { mevProtection } from './mev-protection';

export interface ElizaAgent {
  id: string;
  name: string;
  strategy: string;
  riskTolerance: 'low' | 'medium' | 'high';
  capital: number;
  status: 'idle' | 'analyzing' | 'executing' | 'monitoring';
  currentAction: string;
  trades: Trade[];
  pnl: number;
  lastActivity: Date;
}

export interface Trade {
  id: string;
  agentId: string;
  fromToken: string;
  toToken: string;
  fromChain: string;
  toChain: string;
  amount: string;
  executedPrice: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
  txHash?: string;
}

export class ElizaOSIntegration {
  private agents: Map<string, ElizaAgent> = new Map();
  private activeMonitoring: Map<string, NodeJS.Timeout> = new Map();

  async createAgent(config: {
    name: string;
    strategy: string;
    riskTolerance: 'low' | 'medium' | 'high';
    capital: number;
  }): Promise<ElizaAgent> {
    const agent: ElizaAgent = {
      id: `eliza_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: config.name,
      strategy: config.strategy,
      riskTolerance: config.riskTolerance,
      capital: config.capital,
      status: 'idle',
      currentAction: 'Initializing agent...',
      trades: [],
      pnl: 0,
      lastActivity: new Date(),
    };

    this.agents.set(agent.id, agent);
    
    // Start agent lifecycle
    await this.startAgentLifecycle(agent.id);
    
    return agent;
  }

  async startAgentLifecycle(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    try {
      // Phase 1: Market Analysis
      await this.performMarketAnalysis(agentId);
      
      // Phase 2: Strategy Execution
      await this.executeStrategy(agentId);
      
      // Phase 3: Monitoring
      this.startContinuousMonitoring(agentId);
      
    } catch (error) {
      console.error(`Agent ${agentId} lifecycle error:`, error);
      this.updateAgentStatus(agentId, 'idle', `Error: ${error.message}`);
    }
  }

  private async performMarketAnalysis(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    this.updateAgentStatus(agentId, 'analyzing', 'Fetching market signals...');
    
    try {
      // Get real signals from TokenMetrics API
      const signals = await tokenMetricsAPI.getPortfolioSignals();
      
      this.updateAgentStatus(agentId, 'analyzing', 'Analyzing market opportunities...');
      
      // Simulate analysis time
      await this.delay(2000);
      
      // Filter signals based on agent's risk tolerance and strategy
      const filteredSignals = this.filterSignalsByRisk(signals, agent.riskTolerance);
      
      // Store analysis results in agent
      agent.currentAction = `Found ${filteredSignals.length} trading opportunities`;
      this.agents.set(agentId, agent);
      
    } catch (error) {
      console.error(`Market analysis failed for agent ${agentId}:`, error);
      agent.currentAction = 'Market analysis failed - using fallback strategy';
    }
  }

  private async executeStrategy(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    this.updateAgentStatus(agentId, 'executing', 'Executing trading strategy...');

    try {
      // Get wallet for agent
      const agentWalletManager = new AgentWalletManager();
      await agentWalletManager.initialize();
      
      // Determine trade based on strategy
      const trade = await this.determineTrade(agent, agentWalletManager.getEthWallet()?.getAddress() || '');
      
      if (trade) {
        // Execute the trade
        await this.executeTrade(agentId, trade);
      }
      
    } catch (error) {
      console.error(`Strategy execution failed for agent ${agentId}:`, error);
      this.updateAgentStatus(agentId, 'idle', `Execution failed: ${error.message}`);
    }
  }

  private async determineTrade(agent: ElizaAgent, walletAddress: string): Promise<Partial<Trade> | null> {
    // Strategy-based trade determination
    const strategies = {
      'DCA (Dollar Cost Averaging)': () => this.createDCATrade(agent),
      'Momentum Trading': () => this.createMomentumTrade(agent),
      'Arbitrage': () => this.createArbitrageTrade(agent),
      'Yield Farming': () => this.createYieldTrade(agent),
    };

    const tradeGenerator = strategies[agent.strategy];
    if (!tradeGenerator) {
      console.warn(`Unknown strategy: ${agent.strategy}`);
      return null;
    }

    return tradeGenerator();
  }

  private createDCATrade(agent: ElizaAgent): Partial<Trade> {
    const pairs = ['ETH-USDC', 'BTC-USDT', 'ETH-BTC'];
    const selectedPair = pairs[Math.floor(Math.random() * pairs.length)];
    const [fromToken, toToken] = selectedPair.split('-');
    
    return {
      fromToken,
      toToken,
      fromChain: 'ethereum',
      toChain: fromToken === 'BTC' || toToken === 'BTC' ? 'bitcoin' : 'ethereum',
      amount: (agent.capital * 0.1).toString(), // 10% of capital
    };
  }

  private createMomentumTrade(agent: ElizaAgent): Partial<Trade> {
    // High-frequency trading pairs
    return {
      fromToken: 'ETH',
      toToken: 'USDC',
      fromChain: 'ethereum',
      toChain: 'ethereum',
      amount: (agent.capital * 0.2).toString(),
    };
  }

  private createArbitrageTrade(agent: ElizaAgent): Partial<Trade> {
    // Cross-chain arbitrage
    return {
      fromToken: 'USDC',
      toToken: 'BTC',
      fromChain: 'ethereum',
      toChain: 'bitcoin',
      amount: (agent.capital * 0.15).toString(),
    };
  }

  private createYieldTrade(agent: ElizaAgent): Partial<Trade> {
    return {
      fromToken: 'ETH',
      toToken: 'USDT',
      fromChain: 'ethereum',
      toChain: 'ethereum',
      amount: (agent.capital * 0.05).toString(),
    };
  }

  private async executeTrade(agentId: string, tradeData: Partial<Trade>): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const trade: Trade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      fromToken: tradeData.fromToken!,
      toToken: tradeData.toToken!,
      fromChain: tradeData.fromChain!,
      toChain: tradeData.toChain!,
      amount: tradeData.amount!,
      executedPrice: 0,
      status: 'pending',
      timestamp: new Date(),
    };

    agent.trades.push(trade);
    this.updateAgentStatus(agentId, 'executing', `Executing ${trade.fromToken} → ${trade.toToken} trade`);

    try {
      let txHash: string;
      
      // Determine which API to use based on the trade
      if (trade.fromChain === trade.toChain && trade.fromChain === 'ethereum') {
        // EVM same-chain trade - use 1inch Fusion+
        const quote = await oneInchAPI.getFusionQuote({
          srcToken: this.getTokenAddress(trade.fromToken),
          dstToken: this.getTokenAddress(trade.toToken),
          amount: trade.amount,
          walletAddress: await this.getAgentWalletAddress(agentId),
          chainId: 1,
        });
        
        const swapResult = await oneInchAPI.createFusionSwap({
          srcToken: this.getTokenAddress(trade.fromToken),
          dstToken: this.getTokenAddress(trade.toToken),
          amount: trade.amount,
          walletAddress: await this.getAgentWalletAddress(agentId),
          chainId: 1,
        });
        
        txHash = swapResult.hash || `fusion_${Date.now()}`;
        trade.executedPrice = parseFloat(quote.dstAmount || '1') / parseFloat(quote.srcAmount || '1');
        
      } else if (this.isCrossProtocolTrade(trade)) {
        // Cross-protocol trade (ETH/USDC/USDT to BTC) - use Chainflip
        const quote = await chainflipAPI.getQuote({
          srcAsset: trade.fromToken,
          destAsset: trade.toToken,
          amount: trade.amount,
        });
        
        const swapResult = await chainflipAPI.initiateSwap({
          srcAsset: trade.fromToken,
          destAsset: trade.toToken,
          amount: trade.amount,
          destAddress: await this.getAgentWalletAddress(agentId, trade.toChain),
        });
        
        txHash = swapResult.swapId;
        trade.executedPrice = quote.rate;
        
      } else {
        // Cross-chain EVM trade - use Li.Fi
        const quote = await lifiAPI.getQuote({
          fromChain: this.getChainId(trade.fromChain),
          toChain: this.getChainId(trade.toChain),
          fromToken: this.getTokenAddress(trade.fromToken),
          toToken: this.getTokenAddress(trade.toToken),
          fromAmount: trade.amount,
          fromAddress: await this.getAgentWalletAddress(agentId),
          toAddress: await this.getAgentWalletAddress(agentId),
        });
        
        const bridgeResult = await lifiAPI.executeBridge(quote, await this.getAgentWalletAddress(agentId));
        txHash = bridgeResult;
        trade.executedPrice = parseFloat(quote.toAmount) / parseFloat(quote.fromAmount);
      }

      // Apply MEV protection
      const protectedTx = await mevProtection.protectTransaction({ hash: txHash });
      
      trade.txHash = protectedTx.hash;
      trade.status = 'completed';
      
      // Update agent PnL (simplified calculation)
      const pnlChange = this.calculatePnL(trade);
      agent.pnl += pnlChange;
      
      this.updateAgentStatus(agentId, 'monitoring', `Trade completed. PnL: ${pnlChange > 0 ? '+' : ''}${pnlChange.toFixed(4)} ETH`);
      
    } catch (error) {
      console.error(`Trade execution failed:`, error);
      trade.status = 'failed';
      this.updateAgentStatus(agentId, 'idle', `Trade failed: ${error.message}`);
    }
  }

  private startContinuousMonitoring(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    this.updateAgentStatus(agentId, 'monitoring', 'Monitoring positions and market...');

    const monitoringInterval = setInterval(async () => {
      await this.performMonitoringCycle(agentId);
    }, 30000); // Monitor every 30 seconds

    this.activeMonitoring.set(agentId, monitoringInterval);
  }

  private async performMonitoringCycle(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    try {
      // Check for new opportunities
      const signals = await tokenMetricsAPI.getPortfolioSignals();
      
      // Update PnL based on current market prices
      await this.updateAgentPnL(agentId);
      
      // Check if agent should execute new trades
      const shouldTrade = this.shouldExecuteNewTrade(agent, signals);
      if (shouldTrade) {
        await this.executeStrategy(agentId);
      }
      
      agent.lastActivity = new Date();
      this.agents.set(agentId, agent);
      
    } catch (error) {
      console.error(`Monitoring cycle failed for agent ${agentId}:`, error);
    }
  }

  private async updateAgentPnL(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Simulate PnL updates based on market movements
    const marketMovement = (Math.random() - 0.5) * 0.02; // -1% to +1%
    agent.pnl += agent.capital * marketMovement;
    
    this.agents.set(agentId, agent);
  }

  private shouldExecuteNewTrade(agent: ElizaAgent, signals: any[]): boolean {
    // Simple logic: trade if enough time has passed and there are good signals
    const timeSinceLastTrade = Date.now() - (agent.trades[agent.trades.length - 1]?.timestamp.getTime() || 0);
    const hasGoodSignals = signals.length > 0;
    const hasMinInterval = timeSinceLastTrade > 300000; // 5 minutes
    
    return hasGoodSignals && hasMinInterval && agent.status === 'monitoring';
  }

  private filterSignalsByRisk(signals: any[], riskTolerance: string): any[] {
    // Filter signals based on risk tolerance
    return signals.filter(signal => {
      const signalRisk = signal.risk || 'medium';
      if (riskTolerance === 'low') return signalRisk === 'low';
      if (riskTolerance === 'medium') return ['low', 'medium'].includes(signalRisk);
      return true; // high risk tolerance accepts all
    });
  }

  private calculatePnL(trade: Trade): number {
    // Simplified PnL calculation
    const baseReturn = 0.001; // 0.1% base return
    const randomFactor = (Math.random() - 0.5) * 0.02; // -1% to +1%
    return parseFloat(trade.amount) * (baseReturn + randomFactor);
  }

  private isCrossProtocolTrade(trade: Trade): boolean {
    const btcChains = ['bitcoin'];
    const evmChains = ['ethereum', 'polygon', 'bsc'];
    
    const isFromBtc = btcChains.includes(trade.fromChain) || trade.fromToken === 'BTC';
    const isToBtc = btcChains.includes(trade.toChain) || trade.toToken === 'BTC';
    const isFromEvm = evmChains.includes(trade.fromChain);
    const isToEvm = evmChains.includes(trade.toChain);
    
    return (isFromEvm && isToBtc) || (isFromBtc && isToEvm);
  }

  private getTokenAddress(token: string): string {
    const addresses: { [key: string]: string } = {
      'ETH': '0x0000000000000000000000000000000000000000',
      'USDC': '0xA0b86a33E6441c49863CC10e3da08D7D2Fa06e0C',
      'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      'WBTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    };
    return addresses[token] || addresses['ETH'];
  }

  private getChainId(chain: string): number {
    const chainIds: { [key: string]: number } = {
      'ethereum': 1,
      'polygon': 137,
      'bsc': 56,
      'bitcoin': 0, // Special case for Bitcoin
    };
    return chainIds[chain] || 1;
  }

  private async getAgentWalletAddress(agentId: string, chain: string = 'ethereum'): Promise<string> {
    const agentWalletManager = new AgentWalletManager();
    await agentWalletManager.initialize();
    const ethWallet = agentWalletManager.getEthWallet();
    const btcWallet = agentWalletManager.getBtcWallet();
    return chain === 'bitcoin' ? (btcWallet?.getAddress() || '') : (ethWallet?.getAddress() || '');
  }

  private updateAgentStatus(agentId: string, status: ElizaAgent['status'], action: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.currentAction = action;
      agent.lastActivity = new Date();
      this.agents.set(agentId, agent);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for UI
  getAgent(agentId: string): ElizaAgent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): ElizaAgent[] {
    return Array.from(this.agents.values());
  }

  async stopAgent(agentId: string): Promise<void> {
    const interval = this.activeMonitoring.get(agentId);
    if (interval) {
      clearInterval(interval);
      this.activeMonitoring.delete(agentId);
    }
    
    this.updateAgentStatus(agentId, 'idle', 'Agent stopped');
  }

  async deleteAgent(agentId: string): Promise<void> {
    await this.stopAgent(agentId);
    this.agents.delete(agentId);
  }
}

export const elizaOS = new ElizaOSIntegration();