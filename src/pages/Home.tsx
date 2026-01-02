import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Target, Zap, Shield, Heart, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import heroImage from "@/assets/hero-stadium.jpg";

export default function Home() {
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});

  const heroPhrases = [
    "Discover Hidden Talent",
    "Break Geographic Barriers",
    "Eliminate Bias & Corruption",
    "Democratize Football",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % heroPhrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[id^="animate-"]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

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
      icon: <Shield className="h-6 w-6" />,
      title: "Transparent & Objective",
      description: "Our AI eliminates human bias and corruption, ensuring fair evaluation based purely on performance data.",
      badge: "Trust & Fairness"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Instant Feedback",
      description: "Personalized training recommendations generated in real-time based on individual performance analysis.",
      badge: "Performance"
    }
  ];

  const impacts = [
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Equal Access for All",
      description: "Providing opportunities for talented young players from low-income families who might otherwise be overlooked.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "95% Accuracy",
      description: "Our AI delivers objective, data-driven analysis with industry-leading precision in skill assessment.",
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Global Reach",
      description: "Connecting talented players from around the world with scouts and academies, breaking geographical barriers.",
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">{/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black"></div>
        </div>
        
        <div className="absolute inset-0 grid-pattern opacity-30"></div>
        
        <div className="relative z-10 text-center max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-center mb-8 animate-float">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 backdrop-blur-sm animate-glow">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
          </div>
          
          <h1 className="hero-title text-7xl md:text-9xl font-bold mb-6 leading-tight gradient-text">
            AI SCOUT
          </h1>
          
          <div className="h-20 mb-8 flex items-center justify-center">
            <p className="text-2xl md:text-4xl font-light text-primary phrase-animation" key={currentPhrase}>
              {heroPhrases[currentPhrase]}
            </p>
          </div>
          
          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Revolutionizing football talent discovery with AI-powered player evaluation.
            Creating equal opportunities for all players, regardless of background or location.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button 
              size="lg" 
              asChild 
              className="bg-primary hover:bg-primary-dark text-primary-foreground font-semibold text-lg px-8 py-6 rounded-full shadow-hero transition-all duration-300 transform hover:scale-105"
            >
              <Link to="/register">Start Your Journey</Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-2 border-primary text-primary hover:bg-primary/10 font-semibold text-lg px-8 py-6 rounded-full backdrop-blur-sm"
            >
              <Link to="/coach-dashboard">Coach Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-32 bg-gradient-card relative">
        <div className="container mx-auto px-4 relative">
          <div 
            id="animate-mission"
            className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${
              isVisible['animate-mission'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
            }`}
          >
            <h2 className="hero-title text-5xl md:text-6xl font-bold mb-8 gradient-text">
              OUR MISSION
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed font-light">
              To create a world where every talented young footballer has an equal opportunity to be discovered, 
              evaluated, and developed, regardless of their economic background, geographic location, or social connections.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-black/50">
        <div className="container mx-auto px-4">
          <div 
            id="animate-features-header"
            className={`text-center mb-16 transition-all duration-1000 ${
              isVisible['animate-features-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
            }`}
          >
            <h2 className="hero-title text-5xl md:text-6xl font-bold mb-6 gradient-text">
              HOW IT WORKS
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Experience the future of football scouting with our comprehensive AI evaluation system
            </p>
          </div>

          <div 
            id="animate-features"
            className={`grid md:grid-cols-2 gap-8 transition-all duration-1000 delay-200 ${
              isVisible['animate-features'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
            }`}
          >
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card/50 border-2 border-primary/20 rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 backdrop-blur-sm"
              >
                <div className="flex items-start gap-6">
                  <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/20 flex-shrink-0">
                    <div className="text-primary">{feature.icon}</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
                      <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10">
                        {feature.badge}
                      </Badge>
                    </div>
                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Impact */}
      <section className="py-24 bg-gradient-card relative">
        <div className="container mx-auto px-4">
          <div 
            id="animate-impact-header"
            className={`text-center mb-16 transition-all duration-1000 ${
              isVisible['animate-impact-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
            }`}
          >
            <h2 className="hero-title text-5xl md:text-6xl font-bold mb-6 gradient-text">
              COMMUNITY IMPACT
            </h2>
          </div>
          
          <div 
            id="animate-impact"
            className={`grid md:grid-cols-3 gap-8 transition-all duration-1000 delay-200 ${
              isVisible['animate-impact'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
            }`}
          >
            {impacts.map((impact, index) => (
              <div
                key={index}
                className="bg-card/50 border-2 border-primary/20 rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 text-center backdrop-blur-sm"
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mx-auto mb-6">
                  <div className="text-primary">{impact.icon}</div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{impact.title}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {impact.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem We're Solving */}
      <section className="py-24 bg-black/50">
        <div className="container mx-auto px-4">
          <div 
            id="animate-problem"
            className={`bg-card/50 border-2 border-primary/20 rounded-3xl p-12 max-w-6xl mx-auto shadow-card backdrop-blur-sm transition-all duration-1000 ${
              isVisible['animate-problem'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
            }`}
          >
            <h2 className="hero-title text-4xl md:text-5xl font-bold mb-12 text-center gradient-text">
              THE PROBLEM WE'RE SOLVING
            </h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h4 className="text-2xl font-bold text-red-400 mb-6 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                  Traditional Scouting
                </h4>
                <ul className="space-y-4 text-gray-400">
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">✕</span>
                    <span>Subjective evaluation prone to bias</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">✕</span>
                    <span>Limited geographical reach</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">✕</span>
                    <span>Expensive and time-consuming</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">✕</span>
                    <span>Inconsistent evaluation criteria</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">✕</span>
                    <span>Corruption and favoritism</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  AI-Powered Solution
                </h4>
                <ul className="space-y-4 text-gray-400">
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">✓</span>
                    <span>Objective, data-driven analysis</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">✓</span>
                    <span>Global accessibility via web platform</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">✓</span>
                    <span>Cost-effective and scalable</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">✓</span>
                    <span>Standardized evaluation metrics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">✓</span>
                    <span>Transparent scoring system</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-32 bg-gradient-card relative">
        <div className="container mx-auto px-4">
          <div 
            id="animate-vision"
            className={`max-w-5xl mx-auto transition-all duration-1000 ${
              isVisible['animate-vision'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
            }`}
          >
            <div className="text-center mb-16">
              <h2 className="hero-title text-5xl md:text-6xl font-bold mb-8 gradient-text">
                LONG-TERM VISION
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                We envision a future where national teams and professional clubs discover their next superstars 
                through AI Scout, creating a truly meritocratic system in football.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="bg-card/50 border-2 border-primary/20 rounded-2xl p-8 text-center shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 backdrop-blur-sm">
                <div className="hero-title text-primary font-bold text-3xl mb-3">2025</div>
                <p className="text-gray-300 font-semibold mb-2">Breaking Boundaries</p>
                <p className="text-sm text-gray-500">10,000+ players evaluated across 50 countries</p>
              </div>
              <div className="bg-card/50 border-2 border-primary/20 rounded-2xl p-8 text-center shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 backdrop-blur-sm">
                <div className="hero-title text-primary font-bold text-3xl mb-3">2026</div>
                <p className="text-gray-300 font-semibold mb-2">Global Recognition</p>
                <p className="text-sm text-gray-500">Partnership with FIFA and UEFA for talent identification</p>
              </div>
              <div className="bg-card/50 border-2 border-primary/20 rounded-2xl p-8 text-center shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 backdrop-blur-sm">
                <div className="hero-title text-primary font-bold text-3xl mb-3">2027</div>
                <p className="text-gray-300 font-semibold mb-2">World Stage</p>
                <p className="text-sm text-gray-500">First AI Scout discovery to play in a World Cup</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-black to-cyber-blue/20"></div>
        <div className="absolute inset-0 grid-pattern opacity-20"></div>
        <div className="container mx-auto px-4 text-center relative">
          <div 
            id="animate-cta"
            className={`max-w-4xl mx-auto transition-all duration-1000 ${
              isVisible['animate-cta'] ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <h2 className="hero-title text-5xl md:text-7xl font-bold mb-8 gradient-text">
              READY TO DISCOVER YOUR POTENTIAL?
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
              Join thousands of players and coaches who trust AI Scout for objective, data-driven football evaluation.
            </p>
            <Button 
              size="lg" 
              asChild 
              className="bg-primary hover:bg-primary-dark text-primary-foreground font-bold text-xl px-12 py-8 rounded-full shadow-premium hover:shadow-glow transition-all duration-300 transform hover:scale-105"
            >
              <Link to="/register">Get Started Today</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}