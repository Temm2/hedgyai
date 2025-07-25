import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, RefreshCw, Send, Download, ArrowUpDown, Bitcoin, Zap, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MetaMaskSDK } from "@metamask/sdk";

interface WalletBalance {
  chain: string;
  chainId: string;
  symbol: string;
  balance: string;
  usdValue: string;
  icon: React.ReactNode;
}

interface MultiChainWalletProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function MultiChainWallet({ isOpen, onClose, onConnect, onDisconnect }: MultiChainWalletProps) {
  const [isEthConnected, setIsEthConnected] = useState(false);
  const [isBtcConnected, setIsBtcConnected] = useState(false);
  const [ethAddress, setEthAddress] = useState("");
  const [btcAddress, setBtcAddress] = useState("");
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [metaMaskSDK, setMetaMaskSDK] = useState<MetaMaskSDK | null>(null);
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
    // Initialize MetaMask SDK
    const initSDK = () => {
      const MMSDK = new MetaMaskSDK({
        dappMetadata: {
          name: "HedgyAI",
          url: window.location.href,
        },
        infuraAPIKey: "6234e1e5b0d8400eae8fd8a814dd0909",
      });
      setMetaMaskSDK(MMSDK);
    };

    initSDK();
  }, []);

  useEffect(() => {
    if (isEthConnected || isBtcConnected) {
      loadBalances();
    }
  }, [isEthConnected, isBtcConnected]);

  const connectEthWallet = async () => {
    try {
      setIsLoading(true);
      
      if (!metaMaskSDK) {
        toast({
          title: "SDK Not Ready",
          description: "MetaMask SDK is still initializing",
          variant: "destructive"
        });
        return;
      }

      const accounts = await metaMaskSDK.connect();
      
      if (accounts && accounts.length > 0) {
        setEthAddress(accounts[0]);
        setIsEthConnected(true);
        onConnect?.();
        
        toast({
          title: "Ethereum Wallet Connected",
          description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect Ethereum wallet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const connectBtcWallet = async () => {
    try {
      setIsLoading(true);
      
      // For Bitcoin, we'll simulate connection since it requires different implementation
      // In production, you'd use a Bitcoin wallet adapter
      const mockBtcAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
      setBtcAddress(mockBtcAddress);
      setIsBtcConnected(true);
      
      toast({
        title: "Bitcoin Wallet Connected",
        description: `Connected to ${mockBtcAddress.slice(0, 6)}...${mockBtcAddress.slice(-4)}`,
      });
      
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect Bitcoin wallet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallets = () => {
    setIsEthConnected(false);
    setIsBtcConnected(false);
    setEthAddress("");
    setBtcAddress("");
    setBalances([]);
    onDisconnect?.();
    
    toast({
      title: "Wallets Disconnected",
      description: "All wallets have been disconnected",
    });
  };

  const loadBalances = async () => {
    try {
      setIsLoading(true);
      
      const mockBalances: WalletBalance[] = [];
      
      if (isEthConnected) {
        mockBalances.push(
          {
            chain: "Ethereum",
            chainId: "1",
            symbol: "ETH",
            balance: "2.45",
            usdValue: "4,850.00",
            icon: <Zap className="w-5 h-5" />
          },
          {
            chain: "Polygon",
            chainId: "137",
            symbol: "MATIC",
            balance: "850.0",
            usdValue: "425.00",
            icon: <div className="w-5 h-5 bg-purple-500 rounded-full" />
          }
        );
      }
      
      if (isBtcConnected) {
        mockBalances.push({
          chain: "Bitcoin",
          chainId: "bitcoin",
          symbol: "BTC",
          balance: "0.125",
          usdValue: "5,250.00",
          icon: <Bitcoin className="w-5 h-5" />
        });
      }
      
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

  const hasAnyConnection = isEthConnected || isBtcConnected;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Multi-Chain Wallet
            </DialogTitle>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {!hasAnyConnection ? (
            <>
              <p className="text-muted-foreground text-center">
                Connect your wallets to access cross-chain trading and investment features
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ethereum Wallet */}
                <div className="p-4 border border-border rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    <span className="font-medium">Ethereum Wallet</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Connect via MetaMask for Ethereum and EVM chains
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={connectEthWallet}
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
                        Connect MetaMask
                      </>
                    )}
                  </Button>
                </div>

                {/* Bitcoin Wallet */}
                <div className="p-4 border border-border rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Bitcoin className="w-5 h-5" />
                    <span className="font-medium">Bitcoin Wallet</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Connect your Bitcoin wallet for BTC transactions
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={connectBtcWallet}
                    disabled={isLoading}
                    variant="outline"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Bitcoin className="w-4 h-4 mr-2" />
                        Connect Bitcoin
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Connected Wallets Status */}
              <div className="space-y-3">
                {isEthConnected && (
                  <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Ethereum</p>
                        <p className="text-sm text-muted-foreground">
                          {ethAddress.slice(0, 6)}...{ethAddress.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-green-500">
                      Connected
                    </Badge>
                  </div>
                )}
                
                {isBtcConnected && (
                  <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bitcoin className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Bitcoin</p>
                        <p className="text-sm text-muted-foreground">
                          {btcAddress.slice(0, 6)}...{btcAddress.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-green-500">
                      Connected
                    </Badge>
                  </div>
                )}
              </div>

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

              {/* Disconnect Button */}
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={disconnectWallets}
              >
                Disconnect All Wallets
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}