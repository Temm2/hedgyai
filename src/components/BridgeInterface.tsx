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
  const [fromToken, setFromToken] = useState("ETH");
  const [toToken, setToToken] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<BridgeQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  const supportedTokens = ["ETH", "BTC"];

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
      // Cross-chain swap from ETH to BTC or vice versa
      const fromChainId = fromToken === "ETH" ? 1 : 0; // 1 for Ethereum, 0 for Bitcoin
      const toChainId = toToken === "ETH" ? 1 : 0;
      
      // Use demo addresses for cross-chain bridge
      const fromTokenAddress = fromToken === "ETH" ? "0x0000000000000000000000000000000000000000" : "bitcoin";
      const toTokenAddress = toToken === "ETH" ? "0x0000000000000000000000000000000000000000" : "bitcoin";

      // Try 1inch Fusion+ for ETH-based swaps
      if (fromToken === "ETH" && toToken === "BTC") {
        try {
          const fusionQuote = await oneInchAPI.getFusionQuote({
            srcToken: fromTokenAddress,
            dstToken: toTokenAddress,
            amount: amount,
            walletAddress: walletAddress,
            chainId: 1
          });
          
          if (fusionQuote) {
            toast({
              title: "Fusion+ Available",
              description: "MEV protection enabled",
            });
          }
        } catch (error) {
          console.log("Fusion+ not available, using Li.Fi");
        }
      }

      // Get Li.Fi cross-chain quote
      const bridgeParams: BridgeParams = {
        fromChain: fromChainId,
        toChain: toChainId,
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
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    setQuote(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5" />
            Cross-Chain Bridge
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* From Section */}
          <div className="space-y-2">
            <Label className="text-sm">From</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={fromToken} onValueChange={setFromToken}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="BTC">BTC</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={swapChains} className="h-8 w-8 p-0">
              <ArrowUpDown className="w-3 h-3" />
            </Button>
          </div>

          {/* To Section */}
          <div className="space-y-2">
            <Label className="text-sm">To</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={toToken} onValueChange={setToToken}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="BTC">BTC</SelectItem>
                </SelectContent>
              </Select>
              <div className="p-2 bg-muted rounded text-sm text-muted-foreground h-9 flex items-center">
                {quote ? `≈ ${quote.toAmount}` : "0.0"}
              </div>
            </div>
          </div>

          {/* Quote Details */}
          {quote && (
            <div className="p-3 bg-muted rounded-lg space-y-1">
              <div className="flex justify-between text-xs">
                <span>Time:</span>
                <span>{Math.ceil(quote.executionTime / 60)}min</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Fee:</span>
                <span>{quote.fees} {fromToken}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              className="w-full h-9" 
              onClick={getQuote}
              disabled={isLoading || !amount}
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Quote...
                </>
              ) : (
                "Get Quote"
              )}
            </Button>

            {quote && (
              <Button 
                className="w-full h-9" 
                onClick={executeBridge}
                disabled={isExecuting}
                variant="secondary"
                size="sm"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Swapping...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-3 h-3 mr-1" />
                    Swap
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