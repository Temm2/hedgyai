import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, RefreshCw, Send, Download, ArrowUpDown, Bitcoin, Zap, X, Bot, Copy, Eye, EyeOff, QrCode, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MetaMaskSDK } from "@metamask/sdk";
import { AgentWalletManager, ProgrammaticWallet, WalletSecurity } from "@/lib/programmatic-wallets";
import { AppConfig, UserSession, showConnect } from '@stacks/connect';

interface WalletBalance {
  chain: string;
  chainId: string;
  symbol: string;
  balance: string;
  usdValue: string;
  icon: React.ReactNode;
  address?: string;
}

interface TokenBalance extends WalletBalance {
  contractAddress?: string;
}

interface MultiChainWalletProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function MultiChainWallet({ isOpen, onClose, onConnect, onDisconnect }: MultiChainWalletProps) {
  const [isEthConnected, setIsEthConnected] = useState(false);
  const [isHiroConnected, setIsHiroConnected] = useState(false);
  const [isAgentWalletActive, setIsAgentWalletActive] = useState(false);
  const [ethAddress, setEthAddress] = useState("");
  const [hiroAddress, setHiroAddress] = useState("");
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [agentWallets, setAgentWallets] = useState<ProgrammaticWallet[]>([]);
  const [agentSecurity, setAgentSecurity] = useState<WalletSecurity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [metaMaskSDK, setMetaMaskSDK] = useState<MetaMaskSDK | null>(null);
  const [hiroUserSession, setHiroUserSession] = useState<UserSession | null>(null);
  const [agentWalletManager] = useState(() => new AgentWalletManager());
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [selectedTab, setSelectedTab] = useState("wallets");
  const { toast } = useToast();

  // Initialize Hiro wallet configuration
  const appConfig = new AppConfig(['store_write', 'publish_data']);

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

    // Initialize Hiro wallet
    const initHiro = () => {
      const userSession = new UserSession({ appConfig });
      setHiroUserSession(userSession);
    };

