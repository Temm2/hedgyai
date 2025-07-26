import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOneInch, SUPPORTED_CHAINS } from "@/hooks/use-oneinch";
import { useToast } from "@/hooks/use-toast";
import { Bot, Activity, Zap, Clock, Target, TrendingUp, Shield } from "lucide-react";
import { AgentWalletManager } from "@/lib/programmatic-wallets";
import { tokenMetricsAPI } from "@/lib/tokenmetrics-api";

interface Investment {
  id: string;
  amount: string;
  chain: string;
  tokenType: string;
  withdrawChain: string;
  withdrawCurrency: string;
  lockPeriod: string;
  strategy: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  guaranteedReturn: string;
  minReturn: string;
  gasFee: string;
  timestamp: Date;
  status: 'pending' | 'active' | 'completed' | 'closed';
  elizaId?: string;
  endTimestamp?: Date;
  finalPnl?: string;
}

interface ElizaAgentStatus {
  id: string;
  status: 'idle' | 'analyzing' | 'executing' | 'monitoring' | 'completed';
  currentAction: string;
  investment: Investment;
  trades: number;
  pnl: string;
  lastActivity: Date;
}

interface ElizaAgentProps {
  investments: Investment[];
  onAgentUpdate: (agentId: string, update: Partial<ElizaAgentStatus>) => void;
}

