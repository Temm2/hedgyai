import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Zap, Clock, TrendingUp, ArrowUpDown, ExternalLink } from "lucide-react";
import { useOneInch, SUPPORTED_CHAINS, TOKEN_ADDRESSES } from "@/hooks/use-oneinch";
import { useToast } from "@/hooks/use-toast";

interface OneInchIntegrationProps {
  investmentAmount: string;
  selectedChain: string;
  onExecutionComplete?: (result: any) => void;
}

export function OneInchIntegration({ investmentAmount, selectedChain, onExecutionComplete }: OneInchIntegrationProps) {
  const [executionMode, setExecutionMode] = useState<"fusion" | "limit">("fusion");
  const [limitPrice, setLimitPrice] = useState("");
  const [sourceToken, setSourceToken] = useState<string>(TOKEN_ADDRESSES.USDC);
  const [destinationToken, setDestinationToken] = useState<string>(TOKEN_ADDRESSES.ETH);
  const [quote, setQuote] = useState<any>(null);
  const [walletAddress] = useState("0x742d35Cc6639C0532fBb9ea7e1ED8b7B3f5A8"); // Demo wallet
  
  const { toast } = useToast();
  const {
    tokens,
    isLoading,
    error,
    loadTokens,
    getFusionQuote,
    executeFusionSwap,
    createLimitOrder,
    getLimitOrders,
    getTokenPrices
  } = useOneInch();

  // Load tokens when chain changes
  useEffect(() => {
    if (selectedChain === "Ethereum") {
      loadTokens(SUPPORTED_CHAINS.ETHEREUM);
    }
  }, [selectedChain, loadTokens]);

  // Get real-time quote
  const handleGetQuote = async () => {
    if (!investmentAmount || !walletAddress) {
      toast({
        title: "Missing Information",
        description: "Please enter investment amount",
        variant: "destructive"
      });
      return;
    }

    try {
      const quoteResult = await getFusionQuote({
        srcToken: sourceToken,
        dstToken: destinationToken,
        amount: (parseFloat(investmentAmount) * 1e6).toString(), // Assuming USDC (6 decimals)
        walletAddress,
        chainId: SUPPORTED_CHAINS.ETHEREUM
      });
      
      setQuote(quoteResult);
      
      toast({
        title: "Quote Updated",
        description: `Best rate found via 1inch Fusion+`,
      });
    } catch (err) {
      console.error('Quote error:', err);
      toast({
        title: "Quote Failed",
        description: "Failed to get 1inch quote",
        variant: "destructive"
      });
    }
  };

  // Execute the swap/order
  const handleExecute = async () => {
    if (!quote && executionMode === "fusion") {
      await handleGetQuote();
      return;
    }

    try {
      if (executionMode === "fusion") {
        // Execute Fusion+ swap
        const result = await executeFusionSwap({
          srcToken: sourceToken,
          dstToken: destinationToken,
          amount: (parseFloat(investmentAmount) * 1e6).toString(),
          walletAddress,
          chainId: SUPPORTED_CHAINS.ETHEREUM
        });
        
        toast({
          title: "Fusion+ Swap Executed",
          description: "MEV-protected swap completed successfully",
        });
        
        onExecutionComplete?.(result);
      } else {
        // Create limit order
        const limitAmount = limitPrice ? 
          (parseFloat(investmentAmount) / parseFloat(limitPrice) * 1e18).toString() : 
          quote?.dstAmount || "1000000000000000000";
          
        const result = await createLimitOrder({
          makerAsset: sourceToken,
          takerAsset: destinationToken,
          makingAmount: (parseFloat(investmentAmount) * 1e6).toString(),
          takingAmount: limitAmount,
          maker: walletAddress,
          chainId: SUPPORTED_CHAINS.ETHEREUM
        });
        
        toast({
          title: "Limit Order Created",
          description: `Order created with hash: ${result.orderHash?.substring(0, 10)}...`,
        });
        
        onExecutionComplete?.(result);
      }
    } catch (err) {
      console.error('Execution error:', err);
      toast({
        title: "Execution Failed",
        description: executionMode === "fusion" ? "Fusion+ swap failed" : "Limit order creation failed",
        variant: "destructive"
      });
    }
  };

  // Calculate estimated output
  const getEstimatedOutput = () => {
    if (!quote) return "0";
    return (parseFloat(quote.dstAmount) / 1e18).toFixed(6);
  };

  // Get price impact
  const getPriceImpact = () => {
    if (!quote?.priceImpact) return "< 0.01%";
    return `${quote.priceImpact}%`;
  };

  return (
    <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          1inch Integration
          <Badge variant="outline" className="text-xs">
            Hackathon PoC
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Execution Mode Selection */}
        <div className="space-y-2">
          <Label>Execution Mode</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={executionMode === "fusion" ? "default" : "outline"}
              size="sm"
              onClick={() => setExecutionMode("fusion")}
              className="justify-start"
            >
              <Zap className="w-4 h-4 mr-1" />
              Fusion+
            </Button>
            <Button
              variant={executionMode === "limit" ? "default" : "outline"}
              size="sm"
              onClick={() => setExecutionMode("limit")}
              className="justify-start"
            >
              <Clock className="w-4 h-4 mr-1" />
              Limit Order
            </Button>
          </div>
        </div>

        {/* Token Selection */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Select value={sourceToken} onValueChange={setSourceToken}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TOKEN_ADDRESSES.USDC}>USDC</SelectItem>
                <SelectItem value={TOKEN_ADDRESSES.USDT}>USDT</SelectItem>
                <SelectItem value={TOKEN_ADDRESSES.DAI}>DAI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Select value={destinationToken} onValueChange={setDestinationToken}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TOKEN_ADDRESSES.ETH}>ETH</SelectItem>
                <SelectItem value={TOKEN_ADDRESSES.WBTC}>WBTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quote Information */}
        {quote && (
          <div className="space-y-2 p-3 bg-muted/20 rounded-lg border border-border">
            <div className="flex justify-between text-sm">
              <span>Estimated Output:</span>
              <span className="font-medium">{getEstimatedOutput()} ETH</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Price Impact:</span>
              <span className="font-medium">{getPriceImpact()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>MEV Protection:</span>
              <Badge variant="outline" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Fusion+
              </Badge>
            </div>
            {quote.gas && (
              <div className="flex justify-between text-sm">
                <span>Gas Estimate:</span>
                <span className="font-medium">~${(parseFloat(quote.gas) * 0.00000002 * 3000).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Limit Order Price Input */}
        {executionMode === "limit" && (
          <div className="space-y-2">
            <Label className="text-xs">Limit Price (ETH per $)</Label>
            <input
              type="number"
              placeholder="0.0005"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="w-full h-8 px-2 text-sm border rounded"
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-2 rounded">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleGetQuote}
            variant="outline"
            size="sm"
            disabled={isLoading || !investmentAmount}
            className="flex-1"
          >
            <ArrowUpDown className="w-4 h-4 mr-1" />
            {isLoading ? "Loading..." : "Get Quote"}
          </Button>
          
          <Button
            onClick={handleExecute}
            variant="invest"
            size="sm"
            disabled={isLoading || !investmentAmount}
            className="flex-1"
          >
            {executionMode === "fusion" ? (
              <>
                <Zap className="w-4 h-4 mr-1" />
                Execute Fusion+
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-1" />
                Create Order
              </>
            )}
          </Button>
        </div>

        {/* Hackathon Info */}
        <div className="text-xs text-muted-foreground bg-primary/5 p-2 rounded border border-primary/20">
          <div className="flex items-center justify-between">
            <span>🏆 1inch Hackathon Integration</span>
            <ExternalLink className="w-3 h-3" />
          </div>
          <div className="mt-1">
            Fusion+ MEV protection • Limit Order Protocol • Real 1inch APIs
          </div>
        </div>
      </CardContent>
    </Card>
  );
}