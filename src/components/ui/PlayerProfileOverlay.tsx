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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    PlayCircle,
    Calendar,
    TrendingUp,
    TrendingDown,
    Activity,
    User,
    Ruler,
    Weight,
    Trophy,
    CheckCircle,
    Zap,
    History,
    Flame,
    Target,
    Crosshair,
    Footprints,
    Shield,
    Dumbbell,
    Brain,
    Star,
    Swords,
    Goal,
    CircleDot,
    Gauge,
    HeartPulse,
    type LucideIcon
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface PlayerProfileOverlayProps {
    player: any;
    isOpen: boolean;
    onClose: () => void;
    teamName?: string;
}

const emojiToIcon: Record<string, LucideIcon> = {
    '⚽': Goal, '🎯': Crosshair, '🏃': Footprints, '🦶': CircleDot,
    '🔥': Flame, '💪': Dumbbell, '🧠': Brain, '🛡️': Shield, '🛡': Shield,
    '⭐': Star, '🏆': Trophy, '⚡': Zap, '🎮': Swords,
    '🤾': HeartPulse, '🧘': Gauge,
};

const SkillIconOverlay = ({ icon }: { icon: string }) => {
    const IconComponent = emojiToIcon[icon] || Target;
    return (
        <div className="w-14 h-14 rounded-xl bg-[#9FE870]/10 flex items-center justify-center">
            <IconComponent className="h-7 w-7 text-[#9FE870]" />
        </div>
    );
};

