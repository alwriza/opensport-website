import type { MatchAnalysisRow } from "@/types/matchAnalysis";

/**
 * Demo match analysis. public/demo/match-results.json was produced by the worker's
 * own results.build() from a simulated 2-minute passage whose first frame places the
 * 22 players exactly where they stand in the photo below, so the minimap at 0:00
 * matches the picture.
 *
 * Photo: "Aerial View of Soccer Field" by Mike, Pexels (pexels.com/photo/1171084),
 * Pexels License: free to use, no attribution required. Cropped to the pitch.
 */
export const DEMO_MATCH_ID = "demo-match";
export const DEMO_MATCH_RESULTS_URL = "/demo/match-results.json";
export const DEMO_MATCH_PHOTO = "/demo/match-aerial.jpg";
export const DEMO_MATCH_PHOTO_CREDIT = { author: "Mike", source: "Pexels", url: "https://www.pexels.com/photo/aerial-view-of-soccer-field-1171084/" };

/** Where the pitch lines sit inside the cropped photo, in % of its width and height. */
export const DEMO_PHOTO_PITCH = { left: 3.94, top: 5.99, width: 91.99, height: 87.69 };

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

export function demoMatchRows(): MatchAnalysisRow[] {
  return [
    {
      id: "demo-processing",
      user_id: "demo",
      status: "processing",
      video_path: "demo/second_half.mp4",
      annotated_video_path: null,
      results_path: null,
      error: null,
      summary: null,
      created_at: minutesAgo(6),
      started_at: minutesAgo(4),
      finished_at: null,
    },
    {
      id: DEMO_MATCH_ID,
      user_id: "demo",
      status: "done",
      video_path: "demo/first_half.mp4",
      annotated_video_path: null,
      results_path: DEMO_MATCH_RESULTS_URL,
      error: null,
      summary: {
        analyzed_seconds: 120,
        homography_coverage: 0.965,
        ball_coverage: 0.8192,
        teams: {
          A: { distance_m: 2865.28, possession_pct: 63.6, dominance_pct: 61.7 },
          B: { distance_m: 2776.77, possession_pct: 36.4, dominance_pct: 38.3 },
        },
      },
      created_at: minutesAgo(60 * 26),
      started_at: minutesAgo(60 * 26 - 1),
      finished_at: minutesAgo(60 * 26 - 9),
    },
  ];
}
