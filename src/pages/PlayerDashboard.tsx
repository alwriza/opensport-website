import type { Database } from "@/integrations/supabase/types";
import { getErrorMessage } from "@/lib/errors";
import { PLAYER_POSITIONS, positionCode } from "@/lib/player";
import { SkillIcon } from "@/components/training/SkillIcon";
import { useDesignCopy } from "@/hooks/useDesignCopy";
import { useState, useEffect, useMemo } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Trophy, Loader2, Video, AlertCircle, LogOut, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MetricList } from "@/components/redesign/primitives";
import { AnalysisVideo } from "@/components/redesign/AnalysisVideo";
import { AnalysisHistoryTable } from "@/components/redesign/AnalysisHistoryTable";
import { TeamProfileOverlay } from "@/components/ui/TeamProfileOverlay";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { useDemoContext, useDemoMutationGuard } from "@/demo";

type UserRecord = Database["public"]["Tables"]["users"]["Row"];
type VideoRecord = Pick<Database["public"]["Tables"]["videos"]["Row"], "id" | "filename" | "status" | "uploaded_at" | "duration">;
type Analysis = Database["public"]["Tables"]["analyses"]["Row"];
type RecommendedLevel = Database["public"]["Tables"]["skill_levels"]["Row"] & { skills?: Pick<Database["public"]["Tables"]["skills"]["Row"], "name" | "icon"> | null; };
type EditableField = "name" | "age" | "position" | "city" | "club" | "height" | "weight";

type AnalysisScores = Pick<Analysis, "stability" | "power" | "technique" | "balance">;

async function loadRecommendedTraining(scores: AnalysisScores) {
  const targets = [
    { needed: scores.stability < 60 || scores.balance < 60, skill: "Balance & Core", levels: ["beginner", "intermediate"] },
    { needed: scores.power < 60, skill: "Speed & Acceleration", levels: ["beginner", "intermediate"] },
    { needed: scores.technique < 60, skill: "Shooting Precision", levels: ["beginner"] },
  ].filter(target => target.needed);

  const recommendations = await Promise.all(targets.map(async ({ skill, levels }) => {
    const { data: skillData, error: skillError } = await supabase.from("skills").select("id").eq("name", skill).maybeSingle();
    if (skillError || !skillData) return [];
    const { data, error } = await supabase.from("skill_levels").select("*, skills (name, icon)").eq("skill_id", skillData.id).in("level_name", levels).order("level_order");
    if (error) return [];
    return data || [];
  }));
  const levels = recommendations.flat();
  if (levels.length) return levels.slice(0, 3);

  const { data: fallbackSkill, error: skillError } = await supabase.from("skills").select("id").order("order_index").limit(1).maybeSingle();
  if (skillError || !fallbackSkill) return [];
  const { data, error } = await supabase.from("skill_levels").select("*, skills (name, icon)").eq("skill_id", fallbackSkill.id).eq("level_name", "beginner").order("level_order").limit(3);
  return error ? [] : data || [];
}