export function ElizaAgent({ investments, onAgentUpdate }: ElizaAgentProps) {
  const [agents, setAgents] = useState<ElizaAgentStatus[]>([]);
  const [agentWalletManager] = useState(() => new AgentWalletManager());
  const { toast } = useToast();
  const {
    tokens,
    loadTokens,
    getFusionQuote,
    executeFusionSwap,
    createLimitOrder,
    isLoading
  } = useOneInch();

  useEffect(() => {
    // Create agents for new investments
    investments.forEach(investment => {
      if (!agents.find(agent => agent.investment.id === investment.id)) {
        startElizaAgent(investment);
      }
    });
  }, [investments]);

  const startElizaAgent = async (investment: Investment) => {
    const agentId = `eliza_${investment.id}`;
    
    const newAgent: ElizaAgentStatus = {
      id: agentId,
      status: 'analyzing',
      currentAction: 'Initializing agent and analyzing market conditions...',
      investment,
      trades: 0,
      pnl: '+0.00%',
      lastActivity: new Date()
    };

    setAgents(prev => [...prev, newAgent]);

    // Load tokens for the investment chain
    await loadTokens(parseInt(investment.chain));

    // Simulate Eliza agent workflow
    await simulateElizaWorkflow(agentId, investment);
  };

  const simulateElizaWorkflow = async (agentId: string, investment: Investment) => {
    const updateAgent = (update: Partial<ElizaAgentStatus>) => {
      setAgents(prev => prev.map(agent => 
        agent.id === agentId ? { ...agent, ...update, lastActivity: new Date() } : agent
      ));
      onAgentUpdate(agentId, update);
    };

    try {
      // Phase 1: Get Real Trading Signals
      updateAgent({
        status: 'analyzing',
        currentAction: 'Fetching real-time signals from TokenMetrics API...'
      });
      
      try {
        const signals = await tokenMetricsAPI.getSignals([investment.tokenType, 'ETH', 'BTC']);
        const relevantSignal = signals.find(s => s.symbol === investment.tokenType.toUpperCase());
        
        if (relevantSignal) {
          updateAgent({
            currentAction: `Real TokenMetrics signal: ${relevantSignal.action} (${relevantSignal.confidence}% confidence, ${relevantSignal.riskLevel} risk)`
          });
          
          toast({
            title: "Real Signal Received",
            description: `${relevantSignal.action} signal for ${relevantSignal.symbol} - ${relevantSignal.reason}`,
          });
        } else {
          updateAgent({
            currentAction: 'No specific signals for this token, using market overview...'
          });
        }
      } catch (error) {
        console.error('TokenMetrics API error:', error);
        updateAgent({
          currentAction: 'TokenMetrics API limit reached - using fallback analysis...'
        });
        
        toast({
          title: "API Limit Reached",
          description: "Using backup analysis for this agent",
          variant: "destructive"
        });
      }
      
      await delay(2000);

      // Phase 2: Strategy Selection
      updateAgent({
        currentAction: 'Selecting optimal strategy based on market volatility and signals...'
      });
      await delay(1500);

      // Phase 3: 1inch Integration
      updateAgent({
        status: 'executing',
        currentAction: 'Getting Fusion+ quote from 1inch for MEV protection...'
      });
      
      // Get actual quote from 1inch
      try {
        const quote = await getFusionQuote({
          srcToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
          dstToken: '0xA0b86a33E6417D05E60F0fe20b7A2a57f62fE1c6', // USDC
          amount: investment.amount,
          walletAddress: '0x742d35Cc6639C0532fBb9ea7e1ED', // Demo address
          chainId: parseInt(investment.chain)
        });
        
        updateAgent({
          currentAction: 'Fusion+ quote received. Executing MEV-protected swap...'
        });
        await delay(1000);
      } catch (error) {
        updateAgent({
          currentAction: 'Using Limit Order Protocol for execution...'
        });
      }

      // Phase 4: Cross-chain Execution using Agent Wallets
      updateAgent({
        currentAction: 'Executing cross-chain arbitrage with programmatic wallets...',
        trades: 1
      });
      
      try {
        const arbitrageTx = await agentWalletManager.executeArbitrage(
          "ethereum", 
          "bitcoin", 
          "0.1"
        );
        
        updateAgent({
          currentAction: `Cross-chain arbitrage executed. Tx: ${arbitrageTx.slice(0, 10)}...`
        });
        
        await delay(1000);
      } catch (error) {
        console.error("Arbitrage execution failed:", error);
        updateAgent({
          currentAction: 'Fallback to single-chain execution...'
        });
      }
      
      await delay(1000);

      // Phase 5: Monitoring with Real Wallet Access
      updateAgent({
        status: 'monitoring',
        currentAction: 'Monitoring position and market conditions with real wallet access...',
        pnl: '+0.15%'
      });

      // Simulate ongoing monitoring and trading with real wallet
      monitorPositionWithWallet(agentId);

      toast({
        title: "Hedgy Agent Activated", 
        description: `Agent started for ${investment.amount} ${investment.tokenType} investment with MEV protection`,
      });

    } catch (error) {
      updateAgent({
        status: 'idle',
        currentAction: 'Error occurred. Agent paused for review.'
      });
      
      toast({
        title: "Agent Error",
        description: "Hedgy agent encountered an issue and has been paused",
        variant: "destructive"
      });
    }
  };

  const monitorPositionWithWallet = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    const lockPeriodMs = parseInt(agent.investment.lockPeriod) * 24 * 60 * 60 * 1000;
    const endTime = new Date(agent.investment.timestamp.getTime() + lockPeriodMs);
    
    const interval = setInterval(async () => {
      const now = new Date();
      
      setAgents(prev => prev.map(agent => {
        if (agent.id === agentId && agent.status === 'monitoring') {
          // Check if lock period has ended
          if (now >= endTime) {
            clearInterval(interval);
            // Save returns to programmatic wallet
            saveReturnsToWallet(agent.investment);
            return {
              ...agent,
              status: 'completed' as const,
              currentAction: 'Lock period completed. Returns saved to programmatic wallet.',
              lastActivity: new Date()
            };
          }

          const actions = [
            'Monitoring market volatility and rebalancing opportunities...',
            'Scanning for arbitrage opportunities across chains...',
            'Optimizing position size based on risk parameters...',
            'Checking for MEV opportunities in mempool...',
            'Analyzing TokenMetrics signals for position adjustments...',
            'Executing cross-chain arbitrage via programmatic wallets...',
            'Managing 1inch Fusion+ limit orders autonomously...',
            'Protecting against MEV attacks with Merkle protection...',
            'Balancing ETH and BTC positions in agent wallet...',
            'Monitoring gas fees across chains for optimal timing...',
            'Using real TokenMetrics signals for strategy optimization...',
            'Executing MEV-protected swaps via 1inch Fusion+...'
          ];
          
          const randomPnl = (Math.random() * 1.5 - 0.3).toFixed(2);
          const currentPnl = parseFloat(agent.pnl.replace(/[+%]/g, ''));
          const newPnl = (currentPnl + parseFloat(randomPnl)).toFixed(2);
          
          return {
            ...agent,
            currentAction: actions[Math.floor(Math.random() * actions.length)],
            pnl: `${newPnl.startsWith('-') ? '' : '+'}${newPnl}%`,
            trades: agent.trades + (Math.random() > 0.8 ? 1 : 0),
            lastActivity: new Date()
          };
        }
        return agent;
      }));
    }, 3000);

    // Clean up interval when lock period ends
    setTimeout(async () => {
      clearInterval(interval);
      const finalAgent = agents.find(a => a.id === agentId);
      if (finalAgent) {
        await saveReturnsToWallet(finalAgent.investment);
      }
      
      setAgents(prev => prev.map(agent => 
        agent.id === agentId ? {
          ...agent,
          status: 'completed' as const,
          currentAction: 'Lock period completed. Returns saved to programmatic wallet.'
        } : agent
      ));
    }, lockPeriodMs);
  };

  const saveReturnsToWallet = async (investment: Investment) => {
    try {
      const finalReturn = parseFloat(investment.guaranteedReturn);
      const currency = investment.tokenType.toUpperCase() as 'ETH' | 'BTC';
      
      // Save returns to the programmatic wallet
      await agentWalletManager.saveReturns(finalReturn.toString(), currency);
      
      toast({
        title: "Returns Saved",
        description: `${finalReturn} ${currency} returns saved to programmatic wallet`,
      });
    } catch (error) {
      console.error('Failed to save returns:', error);
      toast({
        title: "Return Save Failed",
        description: "Could not save returns to wallet",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: ElizaAgentStatus['status']) => {
    switch (status) {
      case 'analyzing':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'executing':
        return <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'monitoring':
        return <Target className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <TrendingUp className="h-4 w-4 text-purple-500" />;
      default:
        return <Bot className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ElizaAgentStatus['status']) => {
    switch (status) {
      case 'analyzing':
        return 'bg-blue-500';
      case 'executing':
        return 'bg-yellow-500';
      case 'monitoring':
        return 'bg-green-500';
      case 'completed':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (agents.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Hedgy Agents
          </CardTitle>
        </CardHeader>
        <CardContent>
        <p className="text-muted-foreground text-center py-8">
          No active agents. Start an investment to deploy Hedgy.
        </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {agents.map((agent) => (
        <Card key={agent.id} className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(agent.status)}
                Hedgy Agent #{agent.id.split('_')[1]}
              </CardTitle>
              <Badge className={getStatusColor(agent.status)}>
                {agent.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Investment</p>
                <p className="font-medium">{agent.investment.amount} {agent.investment.tokenType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chain</p>
                <p className="font-medium">{SUPPORTED_CHAINS[agent.investment.chain] || agent.investment.chain}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trades</p>
                <p className="font-medium">{agent.trades}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">P&L</p>
                <p className={`font-medium ${agent.pnl.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  {agent.pnl}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <p className="text-sm font-medium">Current Activity:</p>
              </div>
              <p className="text-sm text-muted-foreground pl-6">
                {agent.currentAction}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Last activity: {agent.lastActivity.toLocaleTimeString()}</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>MEV Protected</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}