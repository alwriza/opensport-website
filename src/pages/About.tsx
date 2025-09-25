import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, Globe, Target, Users, Zap } from "lucide-react";

export default function About() {
  const impacts = [
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Equal Access for All",
      description: "Providing opportunities for talented young players from low-income families who might otherwise be overlooked.",
      stats: "500+ underprivileged players evaluated"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Transparent & Objective",
      description: "Our AI eliminates human bias and corruption, ensuring fair evaluation based purely on performance data.",
      stats: "95% accuracy in skill assessment"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Global Talent Discovery",
      description: "Connecting talented players from around the world with scouts and academies, breaking geographical barriers.",
      stats: "Active in 25+ countries"
    }
  ];

  const features = [
    {
      icon: <Target className="h-6 w-6" />,
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms analyze player performance across multiple dimensions including speed, stamina, ball control, tactical vision, and teamwork.",
      badge: "Core Technology"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Community-Driven Platform",
      description: "Built for players, coaches, and academies to collaborate and grow together in a supportive ecosystem.",
      badge: "Collaboration"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Instant Feedback & Tips",
      description: "Personalized training recommendations generated in real-time based on individual performance analysis.",
      badge: "Performance"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-card">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Democratizing Football Talent Discovery
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            AI Scout is revolutionizing how football talent is discovered and developed, 
            creating equal opportunities for all players regardless of their background or location.
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="mb-16 shadow-card bg-gradient-hero">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold text-primary-foreground mb-6">Our Mission</h2>
            <p className="text-xl text-primary-foreground/90 max-w-4xl mx-auto leading-relaxed">
              To create a world where every talented young footballer has an equal opportunity to be discovered, 
              evaluated, and developed, regardless of their economic background, geographic location, or social connections.
            </p>
          </CardContent>
        </Card>

        {/* Community Impact */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">Community Impact</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {impacts.map((impact, index) => (
              <Card key={index} className="shadow-card hover:shadow-lg transition-shadow">
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
                    <div className="text-primary">{impact.icon}</div>
                  </div>
                  <CardTitle className="text-xl mb-2">{impact.title}</CardTitle>
                  <Badge variant="secondary" className="mx-auto">{impact.stats}</Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-base">
                    {impact.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">How AI Scout Works</h2>
          <div className="space-y-8">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-card">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 flex-shrink-0">
                      <div className="text-primary">{feature.icon}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                        <Badge variant="outline">{feature.badge}</Badge>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* The Problem We're Solving */}
        <Card className="mb-16 shadow-card border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">The Problem We're Solving</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Traditional Scouting Challenges:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Subjective evaluation prone to bias</li>
                  <li>• Limited geographical reach</li>
                  <li>• Expensive and time-consuming</li>
                  <li>• Inconsistent evaluation criteria</li>
                  <li>• Corruption and favoritism</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Our AI-Powered Solution:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Objective, data-driven analysis</li>
                  <li>• Global accessibility via web platform</li>
                  <li>• Cost-effective and scalable</li>
                  <li>• Standardized evaluation metrics</li>
                  <li>• Transparent scoring system</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Long-term Vision */}
        <Card className="shadow-card bg-gradient-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Long-term Vision</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We envision a future where national teams and professional clubs discover their next superstars 
              through AI Scout, creating a truly meritocratic system in football.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="p-6 rounded-lg bg-primary/5">
                <h4 className="font-semibold text-primary mb-2">2025 Goal</h4>
                <p className="text-sm text-muted-foreground">10,000+ players evaluated across 50 countries</p>
              </div>
              <div className="p-6 rounded-lg bg-primary/5">
                <h4 className="font-semibold text-primary mb-2">2026 Goal</h4>
                <p className="text-sm text-muted-foreground">Partnership with FIFA and UEFA for talent identification</p>
              </div>
              <div className="p-6 rounded-lg bg-primary/5">
                <h4 className="font-semibold text-primary mb-2">2027 Goal</h4>
                <p className="text-sm text-muted-foreground">First AI Scout discovery to play in a World Cup</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}