import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, TrendingUp, Zap, Users, Globe, Lock } from "lucide-react";

export function AboutSection() {
  const features = [
    {
      icon: TrendingUp,
      title: "Autonomous Trading",
      description: "AI-powered portfolio management that never sleeps, monitoring markets 24/7"
    },
    {
      icon: Shield,
      title: "MEV Protection",
      description: "Advanced execution protocols protect your trades from MEV attacks"
    },
    {
      icon: Globe,
      title: "Cross-Chain",
      description: "Deploy capital across Ethereum, Cosmos, Aptos, Bitcoin, and more"
    },
    {
      icon: Lock,
      title: "Full Custody",
      description: "You maintain complete control and custody of your assets"
    },
    {
      icon: Zap,
      title: "Institutional Grade",
      description: "Professional execution with smart order routing and optimization"
    },
    {
      icon: Users,
      title: "Accessible to All",
      description: "Start investing from just $10 - no minimums, no barriers"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Intelligent Portfolio
              </span>
              <br />
              <span className="text-foreground">Management for Everyone</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              HedgyAI is an autonomous portfolio manager that functions like an institutional-grade 
              hedge fund, designed specifically for retail investors. Powered by AI, cross-chain 
              infrastructure, and MEV-resistant execution.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="default" size="xl" className="hover:shadow-glow">
                Get Started Today
              </Button>
              <Button variant="glass" size="xl">
                View Strategies
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Makes HedgyAI <span className="bg-gradient-primary bg-clip-text text-transparent">Unique</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional-grade portfolio management that adapts to market conditions in real-time
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="bg-gradient-card backdrop-blur-glass border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-card group"
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20 text-primary group-hover:bg-primary/30 transition-colors duration-300">
                      <feature.icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="bg-gradient-card backdrop-blur-glass border-primary/20">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">$10</div>
                <div className="text-muted-foreground">Minimum Investment</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <div className="text-muted-foreground">Market Monitoring</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">8+</div>
                <div className="text-muted-foreground">Supported Chains</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">100%</div>
                <div className="text-muted-foreground">User Custody</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}