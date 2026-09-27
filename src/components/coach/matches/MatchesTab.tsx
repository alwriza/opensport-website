import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCoachMatches, useCoachSquad, useCreateMatch, useUpsertMatchStats } from "@/hooks/useCoachData";
import type { Match } from "@/types/coach";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Eye, X, Trophy, Loader2, Shield } from "lucide-react";

export function MatchesTab({ teamId }: { teamId?: string }) {
    const { t } = useTranslation("dashboard");
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [showNew, setShowNew] = useState(false);

    const { data: matches = [] } = useCoachMatches(teamId);
    const { data: squad = [] } = useCoachSquad(teamId);
    const createMatch = useCreateMatch();
    const upsertStats = useUpsertMatchStats();
    const [startingXI, setStartingXI] = useState<string[]>([]);
    const [newMatch, setNewMatch] = useState({ date: "", time: "", opponent: "", home_away: "home", competition: "league", location: "" });

    const handleCreate = async () => {
        if (!teamId || !newMatch.date || !newMatch.opponent) return;
        await createMatch.mutateAsync({
            team_id: teamId, date: newMatch.date, time: newMatch.time,
            opponent: newMatch.opponent, home_away: newMatch.home_away,
            competition: newMatch.competition, location: newMatch.location,
            starting_xi: startingXI,
        });
        setShowNew(false);
        setNewMatch({ date: "", time: "", opponent: "", home_away: "home", competition: "league", location: "" });
        setStartingXI([]);
    };

    const statusColor = (status: string) => {
        switch (status) {
            case "completed": return "bg-primary/10 text-primary";
            case "scheduled": return "bg-primary/20 text-primary";
            case "cancelled": return "bg-destructive/10 text-destructive";
            default: return "bg-secondary/60 text-muted-foreground";
        }
    };

    const getPlayerName = (pid: string) => squad.find(p => p.player_id === pid)?.name ?? squad.find(p => p.id === pid)?.name ?? pid;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">{t("coach.matches.title")}</h2>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" onClick={() => setShowNew(true)}>
                    <Plus className="h-4 w-4" /> {t("coach.matches.newMatch")}
                </Button>
            </div>

            <Card className="bg-card border-border overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-card/[0.02]">
                                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("coach.matches.date")}</th>
                                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("coach.matches.opponent")}</th>
                                    <th className="p-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">H/A</th>
                                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("coach.matches.competition")}</th>
                                    <th className="p-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("coach.matches.score")}</th>
                                    <th className="p-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("coach.matches.status")}</th>
                                    <th className="p-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("coach.matches.actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {matches.map(match => (
                                    <tr key={match.id} className="hover:bg-card/[0.02] transition-colors cursor-pointer" onClick={() => setSelectedMatch(match)}>
                                        <td className="p-3">
                                            <span className="text-sm font-medium text-foreground">{match.date}</span>
                                            <span className="text-xs text-muted-foreground ml-2">{match.time}</span>
                                        </td>
                                        <td className="p-3 font-medium text-foreground">{match.opponent}</td>
                                        <td className="p-3 text-center">
                                            <Badge variant="outline" className={`border-border ${match.home_away === "home" ? "text-primary" : "text-[#8A6A1F]"}`}>
                                                {match.home_away === "home" ? "HOME" : "AWAY"}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-sm text-muted-foreground">{match.competition}</td>
                                        <td className="p-3 text-center">
                                            {match.status === "completed" ? (
                                                <span className="text-lg font-black text-foreground">{match.score_home} – {match.score_away}</span>
                                            ) : <span className="text-muted-foreground">–</span>}
                                        </td>
                                        <td className="p-3 text-center">
                                            <Badge className={`text-[10px] uppercase border-none ${statusColor(match.status)}`}>{match.status}</Badge>
                                        </td>
                                        <td className="p-3 text-center">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Match Detail Dialog */}
            <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border text-card-foreground">
                    {selectedMatch && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black flex items-center gap-3">
                                    <Trophy className="h-6 w-6 text-primary" />
                                    {selectedMatch.date} — {selectedMatch.opponent}
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    {selectedMatch.competition} · {selectedMatch.home_away === "home" ? "Home" : "Away"} · {selectedMatch.location}
                                    {selectedMatch.status === "completed" && (
                                        <span className="text-foreground font-bold ml-4">Score: {selectedMatch.score_home} – {selectedMatch.score_away}</span>
                                    )}
                                </DialogDescription>
                            </DialogHeader>

                            {selectedMatch.starting_xi.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">{t("coach.matches.startingXI")}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {selectedMatch.starting_xi.map(pid => (
                                            <div key={pid} className="flex items-center gap-3 p-3 rounded-sm bg-secondary/35 border border-border">
                                                <Avatar className="h-8 w-8 border border-border">
                                                    <AvatarFallback className="bg-primary/20 text-primary text-xs">{getPlayerName(pid).charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-medium text-foreground">{getPlayerName(pid)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedMatch.substitutes.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">{t("coach.matches.substitutes")}</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {selectedMatch.substitutes.map(pid => (
                                            <Badge key={pid} variant="outline" className="border-border bg-secondary/35 text-foreground px-3 py-2">{getPlayerName(pid)}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedMatch.status === "completed" && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">{t("coach.matches.playerStats")}</h3>
                                    <Card className="bg-secondary/35 border-border">
                                        <CardContent className="p-4">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                        <th className="p-2 text-left">{t("coach.squad.player")}</th>
                                                        <th className="p-2 text-center">MIN</th>
                                                        <th className="p-2 text-center">G</th>
                                                        <th className="p-2 text-center">A</th>
                                                        <th className="p-2 text-center">YC</th>
                                                        <th className="p-2 text-center">RC</th>
                                                        <th className="p-2 text-center">{t("coach.squad.rating")}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(selectedMatch.player_stats ?? []).map(stat => (
                                                        <tr key={stat.id} className="border-b border-border">
                                                            <td className="p-2 font-medium text-foreground">{(stat as any).users?.name ?? stat.player_id}</td>
                                                            <td className="p-2 text-center">
                                                                <Input defaultValue={stat.minutes} className="w-16 h-7 text-center bg-background/50 border-border text-sm" />
                                                            </td>
                                                            <td className="p-2 text-center">
                                                                <Input defaultValue={stat.goals} className="w-14 h-7 text-center bg-background/50 border-border text-sm" />
                                                            </td>
                                                            <td className="p-2 text-center">
                                                                <Input defaultValue={stat.assists} className="w-14 h-7 text-center bg-background/50 border-border text-sm" />
                                                            </td>
                                                            <td className="p-2 text-center">
                                                                <Input defaultValue={stat.yellow_cards} className="w-14 h-7 text-center bg-background/50 border-border text-sm" />
                                                            </td>
                                                            <td className="p-2 text-center">
                                                                <Input defaultValue={stat.red_cards} className="w-14 h-7 text-center bg-background/50 border-border text-sm" />
                                                            </td>
                                                            <td className="p-2 text-center">
                                                                <Input defaultValue={stat.coach_rating} className="w-16 h-7 text-center bg-background/50 border-border text-sm" />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {selectedMatch.notes && (
                                <div className="p-4 rounded-sm bg-secondary/35 border border-border">
                                    <p className="text-sm text-muted-foreground">{selectedMatch.notes}</p>
                                </div>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* New Match Dialog */}
            <Dialog open={showNew} onOpenChange={setShowNew}>
                <DialogContent className="sm:max-w-lg bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-primary" />
                            {t("coach.matches.newMatch")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">{t("coach.matches.date")}</label>
                            <Input type="date" value={newMatch.date} onChange={e => setNewMatch(p => ({ ...p, date: e.target.value }))} className="bg-background/50 border-border" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">{t("coach.matches.time")}</label>
                            <Input type="time" value={newMatch.time} onChange={e => setNewMatch(p => ({ ...p, time: e.target.value }))} className="bg-background/50 border-border" />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <label className="text-xs font-medium text-muted-foreground">{t("coach.matches.opponent")}</label>
                            <Input placeholder="Opponent name" value={newMatch.opponent} onChange={e => setNewMatch(p => ({ ...p, opponent: e.target.value }))} className="bg-background/50 border-border" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">H/A</label>
                            <Select value={newMatch.home_away} onValueChange={v => setNewMatch(p => ({ ...p, home_away: v }))}>
                                <SelectTrigger className="bg-background/50 border-border"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="home">Home</SelectItem>
                                    <SelectItem value="away">Away</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">{t("coach.matches.competition")}</label>
                            <Select value={newMatch.competition} onValueChange={v => setNewMatch(p => ({ ...p, competition: v }))}>
                                <SelectTrigger className="bg-background/50 border-border"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="league">League</SelectItem>
                                    <SelectItem value="cup">Cup</SelectItem>
                                    <SelectItem value="friendly">Friendly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 col-span-2">
                            <label className="text-xs font-medium text-muted-foreground">{t("coach.matches.location")}</label>
                            <Input placeholder="Location" value={newMatch.location} onChange={e => setNewMatch(p => ({ ...p, location: e.target.value }))} className="bg-background/50 border-border" />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                <Shield className="h-3.5 w-3.5 text-primary" />
                                {t("coach.matches.startingXI")}
                                <span className="text-xs text-muted-foreground">({startingXI.length}/11)</span>
                            </label>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 rounded-sm bg-background/30 border border-border">
                                {squad.map((p) => {
                                    const pid = p.player_id || p.id;
                                    const selected = startingXI.includes(pid);
                                    return (
                                        <Badge key={pid} variant={selected ? "default" : "outline"} className={`cursor-pointer transition-all text-xs ${selected ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
                                            onClick={() => {
                                                if (selected) setStartingXI(prev => prev.filter(id => id !== pid));
                                                else if (startingXI.length < 11) setStartingXI(prev => [...prev, pid]);
                                            }}
                                        >
                                            {p.name || pid.slice(0, 8)}
                                            {selected && <X className="h-3 w-3 ml-1" />}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setShowNew(false)} className="border-border">{t("coach.matches.cancel")}</Button>
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" onClick={handleCreate} disabled={createMatch.isPending || !newMatch.date || !newMatch.opponent}>
                            {createMatch.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            {t("coach.matches.create")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}