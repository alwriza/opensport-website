-- ============================================================
-- Lock down data that was readable or writable by anyone holding the public
-- (anon) key, which ships in the frontend bundle.
--
--  A. users      : emails, phones and Clerk ids were readable by anyone.
--                  Now only profile columns are readable; users may update
--                  their own profile columns (this was silently failing).
--  B. storage    : the videos / player-videos buckets were public, and anyone
--                  (even signed out) could upload into them. Now private:
--                  upload into your own folder, read your own videos or your
--                  players' (as coach). Signed URLs keep working.
--  C. analyses   : anyone could insert analyses (fake scores for any player).
--                  Only the service role (process-video) writes them now.
--  D. skills,
--     skill_levels: RLS was off, so anyone could modify or delete them.
--                  Now read-only for clients.
--  E. metric_observations: readable by anyone; now the player and their
--                  coaches only, like analyses.
--  F. _deprecated_*: open read/write policies; clients lose all access.
--
-- Safe to re-run. Every statement is reversible (see the notes per section).
-- The global_rankings view is owned by postgres and keeps working.
-- ============================================================


-- ==================== A. users ====================
-- Column-level read: profile fields only. email, phone, clerk_id and the
-- terms/privacy timestamps are no longer readable through the API.
REVOKE SELECT ON public.users FROM anon, authenticated;
GRANT SELECT (id, auth_user_id, name, nickname, role, age, position, club, height, weight,
              city, country, avatar_url, created_at)
  ON public.users TO anon, authenticated;

-- Writes: anon never; authenticated users may update a fixed set of columns of
-- their own row (rows are created by the auth trigger / register function).
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.users FROM anon, authenticated;
GRANT UPDATE (name, age, position, club, height, weight, city, country, avatar_url,
              terms_accepted_at, privacy_accepted_at)
  ON public.users TO authenticated;

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- The full own row (email included) is still available to its owner.
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.users
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT * FROM public.users WHERE auth_user_id = auth.uid() $$;
REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;


-- ==================== B. storage: videos, player-videos ====================
UPDATE storage.buckets SET public = false WHERE id IN ('videos', 'player-videos');

DROP POLICY IF EXISTS "Anyone can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload player videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view player videos" ON storage.objects;

-- Uploads go to videos/{users.id}/..., as PlayerDashboard and Duels already do.
DROP POLICY IF EXISTS "Owner can upload videos" ON storage.objects;
CREATE POLICY "Owner can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos'
  AND (storage.foldername(name))[1] = public.current_app_user_id()::text
);

-- Read access follows the videos table: the owner, or a coach of the owner's team.
DROP POLICY IF EXISTS "Owner or coach can read videos" ON storage.objects;
CREATE POLICY "Owner or coach can read videos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'videos'
  AND EXISTS (
    SELECT 1 FROM public.videos v
    WHERE v.storage_path = storage.objects.name
      AND (
        v.user_id = public.current_app_user_id()
        OR EXISTS (
          SELECT 1 FROM public.team_rosters tr
          JOIN public.team_coaches tc ON tc.team_id = tr.team_id
          WHERE tr.player_id = v.user_id AND tc.coach_id = public.current_app_user_id()
        )
      )
  )
);


-- ==================== C. analyses ====================
-- process-video writes analyses with the service role, which bypasses RLS.
DROP POLICY IF EXISTS "Service role can insert analyses" ON public.analyses;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.analyses FROM anon, authenticated;


-- ==================== D. skills, skill_levels ====================
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read skills" ON public.skills;
CREATE POLICY "Anyone can read skills" ON public.skills FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Anyone can read skill levels" ON public.skill_levels;
CREATE POLICY "Anyone can read skill levels" ON public.skill_levels FOR SELECT TO anon, authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.skills, public.skill_levels FROM anon, authenticated;


-- ==================== E. metric_observations ====================
DROP POLICY IF EXISTS "Users can select metric_observations" ON public.metric_observations;
DROP POLICY IF EXISTS "Player or coach can select metric_observations" ON public.metric_observations;
CREATE POLICY "Player or coach can select metric_observations"
ON public.metric_observations FOR SELECT
TO authenticated
USING (
  player_id = public.current_app_user_id()
  OR EXISTS (
    SELECT 1 FROM public.team_rosters tr
    JOIN public.team_coaches tc ON tc.team_id = tr.team_id
    WHERE tr.player_id = metric_observations.player_id AND tc.coach_id = public.current_app_user_id()
  )
);


-- ==================== F. _deprecated_* tables ====================
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname LIKE '\_deprecated\_%'
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t.relname);
  END LOOP;
END $$;
