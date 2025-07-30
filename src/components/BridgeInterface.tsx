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
import { coinGeckoAPI } from "@/lib/coingecko-api";
import { chainflipAPI } from "@/lib/chainflip-api";

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
      const amountNum = parseFloat(amount);
      let quote: BridgeQuote | null = null;

      // Check if it's a cross-protocol transaction (ETH <-> BTC)
      const isCrossProtocol = (fromToken === "ETH" && toToken === "BTC") || (fromToken === "BTC" && toToken === "ETH");

      if (isCrossProtocol) {
        // Use Li.Fi for cross-protocol transactions (ETH <-> BTC)
        const bridgeParams = {
          fromChain: fromToken === "ETH" ? 1 : 0, // Ethereum mainnet or Bitcoin
          toChain: toToken === "ETH" ? 1 : 0,
          fromToken: fromToken === "ETH" ? "0x0000000000000000000000000000000000000000" : "BTC",
          toToken: toToken === "ETH" ? "0x0000000000000000000000000000000000000000" : "BTC", 
          fromAmount: (amountNum * (fromToken === "ETH" ? 1e18 : 1e8)).toString(), // Wei for ETH, satoshis for BTC
          fromAddress: walletAddress,
          toAddress: walletAddress
        };

        quote = await lifiAPI.getQuote(bridgeParams);
      } else {
        // Use 1inch Fusion+ for EVM chains and stablecoins
        try {
          const ethTokenAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
          const wbtcTokenAddress = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
          
          // Get real-time quotes from 1inch Fusion+
          const fusionQuote = await oneInchAPI.getFusionQuote({
            srcToken: ethTokenAddress,
            dstToken: wbtcTokenAddress,
            amount: (amountNum * 1e18).toString(), // Convert to wei
            walletAddress: walletAddress,
            chainId: 1
          });

          quote = {
            id: Date.now().toString(),
            fromToken: fromToken,
            toToken: toToken,
            fromChain: 1, // Ethereum
            toChain: 1, // Ethereum
            fromAmount: amount,
            toAmount: (parseInt(fusionQuote.dstAmount) / 1e8).toString(), // Convert from satoshis
            estimatedGas: "0.002",
            fees: fusionQuote.tx?.value ? (parseInt(fusionQuote.tx.value) / 1e18 * 0.005).toFixed(6) : "0.001",
            route: fusionQuote,
            executionTime: 120 // 2 minutes for Fusion+
          };
        } catch (error) {
          console.warn("Fusion+ quote failed, using real-time price calculation");
          
          // Get real-time prices from CoinGecko
          const ethBtcPrice = await coinGeckoAPI.getETHBTCPrice();
          const ethPrice = (await coinGeckoAPI.getSimplePrice(['ethereum'])).ethereum?.usd || 3400;
          const btcPrice = (await coinGeckoAPI.getSimplePrice(['bitcoin'])).bitcoin?.usd || 68000;
          
          const rate = ethBtcPrice ? 
            (fromToken === "ETH" ? ethBtcPrice.eth_to_btc : ethBtcPrice.btc_to_eth) :
            (fromToken === "ETH" ? ethPrice / btcPrice : btcPrice / ethPrice);
          const toAmount = (amountNum * rate * 0.995).toFixed(fromToken === "ETH" ? 8 : 6);
          
          quote = {
            id: Date.now().toString(),
            fromToken: fromToken,
            toToken: toToken,
            fromChain: 1,
            toChain: 1,
            fromAmount: amount,
            toAmount: toAmount,
            estimatedGas: "0.002",
            fees: (amountNum * 0.005).toFixed(6),
            route: { ethPrice, btcPrice, rate },
            executionTime: 180
          };
        }
      }

      if (quote) {
        setQuote(quote);
        toast({
          title: "Quote Generated",
          description: `Best rate: ${quote.fromAmount} ${fromToken} → ${quote.toAmount} ${toToken}`,
        });
      }

    } catch (error) {
      console.error("Quote error:", error);
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