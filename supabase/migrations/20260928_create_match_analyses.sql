-- ============================================================
-- Match Analysis v3.0-demo: job table, private buckets, claim function.
--
-- Auth bridge: public.current_app_user_id() (SECURITY DEFINER) maps auth.uid()
-- -> public.users.id. It is defined in 20260731_fix_coach_rls_auth_mapping.sql
-- and must already exist; every policy below depends on it.
--
-- Videos may show minors. Both buckets are private, owner-scoped, no public URLs.
-- ============================================================

-- ==================== TABLE ====================
-- One row per uploaded clip. The worker owns every field the client cannot set.
CREATE TABLE IF NOT EXISTS public.match_analyses (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status                text NOT NULL DEFAULT 'queued',
  video_path            text NOT NULL,
  annotated_video_path  text,
  results_path          text,
  error                 text,
  summary               jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  started_at            timestamptz,
  finished_at           timestamptz,
  CONSTRAINT match_analyses_status_check
    CHECK (status IN ('queued', 'processing', 'done', 'failed'))
);

-- Supports the claim function's "oldest queued job" lookup.
CREATE INDEX IF NOT EXISTS match_analyses_queue_idx
  ON public.match_analyses (status, created_at)
  WHERE status = 'queued';

-- Supports the user's own list, newest first.
CREATE INDEX IF NOT EXISTS match_analyses_user_idx
  ON public.match_analyses (user_id, created_at DESC);

-- ==================== ROW LEVEL SECURITY ====================
ALTER TABLE public.match_analyses ENABLE ROW LEVEL SECURITY;

-- Owner-only read. The service role bypasses RLS, so the worker is unaffected.
DROP POLICY IF EXISTS "Owner can select their match analyses" ON public.match_analyses;
CREATE POLICY "Owner can select their match analyses"
ON public.match_analyses FOR SELECT
TO authenticated
USING (user_id = public.current_app_user_id());

-- Owner-only insert, and only as a fresh queued job: a client cannot hand itself
-- a finished analysis by writing status, result paths or a summary directly.
DROP POLICY IF EXISTS "Owner can queue a match analysis" ON public.match_analyses;
CREATE POLICY "Owner can queue a match analysis"
ON public.match_analyses FOR INSERT
TO authenticated
WITH CHECK (
  user_id = public.current_app_user_id()
  AND status = 'queued'
  AND annotated_video_path IS NULL
  AND results_path IS NULL
  AND error IS NULL
  AND summary IS NULL
  AND started_at IS NULL
  AND finished_at IS NULL
);

-- No UPDATE and no DELETE policy exists on purpose: status, results and errors are
-- written by the worker through the service role and by nobody else.

-- ==================== STORAGE BUCKETS ====================
-- Private. file_size_limit cannot exceed the project's global upload limit
-- (Dashboard -> Storage -> Settings); raise that first if 200 MB is rejected.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('match-videos', 'match-videos', false, 209715200, ARRAY['video/mp4','video/quicktime'])
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('match-results', 'match-results', false, 209715200, ARRAY['video/mp4','application/json'])
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ==================== STORAGE POLICIES ====================
-- Uploads live at match-videos/{app_user_id}/{filename}: the first path segment is
-- the owner, so it is the whole authorisation check.
DROP POLICY IF EXISTS "Owner can upload match videos" ON storage.objects;
CREATE POLICY "Owner can upload match videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'match-videos'
  AND (storage.foldername(name))[1] = public.current_app_user_id()::text
);

DROP POLICY IF EXISTS "Owner can read match videos" ON storage.objects;
CREATE POLICY "Owner can read match videos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'match-videos'
  AND (storage.foldername(name))[1] = public.current_app_user_id()::text
);

-- Results live at match-results/{analysis_id}/..., so ownership comes from the row.
DROP POLICY IF EXISTS "Owner can read match results" ON storage.objects;
CREATE POLICY "Owner can read match results"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'match-results'
  AND EXISTS (
    SELECT 1 FROM public.match_analyses a
    WHERE a.user_id = public.current_app_user_id()
      AND a.id::text = (storage.foldername(name))[1]
  )
);

-- Nothing writes to match-results but the worker, via the service role.

-- ==================== CLAIM FUNCTION ====================
-- Hands exactly one queued job to one worker. FOR UPDATE SKIP LOCKED means two
-- workers polling at the same moment never take the same row.
CREATE OR REPLACE FUNCTION public.claim_next_match_analysis()
RETURNS SETOF public.match_analyses
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.match_analyses a
  SET status = 'processing',
      started_at = now()
  WHERE a.id = (
    SELECT id FROM public.match_analyses
    WHERE status = 'queued'
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING a.*;
$$;

-- SECURITY DEFINER runs as the owner, so execute rights are the only gate: the
-- worker's service role may claim jobs, logged-in users may not.
REVOKE ALL ON FUNCTION public.claim_next_match_analysis() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_next_match_analysis() TO service_role;
