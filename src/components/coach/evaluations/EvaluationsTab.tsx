import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePlayerEvaluations, useCoachSquad, useUpsertEvaluation } from "@/hooks/useCoachData";
import type { PlayerEvaluation } from "@/types/coach";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, ClipboardCheck, Loader2 } from "lucide-react";

const CATEGORY_GROUPS: { label: string; key: keyof PlayerEvaluation["categories"]; fields: string[] }[] = [
    { label: "Technical", key: "technical", fields: ["first_touch","ball_control","short_passing","long_passing","shooting","finishing","dribbling","crossing","heading","one_vs_one"] },
    { label: "Tactical", key: "tactical", fields: ["positioning","decision_making","game_awareness","off_ball_movement","defensive_awareness"] },
    { label: "Physical", key: "physical", fields: ["speed","acceleration","agility","balance","strength","stamina"] },
    { label: "Mental", key: "mental", fields: ["concentration","confidence","discipline","work_rate","teamwork"] },
];

const FIELD_LABELS: Record<string, string> = {
    first_touch: "First Touch", ball_control: "Ball Control", short_passing: "Short Passing",
    long_passing: "Long Passing", shooting: "Shooting", finishing: "Finishing",
    dribbling: "Dribbling", crossing: "Crossing", heading: "Heading", one_vs_one: "1v1",
    positioning: "Positioning", decision_making: "Decision Making", game_awareness: "Game Awareness",
    off_ball_movement: "Off-ball Movement", defensive_awareness: "Defensive Awareness",
    speed: "Speed", acceleration: "Acceleration", agility: "Agility", balance: "Balance",
    strength: "Strength", stamina: "Stamina",
    concentration: "Concentration", confidence: "Confidence", discipline: "Discipline",
    work_rate: "Work Rate", teamwork: "Teamwork",
};

const DEFAULT_SCORES: Record<string, number> = {};
CATEGORY_GROUPS.forEach(g => g.fields.forEach(f => { DEFAULT_SCORES[f] = 5; }));

