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
import { Calendar as CalendarIcon, Plus, GripVertical, Clock, MapPin, Target, Users, Dumbbell, FileText, Loader2, X } from "lucide-react";

export function TrainingTab({ teamId }: { teamId?: string }) {
    const { t } = useTranslation("dashboard");
    const [showCreateSession, setShowCreateSession] = useState(false);
    const [showCreatePlan, setShowCreatePlan] = useState(false);
    const [showAddExercise, setShowAddExercise] = useState(false);
    const [sessionExercises, setSessionExercises] = useState<{ exId: string; name: string; minutes: number }[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("all");

    const [form, setForm] = useState({ name: "", duration_minutes: 60, date: "", time: "", location: "", objective: "", player_ids: [] as string[] });
    const [planForm, setPlanForm] = useState({ name: "", start_date: "", end_date: "", assigned_to: "team" as "team" | "selected" | "individual" });

    const { data: trainingSessions = [] } = useTrainingSessions(teamId);
    const { data: trainingPlans = [] } = useTrainingPlans(teamId);
    const { data: exercises = [] } = useExercises();
    const { data: squad = [] } = useCoachSquad(teamId);
    const createSession = useCreateTrainingSession();

    const exerciseCategories = ["all", "passing", "defensive", "shooting", "dribbling", "tactical", "physical", "technical"];

    const filteredExercises = selectedCategory === "all" ? exercises : exercises.filter(e => e.category === selectedCategory);

    const statusColor = (status: string) => {
        switch (status) {
            case "completed": return "bg-success/15 text-success";
            case "scheduled": return "bg-primary/20 text-primary";
            default: return "bg-surface-3 text-muted-foreground";
        }
    };

    const handleSave = async () => {
        if (!teamId || !form.name || !form.date) return;
        await createSession.mutateAsync({
            team_id: teamId, name: form.name, date: form.date, time: form.time,
            duration_minutes: form.duration_minutes, location: form.location,
            objective: form.objective, player_ids: form.player_ids,
            exercises: sessionExercises.map(e => ({ exercise_id: e.exId, duration_minutes: e.minutes })),
        });
        setShowCreateSession(false);
        setForm({ name: "", duration_minutes: 60, date: "", time: "", location: "", objective: "", player_ids: [] });
        setSessionExercises([]);
    };

    const handleSavePlan = () => {
        if (!planForm.name || !planForm.start_date) return;
        setShowCreatePlan(false);
        setPlanForm({ name: "", start_date: "", end_date: "", assigned_to: "team" });
    };

    const addExerciseToSession = (ex: any) => {
        if (!sessionExercises.find(e => e.exId === ex.id)) {
            setSessionExercises(prev => [...prev, { exId: ex.id, name: ex.name, minutes: ex.duration_minutes || 10 }]);
        }
        setShowAddExercise(false);
    };

    const removeFromSession = (exId: string) => {
        setSessionExercises(prev => prev.filter(e => e.exId !== exId));
    };

    const today = new Date().toISOString().split("T")[0];

    return (
        <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="bg-surface-1 border border-border p-1 gap-1 mb-6">
                <TabsTrigger value="calendar" className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> {t("coach.training.calendar")}</TabsTrigger>
                <TabsTrigger value="sessions" className="flex items-center gap-2"><Clock className="h-4 w-4" /> {t("coach.training.sessions")}</TabsTrigger>
                <TabsTrigger value="plans" className="flex items-center gap-2"><FileText className="h-4 w-4" /> {t("coach.training.plans")}</TabsTrigger>
                <TabsTrigger value="exercises" className="flex items-center gap-2"><Dumbbell className="h-4 w-4" /> {t("coach.training.exercises")}</TabsTrigger>
            </TabsList>

            {/* Calendar */}
            <TabsContent value="calendar">
                <Card className="bg-card border-border shadow-xl shadow-black/20">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            {t("coach.training.calendar")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                                <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground py-2">{d}</div>
                            ))}
                            {Array.from({ length: 35 }, (_, i) => {
                                const day = i - 3;
                                const sessions = trainingSessions.filter(s => {
                                    const d = new Date(s.date);
                                    return d.getDate() === day && d.getMonth() === 6;
                                });
                                return (
                                    <div key={i} className={`min-h-[80px] p-1 rounded-lg border border-border ${day >= 1 && day <= 31 ? "bg-surface-2" : "opacity-30"}`}>
                                        {day >= 1 && day <= 31 && (
                                            <>
                                                <span className="text-[10px] font-medium text-muted-foreground">{day}</span>
                                                {sessions.map(s => (
                                                    <div key={s.id} className="mt-1 p-1 rounded bg-primary/20 text-[8px] text-primary font-bold leading-tight truncate">{s.name}</div>
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
                    <h3 className="text-lg font-bold text-foreground">{t("coach.training.sessions")}</h3>
                    <Button className="bg-primary text-black hover:bg-primary/90 gap-2" onClick={() => setShowCreateSession(true)}>
                        <Plus className="h-4 w-4" /> {t("coach.training.newSession")}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trainingSessions.map(session => (
                        <Card key={session.id} className="bg-card border-border shadow-xl shadow-black/20 hover:border-primary/30 transition-all">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-bold text-foreground">{session.name}</h4>
                                        <p className="text-xs text-muted-foreground">{session.date} · {session.duration_minutes}min</p>
                                    </div>
                                    <Badge className={`text-[10px] uppercase border-none ${statusColor(session.status)}`}>{session.status}</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {session.time}</span>
                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {session.location}</span>
                                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {session.assigned_players?.length ?? 0}</span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">{session.objective}</p>
                                <div className="space-y-1">
                                    {session.exercises.map((ex: any) => (
                                        <div key={ex.id} className="flex items-center gap-2 text-xs text-muted-foreground bg-surface-2 rounded-lg p-2">
                                            <GripVertical className="h-3 w-3 text-subtle-foreground" />
                                            <span className="font-medium text-foreground/80">{ex.exercise_name || ex.name || "Exercise"}</span>
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
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
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
                                    <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Session name" className="bg-background/50 border-border" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">{t("coach.training.duration")}</label>
                                    <Input type="number" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 0 }))} placeholder="Minutes" className="bg-background/50 border-border" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">{t("coach.training.date")}</label>
                                    <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} min={today} className="bg-background/50 border-border" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">{t("coach.training.time")}</label>
                                    <Input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} className="bg-background/50 border-border" />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground">{t("coach.training.location")}</label>
                                    <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Location" className="bg-background/50 border-border" />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground">{t("coach.training.objective")}</label>
                                    <Textarea value={form.objective} onChange={e => setForm(p => ({ ...p, objective: e.target.value }))} placeholder="Session objective..." className="bg-background/50 border-border" />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground">{t("coach.training.players")}</label>
                                    <Select value={form.player_ids.length === squad.length ? "all" : form.player_ids[0] || "all"} onValueChange={v => setForm(p => ({ ...p, player_ids: v === "all" ? squad.map(s => s.player_id || s.id) : [v] }))}>
                                        <SelectTrigger className="bg-background/50 border-border"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Players ({squad.length})</SelectItem>
                                            {squad.map(p => (
                                                <SelectItem key={p.player_id || p.id} value={p.player_id || p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-muted-foreground">{t("coach.training.exercises")}</label>
                                    <Button variant="ghost" size="sm" className="text-primary text-xs gap-1" onClick={() => setShowAddExercise(true)}>
                                        <Plus className="h-3 w-3" /> {t("coach.training.addExercise")}
                                    </Button>
                                </div>
                                <div className="space-y-2 min-h-[100px] rounded-xl border-2 border-dashed border-border p-4">
                                    {sessionExercises.length === 0 ? (
                                        <p className="text-center text-xs text-muted-foreground py-6">{t("coach.training.dragExercises")}</p>
                                    ) : (
                                        sessionExercises.map((ex, i) => (
                                            <div key={ex.exId} className="flex items-center gap-3 p-3 rounded-lg bg-surface-2 border border-border">
                                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                                <span className="text-sm font-medium text-foreground flex-1">{ex.name}</span>
                                                <Input type="number" value={ex.minutes} onChange={e => setSessionExercises(prev => prev.map((x, j) => j === i ? { ...x, minutes: parseInt(e.target.value) || 0 } : x))} className="w-16 h-7 text-center bg-background/50 border-border text-sm" />
                                                <span className="text-xs text-muted-foreground">{t("coach.training.min")}</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeFromSession(ex.exId)}>
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" onClick={() => setShowCreateSession(false)} className="border-border">{t("coach.matches.cancel")}</Button>
                                <Button className="bg-primary text-black hover:bg-primary/90 gap-2" onClick={handleSave} disabled={createSession.isPending || !form.name || !form.date}>
                                    {createSession.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {t("coach.training.save")}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Add Exercise Dialog */}
                <Dialog open={showAddExercise} onOpenChange={setShowAddExercise}>
                    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-card border-border">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Dumbbell className="h-5 w-5 text-primary" />
                                {t("coach.training.addExercise")}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                            {exercises.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">{t("coach.training.noExercises")}</p>}
                            {exercises.map(ex => {
                                const alreadyAdded = sessionExercises.some(e => e.exId === ex.id);
                                return (
                                    <div key={ex.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-border hover:bg-surface-3 transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{ex.name}</p>
                                            <p className="text-xs text-muted-foreground">{ex.category} · {ex.duration_minutes}{t("coach.training.min")}</p>
                                        </div>
                                        <Button size="sm" variant={alreadyAdded ? "ghost" : "outline"} className="border-border" disabled={alreadyAdded} onClick={() => addExerciseToSession(ex)}>
                                            {alreadyAdded ? t("coach.training.noExercises") : t("coach.training.addExercise")}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </DialogContent>
                </Dialog>
            </TabsContent>

            {/* Plans */}
            <TabsContent value="plans">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-foreground">{t("coach.training.plans")}</h3>
                    <Button className="bg-primary text-black hover:bg-primary/90 gap-2" onClick={() => setShowCreatePlan(true)}>
                        <Plus className="h-4 w-4" /> {t("coach.training.newPlan")}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trainingPlans.map(plan => (
                        <Card key={plan.id} className="bg-card border-border shadow-xl shadow-black/20">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-bold text-foreground">{plan.name}</h4>
                                        <p className="text-xs text-muted-foreground">{(plan as any).team_name ?? "Team"}</p>
                                    </div>
                                    <Badge className={`text-[10px] uppercase border-none ${statusColor(plan.status)}`}>{plan.status}</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {plan.start_date} – {plan.end_date}</span>
                                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {plan.player_ids.length} players</span>
                                </div>
                                <Badge variant="outline" className="border-border text-[10px]">
                                    {plan.assigned_to === "team" ? "Whole Team" : plan.assigned_to === "selected" ? "Selected Players" : "Individual"}
                                </Badge>
                                <div className="text-xs text-muted-foreground">{(plan as any).session_ids?.length ?? 0} sessions in plan</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Create Plan Dialog */}
                <Dialog open={showCreatePlan} onOpenChange={setShowCreatePlan}>
                    <DialogContent className="sm:max-w-lg bg-card border-border">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                {t("coach.training.newPlan")}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">{t("coach.training.name")}</label>
                                <Input placeholder="Plan name" value={planForm.name} onChange={e => setPlanForm(p => ({ ...p, name: e.target.value }))} className="bg-background/50 border-border" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">{t("coach.training.date")}</label>
                                    <Input type="date" value={planForm.start_date} onChange={e => setPlanForm(p => ({ ...p, start_date: e.target.value }))} className="bg-background/50 border-border" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">{t("coach.training.date")}</label>
                                    <Input type="date" value={planForm.end_date} onChange={e => setPlanForm(p => ({ ...p, end_date: e.target.value }))} className="bg-background/50 border-border" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" onClick={() => setShowCreatePlan(false)} className="border-border">{t("coach.matches.cancel")}</Button>
                                <Button className="bg-primary text-black hover:bg-primary/90" onClick={handleSavePlan}>{t("coach.training.save")}</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </TabsContent>

            {/* Exercise Library */}
            <TabsContent value="exercises">
                <div className="flex flex-wrap gap-2 mb-6">
                    {exerciseCategories.map(cat => (
                        <button key={cat} onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${selectedCategory === cat ? "bg-primary text-primary-foreground border-primary" : "bg-surface-1 text-muted-foreground border-border hover:text-foreground"}`}
                        >
                            {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredExercises.map(ex => (
                        <Card key={ex.id} className="bg-card border-border shadow-xl shadow-black/20 hover:border-primary/30 transition-all group">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{ex.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="border-border text-[10px]">{ex.category}</Badge>
                                            <Badge className={`text-[10px] border-none ${ex.difficulty === "beginner" ? "bg-success/15 text-success" : ex.difficulty === "intermediate" ? "bg-warning/20 text-warning" : "bg-destructive/15 text-destructive"}`}>{ex.difficulty}</Badge>
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
                                            <span key={eq} className="text-[9px] px-1.5 py-0.5 rounded bg-surface-2 text-muted-foreground">{eq}</span>
                                        ))}
                                    </div>
                                )}
                                <Button variant="outline" size="sm" className="w-full border-border text-xs gap-1" onClick={() => { setShowCreateSession(true); addExerciseToSession(ex); }}>
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