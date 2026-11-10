import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Columns of public.teams readable through the API. invite_code is hidden
 * (supabase/migrations/20261110b_lock_down_teams.sql); coaches get their teams'
 * codes from get_my_team_invite_codes().
 */
export const TEAM_PUBLIC_COLUMNS = "id, club_id, name, age_group, season, created_at, updated_at, logo_url, city, country";

/** Adds invite_code to the teams the signed-in user coaches. */
export async function withMyInviteCodes<T extends { id: string }>(teams: T[]): Promise<(T & { invite_code: string })[]> {
  if (!teams.length) return [];
  const { data, error } = await (supabase as unknown as SupabaseClient).rpc("get_my_team_invite_codes");
  if (error) throw error;
  const codes = new Map(((data ?? []) as { team_id: string; invite_code: string }[]).map((row) => [row.team_id, row.invite_code]));
  return teams.map((team) => ({ ...team, invite_code: codes.get(team.id) ?? "" }));
}
