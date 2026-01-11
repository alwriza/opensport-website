import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Trophy, Loader2, Video, AlertCircle, Plus, X, Users, Check, XCircle, LogOut, ChevronRight, ChevronUp, ChevronDown, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { TeamProfileOverlay } from "@/components/ui/TeamProfileOverlay";
import { Info } from "lucide-react";
import { TermsAcceptanceModal } from "@/components/ui/TermsAcceptanceModal";

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
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [uploading, setUploading] = useState(false);
  const [latestVideoUrl, setLatestVideoUrl] = useState<string>("");
  const [localUser, setLocalUser] = useState<any>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>("");
  const [selectedTeamProfileId, setSelectedTeamProfileId] = useState<string | null>(null);
  const [teamProfileOpen, setTeamProfileOpen] = useState(false);
  const [recommendedTraining, setRecommendedTraining] = useState<any[]>([]);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showAllVideos, setShowAllVideos] = useState(false);


  // 1. Sync & Fetch DB User
  const { data: dbUser, isLoading: loadingUser } = useQuery({
    queryKey: ['db-user', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!existingUser) {
        const { data: newUser, error: insertError } = await (supabase
          .from('users') as any)
          .insert({
            clerk_id: user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            name: user.fullName || user.firstName || 'Player',
            role: 'player'
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newUser;
      }
      return existingUser;
    },
    enabled: !!user,
  });

  // 2. Fetch Videos
  const { data: videos = [] } = useQuery({
    queryKey: ['videos', dbUser?.id],
    queryFn: async () => {
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
      if (!latestCompletedVideoId) return null;
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('video_id', latestCompletedVideoId)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!latestCompletedVideoId,
  });

  // 4. Fetch Training Progress
  const { data: trainingStats } = useQuery({
    queryKey: ['training-stats', dbUser?.id],
    queryFn: async () => {
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
    enabled: !!dbUser?.id
  });

  // 5. Fetch AI Recommendations based on latest analysis
  const { data: latestRecommendations = [] } = useQuery({
    queryKey: ['latest-recommendations', latestAnalysis?.id],
    queryFn: async () => {
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

        return recommendations.slice(0, 3);
      } catch (error) {
        console.error('Error getting recommendations:', error);
        return [];
      }
    },
    enabled: !!latestAnalysis && !!dbUser?.id,
  });

  // 4. Fetch My Teams
  const { data: myTeams = [], isLoading: loadingTeams } = useQuery({
    queryKey: ['my-teams', dbUser?.id],
    queryFn: async () => {
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
    enabled: !!dbUser?.id,
    refetchInterval: 3000,
  });

  // Sync local editing state and check for terms acceptance
  useEffect(() => {
    const userProfile = dbUser as any;
    if (userProfile) {
      setLocalUser(userProfile);

      // Check if user accepted terms
      if (!userProfile.terms_accepted_at || !userProfile.privacy_accepted_at) {
        setShowTermsModal(true);
      } else {
        setShowTermsModal(false);
      }
    }
  }, [dbUser]);

  // Fetch signed URL for latest video
  useEffect(() => {
    if (!latestCompletedVideoId) return;

    const fetchUrl = async () => {
      const { data: videoData } = await supabase
        .from('videos')
        .select('storage_path')
        .eq('id', latestCompletedVideoId)
        .single();

      if (videoData) {
        const { data: urlData } = await supabase.storage
          .from('videos')
          .createSignedUrl((videoData as any).storage_path, 3600);
        if (urlData) setLatestVideoUrl(urlData.signedUrl);
      }
    };
    fetchUrl();
  }, [latestCompletedVideoId]);

  const updateProfile = async (field: string, value: any) => {
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !dbUser?.id) return;

    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 100MB",
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

      // 3. Call ML Worker directly (without Edge Function)
      try {
        console.log('Creating signed URL for ML Worker...');

        // Create signed URL
        const { data: urlData, error: signError } = await supabase.storage
          .from('videos')
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (signError) {
          console.error("Signed URL error:", signError);
          throw new Error('Could not create signed URL');
        }

        console.log('Calling ML Worker...');

        const mlWorkerUrl = 'https://opensportml-production.up.railway.app';
        const mlResponse = await fetch(`${mlWorkerUrl}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_url: urlData.signedUrl,
            video_id: (newVideo as any).id
          })
        });

        if (!mlResponse.ok) {
          const errorText = await mlResponse.text();
          console.error('ML Worker error:', errorText);
          throw new Error(`ML analysis failed: ${mlResponse.status}`);
        }

        const result = await mlResponse.json();
        console.log(' ML analysis complete:', result);

        // Save analysis to database
        const { error: analysisError } = await (supabase
          .from('analyses') as any)
          .insert({
            user_id: dbUser.id,
            video_id: (newVideo as any).id,
            stability: (result as any).scores?.stability || 0,
            power: (result as any).scores?.power || 0,
            technique: (result as any).scores?.technique || 0,
            balance: (result as any).scores?.balance || 0,
            overall: (result as any).scores?.overall || 0,
            feedback: (result as any).feedback || '',
            tags: (result as any).tags || [],
            processing_time_ms: (result as any).processing_time_ms || 0
          });

        if (analysisError) {
          console.error('Failed to save analysis:', analysisError);
          throw analysisError;
        }

        // Update video status to completed
        await (supabase
          .from('videos') as any)
          .update({ status: 'completed' })
          .eq('id', (newVideo as any).id);

        toast({
          title: "Analysis Complete! 🎉",
          description: "Your kick has been analyzed successfully.",
        });

      } catch (mlError: any) {
        console.error(' ML processing failed:', mlError);

        // Mark video as failed
        await (supabase
          .from('videos') as any)
          .update({ status: 'failed' })
          .eq('id', (newVideo as any).id);

        toast({
          title: "Analysis Failed",
          description: mlError.message || "Could not analyze video. The video has been saved but analysis failed.",
          variant: "destructive"
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['videos', dbUser.id] });
      setUploadModalOpen(false);

    } catch (error: any) {
      console.error("❌ Upload failed:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      event.target.value = '';
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

  const openResultsModal = async (videoId: string) => {
    try {
      // Fetch analysis
      const { data: analysisData, error: analysisError } = await supabase
        .from('analyses')
        .select('*')
        .eq('video_id', videoId)
        .single();

      if (analysisError) throw analysisError;
      setSelectedAnalysis(analysisData);

      // Fetch video URL
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('storage_path')
        .eq('id', videoId)
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

      setResultsModalOpen(true);
    } catch (error: any) {
      console.error('Error loading results:', error);
      toast({
        title: "Error",
        description: "Could not load analysis results.",
        variant: "destructive"
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const handleLeaveTeam = async (rosterId: string, teamName: string) => {
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
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dbUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-card p-4">
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
      {/* Terms Acceptance Modal */}
      {dbUser && (
        <TermsAcceptanceModal
          open={showTermsModal}
          userId={(dbUser as any).id}
          onAccept={() => {
            setShowTermsModal(false);
            queryClient.invalidateQueries({ queryKey: ['db-user', user?.id] });
          }}
        />
      )}

      <header className="mb-6 md:mb-10">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome, {user?.firstName || 'Player'}!</h1>
        <p className="text-muted-foreground">Your performance hub</p>
      </header>

      {!dbUser && !loadingUser && (
        <div className="mb-8">
          <AlertCircle className="h-6 w-6 text-destructive inline mr-2" />
          <span className="text-destructive font-bold">Failed to load profile. Please refresh.</span>
        </div>
      )}

      <div className="grid lg:grid-cols-[minmax(300px,1fr)_2.5fr_minmax(320px,1fr)] gap-8">
        {/* Column 1: History (Narrow) */}
        <div className="space-y-8 lg:order-1 order-2">
          <div>
            <h2 className="text-xl font-bold mb-4">All Analyses</h2>
            {videos.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No videos uploaded yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {(showAllVideos ? videos : videos.slice(0, 3)).map((video) => (
                    <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow border-primary/10">
                      <div className="flex flex-col items-start p-4 gap-4">
                        <div className="h-16 w-full bg-muted rounded flex items-center justify-center flex-shrink-0">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0 w-full">
                          <h4 className="font-semibold truncate text-sm">{video.filename}</h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{new Date(video.uploaded_at).toLocaleDateString()}</span>
                            <Badge variant={video.status === 'completed' ? 'default' : video.status === 'processing' ? 'secondary' : 'destructive'} className="whitespace-nowrap scale-90 origin-left">
                              {video.status === 'processing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                              {video.status}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={video.status !== 'completed'}
                          onClick={() => openResultsModal(video.id)}
                          className="w-full text-xs"
                        >
                          {video.status === 'completed' ? 'View Results' : 'Processing...'}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {videos.length > 3 && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllVideos(!showAllVideos)}
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      {showAllVideos ? (
                        <>Show Less <ChevronUp className="ml-2 h-4 w-4" /></>
                      ) : (
                        <>Show More ({videos.length - 3} more) <ChevronDown className="ml-2 h-4 w-4" /></>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Active Analysis (Wide) */}
        <div className="space-y-8 lg:order-2 order-1">
          {/* Latest Analysis Card */}
          {latestAnalysis && latestVideoUrl ? (
            <Card className="border-2 border-primary/30 shadow-xl shadow-primary/5">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Latest Analysis</CardTitle>
                  <Button onClick={() => setUploadModalOpen(true)} size="sm" className="rounded-full px-6">
                    <Plus className="h-4 w-4 mr-2" />
                    New Analysis
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid xl:grid-cols-2 gap-8">
                  {/* Video */}
                  <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-gray-800">
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
                      <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
                      <div className={`text-6xl font-black ${getScoreColor(latestAnalysis.overall)}`}>
                        {latestAnalysis.overall.toFixed(1)}
                      </div>
                    </div>

                    {/* Individual Scores */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2 font-medium">
                          <span className="text-muted-foreground">Stability</span>
                          <span className={getScoreColor(latestAnalysis.stability)}>
                            {latestAnalysis.stability.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={latestAnalysis.stability} className="h-2.5" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2 font-medium">
                          <span className="text-muted-foreground">Power</span>
                          <span className={getScoreColor(latestAnalysis.power)}>
                            {latestAnalysis.power.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={latestAnalysis.power} className="h-2.5" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2 font-medium">
                          <span className="text-muted-foreground">Technique</span>
                          <span className={getScoreColor(latestAnalysis.technique)}>
                            {latestAnalysis.technique.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={latestAnalysis.technique} className="h-2.5" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2 font-medium">
                          <span className="text-muted-foreground">Balance</span>
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
                        <h3 className="font-bold">AI Recommendations</h3>
                        <p className="text-xs text-muted-foreground">Tailored exercises specifically for you</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {latestRecommendations.map((level: any) => (
                        <Card
                          key={level.id}
                          className="cursor-pointer hover:border-primary/50 transition-all group bg-gradient-to-br from-white to-primary/5 border-primary/5 overflow-hidden"
                          onClick={() => {
                            navigate(`/training?skill=${level.skill_id}&level=${level.level_name}`);
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="text-4xl grayscale group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-110">
                                {level.skills?.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm group-hover:text-primary transition-colors">
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
                <h3 className="text-2xl font-bold mb-3 italic tracking-tight">ELEVATE YOUR GAME</h3>
                <p className="text-muted-foreground mb-10 max-w-sm text-lg leading-relaxed">
                  Upload your training footage and get professional-grade AI analysis in seconds.
                </p>
                <Button onClick={() => setUploadModalOpen(true)} size="lg" className="rounded-full px-12 h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                  <Plus className="h-6 w-6 mr-3" />
                  Analyze Video
                </Button>
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
                  <h4 className="font-bold text-lg text-primary italic">PRO TIP: PERFECT ANGLE</h4>
                  <p className="text-muted-foreground mt-2 leading-relaxed">
                    For the most accurate precision and power metrics, film from the side (90° angle)
                    ensuring your entire silhouette (from head to toe) is visible throughout the action.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Column 3: Sidebar (Standard) */}
        <div className="space-y-6 lg:order-3 order-3">

          <Card className="border border-primary/10 bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                PROFILE DETAILS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Age</label>
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
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Position</label>
                  <Select
                    value={localUser?.position || ''}
                    onValueChange={(value) => {
                      setLocalUser({ ...localUser, position: value });
                      updateProfile('position', value);
                    }}
                  >
                    <SelectTrigger className="h-9 rounded-xl bg-background/50 text-xs">
                      <SelectValue placeholder="Position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Forward">Forward</SelectItem>
                      <SelectItem value="Midfielder">Midfielder</SelectItem>
                      <SelectItem value="Defender">Defender</SelectItem>
                      <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Club</label>
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
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Height (cm)</label>
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
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Weight (kg)</label>
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
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">LEGAL & PRIVACY</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => window.open('/terms', '_blank')}
                    className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-between group"
                  >
                    Terms of Service
                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                  </button>
                  <button
                    onClick={() => window.open('/privacy', '_blank')}
                    className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-between group"
                  >
                    Privacy Policy
                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>


          <Card className="border border-primary/10">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                My Teams
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
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
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
                            Team Page
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
                  <p className="text-xs font-medium text-muted-foreground">Not joined any teams</p>
                  <Button variant="link" size="sm" className="mt-1 text-primary text-xs" onClick={() => navigate('/join-team')}>
                    Find a club →
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
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-lg">
                  🎯
                </div>
                Training Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Level & XP */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                    <span className="text-xs font-black text-primary">LEVEL {trainingStats?.progress?.level || 1}</span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {trainingStats?.progress?.total_xp || 0} TOTAL XP
                  </span>
                </div>
                <Progress
                  value={((trainingStats?.progress?.total_xp || 0) % 100)}
                  className="h-3"
                />
              </div>

              {/* Streak */}
              <div className="flex items-center justify-between p-4 bg-orange-500/10 dark:bg-orange-500/5 rounded-2xl border border-orange-500/20">
                <div className="flex items-center gap-4">
                  <span className="text-3xl filter drop-shadow-sm">🔥</span>
                  <div>
                    <div className="font-black text-2xl text-orange-600 dark:text-orange-400">
                      {trainingStats?.progress?.current_streak || 0}
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                      Day Streak
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-muted-foreground">BEST</div>
                  <div className="font-black text-sm">{trainingStats?.progress?.longest_streak || 0}</div>
                </div>
              </div>

              {/* Skills Completed */}
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Skill Mastery</span>
                <span className="font-black text-lg text-primary">
                  {trainingStats?.skills?.filter((sp: any) => sp.is_completed).length || 0}/10
                </span>
              </div>

              {/* Button to Training */}
              <Button
                className="w-full rounded-2xl h-12 font-bold group shadow-md hover:shadow-primary/20"
                onClick={() => navigate('/training')}
              >
                Go to Training Center
                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload New Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {uploading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading and analyzing...</p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Supported formats: MP4, MOV, AVI, MKV (max 100MB)
                </p>
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="video-upload-modal"
                  disabled={uploading}
                />
                <Button asChild>
                  <label htmlFor="video-upload-modal" className="cursor-pointer">
                    Choose Video File
                  </label>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Results Modal */}
      <Dialog open={resultsModalOpen} onOpenChange={setResultsModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analysis Results</DialogTitle>
          </DialogHeader>
          {selectedAnalysis && (
            <div className="space-y-6">
              {/* Video and Overall Score */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                  {selectedVideoUrl && (
                    <video
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-contain"
                      src={selectedVideoUrl}
                    />
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <div className="text-center p-6 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
                    <div className={`text-6xl font-bold ${getScoreColor(selectedAnalysis.overall)}`}>
                      {selectedAnalysis.overall.toFixed(1)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">out of 100</p>
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="space-y-3">
                <h3 className="font-semibold">Detailed Metrics</h3>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Stability</span>
                    <span className={`font-bold ${getScoreColor(selectedAnalysis.stability)}`}>
                      {selectedAnalysis.stability.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={selectedAnalysis.stability} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Power</span>
                    <span className={`font-bold ${getScoreColor(selectedAnalysis.power)}`}>
                      {selectedAnalysis.power.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={selectedAnalysis.power} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Technique</span>
                    <span className={`font-bold ${getScoreColor(selectedAnalysis.technique)}`}>
                      {selectedAnalysis.technique.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={selectedAnalysis.technique} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Balance</span>
                    <span className={`font-bold ${getScoreColor(selectedAnalysis.balance)}`}>
                      {selectedAnalysis.balance.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={selectedAnalysis.balance} className="h-2" />
                </div>
              </div>

              {/* Feedback */}
              <div>
                <h3 className="font-semibold mb-2">AI Feedback</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedAnalysis.feedback}
                </p>
              </div>

              {/* Tags */}
              {selectedAnalysis.tags && selectedAnalysis.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Tags</h3>
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
                    Recommended Training
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Based on your analysis, these exercises will help improve your weak areas:
                  </p>
                  <div className="space-y-3">
                    {recommendedTraining.map((level) => (
                      <Card
                        key={level.id}
                        className="cursor-pointer hover:border-primary transition-colors group"
                        onClick={() => {
                          setResultsModalOpen(false);
                          navigate(`/training?skill=${level.skill_id}&level=${level.level_name}`);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl grayscale group-hover:grayscale-0 transition-all">{level.skills?.icon}</div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">
                                {level.skills?.name} - {level.level_name.charAt(0).toUpperCase() + level.level_name.slice(1)}
                              </h4>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {level.video_title}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                <span>⏱️ {level.duration_minutes} min</span>
                                <span>+{level.xp_reward} XP</span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="rounded-xl px-4">
                              Start Training
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
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