export function EvaluationsTab({ teamId }: { teamId?: string }) {
    const { t } = useTranslation("dashboard");
    const [selectedEval, setSelectedEval] = useState<PlayerEvaluation | null>(null);
    const [showNew, setShowNew] = useState(false);

    const { data: evaluations = [] } = usePlayerEvaluations(undefined, teamId);
    const { data: squad = [] } = useCoachSquad(teamId);
    const upsertEval = useUpsertEvaluation();

    const [newEvalPlayer, setNewEvalPlayer] = useState("");
    const [newEvalScores, setNewEvalScores] = useState<Record<string, number>>({ ...DEFAULT_SCORES });
    const [newEvalNotes, setNewEvalNotes] = useState("");

    const handleSaveEvaluation = async () => {
        if (!newEvalPlayer || !teamId) return;
        const categories: any = {};
        CATEGORY_GROUPS.forEach(g => {
            categories[g.key] = {};
            g.fields.forEach(f => { categories[g.key][f] = newEvalScores[f]; });
        });
        await upsertEval.mutateAsync({
            player_id: newEvalPlayer, team_id: teamId, categories, notes: newEvalNotes,
        });
        setShowNew(false);
        setNewEvalPlayer("");
        setNewEvalScores({ ...DEFAULT_SCORES });
        setNewEvalNotes("");
    };

    const avgRating = (evalData: PlayerEvaluation) => {
        const all = CATEGORY_GROUPS.flatMap(g => g.fields.map(f => (evalData.categories[g.key] as any)[f] ?? 0));
        return (all.reduce((a, b) => a + b, 0) / all.length).toFixed(1);
    };

    const getScoreColor = (v: number) => {
        if (v >= 8) return "text-primary";
        if (v >= 6) return "text-amber-400";
        return "text-destructive";
    };

    const getAILabel = (field: string) => {
        const aiMap: Record<string, string> = {
            stability: "STB", power: "PWR", technique: "TCH", balance: "BAL",
        };
        return aiMap[field] || null;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">{t("coach.evaluations.title")}</h2>
                <Button className="bg-primary text-black hover:bg-primary/90 gap-2" onClick={() => setShowNew(true)}>
                    <Plus className="h-4 w-4" /> {t("coach.evaluations.newEval")}
                </Button>
            </div>

            {/* Evaluation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {evaluations.map(evalData => (
                    <Card key={evalData.id} className="bg-card border-white/5 shadow-xl shadow-black/20 cursor-pointer hover:border-primary/30 transition-all" onClick={() => setSelectedEval(evalData)}>
                        <CardContent className="p-5">
                            <div className="flex items-center gap-4 mb-4">
                                <Avatar className="h-10 w-10 border border-white/10">
<AvatarFallback className="bg-primary/20 text-primary">{((evalData as any).player?.name ?? "?").charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-bold text-white">{(evalData as any).player?.name ?? "Player"}</p>
                                    <p className="text-xs text-muted-foreground">{evalData.date}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-2xl font-black ${getScoreColor(parseFloat(avgRating(evalData)))}`}>{avgRating(evalData)}</p>
                                </div>
                            </div>
                            {evalData.notes && (
                                <p className="text-sm text-muted-foreground italic line-clamp-2">"{evalData.notes}"</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Evaluation Detail Dialog */}
            <Dialog open={!!selectedEval} onOpenChange={() => setSelectedEval(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] bg-card border-white/10">
                    {selectedEval && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-3 text-xl">
                                    <ClipboardCheck className="h-6 w-6 text-primary" />
                                    {(evalData as any).player?.name ?? "Player"}
                                    <Badge variant="outline" className="border-white/10 ml-2">{selectedEval.date}</Badge>
                                </DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="max-h-[70vh] pr-4">
                                <div className="space-y-6">
<div className="grid grid-cols-4 gap-3">
                                        {Object.entries((selectedEval as any).ai_scores ?? {}).map(([key, val]) => (
                                            <div key={key} className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                                                <p className="text-[10px] uppercase text-muted-foreground font-bold">{key}</p>
                                                <p className="text-lg font-black text-primary">{val}</p>
                                                <p className="text-[9px] text-muted-foreground">AI Score</p>
                                            </div>
                                        ))}
                                    </div>

                                    {CATEGORY_GROUPS.map(group => (
                                        <div key={group.key}>
                                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">{group.label}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {group.fields.map(field => {
                                                    const coachVal = (selectedEval.categories[group.key] as any)[field] ?? 0;
                                                    const aiKey = getAILabel(field);
                                                    const aiVal = aiKey ? selectedEval.ai_scores[aiKey] : null;
                                                    return (
                                                        <div key={field} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                                            <span className="text-xs font-medium text-muted-foreground">{FIELD_LABELS[field] || field}</span>
                                                            <div className="flex items-center gap-3">
                                                                {aiVal !== null && (
                                                                    <span className="text-[10px] text-purple-400 font-bold bg-purple-400/10 px-1.5 py-0.5 rounded">
                                                                        AI {aiVal}
                                                                    </span>
                                                                )}
                                                                <span className={`text-lg font-black ${getScoreColor(coachVal)}`}>
                                                                    {coachVal}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}

                                    {selectedEval.notes && (
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                            <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Notes</p>
                                            <p className="text-sm text-white italic">"{selectedEval.notes}"</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* New Evaluation Dialog */}
            <Dialog open={showNew} onOpenChange={setShowNew}>
                <DialogContent className="max-w-3xl max-h-[90vh] bg-card border-white/10">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ClipboardCheck className="h-5 w-5 text-primary" />
                            {t("coach.evaluations.newEval")}
                        </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] pr-4">
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">{t("coach.squad.player")}</label>
                                <select
                                    value={newEvalPlayer}
                                    onChange={e => setNewEvalPlayer(e.target.value)}
                                    className="w-full p-2 rounded-lg bg-background/50 border border-white/5 text-white text-sm"
                                >
{squad.length > 0 && squad.map(p => (
                                        <option key={p.player_id} value={p.player_id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            {CATEGORY_GROUPS.map(group => (
                                <div key={group.key}>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">{group.label}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {group.fields.map(field => (
                                            <div key={field} className="space-y-2">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-muted-foreground">{FIELD_LABELS[field] || field}</span>
                                                    <span className="font-bold text-white">{newEvalScores[field]}</span>
                                                </div>
                                                <Slider value={[newEvalScores[field]]} onValueChange={([v]) => setNewEvalScores(prev => ({ ...prev, [field]: v }))} max={10} step={1} className="[&_[role=slider]]:bg-primary" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">{t("coach.evaluations.notes")}</label>
                                <Textarea placeholder="Coach notes..." value={newEvalNotes} onChange={e => setNewEvalNotes(e.target.value)} className="bg-background/50 border-white/5 min-h-[100px]" />
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setShowNew(false)} className="border-white/5">{t("coach.matches.cancel")}</Button>
                                <Button className="bg-primary text-black hover:bg-primary/90" onClick={handleSaveEvaluation} disabled={upsertEval.isPending || !newEvalPlayer}>
                                {upsertEval.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {t("coach.evaluations.save")}
                            </Button>
                            </div>
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
