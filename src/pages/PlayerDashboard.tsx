import { useState, useEffect, useMemo } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Trophy, Loader2, Video, AlertCircle, Plus, X, Users, Check, XCircle, LogOut, ChevronRight, ChevronUp, ChevronDown, Play, Activity, TrendingUp, Award, Flame, Target, Crosshair, Footprints, Shield, Dumbbell, Brain, Star, Zap, Swords, Goal, CircleDot, Gauge, HeartPulse, Clock, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { TeamProfileOverlay } from "@/components/ui/TeamProfileOverlay";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { useDemoContext, useDemoMutationGuard } from "@/demo";

const emojiToIcon: Record<string, LucideIcon> = {
  '⚽': Goal, '🎯': Crosshair, '🏃': Footprints, '🦶': CircleDot,
  '🔥': Flame, '💪': Dumbbell, '🧠': Brain, '🛡️': Shield, '🛡': Shield,
  '⭐': Star, '🏆': Trophy, '⚡': Zap, '🎮': Swords,
  '🤾': HeartPulse, '🧘': Gauge,
};

const SkillIconDash = ({ icon, size = 'md' }: { icon: string; size?: 'sm' | 'md' | 'lg' }) => {
  const IconComponent = emojiToIcon[icon] || Target;
  const sizeMap = { sm: 'w-8 h-8 rounded-lg', md: 'w-12 h-12 rounded-xl', lg: 'w-14 h-14 rounded-xl' };
  const iconMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-7 w-7' };
  return (
    <div className={`${sizeMap[size]} bg-[#9FE870]/10 flex items-center justify-center shrink-0`}>
      <IconComponent className={`${iconMap[size]} text-[#9FE870]`} />
    </div>
  );
};

interface VideoRecord {
  id: string;
  filename: string;
  status: string;
  uploaded_at: string;
}

interface Analysis {
  id: string;
  video_id: string;
  stability: number;
  power: number;
  technique: number;
  balance: number;
  overall: number;
  feedback: string;
  tags: string[];
}

