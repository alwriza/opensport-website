import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { adminErrorText } from "@/hooks/useAdminReferrals";
import type { CameraType, EventClass, ShotOutcome } from "@/lib/research/keymap";

/**
 * Research labeling data (supabase/migrations/20261123_research_labeling.sql).
 * RLS lets only admins in; the tables are not in the generated Database type yet,
 * hence the untyped client.
 */
const db = () => supabase as unknown as SupabaseClient;

const KEY = "research";

export type SegmentMode = "gold" | "review";
export type SegmentStatus = "waiting" | "ready" | "in_progress" | "done";

export type ResearchSegment = {
  id: string;
  match_id: string;
  start_s: number;
  end_s: number;
  mode: SegmentMode;
  status: SegmentStatus;
  position_s: number | null;
  team_a_cluster: 0 | 1 | null;
  updated_at: string;
};

export type ResearchMatch = {
  id: string;
  youtube_id: string;
  url: string;
  title: string | null;
  duration_s: number;
  league: string;
  format: "11x11" | "8x8" | "7x7";
  camera_type: CameraType;
  quality: "720p" | "1080p" | "4k";
  surface: "artificial" | "natural";
  lighting: "day" | "floodlights";
  team_a_color: string;
  team_b_color: string;
  kickoff_s: number;
  notes: string | null;
  status: "new" | "downloaded" | "processed" | "error";
  error: string | null;
  created_at: string;
};

export type MatchWithSegment = ResearchMatch & { research_segments: ResearchSegment | null };

export type GoldLabel = {
  id: string;
  segment_id: string;
  t: number;
  class: EventClass;
  team: "A" | "B";
  shot_outcome: ShotOutcome | null;
  unsure: boolean;
  created_at: string;
};

export type NewMatch = {
  youtube_id: string;
  url: string;
  duration_s: number;
  league: string;
  format: ResearchMatch["format"];
  camera_type: CameraType;
  quality: ResearchMatch["quality"];
  surface: ResearchMatch["surface"];
  lighting: ResearchMatch["lighting"];
  team_a_color: string;
  team_b_color: string;
  kickoff_s: number;
  notes: string;
};

const ERROR_TEXT: Record<string, string> = {
  duplicate_video: "Это видео уже добавлено",
  too_short: "После «Начала игры» в видео должно оставаться не меньше 12 минут",
};

export function researchErrorText(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String((error as { message: unknown }).message) : "";
  const key = Object.keys(ERROR_TEXT).find((k) => message.includes(k));
  return key ? ERROR_TEXT[key] : adminErrorText(error);
}

export function useResearchMatches() {
  return useQuery({
    queryKey: [KEY, "matches"],
    queryFn: async () => {
      const { data, error } = await db()
        .from("research_matches")
        .select("*, research_segments(*)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as MatchWithSegment[];
    },
  });
}

export function useAddMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (m: NewMatch) => {
      const { data, error } = await db().rpc("research_add_match", {
        p_youtube_id: m.youtube_id,
        p_url: m.url,
        p_duration_s: m.duration_s,
        p_league: m.league,
        p_format: m.format,
        p_camera_type: m.camera_type,
        p_quality: m.quality,
        p_surface: m.surface,
        p_lighting: m.lighting,
        p_team_a_color: m.team_a_color,
        p_team_b_color: m.team_b_color,
        p_kickoff_s: m.kickoff_s,
        p_notes: m.notes,
      });
      if (error) throw error;
      return data as string;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

/** One gold segment with its match and labels, loaded once when the labeling page opens. */
export function useGoldSession(segmentId: string) {
  return useQuery({
    queryKey: [KEY, "gold", segmentId],
    queryFn: async () => {
      const seg = await db().from("research_segments").select("*, research_matches(*)").eq("id", segmentId).single();
      if (seg.error) throw seg.error;
      const labels = await db().from("research_labels").select("*").eq("segment_id", segmentId).order("created_at", { ascending: true });
      if (labels.error) throw labels.error;
      const { research_matches: match, ...segment } = seg.data as ResearchSegment & { research_matches: ResearchMatch };
      if (segment.mode !== "gold") throw new Error("Этот отрезок не для эталона");
      return { segment: segment as ResearchSegment, match, labels: labels.data as GoldLabel[] };
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export async function upsertLabel(label: Omit<GoldLabel, "created_at">): Promise<void> {
  const { error } = await db().from("research_labels").upsert({ ...label, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function deleteLabel(id: string): Promise<void> {
  const { error } = await db().from("research_labels").delete().eq("id", id);
  if (error) throw error;
}

export async function updateSegment(
  id: string,
  patch: Partial<Pick<ResearchSegment, "status" | "position_s" | "team_a_cluster">>,
): Promise<void> {
  const { error } = await db()
    .from("research_segments")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ---------- review ----------

export type Prediction = {
  id: string;
  segment_id: string;
  t: number;
  raw_class: string;
  class: EventClass;
  confidence: number;
  cluster: 0 | 1 | null;
};

export type ReviewVerdict = "correct" | "not_event" | "relabel";

export type Review = {
  prediction_id: string;
  verdict: ReviewVerdict;
  class: EventClass | null;
  team: "A" | "B" | null;
  t: number | null;
  shot_outcome: ShotOutcome | null;
  unsure: boolean;
};

/** One review segment with its match, the model's reviewable predictions and the reviews so far. */
export function useReviewSession(segmentId: string) {
  return useQuery({
    queryKey: [KEY, "review", segmentId],
    queryFn: async () => {
      const seg = await db().from("research_segments").select("*, research_matches(*)").eq("id", segmentId).single();
      if (seg.error) throw seg.error;
      const { research_matches: match, ...segment } = seg.data as ResearchSegment & { research_matches: ResearchMatch };
      if (segment.mode !== "review") throw new Error("Этот отрезок не для проверки");
      // Reviews come embedded (one per prediction), so no long id list goes into the URL.
      const preds = await db()
        .from("research_predictions")
        .select("id, segment_id, t, raw_class, class, confidence, cluster, research_reviews(prediction_id, verdict, class, team, t, shot_outcome, unsure)")
        .eq("segment_id", segmentId)
        .not("class", "is", null)
        .order("t", { ascending: true });
      if (preds.error) throw preds.error;
      // prediction_id is the primary key of research_reviews, so PostgREST embeds an object, not a list.
      const rows = preds.data as unknown as (Prediction & { research_reviews: Review | null })[];
      const predictions: Prediction[] = rows.map(({ research_reviews: _r, ...p }) => p);
      const reviews = rows.flatMap((r) => (r.research_reviews ? [r.research_reviews] : []));
      return { segment: segment as ResearchSegment, match, predictions, reviews };
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export async function upsertReview(review: Review): Promise<void> {
  const { error } = await db().from("research_reviews").upsert({ ...review, reviewed_at: new Date().toISOString() });
  if (error) throw error;
}