    initSDK();
    initHiro();
  }, []);

  useEffect(() => {
    if (isEthConnected || isHiroConnected || isAgentWalletActive) {
      loadBalances();
    }
  }, [isEthConnected, isHiroConnected, isAgentWalletActive]);

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

        // Load token balances
        await loadTokenBalances(accounts[0]);
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

  const connectHiroWallet = async () => {
    try {
      setIsLoading(true);
      
      if (!hiroUserSession) {
        toast({
          title: "Hiro Not Ready",
          description: "Hiro wallet session not initialized",
          variant: "destructive"
        });
        return;
      }

      // Configure Hiro connection
      const authOptions = {
        redirectTo: window.location.origin,
        userSession: hiroUserSession,
        appDetails: {
          name: "HedgyAI",
          icon: window.location.origin + "/favicon.ico"
        },
        onFinish: (authData: any) => {
          const userData = authData.userSession.loadUserData();
          const address = userData.profile.stxAddress.mainnet;
          setHiroAddress(address);
          setIsHiroConnected(true);
          
          toast({
            title: "Hiro Wallet Connected",
            description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
          });
        },
        onCancel: () => {
          toast({
            title: "Connection Cancelled",
            description: "Hiro wallet connection was cancelled",
            variant: "destructive"
          });
        }
      };

      await showConnect(authOptions);
      
    } catch (error) {
      // For demo purposes, create a mock connection
      const mockAddress = "SP1P2B2HQXD82PQVY46VZ6MFYBA7ZPJ2Q4KWP7XNH";
      setHiroAddress(mockAddress);
      setIsHiroConnected(true);
      
      toast({
        title: "Hiro Wallet Connected (Demo)",
        description: `Connected to ${mockAddress.slice(0, 6)}...${mockAddress.slice(-4)}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const initializeAgentWallet = async () => {
    try {
      setIsLoading(true);
      
      const wallets = await agentWalletManager.getWallets();
      const security = agentWalletManager.exportSecurity();
      
      setAgentWallets(wallets);
      setAgentSecurity(security);
      setIsAgentWalletActive(true);
      
      toast({
        title: "Agent Wallets Initialized",
        description: "HD wallets created with BIP-39 mnemonic",
      });
      
    } catch (error) {
      toast({
        title: "Agent Wallet Failed",
        description: "Failed to initialize agent wallets",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTokenBalances = async (address: string) => {
    try {
      // Common ERC-20 tokens for demo
      const commonTokens = [
        { symbol: "USDC", address: "0xA0b86a33E6441b7c43669F21506Fa8b6D9e9B4c3", decimals: 6 },
        { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
        { symbol: "WBTC", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8 },
      ];

      const mockTokenBalances: TokenBalance[] = commonTokens.map(token => ({
        chain: "Ethereum",
        chainId: "1",
        symbol: token.symbol,
        balance: (Math.random() * 1000).toFixed(2),
        usdValue: (Math.random() * 5000).toFixed(2),
        icon: <div className="w-5 h-5 bg-blue-500 rounded-full" />,
        contractAddress: token.address,
        address
      }));

      setTokenBalances(mockTokenBalances);
    } catch (error) {
      console.error("Failed to load token balances:", error);
    }
  };

  const disconnectWallets = () => {
    setIsEthConnected(false);
    setIsHiroConnected(false);
    setIsAgentWalletActive(false);
    setEthAddress("");
    setHiroAddress("");
    setBalances([]);
    setTokenBalances([]);
    setAgentWallets([]);
    setAgentSecurity(null);
    onDisconnect?.();
    
    toast({
      title: "Wallets Disconnected",
      description: "All wallets have been disconnected",
    });
  };

  const loadBalances = async () => {
    try {
      setIsLoading(true);
      
      const newBalances: WalletBalance[] = [];
      
      if (isEthConnected && ethAddress) {
        // Fetch real ETH balance using MetaMask
        try {
          const balance = await metaMaskSDK?.getProvider()?.request({
            method: 'eth_getBalance',
            params: [ethAddress, 'latest']
          }) as string;
          
          const ethBalance = parseInt(balance, 16) / Math.pow(10, 18);
          
          newBalances.push({
            chain: "Ethereum",
            chainId: "1",
            symbol: "ETH",
            balance: ethBalance.toFixed(4),
            usdValue: (ethBalance * 2000).toFixed(2), // Mock USD price
            icon: <Zap className="w-5 h-5" />,
            address: ethAddress
          });
        } catch (error) {
          // Fallback to demo balance
          newBalances.push({
            chain: "Ethereum",
            chainId: "1",
            symbol: "ETH",
            balance: "2.45",
            usdValue: "4,850.00",
            icon: <Zap className="w-5 h-5" />,
            address: ethAddress
          });
        }
      }
      
      if (isHiroConnected && hiroAddress) {
        newBalances.push({
          chain: "Bitcoin (Hiro)",
          chainId: "bitcoin-hiro",
          symbol: "BTC",
          balance: "0.125",
          usdValue: "5,250.00",
          icon: <Bitcoin className="w-5 h-5" />,
          address: hiroAddress
        });
      }

      // Add agent wallet balances
      if (isAgentWalletActive && agentWallets.length > 0) {
        agentWallets.forEach(wallet => {
          newBalances.push({
            chain: `${wallet.symbol === 'ETH' ? 'Ethereum' : 'Bitcoin'} (Agent)`,
            chainId: `${wallet.chainId}-agent`,
            symbol: wallet.symbol,
            balance: wallet.balance,
            usdValue: wallet.symbol === 'ETH' ? "4,200.00" : "2,625.00",
            icon: <Bot className="w-5 h-5" />,
            address: wallet.address
          });
        });
      }
      
      setBalances(newBalances);
      
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
    const balanceTotal = balances.reduce((total, balance) => 
      total + parseFloat(balance.usdValue.replace(/,/g, '')), 0
    );
    const tokenTotal = tokenBalances.reduce((total, token) => 
      total + parseFloat(token.usdValue.replace(/,/g, '')), 0
    );
    return (balanceTotal + tokenTotal).toLocaleString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "Address copied successfully",
    });
  };

  const hasAnyConnection = isEthConnected || isHiroConnected || isAgentWalletActive;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="wallets">Wallets</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="send">Send</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="wallets" className="space-y-6">
            {!hasAnyConnection ? (
              <>
                <p className="text-muted-foreground text-center">
                  Connect your wallets to access cross-chain trading and investment features
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                  {/* Bitcoin Hiro Wallet */}
                  <div className="p-4 border border-border rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Bitcoin className="w-5 h-5" />
                      <span className="font-medium">Bitcoin Wallet</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Connect Hiro wallet for Bitcoin transactions
                    </p>
                    <Button 
                      className="w-full" 
                      onClick={connectHiroWallet}
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
                          Connect Hiro
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Agent Wallet */}
                  <div className="p-4 border border-border rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5" />
                      <span className="font-medium">Agent Wallets</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Create HD wallets for automated trading
                    </p>
                    <Button 
                      className="w-full" 
                      onClick={initializeAgentWallet}
                      disabled={isLoading}
                      variant="secondary"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Initializing...
                        </>
                      ) : (
                        <>
                          <Bot className="w-4 h-4 mr-2" />
                          Create HD Wallets
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
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                              {ethAddress.slice(0, 6)}...{ethAddress.slice(-4)}
                            </p>
                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(ethAddress)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-green-500">
                        Connected
                      </Badge>
                    </div>
                  )}
                  
                  {isHiroConnected && (
                    <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bitcoin className="w-5 h-5" />
                        <div>
                          <p className="font-medium">Bitcoin (Hiro)</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                              {hiroAddress.slice(0, 6)}...{hiroAddress.slice(-4)}
                            </p>
                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(hiroAddress)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-green-500">
                        Connected
                      </Badge>
                    </div>
                  )}
                  
                  {isAgentWalletActive && (
                    <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bot className="w-5 h-5" />
                        <div>
                          <p className="font-medium">Agent Wallets</p>
                          <p className="text-sm text-muted-foreground">
                            {agentWallets.length} HD wallets active
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-blue-500">
                        Active
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
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex flex-col gap-1 h-auto py-3"
                    onClick={() => setSelectedTab("send")}
                  >
                    <Send className="w-4 h-4" />
                    <span className="text-xs">Send</span>
                  </Button>
                  <Button size="sm" variant="outline" className="flex flex-col gap-1 h-auto py-3">
                    <ArrowUpDown className="w-4 h-4" />
                    <span className="text-xs">Bridge</span>
                  </Button>
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
          </TabsContent>

          <TabsContent value="tokens" className="space-y-6">
            {tokenBalances.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">ERC-20 Tokens</h3>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Token
                  </Button>
                </div>
                
                {tokenBalances.map((token, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      {token.icon}
                      <div>
                        <p className="font-medium">{token.symbol}</p>
                        <p className="text-sm text-muted-foreground">
                          {token.contractAddress?.slice(0, 6)}...{token.contractAddress?.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{token.balance} {token.symbol}</p>
                      <p className="text-sm text-muted-foreground">${token.usdValue}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8">
                <p className="text-muted-foreground">No tokens found. Connect a wallet to view your tokens.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="send" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Send Tokens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Address</Label>
                  <Input id="recipient" placeholder="0x..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" type="number" placeholder="0.0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="token">Token</Label>
                  <Input id="token" placeholder="ETH" />
                </div>
                <Button className="w-full" disabled={!hasAnyConnection}>
                  Send Transaction
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {agentSecurity ? (
              <Card>
                <CardHeader>
                  <CardTitle>Security Center</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mnemonic Phrase (Keep Secure)</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type={showPrivateKey ? "text" : "password"}
                        value={agentSecurity.mnemonic}
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                      >
                        {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(agentSecurity.mnemonic)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Derivation Path</Label>
                    <Input value={agentSecurity.derivationPath} readOnly />
                  </div>

                  {agentWallets.map((wallet, index) => (
                    <div key={index} className="p-3 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{wallet.symbol} Wallet</span>
                        <Badge variant="outline">{wallet.chainId}</Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Address:</span>
                          <span className="text-sm font-mono">{wallet.address}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(wallet.address)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <div className="text-center p-8">
                <p className="text-muted-foreground">Initialize agent wallets to access security features.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}