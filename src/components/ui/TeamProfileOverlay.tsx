import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemoContext } from "@/demo";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Users,
    Shield,
    Trophy,
    Loader2,
    TrendingUp,
    Activity,
    Award,
    Clock,
    ChevronLeft,
    CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface RosterMember {
    jersey_number: number | null;
    status: string;
    player_id: string;
    name: string;
    position: string | null;
    age: number | null;
    latest_score: number;
    recent_scores: number[];
    trend: number;
    last_upload: string | null;
}

interface TeamProfileOverlayProps {
    teamId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export const TeamProfileOverlay: React.FC<TeamProfileOverlayProps> = ({
    teamId,
    isOpen,
    onClose,
}) => {
    const { t } = useTranslation("team");
    const demo = useDemoContext();

    // Helper functions for styling (aligned with new dark theme)
    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-primary";
        if (score >= 60) return "text-[#8A6A1F]";
        return "text-destructive";
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 80) return "bg-primary";
        if (score >= 60) return "bg-amber-400";
        return "bg-destructive";
    };

    // 1. Fetch Team Details
    const { data: team, isLoading: loadingTeam } = useQuery({
        queryKey: ['team-details', teamId],
        queryFn: async () => {
            if (!teamId) return null;
            if (demo) {
                const found = demo.teams.find((t: any) => t.id === teamId);
                return found || null;
            }
            const { data, error } = await supabase
                .from('teams')
                .select(`
          *,
          clubs (name)
        `)
                .eq('id', teamId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!teamId && isOpen,
    });

    // 2. Fetch Team Coaches
    const { data: coaches = [], isLoading: loadingCoaches } = useQuery<any[]>({
        queryKey: ['team-coaches-list', teamId],
        queryFn: async () => {
            if (!teamId) return [];
            if (demo) {
                return [{ role: 'head', users: { name: 'Coach Alex', email: 'coach@demo.com' } }];
            }
            const { data, error } = await supabase
                .from('team_coaches')
                .select(`
          role,
          users (name, email)
        `)
                .eq('team_id', teamId);
            if (error) throw error;
            return data || [];
        },
        enabled: !!teamId && isOpen,
    });

    // 3. Fetch Team Roster
    const { data: roster = [], isLoading: loadingRoster } = useQuery({
        queryKey: ['team-roster-list-coach-style', teamId],
        queryFn: async () => {
            if (!teamId) return [];
            if (demo) {
                return demo.roster
                    .filter((r: any) => r.status === 'active')
                    .map((r: any) => ({
                        player_id: r.id,
                        name: r.name,
                        position: r.position,
                        age: r.age,
                        jersey_number: r.jersey_number,
                        latest_score: r.latest_score || 0,
                        recent_scores: r.recent_scores || [],
                        trend: r.trend || 0,
                        last_upload: r.last_upload,
                    })) as any[];
            }

            const { data: rosterData, error: rosterError } = await supabase
                .from('team_rosters')
                .select(`
          jersey_number,
          status,
          player_id,
          users (id, name, position, age)
        `)
                .eq('team_id', teamId)
                .eq('status', 'active');

            if (rosterError) throw rosterError;
            if (!rosterData || rosterData.length === 0) return [];

            const playerIds = rosterData.map((r: any) => r.player_id);
            const { data: analysesData, error: analysesError } = await supabase
                .from('analyses')
                .select('user_id, overall, created_at')
                .in('user_id', playerIds)
                .order('created_at', { ascending: false });

            if (analysesError) throw analysesError;

            const analysesByPlayer: Record<string, any[]> = {};
            (analysesData || []).forEach((analysis: any) => {
                if (!analysesByPlayer[analysis.user_id]) {
                    analysesByPlayer[analysis.user_id] = [];
                }
                if (analysesByPlayer[analysis.user_id].length < 3) {
                    analysesByPlayer[analysis.user_id].push(analysis);
                }
            });

            return rosterData.map((item: any) => {
                const playerAnalyses = analysesByPlayer[item.player_id] || [];
                const scores = playerAnalyses.map(a => a.overall);
                const trend = scores.length >= 2 ? scores[0] - scores[1] : 0;

                return {
                    player_id: item.player_id,
                    name: item.users?.name,
                    position: item.users?.position,
                    age: item.users?.age,
                    jersey_number: item.jersey_number,
                    latest_score: scores[0] || 0,
                    recent_scores: scores,
                    trend: trend,
                    last_upload: playerAnalyses[0]?.created_at || null
                } as RosterMember;
            });
        },
        enabled: !!teamId && isOpen,
    });

    const avgScore = roster.length > 0
        ? (roster.reduce((sum, p) => sum + (p.latest_score || 0), 0) / roster.length).toFixed(1)
        : "0.0";

    const isLoading = loadingTeam || loadingCoaches || loadingRoster;

    // Get Primary Coach (Head Coach if exists, else first one)
    const primaryCoach = coaches.find((c: any) => c.role?.toLowerCase().includes('head')) || coaches[0];
    const coachName = primaryCoach?.users?.name || t("profileOverlay.coach");

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[1100px] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-none bg-background text-foreground">
                <DialogHeader className="p-8 pb-10 bg-card border-b border-border relative">
                    <div className="flex justify-between items-start relative z-10">
                        <div className="flex flex-col gap-3">
                            <div>
                                <DialogTitle className="text-3xl font-black tracking-tight mb-2 text-foreground">
                                    {(team as any)?.name}
                                </DialogTitle>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-sm font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <Shield className="h-4 w-4 text-primary" />
                                        {(team as any)?.clubs?.name || t("profileOverlay.independent")}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground font-bold">•</span>
                                        <span>{coachName}</span>
                                        <Badge variant="outline" className="text-primary border-primary/20 font-bold px-2 py-0 uppercase tracking-wider text-[9px]">
                                            {t("profileOverlay.coach")}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground font-bold">•</span>
                                        <span>{(team as any)?.age_group}</span>
                                    </div>
                                    {(team as any)?.season && (
                                        <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground font-bold">•</span>
                                            <span>{(team as any).season}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <div className="p-8 space-y-8">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground font-medium">{t("profileOverlay.loading")}</p>
                            </div>
                        ) : (
                            <>
                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <Card className=" border-border bg-card">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">{t("profileOverlay.stats.totalPlayers")}</p>
                                                    <p className="text-2xl font-black text-foreground">{roster.length}</p>
                                                </div>
                                                <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center">
                                                    <Users className="h-6 w-6 text-primary" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className=" border-border bg-card">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">{t("profileOverlay.stats.avgScore")}</p>
                                                    <p className="text-2xl font-black text-foreground">{avgScore}</p>
                                                </div>
                                                <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center">
                                                    <TrendingUp className="h-6 w-6 text-primary" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className=" border-border bg-card">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">{t("profileOverlay.stats.elitePerformers")}</p>
                                                    <p className="text-2xl font-black text-foreground">{roster.filter(p => p.latest_score >= 80).length}</p>
                                                </div>
                                                <div className="w-12 h-12 rounded-sm bg-amber-400/10 flex items-center justify-center">
                                                    <Award className="h-6 w-6 text-[#8A6A1F]" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className=" border-border bg-card">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">{t("profileOverlay.stats.activeToday")}</p>
                                                    <p className="text-2xl font-black text-foreground">
                                                        {roster.filter(p => {
                                                            if (!p.last_upload) return false;
                                                            return new Date(p.last_upload).toDateString() === new Date().toDateString();
                                                        }).length}
                                                    </p>
                                                </div>
                                                <div className="w-12 h-12 rounded-sm bg-blue-400/10 flex items-center justify-center">
                                                    <Clock className="h-6 w-6 text-slate-700" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Team Roster */}
                                <Card className=" border-border bg-card overflow-hidden">
                                    <div className="p-6 border-b border-border">
                                        <h3 className="font-bold text-foreground flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-primary" />
                                            {t("profileOverlay.roster.title")}
                                        </h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-border bg-card/2">
                                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("profileOverlay.roster.num")}</th>
                                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("profileOverlay.roster.name")}</th>
                                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("profileOverlay.roster.age")}</th>
                                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("profileOverlay.roster.pos")}</th>
                                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("profileOverlay.roster.performance")}</th>
                                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("profileOverlay.roster.history")}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {roster.map((p, idx) => (
                                                    <tr key={idx} className="border-b border-border hover:bg-secondary/35 transition-colors group">
                                                        <td className="p-4 text-muted-foreground font-mono text-xs">{p.jersey_number || '-'}</td>
                                                        <td className="p-4">
                                                            <div className="font-bold text-foreground group-hover:text-primary transition-colors">{p.name}</div>
                                                            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-tight opacity-70">
                                                                {t("profileOverlay.roster.lastUpload")}: {p.last_upload ? new Date(p.last_upload).toLocaleDateString() : t("profileOverlay.roster.na")}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-sm text-muted-foreground font-medium">{p.age || '-'}</td>
                                                        <td className="p-4">
                                                            <Badge variant="outline" className="font-mono text-[10px] border-border text-muted-foreground">{p.position || '-'}</Badge>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-xl font-black ${getScoreColor(p.latest_score)}`}>
                                                                    {p.latest_score.toFixed(1)}
                                                                </span>
                                                                {p.trend !== 0 && (
                                                                    <span className={`text-xs font-bold ${p.trend > 0 ? 'text-primary' : 'text-destructive'}`}>
                                                                        {p.trend > 0 ? '▲' : '▼'}{Math.abs(p.trend).toFixed(1)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex gap-1.5 items-center">
                                                                {p.recent_scores.map((score, sIdx) => (
                                                                    <div
                                                                        key={sIdx}
                                                                        className={`h-7 w-9 rounded-sm text-[10px] flex items-center justify-center font-black text-foreground shadow-sm ${getScoreBgColor(score)}`}
                                                                    >
                                                                        {score.toFixed(0)}
                                                                    </div>
                                                                ))}
                                                                {p.recent_scores.length === 0 && <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest italic opacity-40">{t("profileOverlay.roster.na")}</span>}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
