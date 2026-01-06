import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Target, Zap, Shield, Heart, Globe, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <Target className="h-5 w-5" />,
      title: "AI Analysis",
      description: "Machine learning algorithms analyze performance metrics.",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Community",
      description: "Collaborate with players and coaches globally.",
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Objective",
      description: "Unbiased evaluation based purely on data.",
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Direct Feedback",
      description: "Real-time training recommendations.",
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        <div className="container mx-auto max-w-5xl text-center">
          <Badge variant="outline" className={`mb-8 px-4 py-1.5 rounded-full text-base font-normal tracking-wide animate-fade-in opacity-0`}>
            The Future of Scouting
          </Badge>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
            <span className="block animate-fade-in opacity-0" style={{ animationDelay: '0.1s' }}>Discover Talent.</span>
            <span className="block text-muted-foreground animate-fade-in opacity-0" style={{ animationDelay: '0.3s' }}>Unlock Potential.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-in opacity-0" style={{ animationDelay: '0.5s' }}>
            We use advanced AI to evaluate football talent objectively, breaking geographic barriers and creating equal opportunities for all.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in opacity-0" style={{ animationDelay: '0.7s' }}>
            <Button size="lg" className="rounded-full px-8 h-12 text-base" asChild>
              <Link to="/register">Start Your Journey <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-base" asChild>
              <Link to="/coach-dashboard">For Coaches</Link>
            </Button>
          </div>
        </div>

        {/* Abstract Background Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none" />
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-background rounded-2xl border border-border/50 hover:border-primary/20 transition-all duration-500 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-6 text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-500">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-32 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 tracking-tight">Our Mission</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-foreground">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg">Global Reach</h3>
              <p className="text-muted-foreground">Connecting players from every corner of the world.</p>
            </div>
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-foreground">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg">Fair Play</h3>
              <p className="text-muted-foreground">Removing bias through data-driven evaluation.</p>
            </div>
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-foreground">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg">Equal Access</h3>
              <p className="text-muted-foreground">Opportunity for talent, regardless of background.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">Ready to prove your potential?</h2>
          <p className="text-primary-foreground/80 text-xl mb-12 max-w-2xl mx-auto">
            Join the platform that is revolutionizing how football talent is discovered.
          </p>
          <Button size="lg" variant="secondary" className="rounded-full px-10 h-14 text-lg font-medium" asChild>
            <Link to="/register">Get Started Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