export const PlayerProfileOverlay: React.FC<PlayerProfileOverlayProps> = ({
    player,
    isOpen,
    onClose,
    teamName
}) => {
    const { t } = useTranslation("player");
    const playerId = player?.player_id || player?.id;
    const [selectedVideoIndex, setSelectedVideoIndex] = React.useState<number>(0);
    const [selectedVideoUrl, setSelectedVideoUrl] = React.useState<string | null>(null);

    // Reset selection when player changes
    React.useEffect(() => {
        setSelectedVideoIndex(0);
        setSelectedVideoUrl(null);
    }, [playerId]);

    // Fetch recent videos for this player with full analysis data
    const { data: recentVideos = [], isLoading: loadingVideos } = useQuery<any[]>({
        queryKey: ['player-recent-videos-detailed', playerId],
        queryFn: async () => {
            if (!playerId) return [];
            const { data, error } = await supabase
                .from('videos')
                .select(`
                    id, 
                    uploaded_at, 
                    status,
                    storage_path,
                    analyses (
                        overall,
                        stability,
                        power,
                        technique,
                        balance,
                        feedback,
                        tags
                    )
                `)
                .eq('user_id', playerId)
                .order('uploaded_at', { ascending: false })
                .limit(5);

            if (error) throw error;
            return data || [];
        },
        enabled: !!playerId && isOpen,
    });

    const selectedVideo = recentVideos[selectedVideoIndex];
    const selectedAnalysis = selectedVideo?.analyses?.[0];

    // Fetch signed URL for the selected video
    React.useEffect(() => {
        const fetchSignedUrl = async () => {
            if (selectedVideo?.storage_path) {
                try {
                    const { data, error } = await supabase.storage
                        .from('videos')
                        .createSignedUrl(selectedVideo.storage_path, 3600);

                    if (error) throw error;
                    setSelectedVideoUrl(data.signedUrl);
                } catch (error) {
                    console.error("Error creating signed URL:", error);
                    setSelectedVideoUrl(null);
                }
            } else {
                setSelectedVideoUrl(null);
            }
        };

        if (isOpen && selectedVideo) {
            fetchSignedUrl();
        }
    }, [selectedVideo, isOpen]);

    // Fetch player training progress
    const { data: trainingProgress } = useQuery({
        queryKey: ['player-training-progress', playerId],
        queryFn: async () => {
            if (!playerId) return null;

            const { data: progress } = await supabase
                .from('player_progress')
                .select('*')
                .eq('player_id', playerId)
                .maybeSingle();

            const { data: skillProgress } = await supabase
                .from('player_skill_progress')
                .select('*, skills (name, icon)')
                .eq('player_id', playerId);

            return { progress, skillProgress: skillProgress || [] };
        },
        enabled: !!playerId && isOpen,
    });

    // Use selected analysis metrics if available
    const displayMetrics = selectedAnalysis ? {
        stability: selectedAnalysis.stability || 0,
        power: selectedAnalysis.power || 0,
        technique: selectedAnalysis.technique || 0,
        balance: selectedAnalysis.balance || 0
    } : (player?.metrics || {
        stability: 0,
        power: 0,
        technique: 0,
        balance: 0
    });

    const displayScore = selectedAnalysis?.overall || player?.latest_score || 0;

    if (!player) return null;

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-primary";
        if (score >= 60) return "text-amber-400";
        return "text-destructive";
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 80) return "bg-primary text-black";
        if (score >= 60) return "bg-amber-400 text-black";
        return "bg-destructive text-white";
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-6xl w-[95vw] md:w-full max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 border-none shadow-2xl bg-background text-white">
                <DialogHeader className="p-6 md:p-8 bg-card border-b border-white/5 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-12 w-12 md:h-16 md:w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                            <User className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl md:text-3xl font-black tracking-tight text-white mb-1">{player.name}</DialogTitle>
                            <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                <Badge className="bg-primary text-black border-none font-black uppercase tracking-widest text-[9px] px-2 py-0.5">
                                    {player.position || t("player.prospect")}
                                </Badge>
                                <span className="text-white/20 font-bold">•</span>
                                <span className="text-muted-foreground text-[10px] md:text-xs font-bold uppercase tracking-widest">{t("metrics.yearsOld", { count: player.age || 0 })}</span>
                                {teamName && (
                                    <>
                                        <span className="text-white/20 font-bold">•</span>
                                        <span className="text-primary text-[10px] md:text-xs font-black uppercase tracking-widest">{teamName}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <Tabs defaultValue="overview" className="w-full">
                        <div className="px-4 md:px-8 pt-4 md:pt-6 bg-card border-b border-white/5 sticky top-0 z-20">
                            <TabsList className="flex w-full max-w-md bg-transparent h-12 gap-6">
                                <TabsTrigger value="overview" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0 font-bold text-muted-foreground data-[state=active]:text-white transition-all">
                                    {t("tabs.overview")}
                                </TabsTrigger>
                                <TabsTrigger value="training" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0 font-bold text-muted-foreground data-[state=active]:text-white transition-all">
                                    {t("tabs.training")}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Combined Overview & Analysis Tab */}
                        <TabsContent value="overview" className="p-6 md:p-8 outline-none">
                            <div className="grid lg:grid-cols-12 gap-8">
                                {/* Left Column: Video Player & Selection */}
                                <div className="lg:col-span-8 space-y-6">
                                    <div className="bg-black rounded-[2rem] overflow-hidden aspect-video shadow-2xl border border-white/5 relative group">
                                        {selectedVideoUrl ? (
                                            <video
                                                src={selectedVideoUrl}
                                                controls
                                                playsInline
                                                className="w-full h-full object-contain"
                                                key={selectedVideoUrl}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-4">
                                                <PlayCircle className="h-20 w-20 opacity-10" />
                                                <p className="font-black uppercase tracking-[0.2em] text-[10px]">{t("sessions.select")}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Video Selection / Timeline */}
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
                                            <History className="h-4 w-4 text-primary" />
                                            {t("sessions.title")}
                                        </h3>
                                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                            {recentVideos.length > 0 ? (
                                                recentVideos.map((video, idx) => (
                                                    <button
                                                        key={video.id}
                                                        onClick={() => setSelectedVideoIndex(idx)}
                                                        className={`flex-shrink-0 flex items-center gap-3 p-3 rounded-2xl border transition-all ${selectedVideoIndex === idx
                                                            ? 'bg-primary/10 border-primary text-primary'
                                                            : 'bg-card border-white/5 text-muted-foreground hover:border-white/20 hover:bg-white/5'
                                                            }`}
                                                    >
                                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${selectedVideoIndex === idx ? 'bg-primary text-black' : 'bg-white/5 text-muted-foreground'}`}>
                                                            <PlayCircle className="h-4 w-4" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-xs font-bold leading-none mb-1">
                                                                {format(new Date(video.uploaded_at), 'MMM dd')}
                                                            </p>
                                                            <p className="text-[9px] uppercase font-black opacity-60">
                                                                {t("sessions.score", { score: video.analyses?.[0]?.overall?.toFixed(0) || '-' })}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <p className="text-xs text-muted-foreground italic py-2">{t("sessions.noSessions")}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* AI Feedback Section */}
                                    <Card className="bg-card border border-white/5 rounded-3xl p-6 shadow-xl shadow-black/20 space-y-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-primary" />
                                            {t("analysis.title")}
                                        </h3>
                                        {selectedAnalysis ? (
                                            <div className="space-y-4">
                                                <p className="text-white text-sm leading-relaxed font-medium italic">
                                                    "{selectedAnalysis.feedback}"
                                                </p>
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {selectedAnalysis.tags?.map((tag: string, i: number) => (
                                                        <Badge key={i} variant="secondary" className="bg-white/5 text-primary border-none font-bold py-1 px-3 rounded-lg text-[9px] uppercase tracking-wider">
                                                            {tag.replace(/_/g, ' ')}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground text-sm italic">{t("analysis.placeholder")}</p>
                                        )}
                                    </Card>
                                </div>

                                {/* Right Column: Metrics Card */}
                                <div className="lg:col-span-4 space-y-6">
                                    {/* Overall Score Circle/Box */}
                                    <Card className="bg-card border border-white/5 rounded-[2rem] p-8 shadow-xl shadow-black/40 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:bg-primary/10 transition-colors" />

                                        <div className="relative z-10 text-center mb-8">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">{t("metrics.overall")}</p>
                                            <div className="inline-flex flex-col items-center">
                                                <div className={`text-7xl font-black leading-none tracking-tighter ${getScoreColor(displayScore)}`}>
                                                    {displayScore.toFixed(0)}
                                                </div>
                                                <div className="text-[10px] font-black text-muted-foreground uppercase mt-2 tracking-widest">{t("metrics.scoreLimit")}</div>
                                            </div>
                                        </div>

                                        <div className="space-y-6 relative z-10">
                                            {[
                                                { label: t("metrics.stability"), value: displayMetrics.stability, icon: TrendingUp },
                                                { label: t("metrics.power"), value: displayMetrics.power, icon: Zap },
                                                { label: t("metrics.technique"), value: displayMetrics.technique, icon: Activity },
                                                { label: t("metrics.balance"), value: displayMetrics.balance, icon: User }
                                            ].map((m) => (
                                                <div key={m.label} className="space-y-2">
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                        <span className="text-muted-foreground flex items-center gap-2">
                                                            <m.icon className="h-3 w-3" />
                                                            {m.label}
                                                        </span>
                                                        <span className={getScoreColor(m.value)}>{m.value.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${getScoreBgColor(m.value)}`}
                                                            style={{ width: `${m.value}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>

                                    {/* Quick Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <Card className="bg-card border border-white/5 rounded-2xl p-4 shadow-lg shadow-black/20">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{t("metrics.weight")}</p>
                                            <p className="text-xl font-bold text-white">{player.weight || '-'} <span className="text-[10px] font-medium text-muted-foreground">kg</span></p>
                                        </Card>
                                        <Card className="bg-card border border-white/5 rounded-2xl p-4 shadow-lg shadow-black/20">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{t("metrics.height")}</p>
                                            <p className="text-xl font-bold text-white">{player.height || '-'} <span className="text-[10px] font-medium text-muted-foreground">cm</span></p>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Training Tab (kept separate for detailed view) */}
                        <TabsContent value="training" className="p-6 md:p-8 outline-none">
                            <div className="space-y-10">
                                {/* Training Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card className="bg-card border border-white/5 rounded-3xl p-6 shadow-xl shadow-black/20">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Zap className="h-4 w-4 text-primary" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("training.totalXp")}</p>
                                        </div>
                                        <p className="text-3xl font-black text-white">{(trainingProgress as any)?.progress?.total_xp || 0}</p>
                                    </Card>
                                    <Card className="bg-card border border-white/5 rounded-3xl p-6 shadow-xl shadow-black/20">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Trophy className="h-4 w-4 text-primary" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("training.level")}</p>
                                        </div>
                                        <p className="text-3xl font-black text-white">{(trainingProgress as any)?.progress?.level || 1}</p>
                                    </Card>
                                    <Card className="bg-card border border-white/5 rounded-3xl p-6 shadow-xl shadow-black/20">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Flame className="h-4 w-4 text-orange-500" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("training.streak")}</p>
                                        </div>
                                        <p className="text-3xl font-black text-orange-500">{(trainingProgress as any)?.progress?.current_streak || 0}</p>
                                    </Card>
                                    <Card className="bg-card border border-white/5 rounded-3xl p-6 shadow-xl shadow-black/20">
                                        <div className="flex items-center gap-3 mb-3">
                                            <CheckCircle className="h-4 w-4 text-green-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("training.skills")}</p>
                                        </div>
                                        <p className="text-3xl font-black text-white">
                                            {trainingProgress?.skillProgress?.filter((sp: any) => sp.is_completed).length || 0}/10
                                        </p>
                                    </Card>
                                </div>

                                {/* Skills Progress */}
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-3">
                                        <Activity className="h-5 w-5 text-primary" />
                                        {t("tabs.technical")}
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {trainingProgress?.skillProgress?.map((sp: any) => (
                                            <Card key={sp.id} className="p-6 rounded-3xl border border-white/5 bg-card shadow-xl flex items-center gap-6 group hover:border-primary/20 transition-all">
                                                <div className="p-2 bg-white/5 rounded-2xl transition-transform group-hover:scale-110">
                                                    <SkillIconOverlay icon={sp.skills?.icon || '⚽'} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-bold text-lg text-white">{sp.skills?.name}</h4>
                                                        {sp.is_completed && <Badge className="bg-primary/20 text-primary border-none font-black text-[9px] px-2 py-0.5 uppercase tracking-widest">{t("analysis.mastered")}</Badge>}
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <Progress value={(sp.completed_levels?.length || 0) / 3 * 100} className="h-2 flex-1 shadow-inner h-2.5" />
                                                        <span className="text-[11px] text-muted-foreground font-black tracking-widest">{sp.completed_levels?.length || 0}/3</span>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
};
