import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, DollarSign, Bot } from "lucide-react";
import { ElizaAgent } from "@/components/ElizaAgent";
import { MultiChainWallet } from "@/components/MultiChainWallet";

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

interface MonitorSectionProps {
  investments?: Investment[];
}

export function MonitorSection({ investments = [] }: MonitorSectionProps) {
  const handleAgentUpdate = (agentId: string, update: any) => {
    console.log('Agent update:', agentId, update);
  };

  return (
    <div className="min-h-screen bg-gradient-secondary py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Agent Monitor
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Real-time monitoring of your Hedgy agents and investments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Portfolio</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${investments.reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {investments.length} active investments
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Bot className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{investments.length}</div>
              <p className="text-xs text-muted-foreground">
                {investments.filter(inv => inv.status === 'active').length} executing trades
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$4,567.89</div>
              <p className="text-xs text-muted-foreground">
                +12.3% from yesterday
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">+$1,234.56</div>
              <p className="text-xs text-muted-foreground">
                +15.7% overall return
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Multi-Chain Wallet */}
          <div className="lg:col-span-1">
            <MultiChainWallet />
          </div>
          
          {/* Agent Monitoring */}
          <div className="lg:col-span-2">
            <ElizaAgent 
              investments={investments}
              onAgentUpdate={handleAgentUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}