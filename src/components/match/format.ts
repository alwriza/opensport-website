import type { TFunction } from "i18next";
import type { MatchAnalysisStatus } from "@/types/matchAnalysis";

/** Uploads are stored as `{user}/{uuid}-{original name}`; show the original name. */
export function clipName(videoPath: string): string {
  const file = videoPath.split("/").pop() ?? videoPath;
  return file.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, "");
}

export function formatDateTime(value: string | null | undefined, language: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export const percent = (share: number) => Math.round(share * 100);

/** Badge colours per job status, matching the outline badges used elsewhere in the app. */
export const STATUS_TONE: Record<MatchAnalysisStatus, string> = {
  queued: "border-amber-500/40 text-amber-700 dark:text-amber-300",
  processing: "border-sky-500/40 text-sky-700 dark:text-sky-300",
  done: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
  failed: "border-destructive/50 text-destructive",
};

/**
 * The worker stores `str(exception)`. Known failures get a readable explanation;
 * anything else falls back to a generic one, with the raw text kept for details.
 */
export function failureText(error: string | null, t: TFunction): string {
  const text = error ?? "";
  if (text.includes("pitch_calibration_insufficient")) return t("errors.pitch_calibration_insufficient");
  if (text.includes("no player crops found")) return t("errors.no_players");
  return t("errors.generic");
}

/** possession_unavailable_reason comes from the worker in English; translate the known ones. */
export function possessionReason(reason: string | null, t: TFunction): string | null {
  if (!reason) return null;
  const ball = reason.match(/ball detected in only (\d+)%/);
  if (ball) return t("detail.reasons.ball", { percent: ball[1] });
  if (reason.includes("possession radius")) return t("detail.reasons.radius");
  return reason;
}
