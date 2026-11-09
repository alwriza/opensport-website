import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, Film, Loader2, Upload } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useDemoContext, useDemoMutationGuard } from "@/demo";
import { DEMO_MATCH_ID, demoMatchRows } from "@/demo/matchDemo";
import { useToast } from "@/hooks/use-toast";
import { queueMatchAnalysis, useAppUserId, useMatchAnalyses } from "@/hooks/useMatchAnalyses";
import {
  MATCH_MAX_UPLOAD_MB,
  UploadCancelledError,
  checkMatchFile,
  uploadMatchVideo,
  type UploadHandle,
} from "@/lib/matchAnalysisUpload";
import type { MatchAnalysisRow } from "@/types/matchAnalysis";
import { ExampleCard } from "@/components/match/ExampleCard";
import { STATUS_TONE, clipName, failureText, formatDateTime, percent } from "@/components/match/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

function AnalysisCard({ row, base, highlight = false }: { row: MatchAnalysisRow; base: string; highlight?: boolean }) {
  const { t, i18n } = useTranslation("match");
  const done = row.status === "done";
  const running = row.status === "queued" || row.status === "processing";

  return (
    <Link to={`${base}/match-analysis/${row.id}`} className="block">
      <Card className={cn("transition-colors hover:border-primary/50", highlight && "border-primary/60 bg-primary/5 ring-2 ring-primary/20")}>
        <CardContent className="flex items-start gap-4 p-4 sm:p-5">
          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted sm:flex">
            <Film className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium">{clipName(row.video_path)}</p>
              <Badge variant="outline" className={cn("whitespace-nowrap", STATUS_TONE[row.status])}>
                {running && <Loader2 className="mr-1 h-3 w-3 animate-spin" aria-hidden="true" />}
                {t(`status.${row.status}`)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{formatDateTime(row.created_at, i18n.language)}</p>
            {done && row.summary && (
              <p className="text-sm text-muted-foreground">
                {t("list.analysed", { seconds: Math.round(row.summary.analyzed_seconds) })} ·{" "}
                {t("list.mapped", { percent: percent(row.summary.homography_coverage) })} ·{" "}
                {t("list.distance", {
                  a: Math.round(row.summary.teams.A.distance_m),
                  b: Math.round(row.summary.teams.B.distance_m),
                })}
              </p>
            )}
            {row.status === "failed" && <p className="text-sm text-destructive">{failureText(row.error, t)}</p>}
          </div>
          {done && (
            <span className="hidden items-center gap-1 self-center text-sm font-medium text-primary sm:inline-flex">
              {t("list.open")} <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function MatchAnalysis() {
  const { t } = useTranslation("match");
  const { user } = useCurrentUser();
  const demo = useDemoContext();
  const { guard: guardDemo } = useDemoMutationGuard();
  const base = demo ? "/demo" : "";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: appUserId } = useAppUserId(demo ? undefined : user?.id);
  const liveAnalyses = useMatchAnalyses(appUserId);
  // In the demo the finished report comes first: it is what the visitor should open.
  const analyses = demo ? [...demoMatchRows()].sort((a, b) => Number(b.status === "done") - Number(a.status === "done")) : liveAnalyses.data;
  const isLoading = !demo && liveAnalyses.isLoading;

  const inputRef = useRef<HTMLInputElement>(null);
  const handleRef = useRef<UploadHandle | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const uploading = progress !== null;

  // Leaving the page aborts the upload, so ask first.
  useEffect(() => {
    if (!uploading) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [uploading]);

  async function onFile(file: File) {
    if (guardDemo() || !appUserId || uploading) return;
    const problem = checkMatchFile(file);
    if (problem) {
      toast({
        title: t("upload.failedTitle"),
        description:
          problem.kind === "wrongType"
            ? t("upload.wrongType")
            : t("upload.tooLarge", { size: problem.sizeMb, limit: MATCH_MAX_UPLOAD_MB }),
        variant: "destructive",
      });
      return;
    }

    setFileName(file.name);
    setProgress(0);
    try {
      handleRef.current = uploadMatchVideo(file, appUserId, setProgress);
      const videoPath = await handleRef.current.done;
      await queueMatchAnalysis(appUserId, videoPath);
      await queryClient.invalidateQueries({ queryKey: ["match-analyses", appUserId] });
      toast({ title: t("upload.doneTitle"), description: t("upload.doneText") });
    } catch (error) {
      if (!(error instanceof UploadCancelledError)) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("match upload failed:", error);
        toast({
          title: t("upload.failedTitle"),
          description: message.includes("not signed in") ? t("upload.signInAgain") : t("upload.failedText"),
          variant: "destructive",
        });
      }
    } finally {
      setProgress(null);
      handleRef.current = null;
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void onFile(file);
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="max-w-2xl text-muted-foreground">{t("subtitle")}</p>
      </header>

      {demo ? (
        <ExampleCard prominent to={`/demo/match-analysis/${DEMO_MATCH_ID}`} />
      ) : (
        !isLoading && <ExampleCard prominent={!analyses?.some((row) => row.status === "done")} />
      )}

      <Card>
        <CardContent className="grid gap-6 p-5 sm:p-6 md:grid-cols-[1fr_minmax(0,16rem)]">
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/quicktime,.mp4,.mov"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
          {uploading ? (
            <div className="flex flex-col justify-center gap-3 rounded-md border border-dashed p-6" aria-live="polite">
              <p className="truncate text-sm font-medium">{t("upload.uploading", { name: fileName })}</p>
              <Progress value={progress} />
              <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
                <span className="tabular-nums">{progress}%</span>
                <Button variant="ghost" size="sm" onClick={() => handleRef.current?.abort()}>
                  {t("upload.cancel")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t("upload.keepOpen")}</p>
            </div>
          ) : (
            <div
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-md border border-dashed p-8 text-center transition-colors",
                dragging ? "border-primary bg-primary/5" : "border-border",
              )}
            >
              <Upload className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <Button onClick={() => (guardDemo() ? undefined : inputRef.current?.click())} disabled={!demo && !appUserId}>
                {t("upload.button")}
              </Button>
              <p className="hidden text-sm text-muted-foreground sm:block">{dragging ? t("upload.dropActive") : t("upload.drop")}</p>
            </div>
          )}

          <div className="space-y-2 text-sm">
            <p className="font-medium">{t("requirements.title")}</p>
            <ul className="list-disc space-y-1.5 pl-4 text-muted-foreground">
              <li>{t("requirements.camera")}</li>
              <li>{t("requirements.pitch")}</li>
              <li>{t("requirements.length")}</li>
              <li>{t("requirements.format", { limit: MATCH_MAX_UPLOAD_MB })}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t("list.title")}</h2>
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : analyses?.length ? (
          <div className="space-y-3">
            {analyses.map((row) => (
              <AnalysisCard key={row.id} row={row} base={base} highlight={!!demo && row.id === DEMO_MATCH_ID} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("list.empty")}</p>
        )}
      </section>
    </div>
  );
}
