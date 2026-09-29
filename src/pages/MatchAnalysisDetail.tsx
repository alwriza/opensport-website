import { useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useMatchAnalysis, useMatchResults, useSignedVideoUrl } from "@/hooks/useMatchAnalyses";
import { TEAM_COLORS, TEAM_KEYS } from "@/types/matchAnalysis";
import type { MatchAnalysisResults, TeamKey } from "@/types/matchAnalysis";
import { DominanceChart } from "@/components/match/DominanceChart";
import { MinimapReplay } from "@/components/match/MinimapReplay";
import { PitchHeatmap } from "@/components/match/PitchHeatmap";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const pct = (value: number) => `${Math.round(value * 100)}%`;

function TeamCard({ results, team }: { results: MatchAnalysisResults; team: TeamKey }) {
  const metrics = results.teams[team];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: TEAM_COLORS[team] }} />
          Team {team}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Distance</p>
          <p className="text-lg font-semibold">{Math.round(metrics.distance_m)} m</p>
        </div>
        <div>
          <p className="text-muted-foreground">Top speed</p>
          <p className="text-lg font-semibold">{metrics.top_speed_kmh} km/h</p>
        </div>
        <div>
          <p className="text-muted-foreground">Avg speed</p>
          <p className="text-lg font-semibold">{metrics.avg_speed_kmh} km/h</p>
        </div>
        <div>
          <p className="text-muted-foreground">Pitch dominance</p>
          <p className="text-lg font-semibold">
            {metrics.dominance_pct === null ? "unavailable" : `${metrics.dominance_pct}%`}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground">Possession</p>
          {metrics.possession_pct === null ? (
            <p className="text-sm italic text-muted-foreground">
              unavailable: {metrics.possession_unavailable_reason}
            </p>
          ) : (
            <p className="text-lg font-semibold">{metrics.possession_pct}%</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MatchAnalysisDetail() {
  const { id } = useParams<{ id: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: row, isLoading } = useMatchAnalysis(id);
  const { data: results } = useMatchResults(row?.results_path);
  const { data: videoUrl } = useSignedVideoUrl(row?.annotated_video_path);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!row) return <p className="container mx-auto px-4 py-10">Analysis not found.</p>;

  if (row.status === "failed") {
    return (
      <div className="container mx-auto max-w-3xl space-y-4 px-4 py-10">
        <Link to="/match-analysis" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-base">Analysis failed</CardTitle>
            <CardDescription className="text-destructive">{row.error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (row.status !== "done" || !results) {
    return (
      <div className="container mx-auto max-w-3xl space-y-4 px-4 py-10">
        <Link to="/match-analysis" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {row.status}…
        </p>
      </div>
    );
  }

  const [lengthM, widthM] = results.meta.pitch_dims_m;
  const tracks = results.tracks;

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="space-y-3">
        <Link to="/match-analysis" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-3xl font-bold">Match Analysis</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">pitch calibration {pct(results.meta.homography_coverage)}</Badge>
          <Badge variant="outline">ball detected {pct(results.meta.ball_coverage)}</Badge>
          <Badge variant="outline">{results.meta.analyzed_seconds}s analysed</Badge>
          <Badge variant="outline">{results.meta.analysis_fps} fps</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Every number below comes only from the frames where the pitch could be mapped
          ({pct(results.meta.homography_coverage)} of {results.meta.analyzed_seconds} analysed seconds).
          Tracker IDs break when players are occluded, so per-track rows are labelled “Track #”.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {TEAM_KEYS.map((team) => (
          <TeamCard key={team} results={results} team={team} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Replay</CardTitle>
          <CardDescription>The minimap follows the video's clock.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {videoUrl ? (
            <video ref={videoRef} src={videoUrl} controls className="w-full rounded-md" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
          <MinimapReplay
            frames={results.frames}
            lengthM={lengthM}
            widthM={widthM}
            analysisFps={results.meta.analysis_fps}
            videoRef={videoRef}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pitch dominance over time</CardTitle>
          <CardDescription>
            Team A's share of pitch area. {results.dominance.length} of the analysed frames had
            enough mapped players on both teams to count.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.dominance.length ? (
            <DominanceChart points={results.dominance} />
          ) : (
            <p className="text-sm italic text-muted-foreground">
              unavailable: no frame had at least 5 mapped players on each team
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {TEAM_KEYS.map((team) => (
          <Card key={team}>
            <CardHeader>
              <CardTitle className="text-base">Team {team} heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <PitchHeatmap
                grid={results.teams[team].heatmap}
                lengthM={lengthM}
                widthM={widthM}
                color={TEAM_COLORS[team]}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tracks</CardTitle>
          <CardDescription>
            One row per tracked identity, not per player: occlusions split a player into several
            tracks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Track</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Mapped</TableHead>
                <TableHead className="text-right">Distance</TableHead>
                <TableHead className="text-right">Avg</TableHead>
                <TableHead className="text-right">Top</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tracks.map((track) => (
                <TableRow key={track.track_id}>
                  <TableCell>Track #{track.track_id}</TableCell>
                  <TableCell>
                    {track.team ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: TEAM_COLORS[track.team] }}
                        />
                        {track.team}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{track.role}</TableCell>
                  <TableCell className="text-right">{track.mapped_seconds}s</TableCell>
                  <TableCell className="text-right">{Math.round(track.distance_m)} m</TableCell>
                  <TableCell className="text-right">{track.avg_speed_kmh}</TableCell>
                  <TableCell className="text-right">{track.top_speed_kmh}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
