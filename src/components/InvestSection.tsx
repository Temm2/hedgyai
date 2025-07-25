import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bot, TrendingUp, DollarSign, Clock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SUPPORTED_CHAINS } from "@/hooks/use-oneinch";
import { ElizaAgent } from "@/components/ElizaAgent";

interface Investment {
  id: string;
  amount: string;
  chain: string;
  tokenType: string;
  timestamp: Date;
  status: 'pending' | 'active' | 'completed';
  elizaId?: string;
}

export function InvestSection() {
  const [investmentData, setInvestmentData] = useState({
    chain: "1", // Ethereum mainnet
    amount: "",
    tokenType: "ETH"
  });
  
  const [investments, setInvestments] = useState<Investment[]>([]);
  const { toast } = useToast();

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

  const handleInvestNow = () => {
    if (!investmentData.amount || !investmentData.chain || !investmentData.tokenType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before investing.",
        variant: "destructive"
      });
      return;
    }

    const newInvestment: Investment = {
      id: Date.now().toString(),
      amount: investmentData.amount,
      chain: investmentData.chain,
      tokenType: investmentData.tokenType,
      timestamp: new Date(),
      status: 'pending'
    };

    setInvestments(prev => [...prev, newInvestment]);
    
    // Reset form
    setInvestmentData({
      chain: "1",
      amount: "",
      tokenType: "ETH"
    });

    toast({
      title: "Investment Added",
      description: "Eliza agent will start managing your investment shortly.",
    });
  };

  const removeInvestment = (id: string) => {
    setInvestments(prev => prev.filter(inv => inv.id !== id));
    toast({
      title: "Investment Removed",
      description: "Investment has been removed from your portfolio.",
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
            Configure your investment and let Eliza AI optimize your returns
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

                {/* Invest Button */}
                <Button 
                  className="w-full"
                  onClick={handleInvestNow}
                  disabled={!investmentData.amount || !investmentData.chain || !investmentData.tokenType}
                >
                  <Bot className="w-5 h-5 mr-2" />
                  Start Eliza Agent
                </Button>
              </CardContent>
            </Card>

            {/* Portfolio */}
            {investments.length > 0 && (
              <Card className="mt-6 bg-gradient-card backdrop-blur-glass border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Your Portfolio
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
          </div>

          {/* Eliza Agents */}
          <div>
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