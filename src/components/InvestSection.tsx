import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info, TrendingUp, AlertTriangle, CheckCircle, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function InvestSection() {
  const [investmentData, setInvestmentData] = useState({
    chain: "",
    amount: "",
    tokenType: "",
    lockPeriod: "",
    strategy: "",
    autoLockIncrease: false
  });

  const [gasEstimate, setGasEstimate] = useState("~$12.50");
  const [minReturn, setMinReturn] = useState("0.00");
  const [riskLevel, setRiskLevel] = useState("Medium");
  const { toast } = useToast();

  const chains = [
    "Ethereum", "Bitcoin", "Sui", "Aptos", "Binance Smart Chain", 
    "Tron", "Near", "Cosmos", "Stellar", "Monad", "Starknet", 
    "Cardano", "XRP Ledger", "ICP", "Tezos", "Polkadot", "EOS"
  ];

  const strategies = [
    { name: "Momentum Rotation", risk: "High", minReturn: "15.2%" },
    { name: "Mean Reversion", risk: "Medium", minReturn: "8.7%" },
    { name: "Multi-Chain Arbitrage", risk: "Low", minReturn: "5.1%" },
    { name: "Stablecoin Farming", risk: "Low", minReturn: "4.2%" },
    { name: "High-Yield Crypto Credit", risk: "High", minReturn: "18.9%" },
    { name: "Options Writing", risk: "Medium", minReturn: "11.3%" },
    { name: "Structured Products", risk: "High", minReturn: "22.1%" },
    { name: "Meta Model Blend", risk: "Medium", minReturn: "9.8%" }
  ];

  const lockPeriods = [
    { period: "1 Month", multiplier: 1.0 },
    { period: "3 Months", multiplier: 1.15 },
    { period: "6 Months", multiplier: 1.35 },
    { period: "12 Months", multiplier: 1.65 }
  ];

  const updateCalculations = (strategy: string, amount: string, lockPeriod: string) => {
    const selectedStrategy = strategies.find(s => s.name === strategy);
    const selectedPeriod = lockPeriods.find(p => p.period === lockPeriod);
    
    if (selectedStrategy && selectedPeriod && amount) {
      const baseReturn = parseFloat(selectedStrategy.minReturn.replace('%', ''));
      const adjustedReturn = baseReturn * selectedPeriod.multiplier;
      const calculatedReturn = (parseFloat(amount) * adjustedReturn / 100).toFixed(2);
      setMinReturn(calculatedReturn);
      setRiskLevel(selectedStrategy.risk);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...investmentData, [field]: value };
    setInvestmentData(newData);
    
    if (field === "strategy" || field === "amount" || field === "lockPeriod") {
      updateCalculations(newData.strategy, newData.amount, newData.lockPeriod);
    }
  };

  const handleInvest = () => {
    if (!investmentData.chain || !investmentData.amount || !investmentData.strategy) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before investing.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Investment Initiated",
      description: `Investing $${investmentData.amount} in ${investmentData.strategy}`,
      duration: 3000,
    });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low": return "bg-success text-success-foreground";
      case "Medium": return "bg-warning text-warning-foreground";
      case "High": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-secondary py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Start Investing
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Configure your investment strategy and let HedgyAI optimize your returns
          </p>
        </div>

        <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Investment Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Chain Selection */}
            <div className="space-y-2">
              <Label htmlFor="chain">Chain</Label>
              <Select onValueChange={(value) => handleInputChange("chain", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select blockchain" />
                </SelectTrigger>
                <SelectContent>
                  {chains.map((chain) => (
                    <SelectItem key={chain} value={chain}>
                      {chain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount and Token Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="tokenType">Token Type</Label>
                <Select onValueChange={(value) => handleInputChange("tokenType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select token type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="fiat">Fiat (USD, EUR)</SelectItem>
                    <SelectItem value="stablecoin">Stablecoin (USDC, DAI)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lock Period */}
            <div className="space-y-2">
              <Label htmlFor="lockPeriod">Lock Period</Label>
              <Select onValueChange={(value) => handleInputChange("lockPeriod", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lock period" />
                </SelectTrigger>
                <SelectContent>
                  {lockPeriods.map((period) => (
                    <SelectItem key={period.period} value={period.period}>
                      {period.period} (+{((period.multiplier - 1) * 100).toFixed(0)}% bonus)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Strategy Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="strategy">Strategy</Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-primary">
                      <Info className="w-4 h-4 mr-1" />
                      Not sure which strategy?
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Strategy Recommendation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <h3 className="font-semibold text-primary mb-2">Recommended: Meta Model Blend</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Based on current market conditions and your profile
                        </p>
                        <div className="flex gap-2 mb-2">
                          <Badge className="bg-warning text-warning-foreground">Medium Risk</Badge>
                          <Badge variant="outline">9.8% Min Return</Badge>
                        </div>
                        <p className="text-sm">
                          Optimal for current volatility levels with balanced risk-reward ratio.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Select onValueChange={(value) => handleInputChange("strategy", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map((strategy) => (
                    <SelectItem key={strategy.name} value={strategy.name}>
                      <div className="flex items-center justify-between w-full">
                        <span>{strategy.name}</span>
                        <div className="flex gap-1 ml-2">
                          <Badge variant="outline" className="text-xs">
                            {strategy.minReturn}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Auto Lock Increase Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border">
              <div className="space-y-1">
                <Label htmlFor="autoLock">Automatic Lock-Up Increase</Label>
                <p className="text-sm text-muted-foreground">
                  Prevent trades during bull market signals for maximum gains
                </p>
              </div>
              <Switch
                id="autoLock"
                checked={investmentData.autoLockIncrease}
                onCheckedChange={(checked) => handleInputChange("autoLockIncrease", checked.toString())}
              />
            </div>

            {/* Investment Summary */}
            {investmentData.strategy && investmentData.amount && (
              <Card className="bg-muted/20 border-primary/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    Investment Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Strategy</div>
                      <div className="font-medium">{investmentData.strategy}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Risk Level</div>
                      <Badge className={getRiskColor(riskLevel)}>{riskLevel}</Badge>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Guaranteed Return</div>
                      <div className="font-medium text-success">${minReturn}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Gas Fee</div>
                      <div className="font-medium">{gasEstimate}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Invest Button */}
            <Button 
              variant="invest" 
              size="xl" 
              className="w-full"
              onClick={handleInvest}
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Invest Now
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}