import { supabase } from "@/integrations/supabase/client";

/** Google Tag Manager events. Push only after the action has actually succeeded, never on click. */
type DataLayerEvent =
  | { event: "sign_up"; method: "email" }
  | { event: "video_upload"; video_id: string }
  | { event: "analysis_complete"; video_id: string; analysis_id: string }
  | { event: "user_id_ready"; user_id: string }
  | { event: "user_id_clear"; user_id: null };

declare global {
  interface Window { dataLayer?: Record<string, unknown>[]; }
}

const SENT_KEY = "opensport:analytics-sent";

function readSent(): string[] {
  try {
    const value = JSON.parse(sessionStorage.getItem(SENT_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}
const sent = new Set<string>(typeof window === "undefined" ? [] : readSent());

export function pushDataLayer(payload: DataLayerEvent) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

/** Pushes an event once per key (e.g. one video or one analysis), even across reloads in the same tab. */
function pushOnce(key: string, payload: DataLayerEvent) {
  if (sent.has(key)) return;
  sent.add(key);
  try { sessionStorage.setItem(SENT_KEY, JSON.stringify([...sent].slice(-200))); } catch { /* Storage can be blocked; the in-memory set still dedupes. */ }
  pushDataLayer(payload);
}

export function trackSignUp() {
  pushDataLayer({ event: "sign_up", method: "email" });
}

export function trackVideoUpload(videoId: string) {
  pushOnce(`video_upload:${videoId}`, { event: "video_upload", video_id: videoId });
}

/** Call once process-video has returned a result. Reads the saved analysis row to report its id. */
export async function trackAnalysisComplete(videoId: string) {
  try {
    const { data, error } = await supabase.from("analyses").select("id").eq("video_id", videoId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error || !data?.id) return;
    pushOnce(`analysis_complete:${data.id}`, { event: "analysis_complete", video_id: videoId, analysis_id: String(data.id) });
  } catch { /* Analytics must never break the upload flow. */ }
}

let currentUserId: string | null = null;

/** Mirrors the Supabase auth state into the data layer. Call once at app start. */
export function startUserIdTracking() {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    const id = session?.user?.id ?? null;
    if (id && id !== currentUserId) {
      currentUserId = id;
      pushDataLayer({ event: "user_id_ready", user_id: id });
    } else if (!id && (currentUserId || event === "SIGNED_OUT")) {
      currentUserId = null;
      pushDataLayer({ event: "user_id_clear", user_id: null });
    }
  });
  return () => data.subscription.unsubscribe();
}
