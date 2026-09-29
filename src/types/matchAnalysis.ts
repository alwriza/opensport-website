/**
 * The shape of results.json, written by ml-worker-match/results.py.
 *
 * This file is the single source of truth on the frontend: there is no runtime
 * schema check here, because results.py validates the document before upload.
 * Keep it in step with ml-worker-match/results.py.
 */

export type MatchAnalysisStatus = "queued" | "processing" | "done" | "failed";

export type TeamKey = "A" | "B";

/** One row of public.match_analyses. */
export interface MatchAnalysisRow {
  id: string;
  user_id: string;
  status: MatchAnalysisStatus;
  video_path: string;
  annotated_video_path: string | null;
  results_path: string | null;
  error: string | null;
  summary: MatchAnalysisSummary | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

/** The slice stored on the row so the list renders without fetching results.json. */
export interface MatchAnalysisSummary {
  analyzed_seconds: number;
  homography_coverage: number;
  ball_coverage: number;
  teams: Record<TeamKey, {
    distance_m: number;
    possession_pct: number | null;
    dominance_pct: number | null;
  }>;
}

export interface MatchAnalysisMeta {
  source_video: string;
  analyzed_seconds: number;
  analysis_fps: number;
  /** Share of analysed frames with a valid pitch homography, 0..1. */
  homography_coverage: number;
  /** Share of analysed frames with a ball detection, 0..1. */
  ball_coverage: number;
  roboflow_sports_sha: string;
  model_ids: Record<string, string>;
  /** [length, width] in metres, read from the pipeline's pitch config. */
  pitch_dims_m: [number, number];
  generated_at: string;
}

export interface TeamMetrics {
  distance_m: number;
  avg_speed_kmh: number;
  top_speed_kmh: number;
  dominance_pct: number | null;
  possession_pct: number | null;
  /** Set exactly when possession_pct is null. */
  possession_unavailable_reason: string | null;
  /** Occupancy grid, rows x cols, normalised to a 0..1 peak. */
  heatmap: number[][];
}

export interface TrackMetrics {
  track_id: number;
  team: TeamKey | null;
  role: "player" | "goalkeeper" | "referee";
  mapped_seconds: number;
  distance_m: number;
  avg_speed_kmh: number;
  top_speed_kmh: number;
}

export interface DominancePoint {
  t: number;
  a_pct: number;
}

/** [track_id, team, x_m, y_m] — team is null for referees. */
export type FramePlayer = [number, TeamKey | null, number, number];

export interface FrameRecord {
  t: number;
  players: FramePlayer[];
  /** [x_m, y_m], or null when the ball was not detected in that frame. */
  ball: [number, number] | null;
}

export interface MatchAnalysisResults {
  meta: MatchAnalysisMeta;
  teams: Record<TeamKey, TeamMetrics>;
  tracks: TrackMetrics[];
  dominance: DominancePoint[];
  frames: FrameRecord[];
}

export const TEAM_KEYS: TeamKey[] = ["A", "B"];

/** Team colours match the ellipses drawn into the annotated video by pipeline.py. */
export const TEAM_COLORS: Record<TeamKey, string> = {
  A: "#FF1493",
  B: "#00BFFF",
};
