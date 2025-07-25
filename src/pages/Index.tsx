import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { AboutSection } from "@/components/AboutSection";
import { InvestSection } from "@/components/InvestSection";
import { MonitorSection } from "@/components/MonitorSection";
import { DashboardSection } from "@/components/DashboardSection";

interface Investment {
  id: string;
  amount: string;
  chain: string;
  tokenType: string;
  withdrawChain: string;
  withdrawCurrency: string;
  lockPeriod: string;
  strategy: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  guaranteedReturn: string;
  minReturn: string;
  gasFee: string;
  timestamp: Date;
  status: 'pending' | 'active' | 'completed' | 'closed';
  elizaId?: string;
  endTimestamp?: Date;
  finalPnl?: string;
}

const Index = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [currentSection, setCurrentSection] = useState("about");
  const [investments, setInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    // Apply theme class to document
    if (darkMode) {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark"); 
      document.documentElement.classList.add("light");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const renderCurrentSection = () => {
    switch (currentSection) {
      case "about":
        return <AboutSection />;
      case "invest":
        return <InvestSection investments={investments} setInvestments={setInvestments} />;
      case "monitor":
        return <MonitorSection investments={investments} />;
      case "dashboard":
        return <DashboardSection />;
      default:
        return <AboutSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
      />
      {renderCurrentSection()}
    </div>
  );
};

export default Index;
