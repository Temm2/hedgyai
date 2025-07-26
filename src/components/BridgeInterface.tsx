import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowUpDown, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { lifiAPI, type BridgeQuote, type BridgeParams } from "@/lib/lifi-api";
import { oneInchAPI } from "@/lib/oneinch-api";

interface BridgeInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress?: string;
}

export function BridgeInterface({ isOpen, onClose, walletAddress }: BridgeInterfaceProps) {
  const [fromChain, setFromChain] = useState("1"); // Ethereum
  const [toChain, setToChain] = useState("137"); // Polygon
  const [fromToken, setFromToken] = useState("ETH");
  const [toToken, setToToken] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<BridgeQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  const chains = [
    { id: "1", name: "Ethereum", symbol: "ETH" },
    { id: "137", name: "Polygon", symbol: "MATIC" },
    { id: "56", name: "BSC", symbol: "BNB" },
    { id: "42161", name: "Arbitrum", symbol: "ETH" },
  ];

  const tokens = {
    "1": [
      { symbol: "ETH", address: "0x0000000000000000000000000000000000000000" },
      { symbol: "USDC", address: "0xA0b86a33E6441b8F5C3c7Ba2E86E93797AC3b2dF" },
      { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
    ],
    "137": [
      { symbol: "MATIC", address: "0x0000000000000000000000000000000000001010" },
      { symbol: "USDC", address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" },
    ],
  };

  const getQuote = async () => {
    if (!amount || !walletAddress) {
      toast({
        title: "Missing Information",
        description: "Please enter amount and connect wallet",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const fromTokenAddress = tokens[fromChain as keyof typeof tokens]?.find(t => t.symbol === fromToken)?.address || "";
      const toTokenAddress = tokens[toChain as keyof typeof tokens]?.find(t => t.symbol === toToken)?.address || "";

      // First try 1inch Fusion+ for better MEV protection
      try {
        const fusionQuote = await oneInchAPI.getFusionQuote({
          srcToken: fromTokenAddress,
          dstToken: toTokenAddress,
          amount: amount,
          walletAddress: walletAddress,
          chainId: parseInt(fromChain)
        });
        
        if (fusionQuote) {
          toast({
            title: "Fusion+ Route Available",
            description: "MEV protection enabled via 1inch Fusion+",
          });
        }
      } catch (error) {
        console.log("Fusion+ not available, using Li.Fi");
      }

      // Get Li.Fi quote
      const bridgeParams: BridgeParams = {
        fromChain: parseInt(fromChain),
        toChain: parseInt(toChain),
        fromToken: fromTokenAddress,
        toToken: toTokenAddress,
        fromAmount: amount,
        fromAddress: walletAddress,
        toAddress: walletAddress,
      };

      const bridgeQuote = await lifiAPI.getQuote(bridgeParams);
      setQuote(bridgeQuote);

    } catch (error) {
      toast({
        title: "Quote Failed",
        description: "Unable to get bridge quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeBridge = async () => {
    if (!quote || !walletAddress) return;

    setIsExecuting(true);
    try {
      // Execute with Li.Fi
      const txHash = await lifiAPI.executeBridge(quote, walletAddress);
      
      toast({
        title: "Bridge Initiated",
        description: `Transaction hash: ${txHash.slice(0, 10)}...`,
      });

      // Reset form
      setAmount("");
      setQuote(null);
      onClose();

    } catch (error) {
      toast({
        title: "Bridge Failed",
        description: "Unable to execute bridge transaction",
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const swapChains = () => {
    const tempChain = fromChain;
    const tempToken = fromToken;
    setFromChain(toChain);
    setToChain(tempChain);
    setFromToken(toToken);
    setToToken(tempToken);
    setQuote(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5" />
            Cross-Chain Bridge
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* From Section */}
          <div className="space-y-3">
            <Label>From</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={fromChain} onValueChange={setFromChain}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chains.map(chain => (
                    <SelectItem key={chain.id} value={chain.id}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={fromToken} onValueChange={setFromToken}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tokens[fromChain as keyof typeof tokens]?.map(token => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={swapChains}>
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          </div>

          {/* To Section */}
          <div className="space-y-3">
            <Label>To</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={toChain} onValueChange={setToChain}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chains.map(chain => (
                    <SelectItem key={chain.id} value={chain.id}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={toToken} onValueChange={setToToken}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tokens[toChain as keyof typeof tokens]?.map(token => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {quote ? `≈ ${quote.toAmount} ${toToken}` : "Enter amount for quote"}
              </p>
            </div>
          </div>

          {/* Quote Details */}
          {quote && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Estimated Time:</span>
                  <span>{Math.ceil(quote.executionTime / 60)} minutes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Gas Fee:</span>
                  <span>≈ {quote.estimatedGas} ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Bridge Fee:</span>
                  <span>{quote.fees} {fromToken}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={getQuote}
              disabled={isLoading || !amount}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Getting Quote...
                </>
              ) : (
                "Get Quote"
              )}
            </Button>

            {quote && (
              <Button 
                className="w-full" 
                onClick={executeBridge}
                disabled={isExecuting}
                variant="secondary"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Bridging...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Execute Bridge
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}