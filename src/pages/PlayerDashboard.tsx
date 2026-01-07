import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent, CardFooter, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Trophy, Loader2, Video, AlertCircle, Plus, X, Users, Check, XCircle, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

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

  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [processingInvite, setProcessingInvite] = useState(false);

  const [dbUser, setDbUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<Analysis | null>(null);
  const [latestVideoUrl, setLatestVideoUrl] = useState<string>("");

  // Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>("");

  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  const updateProfile = async (field: string, value: any) => {
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

      // 3. Call ML Worker directly (without Edge Function)
      try {
        console.log('🚀 Creating signed URL for ML Worker...');

        // Create signed URL
        const { data: urlData, error: signError } = await supabase.storage
          .from('videos')
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (signError) {
          console.error("Signed URL error:", signError);
          throw new Error('Could not create signed URL');
        }

        console.log('📞 Calling ML Worker...');

        const mlWorkerUrl = 'https://opensportml-production.up.railway.app';
        const mlResponse = await fetch(`${mlWorkerUrl}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_url: urlData.signedUrl,
            video_id: newVideo.id
          })
        });

        if (!mlResponse.ok) {
          const errorText = await mlResponse.text();
          console.error('ML Worker error:', errorText);
          throw new Error(`ML analysis failed: ${mlResponse.status}`);
        }

        const result = await mlResponse.json();
        console.log('✅ ML analysis complete:', result);

        // Save analysis to database
        const { error: analysisError } = await supabase
          .from('analyses')
          .insert({
            user_id: dbUser.id,
            video_id: newVideo.id,
            stability: result.scores.stability,
            power: result.scores.power,
            technique: result.scores.technique,
            balance: result.scores.balance,
            overall: result.scores.overall,
            feedback: result.feedback,
            tags: result.tags || [],
            processing_time_ms: result.processing_time_ms || 0
          });

        if (analysisError) {
          console.error('Failed to save analysis:', analysisError);
          throw analysisError;
        }

        // Update video status to completed
        await supabase
          .from('videos')
          .update({ status: 'completed' })
          .eq('id', newVideo.id);

        toast({
          title: "Analysis Complete! 🎉",
          description: "Your kick has been analyzed successfully.",
        });

      } catch (mlError: any) {
        console.error('❌ ML processing failed:', mlError);

        // Mark video as failed
        await supabase
          .from('videos')
          .update({ status: 'failed' })
          .eq('id', newVideo.id);

        toast({
          title: "Analysis Failed",
          description: mlError.message || "Could not analyze video. The video has been saved but analysis failed.",
          variant: "destructive"
        });
      }

      await fetchVideos(dbUser.id);
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
        .createSignedUrl(videoData.storage_path, 3600);

      if (urlError) throw urlError;
      setSelectedVideoUrl(urlData.signedUrl);

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



  const fetchVideos = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('id, filename, status, uploaded_at')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error("Error fetching videos:", error);
        return;
      }

      console.log("Fetched videos:", data);
      setVideos(data || []);

      // Fetch latest completed analysis if it's new
      if (data && data.length > 0) {
        const completedVideos = data.filter(v => v.status === 'completed');
        if (completedVideos.length > 0) {
          const latestCompletedId = completedVideos[0].id;
          // Only fetch analysis and new signed URL if the video ID has changed
          if (latestCompletedId !== latestAnalysis?.video_id) {
            await fetchLatestAnalysis(latestCompletedId);
          }
        }
      }
    } catch (error) {
      console.error("Exception fetching videos:", error);
    }
  };

  const fetchLatestAnalysis = async (videoId: string) => {
    try {
      // Fetch analysis
      const { data: analysisData, error: analysisError } = await supabase
        .from('analyses')
        .select('*')
        .eq('video_id', videoId)
        .single();

      if (analysisError) {
        console.error("Error fetching analysis:", analysisError);
        return;
      }

      setLatestAnalysis(analysisData);

      // Fetch video URL
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('storage_path')
        .eq('id', videoId)
        .single();

      if (videoError) return;

      const { data: urlData, error: urlError } = await supabase.storage
        .from('videos')
        .createSignedUrl(videoData.storage_path, 3600);

      if (!urlError && urlData) {
        setLatestVideoUrl(urlData.signedUrl);
      }
    } catch (error) {
      console.error("Error fetching latest analysis:", error);
    }
  };

  const fetchPendingInvitations = async (userId: string) => {
    setLoadingInvitations(true);
    try {
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
        .eq('player_id', userId)
        .eq('status', 'pending');

      if (error) throw error;

      const invitations = data?.map(item => ({
        roster_id: item.id,
        team_id: item.teams.id,
        team_name: item.teams.name,
        age_group: item.teams.age_group,
        club_name: item.teams.clubs?.name,
        status: item.status
      })) || [];

      console.log('Pending invitations:', invitations);
      setPendingInvitations(invitations);

    } catch (error: any) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoadingInvitations(false);
    }
  };


  const handleAcceptInvitation = async (rosterId: string) => {
    setProcessingInvite(true);
    try {
      const { error } = await supabase
        .from('team_rosters')
        .update({ status: 'active' })
        .eq('id', rosterId);

      if (error) throw error;

      toast({
        title: "Invitation Accepted! 🎉",
        description: "You have joined the team",
      });

      // Refresh invitations
      if (dbUser?.id) {
        await fetchPendingInvitations(dbUser.id);
      }

    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: "Could not accept invitation",
        variant: "destructive"
      });
    } finally {
      setProcessingInvite(false);
    }
  };

  const handleDeclineInvitation = async (rosterId: string) => {
    setProcessingInvite(true);
    try {
      const { error } = await supabase
        .from('team_rosters')
        .update({ status: 'declined' })
        .eq('id', rosterId);

      if (error) throw error;

      toast({
        title: "Invitation Declined",
        description: "The invitation has been declined",
      });

      // Refresh invitations
      if (dbUser?.id) {
        await fetchPendingInvitations(dbUser.id);
      }

    } catch (error: any) {
      console.error('Error declining invitation:', error);
      toast({
        title: "Error",
        description: "Could not decline invitation",
        variant: "destructive"
      });
    } finally {
      setProcessingInvite(false);
    }
  };


  const fetchMyTeams = async (userId: string) => {
    setLoadingTeams(true);
    try {
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
        .eq('player_id', userId)
        .in('status', ['active', 'pending']);

      if (error) throw error;

      const teams = data?.map(item => ({
        roster_id: item.id,
        team_id: item.teams.id,
        team_name: item.teams.name,
        age_group: item.teams.age_group,
        club_name: item.teams.clubs?.name,
        status: item.status
      })) || [];

      setMyTeams(teams);

    } catch (error: any) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoadingTeams(false);
    }
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
        await fetchMyTeams(dbUser.id);
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

  // Sync Clerk User to Supabase
  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !user) {
        console.log("Waiting for Clerk to load...");
        return;
      }

      console.log("Syncing user:", user.id);

      try {
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', user.id)
          .maybeSingle();

        if (fetchError) {
          console.error("Supabase fetch error:", fetchError);
          throw new Error(`DB Fetch Error: ${fetchError.message}`);
        }

        console.log("Existing user:", existingUser);

        let userId: string;

        if (!existingUser) {
          console.log("Creating new user in Supabase...");
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
              clerk_id: user.id,
              email: user.primaryEmailAddress?.emailAddress || '',
              name: user.fullName || user.firstName || 'Player',
              role: 'player'
            })
            .select()
            .single();

          if (insertError) {
            console.error("Supabase insert error:", insertError);
            throw new Error(`DB Insert Error: ${insertError.message}`);
          }

          console.log("New user created:", newUser);
          userId = newUser.id;
          setDbUser(newUser);
        } else {
          userId = existingUser.id;
          setDbUser(existingUser);
        }

        console.log("Fetching videos for user:", userId);
        await fetchVideos(userId);
        console.log("Fetching pending invitations...");
        await fetchPendingInvitations(userId);

        console.log("Fetching my teams...");
        await fetchMyTeams(userId);

      } catch (error: any) {
        console.error("❌ Sync error:", error);
        toast({
          title: "Database Error",
          description: error.message || "Could not connect to database. Please refresh the page.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    syncUser();
  }, [isLoaded, user]);

  // Poll for updates if any video is processing
  useEffect(() => {
    if (!dbUser?.id || videos.length === 0) return;

    const hasProcessing = videos.some(v => v.status === 'processing');
    if (!hasProcessing) return;

    console.log("Polling for video status updates...");
    const interval = setInterval(() => {
      fetchVideos(dbUser.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [videos, dbUser]);

  useEffect(() => {
    if (!dbUser?.id) return;

    console.log("Setting up invitations polling...");
    const interval = setInterval(() => {
      console.log("Polling for invitations...");
      fetchPendingInvitations(dbUser.id);
    }, 30000); // Проверять каждые 30 секунд

    return () => {
      console.log("Cleaning up invitations polling");
      clearInterval(interval);
    };
  }, [dbUser]);


  if (loading) {
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
    <div className="min-h-screen bg-gradient-card p-8">
      <div className="container mx-auto max-w-6xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Welcome, {user?.firstName || 'Player'}!</h1>
          <p className="text-muted-foreground">Your performance hub</p>
        </header>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Latest Analysis Card */}
            {latestAnalysis && latestVideoUrl ? (
              <Card className="border-2 border-primary/30">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Latest Analysis</CardTitle>
                    <Button onClick={() => setUploadModalOpen(true)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Analysis
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Video */}
                    <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                      <video
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-contain"
                        src={latestVideoUrl}
                      />
                    </div>

                    {/* Stats */}
                    <div className="space-y-4">
                      {/* Overall Score */}
                      <div className="text-center p-4 bg-primary/5 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
                        <div className={`text-5xl font-bold ${getScoreColor(latestAnalysis.overall)}`}>
                          {latestAnalysis.overall.toFixed(1)}
                        </div>
                      </div>

                      {/* Individual Scores */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Stability</span>
                            <span className={`font-bold ${getScoreColor(latestAnalysis.stability)}`}>
                              {latestAnalysis.stability.toFixed(1)}
                            </span>
                          </div>
                          <Progress value={latestAnalysis.stability} className="h-2" />
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Power</span>
                            <span className={`font-bold ${getScoreColor(latestAnalysis.power)}`}>
                              {latestAnalysis.power.toFixed(1)}
                            </span>
                          </div>
                          <Progress value={latestAnalysis.power} className="h-2" />
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Technique</span>
                            <span className={`font-bold ${getScoreColor(latestAnalysis.technique)}`}>
                              {latestAnalysis.technique.toFixed(1)}
                            </span>
                          </div>
                          <Progress value={latestAnalysis.technique} className="h-2" />
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Balance</span>
                            <span className={`font-bold ${getScoreColor(latestAnalysis.balance)}`}>
                              {latestAnalysis.balance.toFixed(1)}
                            </span>
                          </div>
                          <Progress value={latestAnalysis.balance} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-dashed border-primary/20">
                <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px] text-center">
                  <Upload className="h-16 w-16 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Analyses Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    Upload your first kick video to get AI-powered analysis
                  </p>
                  <Button onClick={() => setUploadModalOpen(true)} size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Upload First Video
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Recent Analysis */}
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
                  {videos.map((video) => (
                    <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="flex items-center p-4 gap-4">
                        <div className="h-16 w-24 bg-muted rounded flex items-center justify-center flex-shrink-0">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{video.filename}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span>{new Date(video.uploaded_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <Badge variant={video.status === 'completed' ? 'default' : video.status === 'processing' ? 'secondary' : 'destructive'}>
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
                        >
                          {video.status === 'completed' ? 'View Results' : 'Processing...'}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>Update your football details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Age</label>
                  <input
                    type="number"
                    min="0"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={dbUser.age || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setDbUser({ ...dbUser, age: isNaN(val) ? null : Math.max(0, val) });
                    }}
                    onBlur={() => updateProfile('age', dbUser.age)}
                    placeholder="Age"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Position</label>
                  <Select
                    value={dbUser.position || ''}
                    onValueChange={(value) => {
                      setDbUser({ ...dbUser, position: value });
                      updateProfile('position', value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Forward">Forward</SelectItem>
                      <SelectItem value="Midfielder">Midfielder</SelectItem>
                      <SelectItem value="Defender">Defender</SelectItem>
                      <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Club</label>
                  <input
                    type="text"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={dbUser.club || ''}
                    onChange={(e) => setDbUser({ ...dbUser, club: e.target.value })}
                    onBlur={() => updateProfile('club', dbUser.club)}
                    placeholder="Current Club"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Height (cm)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={dbUser.height || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setDbUser({ ...dbUser, height: isNaN(val) ? null : Math.max(0, val) });
                      }}
                      onBlur={() => updateProfile('height', dbUser.height)}
                      placeholder="180"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Weight (kg)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={dbUser.weight || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setDbUser({ ...dbUser, weight: isNaN(val) ? null : Math.max(0, val) });
                      }}
                      onBlur={() => updateProfile('weight', dbUser.weight)}
                      placeholder="75"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate('/join-team')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Join a Team
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Profile Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Videos Analyzed</span>
                  <span className="font-bold text-lg">{videos.filter(v => v.status === 'completed').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Videos Processing</span>
                  <span className="font-bold text-lg">{videos.filter(v => v.status === 'processing').length}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-primary">Pro Tip</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      For best results, film from the side (90° angle) with your whole body visible in frame.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Team Invitations Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Team Invitations
                  {pendingInvitations.length > 0 && (
                    <Badge variant="destructive">{pendingInvitations.length}</Badge>
                  )}
                </CardTitle>
                <CardDescription>Join requests from coaches</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingInvitations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : pendingInvitations.length > 0 ? (
                  pendingInvitations.map((invite) => (
                    <div key={invite.id} className="border rounded-lg p-3 space-y-2">
                      <div>
                        <p className="font-medium text-sm">{invite.team_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {invite.club_name} • {invite.age_group}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAcceptInvitation(invite.roster_id)}
                          disabled={processingInvite}
                        >
                          {processingInvite ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleDeclineInvitation(invite.roster_id)}
                          disabled={processingInvite}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No pending invitations</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => navigate('/join-team')}
                      className="mt-2"
                    >
                      Join a team manually
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* My Teams Card - добавь ПОСЛЕ карточки Team Invitations */}
            <Card>
              <CardHeader>
                <CardTitle>My Teams</CardTitle>
                <CardDescription>Teams you're part of</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingTeams ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : myTeams.length > 0 ? (
                  myTeams.map((team) => (
                    <div key={team.roster_id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{team.team_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {team.club_name} • {team.age_group}
                          </p>
                        </div>
                        <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                          {team.status}
                        </Badge>
                      </div>

                      {team.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-red-600 hover:text-red-700"
                          onClick={() => handleLeaveTeam(team.roster_id, team.team_name)}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Leave Team
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Not part of any team yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}