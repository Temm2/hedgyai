import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Send, TrendingUp, Award, BarChart3, Target, Upload, FileText, Wallet, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function DashboardSection() {
  const [signalData, setSignalData] = useState({
    asset: "",
    direction: "",
    confidence: "",
    timeframe: "",
    analysis: "",
    priceTarget: ""
  });
  
  const [signalFile, setSignalFile] = useState<File | null>(null);
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [submissionMethod, setSubmissionMethod] = useState("manual");

  const { toast } = useToast();

  const portfolio = [
    {
      id: "INV001",
      strategy: "Meta Model Blend",
      amount: "$2,500",
      chain: "Ethereum",
      lockPeriod: "3 Months",
      currentValue: "$2,847",
      return: "+13.9%",
      status: "Active",
      withdrawDate: "2024-04-15"
    },
    {
      id: "INV002", 
      strategy: "Momentum Rotation",
      amount: "$1,000",
      chain: "Sui",
      lockPeriod: "1 Month",
      currentValue: "$1,156",
      return: "+15.6%",
      status: "Active",
      withdrawDate: "2024-02-28"
    },
    {
      id: "INV003",
      strategy: "Stablecoin Farming",
      amount: "$5,000",
      chain: "Binance Smart Chain",
      lockPeriod: "6 Months",
      currentValue: "$5,234",
      return: "+4.7%",
      status: "Completed",
      withdrawDate: "2024-01-20"
    }
  ];

  const submittedSignals = [
    {
      id: "SIG001",
      asset: "BTC/USD",
      direction: "Long",
      confidence: 85,
      submitted: "2024-01-15",
      status: "Active",
      performance: "+12.4%",
      reward: "$1,247"
    },
    {
      id: "SIG002", 
      asset: "ETH/USD",
      direction: "Short",
      confidence: 78,
      submitted: "2024-01-14",
      status: "Closed",
      performance: "+8.7%",
      reward: "$892"
    },
    {
      id: "SIG003",
      asset: "MATIC/USD",
      direction: "Long", 
      confidence: 92,
      submitted: "2024-01-13",
      status: "Active",
      performance: "+15.2%",
      reward: "$1,584"
    }
  ];

  const userStats = {
    totalSignals: 23,
    successRate: 87,
    totalRewards: 12547,
    ranking: 15,
    avgConfidence: 83
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSignalFile(file);
      toast({
        title: "Backtest File Uploaded",
        description: `${file.name} uploaded successfully`,
      });
    }
  };

  const handleSubmitSignal = () => {
    if (submissionMethod === "manual" && (!signalData.asset || !signalData.direction || !signalData.confidence)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (submissionMethod === "file" && !signalFile) {
      toast({
        title: "No File Selected",
        description: "Please upload a backtest file.",
        variant: "destructive"
      });
      return;
    }

    if (submissionMethod === "api" && (!apiEndpoint || !apiKey)) {
      toast({
        title: "API Configuration Missing",
        description: "Please provide API endpoint and key.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Signal Submitted",
      description: `${submissionMethod === "manual" ? `${signalData.direction} signal for ${signalData.asset}` : 'Backtest data'} submitted successfully!`,
      duration: 3000,
    });

    // Reset form
    setSignalData({
      asset: "",
      direction: "",
      confidence: "",
      timeframe: "",
      analysis: "",
      priceTarget: ""
    });
    setSignalFile(null);
    setApiEndpoint("");
    setApiKey("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-primary text-primary-foreground";
      case "Closed": return "bg-success text-success-foreground";
      case "Pending": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-secondary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Signal Dashboard
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Submit trading signals and track your performance
          </p>
        </div>

        <Tabs defaultValue="submit" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="submit">Submit Signal</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="dashboard">My Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="submit" className="space-y-6">
            <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  Submit Trading Signal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Submission Method */}
                <div className="space-y-2">
                  <Label>Submission Method</Label>
                  <Tabs value={submissionMethod} onValueChange={setSubmissionMethod} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                      <TabsTrigger value="file">Upload File</TabsTrigger>
                      <TabsTrigger value="api">API Integration</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="manual" className="space-y-4 mt-4">
                      {/* Asset and Direction */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="asset">Asset Pair</Label>
                          <Input
                            id="asset"
                            placeholder="e.g., BTC/USD, ETH/BTC"
                            value={signalData.asset}
                            onChange={(e) => setSignalData({...signalData, asset: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="direction">Direction</Label>
                          <Select onValueChange={(value) => setSignalData({...signalData, direction: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select direction" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="long">Long (Buy)</SelectItem>
                              <SelectItem value="short">Short (Sell)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Confidence and Timeframe */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="confidence">Confidence Level (%)</Label>
                          <Input
                            id="confidence"
                            type="number"
                            min="1"
                            max="100"
                            placeholder="85"
                            value={signalData.confidence}
                            onChange={(e) => setSignalData({...signalData, confidence: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="timeframe">Timeframe</Label>
                          <Select onValueChange={(value) => setSignalData({...signalData, timeframe: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timeframe" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1h">1 Hour</SelectItem>
                              <SelectItem value="4h">4 Hours</SelectItem>
                              <SelectItem value="1d">1 Day</SelectItem>
                              <SelectItem value="1w">1 Week</SelectItem>
                              <SelectItem value="1m">1 Month</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Price Target */}
                      <div className="space-y-2">
                        <Label htmlFor="priceTarget">Price Target (Optional)</Label>
                        <Input
                          id="priceTarget"
                          placeholder="e.g., $45,000"
                          value={signalData.priceTarget}
                          onChange={(e) => setSignalData({...signalData, priceTarget: e.target.value})}
                        />
                      </div>
                      
                      {/* Analysis */}
                      <div className="space-y-2">
                        <Label htmlFor="analysis">Analysis & Reasoning</Label>
                        <Textarea
                          id="analysis"
                          placeholder="Provide your technical/fundamental analysis..."
                          rows={4}
                          value={signalData.analysis}
                          onChange={(e) => setSignalData({...signalData, analysis: e.target.value})}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="file" className="space-y-4 mt-4">
                      <div className="space-y-4">
                        <div className="p-6 border-2 border-dashed border-border rounded-lg text-center">
                          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="font-semibold mb-2">Upload Backtest Results</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Upload CSV, JSON, or Excel files with your backtested trading signals
                          </p>
                          <Input
                            type="file"
                            accept=".csv,.json,.xlsx,.xls"
                            onChange={handleFileUpload}
                            className="max-w-xs mx-auto"
                          />
                          {signalFile && (
                            <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                              <div className="flex items-center justify-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">{signalFile.name}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <p><strong>File Format Requirements:</strong></p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Include columns: Asset, Direction, Entry_Price, Exit_Price, Date, Confidence</li>
                            <li>Accurate signals will be rewarded, inaccurate ones penalized</li>
                            <li>Regular profitability increases reward multiplier</li>
                          </ul>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="api" className="space-y-4 mt-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="apiEndpoint">API Endpoint URL</Label>
                          <Input
                            id="apiEndpoint"
                            placeholder="https://your-api.com/signals"
                            value={apiEndpoint}
                            onChange={(e) => setApiEndpoint(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apiKey">API Key</Label>
                          <Input
                            id="apiKey"
                            type="password"
                            placeholder="Your API key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                          />
                        </div>
                        <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                          <h4 className="font-medium mb-2">API Integration Requirements</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Endpoint must return signals in JSON format</li>
                            <li>• Include authentication headers for secure access</li>
                            <li>• Real-time signal accuracy will be tracked and rewarded</li>
                            <li>• Poor performance may result in API access suspension</li>
                          </ul>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <Button 
                  variant="default" 
                  size="xl" 
                  className="w-full"
                  onClick={handleSubmitSignal}
                >
                  <Send className="w-5 h-5 mr-2" />
                  Submit Signal
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6">
            <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  My Investment Portfolio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolio.map((investment) => (
                    <div key={investment.id} className="p-4 bg-muted/20 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{investment.strategy}</span>
                          <Badge className={investment.status === "Active" ? "bg-primary text-primary-foreground" : "bg-success text-success-foreground"}>
                            {investment.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Current Return</div>
                          <div className={`font-semibold ${investment.return.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
                            {investment.return}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Initial Amount</div>
                          <div className="font-medium">{investment.amount}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Current Value</div>
                          <div className="font-medium">{investment.currentValue}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Chain</div>
                          <div className="font-medium">{investment.chain}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Lock Period</div>
                          <div className="font-medium">{investment.lockPeriod}</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          Withdraw available: {investment.withdrawDate}
                        </span>
                        {investment.status === "Completed" && (
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Signals</p>
                      <p className="text-2xl font-bold">{userStats.totalSignals}</p>
                    </div>
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                      <p className="text-2xl font-bold text-success">{userStats.successRate}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-success" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Rewards</p>
                      <p className="text-2xl font-bold">${userStats.totalRewards.toLocaleString()}</p>
                    </div>
                    <Award className="w-8 h-8 text-warning" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Ranking</p>
                      <p className="text-2xl font-bold">#{userStats.ranking}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Confidence</p>
                      <p className="text-2xl font-bold">{userStats.avgConfidence}%</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{userStats.avgConfidence}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Signal History */}
            <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
              <CardHeader>
                <CardTitle>Signal History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submittedSignals.map((signal) => (
                    <div key={signal.id} className="p-4 bg-muted/20 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{signal.asset}</span>
                          <Badge variant={signal.direction === "Long" ? "default" : "secondary"}>
                            {signal.direction}
                          </Badge>
                          <Badge className={getStatusColor(signal.status)}>
                            {signal.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Performance</div>
                          <div className="font-semibold text-success">{signal.performance}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Signal ID</div>
                          <div className="font-medium">{signal.id}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Submitted</div>
                          <div className="font-medium">{signal.submitted}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Confidence</div>
                          <div className="font-medium">{signal.confidence}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Reward</div>
                          <div className="font-medium text-success">{signal.reward}</div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Confidence Level</span>
                          <span>{signal.confidence}%</span>
                        </div>
                        <Progress value={signal.confidence} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}