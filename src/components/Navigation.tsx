import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, Sun, Moon, Menu, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MultiChainWallet } from "./MultiChainWallet";

interface NavigationProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  currentSection: string;
  setCurrentSection: (section: string) => void;
}

export function Navigation({ darkMode, toggleDarkMode, currentSection, setCurrentSection }: NavigationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const { toast } = useToast();

  const sections = [
    { id: "about", label: "About" },
    { id: "invest", label: "Invest" },
    { id: "monitor", label: "Agent Monitor" },
    { id: "dashboard", label: "Submit Signal" }
  ];

  const handleWalletConnect = () => {
    if (!isConnected) {
      setIsWalletModalOpen(true);
    } else {
      setIsConnected(false);
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
        duration: 3000,
      });
    }
  };

  const handleWalletConnected = () => {
    setIsConnected(true);
    setIsWalletModalOpen(false);
  };

  const handleWalletDisconnected = () => {
    setIsConnected(false);
  };

  return (
    <nav className="relative z-50 w-full bg-background/80 backdrop-blur-glass border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                HedgyAI
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(section.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    currentSection === section.id
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="text-muted-foreground hover:text-foreground"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            <Button
              variant={isConnected ? "glass" : "connect"}
              size="default"
              onClick={handleWalletConnect}
              className="flex items-center gap-2"
            >
              <Wallet className="h-4 w-4" />
              {isConnected ? "0x1234...5678" : "Connect Wallet"}
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-card/50 backdrop-blur-glass rounded-lg mt-2 border border-border">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setCurrentSection(section.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-all duration-300 ${
                    currentSection === section.id
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {section.label}
                </button>
              ))}
              
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDarkMode}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {darkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  {darkMode ? "Light" : "Dark"}
                </Button>
                
                <Button
                  variant={isConnected ? "glass" : "connect"}
                  size="sm"
                  onClick={handleWalletConnect}
                  className="flex items-center gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  {isConnected ? "Connected" : "Connect"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <MultiChainWallet
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnect={handleWalletConnected}
        onDisconnect={handleWalletDisconnected}
      />
    </nav>
  );
}