import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Upload } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/use-toast";
import { queueMatchAnalysis, useAppUserId, useMatchAnalyses } from "@/hooks/useMatchAnalyses";
import { uploadMatchVideo, type UploadHandle } from "@/lib/matchAnalysisUpload";
import type { MatchAnalysisRow, MatchAnalysisStatus } from "@/types/matchAnalysis";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const STATUS_VARIANT: Record<MatchAnalysisStatus, "default" | "secondary" | "destructive" | "outline"> = {
  queued: "outline",
  processing: "secondary",
  done: "default",
  failed: "destructive",
};

function AnalysisCard({ row }: { row: MatchAnalysisRow }) {
  const body = (
    <Card className="transition-colors hover:border-primary/50">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">
            {row.video_path.split("/").pop()}
          </CardTitle>
          <CardDescription>{new Date(row.created_at).toLocaleString()}</CardDescription>
        </div>
        <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>
      </CardHeader>
      {(row.summary || row.error) && (
        <CardContent className="text-sm text-muted-foreground">
          {row.error ? (
            <p className="text-destructive">{row.error}</p>
          ) : (
            <p>
              {row.summary!.analyzed_seconds}s analysed ·{" "}
              pitch mapped in {Math.round(row.summary!.homography_coverage * 100)}% of frames ·{" "}
              A {Math.round(row.summary!.teams.A.distance_m)} m / B {Math.round(row.summary!.teams.B.distance_m)} m
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );

  return row.status === "done" ? <Link to={`/match-analysis/${row.id}`}>{body}</Link> : body;
}

export default function MatchAnalysis() {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: appUserId } = useAppUserId(user?.id);
  const { data: analyses, isLoading } = useMatchAnalyses(appUserId);

  const inputRef = useRef<HTMLInputElement>(null);
  const handleRef = useRef<UploadHandle | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  async function onFile(file: File) {
    if (!appUserId) return;
    setProgress(0);
    try {
      handleRef.current = uploadMatchVideo(file, appUserId, setProgress);
      const videoPath = await handleRef.current.done;
      await queueMatchAnalysis(appUserId, videoPath);
      await queryClient.invalidateQueries({ queryKey: ["match-analyses", appUserId] });
      toast({ title: "Queued", description: "The worker will pick this clip up shortly." });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setProgress(null);
      handleRef.current = null;
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Match Analysis</h1>
        <p className="text-muted-foreground">
          Upload a broadcast-style clip filmed from a fixed elevated camera with the whole pitch in
          frame. Only the first 5 minutes are analysed.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/quicktime"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
          {progress === null ? (
            <Button onClick={() => inputRef.current?.click()} disabled={!appUserId}>
              <Upload className="mr-2 h-4 w-4" />
              Upload match video
            </Button>
          ) : (
            <div className="space-y-3">
              <Progress value={progress} />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Uploading… {progress}%</span>
                <Button variant="ghost" size="sm" onClick={() => handleRef.current?.abort()}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Your analyses</h2>
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : analyses?.length ? (
          analyses.map((row) => <AnalysisCard key={row.id} row={row} />)
        ) : (
          <p className="text-sm text-muted-foreground">Nothing uploaded yet.</p>
        )}
      </section>
    </div>
  );
}
