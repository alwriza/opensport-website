import { useEffect, useState } from "react";
import { AnalysisVideo } from "@/components/redesign/AnalysisVideo";
import { useDesignCopy } from "@/hooks/useDesignCopy";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDemoContext, useDemoMutationGuard } from "@/demo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, Trophy, Clock, X, Check, Video, User } from "lucide-react";

interface Duel {
  id: string;
  challenger_id: string;
  opponent_id: string;
  challenger_video_id: string | null;
  opponent_video_id: string | null;
  challenger_score: number | null;
  opponent_score: number | null;
  status: "pending" | "active" | "completed" | "declined" | "expired";
  winner_id: string | null;
  deadline_at: string | null;
  created_at: string;
  completed_at: string | null;
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

export default function Duels() {
  const copy = useDesignCopy();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const demo = useDemoContext();
  const { guard } = useDemoMutationGuard();

  const DEMO_DUELS: Duel[] = [
    {
      id: "demo-duel-1",
      challenger_id: "demo-user-id",
      opponent_id: "demo-opponent-1",
      challenger_video_id: "demo-video-1",
      opponent_video_id: "demo-video-2",
      challenger_score: 87.3,
      opponent_score: 82.1,
      status: "completed",
      winner_id: "demo-user-id",
      deadline_at: null,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    },
  ];

  const DEMO_OPPONENT_NAME = "Marcus Silva";

  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeNickname, setChallengeNickname] = useState("");
  const [challengeLoading, setChallengeLoading] = useState(false);

