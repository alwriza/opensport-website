import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Admin side of the creator referral program. Everything goes through the
 * SECURITY DEFINER functions of supabase/migrations/20261108_creator_referrals.sql,
 * which check is_admin() themselves; the tables are not readable by clients.
 * The functions are not in the generated Database type yet, hence the untyped client.
 */
const db = () => supabase as unknown as SupabaseClient;

export const SITE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) || "https://opensport.app";
export const referralUrl = (code: string) => `${SITE_URL.replace(/\/$/, "")}/?ref=${code}`;

export type CreatorStatus = "active" | "paused" | "blocked";
export type ActivationStatus = "pending" | "approved" | "rejected" | "paid";

export const REJECTION_REASONS = [
  "duplicate_account",
  "fake_account",
  "fraud",
  "existing_user",
  "invalid_referral",
  "activation_after_expiration",
  "other",
] as const;
export type RejectionReason = (typeof REJECTION_REASONS)[number];

export type CreatorRow = {
  id: string;
  name: string;
  platform: string | null;
  contact: string | null;
  referral_code: string;
  aliases: string[];
  status: CreatorStatus;
  payout_cap: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  visits: number;
  registrations: number;
  registered_no_video: number;
  uploaded_after_window: number;
  pending: number;
  approved: number;
  rejected: number;
  paid: number;
  earned_uncapped: number;
  paid_amount: number;
  to_pay: number;
  over_cap: number;
};

export type ActivationRow = {
  id: string;
  creator_id: string;
  creator_name: string;
  creator_code: string;
  creator_status: CreatorStatus;
  user_id: string;
  user_nickname: string | null;
  user_email: string | null;
  user_phone: string | null;
  status: ActivationStatus;
  video_source: "videos" | "match_analyses" | null;
  video_id: string | null;
  video_bucket: string | null;
  video_path: string | null;
  referral_first_visit_at: string | null;
  registered_at: string | null;
  first_video_uploaded_at: string | null;
  activated_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  paid_at: string | null;
  rejection_reason: RejectionReason | null;
  rejection_comment: string | null;
  reward_amount: number | null;
  payout_id: string | null;
  same_ip_users: number;
};

export type PayoutRow = {
  id: string;
  creator_id: string;
  creator_name: string;
  creator_code: string;
  amount: number;
  activations_count: number;
  status: "paid" | "cancelled";
  period_start: string | null;
  period_end: string | null;
  note: string | null;
  created_by_email: string | null;
  created_at: string;
  paid_at: string | null;
};

export type PayoutPreview = {
  creator_id: string;
  payout_cap: number;
  paid_count: number;
  paid_amount: number;
  approved_count: number;
  fit_count: number;
  over_cap: number;
  amount: number;
  cap_left: number;
  activations: { id: string; user_nickname: string | null; user_email: string | null; approved_at: string; ordinal: number; rate: number }[];
};

const ERROR_TEXT: Record<string, string> = {
  not_authorized: "Нет доступа администратора",
  code_taken: "Такой код уже занят",
  invalid_code: "Код: 3–32 символа, латиница, цифры, «_» или «-»",
  name_required: "Укажите имя",
  invalid_cap: "Cap должен быть не меньше 0",
  invalid_status: "Неизвестный статус",
  creator_not_found: "Креатор не найден",
  activation_not_found: "Активация не найдена",
  already_paid: "Активация уже оплачена, менять её нельзя",
  invalid_reason: "Выберите причину отказа",
  invalid_decision: "Неизвестное действие",
  nothing_to_pay: "Нечего выплачивать",
  amount_changed: "Сумма изменилась, пока окно было открыто. Проверьте превью ещё раз",
};

/** Turns a database error ("code_taken", …) into a readable message. */
export function adminErrorText(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String((error as { message: unknown }).message) : String(error ?? "");
  const key = Object.keys(ERROR_TEXT).find((k) => message.includes(k));
  return key ? ERROR_TEXT[key] : message || "Что-то пошло не так";
}

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await db().rpc(fn, args);
  if (error) throw error;
  return data as T;
}

const KEY = "referral-admin";

