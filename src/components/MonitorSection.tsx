import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Activity, Clock, Target, Zap } from "lucide-react";

export function MonitorSection() {
  const agentStatus = {
    isActive: true,
    totalInvestments: 127,
    activeStrategies: 8,
    totalValue: "2,847,392",
    dailyPnL: "+2.34%",
    weeklyPnL: "+11.7%",
    monthlyPnL: "+28.9%"
  };

  const activeStrategies = [
    {
      name: "Momentum Rotation",
      allocation: "23.4%",
      pnl: "+15.2%",
      status: "active",
      trades: 47,
      successRate: 87
    },
    {
      name: "Meta Model Blend",
      allocation: "19.1%", 
      pnl: "+11.8%",
      status: "active",
      trades: 34,
      successRate: 91
    },
    {
      name: "Multi-Chain Arbitrage",
      allocation: "16.7%",
      pnl: "+8.3%",
      status: "active", 
      trades: 156,
      successRate: 94
    },
    {
      name: "High-Yield Crypto Credit",
      allocation: "15.2%",
      pnl: "+22.1%",
      status: "paused",
      trades: 12,
      successRate: 75
    },
    {
      name: "Stablecoin Farming",
      allocation: "12.8%",
      pnl: "+4.7%",
      status: "active",
      trades: 23,
      successRate: 96
    },
    {
      name: "Options Writing",
      allocation: "8.9%",
      pnl: "+9.4%",
      status: "active",
      trades: 18,
      successRate: 83
    }
  ];

  const recentActivity = [
    {
      time: "2 min ago",
      action: "Executed arbitrage opportunity",
      strategy: "Multi-Chain Arbitrage",
      profit: "+$247.89",
      chain: "Ethereum → Polygon"
    },
    {
      time: "14 min ago", 
      action: "Rebalanced portfolio allocation",
      strategy: "Meta Model Blend",
      profit: "+$89.23",
      chain: "Multiple chains"
    },
    {
      time: "1 hour ago",
      action: "Options contract executed",
      strategy: "Options Writing", 
      profit: "+$1,234.56",
      chain: "Ethereum"
    },
    {
      time: "3 hours ago",
      action: "Credit position closed",
      strategy: "High-Yield Crypto Credit",
      profit: "+$567.89",
      chain: "Cosmos"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-secondary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Agent Monitor
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Real-time performance tracking of HedgyAI autonomous trading agents
          </p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">${agentStatus.totalValue}</p>
                </div>
                <div className="p-3 bg-primary/20 rounded-lg">
                  <Target className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Daily P&L</p>
                  <p className="text-2xl font-bold text-success">{agentStatus.dailyPnL}</p>
                </div>
                <div className="p-3 bg-success/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Strategies</p>
                  <p className="text-2xl font-bold">{agentStatus.activeStrategies}</p>
                </div>
                <div className="p-3 bg-warning/20 rounded-lg">
                  <Activity className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Agent Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    <span className="font-semibold text-success">Active</span>
                  </div>
                </div>
                <div className="p-3 bg-success/20 rounded-lg">
                  <Zap className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Strategy Performance */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
              <CardHeader>
                <CardTitle>Strategy Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeStrategies.map((strategy, index) => (
                  <div key={index} className="p-4 bg-muted/20 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{strategy.name}</h3>
                        <Badge 
                          variant={strategy.status === "active" ? "default" : "secondary"}
                          className={strategy.status === "active" ? "bg-success text-success-foreground" : ""}
                        >
                          {strategy.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">P&L</div>
                        <div className={`font-semibold ${strategy.pnl.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
                          {strategy.pnl}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Allocation</div>
                        <div className="font-medium">{strategy.allocation}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Trades</div>
                        <div className="font-medium">{strategy.trades}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Success Rate</div>
                        <div className="font-medium">{strategy.successRate}%</div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Success Rate</span>
                        <span>{strategy.successRate}%</span>
                      </div>
                      <Progress value={strategy.successRate} className="h-2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="p-3 bg-muted/20 rounded-lg border border-border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.strategy}</p>
                        <p className="text-xs text-muted-foreground">{activity.chain}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-success">{activity.profit}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="bg-gradient-card backdrop-blur-glass border-primary/20 mt-6">
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Weekly P&L</span>
                  <span className="font-semibold text-success">{agentStatus.weeklyPnL}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Monthly P&L</span>
                  <span className="font-semibold text-success">{agentStatus.monthlyPnL}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Investments</span>
                  <span className="font-semibold">{agentStatus.totalInvestments}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}