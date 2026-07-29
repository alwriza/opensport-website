import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTrainingSessions, useTrainingPlans, useExercises, useCoachSquad, useCreateTrainingSession } from "@/hooks/useCoachData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Plus, GripVertical, Clock, MapPin, Target, Users, Dumbbell, FileText, Loader2 } from "lucide-react";

export function TrainingTab({ teamId }: { teamId?: string }) {
    const { t } = useTranslation("dashboard");
    const [showCreateSession, setShowCreateSession] = useState(false);
    const [sessionExercises, setSessionExercises] = useState<{ exId: string; name: string; minutes: number }[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("all");

    const { data: trainingSessions = [] } = useTrainingSessions(teamId);
    const { data: trainingPlans = [] } = useTrainingPlans(teamId);
    const { data: exercises = [] } = useExercises();
    const { data: squad = [] } = useCoachSquad(teamId);

    const exerciseCategories = ["all", "passing", "defensive", "shooting", "dribbling", "tactical", "physical", "technical"];

    const filteredExercises = selectedCategory === "all"
        ? exercises
        : exercises.filter(e => e.category === selectedCategory);

    const statusColor = (status: string) => {
        switch (status) {
            case "completed": return "bg-emerald-400/20 text-emerald-400";
            case "scheduled": return "bg-primary/20 text-primary";
            default: return "bg-white/10 text-muted-foreground";
        }
    };

    return (
        <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="bg-card/50 border border-white/5 p-1 gap-1 mb-6">
                <TabsTrigger value="calendar" className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> {t("coach.training.calendar")}</TabsTrigger>
                <TabsTrigger value="sessions" className="flex items-center gap-2"><Clock className="h-4 w-4" /> {t("coach.training.sessions")}</TabsTrigger>
                <TabsTrigger value="plans" className="flex items-center gap-2"><FileText className="h-4 w-4" /> {t("coach.training.plans")}</TabsTrigger>
                <TabsTrigger value="exercises" className="flex items-center gap-2"><Dumbbell className="h-4 w-4" /> {t("coach.training.exercises")}</TabsTrigger>
            </TabsList>

            {/* Calendar */}
            <TabsContent value="calendar">
                <Card className="bg-card border-white/5 shadow-xl shadow-black/20">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            {t("coach.training.calendar")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                                <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground py-2">{d}</div>
                            ))}
                            {Array.from({ length: 35 }, (_, i) => {
                                const day = i - 3;
const sessions = trainingSessions.filter(s => {
                                    const d = new Date(s.date);
                                    return d.getDate() === day && d.getMonth() === 6;
                                });
                                return (
                                    <div key={i} className={`min-h-[80px] p-1 rounded-lg border border-white/5 ${day >= 1 && day <= 31 ? "bg-white/[0.02]" : "opacity-30"}`}>
                                        {day >= 1 && day <= 31 && (
                                            <>
                                                <span className="text-[10px] font-medium text-muted-foreground">{day}</span>
                                                {sessions.map(s => (
                                                    <div key={s.id} className="mt-1 p-1 rounded bg-primary/20 text-[8px] text-primary font-bold leading-tight truncate">
                                                        {s.name}
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Sessions */}
            <TabsContent value="sessions">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">{t("coach.training.sessions")}</h3>
                    <Button className="bg-primary text-black hover:bg-primary/90 gap-2" onClick={() => setShowCreateSession(true)}>
                        <Plus className="h-4 w-4" /> {t("coach.training.newSession")}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trainingSessions.map(session => (
                        <Card key={session.id} className="bg-card border-white/5 shadow-xl shadow-black/20 hover:border-primary/30 transition-all">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-bold text-white">{session.name}</h4>
                                        <p className="text-xs text-muted-foreground">{session.date} · {session.duration_minutes}min</p>
                                    </div>
                                    <Badge className={`text-[10px] uppercase border-none ${statusColor(session.status)}`}>{session.status}</Badge>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {session.time}</span>
                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {session.location}</span>
                                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {(session as any).assigned_player_ids?.length ?? (session as any).assigned_players?.length ?? 0}</span>
                                </div>

                                <p className="text-xs text-muted-foreground line-clamp-2">{session.objective}</p>

                                <div className="space-y-1">
                                    {session.exercises.map(ex => (
                                        <div key={ex.id} className="flex items-center gap-2 text-xs text-muted-foreground bg-white/5 rounded-lg p-2">
                                            <GripVertical className="h-3 w-3 text-white/20" />
                                            <span className="font-medium text-white/80">{(ex as any).exercise_name ?? (ex as any).name ?? "Exercise"}</span>
                                            <span className="ml-auto">{ex.duration_minutes}min</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Create Session Dialog */}
                <Dialog open={showCreateSession} onOpenChange={setShowCreateSession}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-white/10">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5 text-primary" />
                                {t("coach.training.newSession")}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">{t("coach.training.name")}</label>
                                    <Input placeholder="Session name" className="bg-background/50 border-white/5" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">{t("coach.training.duration")}</label>
                                    <Input type="number" placeholder="Minutes" className="bg-background/50 border-white/5" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">{t("coach.training.date")}</label>
                                    <Input type="date" className="bg-background/50 border-white/5" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">{t("coach.training.time")}</label>
                                    <Input type="time" className="bg-background/50 border-white/5" />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground">{t("coach.training.location")}</label>
                                    <Input placeholder="Location" className="bg-background/50 border-white/5" />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground">{t("coach.training.objective")}</label>
                                    <Textarea placeholder="Session objective..." className="bg-background/50 border-white/5" />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground">{t("coach.training.players")}</label>
                                    <Select defaultValue="all">
                                        <SelectTrigger className="bg-background/50 border-white/5"><SelectValue /></SelectTrigger>
                                        <SelectContent>
<SelectItem value="all">All Players ({squad.length})</SelectItem>
                                            {squad.map(p => (
                                                <SelectItem key={p.player_id} value={p.player_id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Training Builder (exercise blocks) */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-muted-foreground">{t("coach.training.exercises")}</label>
                                    <Button variant="ghost" size="sm" className="text-primary text-xs gap-1">
                                        <Plus className="h-3 w-3" /> Add Exercise
                                    </Button>
                                </div>
                                <div className="space-y-2 min-h-[100px] rounded-xl border-2 border-dashed border-white/10 p-4">
                                    {sessionExercises.length === 0 ? (
                                        <p className="text-center text-xs text-muted-foreground py-6">{t("coach.training.dragExercises")}</p>
                                    ) : (
                                        sessionExercises.map((ex, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                                <span className="text-sm font-medium text-white flex-1">{ex.name}</span>
                                                <span className="text-xs text-muted-foreground">{ex.minutes}min</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                                                    <Plus className="h-3 w-3 rotate-45" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" onClick={() => setShowCreateSession(false)} className="border-white/5">{t("coach.matches.cancel")}</Button>
                                <Button className="bg-primary text-black hover:bg-primary/90">{t("coach.training.save")}</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </TabsContent>

            {/* Plans */}
            <TabsContent value="plans">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">{t("coach.training.plans")}</h3>
                    <Button className="bg-primary text-black hover:bg-primary/90 gap-2">
                        <Plus className="h-4 w-4" /> {t("coach.training.newPlan")}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trainingPlans.map(plan => (
                        <Card key={plan.id} className="bg-card border-white/5 shadow-xl shadow-black/20">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-bold text-white">{plan.name}</h4>
                                        <p className="text-xs text-muted-foreground">{(plan as any).team_name ?? "Team"}</p>
                                    </div>
                                    <Badge className={`text-[10px] uppercase border-none ${statusColor(plan.status)}`}>{plan.status}</Badge>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {plan.start_date} – {plan.end_date}</span>
                                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {plan.player_ids.length} players</span>
                                </div>

                                <Badge variant="outline" className="border-white/10 text-[10px]">
                                    {plan.assigned_to === "team" ? "Whole Team" : plan.assigned_to === "selected" ? "Selected Players" : "Individual"}
                                </Badge>

                                <div className="text-xs text-muted-foreground">
                                    {(plan as any).session_ids?.length ?? 0} sessions in plan
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </TabsContent>

            {/* Exercise Library */}
            <TabsContent value="exercises">
                <div className="flex flex-wrap gap-2 mb-6">
                    {exerciseCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                                selectedCategory === cat
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-card/50 text-muted-foreground border-white/5 hover:text-foreground"
                            }`}
                        >
                            {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredExercises.map(ex => (
                        <Card key={ex.id} className="bg-card border-white/5 shadow-xl shadow-black/20 hover:border-primary/30 transition-all group">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-bold text-white group-hover:text-primary transition-colors">{ex.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="border-white/10 text-[10px]">{ex.category}</Badge>
                                            <Badge className={`text-[10px] border-none ${
                                                ex.difficulty === "beginner" ? "bg-emerald-400/20 text-emerald-400" :
                                                ex.difficulty === "intermediate" ? "bg-amber-400/20 text-amber-400" :
                                                "bg-red-400/20 text-red-400"
                                            }`}>{ex.difficulty}</Badge>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground line-clamp-2">{ex.description}</p>

                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {ex.duration_minutes}min</span>
                                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {ex.min_players}+ players</span>
                                </div>

                                {ex.equipment.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {ex.equipment.map(eq => (
                                            <span key={eq} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">{eq}</span>
                                        ))}
                                    </div>
                                )}

                                <Button variant="outline" size="sm" className="w-full border-white/5 text-xs gap-1">
                                    <Plus className="h-3 w-3" /> {t("coach.training.addToTraining")}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </TabsContent>
        </Tabs>
    );
}
