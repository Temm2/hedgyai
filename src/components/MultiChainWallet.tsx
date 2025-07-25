import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, RefreshCw, Send, Download, ArrowUpDown, Bitcoin, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletBalance {
  chain: string;
  chainId: string;
  symbol: string;
  balance: string;
  usdValue: string;
  icon: React.ReactNode;
}

interface MultiChainWalletProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function MultiChainWallet({ onConnect, onDisconnect }: MultiChainWalletProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const supportedChains = [
    {
      name: "Ethereum",
      chainId: "1",
      symbol: "ETH",
      icon: <Zap className="w-5 h-5" />,
      rpcUrl: "https://mainnet.infura.io/v3/your-key"
    },
    {
      name: "Bitcoin",
      chainId: "bitcoin",
      symbol: "BTC",
      icon: <Bitcoin className="w-5 h-5" />,
      rpcUrl: "https://blockstream.info/api"
    },
    {
      name: "Polygon",
      chainId: "137",
      symbol: "MATIC",
      icon: <div className="w-5 h-5 bg-purple-500 rounded-full" />,
      rpcUrl: "https://polygon-rpc.com"
    }
  ];

  useEffect(() => {
    if (isConnected) {
      loadBalances();
    }
  }, [isConnected]);

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      
      // Check if MetaMask is available
      if (typeof (window as any).ethereum !== 'undefined') {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
          onConnect?.();
          
          toast({
            title: "Wallet Connected",
            description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
          });
        }
      } else {
        toast({
          title: "MetaMask Not Found",
          description: "Please install MetaMask to connect your wallet",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress("");
    setBalances([]);
    onDisconnect?.();
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const loadBalances = async () => {
    try {
      setIsLoading(true);
      
      // Mock balances for demonstration
      const mockBalances: WalletBalance[] = [
        {
          chain: "Ethereum",
          chainId: "1",
          symbol: "ETH",
          balance: "2.45",
          usdValue: "4,850.00",
          icon: <Zap className="w-5 h-5" />
        },
        {
          chain: "Bitcoin",
          chainId: "bitcoin",
          symbol: "BTC",
          balance: "0.125",
          usdValue: "5,250.00",
          icon: <Bitcoin className="w-5 h-5" />
        },
        {
          chain: "Polygon",
          chainId: "137",
          symbol: "MATIC",
          balance: "850.0",
          usdValue: "425.00",
          icon: <div className="w-5 h-5 bg-purple-500 rounded-full" />
        }
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setBalances(mockBalances);
      
    } catch (error) {
      toast({
        title: "Failed to Load Balances",
        description: "Could not fetch wallet balances",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalUsdValue = () => {
    return balances.reduce((total, balance) => 
      total + parseFloat(balance.usdValue.replace(/,/g, '')), 0
    ).toLocaleString();
  };

  if (!isConnected) {
    return (
      <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Multi-Chain Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center">
            Connect your wallet to access cross-chain trading and investment features
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            {supportedChains.map((chain) => (
              <div key={chain.chainId} className="flex items-center gap-2 p-3 bg-background/30 rounded-lg">
                {chain.icon}
                <span className="font-medium">{chain.name}</span>
              </div>
            ))}
          </div>
          
          <Button 
            className="w-full" 
            onClick={connectWallet}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Multi-Chain Wallet
          </CardTitle>
          <Button size="sm" variant="outline" onClick={disconnectWallet}>
            Disconnect
          </Button>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
          <Badge variant="secondary" className="text-green-500">
            Connected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Portfolio Value */}
        <div className="text-center p-4 bg-background/30 rounded-lg">
          <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
          <p className="text-2xl font-bold">${getTotalUsdValue()}</p>
        </div>

        {/* Chain Balances */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Balances</h3>
            <Button size="sm" variant="ghost" onClick={loadBalances} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {balances.map((balance) => (
            <div key={balance.chainId} className="flex items-center justify-between p-3 bg-background/20 rounded-lg">
              <div className="flex items-center gap-3">
                {balance.icon}
                <div>
                  <p className="font-medium">{balance.chain}</p>
                  <p className="text-sm text-muted-foreground">{balance.symbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{balance.balance} {balance.symbol}</p>
                <p className="text-sm text-muted-foreground">${balance.usdValue}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Wallet Actions */}
        <div className="grid grid-cols-3 gap-2">
          <Button size="sm" variant="outline" className="flex flex-col gap-1 h-auto py-3">
            <Download className="w-4 h-4" />
            <span className="text-xs">Receive</span>
          </Button>
          <Button size="sm" variant="outline" className="flex flex-col gap-1 h-auto py-3">
            <Send className="w-4 h-4" />
            <span className="text-xs">Send</span>
          </Button>
          <Button size="sm" variant="outline" className="flex flex-col gap-1 h-auto py-3">
            <ArrowUpDown className="w-4 h-4" />
            <span className="text-xs">Bridge</span>
          </Button>
        </div>

        {/* Agent Authority */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium">Agent Authority</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Hedgy agents have delegated signing authority for automated trading within your risk parameters
          </p>
        </div>
      </CardContent>
    </Card>
  );
}