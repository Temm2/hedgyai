import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Shield, Clock, Target, BarChart3 } from "lucide-react";

interface Strategy {
  name: string;
  risk: 'Low' | 'Medium' | 'High';
  expectedReturn: string;
  lockPeriod: string;
  description: string;
  successRate: string;
  recommendedTokens: string[];
  marketCondition: string;
}

const strategies: Strategy[] = [
  {
    name: "Stablecoin Farming",
    risk: "Low",
    expectedReturn: "8-12%",
    lockPeriod: "30-90 days",
    description: "Low-risk yield farming with stablecoins across multiple protocols",
    successRate: "94%",
    recommendedTokens: ["USDC", "USDT", "DAI"],
    marketCondition: "All market conditions"
  },
  {
    name: "Momentum Rotation",
    risk: "Medium",
    expectedReturn: "15-25%",
    lockPeriod: "14-30 days",
    description: "Rotate between trending assets based on momentum indicators",
    successRate: "78%",
    recommendedTokens: ["ETH", "BTC"],
    marketCondition: "Bull market"
  },
  {
    name: "Multi-Chain Arbitrage",
    risk: "Medium",
    expectedReturn: "12-20%",
    lockPeriod: "7-21 days",
    description: "Exploit price differences across different blockchain networks",
    successRate: "82%",
    recommendedTokens: ["ETH", "USDC"],
    marketCondition: "High volatility"
  },
  {
    name: "High-Yield Crypto Credit",
    risk: "High",
    expectedReturn: "25-40%",
    lockPeriod: "60-180 days",
    description: "Provide liquidity to lending protocols for high yields",
    successRate: "65%",
    recommendedTokens: ["ETH", "BTC", "USDC"],
    marketCondition: "Bull market"
  }
];

const getRecommendedStrategy = (): Strategy => {
  // Mock logic for recommendation based on current market conditions
  return strategies[0]; // Stablecoin Farming as default safe recommendation
};

interface StrategyRecommendationModalProps {
  onStrategySelect: (strategy: string) => void;
}

export function StrategyRecommendationModal({ onStrategySelect }: StrategyRecommendationModalProps) {
  const recommended = getRecommendedStrategy();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="h-auto p-0 text-sm text-primary">
          Not sure which strategy to choose?
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Strategy Recommendations
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Recommended Strategy */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
                Recommended for Current Market
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{recommended.name}</h3>
                  <Badge variant={recommended.risk === 'Low' ? 'secondary' : recommended.risk === 'Medium' ? 'default' : 'destructive'}>
                    {recommended.risk} Risk
                  </Badge>
                </div>
                <p className="text-muted-foreground">{recommended.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Expected Return</p>
                    <p className="font-semibold text-green-500">{recommended.expectedReturn}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="font-semibold">{recommended.successRate}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Lock Period</p>
                    <p className="font-semibold">{recommended.lockPeriod}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Tokens</p>
                    <p className="font-semibold">{recommended.recommendedTokens.join(", ")}</p>
                  </div>
                </div>
        <DialogClose asChild>
          <Button 
            className="w-full" 
            onClick={() => onStrategySelect(recommended.name)}
          >
            Select This Strategy
          </Button>
        </DialogClose>
              </div>
            </CardContent>
          </Card>

          {/* All Strategies Comparison */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Strategy Comparison
            </h3>
            <div className="grid gap-4">
              {strategies.map((strategy) => (
                <Card key={strategy.name} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{strategy.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant={strategy.risk === 'Low' ? 'secondary' : strategy.risk === 'Medium' ? 'default' : 'destructive'}>
                          {strategy.risk}
                        </Badge>
                        <span className="text-sm font-medium text-green-500">{strategy.expectedReturn}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{strategy.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {strategy.successRate} success
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {strategy.lockPeriod}
                      </span>
                      <DialogClose asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onStrategySelect(strategy.name)}
                        >
                          Select
                        </Button>
                      </DialogClose>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}