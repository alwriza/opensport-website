import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
    ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
    // Helper functions for styling (identical to CoachDashboard)
    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 80) return "bg-green-600";
        if (score >= 60) return "bg-yellow-600";
        return "bg-red-600";
    };

    // 1. Fetch Team Details
    const { data: team, isLoading: loadingTeam } = useQuery({
        queryKey: ['team-details', teamId],
        queryFn: async () => {
            if (!teamId) return null;
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
    const { data: coaches = [], isLoading: loadingCoaches } = useQuery({
        queryKey: ['team-coaches-list', teamId],
        queryFn: async () => {
            if (!teamId) return [];
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
    const coachName = primaryCoach?.users?.name || 'Coach';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[1100px] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-none shadow-2xl bg-white">
                <DialogHeader className="p-8 pb-10 bg-slate-900 text-white relative">
                    <div className="flex justify-between items-start relative z-10">
                        <div className="flex flex-col gap-3">
                            <div>
                                <DialogTitle className="text-3xl font-black tracking-tight mb-2">
                                    {(team as any)?.name}
                                </DialogTitle>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-400 text-sm font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <Shield className="h-4 w-4 text-primary" />
                                        {(team as any)?.clubs?.name || "Independent"}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-700 font-bold">•</span>
                                        <span>{coachName}</span>
                                        <Badge variant="outline" className="text-slate-400 font-bold px-2 py-0 uppercase tracking-wider text-[9px]">
                                            Coach
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-700 font-bold">•</span>
                                        <span>{(team as any)?.age_group}</span>
                                    </div>
                                    {(team as any)?.season && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-700 font-bold">•</span>
                                            <span>{(team as any).season}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* <Trophy className="h-12 w-12 text-slate-500 opacity-24" /> */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="w-fit -ml-2 text-slate-400 hover:text-white hover:bg-white/10 flex items-center gap-1 px-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 bg-slate-50/50">
                    <div className="p-8 space-y-8">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground font-medium">Loading team intelligence...</p>
                            </div>
                        ) : (
                            <>
                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <Card className="shadow-sm border-none bg-white">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Total Players</p>
                                                    <p className="text-2xl font-bold text-slate-900">{roster.length}</p>
                                                </div>
                                                <Users className="h-8 w-8 text-primary opacity-50" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="shadow-sm border-none bg-white">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Avg Score</p>
                                                    <p className="text-2xl font-bold text-slate-900">{avgScore}</p>
                                                </div>
                                                <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="shadow-sm border-none bg-white">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Elite Performers</p>
                                                    <p className="text-2xl font-bold text-slate-900">{roster.filter(p => p.latest_score >= 80).length}</p>
                                                </div>
                                                <Award className="h-8 w-8 text-yellow-500 opacity-50" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="shadow-sm border-none bg-white">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Active Today</p>
                                                    <p className="text-2xl font-bold text-slate-900">
                                                        {roster.filter(p => {
                                                            if (!p.last_upload) return false;
                                                            return new Date(p.last_upload).toDateString() === new Date().toDateString();
                                                        }).length}
                                                    </p>
                                                </div>
                                                <Clock className="h-8 w-8 text-blue-500 opacity-50" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Team Roster */}
                                <Card className="shadow-sm border-none overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 bg-white">
                                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-primary" />
                                            Team Roster
                                        </h3>
                                    </div>
                                    <div className="overflow-x-auto bg-white">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-100">
                                                    <th className="text-left p-4 text-xs font-medium uppercase text-muted-foreground">#</th>
                                                    <th className="text-left p-4 text-xs font-medium uppercase text-muted-foreground">Name</th>
                                                    <th className="text-left p-4 text-xs font-medium uppercase text-muted-foreground">Age</th>
                                                    <th className="text-left p-4 text-xs font-medium uppercase text-muted-foreground">Pos</th>
                                                    <th className="text-left p-4 text-xs font-medium uppercase text-muted-foreground">Performance</th>
                                                    <th className="text-left p-4 text-xs font-medium uppercase text-muted-foreground">History</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {roster.map((p, idx) => (
                                                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-4 text-muted-foreground font-mono text-xs">{p.jersey_number || '-'}</td>
                                                        <td className="p-4">
                                                            <div className="font-medium text-slate-900">{p.name}</div>
                                                            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                                                                Last Upload: {p.last_upload ? new Date(p.last_upload).toLocaleDateString() : 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-sm text-slate-600">{p.age || '-'}</td>
                                                        <td className="p-4">
                                                            <Badge variant="outline" className="font-mono text-[10px]">{p.position || '-'}</Badge>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-xl font-bold ${getScoreColor(p.latest_score)}`}>
                                                                    {p.latest_score.toFixed(1)}
                                                                </span>
                                                                {p.trend !== 0 && (
                                                                    <span className={`text-xs ${p.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                        {p.trend > 0 ? '▲' : '▼'}{Math.abs(p.trend).toFixed(1)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex gap-1 items-center">
                                                                {p.recent_scores.map((score, sIdx) => (
                                                                    <div
                                                                        key={sIdx}
                                                                        className={`h-6 w-8 rounded text-[10px] flex items-center justify-center font-bold text-white ${getScoreBgColor(score)}`}
                                                                    >
                                                                        {score.toFixed(0)}
                                                                    </div>
                                                                ))}
                                                                {p.recent_scores.length === 0 && <span className="text-muted-foreground text-xs italic">N/A</span>}
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
