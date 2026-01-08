import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    PlayCircle,
    Calendar,
    TrendingUp,
    TrendingDown,
    Activity,
    User,
    Ruler,
    Weight
} from "lucide-react";
import { format } from "date-fns";

interface PlayerProfileOverlayProps {
    player: any;
    isOpen: boolean;
    onClose: () => void;
    teamName?: string;
}

export const PlayerProfileOverlay: React.FC<PlayerProfileOverlayProps> = ({
    player,
    isOpen,
    onClose,
    teamName
}) => {
    // Fetch recent videos for this player
    const { data: recentVideos = [], isLoading: loadingVideos } = useQuery({
        queryKey: ['player-recent-videos', player?.id],
        queryFn: async () => {
            if (!player?.id) return [];
            const { data, error } = await supabase
                .from('videos')
                .select('id, created_at, status, analyses(overall)')
                .eq('user_id', player.id)
                .order('created_at', { ascending: false })
                .limit(3);

            if (error) throw error;
            return data || [];
        },
        enabled: !!player?.id && isOpen,
    });

    if (!player) return null;

    const metrics = player.metrics || {
        stability: 0,
        power: 0,
        technique: 0,
        balance: 0
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    const trendValue = player.trend || 0;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-none shadow-2xl bg-gradient-to-b from-background to-muted/20">
                <ScrollArea className="flex-1 w-full">
                    <div className="p-8 space-y-8">
                        {/* Header section */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <DialogHeader className="p-0 text-left">
                                        <DialogTitle className="text-3xl font-bold tracking-tight">{player.name}</DialogTitle>
                                    </DialogHeader>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-muted-foreground mt-1">
                                    <Badge variant="outline" className="px-2 py-0">{player.position || 'N/A'}</Badge>
                                    <span>•</span>
                                    <span>{player.age || 'N/A'} years old</span>
                                    {teamName && (
                                        <>
                                            <span>•</span>
                                            <span className="font-medium text-foreground/80">{teamName}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-6 bg-muted/30 p-4 rounded-2xl border border-border/50 backdrop-blur-sm">
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                                        <Ruler className="h-3 w-3" />
                                        Height
                                    </div>
                                    <span className="text-lg font-bold">{player.height || '-'} cm</span>
                                </div>
                                <div className="w-px bg-border h-10 self-center" />
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                                        <Weight className="h-3 w-3" />
                                        Weight
                                    </div>
                                    <span className="text-lg font-bold">{player.weight || '-'} kg</span>
                                </div>
                            </div>
                        </div>

                        {/* Main Stats Grid */}
                        <div className="grid md:grid-cols-2 gap-8 items-start">
                            {/* Overall Score Card */}
                            <div className="bg-background rounded-3xl p-8 border shadow-sm space-y-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Activity className="h-32 w-32 -mr-8 -mt-8" />
                                </div>

                                <div className="flex items-center justify-between relative z-10">
                                    <span className="text-lg font-semibold text-muted-foreground">Overall Performance</span>
                                    {trendValue !== 0 && (
                                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${trendValue > 0 ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100'}`}>
                                            {trendValue > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                            {Math.abs(trendValue).toFixed(1)}%
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-baseline gap-2 relative z-10">
                                    <span className={`text-7xl font-black tracking-tighter ${getScoreColor(player.latest_score || 0)}`}>
                                        {player.latest_score?.toFixed(0) || '0'}
                                    </span>
                                    <span className="text-2xl font-bold text-muted-foreground">/100</span>
                                </div>

                                <div className="space-y-5 pt-4 relative z-10">
                                    {[
                                        { label: "Stability", value: metrics.stability },
                                        { label: "Power", value: metrics.power },
                                        { label: "Technique", value: metrics.technique },
                                        { label: "Balance", value: metrics.balance }
                                    ].map((m) => (
                                        <div key={m.label} className="space-y-1.5">
                                            <div className="flex justify-between text-sm font-semibold">
                                                <span>{m.label}</span>
                                                <span className={getScoreColor(m.value)}>{m.value.toFixed(0)}%</span>
                                            </div>
                                            <Progress value={m.value} className="h-2" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Videos Section */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <PlayCircle className="h-5 w-5 text-primary" />
                                        Recent Videos
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    {loadingVideos ? (
                                        [1, 2, 3].map(i => (
                                            <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />
                                        ))
                                    ) : recentVideos.length > 0 ? (
                                        recentVideos.map((video: any) => (
                                            <div key={video.id} className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-muted/60 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-background border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                                        <PlayCircle className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold flex items-center gap-2">
                                                            Analysis Ready
                                                            {video.status === 'processing' && <Badge variant="secondary">Processing</Badge>}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(video.created_at), 'MMM d, yyyy')}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-lg font-black ${getScoreColor(video.analyses?.[0]?.overall || 0)}`}>
                                                        {video.analyses?.[0]?.overall?.toFixed(0) || '-'}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Score</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center bg-muted/20 rounded-3xl border border-dashed text-muted-foreground">
                                            No video uploads found.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
