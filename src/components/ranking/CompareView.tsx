import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Trophy, X } from "lucide-react";

interface RankingPlayer {
    user_id: string;
    name: string;
    avatar_url: string | null;
    age: number | null;
    position: string | null;
    city: string | null;
    country: string | null;
    best_score: number;
    total_analyses: number;
}

interface CompareViewProps {
    players: RankingPlayer[];
    open: boolean;
    onClose: () => void;
}

export function CompareView({ players, open, onClose }: CompareViewProps) {
    if (players.length < 2) return null;
    const [a, b] = players;

    const fields = [
        { key: "best_score", label: "Best Score", getColor: (v: number) => v >= 90 ? "text-emerald-400" : v >= 80 ? "text-primary" : v >= 70 ? "text-amber-400" : "text-destructive" },
        { key: "total_analyses", label: "Analyses", getColor: () => "text-white" },
        { key: "age", label: "Age", getColor: () => "text-muted-foreground" },
    ];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-card border-white/10">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Trophy className="h-5 w-5 text-primary" />
                        Player Comparison
                    </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-6">
                    {[a, b].map(p => (
                        <div key={p.user_id} className="flex flex-col items-center space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
                            <Avatar className="h-20 w-20 border-2 border-primary/20">
                                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                                    {p.name?.charAt(0) || <User className="h-8 w-8" />}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-center">
                                <h3 className="text-lg font-bold">{p.name}</h3>
                                <p className="text-xs text-muted-foreground">{p.position || "-"} · U{p.age || "?"}</p>
                                <p className="text-xs text-muted-foreground">{p.city}, {p.country}</p>
                            </div>
                            <div className="w-full space-y-3">
                                {fields.map(f => {
                                    const val = (p as any)[f.key] ?? 0;
                                    const otherVal = (p.user_id === a.user_id ? b : a)[f.key] ?? 0;
                                    const isBetter = f.key === "best_score" || f.key === "total_analyses" ? val > otherVal : val > otherVal;
                                    const isWorse = f.key === "best_score" || f.key === "total_analyses" ? val < otherVal : val < otherVal;
                                    return (
                                        <div key={f.key} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-white/5">
                                            <span className="text-xs text-muted-foreground">{f.label}</span>
                                            <div className="flex items-center gap-2">
                                                {isBetter && <span className="text-[10px] text-emerald-400 font-bold">▲</span>}
                                                {isWorse && <span className="text-[10px] text-destructive font-bold">▼</span>}
                                                <span className={`text-lg font-black ${f.getColor(val)}`}>
                                                    {typeof val === "number" ? val.toFixed(1) : val}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="w-full text-center pt-2">
                                {p.position === b.position && (
                                    <span className="text-[10px] text-muted-foreground">Same position</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-center pt-2">
                    <Button variant="outline" onClick={onClose} className="border-white/5">
                        <X className="h-4 w-4 mr-2" /> Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}