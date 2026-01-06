import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Trophy, Loader2, Video, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VideoRecord {
  id: string;
  filename: string;
  status: string;
  uploaded_at: string;
}

export default function PlayerDashboard() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [dbUser, setDbUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [videos, setVideos] = useState<VideoRecord[]>([]);

  // Sync Clerk User to Supabase
  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !user) {
        console.log("Waiting for Clerk to load...");
        return;
      }

      console.log("Syncing user:", user.id);

      try {
        // 1. Check if user exists in Supabase
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', user.id)
          .maybeSingle(); // ✅ FIXED: Returns null if not found, no error

        if (fetchError) {
          console.error("Supabase fetch error:", fetchError);
          throw new Error(`DB Fetch Error: ${fetchError.message}`);
        }

        console.log("Existing user:", existingUser);

        let userId: string;

        // 2. If not found, create user
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

        // 3. Fetch user's videos
        console.log("Fetching videos for user:", userId);
        await fetchVideos(userId);

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
    } catch (error) {
      console.error("Exception fetching videos:", error);
    }
  };

  // Poll for updates if any video is processing
  useEffect(() => {
    if (!dbUser?.id || videos.length === 0) return;

    const hasProcessing = videos.some(v => v.status === 'processing');
    if (!hasProcessing) return;

    console.log("Polling for video status updates...");
    const interval = setInterval(() => {
      fetchVideos(dbUser.id);
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [videos, dbUser]);

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

    // Validate file
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

      // 1. Upload to Storage
      console.log("Uploading to storage:", filePath);
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file);

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

      console.log("✓ Upload successful");

      // 2. Create DB Record
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

      // 3. Trigger Analysis (Edge Function)
      console.log("Triggering analysis...");
      const { error: fnError } = await supabase.functions.invoke('process-video', {
        body: { video_id: newVideo.id }
      });

      if (fnError) {
        console.error("Edge function error:", fnError);
        toast({
          title: "Analysis Queued",
          description: "Video uploaded. Analysis will start shortly.",
        });
      } else {
        toast({
          title: "Upload Successful",
          description: "Your video is being analyzed. This may take 30-60 seconds.",
        });
      }

      // 4. Refresh video list
      await fetchVideos(dbUser.id);

    } catch (error: any) {
      console.error("❌ Upload failed:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Loading state
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

  // Error state
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
            {/* Upload Card */}
            <Card className="border-2 border-dashed border-primary/20 bg-background/50">
              <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px] text-center">
                {uploading ? (
                  <div className="space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                    <p className="text-lg font-medium">Uploading video...</p>
                    <p className="text-sm text-muted-foreground">This may take a few moments</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Upload Kick Video</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                      Upload your training or match video for AI analysis. Supported formats: MP4, MOV, AVI, MKV (max 100MB)
                    </p>
                    <div className="relative">
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading}
                      />
                      <Button size="lg">Select Video File</Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Recent Analysis */}
            <div>
              <h2 className="text-xl font-bold mb-4">Recent Analysis</h2>
              {videos.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No videos uploaded yet.</p>
                    <p className="text-sm mt-2">Upload your first video to get AI-powered analysis!</p>
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
            {/* Profile Card */}
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={dbUser.age || ''}
                    onChange={(e) => setDbUser({ ...dbUser, age: parseInt(e.target.value) || null })}
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
                      <SelectItem value="Striker">Striker</SelectItem>
                      <SelectItem value="Winger">Winger</SelectItem>
                      <SelectItem value="Attacking Midfielder">Attacking Midfielder</SelectItem>
                      <SelectItem value="Central Midfielder">Central Midfielder</SelectItem>
                      <SelectItem value="Defensive Midfielder">Defensive Midfielder</SelectItem>
                      <SelectItem value="Full-back">Full-back</SelectItem>
                      <SelectItem value="Center-back">Center-back</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Club</label>
                  <input
                    type="text"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={dbUser.height || ''}
                      onChange={(e) => setDbUser({ ...dbUser, height: parseFloat(e.target.value) || null })}
                      onBlur={() => updateProfile('height', dbUser.height)}
                      placeholder="180"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Weight (kg)</label>
                    <input
                      type="number"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={dbUser.weight || ''}
                      onChange={(e) => setDbUser({ ...dbUser, weight: parseFloat(e.target.value) || null })}
                      onBlur={() => updateProfile('weight', dbUser.weight)}
                      placeholder="75"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
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

            {/* Pro Tip Card */}
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
          </div>
        </div>
      </div>
    </div>
  );
}