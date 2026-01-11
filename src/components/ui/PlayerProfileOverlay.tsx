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
    Trophy
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
            console.log("Fetching detailed videos for player:", playerId);
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
                .limit(3);

            if (error) {
                console.error("Error fetching detailed videos:", error);
                throw error;
            }
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

        if (isOpen) {
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
                .single();

            const { data: skillProgress } = await supabase
                .from('player_skill_progress')
                .select('*, skills (name, icon)')
                .eq('player_id', playerId);

            return { progress, skillProgress: skillProgress || [] };
        },
        enabled: !!playerId && isOpen,
    });

    // Use selected analysis metrics if available, otherwise fall back to player metrics
    const displayMetrics = selectedAnalysis ? {
        stability: selectedAnalysis.stability || 0,
        power: selectedAnalysis.power || 0,
        technique: selectedAnalysis.technique || 0,
        balance: selectedAnalysis.balance || 0
    } : (player.metrics || {
        stability: 0,
        power: 0,
        technique: 0,
        balance: 0
    });

    const displayScore = selectedAnalysis?.overall || player.latest_score || 0;
    const isHistorical = selectedVideoIndex > 0;

    if (!player) return null;

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    const trendValue = player.trend || 0;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl w-[95vw] md:w-full max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 border-none shadow-2xl bg-slate-50">
                <DialogHeader className="p-4 md:p-8 bg-white border-b flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <User className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl md:text-3xl font-bold tracking-tight text-slate-900">{player.name}</DialogTitle>
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1">
                                <Badge className="bg-primary/10 text-primary border-none font-semibold uppercase tracking-wider text-[10px]">
                                    {player.position || 'Prospect'}
                                </Badge>
                                <span className="hidden md:inline text-slate-400 font-bold">•</span>
                                <span className="text-slate-500 text-[10px] md:text-sm font-semibold uppercase tracking-widest">{player.age || '?'} Years Old</span>
                                {teamName && (
                                    <>
                                        <span className="hidden md:inline text-slate-400 font-bold">•</span>
                                        <span className="text-slate-900 text-[10px] md:text-sm font-semibold uppercase tracking-widest">{teamName}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <Tabs defaultValue="overview" className="w-full">
                        <div className="px-4 md:px-8 pt-4 md:pt-6 bg-white border-b sticky top-0 z-10">
                            <TabsList className="grid w-full max-w-md grid-cols-3">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="videos">Videos</TabsTrigger>
                                <TabsTrigger value="training">Training</TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="p-8">
                            <div className="grid lg:grid-cols-12 gap-8">
                                {/* Left Column: Video & Feedback */}
                                <div className="lg:col-span-8 space-y-8">
                                    {/* Video Section */}
                                    <div className="bg-slate-900 rounded-[2rem] overflow-hidden aspect-video shadow-2xl border-4 border-white relative group">
                                        {selectedVideoUrl ? (
                                            <video
                                                src={selectedVideoUrl}
                                                controls
                                                className="w-full h-full object-contain"
                                                poster="/placeholder.svg"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                                                <PlayCircle className="h-16 w-16 opacity-20" />
                                                <p className="font-bold uppercase tracking-widest text-xs">Waiting for Analysis Data...</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Feedback & Tags Section */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                                            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-primary" />
                                                AI Insights
                                            </h3>
                                            <p className="text-slate-600 text-sm leading-relaxed font-medium">
                                                {selectedAnalysis?.feedback || "No detailed feedback available for this session yet."}
                                            </p>
                                        </div>

                                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
                                            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-primary" />
                                                Performance DNA
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedAnalysis?.tags && selectedAnalysis.tags.length > 0 ? (
                                                    selectedAnalysis.tags.map((tag: string, i: number) => (
                                                        <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-700 border-none font-semibold py-1 px-3">
                                                            {tag.replace(/_/g, ' ')}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <p className="text-slate-400 text-xs italic">Analyzing technical traits...</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Stats Only (History moved to its own tab) */}
                                <div className="lg:col-span-4 space-y-8">
                                    {/* Score Card */}
                                    <div className="bg-primary rounded-[2rem] p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
                                        <Trophy className="absolute -right-4 -bottom-4 h-32 w-32 opacity-10 rotate-12" />
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 mb-1">
                                                {isHistorical ? "Session Score" : "Current Rating"}
                                            </p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-7xl font-bold tracking-tighter text-white">{displayScore.toFixed(0)}</span>
                                                <span className="text-xl font-bold text-white/40">/100</span>
                                            </div>
                                            {!isHistorical && trendValue !== 0 && (
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold mt-4 ${trendValue > 0 ? 'bg-white text-primary' : 'bg-red-500 text-white'}`}>
                                                    {trendValue > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                                                    {Math.abs(trendValue).toFixed(1)}% Performance Swap
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-8 space-y-4 relative z-10">
                                            {[
                                                { label: "Stability", value: displayMetrics.stability },
                                                { label: "Power", value: displayMetrics.power },
                                                { label: "Technique", value: displayMetrics.technique },
                                                { label: "Balance", value: displayMetrics.balance }
                                            ].map((m) => (
                                                <div key={m.label} className="space-y-1">
                                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/90">
                                                        <span>{m.label}</span>
                                                        <span className="text-white">{m.value.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-white transition-all"
                                                            style={{ width: `${m.value}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 flex flex-col gap-2 opacity-40 hover:opacity-100 transition-opacity">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Legal Reference</p>
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={() => window.open('/terms', '_blank')}
                                                className="text-[10px] text-slate-500 hover:text-primary transition-colors text-left"
                                            >
                                                Terms of Service
                                            </button>
                                            <button
                                                onClick={() => window.open('/privacy', '_blank')}
                                                className="text-[10px] text-slate-500 hover:text-primary transition-colors text-left"
                                            >
                                                Privacy Policy
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Videos Tab */}
                        <TabsContent value="videos" className="p-8">
                            <div className="max-w-3xl mx-auto space-y-6">
                                <h3 className="text-lg font-semibold mb-4">Training History</h3>
                                <div className="space-y-3">
                                    {loadingVideos ? (
                                        [1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)
                                    ) : recentVideos.map((video, idx) => (
                                        <div
                                            key={video.id}
                                            onClick={() => setSelectedVideoIndex(idx)}
                                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${selectedVideoIndex === idx
                                                ? 'bg-white border-primary shadow-lg scale-[1.02]'
                                                : 'bg-white border-transparent hover:border-slate-200'
                                                }`}
                                        >
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${selectedVideoIndex === idx ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                <PlayCircle className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">
                                                    {format(new Date(video.uploaded_at), 'MMMM dd, yyyy')}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {idx === 0 ? 'Latest Upload' : `Session #${recentVideos.length - idx}`}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-lg font-bold ${getScoreColor(video.analyses?.[0]?.overall || 0)}`}>
                                                    {video.analyses?.[0]?.overall?.toFixed(0) || '-'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Score</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Training Tab */}
                        <TabsContent value="training" className="p-8">
                            <div className="space-y-8">
                                {/* Training Stats */}
                                <div className="grid md:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-2xl p-6 border-2 border-slate-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Trophy className="h-5 w-5 text-primary" />
                                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total XP</p>
                                        </div>
                                        <p className="text-3xl font-bold text-slate-900">{(trainingProgress as any)?.progress?.total_xp || 0}</p>
                                    </div>

                                    <div className="bg-white rounded-2xl p-6 border-2 border-slate-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <TrendingUp className="h-5 w-5 text-primary" />
                                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Level</p>
                                        </div>
                                        <p className="text-3xl font-bold text-slate-900">{(trainingProgress as any)?.progress?.level || 1}</p>
                                    </div>

                                    <div className="bg-white rounded-2xl p-6 border-2 border-slate-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <p className="text-lg">🔥</p>
                                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Streak</p>
                                        </div>
                                        <p className="text-3xl font-bold text-orange-500">{(trainingProgress as any)?.progress?.current_streak || 0} Days</p>
                                    </div>

                                    <div className="bg-white rounded-2xl p-6 border-2 border-slate-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <p className="text-lg">✅</p>
                                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Skills</p>
                                        </div>
                                        <p className="text-3xl font-bold text-slate-900">
                                            {trainingProgress?.skillProgress?.filter((sp: any) => sp.is_completed).length || 0}/10
                                        </p>
                                    </div>
                                </div>

                                {/* Skills Progress */}
                                <div>
                                    <h3 className="text-xl font-bold mb-4">Skills Progress</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {trainingProgress?.skillProgress?.map((sp: any) => (
                                            <div key={sp.id} className="p-4 rounded-xl border bg-white flex items-center gap-4">
                                                <div className="text-3xl p-2 bg-slate-50 rounded-lg">
                                                    {sp.skills?.icon || '⚽'}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-bold text-slate-900">{sp.skills?.name}</h4>
                                                        {sp.is_completed && <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">COMPLETED</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={(sp.completed_levels?.length || 0) / 3 * 100} className="h-2 flex-1" />
                                                        <span className="text-xs text-muted-foreground font-medium">{sp.completed_levels?.length || 0}/3</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {(!trainingProgress?.skillProgress || trainingProgress.skillProgress.length === 0) && (
                                            <div className="col-span-2 text-center py-12 text-muted-foreground bg-slate-50 rounded-2xl border-2 border-dashed">
                                                No training skills started yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
