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

  const supportedTokens = ["ETH", "USDC", "USDT", "BTC"];

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

      // Determine routing strategy based on tokens
      const isCrossProtocol = isCrossProtocolTrade(fromToken, toToken);
      const isEVMSameChain = isEVMSameChainTrade(fromToken, toToken);

      if (isCrossProtocol) {
        // Use Chainflip for cross-protocol trades (ETH/USDC/USDT to BTC)
        const chainflipQuote = await chainflipAPI.getQuote({
          srcAsset: fromToken,
          destAsset: toToken,
          amount: (amountNum * getTokenDecimals(fromToken)).toString(),
        });
        
        quote = {
          id: Date.now().toString(),
          fromToken: fromToken,
          toToken: toToken,
          fromChain: getChainId(fromToken),
          toChain: getChainId(toToken),
          fromAmount: amount,
          toAmount: (parseFloat(chainflipQuote.outputAmount) / getTokenDecimals(toToken)).toString(),
          estimatedGas: chainflipQuote.networkFee,
          fees: chainflipQuote.brokerFee,
          route: chainflipQuote,
          executionTime: chainflipQuote.estimatedDuration || 300
        };
      } else if (isEVMSameChain) {
        // Use 1inch Fusion+ for EVM same-chain trades
        const fusionQuote = await oneInchAPI.getFusionQuote({
          srcToken: getTokenAddress(fromToken),
          dstToken: getTokenAddress(toToken),
          amount: (amountNum * getTokenDecimals(fromToken)).toString(),
          walletAddress: walletAddress,
          chainId: 1,
        });
        
        quote = {
          id: Date.now().toString(),
          fromToken: fromToken,
          toToken: toToken,
          fromChain: 1,
          toChain: 1,
          fromAmount: amount,
          toAmount: fusionQuote.dstAmount ? 
            (parseFloat(fusionQuote.dstAmount) / getTokenDecimals(toToken)).toString() : 
            (amountNum * 0.998).toString(),
          estimatedGas: "0",
          fees: fusionQuote.feeAmount || "0",
          route: fusionQuote,
          executionTime: 60
        };
      } else {
        // Use Li.Fi for cross-chain EVM trades (if any)
        const bridgeParams = {
          fromChain: 1, // Ethereum
          toChain: getChainId(toToken),
          fromToken: getTokenAddress(fromToken),
          toToken: getTokenAddress(toToken),
          fromAmount: (amountNum * getTokenDecimals(fromToken)).toString(),
          fromAddress: walletAddress,
          toAddress: walletAddress
        };

        const bridgeQuote = await lifiAPI.getQuote(bridgeParams);
        quote = bridgeQuote;
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

  // Helper functions
  const getTokenAddress = (symbol: string): string => {
    const addresses: { [key: string]: string } = {
      'ETH': '0x0000000000000000000000000000000000000000',
      'USDC': '0xA0b86a33E6441c49863CC10e3da08D7D2Fa06e0C',
      'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      'BTC': 'BTC',
    };
    return addresses[symbol] || addresses['ETH'];
  };

  const getChainId = (symbol: string): number => {
    return symbol === 'BTC' ? 0 : 1; // Bitcoin = 0, Ethereum = 1
  };

  const getTokenDecimals = (symbol: string): number => {
    const decimals: { [key: string]: number } = {
      'ETH': 1e18,
      'USDC': 1e6,
      'USDT': 1e6,
      'BTC': 1e8,
    };
    return decimals[symbol] || 1e18;
  };

  const isCrossProtocolTrade = (from: string, to: string): boolean => {
    const btcTokens = ['BTC'];
    const evmTokens = ['ETH', 'USDC', 'USDT'];
    
    return (evmTokens.includes(from) && btcTokens.includes(to)) ||
           (btcTokens.includes(from) && evmTokens.includes(to));
  };

  const isEVMSameChainTrade = (from: string, to: string): boolean => {
    const evmTokens = ['ETH', 'USDC', 'USDT'];
    return evmTokens.includes(from) && evmTokens.includes(to);
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
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
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
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
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