export default function PlayerDashboard() {
  const { t } = useTranslation("dashboard");
  const { user, isLoaded } = useCurrentUser();
  const demo = useDemoContext();
  const { isDemo, guard: guardMutation } = useDemoMutationGuard();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const demoNav = (path: string) => isDemo ? `/demo${path}` : path;

  // State
  const [uploading, setUploading] = useState(false);
  const [latestVideoUrl, setLatestVideoUrl] = useState<string>("");
  const [localUser, setLocalUser] = useState<any>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>("");
  const [selectedTeamProfileId, setSelectedTeamProfileId] = useState<string | null>(null);
  const [teamProfileOpen, setTeamProfileOpen] = useState(false);
  const [recommendedTraining, setRecommendedTraining] = useState<any[]>([]);
  const [showAllVideos, setShowAllVideos] = useState(false);

  // Metadata state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cameraAngle, setCameraAngle] = useState<string>("unknown");
  const [kickingFoot, setKickingFoot] = useState<string>("unknown");



  // 1. Fetch DB User
  const { data: dbUser, isLoading: loadingUser } = useQuery({
    queryKey: ['db-user', user?.id],
    queryFn: async () => {
      if (demo) return demo.coachProfile;
      if (!user) return null;

      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      return existingUser;
    },
    enabled: !!user || !!demo,
  });

  // 2. Fetch Videos
  const { data: videos = [] } = useQuery({
    queryKey: ['videos', dbUser?.id],
    queryFn: async () => {
      if (demo) return demo.videos;
      if (!dbUser?.id) return [];
      const { data, error } = await supabase
        .from('videos')
        .select('id, filename, status, uploaded_at')
        .eq('user_id', dbUser.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!dbUser?.id,
    refetchInterval: (query) => {
      const hasProcessing = (query.state.data as any[])?.some((v: any) => v.status === 'processing');
      return hasProcessing ? 5000 : false;
    }
  });

  // 3. Fetch Latest Analysis
  const latestCompletedVideoId = useMemo(() =>
    videos.find(v => (v as any).status === 'completed')?.id,
    [videos]);

  const { data: latestAnalysis } = useQuery({
    queryKey: ['analysis', latestCompletedVideoId],
    queryFn: async () => {
      if (demo) return demo.latestAnalysis;
      if (!latestCompletedVideoId) return null;
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('video_id', latestCompletedVideoId)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!latestCompletedVideoId || !!demo,
  });

  // 4. Fetch Training Progress
  const { data: trainingStats } = useQuery({
    queryKey: ['training-stats', dbUser?.id],
    queryFn: async () => {
      if (demo) return demo.trainingStats;
      if (!dbUser?.id) return null;
      const { data: progress } = await supabase
        .from('player_progress')
        .select('*')
        .eq('player_id', dbUser.id)
        .single();

      const { data: skills } = await supabase
        .from('player_skill_progress')
        .select('*')
        .eq('player_id', dbUser.id);

      return { progress, skills: skills || [] };
    },
    enabled: !!dbUser?.id || !!demo
  });

  const analyses = useMemo(() => videos.filter((v: any) => v.status === 'completed'), [videos]);

  // 5. Fetch AI Recommendations based on latest analysis
  const { data: latestRecommendations = [] } = useQuery({
    queryKey: ['latest-recommendations', latestAnalysis?.id],
    queryFn: async () => {
      if (demo) return demo.latestRecommendations as any[];
      if (!latestAnalysis || !dbUser?.id) return [];

      const scores = {
        stability: (latestAnalysis as any)?.stability || 0,
        power: (latestAnalysis as any)?.power || 0,
        technique: (latestAnalysis as any)?.technique || 0,
        balance: (latestAnalysis as any)?.balance || 0
      };

      try {
        const recommendations: any[] = [];

        // 1. Check stability/balance
        if (scores.stability < 60 || scores.balance < 60) {
          const { data: skillData } = await supabase
            .from('skills')
            .select('id')
            .eq('name', 'Balance & Core')
            .single();

          if (skillData) {
            const { data } = await supabase
              .from('skill_levels' as any)
              .select(`
                *,
                skills (name, icon)
              `)
              .eq('skill_id', (skillData as any).id)
              .in('level_name', ['beginner', 'intermediate'])
              .order('level_order');
            if (data) recommendations.push(...(data as any[]));
          }
        }

        // 2. Check power
        if (scores.power < 60) {
          const { data: skillData } = await supabase
            .from('skills')
            .select('id')
            .eq('name', 'Speed & Acceleration')
            .single();

          if (skillData) {
            const { data } = await supabase
              .from('skill_levels' as any)
              .select(`
                *,
                skills (name, icon)
              `)
              .eq('skill_id', (skillData as any).id)
              .in('level_name', ['beginner', 'intermediate'])
              .order('level_order');
            if (data) recommendations.push(...(data as any[]));
          }
        }

        // 3. Check technique
        if (scores.technique < 60) {
          const { data: skillData } = await supabase
            .from('skills')
            .select('id')
            .eq('name', 'Shooting Precision')
            .single();

          if (skillData) {
            const { data } = await supabase
              .from('skill_levels' as any)
              .select(`
                *,
                skills (name, icon)
              `)
              .eq('skill_id', (skillData as any).id)
              .in('level_name', ['beginner'])
              .order('level_order');
            if (data) recommendations.push(...(data as any[]));
          }
        }

        // Always show something: if no metric was weak enough to trigger a specific
        // recommendation above, fall back to a generic skill so the section never sits empty.
        if (recommendations.length === 0) {
          const { data: fallbackSkill } = await supabase
            .from('skills')
            .select('id')
            .order('order_index')
            .limit(1)
            .maybeSingle();
          if (fallbackSkill) {
            const { data } = await supabase
              .from('skill_levels' as any)
              .select(`*, skills (name, icon)`)
              .eq('skill_id', (fallbackSkill as any).id)
              .eq('level_name', 'beginner')
              .order('level_order');
            if (data) recommendations.push(...(data as any[]));
          }
        }

        return recommendations.slice(0, 3);
      } catch (error) {
        console.error('Error getting recommendations:', error);
        return [];
      }
    },
    enabled: (!!latestAnalysis && !!dbUser?.id) || !!demo,
  });

  // 4. Fetch My Teams
  const { data: myTeams = [], isLoading: loadingTeams } = useQuery({
    queryKey: ['my-teams', dbUser?.id],
    queryFn: async () => {
      if (demo) return demo.myTeams;
      if (!dbUser?.id) return [];
      const { data, error } = await supabase
        .from('team_rosters')
        .select(`
          id,
          status,
          team_id,
          teams (
            id,
            name,
            age_group,
            clubs (name)
          )
        `)
        .eq('player_id', dbUser.id)
        .in('status', ['active', 'pending']);

      if (error) throw error;

      return (data as any[])?.map(item => ({
        roster_id: item.id,
        team_id: (item.teams as any).id,
        team_name: (item.teams as any).name,
        age_group: (item.teams as any).age_group,
        club_name: (item.teams as any).clubs?.name,
        status: item.status
      })) || [];
    },
    enabled: !!dbUser?.id || !!demo,
    refetchInterval: demo ? false : 3000,
  });

  // Sync local editing state
  useEffect(() => {
    const userProfile = dbUser as any;
    if (userProfile) {
      setLocalUser(userProfile);
    }
  }, [dbUser]);

  // Fetch signed URL for latest video
  useEffect(() => {
    if (demo && latestCompletedVideoId) {
      const video = demo.videos.find((v: any) => v.id === latestCompletedVideoId);
      setLatestVideoUrl(video ? `/${video.storage_path}` : "");
      return;
    }
    if (!latestCompletedVideoId) {
      console.log('latestCompletedVideoId is null — no completed video found among:', videos.map((v: any) => ({ id: v.id, status: v.status })));
      return;
    }

    const fetchUrl = async () => {
      const { data: videoData } = await supabase
        .from('videos')
        .select('storage_path')
        .eq('id', latestCompletedVideoId)
        .single();

      if (videoData) {
        console.log('Found storage_path:', (videoData as any).storage_path, 'for video id:', latestCompletedVideoId);
        const { data: urlData, error: urlError } = await supabase.storage
          .from('videos')
          .createSignedUrl((videoData as any).storage_path, 3600);
        if (urlError) console.error('createSignedUrl failed:', urlError, 'bucket: videos', 'path:', (videoData as any).storage_path);
        if (urlData) setLatestVideoUrl(urlData.signedUrl);
      }
    };
    fetchUrl();
  }, [latestCompletedVideoId, demo]);

  const updateProfile = async (field: string, value: any) => {
    if (guardMutation()) return;
    if (!dbUser?.id) return;

    try {
      const { error } = await (supabase
        .from('users') as any)
        .update({ [field]: value })
        .eq('id', dbUser.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: `${field.charAt(0).toUpperCase() + field.slice(1)} saved.`,
      });

      queryClient.invalidateQueries({ queryKey: ['db-user', user?.id] });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (guardMutation()) return;
    const file = event.target.files?.[0];
    if (!file) return;

    if (!dbUser?.id) {
      toast({
        title: "Authentication Error",
        description: "Please sign in to upload videos.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB",
        variant: "destructive"
      });
      return;
    }

    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload MP4, MOV, AVI, or MKV",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile || !dbUser?.id) return;
    const file = selectedFile;
    setUploading(true);
    console.log("Starting upload:", file.name);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${dbUser.id}/${fileName}`;

      console.log("Uploading to storage:", filePath);
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file);

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

      console.log("✓ Upload successful");

      const { data: newVideo, error: dbError } = await (supabase
        .from('videos') as any)
        .insert({
          user_id: dbUser.id,
          storage_path: filePath,
          filename: file.name,
          file_size_mb: file.size / (1024 * 1024),
          status: 'processing'
        })
        .select()
        .single();

      if (dbError) {
        console.error("DB insert error:", dbError);
        throw dbError;
      }

      console.log("✓ Video record created:", (newVideo as any).id);

      // 3. Call Edge Function to process video securely
      try {
        console.log('Calling process-video Edge Function...');

        const { data: functionData, error: functionError } = await supabase.functions.invoke('process-video', {
          body: {
            video_id: (newVideo as any).id,
            camera_angle: cameraAngle,
            kicking_foot: kickingFoot
          }
        });

        if (functionError) {
          console.error("Edge Function error:", functionError);
          // Sometimes error is returned in body
          throw new Error(functionError.message || 'Error from edge function');
        }

        if (functionData?.error) {
          throw new Error(functionData.error);
        }

        console.log('✓ Edge Function analysis complete');

        toast({
          title: "Analysis Complete! 🎉",
          description: "Your kick has been analyzed successfully.",
        });

      } catch (mlError: any) {
        console.error('❌ ML processing failed via Edge Function:', mlError);

        // Mark video as failed
        await (supabase
          .from('videos') as any)
          .update({ status: 'failed' })
          .eq('id', (newVideo as any).id);

        toast({
          title: "Analysis Failed",
          description: mlError.message || "Could not analyze video due to a timeout or error. Video is saved but analysis failed.",
          variant: "destructive"
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['videos', dbUser.id] });
      setUploadModalOpen(false);
      setSelectedFile(null); // Reset file state

    } catch (error: any) {
      console.error("❌ Upload failed:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // event.target.value = ''; // This was from the old handleFileUpload, not needed here
    }
  };

  const getRecommendedTraining = async (scores: any) => {
    if (!dbUser?.id) return [];

    try {
      const recommendations: any[] = [];

      // 1. Check stability/balance
      if (scores.stability < 60 || scores.balance < 60) {
        const { data: skillData } = await supabase
          .from('skills')
          .select('id')
          .eq('name', 'Balance & Core')
          .single();

        if (skillData) {
          const { data } = await supabase
            .from('skill_levels' as any)
            .select(`
              *,
              skills (name, icon)
            `)
            .eq('skill_id', (skillData as any).id)
            .in('level_name', ['beginner', 'intermediate'])
            .order('level_order');
          if (data) recommendations.push(...(data as any[]));
        }
      }

      // 2. Check power
      if (scores.power < 60) {
        const { data: skillData } = await supabase
          .from('skills')
          .select('id')
          .eq('name', 'Speed & Acceleration')
          .single();

        if (skillData) {
          const { data } = await supabase
            .from('skill_levels' as any)
            .select(`
              *,
              skills (name, icon)
            `)
            .eq('skill_id', (skillData as any).id)
            .in('level_name', ['beginner', 'intermediate'])
            .order('level_order');
          if (data) recommendations.push(...(data as any[]));
        }
      }

      // 3. Check technique
      if (scores.technique < 60) {
        const { data: skillData } = await supabase
          .from('skills')
          .select('id')
          .eq('name', 'Shooting Precision')
          .single();

        if (skillData) {
          const { data } = await supabase
            .from('skill_levels' as any)
            .select(`
              *,
              skills (name, icon)
            `)
            .eq('skill_id', (skillData as any).id)
            .in('level_name', ['beginner'])
            .order('level_order');
          if (data) recommendations.push(...(data as any[]));
        }
      }

      return recommendations.slice(0, 3);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  };

  // Open results modal instantly, then fetch data
  const openResultsModal = (videoId: string) => {
    // Clear previous data and open modal immediately
    setSelectedAnalysis(null);
    setSelectedVideoUrl("");
    setRecommendedTraining([]);
    setSelectedVideoId(videoId);
    setResultsModalOpen(true);
  };

  // Fetch data when modal is opened
  useEffect(() => {
    if (!resultsModalOpen || !selectedVideoId) return;

    const fetchResultsData = async () => {
      setLoadingResults(true);

      if (demo) {
        const demoAnalysis = demo.analyses.find(a => a.video_id === selectedVideoId);
        if (demoAnalysis) {
          setSelectedAnalysis(demoAnalysis);
          const video = demo.videos.find((v: any) => v.id === selectedVideoId);
          setSelectedVideoUrl(video ? `/${video.storage_path}` : "");
          setRecommendedTraining([]);
        }
        setLoadingResults(false);
        return;
      }

      try {
        // Fetch analysis
        const { data: analysisData, error: analysisError } = await supabase
          .from('analyses')
          .select('*')
          .eq('video_id', selectedVideoId)
          .single();

        if (analysisError) throw analysisError;
        setSelectedAnalysis(analysisData);

        // Fetch video URL
        const { data: videoData, error: videoError } = await supabase
          .from('videos')
          .select('storage_path')
          .eq('id', selectedVideoId)
          .single();

        if (videoError) throw videoError;

        const { data: urlData, error: urlError } = await supabase.storage
          .from('videos')
          .createSignedUrl((videoData as any).storage_path, 3600);

        if (urlError) throw urlError;
        setSelectedVideoUrl(urlData.signedUrl);

        // Get recommendations
        const scores = {
          stability: (analysisData as any)?.stability || 0,
          power: (analysisData as any)?.power || 0,
          technique: (analysisData as any)?.technique || 0,
          balance: (analysisData as any)?.balance || 0
        };
        const recommendations = await getRecommendedTraining(scores);
        setRecommendedTraining(recommendations);

      } catch (error: any) {
        console.error('Error loading results:', error);
        toast({
          title: "Error",
          description: "Could not load analysis results.",
          variant: "destructive"
        });
      } finally {
        setLoadingResults(false);
      }
    };

    fetchResultsData();
  }, [resultsModalOpen, selectedVideoId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-amber-400";
    return "text-destructive";
  };

  const handleLeaveTeam = async (rosterId: string, teamName: string) => {
    if (guardMutation()) return;
    if (!confirm(`Are you sure you want to leave ${teamName}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('team_rosters')
        .delete()
        .eq('id', rosterId);

      if (error) throw error;

      toast({
        title: "Left Team",
        description: `You have left ${teamName}`,
      });

      if (dbUser?.id) {
        queryClient.invalidateQueries({ queryKey: ['my-teams', dbUser.id] });
      }

    } catch (error: any) {
      console.error('Error leaving team:', error);
      toast({
        title: "Error",
        description: "Could not leave team",
        variant: "destructive"
      });
    }
  };



  if (!isLoaded || loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-card">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{t("status.loading", { ns: "common" })}</p>
        </div>
      </div>
    );
  }

  if (!dbUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Connection Error</h2>
            <p className="text-muted-foreground">
              Could not load your profile. Please check your internet connection and try again.
            </p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container px-4 md:px-6 py-6 md:py-8 space-y-8 max-w-[1600px] mx-auto">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-gradient">
            {t("overview.title")}
          </h1>
          <p className="text-muted-foreground font-medium">
            {t("overview.welcome", { name: user?.firstName || user?.username || t("player.defaultName") })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setUploadModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-black font-bold h-11 px-6 rounded-xl hover:scale-105 transition-transform"
          >
            <Plus className="h-5 w-5 mr-2" />
            {t("player.uploadVideo")}
          </Button>
        </div>
      </div>

      {/* Stats Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="bg-card border-white/5 shadow-xl shadow-black/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.level")}</p>
                <p className="text-2xl font-bold">{trainingStats?.progress?.level || 1}</p>
              </div>
              <Trophy className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/5 shadow-xl shadow-black/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.streak")}</p>
                <p className="text-2xl font-bold">{trainingStats?.progress?.current_streak || 0} {t("player.training.dayStreak")}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/5 shadow-xl shadow-black/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.xp")}</p>
                <p className="text-2xl font-bold">{trainingStats?.progress?.total_xp?.toLocaleString() || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/5 shadow-xl shadow-black/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.avgScore")}</p>
                <p className="text-2xl font-bold">
                  {analyses.length > 0
                    ? (analyses.reduce((acc, a) => acc + (a.overall || 0), 0) / analyses.length).toFixed(1)
                    : '0.0'}
                </p>
              </div>
              <Award className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Column 1 & 2: Main Content */}
        <div className="lg:col-span-2 space-y-8 lg:order-1 order-2">
          {latestAnalysis ? (
            <Card className="border-2 border-primary/30 shadow-xl shadow-primary/5">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{t("player.latestAnalysis.title")}</CardTitle>
                  <Button onClick={() => setUploadModalOpen(true)} size="sm" className="rounded-full px-6">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("player.latestAnalysis.newAnalysis")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid xl:grid-cols-2 gap-8">
                  {/* Video */}
                  <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-gray-800 text-white">
                    <video
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-contain"
                      src={latestVideoUrl}
                    />
                  </div>

                  {/* Stats */}
                  <div className="space-y-6">
                    {/* Overall Score */}
                    <div className="text-center p-6 bg-primary/5 rounded-2xl border border-primary/10">
                      <p className="text-sm text-muted-foreground mb-1">{t("player.latestAnalysis.overallScore")}</p>
                      <div className={`text-6xl font-black ${getScoreColor(latestAnalysis.overall)}`}>
                        {latestAnalysis.overall.toFixed(1)}
                      </div>
                    </div>

                    {/* Individual Scores */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2 font-medium">
                          <span className="text-muted-foreground">{t("player.latestAnalysis.metrics.stability")}</span>
                          <span className={getScoreColor(latestAnalysis.stability)}>
                            {latestAnalysis.stability.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={latestAnalysis.stability} className="h-2.5" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2 font-medium">
                          <span className="text-muted-foreground">{t("player.latestAnalysis.metrics.power")}</span>
                          <span className={getScoreColor(latestAnalysis.power)}>
                            {latestAnalysis.power.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={latestAnalysis.power} className="h-2.5" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2 font-medium">
                          <span className="text-muted-foreground">{t("player.latestAnalysis.metrics.technique")}</span>
                          <span className={getScoreColor(latestAnalysis.technique)}>
                            {latestAnalysis.technique.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={latestAnalysis.technique} className="h-2.5" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2 font-medium">
                          <span className="text-muted-foreground">{t("player.latestAnalysis.metrics.balance")}</span>
                          <span className={getScoreColor(latestAnalysis.balance)}>
                            {latestAnalysis.balance.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={latestAnalysis.balance} className="h-2.5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Recommendations */}
                {latestRecommendations.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-primary/10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Trophy className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold">{t("player.latestAnalysis.recommendations.title")}</h3>
                        <p className="text-xs text-muted-foreground">{t("player.latestAnalysis.recommendations.description")}</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {latestRecommendations.map((level: any) => (
                        <Card
                          key={level.id}
                          className="cursor-pointer hover:border-primary/50 transition-all group bg-card border-primary/5 overflow-hidden shadow-lg shadow-black/20"
                          onClick={() => {
                            navigate(demoNav(`/training?tab=exercises&skill=${level.skill_id}&level=${level.level_name}`));
                          }}
                        >
                          <CardContent className="p-4 text-white">
                            <div className="flex items-center gap-4">
                              <div className="transition-all duration-500 transform group-hover:scale-110">
                                <SkillIconDash icon={level.skills?.icon || '⚽'} size="lg" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm group-hover:text-primary transition-colors text-white">
                                  {level.skills?.name}
                                </h4>
                                <p className="text-[10px] text-muted-foreground line-clamp-1 mb-2">
                                  {level.video_title}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[9px] px-2 py-0 h-4 uppercase font-black tracking-tighter">
                                    {level.level_name}
                                  </Badge>
                                  <span className="text-[9px] font-bold text-primary">+{level.xp_reward} XP</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
              <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[450px] text-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Upload className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3 italic tracking-tight">{t("player.latestAnalysis.empty.title")}</h3>
                <p className="text-muted-foreground mb-10 max-w-sm text-lg leading-relaxed">
                  {t("player.latestAnalysis.empty.description")}
                </p>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="rounded-full px-12 h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform bg-primary text-black flex items-center justify-center"
                >
                  <Plus className="h-6 w-6 mr-3" />
                  {t("player.latestAnalysis.empty.button")}
                </button>
              </CardContent>
            </Card>
          )}

          <Card className="bg-primary/5 border-primary/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-16 translate-x-16 blur-3xl" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex justify-center pt-1">
                  <AlertCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-primary italic uppercase tracking-tighter">{t("player.tips.title")}</h4>
                  <p className="text-muted-foreground mt-2 leading-relaxed">
                    {t("player.tips.description")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* History Section moved here or stays in 3rd col? The design had it in Column 1 (Narrow) before. Let's stick to the 3-col grid requested logic if any. */}
          {/* Previous design had History in Column 1, so let's put it back if needed. */}
          <div>
            <h2 className="text-xl font-bold mb-4">{t("player.allAnalyses")}</h2>
            {videos.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>{t("player.noVideos")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {(showAllVideos ? videos : videos.slice(0, 4)).map((video: any) => (
                    <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow border-primary/10 bg-card/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
                            <Video className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate text-sm">{video.filename}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <span>{new Date(video.uploaded_at).toLocaleDateString()}</span>
                              <Badge variant={video.status === 'completed' ? 'default' : video.status === 'processing' ? 'secondary' : 'destructive'} className="scale-75 origin-left">
                                {video.status === 'processing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                {video.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={video.status !== 'completed'}
                          onClick={() => openResultsModal(video.id)}
                          className="w-full mt-4 text-xs font-bold rounded-lg border-primary/20 hover:bg-primary/5 transition-colors"
                        >
                          {video.status === 'completed' ? t("player.viewResults") : t("player.processing")}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {videos.length > 4 && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllVideos(!showAllVideos)}
                      className="text-muted-foreground hover:text-foreground text-xs font-bold"
                    >
                      {showAllVideos ? (
                        <>{t("player.showLess")} <ChevronUp className="ml-2 h-4 w-4" /></>
                      ) : (
                        <>{t("player.showMore", { count: videos.length - 4 })} <ChevronDown className="ml-2 h-4 w-4" /></>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Sidebar (Standard) */}
        <div className="space-y-6 lg:order-3 order-3">

          <Card className="border border-primary/10 bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {t("player.profile.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">{t("player.profile.age")}</label>
                  <input
                    type="number"
                    min="0"
                    className="flex h-9 w-full rounded-xl border border-input bg-background/50 px-3 py-1 text-sm focus:border-primary/50 transition-colors"
                    value={localUser?.age || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setLocalUser({ ...localUser, age: isNaN(val) ? null : Math.max(0, val) });
                    }}
                    onBlur={() => updateProfile('age', localUser?.age)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">{t("player.profile.position")}</label>
                  <Select
                    value={localUser?.position || ''}
                    onValueChange={(value) => {
                      setLocalUser({ ...localUser, position: value });
                      updateProfile('position', value);
                    }}
                  >
                    <SelectTrigger className="h-9 rounded-xl bg-background/50 text-xs">
                      <SelectValue placeholder={t("player.profile.position")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Forward">{t("player.profile.positions.forward")}</SelectItem>
                      <SelectItem value="Midfielder">{t("player.profile.positions.midfielder")}</SelectItem>
                      <SelectItem value="Defender">{t("player.profile.positions.defender")}</SelectItem>
                      <SelectItem value="Goalkeeper">{t("player.profile.positions.goalkeeper")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">{t("player.profile.club")}</label>
                <input
                  type="text"
                  className="flex h-9 w-full rounded-xl border border-input bg-background/50 px-3 py-1 text-sm focus:border-primary/50 transition-colors"
                  value={localUser?.club || ''}
                  onChange={(e) => setLocalUser({ ...localUser, club: e.target.value })}
                  onBlur={() => updateProfile('club', localUser?.club)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">{t("player.profile.height")}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="flex h-9 w-full rounded-xl border border-input bg-background/50 px-3 py-1 text-sm focus:border-primary/50 transition-colors"
                    value={localUser?.height || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setLocalUser({ ...localUser, height: isNaN(val) ? null : Math.max(0, val) });
                    }}
                    onBlur={() => updateProfile('height', localUser?.height)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">{t("player.profile.weight")}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="flex h-9 w-full rounded-xl border border-input bg-background/50 px-3 py-1 text-sm focus:border-primary/50 transition-colors"
                    value={localUser?.weight || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setLocalUser({ ...localUser, weight: isNaN(val) ? null : Math.max(0, val) });
                    }}
                    onBlur={() => updateProfile('weight', localUser?.weight)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t("player.profile.legal")}</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => window.open('/terms', '_blank')}
                    className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-between group"
                  >
                    {t("player.profile.terms")}
                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                  </button>
                  <button
                    onClick={() => window.open('/privacy', '_blank')}
                    className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-between group"
                  >
                    {t("player.profile.privacy")}
                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0 pb-6 px-6">
              <Button
                variant="outline"
                className="w-full rounded-xl border-primary/20 hover:bg-primary/5 hover:text-primary transition-all font-bold"
                onClick={() => navigate(demoNav('/join-team'))}
              >
                <Users className="h-4 w-4 mr-2" />
                {t("player.teams.join")}
              </Button>
            </CardFooter>
          </Card>


          <Card className="border border-primary/10">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {t("player.teams.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingTeams ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : myTeams.length > 0 ? (
                <div className="space-y-3">
                  {myTeams.map((team) => (
                    <div key={team.roster_id} className="group bg-muted/30 hover:bg-muted/50 rounded-2xl p-4 transition-colors border border-transparent hover:border-primary/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{team.team_name}</p>
                          <p className="text-[10px] text-gray-300 font-medium uppercase tracking-wider">
                            {team.club_name} • {team.age_group}
                          </p>
                        </div>
                        <Badge variant={team.status === 'active' ? 'default' : 'secondary'} className="rounded-md scale-90">
                          {team.status}
                        </Badge>
                      </div>

                      {team.status === 'active' && (
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 rounded-xl text-xs font-bold h-8"
                            onClick={() => {
                              setSelectedTeamProfileId(team.team_id);
                              setTeamProfileOpen(true);
                            }}
                          >
                            {t("player.teams.teamPage")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-10 rounded-xl text-muted-foreground hover:text-red-500 h-8"
                            onClick={() => handleLeaveTeam(team.roster_id, team.team_name)}
                          >
                            <LogOut className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-muted/20 rounded-2xl border border-dashed">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-xs font-medium text-muted-foreground">{t("player.teams.notJoined")}</p>
                  <Button variant="link" size="sm" className="mt-1 text-primary text-xs" onClick={() => navigate(demoNav('/join-team'))}>
                    {t("player.teams.findClub")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Training Progress Card */}
          <Card className="overflow-hidden">
            <div className="h-1.5 bg-primary w-full" />
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Crosshair className="h-4 w-4 text-primary" />
                </div>
                {t("player.training.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Level & XP */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                    <span className="text-xs font-black text-primary">{t("player.training.level", { level: trainingStats?.progress?.level ?? 1 })}</span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {t("player.training.totalXp", { total: trainingStats?.progress?.total_xp ?? 0 })}
                  </span>
                </div>
                <Progress
                  value={((trainingStats?.progress?.total_xp ?? 0) % 100)}
                  className="h-3"
                />
              </div>

              {/* Streak */}
              <div className="flex items-center justify-between p-4 bg-orange-500/10 dark:bg-orange-500/5 rounded-2xl border border-orange-500/20">
                <div className="flex items-center gap-4">
                  <Flame className="text-3xl h-8 w-8 text-orange-500 filter drop-shadow-sm" />
                  <div>
                    <div className="font-black text-2xl text-orange-600 dark:text-orange-400">
                      {trainingStats?.progress?.current_streak || 0}
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                      {t("player.training.dayStreak")}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-muted-foreground">{t("player.training.best")}</div>
                  <div className="font-black text-sm">{trainingStats?.progress?.longest_streak || 0}</div>
                </div>
              </div>

              {/* Skills Completed */}
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("player.training.skillMastery")}</span>
                <span className="font-black text-lg text-primary">
                  {trainingStats?.skills?.filter((sp: any) => sp.is_completed).length || 0}/10
                </span>
              </div>

              {/* Button to Training */}
              <Button
                className="w-full rounded-2xl h-12 font-bold group shadow-md hover:shadow-primary/20"
                onClick={() => navigate(demoNav('/training'))}
              >
                {t("player.training.goToCenter")}
                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      <Dialog open={uploadModalOpen} onOpenChange={(open) => {
        setUploadModalOpen(open);
        if (!open) setSelectedFile(null); // Reset when closed
      }}>
        <DialogContent className="sm:max-w-md bg-background text-white border-white/5 shadow-2xl">
          <DialogHeader>
            <DialogTitle>{t("modals.upload.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {uploading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{t("modals.upload.uploading")}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
                    {selectedFile ? selectedFile.name : t("modals.upload.dropzone")}
                  </p>
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="video-upload-modal"
                    disabled={uploading}
                  />
                  <Button asChild variant={selectedFile ? "secondary" : "default"}>
                    <label htmlFor="video-upload-modal" className="cursor-pointer">
                      {selectedFile ? "Change Video" : t("modals.upload.button")}
                    </label>
                  </Button>
                </div>

                {selectedFile && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Camera Angle</label>
                        <Select value={cameraAngle} onValueChange={setCameraAngle}>
                          <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue placeholder="Select angle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="side">Side</SelectItem>
                            <SelectItem value="diagonal">Diagonal</SelectItem>
                            <SelectItem value="behind">Behind</SelectItem>
                            <SelectItem value="unknown">Unknown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kicking Foot</label>
                        <Select value={kickingFoot} onValueChange={setKickingFoot}>
                          <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue placeholder="Select foot" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="right">Right</SelectItem>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="unknown">Unknown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-primary text-black font-bold h-12 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                      onClick={handleUploadAndAnalyze}
                    >
                      <Video className="w-5 h-5 mr-2" />
                      Upload & Analyze
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Results Modal */}
      <Dialog open={resultsModalOpen} onOpenChange={setResultsModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-background text-white border-white/5 shadow-2xl custom-scrollbar">
          <DialogHeader>
            <DialogTitle>{t("player.results.title")}</DialogTitle>
          </DialogHeader>
          {selectedAnalysis ? (
            <div className="space-y-6">
              {/* Video and Overall Score */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                  {selectedVideoUrl ? (
                    <video
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-contain"
                      src={selectedVideoUrl}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="text-xs">Loading video...</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <div className="text-center p-6 bg-primary/5 rounded-lg">
                    <p className="text-sm text-gray-300 mb-2">{t("player.results.overall")}</p>
                    <div className={`text-6xl font-bold ${getScoreColor(selectedAnalysis.overall)}`}>
                      {selectedAnalysis.overall.toFixed(1)}
                    </div>
                    <p className="text-sm text-gray-300 mt-2">{t("player.results.outOf")}</p>
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="space-y-3">
                <h3 className="font-semibold">{t("player.results.detailed")}</h3>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t("player.latestAnalysis.metrics.stability")}</span>
                    <span className={`font-bold ${getScoreColor(selectedAnalysis.stability)}`}>
                      {selectedAnalysis.stability.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={selectedAnalysis.stability} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t("player.latestAnalysis.metrics.power")}</span>
                    <span className={`font-bold ${getScoreColor(selectedAnalysis.power)}`}>
                      {selectedAnalysis.power.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={selectedAnalysis.power} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t("player.latestAnalysis.metrics.technique")}</span>
                    <span className={`font-bold ${getScoreColor(selectedAnalysis.technique)}`}>
                      {selectedAnalysis.technique.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={selectedAnalysis.technique} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t("player.latestAnalysis.metrics.balance")}</span>
                    <span className={`font-bold ${getScoreColor(selectedAnalysis.balance)}`}>
                      {selectedAnalysis.balance.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={selectedAnalysis.balance} className="h-2" />
                </div>
              </div>

              {/* Feedback */}
              <div>
                <h3 className="font-semibold mb-2">{t("player.results.feedback")}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedAnalysis.feedback}
                </p>
              </div>

              {/* Tags */}
              {selectedAnalysis.tags && selectedAnalysis.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">{t("player.results.tags")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAnalysis.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Training */}
              {recommendedTraining.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    {t("player.results.recommended")}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("player.results.recommendedDesc")}
                  </p>
                  <div className="space-y-3">
                    {recommendedTraining.map((level) => (
                      <Card
                        key={level.id}
                        className="cursor-pointer hover:border-primary transition-colors group bg-card border-primary/10 overflow-hidden shadow-lg shadow-black/20"
                        onClick={() => {
                          setResultsModalOpen(false);
                          navigate(demoNav(`/training?tab=exercises&skill=${level.skill_id}&level=${level.level_name}`));
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="transition-all group-hover:scale-110">
                              <SkillIconDash icon={level.skills?.icon || '⚽'} size="md" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm text-white group-hover:text-primary transition-colors">
                                {level.skills?.name} - {level.level_name.charAt(0).toUpperCase() + level.level_name.slice(1)}
                              </h4>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {level.video_title}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {level.duration_minutes} min</span>
                                <span>+{level.xp_reward} XP</span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="rounded-xl px-4">
                              {t("player.results.startTraining")}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Loading Skeleton for Video and Score */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-xs">Loading...</span>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="text-center p-6 bg-primary/5 rounded-lg space-y-3">
                    <Skeleton className="h-4 w-24 mx-auto" />
                    <Skeleton className="h-16 w-32 mx-auto" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </div>
                </div>
              </div>

              {/* Loading Skeleton for Metrics */}
              <div className="space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>

              {/* Loading Skeleton for Feedback */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <TeamProfileOverlay
        teamId={selectedTeamProfileId}
        isOpen={teamProfileOpen}
        onClose={() => setTeamProfileOpen(false)}
      />
    </div>
  );
}
