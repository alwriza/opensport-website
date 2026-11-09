import { useEffect, useRef } from "react";
import { MATCH_EXAMPLE_ID, markMatchExampleSeen } from "@/lib/matchExample";
import { useDemoContext } from "@/demo";
import { DEMO_MATCH_ID, DEMO_MATCH_RESULTS_URL, demoMatchRows } from "@/demo/matchDemo";
import { DemoReplay, type Clock as ReplayClock } from "@/components/match/DemoReplay";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ArrowLeft, Clock, Loader2, Upload } from "lucide-react";
import { useDemoMatchResults, useMatchAnalysis, useMatchResults, useSignedVideoUrl } from "@/hooks/useMatchAnalyses";
import { TEAM_COLORS, TEAM_KEYS } from "@/types/matchAnalysis";
import type { MatchAnalysisResults, MatchAnalysisRow, TeamKey } from "@/types/matchAnalysis";
import { DominanceChart } from "@/components/match/DominanceChart";
import { MinimapReplay, REFEREE_COLOR } from "@/components/match/MinimapReplay";
import { PitchHeatmap } from "@/components/match/PitchHeatmap";
import { clipName, failureText, formatDateTime, percent, possessionReason } from "@/components/match/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const fmt = (value: number, digits = 1) => value.toFixed(digits).replace(/\.0+$/, "");

function TeamDot({ team, className = "h-3 w-3" }: { team: TeamKey; className?: string }) {
  return <span className={`${className} inline-block shrink-0 rounded-full`} style={{ backgroundColor: TEAM_COLORS[team] }} />;
}

