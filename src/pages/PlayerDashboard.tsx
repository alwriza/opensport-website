import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, User, Trophy, TrendingUp, Loader2, Video, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface VideoRecord {
  id: string;
  filename: string;
  status: string;
  created_at: string;
}

export default function PlayerDashboard() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();

  const [dbUser, setDbUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [videos, setVideos] = useState<VideoRecord[]>([]);

  // Sync Clerk User to Supabase
  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !user) return;

      try {
        // 1. Check if user exists in Supabase
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error("Error fetching user:", fetchError);
        }

        let userId = existingUser?.id;

        // 2. If not, create user
        if (!existingUser) {
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
              clerk_id: user.id,
              email: user.primaryEmailAddress?.emailAddress,
              name: user.fullName,
              role: 'player'
            })
            .select()
            .single();

          if (insertError) throw insertError;
          userId = newUser.id;
        }

        setDbUser({ ...existingUser, id: userId });

        // 3. Fetch user's videos
        if (userId) {
          fetchVideos(userId);
        }

      } catch (error: any) {
        console.error("Sync error:", error);
        toast({
          title: "Sync Error",
          description: "Could not sync user data.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    syncUser();
  }, [isLoaded, user]);

  const fetchVideos = async (userId: string) => {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    if (!error && data) {
      setVideos(data);
    }
  };

  // Poll for updates if any video is processing
  useEffect(() => {
    if (!dbUser || videos.length === 0) return;

    const hasProcessing = videos.some(v => v.status === 'processing');
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchVideos(dbUser.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [videos, dbUser]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !dbUser) return;

    // Validate
    if (file.size > 100 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 100MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${dbUser.id}/${fileName}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

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

      if (dbError) throw dbError;

      // 3. Trigger Analysis
      const { error: fnError } = await supabase.functions.invoke('process-video', {
        body: { video_id: newVideo.id }
      });

      if (fnError) {
        console.error("Analysis trigger failed:", fnError);
        toast({
          title: "Analysis Queued (Delayed)",
          description: "Video uploaded, but auto-analysis failed to start. It may process later."
        });
      } else {
        toast({
          title: "Upload Successful",
          description: "Your video is now being analyzed.",
        });
      }

      fetchVideos(dbUser.id);

    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-card p-8">
      <div className="container mx-auto max-w-6xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Welcome, {user?.firstName}</h1>
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
                    <p>Uploading video...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Upload Request</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                      Upload your training or match video for AI analysis. Supported formats: .mp4, .mov
                    </p>
                    <div className="relative">
                      <input
                        type="file"
                        accept="video/*"
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
            <h2 className="text-xl font-bold">Recent Analysis</h2>
            {videos.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No videos uploaded yet. Upload your first video to get started!
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {videos.map((video) => (
                  <Card key={video.id} className="overflow-hidden">
                    <div className="flex items-center p-4 gap-4">
                      <div className="h-16 w-24 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        <Video className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{video.filename}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <span>{new Date(video.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <Badge variant={video.status === 'completed' ? 'default' : 'secondary'}>
                            {video.status}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Videos Analyzed</span>
                  <span className="font-bold">{videos.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Avg Score</span>
                  <span className="font-bold">-</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-primary">Pro Tip</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      For best results, ensure your whole body is visible in the frame during the kick.
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