  const [uploadDuelId, setUploadDuelId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [cameraAngle, setCameraAngle] = useState("unknown");
  const [kickingFoot, setKickingFoot] = useState("unknown");
  const [uploading, setUploading] = useState(false);

  const { data: dbUserId } = useQuery({
    queryKey: ["db-user-id", user?.id, !!demo],
    queryFn: async () => {
      if (demo) return "demo-user-id";
      if (!user) return null;
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
    enabled: !!user || !!demo,
  });

  const { data: duels = [], refetch } = useQuery({
    queryKey: ["duels", dbUserId],
    queryFn: async () => {
      if (demo) return DEMO_DUELS;
      if (!dbUserId) return [];
      const { data, error } = await supabase
        .from("duels")
        .select("*")
        .or(`challenger_id.eq.${dbUserId},opponent_id.eq.${dbUserId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Duel[];
    },
    enabled: !!dbUserId || !!demo,
  });

  useEffect(() => {
    if (demo || !dbUserId) return;
    const channel = supabase
      .channel("duels-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "duels" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["duels", dbUserId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dbUserId, queryClient, demo]);

  const handleChallenge = async () => {
    if (guard() || !challengeNickname.trim()) return;
    setChallengeLoading(true);
    try {
      const token = await getAccessToken();
      const { data, error } = await supabase.functions.invoke("create-duel", {
        headers: { Authorization: `Bearer ${token}` },
        body: { opponentNickname: challengeNickname.trim() },
      });
      if (error) throw new Error((error as any)?.context?.error || error.message);
      if ((data as any)?.error) throw new Error((data as any).error);

      toast({ title: "Challenge sent", description: `Waiting for ${challengeNickname} to respond.` });
      setChallengeOpen(false);
      setChallengeNickname("");
      refetch();
    } catch (err: any) {
      const msg = err.message || "";
      let description = "Something went wrong.";
      if (msg.includes("user_not_found")) description = "No player found with that nickname.";
      else if (msg.includes("cannot_challenge_yourself")) description = "You can't challenge yourself.";
      else if (msg.includes("duel_already_pending")) description = "You already have a pending challenge with this player.";
      toast({ title: "Could not send challenge", description, variant: "destructive" });
    } finally {
      setChallengeLoading(false);
    }
  };

  const handleRespond = async (duelId: string, action: "accept" | "decline") => {
    if (guard()) return;
    try {
      const token = await getAccessToken();
      const { data, error } = await supabase.functions.invoke("respond-duel", {
        headers: { Authorization: `Bearer ${token}` },
        body: { duelId, action },
      });
      if (error) throw new Error((error as any)?.context?.error || error.message);
      if ((data as any)?.error) throw new Error((data as any).error);

      toast({ title: action === "accept" ? "Duel accepted" : "Duel declined" });
      refetch();
    } catch (err: any) {
      toast({ title: "Could not respond", description: err.message, variant: "destructive" });
    }
  };

  const handleUploadForDuel = async () => {
    if (guard()) return;
    if (!file || !uploadDuelId || !dbUserId) return;
    setUploading(true);
    try {
      const filePath = `${dbUserId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("videos").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: videoRow, error: insertError } = await supabase
        .from("videos")
        .insert({
          user_id: dbUserId,
          storage_path: filePath,
          filename: file.name,
          file_size_mb: file.size / (1024 * 1024),
          status: "processing",
        })
        .select()
        .single();
      if (insertError) throw insertError;

      const token = await getAccessToken();
      const { data: submitData, error: submitError } = await supabase.functions.invoke(
        "submit-duel-video",
        {
          headers: { Authorization: `Bearer ${token}` },
          body: { duelId: uploadDuelId, videoId: videoRow.id },
        }
      );
      if (submitError) throw new Error((submitError as any)?.context?.error || submitError.message);
      if ((submitData as any)?.error) throw new Error((submitData as any).error);

      const { error: processError } = await supabase.functions.invoke("process-video", {
        body: { video_id: videoRow.id, camera_angle: cameraAngle, kicking_foot: kickingFoot },
      });
      if (processError) {
        await supabase.from("videos").update({ status: "failed" }).eq("id", videoRow.id);
        throw processError;
      }

      toast({ title: "Video submitted", description: "We'll notify you when your opponent finishes." });
      setUploadDuelId(null);
      setFile(null);
      setCameraAngle("unknown");
      setKickingFoot("unknown");
      refetch();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (!dbUserId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const incoming = duels.filter((d) => d.status === "pending" && d.opponent_id === dbUserId);
  const sentPending = duels.filter((d) => d.status === "pending" && d.challenger_id === dbUserId);
  const active = duels.filter((d) => d.status === "active");
  const completed = duels.filter((d) => d.status === "completed");

  const mySide = (d: Duel) => (d.challenger_id === dbUserId ? "challenger" : "opponent");
  const myVideoSubmitted = (d: Duel) =>
    mySide(d) === "challenger" ? !!d.challenger_video_id : !!d.opponent_video_id;

  return (
    <div className="design-page design-secondary-page space-y-10">
      <div className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="editorial-eyebrow mb-3">OPENSPORT / COMPETE</p>
          <h1 className="text-4xl font-extrabold uppercase tracking-[-.04em] md:text-6xl">Duels</h1>
          <p className="mt-3 text-muted-foreground">Challenge other players and compare your best shots.</p>
        </div>
        <Dialog open={challengeOpen} onOpenChange={setChallengeOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              Challenge someone
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Challenge a player</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                value={challengeNickname}
                onChange={(e) => setChallengeNickname(e.target.value)}
                placeholder="Enter their nickname"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setChallengeOpen(false)} disabled={challengeLoading}>
                Cancel
              </Button>
              <Button onClick={handleChallenge} disabled={challengeLoading}>
                {challengeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send challenge
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {incoming.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Incoming challenges</h2>
          <div className="space-y-3">
            {incoming.map((d) => (
              <Card key={d.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">You've been challenged</p>
                    <p className="text-sm text-muted-foreground">
                      Respond before {d.deadline_at ? new Date(d.deadline_at).toLocaleDateString() : "the deadline"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleRespond(d.id, "decline")}>
                      <X className="h-4 w-4 mr-1" /> Decline
                    </Button>
                    <Button size="sm" onClick={() => handleRespond(d.id, "accept")}>
                      <Check className="h-4 w-4 mr-1" /> Accept
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {sentPending.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Sent challenges</h2>
          <div className="space-y-3">
            {sentPending.map((d) => (
              <Card key={d.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Waiting for a response
                  </p>
                  <Badge variant="secondary">Pending</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Active duels</h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active duels right now.</p>
        ) : (
          <div className="space-y-3">
            {active.map((d) => {
              const submitted = myVideoSubmitted(d);
              return (
                <Card key={d.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">Active duel</p>
                      <p className="text-sm text-muted-foreground">
                        {submitted ? "Waiting for your opponent's video" : "Upload your video to compete"}
                      </p>
                    </div>
                    {!submitted && (
                      <Dialog open={uploadDuelId === d.id} onOpenChange={(open) => setUploadDuelId(open ? d.id : null)}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Upload className="h-4 w-4 mr-1" /> Upload video
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Submit your duel video</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="duel-video">Video file</Label>
                              <Input
                                id="duel-video"
                                type="file"
                                accept="video/*"
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Camera angle</Label>
                              <Select value={cameraAngle} onValueChange={setCameraAngle}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="side">Side</SelectItem>
                                  <SelectItem value="diagonal">Diagonal</SelectItem>
                                  <SelectItem value="behind">Behind</SelectItem>
                                  <SelectItem value="unknown">Unknown</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Kicking foot</Label>
                              <Select value={kickingFoot} onValueChange={setKickingFoot}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="right">Right</SelectItem>
                                  <SelectItem value="left">Left</SelectItem>
                                  <SelectItem value="unknown">Unknown</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setUploadDuelId(null)} disabled={uploading}>
                              Cancel
                            </Button>
                            <Button onClick={handleUploadForDuel} disabled={uploading || !file}>
                              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Submit
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Completed</h2>
        {completed.length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed duels yet.</p>
        ) : (
          <div className="space-y-3">
            {completed.map((d) => {
              const iWon = d.winner_id === dbUserId;
              const isDraw = d.winner_id === null;
              const myScore = mySide(d) === "challenger" ? d.challenger_score : d.opponent_score;
              const theirScore = mySide(d) === "challenger" ? d.opponent_score : d.challenger_score;
              const myVideoId = mySide(d) === "challenger" ? d.challenger_video_id : d.opponent_video_id;
              const theirVideoId = mySide(d) === "challenger" ? d.opponent_video_id : d.challenger_video_id;
              const opponentName = demo && d.id === "demo-duel-1" ? DEMO_OPPONENT_NAME : "Opponent";
              return (
                <Card key={d.id} className="border-border">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {isDraw ? (
                          <Badge variant="secondary" className="text-sm">Draw</Badge>
                        ) : iWon ? (
                          <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1"><Trophy className="h-4 w-4 mr-1" /> You won</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-sm">You lost</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{d.created_at ? new Date(d.created_at).toLocaleDateString() : ""}</p>
                    </div>

                    {/* Score comparison */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className={`p-4 rounded-sm border ${iWon && !isDraw ? "bg-primary/10 border-primary/30" : "bg-secondary/35 border-border"}`}>
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><User className="h-3 w-3" /> You</p>
                        <p className="text-3xl font-black">{myScore?.toFixed(1) ?? "—"}</p>
                      </div>
                      <div className={`p-4 rounded-sm border ${!iWon && !isDraw ? "bg-destructive/10 border-destructive/30" : "bg-secondary/35 border-border"}`}>
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><User className="h-3 w-3" /> {opponentName}</p>
                        <p className="text-3xl font-black">{theirScore?.toFixed(1) ?? "—"}</p>
                      </div>
                    </div>

                    {!demo && (myVideoId || theirVideoId) && <div className="design-duel-videos">
                      <AnalysisVideo title={copy("Your video")} video={myVideoId ? { id: myVideoId, filename: copy("Your video") } : undefined} emptyMessage={copy("No video available.")} showCaption={false} />
                      <AnalysisVideo title={copy("Opponent's video")} video={theirVideoId ? { id: theirVideoId, filename: copy("Opponent's video") } : undefined} emptyMessage={copy("No video available.")} showCaption={false} />
                    </div>}

                    {/* Video preview for demo */}
                    {demo && d.id === "demo-duel-1" && (
                      <div className="mb-4 p-3 rounded-sm bg-secondary/35 border border-border flex items-center gap-3">
                        <div className="w-16 h-12 rounded-sm bg-primary/10 flex items-center justify-center border border-border shrink-0">
                          <Video className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground/80">Shared kick video</p>
                          <p className="text-[10px] text-muted-foreground">Side angle · Both players analyzed the same source</p>
                        </div>
                        <div className="ml-auto flex items-center gap-2 text-[10px]">
                          <span className="text-primary font-bold">87.3</span>
                          <span className="text-muted-foreground">vs</span>
                          <span className="text-destructive font-bold">82.1</span>
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] text-muted-foreground">
                      Winner: {isDraw ? "Draw" : iWon ? "You" : opponentName}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