export function useIsAdmin(enabled: boolean) {
  return useQuery({
    queryKey: [KEY, "is-admin"],
    queryFn: () => rpc<boolean>("is_admin"),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useCreators(enabled = true) {
  return useQuery({
    queryKey: [KEY, "creators"],
    queryFn: () => rpc<CreatorRow[]>("admin_list_creators"),
    enabled,
  });
}

export function useActivations(status: ActivationStatus | null, creatorId: string | null, enabled = true) {
  return useQuery({
    queryKey: [KEY, "activations", status, creatorId],
    queryFn: () => rpc<ActivationRow[]>("admin_list_activations", { p_status: status, p_creator_id: creatorId }),
    enabled,
  });
}

export function usePayouts(creatorId: string | null, enabled = true) {
  return useQuery({
    queryKey: [KEY, "payouts", creatorId],
    queryFn: () => rpc<PayoutRow[]>("admin_list_payouts", { p_creator_id: creatorId }),
    enabled,
  });
}

export function usePayoutPreview(creatorId: string | null) {
  return useQuery({
    queryKey: [KEY, "payout-preview", creatorId],
    queryFn: () => rpc<PayoutPreview>("admin_preview_payout", { p_creator_id: creatorId }),
    enabled: !!creatorId,
    staleTime: 0,
  });
}

function useAdminMutation<A, R>(fn: (args: A) => Promise<R>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export type CreatorInput = {
  id: string | null;
  name: string;
  platform: string;
  contact: string;
  referral_code: string;
  payout_cap: number | null;
  notes: string;
};

export function useUpsertCreator() {
  return useAdminMutation((c: CreatorInput) =>
    rpc<string>("admin_upsert_creator", {
      p_id: c.id,
      p_name: c.name,
      p_platform: c.platform,
      p_contact: c.contact,
      p_referral_code: c.id ? null : c.referral_code,
      p_payout_cap: c.payout_cap,
      p_notes: c.notes,
    }),
  );
}

export function useSetCreatorStatus() {
  return useAdminMutation(({ id, status }: { id: string; status: CreatorStatus }) =>
    rpc("admin_set_creator_status", { p_id: id, p_status: status }),
  );
}

export function useSetCreatorCap() {
  return useAdminMutation(({ id, cap }: { id: string; cap: number }) => rpc("admin_set_creator_cap", { p_id: id, p_cap: cap }));
}

export function useChangeCreatorCode() {
  return useAdminMutation(({ id, code }: { id: string; code: string }) => rpc("admin_change_creator_code", { p_id: id, p_code: code }));
}

export function useReviewActivation() {
  return useAdminMutation(
    ({ id, decision, reason, comment }: { id: string; decision: "approved" | "rejected" | "pending"; reason?: RejectionReason; comment?: string }) =>
      rpc("admin_review_activation", { p_id: id, p_decision: decision, p_reason: reason ?? null, p_comment: comment ?? null }),
  );
}

export function useCreatePayout() {
  return useAdminMutation(({ creatorId, expectedAmount, note }: { creatorId: string; expectedAmount: number; note: string }) =>
    rpc<{ payout_id: string; amount: number; activations_count: number }>("admin_create_payout", {
      p_creator_id: creatorId,
      p_expected_amount: expectedAmount,
      p_note: note,
    }),
  );
}

/** Signed link to the uploaded video, for reviewing an activation. */
export async function openActivationVideo(bucket: string, path: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) throw error ?? new Error("no_url");
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}

// ---------- formatting ----------
const moneyFormat = new Intl.NumberFormat("ru-RU");
export const money = (value: number | null | undefined) => `${moneyFormat.format(value ?? 0)} ₸`;

const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
const dateTimeFormat = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
export const fmtDate = (value: string | null | undefined) => (value ? dateFormat.format(new Date(value)) : "—");
export const fmtDateTime = (value: string | null | undefined) => (value ? dateTimeFormat.format(new Date(value)) : "—");

export const percent = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—");

export const CREATOR_STATUS_LABEL: Record<CreatorStatus, string> = { active: "Активен", paused: "Пауза", blocked: "Заблокирован" };
export const ACTIVATION_STATUS_LABEL: Record<ActivationStatus, string> = { pending: "На проверке", approved: "Одобрена", rejected: "Отклонена", paid: "Оплачена" };
export const REJECTION_REASON_LABEL: Record<RejectionReason, string> = {
  duplicate_account: "Дубликат аккаунта",
  fake_account: "Фейковый аккаунт",
  fraud: "Мошенничество",
  existing_user: "Уже был пользователем",
  invalid_referral: "Невалидный referral",
  activation_after_expiration: "После окончания 14 дней",
  other: "Другое",
};