function Stat({ label, value, note }: { label: string; value: string; note?: string | null }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

function TeamCard({ results, team }: { results: MatchAnalysisResults; team: TeamKey }) {
  const { t } = useTranslation("match");
  const m = results.teams[team];
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TeamDot team={team} /> {t("detail.team", { team })}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <Stat label={t("detail.distance")} value={`${Math.round(m.distance_m)} ${t("detail.units.m")}`} />
        <Stat label={t("detail.topSpeed")} value={`${fmt(m.top_speed_kmh)} ${t("detail.units.kmh")}`} />
        <Stat label={t("detail.avgSpeed")} value={`${fmt(m.avg_speed_kmh)} ${t("detail.units.kmh")}`} />
        <Stat label={t("detail.dominance")} value={m.dominance_pct === null ? t("detail.unavailable") : `${fmt(m.dominance_pct)}%`} />
        <div className="col-span-2">
          <Stat
            label={t("detail.possession")}
            value={m.possession_pct === null ? t("detail.unavailable") : `${fmt(m.possession_pct)}%`}
            note={m.possession_pct === null ? possessionReason(m.possession_unavailable_reason, t) : null}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function useBase() {
  return useDemoContext() ? "/demo" : "";
}

function BackLink() {
  const { t } = useTranslation("match");
  return (
    <Link to={`${useBase()}/match-analysis`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> {t("detail.back")}
    </Link>
  );
}

function PendingView({ row }: { row: MatchAnalysisRow }) {
  const { t, i18n } = useTranslation("match");
  const queued = row.status === "queued";
  return (
    <div className="container mx-auto max-w-3xl space-y-4 px-4 py-10">
      <BackLink />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {queued ? <Clock className="h-5 w-5 text-amber-600" /> : <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            {t(queued ? "pending.queuedTitle" : "pending.processingTitle")}
          </CardTitle>
          <CardDescription className="break-all">{clipName(row.video_path)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            {queued
              ? t("pending.queuedText", { time: formatDateTime(row.created_at, i18n.language) })
              : t("pending.processingText", { time: formatDateTime(row.started_at, i18n.language) })}
          </p>
          <p>{t("pending.autoRefresh")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function FailedView({ row }: { row: MatchAnalysisRow }) {
  const { t } = useTranslation("match");
  return (
    <div className="container mx-auto max-w-3xl space-y-4 px-4 py-10">
      <BackLink />
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-destructive" /> {t("errors.title")}
          </CardTitle>
          <CardDescription className="break-all">{clipName(row.video_path)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>{failureText(row.error, t)}</p>
          {row.error && (
            <details className="text-muted-foreground">
              <summary className="cursor-pointer">{t("errors.details")}</summary>
              <p className="mt-2 break-words font-mono text-xs">{row.error}</p>
            </details>
          )}
          <Button asChild>
            <Link to={`${useBase()}/match-analysis`}>{t("errors.tryAgain")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function CenteredLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export default function MatchAnalysisDetail() {
  const { t, i18n } = useTranslation("match");
  const { id } = useParams<{ id: string }>();
  const demo = useDemoContext();
  // /match-analysis/example shows the demo report inside the signed-in app.
  const example = !demo && id === MATCH_EXAMPLE_ID;
  const sample = !!demo || example;
  const videoRef = useRef<HTMLVideoElement>(null);
  const demoClock = useRef<ReplayClock>({ currentTime: 0 });

  useEffect(() => {
    if (example || (demo && id === DEMO_MATCH_ID)) markMatchExampleSeen();
  }, [example, demo, id]);

  const live = useMatchAnalysis(sample ? undefined : id);
  const row = sample ? demoMatchRows().find((r) => r.id === (example ? DEMO_MATCH_ID : id)) ?? null : live.data;
  const isLoading = !sample && live.isLoading;
  const done = row?.status === "done";
  const liveResults = useMatchResults(!sample && done ? row.results_path : null);
  const demoResults = useDemoMatchResults(sample && done ? DEMO_MATCH_RESULTS_URL : null);
  const { data: results, error: resultsError } = sample ? demoResults : liveResults;
  const { data: videoUrl } = useSignedVideoUrl(!sample && done ? row.annotated_video_path : null);

  if (isLoading) return <CenteredLoader />;
  if (!row) {
    return (
      <div className="container mx-auto max-w-3xl space-y-4 px-4 py-10">
        <BackLink />
        <p className="text-muted-foreground">{t("detail.notFound")}</p>
      </div>
    );
  }
  if (row.status === "failed") return <FailedView row={row} />;
  if (row.status !== "done") return <PendingView row={row} />;
  if (resultsError) return <FailedView row={{ ...row, error: String(resultsError) }} />;
  if (!results) return <CenteredLoader />;

  const [lengthM, widthM] = results.meta.pitch_dims_m;
  const coverage = percent(results.meta.homography_coverage);
  const seconds = Math.round(results.meta.analyzed_seconds);

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="space-y-3">
        <BackLink />
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="break-all text-sm text-muted-foreground">
            {clipName(row.video_path)} · {formatDateTime(row.created_at, i18n.language)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{t("detail.calibration", { percent: coverage })}</Badge>
          <Badge variant="outline">{t("detail.ball", { percent: percent(results.meta.ball_coverage) })}</Badge>
          <Badge variant="outline">{t("detail.analysed", { seconds })}</Badge>
          <Badge variant="outline">{t("detail.fps", { fps: results.meta.analysis_fps })}</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">{t("detail.honesty", { percent: coverage, seconds })}</p>
        {demo && <p className="max-w-3xl text-sm font-medium">{t("demo.banner")}</p>}
        {example && (
          <div className="flex flex-col gap-3 rounded-lg border border-primary/40 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">{t("example.banner")}</p>
            <Button asChild size="sm" className="shrink-0">
              <Link to="/match-analysis"><Upload className="mr-2 h-4 w-4" />{t("example.upload")}</Link>
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {TEAM_KEYS.map((team) => <TeamCard key={team} results={results} team={team} />)}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("detail.replay")}</CardTitle>
          <CardDescription>{t("detail.replayHint")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {sample ? (
            <DemoReplay
              clockRef={demoClock}
              duration={results.meta.analyzed_seconds}
              firstFrame={results.frames[0]}
              lengthM={lengthM}
              widthM={widthM}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center overflow-hidden rounded-md bg-black">
              {videoUrl ? (
                <video ref={videoRef} src={videoUrl} controls playsInline preload="metadata" className="h-full w-full" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-white/70" />
              )}
            </div>
          )}
          <div className="space-y-2">
            <MinimapReplay
              frames={results.frames}
              lengthM={lengthM}
              widthM={widthM}
              analysisFps={results.meta.analysis_fps}
              videoRef={sample ? demoClock : videoRef}
              notMappedLabel={t("detail.notMapped")}
            />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {TEAM_KEYS.map((team) => (
                <span key={team} className="inline-flex items-center gap-1.5">
                  <TeamDot team={team} className="h-2.5 w-2.5" /> {t("detail.legendTeam", { team })}
                </span>
              ))}
              {results.tracks.some((track) => track.role === "referee") && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: REFEREE_COLOR }} /> {t("detail.legendReferee")}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full border border-black/60 bg-white" /> {t("detail.legendBall")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("detail.dominanceTitle")}</CardTitle>
          <CardDescription>{t("detail.dominanceHint", { count: results.dominance.length })}</CardDescription>
        </CardHeader>
        <CardContent>
          {results.dominance.length ? (
            <DominanceChart points={results.dominance} />
          ) : (
            <p className="text-sm italic text-muted-foreground">{t("detail.dominanceUnavailable")}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {TEAM_KEYS.map((team) => (
          <Card key={team}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TeamDot team={team} /> {t("detail.heatmap", { team })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PitchHeatmap grid={results.teams[team].heatmap} lengthM={lengthM} widthM={widthM} color={TEAM_COLORS[team]} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("detail.tracks")}</CardTitle>
          <CardDescription>{t("detail.tracksHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("detail.col.track")}</TableHead>
                <TableHead>{t("detail.col.team")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("detail.col.role")}</TableHead>
                <TableHead className="hidden text-right sm:table-cell">{t("detail.col.mapped")}</TableHead>
                <TableHead className="text-right">{t("detail.col.distance")}</TableHead>
                <TableHead className="hidden text-right sm:table-cell">{t("detail.col.avg")}</TableHead>
                <TableHead className="text-right">{t("detail.col.top")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.tracks.map((track) => (
                <TableRow key={track.track_id}>
                  <TableCell className="whitespace-nowrap">#{track.track_id}</TableCell>
                  <TableCell>
                    {track.team ? (
                      <span className="inline-flex items-center gap-2">
                        <TeamDot team={track.team} className="h-2.5 w-2.5" /> {track.team}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{t("detail.roles.referee")}</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{t(`detail.roles.${track.role}`)}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {fmt(track.mapped_seconds)} {t("detail.units.s")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">
                    {Math.round(track.distance_m)} {t("detail.units.m")}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{fmt(track.avg_speed_kmh)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(track.top_speed_kmh)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
