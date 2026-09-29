import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { MatchAnalysisResults, MatchAnalysisRow } from "@/types/matchAnalysis";

const RESULTS_BUCKET = "match-results";
const POLL_MS = 5000;

/**
 * match_analyses is not in the generated Database type yet — types.ts is regenerated
 * from the live schema, and the table arrives with
 * supabase/migrations/20260928_create_match_analyses.sql. Until then this is the one
 * untyped handle; MatchAnalysisRow carries the shape on our side.
 */
function matchAnalyses() {
  return (supabase as unknown as SupabaseClient).from("match_analyses");
}

const isRunning = (row: Pick<MatchAnalysisRow, "status">) =>
  row.status === "queued" || row.status === "processing";

/** public.users.id for the signed-in account. RLS and storage paths key off this, not auth.uid(). */
export function useAppUserId(authUserId: string | undefined) {
  return useQuery({
    queryKey: ["app-user-id", authUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", authUserId!)
        .maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
    enabled: !!authUserId,
  });
}

/** The user's analyses, newest first. Polls while anything is still running. */
export function useMatchAnalyses(appUserId: string | null | undefined) {
  return useQuery({
    queryKey: ["match-analyses", appUserId],
    queryFn: async () => {
      const { data, error } = await matchAnalyses()
        .select("*")
        .eq("user_id", appUserId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MatchAnalysisRow[];
    },
    enabled: !!appUserId,
    refetchInterval: (query) =>
      (query.state.data ?? []).some(isRunning) ? POLL_MS : false,
  });
}

/** One analysis. Polls while it is still running. */
export function useMatchAnalysis(id: string | undefined) {
  return useQuery({
    queryKey: ["match-analysis", id],
    queryFn: async () => {
      const { data, error } = await matchAnalyses().select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return (data ?? null) as MatchAnalysisRow | null;
    },
    enabled: !!id,
    refetchInterval: (query) => (query.state.data && isRunning(query.state.data) ? POLL_MS : false),
  });
}

/** results.json out of the private bucket. Validated on the worker side before upload. */
export function useMatchResults(resultsPath: string | null | undefined) {
  return useQuery({
    queryKey: ["match-results", resultsPath],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(RESULTS_BUCKET).download(resultsPath!);
      if (error) throw error;
      return JSON.parse(await data.text()) as MatchAnalysisResults;
    },
    enabled: !!resultsPath,
    staleTime: Infinity,
  });
}

/** Short-lived signed URL for the annotated video. The bucket is private: no public URLs. */
export function useSignedVideoUrl(videoPath: string | null | undefined) {
  return useQuery({
    queryKey: ["match-video-url", videoPath],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(RESULTS_BUCKET)
        .createSignedUrl(videoPath!, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!videoPath,
    staleTime: 55 * 60 * 1000,
  });
}

export async function queueMatchAnalysis(appUserId: string, videoPath: string) {
  const { error } = await matchAnalyses().insert({
    user_id: appUserId,
    video_path: videoPath,
    status: "queued",
  });
  if (error) throw error;
}
