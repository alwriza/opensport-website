import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const ONBOARDING_VERSION = 1 as const;
export const ONBOARDING_METADATA_KEY = "opensport_onboarding";

export type OnboardingRole = "player" | "coach";
export type OnboardingStatus = "pending" | "completed" | "skipped";

export interface OnboardingState {
  version: typeof ONBOARDING_VERSION;
  status: OnboardingStatus;
  updatedAt: string;
  /** The chosen introduction, not an account permission or team role. */
  role?: OnboardingRole;
}

export type OnboardingUser = Pick<User, "id" | "user_metadata" | "email_confirmed_at" | "confirmed_at">;

export interface OnboardingWriteResult {
  state: OnboardingState;
  synced: boolean;
}

const memory = new Map<string, OnboardingState>();
const writes = new Map<string, Promise<OnboardingWriteResult>>();

function storageKey(userId: string) {
  return `opensport:onboarding:v${ONBOARDING_VERSION}:${userId}`;
}

function parseState(value: unknown): OnboardingState | null {
  if (!value || typeof value !== "object") return null;
  const state = value as Partial<OnboardingState>;
  if (
    state.version !== ONBOARDING_VERSION ||
    !["pending", "completed", "skipped"].includes(state.status ?? "") ||
    typeof state.updatedAt !== "string" ||
    !Number.isFinite(Date.parse(state.updatedAt))
  ) return null;

  return {
    version: ONBOARDING_VERSION,
    status: state.status,
    updatedAt: state.updatedAt,
    ...(state.role === "player" || state.role === "coach" ? { role: state.role } : {}),
  };
}

/** Completion wins over an older pending state, including stale auth sessions. */
function latestState(first: OnboardingState | null, second: OnboardingState | null): OnboardingState | null {
  if (!first) return second;
  if (!second) return first;
  const priority = { pending: 0, skipped: 1, completed: 2 };
  if (priority[first.status] !== priority[second.status]) {
    return priority[first.status] > priority[second.status] ? first : second;
  }
  return Date.parse(first.updatedAt) > Date.parse(second.updatedAt) ? first : second;
}

function readLocal(userId: string): OnboardingState | null {
  let stored: OnboardingState | null = null;
  try {
    const serialized = window.localStorage.getItem(storageKey(userId));
    stored = serialized ? parseState(JSON.parse(serialized)) : null;
  } catch {
    // Private browsing, a blocked storage API, or corrupt JSON must not block sign in.
  }
  return latestState(memory.get(userId) ?? null, stored);
}

function writeLocal(userId: string, state: OnboardingState) {
  memory.set(userId, state);
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch {
    // Keep this tab consistent while the authenticated metadata save is attempted.
  }
}

export function readOnboardingState(user: OnboardingUser | null | undefined): OnboardingState | null {
  if (!user?.id) return null;
  return latestState(parseState(user.user_metadata?.[ONBOARDING_METADATA_KEY]), readLocal(user.id));
}

export function shouldStartOnboarding(
  user: OnboardingUser | null | undefined,
  { isDemo = false }: { isDemo?: boolean } = {},
): boolean {
  if (isDemo || !user?.id || !(user.email_confirmed_at || user.confirmed_at)) return false;
  return readOnboardingState(user)?.status === "pending";
}

function sameState(first: OnboardingState | null, second: OnboardingState): boolean {
  return first?.version === second.version && first.status === second.status &&
    first.updatedAt === second.updatedAt && first.role === second.role;
}

function persistState(user: OnboardingUser, initialState: OnboardingState): Promise<OnboardingWriteResult> {
  // Save before the first await so navigating or closing the tutorial is immediate.
  writeLocal(user.id, initialState);

  const previous = writes.get(user.id);
  const pending = (previous ?? Promise.resolve()).then(async (): Promise<OnboardingWriteResult> => {
    let state = readOnboardingState(user) ?? initialState;
    try {
      const { data, error } = await supabase.auth.getSession();
      const currentUser = data.session?.user;
      if (error || currentUser?.id !== user.id) return { state, synced: false };

      // Another action may have finished the tutorial while this save was queued.
      state = readOnboardingState(currentUser) ?? state;
      writeLocal(user.id, state);
      const remote = parseState(currentUser.user_metadata?.[ONBOARDING_METADATA_KEY]);
      if (sameState(remote, state)) return { state, synced: true };

      // Supabase merges top-level metadata keys; don't resend stale profile metadata.
      const result = await supabase.auth.updateUser({ data: { [ONBOARDING_METADATA_KEY]: state } });
      return { state, synced: !result.error && result.data.user?.id === user.id };
    } catch {
      return { state, synced: false };
    }
  });

  writes.set(user.id, pending);
  void pending.then(() => {
    if (writes.get(user.id) === pending) writes.delete(user.id);
  });
  return pending;
}

/** Called only after signup OTP verification succeeds. Never reopens a finished tour. */
export function markOnboardingPending(user: OnboardingUser): Promise<OnboardingWriteResult> {
  const state: OnboardingState = readOnboardingState(user) ?? {
    version: ONBOARDING_VERSION,
    status: "pending",
    updatedAt: new Date().toISOString(),
  };
  return persistState(user, state);
}

export function finishOnboarding(
  user: OnboardingUser,
  status: "completed" | "skipped",
  role?: OnboardingRole,
): Promise<OnboardingWriteResult> {
  const current = readOnboardingState(user);
  const selectedRole = role ?? current?.role;
  return persistState(user, {
    version: ONBOARDING_VERSION,
    status: current?.status === "completed" ? "completed" : status,
    updatedAt: new Date().toISOString(),
    ...(selectedRole ? { role: selectedRole } : {}),
  });
}
