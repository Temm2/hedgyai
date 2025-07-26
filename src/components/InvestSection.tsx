import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bot, TrendingUp, DollarSign, Clock, Trash2, Activity, Shield, Calculator, Fuel, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StrategyRecommendationModal } from "./StrategyRecommendationModal";
import { useInvestmentCalculations } from "@/hooks/use-investment-calculations";

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

interface InvestSectionProps {
  investments: Investment[];
  setInvestments: React.Dispatch<React.SetStateAction<Investment[]>>;
}

export function InvestSection({ investments, setInvestments }: InvestSectionProps) {
  const [investmentData, setInvestmentData] = useState({
    chain: "1", // Ethereum mainnet
    amount: "",
    tokenType: "ETH",
    withdrawChain: "1",
    withdrawCurrency: "ETH",
    lockPeriod: "30",
    strategy: "",
    riskLevel: "Medium" as const,
    guaranteedReturn: "",
    minReturn: "",
    gasFee: ""
  });
  
  const [investmentHistory, setInvestmentHistory] = useState<Investment[]>([]);
  const { toast } = useToast();

  // Use real-time calculations with 1inch and TokenMetrics APIs
  const calculations = useInvestmentCalculations(
    investmentData.amount,
    investmentData.tokenType,
    investmentData.strategy,
    investmentData.lockPeriod,
    parseInt(investmentData.chain)
  );

  const chains = [
    { name: "Ethereum", id: "1" },
    { name: "Bitcoin", id: "bitcoin" },
    { name: "Polygon", id: "137" },
    { name: "BSC", id: "56" },
    { name: "Arbitrum", id: "42161" }
  ];

  const tokenTypes = ["ETH", "BTC", "USDC", "USDT", "DAI"];

  const handleInputChange = (field: string, value: string) => {
    setInvestmentData(prev => ({ ...prev, [field]: value }));
  };

  // This function is now replaced by the useInvestmentCalculations hook
  // but kept for backward compatibility
  const calculateMinReturn = (amount: string, strategy: string, lockPeriod: string) => {
    return calculations.minReturn || "0";
  };

  const handleInvestNow = () => {
    if (!investmentData.amount || !investmentData.chain || !investmentData.tokenType || !investmentData.strategy) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before investing.",
        variant: "destructive"
      });
      return;
    }

    const minReturn = calculations.minReturn;
    const guaranteedReturn = calculations.guaranteedReturn;

    const newInvestment: Investment = {
      id: Date.now().toString(),
      amount: investmentData.amount,
      chain: investmentData.chain,
      tokenType: investmentData.tokenType,
      withdrawChain: investmentData.withdrawChain,
      withdrawCurrency: investmentData.withdrawCurrency,
      lockPeriod: investmentData.lockPeriod,
      strategy: investmentData.strategy,
      riskLevel: calculations.riskLevel,
      guaranteedReturn,
      minReturn,
      gasFee: investmentData.gasFee,
      timestamp: new Date(),
      status: 'pending'
    };

    setInvestments(prev => [...prev, newInvestment]);
    
    // Reset form
    setInvestmentData({
      chain: "1",
      amount: "",
      tokenType: "ETH",
      withdrawChain: "1",
      withdrawCurrency: "ETH",
      lockPeriod: "30",
      strategy: "",
      riskLevel: "Medium" as const,
      guaranteedReturn: "",
      minReturn: "",
      gasFee: ""
    });

    toast({
      title: "Investment Added",
      description: "Hedgy agent will start managing your investment shortly.",
    });
  };

  const removeInvestment = (id: string) => {
    const investment = investments.find(inv => inv.id === id);
    if (investment) {
      const closedInvestment = {
        ...investment,
        status: 'closed' as const,
        endTimestamp: new Date(),
        finalPnl: '+0.25%' // Mock final PnL
      };
      setInvestmentHistory(prev => [...prev, closedInvestment]);
    }
    setInvestments(prev => prev.filter(inv => inv.id !== id));
    toast({
      title: "Investment Closed",
      description: "Investment has been closed and moved to history.",
    });
  };

  const handleAgentUpdate = (agentId: string, update: any) => {
    // Handle agent updates if needed
    console.log('Agent update:', agentId, update);
  };

  return (
    <div className="min-h-screen bg-gradient-secondary py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              AI-Powered Investing
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Configure your investment and let Hedgy optimize your returns
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Investment Configuration */}
          <div>
            <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Start Investment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Chain Selection */}
                <div className="space-y-2">
                  <Label htmlFor="chain">Chain</Label>
                  <Select value={investmentData.chain} onValueChange={(value) => handleInputChange("chain", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blockchain" />
                    </SelectTrigger>
                    <SelectContent>
                      {chains.map((chain) => (
                        <SelectItem key={chain.id} value={chain.id}>
                          {chain.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={investmentData.amount}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                  />
                </div>

                {/* Token Type */}
                <div className="space-y-2">
                  <Label htmlFor="tokenType">Token Type</Label>
                  <Select value={investmentData.tokenType} onValueChange={(value) => handleInputChange("tokenType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select token type" />
                    </SelectTrigger>
                    <SelectContent>
                      {tokenTypes.map((token) => (
                        <SelectItem key={token} value={token}>
                          {token}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Withdraw Chain */}
                <div className="space-y-2">
                  <Label htmlFor="withdrawChain">Withdraw Chain</Label>
                  <Select value={investmentData.withdrawChain} onValueChange={(value) => handleInputChange("withdrawChain", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select withdraw chain" />
                    </SelectTrigger>
                    <SelectContent>
                      {chains.map((chain) => (
                        <SelectItem key={chain.id} value={chain.id}>
                          {chain.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Withdraw Currency */}
                <div className="space-y-2">
                  <Label htmlFor="withdrawCurrency">Withdraw Currency</Label>
                  <Select value={investmentData.withdrawCurrency} onValueChange={(value) => handleInputChange("withdrawCurrency", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select withdraw currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {tokenTypes.map((token) => (
                        <SelectItem key={token} value={token}>
                          {token}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Locked Period */}
                <div className="space-y-2">
                  <Label htmlFor="lockPeriod">Locked Period (days)</Label>
                  <Select value={investmentData.lockPeriod} onValueChange={(value) => handleInputChange("lockPeriod", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lock period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Strategy Selection */}
                <div className="space-y-2">
                  <Label htmlFor="strategy">Strategy Selection</Label>
                  <Select value={investmentData.strategy} onValueChange={(value) => handleInputChange("strategy", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select investment strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Momentum Rotation">Momentum Rotation</SelectItem>
                      <SelectItem value="Mean Reversion">Mean Reversion</SelectItem>
                      <SelectItem value="Multi-Chain Arbitrage">Multi-Chain Arbitrage</SelectItem>
                      <SelectItem value="Stablecoin Farming">Stablecoin Farming</SelectItem>
                      <SelectItem value="High-Yield Crypto Credit">High-Yield Crypto Credit</SelectItem>
                      <SelectItem value="Options Writing">Options Writing</SelectItem>
                      <SelectItem value="Structured Products">Structured Products</SelectItem>
                      <SelectItem value="Meta Model Blend">Meta Model Blend</SelectItem>
                    </SelectContent>
                  </Select>
                  <StrategyRecommendationModal onStrategySelect={(strategy) => handleInputChange("strategy", strategy)} />
                </div>

                {/* Risk Level & Returns Display */}
                {investmentData.strategy && (
                  <div className="space-y-4 p-4 bg-background/30 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Risk Level
                      </Label>
                       <Badge variant={
                        calculations.riskLevel === 'Low' ? 'secondary' :
                        calculations.riskLevel === 'Medium' ? 'default' : 'destructive'
                      }>
                        {calculations.isLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          calculations.riskLevel
                        )}
                      </Badge>
                      {calculations.error && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {calculations.error}
                        </p>
                      )}
                    </div>
                    
                    {investmentData.amount && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="flex items-center gap-2 text-sm">
                              <Calculator className="w-3 h-3" />
                              Min Return (Real-time)
                            </Label>
                            <p className="font-semibold text-green-500">
                              {calculations.isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                `${calculations.minReturn} ${investmentData.tokenType}`
                              )}
                            </p>
                            {calculations.spotPrice > 0 && !calculations.isLoading && (
                              <p className="text-xs text-muted-foreground">
                                Spot: ${calculations.spotPrice.toFixed(2)}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label className="text-sm">Guaranteed Return</Label>
                            <p className="font-semibold text-blue-500">
                              {calculations.isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                `${calculations.guaranteedReturn} ${investmentData.tokenType}`
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              80% of calculated return
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2 text-sm">
                            <Fuel className="w-3 h-3" />
                            Estimated Gas Fee
                          </Label>
                          <p className="font-medium">
                            {calculations.isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              `~${calculations.gasPrice} ETH`
                            )}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Invest Button */}
                <Button 
                  className="w-full"
                  onClick={handleInvestNow}
                  disabled={!investmentData.amount || !investmentData.chain || !investmentData.tokenType || !investmentData.strategy}
                >
                  <Bot className="w-5 h-5 mr-2" />
                  Start Hedgy Agent
                </Button>
              </CardContent>
            </Card>

            {/* Active Portfolio */}
            {investments.length > 0 && (
              <Card className="mt-6 bg-gradient-card backdrop-blur-glass border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Active Investments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {investments.map((investment) => (
                      <div key={investment.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Badge variant={investment.status === 'active' ? 'default' : 'secondary'}>
                            {investment.status}
                          </Badge>
                          <div>
                            <p className="font-medium">{investment.amount} {investment.tokenType}</p>
                            <p className="text-sm text-muted-foreground">
                              {chains.find(c => c.id === investment.chain)?.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {investment.timestamp.toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeInvestment(investment.id)}
                            title="Close Investment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Investment History */}
            {investmentHistory.length > 0 && (
              <Card className="mt-6 bg-gradient-card backdrop-blur-glass border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Investment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {investmentHistory.map((investment) => (
                      <div key={investment.id} className="flex items-center justify-between p-3 bg-background/30 rounded-lg border border-muted">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="border-muted-foreground/30">
                            closed
                          </Badge>
                          <div>
                            <p className="font-medium">{investment.amount} {investment.tokenType}</p>
                            <p className="text-sm text-muted-foreground">
                              {chains.find(c => c.id === investment.chain)?.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${investment.finalPnl?.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                            {investment.finalPnl}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {investment.endTimestamp?.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Agent Monitor Link */}
          <div className="flex items-center justify-center">
            <Card className="bg-gradient-card backdrop-blur-glass border-primary/20 p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Live Agent Activity</h3>
              <p className="text-muted-foreground mb-4">
                Monitor your Hedgy agents in real-time
              </p>
              <Button variant="outline" className="w-full">
                <Activity className="w-4 h-4 mr-2" />
                View Agent Monitor
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}