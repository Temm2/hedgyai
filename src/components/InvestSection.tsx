import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Info, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Upload, FileText, ArrowUpDown, Zap, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOneInch, SUPPORTED_CHAINS, TOKEN_ADDRESSES } from "@/hooks/use-oneinch";
import { OneInchIntegration } from "@/components/OneInchIntegration";

export function InvestSection() {
  const [investmentData, setInvestmentData] = useState({
    chain: "",
    amount: "",
    tokenType: "",
    lockPeriod: "",
    strategy: "",
    withdrawChain: "",
    withdrawCurrency: "",
    autoLockIncrease: false
  });

  const [gasEstimate, setGasEstimate] = useState("~$12.50");
  const [withdrawGasEstimate, setWithdrawGasEstimate] = useState("~$8.30");
  const [minReturn, setMinReturn] = useState("0.00");
  const [tokenReturn, setTokenReturn] = useState("0.00");
  const [riskLevel, setRiskLevel] = useState("Medium");
  const [comparisonStrategy, setComparisonStrategy] = useState("");
  const [comparisonReturn, setComparisonReturn] = useState("0.00");
  const [signalFile, setSignalFile] = useState<File | null>(null);
  const [signalData, setSignalData] = useState("");
  const [fusionQuote, setFusionQuote] = useState<any>(null);
  const [limitOrderMode, setLimitOrderMode] = useState(false);
  const [walletAddress] = useState("0x742d35Cc6639C0532fBb9ea7e1ED"); // Demo address
  const { toast } = useToast();
  
  // 1inch integration
  const {
    tokens,
    isLoading: oneInchLoading,
    error: oneInchError,
    loadTokens,
    getFusionQuote,
    executeFusionSwap,
    createLimitOrder,
    getTokenPrices
  } = useOneInch();

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

  const updateCalculations = (strategy: string, amount: string, lockPeriod: string, tokenType: string = "") => {
    const selectedStrategy = strategies.find(s => s.name === strategy);
    const selectedPeriod = lockPeriods.find(p => p.period === lockPeriod);
    
    if (selectedStrategy && selectedPeriod && amount) {
      const baseReturn = parseFloat(selectedStrategy.minReturn.replace('%', ''));
      const adjustedReturn = baseReturn * selectedPeriod.multiplier;
      const calculatedReturn = (parseFloat(amount) * adjustedReturn / 100).toFixed(2);
      setMinReturn(calculatedReturn);
      setRiskLevel(selectedStrategy.risk);
      
      // Calculate token return (same currency as investment)
      const maxReturn = Math.min(parseFloat(amount) * 2, parseFloat(calculatedReturn) * 1.5);
      setTokenReturn(maxReturn.toFixed(2));
    }
  };

  const updateComparisonCalculations = (strategy: string, amount: string, lockPeriod: string) => {
    const selectedStrategy = strategies.find(s => s.name === strategy);
    const selectedPeriod = lockPeriods.find(p => p.period === lockPeriod);
    
    if (selectedStrategy && selectedPeriod && amount) {
      const baseReturn = parseFloat(selectedStrategy.minReturn.replace('%', ''));
      const adjustedReturn = baseReturn * selectedPeriod.multiplier;
      const calculatedReturn = (parseFloat(amount) * adjustedReturn / 100).toFixed(2);
      setComparisonReturn(calculatedReturn);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSignalFile(file);
      toast({
        title: "Signal File Uploaded",
        description: `${file.name} uploaded successfully`,
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...investmentData, [field]: value };
    setInvestmentData(newData);
    
    if (field === "strategy" || field === "amount" || field === "lockPeriod") {
      updateCalculations(newData.strategy, newData.amount, newData.lockPeriod);
    }
  };

  // Load tokens when chain changes
  useEffect(() => {
    if (investmentData.chain === "Ethereum") {
      loadTokens(SUPPORTED_CHAINS.ETHEREUM);
    }
  }, [investmentData.chain, loadTokens]);

  // Get real-time Fusion+ quote
  const handleGetFusionQuote = async () => {
    if (!investmentData.amount || !walletAddress) return;
    
    try {
      const quote = await getFusionQuote({
        srcToken: TOKEN_ADDRESSES.USDC, // From USDC
        dstToken: TOKEN_ADDRESSES.ETH,  // To ETH (for investment)
        amount: (parseFloat(investmentData.amount) * 1e6).toString(), // USDC has 6 decimals
        walletAddress,
        chainId: SUPPORTED_CHAINS.ETHEREUM
      });
      setFusionQuote(quote);
      
      toast({
        title: "Fusion+ Quote Updated",
        description: `Best rate: ${quote.dstAmount} ETH for $${investmentData.amount}`,
      });
    } catch (error) {
      console.error('Fusion quote error:', error);
      toast({
        title: "Quote Error",
        description: "Failed to get Fusion+ quote. Using estimated rates.",
        variant: "destructive"
      });
    }
  };

  // Execute investment with 1inch Fusion+ or Limit Order
  const handleInvest = async () => {
    if (!investmentData.chain || !investmentData.amount || !investmentData.strategy) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before investing.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (limitOrderMode) {
        // Create limit order for gradual investment
        const order = await createLimitOrder({
          makerAsset: TOKEN_ADDRESSES.USDC,
          takerAsset: TOKEN_ADDRESSES.ETH,
          makingAmount: (parseFloat(investmentData.amount) * 1e6).toString(),
          takingAmount: fusionQuote?.dstAmount || "1000000000000000000", // 1 ETH fallback
          maker: walletAddress,
          chainId: SUPPORTED_CHAINS.ETHEREUM
        });
        
        toast({
          title: "Limit Order Created",
          description: `Order ${order.orderHash} created for ${investmentData.strategy}`,
          duration: 5000,
        });
      } else {
        // Execute immediate Fusion+ swap
        const swap = await executeFusionSwap({
          srcToken: TOKEN_ADDRESSES.USDC,
          dstToken: TOKEN_ADDRESSES.ETH,
          amount: (parseFloat(investmentData.amount) * 1e6).toString(),
          walletAddress,
          chainId: SUPPORTED_CHAINS.ETHEREUM
        });
        
        toast({
          title: "Fusion+ Investment Executed",
          description: `Investing $${investmentData.amount} in ${investmentData.strategy} via Fusion+`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Investment error:', error);
      toast({
        title: "Investment Failed",
        description: limitOrderMode ? "Failed to create limit order" : "Failed to execute Fusion+ swap",
        variant: "destructive"
      });
    }
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Investment Configuration */}
          <div className="lg:col-span-2">
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

            {/* Withdraw Chain and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="withdrawChain">Withdraw Chain</Label>
                <Select onValueChange={(value) => handleInputChange("withdrawChain", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select withdraw chain" />
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
              <div className="space-y-2">
                <Label htmlFor="withdrawCurrency">Withdraw Currency</Label>
                <Select onValueChange={(value) => handleInputChange("withdrawCurrency", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crypto">Same as Investment</SelectItem>
                    <SelectItem value="usdc">USDC</SelectItem>
                    <SelectItem value="usdt">USDT</SelectItem>
                    <SelectItem value="dai">DAI</SelectItem>
                    <SelectItem value="eth">ETH</SelectItem>
                    <SelectItem value="btc">BTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Strategy Recommendation & Comparison</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="recommendation" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
                        <TabsTrigger value="comparison">Compare Strategies</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="recommendation" className="space-y-4">
                        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                          <h3 className="font-semibold text-primary mb-2">Recommended: Meta Model Blend</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Based on current market conditions and your investment profile
                          </p>
                          <div className="flex gap-2 mb-3">
                            <Badge className="bg-warning text-warning-foreground">Medium Risk</Badge>
                            <Badge variant="outline">9.8% Min Return</Badge>
                          </div>
                          
                          <div className="space-y-3 text-sm">
                            <div>
                              <h4 className="font-medium mb-1">Why this strategy?</h4>
                              <p className="text-muted-foreground">
                                Combines multiple AI models for optimal market adaptation. Historical data shows 
                                85% success rate in volatile markets with minimal drawdown risk.
                              </p>
                            </div>
                            
                            {investmentData.amount && (
                              <div className="border-t pt-3">
                                <h4 className="font-medium mb-2">Your Investment Calculation</h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <span className="text-muted-foreground">Investment:</span>
                                    <div className="font-medium">${investmentData.amount}</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Min Return:</span>
                                    <div className="font-medium text-success">${minReturn}</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Max Return (2x cap):</span>
                                    <div className="font-medium text-primary">${tokenReturn}</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Same Token Return:</span>
                                    <div className="font-medium">{tokenReturn} {investmentData.tokenType || 'tokens'}</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="comparison" className="space-y-4">
                        <div className="space-y-3">
                          <Label>Compare with another strategy</Label>
                          <Select onValueChange={(value) => {
                            setComparisonStrategy(value);
                            updateComparisonCalculations(value, investmentData.amount, investmentData.lockPeriod);
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select strategy to compare" />
                            </SelectTrigger>
                            <SelectContent>
                              {strategies.filter(s => s.name !== "Meta Model Blend").map((strategy) => (
                                <SelectItem key={strategy.name} value={strategy.name}>
                                  {strategy.name} - {strategy.minReturn}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {comparisonStrategy && investmentData.amount && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="p-3 bg-primary/5 border-primary/20">
                              <h4 className="font-medium text-primary mb-2">Recommended: Meta Model Blend</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Return:</span>
                                  <span className="font-medium">${minReturn}</span>
                                </div>
                                 <div className="flex justify-between">
                                   <span>Risk:</span>
                                   <Badge className="bg-warning text-warning-foreground text-xs">Medium</Badge>
                                 </div>
                              </div>
                            </Card>
                            
                            <Card className="p-3 bg-muted/5 border-border">
                              <h4 className="font-medium mb-2">{comparisonStrategy}</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Return:</span>
                                  <span className="font-medium">${comparisonReturn}</span>
                                </div>
                                 <div className="flex justify-between">
                                   <span>Risk:</span>
                                   <Badge className={`${getRiskColor(strategies.find(s => s.name === comparisonStrategy)?.risk || "Medium")} text-xs`}>
                                     {strategies.find(s => s.name === comparisonStrategy)?.risk}
                                   </Badge>
                                 </div>
                              </div>
                            </Card>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
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

            {/* 1inch Execution Mode Selection */}
            <div className="space-y-4">
              <Label>Execution Mode (1inch Integration)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  className={`p-4 cursor-pointer transition-all ${!limitOrderMode ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  onClick={() => setLimitOrderMode(false)}
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-medium">Fusion+ (Instant)</h4>
                      <p className="text-xs text-muted-foreground">MEV-protected instant execution</p>
                    </div>
                  </div>
                </Card>
                
                <Card 
                  className={`p-4 cursor-pointer transition-all ${limitOrderMode ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  onClick={() => setLimitOrderMode(true)}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-medium">Limit Order</h4>
                      <p className="text-xs text-muted-foreground">Set price & wait for execution</p>
                    </div>
                  </div>
                </Card>
              </div>
              
              {/* Fusion+ Quote Button */}
              {!limitOrderMode && investmentData.amount && investmentData.chain === "Ethereum" && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleGetFusionQuote}
                    disabled={oneInchLoading}
                  >
                    <ArrowUpDown className="w-4 h-4 mr-1" />
                    {oneInchLoading ? "Getting Quote..." : "Get Fusion+ Quote"}
                  </Button>
                  {fusionQuote && (
                    <Badge variant="outline" className="text-xs">
                      Rate: {parseFloat(fusionQuote.dstAmount) / 1e18} ETH
                    </Badge>
                  )}
                </div>
              )}
              
              {oneInchError && (
                <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                  {oneInchError}
                </div>
              )}
            </div>

            {/* Auto Lock Increase Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border">
              <div className="space-y-1">
                <Label htmlFor="autoLock">Automatic Lock-Up Increase (Recommended)</Label>
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
                    Investment Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <div className="text-muted-foreground">Strategy</div>
                      <div className="font-medium">{investmentData.strategy}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Risk Level</div>
                      <Badge className={getRiskColor(riskLevel)}>{riskLevel}</Badge>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Guaranteed Return (USD)</div>
                      <div className="font-medium text-success">${minReturn}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Same Token Return</div>
                      <div className="font-medium text-primary">{tokenReturn} {investmentData.tokenType || 'tokens'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Investment Gas Fee</div>
                      <div className="font-medium">{gasEstimate}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Withdrawal Gas Fee</div>
                      <div className="font-medium">{withdrawGasEstimate}</div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                      <div className="text-xs text-muted-foreground">
                        <strong>Return Cap Policy:</strong> Maximum return is capped at 2x your investment amount. 
                        This ensures guaranteed payouts for all investors even in bear markets. If market returns 
                        3x, you receive 2x to help cover losses during market downturns and maintain sustainability.
                      </div>
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

          {/* 1inch Integration Sidebar */}
          <div className="lg:col-span-1">
            <OneInchIntegration 
              investmentAmount={investmentData.amount}
              selectedChain={investmentData.chain}
              onExecutionComplete={(result) => {
                toast({
                  title: "1inch Execution Complete",
                  description: "Transaction submitted successfully",
                });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}