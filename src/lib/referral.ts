import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Creator referral links: https://opensport.app/?ref=<code>
 *
 * The visit is recorded on the server (its time starts the 14-day window) and kept in
 * localStorage until the visitor registers; Register sends the visit id to the
 * `register` function, which links the new account to the creator.
 * First touch wins: a stored, unexpired referral is never replaced by another link.
 */

const STORE_KEY = "opensport:referral";
const SESSION_KEY = "opensport:referral-session";
const CODE_RE = /^[a-z0-9_-]{3,32}$/;

export type StoredReferral = {
  visitId: string;
  code: string;
  visitedAt: string;
  expiresAt: string;
};

type TrackVisitResult =
  | { ok: true; visit_id: string; code: string; visited_at: string; expires_at: string }
  | { ok: false; reason: string };

function read(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function write(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* Storage can be blocked; the referral is then lost. */ }
}

/** The referral to send at registration, or null when there is none or it has expired. */
export function getStoredReferral(): StoredReferral | null {
  const raw = read(STORE_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as StoredReferral;
    if (!value?.visitId || !value.expiresAt) return null;
    if (new Date(value.expiresAt).getTime() <= Date.now()) {
      clearStoredReferral();
      return null;
    }
    return value;
  } catch {
    clearStoredReferral();
    return null;
  }
}

export function clearStoredReferral() {
  try { localStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
}

function sessionId(): string {
  const existing = read(SESSION_KEY);
  if (existing && /^[A-Za-z0-9-]{8,64}$/.test(existing)) return existing;
  const id = crypto.randomUUID();
  write(SESSION_KEY, id);
  return id;
}

/** Reads ?ref= once at startup, removes it from the address bar and records the visit. */
export function startReferralCapture() {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  const raw = url.searchParams.get("ref");
  if (raw === null) return;

  url.searchParams.delete("ref");
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);

  const code = raw.trim().toLowerCase();
  if (!CODE_RE.test(code)) return;

  void recordVisit(code, url.pathname);
}

async function recordVisit(code: string, landingPage: string) {
  try {
    // Signed-in visitors already have an account and cannot become referral users.
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return;

    const { data, error } = await (supabase as unknown as SupabaseClient).rpc("track_referral_visit", {
      p_code: code,
      p_session_id: sessionId(),
      p_landing_page: landingPage,
      p_user_agent: navigator.userAgent,
    });
    if (error) return;

    const result = data as TrackVisitResult | null;
    // The visit is still counted for the creator, but the first valid referral is kept.
    if (!result?.ok || getStoredReferral()) return;

    const stored: StoredReferral = {
      visitId: result.visit_id,
      code: result.code,
      visitedAt: result.visited_at,
      expiresAt: result.expires_at,
    };
    write(STORE_KEY, JSON.stringify(stored));
  } catch {
    /* The referral program must never break the site. */
  }
}