export default function PlayerDashboard() {
  const copy = useDesignCopy();
  const { t } = useTranslation("dashboard");
  const { user, isLoaded } = useCurrentUser();
  const demo = useDemoContext();
  const { isDemo, guard: guardMutation } = useDemoMutationGuard();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const demoNav = (path: string) => isDemo ? `/demo${path}` : path;

  // State
  const [uploading, setUploading] = useState(false);
  const [localUser, setLocalUser] = useState<Partial<UserRecord> | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>("");
  const [selectedTeamProfileId, setSelectedTeamProfileId] = useState<string | null>(null);
  const [teamProfileOpen, setTeamProfileOpen] = useState(false);
  const [recommendedTraining, setRecommendedTraining] = useState<RecommendedLevel[]>([]);
  const [showAllVideos, setShowAllVideos] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [methodModalOpen, setMethodModalOpen] = useState(false);

  useEffect(() => {
    if (location.state?.upload) setUploadModalOpen(true);
    if (location.state?.profile) setProfileModalOpen(true);
    if (location.state?.upload || location.state?.profile) navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  // Metadata state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cameraAngle, setCameraAngle] = useState<string>("unknown");
  const [kickingFoot, setKickingFoot] = useState<string>("unknown");

  // 1. Fetch DB User
  const { data: dbUser, isLoading: loadingUser } = useQuery({
    queryKey: ['db-user', user?.id, isDemo],
    queryFn: async () => {
      if (demo) return { ...demo.coachProfile, name: `${demo.user.firstName} ${demo.user.lastName}` };
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
    queryKey: ['videos', dbUser?.id, isDemo],
    queryFn: async () => {
      if (demo) return demo.videos;
      if (!dbUser?.id) return [];
      const { data, error } = await supabase
        .from('videos')
        .select('id, filename, status, uploaded_at, duration')
        .eq('user_id', dbUser.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return (data || []) as VideoRecord[];
    },
    enabled: !!dbUser?.id,
    refetchInterval: (query) => {
      const hasProcessing = (query.state.data as VideoRecord[])?.some((v) => v.status === 'processing');
      return hasProcessing ? 5000 : false;
    }
  });

  // 3. Fetch Latest Analysis
  const latestCompletedVideoId = useMemo(() =>
    videos.find(v => v.status === 'completed')?.id,
    [videos]);
  const latestVideo = videos.find(v => v.id === latestCompletedVideoId);

  const { data: latestAnalysis } = useQuery({
    queryKey: ['analysis', latestCompletedVideoId, isDemo],
    queryFn: async () => {
      if (demo) return demo.latestAnalysis;
      if (!latestCompletedVideoId) return null;
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('video_id', latestCompletedVideoId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!latestCompletedVideoId || !!demo,
  });

  // 4. Fetch Training Progress
  const { data: trainingStats } = useQuery({
    queryKey: ['training-stats', dbUser?.id, isDemo],
    queryFn: async () => {
      if (demo) return { ...demo.trainingStats, skillCount: demo.skills.length, skillNames: Object.fromEntries(demo.skills.map(skill => [skill.id, skill.name])) };
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

      const { data: catalog } = await supabase.from('skills').select('id, name');

      return { progress, skills: skills || [], skillCount: catalog?.length ?? 0, skillNames: Object.fromEntries((catalog || []).map(skill => [skill.id, skill.name])) };
    },
    enabled: !!dbUser?.id || !!demo
  });

  const completedVideoIds = useMemo(() => videos.filter(v => v.status === 'completed').map(v => v.id), [videos]);
  const { data: scoreAnalyses = [] } = useQuery({
    queryKey: ['score-analyses', completedVideoIds, isDemo],
    queryFn: async () => {
      if (demo) return demo.analyses.filter(a => completedVideoIds.includes(a.video_id));
      const { data, error } = await supabase.from('analyses').select('video_id, overall').in('video_id', completedVideoIds);
      if (error) throw error;
      return data || [];
    },
    enabled: completedVideoIds.length > 0,
  });

  // 5. Fetch AI Recommendations based on latest analysis
  const { data: latestRecommendations = [] } = useQuery({
    queryKey: ['latest-recommendations', latestAnalysis?.id, isDemo],
    queryFn: async () => {
      if (demo) return demo.latestRecommendations;
      if (!latestAnalysis || !dbUser?.id) return [];

      const scores = {
        stability: latestAnalysis?.stability || 0,
        power: latestAnalysis?.power || 0,
        technique: latestAnalysis?.technique || 0,
        balance: latestAnalysis?.balance || 0
      };

      return loadRecommendedTraining(scores);
    },
    enabled: (!!latestAnalysis && !!dbUser?.id) || !!demo,
  });

  // 4. Fetch My Teams
  const { data: myTeams = [], isLoading: loadingTeams } = useQuery({
    queryKey: ['my-teams', dbUser?.id, isDemo],
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

      return (data || []).filter(item => item.teams != null).map(item => ({
        roster_id: item.id,
        team_id: item.teams!.id,
        team_name: item.teams!.name,
        age_group: item.teams!.age_group,
        club_name: item.teams!.clubs?.name,
        status: item.status
      })) || [];
    },
    enabled: !!dbUser?.id || !!demo,
    refetchInterval: demo ? false : 3000,
  });

  // Sync local editing state
  useEffect(() => {
    const userProfile = dbUser;
    if (userProfile) {
      setLocalUser(userProfile);
    }
  }, [dbUser]);

  const updateProfile = async (field: EditableField, value: string | number | null) => {
    if (guardMutation()) return;
    if (!dbUser?.id) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ [field]: value })
        .eq('id', dbUser.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: `${field.charAt(0).toUpperCase() + field.slice(1)} saved.`,
      });

      queryClient.invalidateQueries({ queryKey: ['db-user', user?.id, isDemo] });
    } catch (error: unknown) {
      toast({
        title: "Update Failed",
        description: getErrorMessage(error),
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
    if (guardMutation() || !selectedFile || !dbUser?.id) return;
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

      const { data: newVideo, error: dbError } = await supabase
        .from('videos')
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

      console.log("✓ Video record created:", newVideo.id);

      // 3. Call Edge Function to process video securely
      try {
        console.log('Calling process-video Edge Function...');

        const { data: functionData, error: functionError } = await supabase.functions.invoke('process-video', {
          body: {
            video_id: newVideo.id,
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

      } catch (mlError: unknown) {
        console.error('❌ ML processing failed via Edge Function:', mlError);

        // Mark video as failed
        await supabase
          .from('videos')
          .update({ status: 'failed' })
          .eq('id', newVideo.id);

        toast({
          title: "Analysis Failed",
          description: getErrorMessage(mlError) || "Could not analyze video due to a timeout or error. Video is saved but analysis failed.",
          variant: "destructive"
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['videos', dbUser.id] });
      setUploadModalOpen(false);
      setSelectedFile(null); // Reset file state

    } catch (error: unknown) {
      console.error("❌ Upload failed:", error);
      toast({
        title: "Upload Failed",
        description: getErrorMessage(error) || "Could not upload video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // event.target.value = ''; // This was from the old handleFileUpload, not needed here
    }
  };

  // Open results modal instantly, then fetch data
  const openResultsModal = (videoId: string) => {
    // Clear previous data and open modal immediately
    setSelectedAnalysis(null);
    setSelectedVideoUrl("");
    setRecommendedTraining([]);
    setLoadingResults(true);
    setSelectedVideoId(videoId);
    setResultsModalOpen(true);
  };

  // Fetch data when modal is opened
  useEffect(() => {
    if (!resultsModalOpen || !selectedVideoId) return;

    let cancelled = false;
    const fetchResultsData = async () => {
      setLoadingResults(true);

      if (demo) {
        const demoAnalysis = demo.analyses.find(a => a.video_id === selectedVideoId);
        if (demoAnalysis) {
          setSelectedAnalysis(demoAnalysis);
          const video = demo.videos.find((v) => v.id === selectedVideoId);
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
        if (cancelled) return;
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
          .createSignedUrl(videoData.storage_path, 3600);

        if (urlError) throw urlError;
        if (cancelled) return;
        setSelectedVideoUrl(urlData.signedUrl);

        // Get recommendations
        const scores = {
          stability: analysisData?.stability || 0,
          power: analysisData?.power || 0,
          technique: analysisData?.technique || 0,
          balance: analysisData?.balance || 0
        };
        const recommendations = await loadRecommendedTraining(scores);
        if (!cancelled) setRecommendedTraining(recommendations);

      } catch (error: unknown) {
        if (cancelled) return;
        console.error('Error loading results:', error);
        toast({
          title: "Error",
          description: "Could not load analysis results.",
          variant: "destructive"
        });
      } finally {
        if (!cancelled) setLoadingResults(false);
      }
    };

    fetchResultsData();
    return () => { cancelled = true; };
  }, [resultsModalOpen, selectedVideoId, demo, toast]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-[#8A6A1F]";
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

    } catch (error: unknown) {
      console.error('Error leaving team:', error);
      toast({
        title: "Error",
        description: "Could not leave team",
        variant: "destructive"
      });
    }
  };

  const shareProfile = async () => {
    const url = new URL(isDemo ? "/demo" : `/player/${dbUser?.id}`, window.location.origin).href;
    try {
      if (navigator.share) await navigator.share({ title: "OPENsport player profile", url });
      else { await navigator.clipboard.writeText(url); toast({ title: "Profile link copied" }); }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) toast({ title: "Could not share profile", description: url, variant: "destructive" });
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
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
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

  const playerName = localUser?.name || user?.email?.split("@")[0] || t("player.defaultName");
  const previousScore = scoreAnalyses.find(analysis => analysis.video_id === completedVideoIds[1])?.overall;
  const growth = latestAnalysis && previousScore != null ? latestAnalysis.overall - previousScore : null;
  const averageScore = scoreAnalyses.length ? scoreAnalyses.reduce((sum, analysis) => sum + analysis.overall, 0) / scoreAnalyses.length : null;
  const totalXp = trainingStats?.progress?.total_xp ?? 0;
  const completedSkills = trainingStats?.skills.filter(skill => skill.is_completed).length ?? 0;
  const metricLabels = {
    stability: t("player.latestAnalysis.metrics.stability"), power: t("player.latestAnalysis.metrics.power"),
    technique: t("player.latestAnalysis.metrics.technique"), balance: t("player.latestAnalysis.metrics.balance"),
  };
  const selectedTags = Array.isArray(selectedAnalysis?.tags) ? selectedAnalysis.tags.filter((tag): tag is string => typeof tag === "string") : [];
  const metricScores = latestAnalysis || { stability: NaN, power: NaN, technique: NaN, balance: NaN };
  const profileFields: { key: EditableField; label: string; type: "text" | "number"; }[] = [
    { key: "name", label: copy("Full name"), type: "text" },
    { key: "age", label: t("player.profile.age"), type: "number" },
    { key: "position", label: t("player.profile.position"), type: "text" },
    { key: "city", label: copy("City"), type: "text" },
    { key: "club", label: t("player.profile.club"), type: "text" },
    { key: "height", label: t("player.profile.height"), type: "number" },
    { key: "weight", label: t("player.profile.weight"), type: "number" },
  ];

  return (
    <main className="design-page design-player" data-onboarding-dashboard="player">
      <section className="design-player-hero">
        <div className="design-player-info">
          <div className="design-player-identity">
            <span className="design-eyebrow design-player-latest">{copy("Your player profile")}</span>
            <h1 className="design-player-name">{playerName}</h1>
            <div className="design-player-tags">
              {[localUser?.age ? `U${localUser.age}` : null, localUser?.position, localUser?.city, localUser?.club,
                localUser?.height ? `${localUser.height} ${copy("cm")}` : null, localUser?.weight ? `${localUser.weight} ${copy("kg")}` : null].filter(Boolean).map((tag: string) => <span key={tag}>{tag}</span>)}
            </div>
          </div>
          <div className="design-player-score-row">
            <div className="design-player-score"><strong>{latestAnalysis?.overall?.toFixed(1) ?? "—"}</strong><span>/100</span></div>
            <div className="design-player-trend">
              <span className="design-eyebrow">{copy("Overall")}</span>
              {growth != null && <div className={`design-growth ${growth < 0 ? "design-growth-negative" : ""}`}>{growth >= 0 ? "▲ +" : "▼ "}{growth.toFixed(1)}<span className="design-trend-caption"> {copy("since last upload")}</span></div>}
            </div>
          </div>
          <div className="design-player-actions">
            <button className="design-button" data-onboarding="player-upload" onClick={() => setUploadModalOpen(true)}>{copy("Upload video")}</button>
            <button className="design-button design-button-outline design-button-dark-outline" onClick={() => setProfileModalOpen(true)}>{copy("Edit profile")}</button>
            <button className="design-button design-button-outline design-button-dark-outline" onClick={shareProfile}>{copy("Share profile")}</button>
          </div>
        </div>
        <aside className="design-player-overview">
          <div className="design-profile-stats">
            {[{ label:t("stats.level"), value:trainingStats?.progress?.level ?? 1 }, { label:t("stats.streak"), value:trainingStats?.progress?.current_streak ?? 0 }, { label:t("stats.xp"), value:totalXp.toLocaleString() }, { label:t("stats.avgScore"), value:averageScore?.toFixed(1) ?? "—" }].map(stat => <div key={stat.label}><span className="design-eyebrow">{stat.label}</span><strong>{stat.value}</strong></div>)}
          </div>
          <section className="design-profile-teams">
            <div className="design-section-heading"><h2>{copy("My teams")}</h2><Link className="design-link" to={demoNav("/join-team")}>{copy("Join a team →")}</Link></div>
            {loadingTeams ? <Loader2 className="animate-spin" /> : myTeams.map(team => <div className="design-profile-team" key={team.roster_id}>
              <div><strong>{team.team_name}</strong><p>{[team.club_name, team.age_group].filter(Boolean).join(" · ")} · {copy(team.status === "active" ? "Active" : "Pending")}</p></div>
              {team.status === "active" && <button className="design-link" onClick={() => { setSelectedTeamProfileId(team.team_id); setTeamProfileOpen(true); }}>{copy("Open")} →</button>}
              <button aria-label={`${copy("Leave team")} ${team.team_name}`} className="design-icon-button" onClick={() => handleLeaveTeam(team.roster_id, team.team_name)}><LogOut /></button>
            </div>)}
            {!loadingTeams && !myTeams.length && <p className="design-teams-empty">{copy("You have not joined a team yet.")}</p>}
          </section>
        </aside>
      </section>
      <div className="design-player-body">
        <section className="design-breakdown" data-onboarding="player-results">
          <div className="design-section-heading">
            <h2>{copy("Breakdown")}</h2>
            <button className="design-link design-link-underlined" onClick={() => setMethodModalOpen(true)}><span className="design-method-desktop">{copy("What each score measures")}</span><span className="design-method-mobile">{copy("Method")}</span></button>
          </div>
          <MetricList scores={metricScores} labels={metricLabels} />
          <div className="design-camera-note">
            <Info />
            <p>{copy("Camera angle affects the score. For a more reliable reading, film from the side, with your whole body in frame.")}</p>
          </div>
        </section>
        <AnalysisVideo video={latestVideo} onUpload={() => setUploadModalOpen(true)} onOpenResults={() => latestCompletedVideoId && openResultsModal(latestCompletedVideoId)} />
      </div>
      {latestAnalysis?.feedback && <section className="design-analysis-feedback"><span className="design-eyebrow">{copy("Analysis feedback")}</span><p>{latestAnalysis.feedback}</p></section>}
      <div className="design-player-followup">
        <section className="design-next" data-onboarding="player-training">
          <div className="design-section-heading">
            <h2>{copy("Do next")}</h2>
            <span className="design-eyebrow">{latestRecommendations.length} {" "}{copy("drills")}</span>
          </div>
          {latestRecommendations.length ? latestRecommendations.map(level => (
            <Link key={level.id} className="design-drill" to={demoNav(`/training?tab=exercises&skill=${level.skill_id}&level=${level.level_name}`)}>
              <span className="design-drill-category">{level.skills?.name || level.target_metrics?.join(" · ")}</span>
              <span className="design-drill-title">{level.video_title || level.skills?.name}</span>
              <span className="design-drill-meta">{level.duration_minutes} min · {level.level_name} · +{level.xp_reward} XP</span>
            </Link>
          )) : <Link className="design-drill" to={demoNav("/training")}><span className="design-drill-category">{copy("Training")}</span><span className="design-drill-title">{copy("Explore drills for your next session")}</span></Link>}
        </section>
        <section className="design-player-training">
          <div className="design-section-heading"><h2>{t("player.training.title")}</h2><Link className="design-link" to={demoNav("/training")}>{t("player.training.goToCenter")} →</Link></div>
          <div className="design-training-summary">
            <div><span className="design-eyebrow">{t("player.training.level", { level:trainingStats?.progress?.level ?? 1 })}</span><strong>{totalXp.toLocaleString()} <small>XP</small></strong></div>
            <div><span className="design-eyebrow">{t("player.training.best")}</span><strong>{trainingStats?.progress?.longest_streak ?? 0} <small>{t("player.training.dayStreak")}</small></strong></div>
            <div><span className="design-eyebrow">{t("player.training.skillMastery")}</span><strong>{completedSkills}<small>/{trainingStats?.skillCount ?? 0}</small></strong></div>
          </div>
          <div className="design-training-xp"><div className="design-meter"><span style={{ width:`${(totalXp % 500) / 5}%` }} /></div><p>{copy("Next level")} · {totalXp % 500}/500 XP</p></div>
          <div className="design-skill-progress">
            {trainingStats?.skills.map(progress => <Link key={progress.skill_id} className="design-link" to={demoNav(`/training?tab=interactive&skill=${progress.skill_id}`)}><span>{trainingStats.skillNames?.[progress.skill_id] || copy("Skill")}</span><span className="design-mono">{progress.completed_levels.length} {copy("tiers complete")} {progress.is_completed ? "✓" : "→"}</span></Link>)}
          </div>
        </section>
      </div>
      <section className="design-history">
        <div className="design-section-heading">
          <h2>{copy("All analyses")}</h2>
          {videos.length > 4 && <button className="design-history-more" onClick={() => setShowAllVideos(!showAllVideos)}>{showAllVideos ? `${t("player.showLess")} ↑` : `${t("player.showMore", { count:videos.length - 4 })} ↓`}</button>}
        </div>
        <AnalysisHistoryTable videos={showAllVideos ? videos : videos.slice(0, 4)} onOpen={openResultsModal} />
      </section>
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{copy("Edit player profile")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {profileFields.map(({ key, label, type }) => <div key={key} className={key === "name" ? "col-span-2" : ""}>
              <label htmlFor={`profile-${key}`} className="design-eyebrow block mb-2">{label}</label>
              {key === "position" ? <Select value={PLAYER_POSITIONS.find(position => position.code === positionCode(localUser?.position))?.value || ""} onValueChange={value => { setLocalUser({ ...localUser, position:value }); void updateProfile("position", value); }}><SelectTrigger id="profile-position"><SelectValue placeholder={label} /></SelectTrigger><SelectContent>{PLAYER_POSITIONS.map(position => <SelectItem key={position.value} value={position.value}>{t(`player.profile.positions.${position.label}`)}</SelectItem>)}</SelectContent></Select> : <input id={`profile-${key}`} className="design-search !w-full" type={type} min={type === "number" ? 0 : undefined} step={key === "height" || key === "weight" ? "0.1" : undefined} value={localUser?.[key] ?? ""} onChange={event => setLocalUser({ ...localUser, [key]: type === "number" ? event.target.value === "" ? null : Math.max(0, Number(event.target.value)) : event.target.value })} onBlur={() => updateProfile(key, localUser?.[key] ?? null)} />}
            </div>)}
          </div>
          <div className="design-profile-legal"><Link to="/terms" target="_blank">{t("player.profile.terms")} ↗</Link><Link to="/privacy" target="_blank">{t("player.profile.privacy")} ↗</Link></div>
        </DialogContent>
      </Dialog>
      <Dialog open={methodModalOpen} onOpenChange={setMethodModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How we measure technique</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-muted-foreground">The analysis tracks body keypoints throughout your kick and reports stability, power, technique and balance on a scale from 0 to 100. Use repeated recordings from the same camera angle to compare your progress.</p>
          <Link to={`${isDemo ? "/demo/home" : "/"}#science`} className="design-link design-link-underlined">{copy("Read about the method →")}</Link>
        </DialogContent>
      </Dialog>
      <Dialog open={uploadModalOpen} onOpenChange={(open) => {
        setUploadModalOpen(open);
        if (!open) setSelectedFile(null); // Reset when closed
      }}>
        <DialogContent className="sm:max-w-md bg-background text-foreground border-border ">
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
                <div className="border-2 border-dashed border-border rounded-sm p-6 text-center hover:border-primary/50 transition-colors">
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
                          <SelectTrigger className="bg-secondary/35 border-border">
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
                          <SelectTrigger className="bg-secondary/35 border-border">
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
                      className="w-full bg-primary text-primary-foreground font-bold h-12 hover:scale-[1.02] transition-transform"
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
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-background text-foreground border-border custom-scrollbar">
          <DialogHeader>
            <DialogTitle>{t("player.results.title")}</DialogTitle>
          </DialogHeader>
          {selectedAnalysis ? (
            <div className="space-y-6">
              {/* Video and Overall Score */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="aspect-video bg-black rounded-sm overflow-hidden flex items-center justify-center">
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
                  <div className="text-center p-6 bg-primary/5 rounded-sm">
                    <p className="text-sm text-muted-foreground mb-2">{t("player.results.overall")}</p>
                    <div className={`text-6xl font-bold ${getScoreColor(selectedAnalysis.overall)}`}>
                      {selectedAnalysis.overall.toFixed(1)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{t("player.results.outOf")}</p>
                  </div>
                </div>
              </div>
              <section>
                <h3 className="font-semibold mb-3">{t("player.results.detailed")}</h3>
                <MetricList scores={selectedAnalysis} labels={metricLabels} />
              </section>
              {/* Feedback */}
              <div>
                <h3 className="font-semibold mb-2">{t("player.results.feedback")}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedAnalysis.feedback}
                </p>
              </div>
              {/* Tags */}
              {selectedTags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">{t("player.results.tags")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag, index) => (
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
                        className="cursor-pointer hover:border-primary transition-colors group bg-card border-primary/10 overflow-hidden "
                        onClick={() => {
                          setResultsModalOpen(false);
                          navigate(demoNav(`/training?tab=exercises&skill=${level.skill_id}&level=${level.level_name}`));
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="transition-all group-hover:scale-110">
                              <SkillIcon icon={level.skills?.icon || '⚽'} size="md" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                                {level.skills?.name} - {level.level_name.charAt(0).toUpperCase() + level.level_name.slice(1)}
                              </h4>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {level.video_title}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {level.duration_minutes} min</span>
                                <span>+{level.xp_reward} XP</span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="rounded-sm px-4">
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
          ) : !loadingResults ? (
            <p className="py-8 text-center text-muted-foreground">Could not load this analysis. Close this window and try again.</p>
          ) : (
            <div className="space-y-6">
              {/* Loading Skeleton for Video and Score */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="aspect-video bg-black rounded-sm overflow-hidden flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-xs">Loading...</span>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="text-center p-6 bg-primary/5 rounded-sm space-y-3">
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
    </main>
  );
}
