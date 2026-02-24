import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Crown, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const PLAYER_PLANS = [
    {
        id: "free",
        name: "Free",
        price: "$0",
        period: "",
        icon: Zap,
        color: "text-muted-foreground",
        features: [
            "5 kick analyses per day",
            "1 match moment per week",
            "2 full match analyses per month",
            "30-day video history",
            "90-day text history",
            "Ads displayed",
        ],
        cta: "Current Plan",
        disabled: true,
    },
    {
        id: "premium",
        name: "Premium",
        price: "$5",
        period: "/mo",
        icon: Sparkles,
        color: "text-primary",
        highlight: true,
        features: [
            "Unlimited kick analyses",
            "5 match moments per week",
            "4 full match analyses per month",
            "90-day video history",
            "180-day text history",
            "No ads",
            "Pro badge visible to scouts",
            "See scout interest count",
            "Export PDF reports",
        ],
        cta: "Subscribe",
        disabled: false,
    },
];

const INDIVIDUAL_PLANS = [
    {
        id: "basic",
        name: "Basic",
        price: "$25",
        period: "/mo",
        icon: Shield,
        color: "text-blue-400",
        features: [
            "View all player profiles",
            "Basic filters (age, position, city)",
            "20 players on watchlist",
            "Compare up to 3 players",
            "10 player match analyses/month",
            "4 team match analyses/month",
            "Basic PDF export",
        ],
        cta: "Subscribe",
        disabled: false,
    },
    {
        id: "pro",
        name: "Pro",
        price: "$75",
        period: "/mo",
        icon: Crown,
        color: "text-amber-400",
        highlight: true,
        features: [
            "Everything in Basic, plus:",
            "Advanced metric filters",
            "Unlimited watchlist",
            "Unlimited player comparisons",
            "50 player match analyses/month",
            "10 team match analyses/month",
            "Talent alerts",
            "Contact players directly",
            "Full PDF + Excel exports",
        ],
        cta: "Subscribe",
        disabled: false,
    },
];

export default function Pricing() {
    const { tier, track, isAdmin } = useSubscription();

    const handleSubscribe = (planId: string) => {
        // TODO: Sprint 2 — Stripe checkout integration
        console.log("Subscribe to:", planId);
        alert(`Stripe checkout for "${planId}" will be integrated in Sprint 2.`);
    };

    return (
        <div className="container px-4 md:px-6 py-12 md:py-20 max-w-6xl mx-auto space-y-12">
            {/* Header */}
            <div className="text-center space-y-3">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gradient">
                    Choose Your Plan
                </h1>
                <p className="text-muted-foreground max-w-xl mx-auto">
                    Unlock your full potential with the right plan for your goals.
                </p>
            </div>

            {/* Player Plans */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Player Plans</h2>
                        <p className="text-sm text-muted-foreground">For players who want to improve their technique</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {PLAYER_PLANS.map((plan) => {
                        const Icon = plan.icon;
                        const isCurrent = track === "player" && tier === plan.id;

                        return (
                            <Card
                                key={plan.id}
                                className={cn(
                                    "relative bg-card border-white/5 shadow-xl transition-all duration-300 hover:border-white/15",
                                    plan.highlight && "border-primary/30 ring-1 ring-primary/20"
                                )}
                            >
                                {plan.highlight && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-primary text-black font-bold px-3">Most Popular</Badge>
                                    </div>
                                )}
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                                                <Icon className={cn("h-5 w-5", plan.color)} />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{plan.name}</CardTitle>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-3xl font-black">{plan.price}</span>
                                            <span className="text-muted-foreground text-sm">{plan.period}</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-4">
                                    <ul className="space-y-2.5">
                                        {plan.features.map((f) => (
                                            <li key={f} className="flex items-start gap-2 text-sm">
                                                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <span className="text-muted-foreground">{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    {isCurrent || isAdmin ? (
                                        <Button disabled className="w-full" variant="outline">
                                            {isAdmin ? "Admin Access" : "Current Plan"}
                                        </Button>
                                    ) : (
                                        <Button
                                            className={cn(
                                                "w-full font-bold",
                                                plan.highlight
                                                    ? "bg-primary text-black hover:bg-primary/90"
                                                    : "bg-white/10 hover:bg-white/20"
                                            )}
                                            disabled={plan.disabled}
                                            onClick={() => handleSubscribe(plan.id)}
                                        >
                                            {plan.cta}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {/* Individual Plans */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Coach & Scout Plans</h2>
                        <p className="text-sm text-muted-foreground">For professionals who manage or discover talent</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {INDIVIDUAL_PLANS.map((plan) => {
                        const Icon = plan.icon;
                        const isCurrent = track === "individual" && tier === plan.id;

                        return (
                            <Card
                                key={plan.id}
                                className={cn(
                                    "relative bg-card border-white/5 shadow-xl transition-all duration-300 hover:border-white/15",
                                    plan.highlight && "border-amber-400/30 ring-1 ring-amber-400/20"
                                )}
                            >
                                {plan.highlight && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-amber-400 text-black font-bold px-3">Best Value</Badge>
                                    </div>
                                )}
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                                                <Icon className={cn("h-5 w-5", plan.color)} />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{plan.name}</CardTitle>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-3xl font-black">{plan.price}</span>
                                            <span className="text-muted-foreground text-sm">{plan.period}</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-4">
                                    <ul className="space-y-2.5">
                                        {plan.features.map((f) => (
                                            <li key={f} className="flex items-start gap-2 text-sm">
                                                <Check className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                                                <span className="text-muted-foreground">{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    {isCurrent || isAdmin ? (
                                        <Button disabled className="w-full" variant="outline">
                                            {isAdmin ? "Admin Access" : "Current Plan"}
                                        </Button>
                                    ) : (
                                        <Button
                                            className={cn(
                                                "w-full font-bold",
                                                plan.highlight
                                                    ? "bg-amber-400 text-black hover:bg-amber-400/90"
                                                    : "bg-white/10 hover:bg-white/20"
                                            )}
                                            disabled={plan.disabled}
                                            onClick={() => handleSubscribe(plan.id)}
                                        >
                                            {plan.cta}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
