import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCoachSquad, useCoachMatches, usePlayerEvaluations, useTrainingSessions } from "@/hooks/useCoachData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trophy, BarChart3, CalendarDays, Dumbbell, ClipboardCheck, Video, Star, AlertTriangle, Clock } from "lucide-react";

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation("dashboard");

  const { data: squad = [] } = useCoachSquad(undefined);
  const { data: evaluations = [] } = usePlayerEvaluations(id);
  const { data: matches = [] } = useCoachMatches(undefined);
  const { data: trainingSessions = [] } = useTrainingSessions(undefined);

  const player = squad.find(p => p.id === id || p.player_id === id);
  const playerMatches = matches.filter(m => m.starting_xi.includes(id ?? "") || m.substitutes.includes(id ?? ""));
  const playerEv = evaluations.filter(e => e.player_id === id);

  const getScoreColor = (v: number) => v >= 8 ? "text-primary" : v >= 6 ? "text-warning" : "text-destructive";

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("player.back")}
      </Button>

      <div className="flex items-center gap-6 bg-card border border-border rounded-2xl p-6">
        <Avatar className="h-20 w-20 border-2 border-primary/30">
          <AvatarFallback className="bg-primary/20 text-primary text-2xl">{player?.name?.charAt(0) ?? "?"}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{player?.name ?? "Player"}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline" className="border-border text-muted-foreground">{player?.position ?? "-"}</Badge>
            <span className="text-sm text-muted-foreground">{t("player.age")}: {player?.age ?? "-"}</span>
            <span className={`text-2xl font-bold ${getScoreColor(player?.coach_rating ?? 0)}`}>
              {player ? (player.coach_rating * 10).toFixed(0) : "-"}
            </span>
          </div>
        </div>
        <div className="flex gap-4 text-center">
          <div className="p-3 rounded-xl bg-surface-2">
            <p className="text-2xl font-bold text-foreground">{playerMatches.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{t("player.matches")}</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-2">
            <p className="text-2xl font-bold text-foreground">{playerEv.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{t("player.evaluations")}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-surface-1 border border-border">
          <TabsTrigger value="overview" className="gap-2"><Star className="h-4 w-4" /> {t("player.overview")}</TabsTrigger>
          <TabsTrigger value="matches" className="gap-2"><CalendarDays className="h-4 w-4" /> {t("player.matches")}</TabsTrigger>
          <TabsTrigger value="training" className="gap-2"><Dumbbell className="h-4 w-4" /> {t("player.training")}</TabsTrigger>
          <TabsTrigger value="evaluations" className="gap-2"><ClipboardCheck className="h-4 w-4" /> {t("player.evaluations")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="text-foreground text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> {t("player.performance")}</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2 text-muted-foreground">
                <div className="flex justify-between"><span>{t("player.goals")}</span><span className="font-bold text-foreground">{(player as any)?.goals ?? 0}</span></div>
                <div className="flex justify-between"><span>{t("player.assists")}</span><span className="font-bold text-foreground">{(player as any)?.assists ?? 0}</span></div>
                <div className="flex justify-between"><span>{t("player.appearances")}</span><span className="font-bold text-foreground">{(player as any)?.appearances ?? 0}</span></div>
                <div className="flex justify-between"><span>{t("player.starts")}</span><span className="font-bold text-foreground">{(player as any)?.starts ?? 0}</span></div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="text-foreground text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> {t("player.recent")}</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2 text-muted-foreground">
                {playerMatches.slice(0, 5).map(m => (
                  <div key={m.id} className="flex justify-between">
                    <span>{m.date} vs {m.opponent}</span>
                    <Badge className={`text-[9px] ${m.status === "completed" ? "bg-emerald-400/20 text-emerald-400" : "bg-primary/20 text-primary"}`}>{m.status}</Badge>
                  </div>
                ))}
                {playerMatches.length === 0 && <p className="text-center py-4">{t("player.noMatches")}</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="matches" className="mt-6">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <table className="w-full">
                <thead><tr className="border-b border-border bg-surface-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <th className="p-3 text-left">{t("coach.matches.date")}</th>
                  <th className="p-3 text-left">{t("coach.matches.opponent")}</th>
                  <th className="p-3 text-center">{t("coach.matches.score")}</th>
                  <th className="p-3 text-center">{t("coach.matches.status")}</th>
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {playerMatches.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-muted-foreground text-sm">{t("player.noMatches")}</td></tr>
                  )}
                  {playerMatches.map(m => (
                    <tr key={m.id} className="hover:bg-surface-2">
                      <td className="p-3 text-sm text-foreground">{m.date}</td>
                      <td className="p-3 font-medium text-foreground">{m.opponent}</td>
                      <td className="p-3 text-center">{m.status === "completed" ? <span className="font-bold text-foreground">{m.score_home} – {m.score_away}</span> : <span className="text-muted-foreground">–</span>}</td>
                      <td className="p-3 text-center"><Badge className={`text-[9px] ${m.status === "completed" ? "bg-emerald-400/20 text-emerald-400" : "bg-primary/20 text-primary"}`}>{m.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trainingSessions.filter(s => (s as any).assigned_player_ids?.includes(id) || (s as any).assigned_players?.includes(id)).map(s => (
              <Card key={s.id} className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div><h4 className="font-bold text-foreground text-sm">{s.name}</h4><p className="text-[10px] text-muted-foreground">{s.date}</p></div>
                    <Badge className={`text-[9px] ${s.status === "completed" ? "bg-emerald-400/20 text-emerald-400" : "bg-primary/20 text-primary"}`}>{s.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> {s.duration_minutes}min
                  </div>
                  {s.objective && <p className="text-[10px] text-muted-foreground line-clamp-2">{s.objective}</p>}
                </CardContent>
              </Card>
            ))}
            {trainingSessions.filter(s => (s as any).assigned_player_ids?.includes(id) || (s as any).assigned_players?.includes(id)).length === 0 && (
              <Card className="bg-card border-border col-span-full"><CardContent className="p-8 text-center text-muted-foreground text-sm">{t("player.noTraining")}</CardContent></Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="evaluations" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playerEv.map(ev => (
              <Card key={ev.id} className="bg-card border-border cursor-pointer hover:border-primary/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="border-border">{ev.date}</Badge>
                    <span className="text-lg font-bold text-primary">
                      {(Object.values((ev.categories as any)?.technical ?? {}).reduce((a: number, b: any) => a + (b as number), 0) / 10).toFixed(1)}
                    </span>
                  </div>
                  {ev.notes && <p className="text-xs text-muted-foreground italic line-clamp-2">"{ev.notes}"</p>}
                </CardContent>
              </Card>
            ))}
            {playerEv.length === 0 && <Card className="bg-card border-border col-span-full"><CardContent className="p-8 text-center text-muted-foreground text-sm">{t("player.noEvals")}</CardContent></Card>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}