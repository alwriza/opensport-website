/**
 * Columns of public.users that the API exposes (see
 * supabase/migrations/20261110_lock_down_public_data.sql). email, phone and the
 * consent timestamps are not readable; select these instead of "*".
 */
export const USER_PROFILE_COLUMNS =
  "id, auth_user_id, name, nickname, role, age, position, club, height, weight, city, country, avatar_url, created_at";
