import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Activity, Clock, Target, Zap, Bot, Shield } from "lucide-react";

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
      name: "Options Writing",
      allocation: "12.8%",
      pnl: "+6.7%",
      status: "active",
      trades: 28,
      successRate: 82
    },
    {
      name: "MEV Extraction",
      allocation: "7.4%",
      pnl: "+31.5%",
      status: "active",
      trades: 203,
      successRate: 96
    },
    {
      name: "Cross-Chain Yield",
      allocation: "3.1%",
      pnl: "-2.1%",
      status: "monitoring",
      trades: 8,
      successRate: 63
    }
  ];

  const elizaActivity = [
    {
      time: "14:32",
      action: "Executed Fusion+ swap with MEV protection",
      strategy: "Multi-Chain Arbitrage", 
      profit: "+$127.50",
      chains: ["Ethereum", "Polygon"],
      type: "execution"
    },
    {
      time: "14:28",
      action: "Created limit order for optimal entry",
      strategy: "Momentum Rotation",
      profit: "Pending",
      chains: ["Ethereum"],
      type: "order"
    },
    {
      time: "14:25",
      action: "Analyzed market volatility and adjusted position",
      strategy: "Meta Model Blend",
      profit: "+$89.20",
      chains: ["Ethereum"],
      type: "analysis"
    },
    {
      time: "14:15",
      action: "Scanned mempool for MEV opportunities",
      strategy: "High-Yield Crypto Credit",
      profit: "+$67.80",
      chains: ["Ethereum", "BSC"],
      type: "monitoring"
    },
    {
      time: "14:08",
      action: "Detected trend reversal via on-chain signals",
      strategy: "Momentum Rotation",
      profit: "+$234.10", 
      chains: ["Polygon"],
      type: "signal"
    },
    {
      time: "13:55",
      action: "Protected against sandwich attack",
      strategy: "Options Writing",
      profit: "Saved $45.30",
      chains: ["Arbitrum"],
      type: "protection"
    }
  ];

  function getActivityTypeColor(type: string) {
    switch (type) {
      case 'execution': return 'default';
      case 'order': return 'secondary';
      case 'analysis': return 'outline';
      case 'monitoring': return 'secondary';
      case 'signal': return 'default';
      case 'protection': return 'destructive';
      default: return 'outline';
    }
  }

  return (
    <div className="min-h-screen bg-gradient-secondary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Eliza Agent Monitor
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Real-time performance tracking of Eliza autonomous trading agents
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
                  <p className="text-sm text-muted-foreground">Total Investments</p>
                  <p className="text-2xl font-bold">{agentStatus.totalInvestments}</p>
                </div>
                <div className="p-3 bg-info/20 rounded-lg">
                  <Zap className="w-6 h-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Eliza Agent Status Overview */}
            <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  Eliza Agent Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Agent Status</span>
                  <Badge variant={agentStatus.isActive ? "default" : "secondary"}>
                    {agentStatus.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Weekly P&L</span>
                  <span className="text-sm font-medium text-success">{agentStatus.weeklyPnL}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monthly P&L</span>
                  <span className="text-sm font-medium text-success">{agentStatus.monthlyPnL}</span>
                </div>
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">MEV Protection</span>
                    <Badge variant="outline" className="text-xs">Active</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">1inch Integration</span>
                    <Badge variant="outline" className="text-xs">Connected</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Eliza Activity Log */}
            <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Eliza Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {elizaActivity.map((activity, index) => (
                    <div key={index} className="flex items-start justify-between p-3 bg-background/50 rounded-lg border border-border/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {activity.strategy}
                          </Badge>
                          <Badge variant={getActivityTypeColor(activity.type)} className="text-xs">
                            {activity.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{activity.time}</span>
                        </div>
                        <p className="text-sm font-medium">{activity.action}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {activity.chains.map((chain, chainIndex) => (
                            <Badge key={chainIndex} variant="secondary" className="text-xs">
                              {chain}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${
                          activity.profit.startsWith('+') ? 'text-success' : 
                          activity.profit.startsWith('-') ? 'text-destructive' : 
                          'text-muted-foreground'
                        }`}>
                          {activity.profit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Strategy Performance */}
          <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Strategy Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeStrategies.map((strategy, index) => (
                  <div key={index} className="p-4 bg-background/50 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{strategy.name}</h4>
                        <Badge variant={
                          strategy.status === "active" ? "default" : 
                          strategy.status === "paused" ? "secondary" : "outline"
                        }>
                          {strategy.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          strategy.pnl.startsWith('+') ? 'text-success' : 'text-destructive'
                        }`}>
                          {strategy.pnl}
                        </p>
                        <p className="text-xs text-muted-foreground">{strategy.allocation}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>{strategy.trades} trades</span>
                      <span>Success: {strategy.successRate}%</span>
                    </div>
                    <Progress value={strategy.successRate} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary */}
        <div className="mt-8">
          <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">+$342,127</p>
                  <p className="text-sm text-muted-foreground">Weekly P&L</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">+$1,247,893</p>
                  <p className="text-sm text-muted-foreground">Monthly P&L</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">$2,847,392</p>
                  <p className="text-sm text-muted-foreground">Total Investments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}