import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Download, Copy, QrCode, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SendReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletType: 'metamask' | 'hiro' | 'agent';
  address: string;
  balance: string;
  symbol: string;
  onSend?: (to: string, amount: string) => Promise<void>;
  onReceive?: () => void;
}

export function SendReceiveModal({ 
  isOpen, 
  onClose, 
  walletType,
  address,
  balance,
  symbol,
  onSend,
  onReceive
}: SendReceiveModalProps) {
  const [sendAddress, setSendAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!sendAddress || !sendAmount || !onSend) return;

    if (parseFloat(sendAmount) > parseFloat(balance)) {
      toast({
        title: "Insufficient Balance",
        description: "Amount exceeds available balance",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await onSend(sendAddress, sendAmount);
      setSendAddress("");
      setSendAmount("");
      onClose();
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: "Unable to send transaction",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const generateQRCode = () => {
    // In a real app, you'd generate a QR code
    toast({
      title: "QR Code",
      description: "QR code feature would be implemented here",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Send & Receive {symbol}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="send" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="send">Send</TabsTrigger>
            <TabsTrigger value="receive">Receive</TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-4">
            <div>
              <Label>Balance</Label>
              <p className="text-sm text-muted-foreground mt-1">{balance} {symbol}</p>
            </div>
            
            <div className="space-y-2">
              <Label>To Address</Label>
              <Input
                placeholder={`Enter ${symbol} address`}
                value={sendAddress}
                onChange={(e) => setSendAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                />
                <Button 
                  variant="outline" 
                  onClick={() => setSendAmount(balance)}
                  size="sm"
                >
                  Max
                </Button>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={handleSend}
              disabled={!sendAddress || !sendAmount || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send {symbol}
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="receive" className="space-y-4">
            <div>
              <Label>Your {symbol} Address</Label>
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-sm font-mono break-all">{address}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={copyAddress} className="flex-1">
                <Copy className="w-4 h-4 mr-2" />
                Copy Address
              </Button>
              <Button variant="outline" onClick={generateQRCode} className="flex-1">
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </Button>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Share this address to receive {symbol} payments. Only send {symbol} to this address.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}