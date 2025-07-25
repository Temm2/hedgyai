import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { AboutSection } from "@/components/AboutSection";
import { InvestSection } from "@/components/InvestSection";
import { MonitorSection } from "@/components/MonitorSection";
import { DashboardSection } from "@/components/DashboardSection";

const Index = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [currentSection, setCurrentSection] = useState("about");

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
        return <InvestSection />;
      case "monitor":
        return <MonitorSection />;
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
