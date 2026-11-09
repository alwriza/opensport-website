-- ============================================================
-- Creator Referral System (MVP)
--
-- Flow: referral visit -> registration -> first video upload -> pending activation
--       -> admin approves / rejects -> payout ("Mark as paid").
--
-- Design notes
--  * Referral data lives in public.user_referrals, not in public.users: users is
--    readable (and, per supabase_schema.sql, updatable) by any client, so a column
--    there could be read by anyone or rewritten by the user himself.
--  * Every new table has RLS on and no client policies. Clients reach the data only
--    through the SECURITY DEFINER functions below:
--      anon/authenticated : track_referral_visit
--      service_role       : attach_referral (called by the `register` Edge Function)
--      admins             : admin_* (checked with is_admin())
--  * The first upload is caught by AFTER INSERT triggers on public.videos and
--    public.match_analyses, so every upload path (kick, duel, match) counts and the
--    client cannot skip it. A failure there never blocks the upload itself.
--  * Attribution window: 14 days from the first referral visit (server time). It must
--    hold both at registration and at the first upload.
--  * Reward tiers are lifetime per creator; payout_cap is a lifetime limit on the
--    total paid. Paid activations are final and can never enter another payout.
--
-- public.match_analyses is optional: without it only public.videos uploads count;
-- re-run this file after that table is created to add its trigger.
--
-- Admins: add a row to public.admin_users by hand, e.g.
--   INSERT INTO public.admin_users (auth_user_id, note)
--   SELECT id, 'referral admin' FROM auth.users WHERE email = 'someone@opensport.app';
-- ============================================================


-- ==================== TABLES ====================

CREATE TABLE IF NOT EXISTS public.admin_users (
  auth_user_id uuid PRIMARY KEY,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.creators (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL CHECK (length(btrim(name)) > 0),
  platform      text,
  contact       text,
  -- Current code. Every code the creator ever had, this one included, is in creator_codes.
  referral_code text NOT NULL UNIQUE,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'blocked')),
  payout_cap    integer NOT NULL DEFAULT 15000 CHECK (payout_cap >= 0),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Lookup table for ?ref=<code>. A changed code stays here as an alias of the same creator.
CREATE TABLE IF NOT EXISTS public.creator_codes (
  code       text PRIMARY KEY CHECK (code ~ '^[a-z0-9_-]{3,32}$'),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS creator_codes_creator_idx ON public.creator_codes (creator_id);

-- One row per (creator, browser session). visited_at is the first visit and starts the window.
CREATE TABLE IF NOT EXISTS public.referral_visits (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  session_id    text NOT NULL,
  visited_at    timestamptz NOT NULL DEFAULT now(),
  landing_page  text,
  user_agent    text,
  ip_hash       text,
  CONSTRAINT referral_visits_creator_session_key UNIQUE (creator_id, session_id)
);
CREATE INDEX IF NOT EXISTS referral_visits_creator_idx ON public.referral_visits (creator_id, visited_at DESC);

-- The referral fields of a user (one row per referred user, written once at registration).
CREATE TABLE IF NOT EXISTS public.user_referrals (
  user_id                 uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  referred_by_creator_id  uuid NOT NULL REFERENCES public.creators(id),
  referral_code           text NOT NULL,
  visit_id                uuid REFERENCES public.referral_visits(id) ON DELETE SET NULL,
  referral_first_visit_at timestamptz NOT NULL,
  referral_expires_at     timestamptz NOT NULL,
  registered_at           timestamptz NOT NULL DEFAULT now(),
  registration_ip_hash    text,
  first_video_uploaded_at timestamptz,
  first_video_source      text CHECK (first_video_source IN ('videos', 'match_analyses')),
  first_video_id          uuid,
  creator_activated_at    timestamptz
);
CREATE INDEX IF NOT EXISTS user_referrals_creator_idx ON public.user_referrals (referred_by_creator_id);
CREATE INDEX IF NOT EXISTS user_referrals_ip_idx ON public.user_referrals (registration_ip_hash)
  WHERE registration_ip_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.creator_payouts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id        uuid NOT NULL REFERENCES public.creators(id),
  amount            integer NOT NULL CHECK (amount >= 0),
  activations_count integer NOT NULL CHECK (activations_count >= 0),
  status            text NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'cancelled')),
  period_start      timestamptz,
  period_end        timestamptz,
  note              text,
  created_by        uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  paid_at           timestamptz
);
CREATE INDEX IF NOT EXISTS creator_payouts_creator_idx ON public.creator_payouts (creator_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.creator_activations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id        uuid NOT NULL REFERENCES public.creators(id),
  user_id           uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  video_source      text CHECK (video_source IN ('videos', 'match_analyses')),
  video_id          uuid,
  activated_at      timestamptz NOT NULL DEFAULT now(),
  approved_at       timestamptz,
  rejected_at       timestamptz,
  paid_at           timestamptz,
  rejection_reason  text CHECK (rejection_reason IN (
                      'duplicate_account', 'fake_account', 'fraud', 'existing_user',
                      'invalid_referral', 'activation_after_expiration', 'other')),
  rejection_comment text,
  reviewed_by       uuid,
  reviewed_at       timestamptz,
  reward_amount     integer CHECK (reward_amount >= 0),
  payout_id         uuid REFERENCES public.creator_payouts(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT creator_activations_reason_check CHECK ((status = 'rejected') = (rejection_reason IS NOT NULL)),
  CONSTRAINT creator_activations_payout_check CHECK ((status = 'paid') = (payout_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS creator_activations_creator_idx
  ON public.creator_activations (creator_id, status, approved_at);
CREATE INDEX IF NOT EXISTS creator_activations_status_idx
  ON public.creator_activations (status, activated_at DESC);
CREATE INDEX IF NOT EXISTS creator_activations_payout_idx
  ON public.creator_activations (payout_id) WHERE payout_id IS NOT NULL;

-- Salt for IP hashes. Never readable by clients.
CREATE TABLE IF NOT EXISTS public.referral_secrets (
  id      boolean PRIMARY KEY DEFAULT true CHECK (id),
  ip_salt text NOT NULL
);
INSERT INTO public.referral_secrets (id, ip_salt)
VALUES (true, md5(gen_random_uuid()::text || clock_timestamp()::text || random()::text))
ON CONFLICT (id) DO NOTHING;


-- ==================== ROW LEVEL SECURITY ====================
-- On, with no policies: clients cannot read or write these tables directly.
ALTER TABLE public.admin_users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_codes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_visits     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_referrals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payouts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_secrets    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.admin_users, public.creators, public.creator_codes, public.referral_visits,
              public.user_referrals, public.creator_payouts, public.creator_activations,
              public.referral_secrets
  FROM anon, authenticated;


-- ==================== HELPERS ====================

CREATE OR REPLACE FUNCTION public.referral_window()
RETURNS interval LANGUAGE sql IMMUTABLE AS $$ SELECT interval '14 days' $$;

-- Rate for the k-th approved activation of a creator (lifetime count).
CREATE OR REPLACE FUNCTION public.referral_rate(k integer)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN k <= 0  THEN 0
    WHEN k <= 10 THEN 250
    WHEN k <= 25 THEN 300
    WHEN k <= 50 THEN 400
    ELSE 500
  END
$$;

-- Total reward for the first n activations: sum of referral_rate(1..n).
CREATE OR REPLACE FUNCTION public.referral_reward_total(n integer)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN n <= 0  THEN 0
    WHEN n <= 10 THEN 250 * n
    WHEN n <= 25 THEN 2500 + 300 * (n - 10)
    WHEN n <= 50 THEN 7000 + 400 * (n - 25)
    ELSE 17000 + 500 * (n - 50)
  END
$$;

CREATE OR REPLACE FUNCTION public.normalize_referral_code(p_code text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$ SELECT lower(btrim(coalesce(p_code, ''))) $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.admin_users WHERE auth_user_id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION public._referral_require_admin()
RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public._referral_ip_hash(p_ip text)
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_ip   text := btrim(split_part(coalesce(p_ip, ''), ',', 1));
  v_salt text;
BEGIN
  IF v_ip = '' THEN RETURN NULL; END IF;
  SELECT ip_salt INTO v_salt FROM public.referral_secrets WHERE id;
  RETURN encode(sha256(convert_to(coalesce(v_salt, '') || '|' || v_ip, 'UTF8')), 'hex');
END;
$$;

-- Client IP of the current PostgREST request (NULL outside of one).
CREATE OR REPLACE FUNCTION public._referral_request_ip()
RETURNS text
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_headers json;
BEGIN
  BEGIN
    v_headers := nullif(current_setting('request.headers', true), '')::json;
  EXCEPTION WHEN others THEN
    RETURN NULL;
  END;
  IF v_headers IS NULL THEN RETURN NULL; END IF;
  RETURN coalesce(
    nullif(v_headers->>'cf-connecting-ip', ''),
    nullif(btrim(split_part(v_headers->>'x-forwarded-for', ',', 1)), ''),
    nullif(v_headers->>'x-real-ip', '')
  );
END;
$$;

-- What a creator can be paid right now: the prefix of unpaid approved activations
-- (oldest approval first) whose tiered rewards fit under payout_cap.
CREATE OR REPLACE FUNCTION public._referral_payable(p_creator_id uuid)
RETURNS TABLE (
  paid_count     integer,
  paid_amount    integer,
  approved_count integer,
  fit_count      integer,
  to_pay         integer,
  payout_cap     integer
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_cap       integer;
  v_paid_cnt  integer;
  v_paid_amt  integer;
  v_approved  integer;
  v_fit       integer := 0;
BEGIN
  SELECT c.payout_cap INTO v_cap FROM public.creators c WHERE c.id = p_creator_id;

  -- Paid totals come from payouts, so they stay right even if a paid user is deleted.
  SELECT coalesce(sum(p.activations_count), 0)::integer, coalesce(sum(p.amount), 0)::integer
    INTO v_paid_cnt, v_paid_amt
    FROM public.creator_payouts p
   WHERE p.creator_id = p_creator_id AND p.status = 'paid';

  SELECT count(*)::integer INTO v_approved
    FROM public.creator_activations a
   WHERE a.creator_id = p_creator_id AND a.status = 'approved' AND a.payout_id IS NULL;

  -- Rates never decrease, so the activations that fit are always a prefix.
  WHILE v_fit < v_approved
    AND public.referral_reward_total(v_paid_cnt + v_fit + 1) - public.referral_reward_total(v_paid_cnt)
        <= coalesce(v_cap, 0) - v_paid_amt
  LOOP
    v_fit := v_fit + 1;
  END LOOP;

  paid_count     := v_paid_cnt;
  paid_amount    := v_paid_amt;
  approved_count := v_approved;
  fit_count      := v_fit;
  to_pay         := public.referral_reward_total(v_paid_cnt + v_fit) - public.referral_reward_total(v_paid_cnt);
  payout_cap     := coalesce(v_cap, 0);
  RETURN NEXT;
END;
$$;

-- public.match_analyses may not exist yet (its migration is applied separately),
-- so everything that touches it goes through these two helpers.
CREATE OR REPLACE FUNCTION public._referral_has_uploads(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_found boolean := false;
BEGIN
  IF EXISTS (SELECT 1 FROM public.videos WHERE user_id = p_user_id) THEN
    RETURN true;
  END IF;
  IF to_regclass('public.match_analyses') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.match_analyses WHERE user_id = $1)' INTO v_found USING p_user_id;
  END IF;
  RETURN v_found;
END;
$$;

CREATE OR REPLACE FUNCTION public._referral_video_path(p_source text, p_video_id uuid)
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_path text;
BEGIN
  IF p_video_id IS NULL THEN RETURN NULL; END IF;
  IF p_source = 'videos' THEN
    SELECT storage_path INTO v_path FROM public.videos WHERE id = p_video_id;
  ELSIF p_source = 'match_analyses' AND to_regclass('public.match_analyses') IS NOT NULL THEN
    EXECUTE 'SELECT video_path FROM public.match_analyses WHERE id = $1' INTO v_path USING p_video_id;
  END IF;
  RETURN v_path;
END;
$$;

CREATE OR REPLACE FUNCTION public._referral_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS creators_touch_updated_at ON public.creators;
CREATE TRIGGER creators_touch_updated_at
  BEFORE UPDATE ON public.creators
  FOR EACH ROW EXECUTE FUNCTION public._referral_touch_updated_at();


-- ==================== 1. REFERRAL VISIT (public) ====================
-- Called from the browser when the site is opened with ?ref=<code>.
-- Invalid, unknown, paused or blocked codes are not stored.
CREATE OR REPLACE FUNCTION public.track_referral_visit(
  p_code         text,
  p_session_id   text,
  p_landing_page text DEFAULT NULL,
  p_user_agent   text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_code    text := public.normalize_referral_code(p_code);
  v_creator public.creators%ROWTYPE;
  v_visit   public.referral_visits%ROWTYPE;
BEGIN
  IF v_code !~ '^[a-z0-9_-]{3,32}$' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_code');
  END IF;
  IF p_session_id IS NULL OR p_session_id !~ '^[A-Za-z0-9-]{8,64}$' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_session');
  END IF;

  SELECT c.* INTO v_creator
    FROM public.creator_codes cc
    JOIN public.creators c ON c.id = cc.creator_id
   WHERE cc.code = v_code;

  IF NOT FOUND OR v_creator.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_code');
  END IF;

  INSERT INTO public.referral_visits (creator_id, referral_code, session_id, landing_page, user_agent, ip_hash)
  VALUES (v_creator.id, v_code, p_session_id, left(p_landing_page, 500), left(p_user_agent, 500),
          public._referral_ip_hash(public._referral_request_ip()))
  ON CONFLICT (creator_id, session_id) DO NOTHING;

  -- A repeat visit from the same session keeps the first visit time.
  SELECT * INTO v_visit
    FROM public.referral_visits
   WHERE creator_id = v_creator.id AND session_id = p_session_id;

  RETURN jsonb_build_object(
    'ok', true,
    'visit_id', v_visit.id,
    'code', v_code,
    'visited_at', v_visit.visited_at,
    'expires_at', v_visit.visited_at + public.referral_window()
  );
END;
$$;


-- ==================== 2. ATTACH AT REGISTRATION (service_role) ====================
-- Called by the `register` Edge Function right after it created the account.
-- First touch: a user gets a creator once and it never changes.
CREATE OR REPLACE FUNCTION public.attach_referral(
  p_auth_user_id uuid,
  p_visit_id     uuid,
  p_ip           text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_visit   public.referral_visits%ROWTYPE;
  v_status  text;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE auth_user_id = p_auth_user_id;
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'user_not_found');
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_referrals WHERE user_id = v_user_id) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_attached');
  END IF;

  -- Only a brand new account can be a referral user.
  IF public._referral_has_uploads(v_user_id) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'existing_user');
  END IF;

  SELECT * INTO v_visit FROM public.referral_visits WHERE id = p_visit_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_referral');
  END IF;

  SELECT status INTO v_status FROM public.creators WHERE id = v_visit.creator_id;
  IF v_status IS DISTINCT FROM 'active' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'creator_' || coalesce(v_status, 'missing'));
  END IF;

  IF now() > v_visit.visited_at + public.referral_window() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'expired');
  END IF;

  INSERT INTO public.user_referrals (
    user_id, referred_by_creator_id, referral_code, visit_id,
    referral_first_visit_at, referral_expires_at, registration_ip_hash
  ) VALUES (
    v_user_id, v_visit.creator_id, v_visit.referral_code, v_visit.id,
    v_visit.visited_at, v_visit.visited_at + public.referral_window(), public._referral_ip_hash(p_ip)
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'creator_id', v_visit.creator_id, 'code', v_visit.referral_code);
END;
$$;


-- ==================== 3. FIRST UPLOAD -> ACTIVATION (trigger) ====================
CREATE OR REPLACE FUNCTION public._referral_register_first_upload(
  p_user_id  uuid,
  p_source   text,
  p_video_id uuid
)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_ref    public.user_referrals%ROWTYPE;
  v_status text;
  v_now    timestamptz := now();
BEGIN
  -- Atomic "is this the first upload?": only the first one finds a NULL here.
  UPDATE public.user_referrals
     SET first_video_uploaded_at = v_now,
         first_video_source      = p_source,
         first_video_id          = p_video_id
   WHERE user_id = p_user_id
     AND first_video_uploaded_at IS NULL
  RETURNING * INTO v_ref;

  IF NOT FOUND THEN
    RETURN; -- not a referred user, or not the first upload
  END IF;

  IF v_now > v_ref.referral_expires_at THEN
    RETURN; -- uploaded after the 14-day window: no activation
  END IF;

  SELECT status INTO v_status FROM public.creators WHERE id = v_ref.referred_by_creator_id;
  IF v_status IS NULL OR v_status = 'blocked' THEN
    RETURN;
  END IF;

  INSERT INTO public.creator_activations (creator_id, user_id, status, video_source, video_id, activated_at)
  VALUES (v_ref.referred_by_creator_id, p_user_id, 'pending', p_source, p_video_id, v_now)
  ON CONFLICT (user_id) DO NOTHING;

  IF FOUND THEN
    UPDATE public.user_referrals SET creator_activated_at = v_now WHERE user_id = p_user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public._referral_on_upload()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    BEGIN
      PERFORM public._referral_register_first_upload(NEW.user_id, TG_TABLE_NAME, NEW.id);
    EXCEPTION WHEN others THEN
      -- The referral program must never break an upload.
      RAISE WARNING 'referral first-upload hook failed for user %: %', NEW.user_id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS referral_first_upload ON public.videos;
CREATE TRIGGER referral_first_upload
  AFTER INSERT ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public._referral_on_upload();

-- Match uploads count too. If match_analyses does not exist yet, re-run this
-- migration after 20260928_create_match_analyses.sql to attach the trigger.
DO $$
BEGIN
  IF to_regclass('public.match_analyses') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS referral_first_upload ON public.match_analyses;
    CREATE TRIGGER referral_first_upload
      AFTER INSERT ON public.match_analyses
      FOR EACH ROW EXECUTE FUNCTION public._referral_on_upload();
  END IF;
END $$;


-- ==================== 4. ADMIN: CREATORS ====================

CREATE OR REPLACE FUNCTION public.admin_list_creators()
RETURNS TABLE (
  id                    uuid,
  name                  text,
  platform              text,
  contact               text,
  referral_code         text,
  aliases               text[],
  status                text,
  payout_cap            integer,
  notes                 text,
  created_at            timestamptz,
  updated_at            timestamptz,
  visits                integer,
  registrations         integer,
  registered_no_video   integer,
  uploaded_after_window integer,
  pending               integer,
  approved              integer,
  rejected              integer,
  paid                  integer,
  earned_uncapped       integer,
  paid_amount           integer,
  to_pay                integer,
  over_cap              integer
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public._referral_require_admin();

  RETURN QUERY
  SELECT
    c.id, c.name, c.platform, c.contact, c.referral_code,
    coalesce((SELECT array_agg(cc.code ORDER BY cc.created_at)
                FROM public.creator_codes cc
               WHERE cc.creator_id = c.id AND cc.code <> c.referral_code), '{}'::text[]),
    c.status, c.payout_cap, c.notes, c.created_at, c.updated_at,
    (SELECT count(*) FROM public.referral_visits v WHERE v.creator_id = c.id)::integer,
    (SELECT count(*) FROM public.user_referrals r WHERE r.referred_by_creator_id = c.id)::integer,
    (SELECT count(*) FROM public.user_referrals r
      WHERE r.referred_by_creator_id = c.id AND r.first_video_uploaded_at IS NULL)::integer,
    (SELECT count(*) FROM public.user_referrals r
      WHERE r.referred_by_creator_id = c.id
        AND r.first_video_uploaded_at > r.referral_expires_at)::integer,
    (SELECT count(*) FROM public.creator_activations a WHERE a.creator_id = c.id AND a.status = 'pending')::integer,
    (SELECT count(*) FROM public.creator_activations a WHERE a.creator_id = c.id AND a.status = 'approved')::integer,
    (SELECT count(*) FROM public.creator_activations a WHERE a.creator_id = c.id AND a.status = 'rejected')::integer,
    p.paid_count,
    public.referral_reward_total(p.paid_count + p.approved_count),
    p.paid_amount,
    p.to_pay,
    p.approved_count - p.fit_count
  FROM public.creators c
  CROSS JOIN LATERAL public._referral_payable(c.id) p
  ORDER BY c.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_creator(
  p_id            uuid,
  p_name          text,
  p_platform      text DEFAULT NULL,
  p_contact       text DEFAULT NULL,
  p_referral_code text DEFAULT NULL,
  p_payout_cap    integer DEFAULT NULL,
  p_notes         text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_code text := public.normalize_referral_code(p_referral_code);
  v_id   uuid;
BEGIN
  PERFORM public._referral_require_admin();

  IF p_name IS NULL OR btrim(p_name) = '' THEN
    RAISE EXCEPTION 'name_required' USING ERRCODE = '22023';
  END IF;
  IF p_payout_cap IS NOT NULL AND p_payout_cap < 0 THEN
    RAISE EXCEPTION 'invalid_cap' USING ERRCODE = '22023';
  END IF;

  IF p_id IS NULL THEN
    IF v_code !~ '^[a-z0-9_-]{3,32}$' THEN
      RAISE EXCEPTION 'invalid_code' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (SELECT 1 FROM public.creator_codes WHERE code = v_code) THEN
      RAISE EXCEPTION 'code_taken' USING ERRCODE = '23505';
    END IF;

    INSERT INTO public.creators (name, platform, contact, referral_code, payout_cap, notes)
    VALUES (btrim(p_name), nullif(btrim(p_platform), ''), nullif(btrim(p_contact), ''), v_code,
            coalesce(p_payout_cap, 15000), nullif(btrim(p_notes), ''))
    RETURNING creators.id INTO v_id;

    INSERT INTO public.creator_codes (code, creator_id) VALUES (v_code, v_id);
    RETURN v_id;
  END IF;

  -- The code is changed only with admin_change_creator_code (keeps the old one as an alias).
  UPDATE public.creators
     SET name       = btrim(p_name),
         platform   = nullif(btrim(p_platform), ''),
         contact    = nullif(btrim(p_contact), ''),
         payout_cap = coalesce(p_payout_cap, payout_cap),
         notes      = nullif(btrim(p_notes), '')
   WHERE creators.id = p_id
  RETURNING creators.id INTO v_id;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'creator_not_found' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_creator_status(p_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public._referral_require_admin();
  IF p_status NOT IN ('active', 'paused', 'blocked') THEN
    RAISE EXCEPTION 'invalid_status' USING ERRCODE = '22023';
  END IF;
  UPDATE public.creators SET status = p_status WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'creator_not_found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_creator_cap(p_id uuid, p_cap integer)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public._referral_require_admin();
  IF p_cap IS NULL OR p_cap < 0 THEN
    RAISE EXCEPTION 'invalid_cap' USING ERRCODE = '22023';
  END IF;
  UPDATE public.creators SET payout_cap = p_cap WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'creator_not_found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

-- New primary code; every old code keeps working as an alias of the same creator.
CREATE OR REPLACE FUNCTION public.admin_change_creator_code(p_id uuid, p_code text)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_code  text := public.normalize_referral_code(p_code);
  v_owner uuid;
BEGIN
  PERFORM public._referral_require_admin();
  IF v_code !~ '^[a-z0-9_-]{3,32}$' THEN
    RAISE EXCEPTION 'invalid_code' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.creators WHERE id = p_id) THEN
    RAISE EXCEPTION 'creator_not_found' USING ERRCODE = 'P0002';
  END IF;

  SELECT creator_id INTO v_owner FROM public.creator_codes WHERE code = v_code;
  IF v_owner IS NOT NULL AND v_owner <> p_id THEN
    RAISE EXCEPTION 'code_taken' USING ERRCODE = '23505';
  END IF;
  IF v_owner IS NULL THEN
    INSERT INTO public.creator_codes (code, creator_id) VALUES (v_code, p_id);
  END IF;

  UPDATE public.creators SET referral_code = v_code WHERE id = p_id;
END;
$$;


-- ==================== 5. ADMIN: ACTIVATIONS ====================

CREATE OR REPLACE FUNCTION public.admin_list_activations(
  p_status     text DEFAULT NULL,
  p_creator_id uuid DEFAULT NULL,
  p_limit      integer DEFAULT 500
)
RETURNS TABLE (
  id                      uuid,
  creator_id              uuid,
  creator_name            text,
  creator_code            text,
  creator_status          text,
  user_id                 uuid,
  user_nickname           text,
  user_email              text,
  user_phone              text,
  status                  text,
  video_source            text,
  video_id                uuid,
  video_bucket            text,
  video_path              text,
  referral_first_visit_at timestamptz,
  registered_at           timestamptz,
  first_video_uploaded_at timestamptz,
  activated_at            timestamptz,
  approved_at             timestamptz,
  rejected_at             timestamptz,
  paid_at                 timestamptz,
  rejection_reason        text,
  rejection_comment       text,
  reward_amount           integer,
  payout_id               uuid,
  same_ip_users           integer
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public._referral_require_admin();

  RETURN QUERY
  SELECT
    a.id, a.creator_id, c.name, c.referral_code, c.status,
    a.user_id, u.nickname, u.email, u.phone,
    a.status, a.video_source, a.video_id,
    CASE a.video_source WHEN 'videos' THEN 'videos' WHEN 'match_analyses' THEN 'match-videos' END,
    public._referral_video_path(a.video_source, a.video_id),
    r.referral_first_visit_at, r.registered_at, r.first_video_uploaded_at,
    a.activated_at, a.approved_at, a.rejected_at, a.paid_at,
    a.rejection_reason, a.rejection_comment, a.reward_amount, a.payout_id,
    -- Other referred users registered from the same IP: a duplicate-account hint.
    CASE WHEN r.registration_ip_hash IS NULL THEN 0 ELSE
      (SELECT count(*) FROM public.user_referrals r2
        WHERE r2.registration_ip_hash = r.registration_ip_hash AND r2.user_id <> a.user_id)::integer
    END
  FROM public.creator_activations a
  JOIN public.creators c ON c.id = a.creator_id
  LEFT JOIN public.users u ON u.id = a.user_id
  LEFT JOIN public.user_referrals r ON r.user_id = a.user_id
  WHERE (p_status IS NULL OR a.status = p_status)
    AND (p_creator_id IS NULL OR a.creator_id = p_creator_id)
  ORDER BY a.activated_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 500), 2000));
END;
$$;

-- pending/approved/rejected can move between each other; paid is final.
CREATE OR REPLACE FUNCTION public.admin_review_activation(
  p_id       uuid,
  p_decision text,
  p_reason   text DEFAULT NULL,
  p_comment  text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_status  text;
  v_creator uuid;
BEGIN
  PERFORM public._referral_require_admin();

  SELECT creator_id INTO v_creator FROM public.creator_activations WHERE id = p_id;
  IF v_creator IS NULL THEN
    RAISE EXCEPTION 'activation_not_found' USING ERRCODE = 'P0002';
  END IF;
  -- Same lock as admin_create_payout, so a review never lands in the middle of a payout.
  PERFORM 1 FROM public.creators WHERE id = v_creator FOR UPDATE;

  SELECT status INTO v_status FROM public.creator_activations WHERE id = p_id FOR UPDATE;
  IF v_status = 'paid' THEN
    RAISE EXCEPTION 'already_paid' USING ERRCODE = '22023';
  END IF;

  IF p_decision = 'approved' THEN
    UPDATE public.creator_activations
       SET status = 'approved',
           approved_at = CASE WHEN v_status = 'approved' THEN approved_at ELSE now() END,
           rejected_at = NULL, rejection_reason = NULL, rejection_comment = NULL,
           reviewed_by = auth.uid(), reviewed_at = now()
     WHERE id = p_id;
  ELSIF p_decision = 'rejected' THEN
    IF p_reason IS NULL OR p_reason NOT IN (
         'duplicate_account', 'fake_account', 'fraud', 'existing_user',
         'invalid_referral', 'activation_after_expiration', 'other') THEN
      RAISE EXCEPTION 'invalid_reason' USING ERRCODE = '22023';
    END IF;
    UPDATE public.creator_activations
       SET status = 'rejected',
           rejected_at = now(), approved_at = NULL,
           rejection_reason = p_reason, rejection_comment = nullif(btrim(p_comment), ''),
           reviewed_by = auth.uid(), reviewed_at = now()
     WHERE id = p_id;
  ELSIF p_decision = 'pending' THEN
    UPDATE public.creator_activations
       SET status = 'pending',
           approved_at = NULL, rejected_at = NULL, rejection_reason = NULL, rejection_comment = NULL,
           reviewed_by = auth.uid(), reviewed_at = now()
     WHERE id = p_id;
  ELSE
    RAISE EXCEPTION 'invalid_decision' USING ERRCODE = '22023';
  END IF;
END;
$$;


-- ==================== 6. ADMIN: PAYOUTS ====================

-- What "Mark as paid" would pay right now, line by line.
CREATE OR REPLACE FUNCTION public.admin_preview_payout(p_creator_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  p      record;
  v_rows jsonb;
BEGIN
  PERFORM public._referral_require_admin();
  IF NOT EXISTS (SELECT 1 FROM public.creators WHERE id = p_creator_id) THEN
    RAISE EXCEPTION 'creator_not_found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO p FROM public._referral_payable(p_creator_id);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'id', x.id, 'user_nickname', x.nickname, 'user_email', x.email,
           'approved_at', x.approved_at, 'ordinal', x.ordinal, 'rate', public.referral_rate(x.ordinal)
         ) ORDER BY x.ordinal), '[]'::jsonb)
    INTO v_rows
    FROM (
      SELECT a.id, u.nickname, u.email, a.approved_at,
             (p.paid_count + row_number() OVER (ORDER BY a.approved_at, a.id))::integer AS ordinal
        FROM public.creator_activations a
        LEFT JOIN public.users u ON u.id = a.user_id
       WHERE a.creator_id = p_creator_id AND a.status = 'approved' AND a.payout_id IS NULL
       ORDER BY a.approved_at, a.id
       LIMIT p.fit_count
    ) x;

  RETURN jsonb_build_object(
    'creator_id', p_creator_id,
    'payout_cap', p.payout_cap,
    'paid_count', p.paid_count,
    'paid_amount', p.paid_amount,
    'approved_count', p.approved_count,
    'fit_count', p.fit_count,
    'over_cap', p.approved_count - p.fit_count,
    'amount', p.to_pay,
    'cap_left', greatest(p.payout_cap - p.paid_amount - p.to_pay, 0),
    'activations', v_rows
  );
END;
$$;

-- "Mark as paid": pays every unpaid approved activation that fits under the cap.
-- p_expected_amount is the amount the admin saw in the preview; if anything changed
-- in between, the call fails instead of paying a different sum.
CREATE OR REPLACE FUNCTION public.admin_create_payout(
  p_creator_id      uuid,
  p_expected_amount integer,
  p_note            text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  p           record;
  v_payout_id uuid;
  v_ids       uuid[];
  v_start     timestamptz;
  v_end       timestamptz;
  v_now       timestamptz := now();
BEGIN
  PERFORM public._referral_require_admin();

  -- One payout at a time per creator: a double click waits here, then finds nothing to pay.
  PERFORM 1 FROM public.creators WHERE id = p_creator_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'creator_not_found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO p FROM public._referral_payable(p_creator_id);

  IF p.fit_count = 0 OR p.to_pay = 0 THEN
    RAISE EXCEPTION 'nothing_to_pay' USING ERRCODE = '22023';
  END IF;
  IF p_expected_amount IS DISTINCT FROM p.to_pay THEN
    RAISE EXCEPTION 'amount_changed' USING ERRCODE = '22023',
      DETAIL = format('expected %s, payable %s', p_expected_amount, p.to_pay);
  END IF;

  -- The same oldest-approved-first prefix that _referral_payable priced.
  SELECT array_agg(x.id ORDER BY x.approved_at, x.id), min(x.approved_at), max(x.approved_at)
    INTO v_ids, v_start, v_end
    FROM (
      SELECT a.id, a.approved_at
        FROM public.creator_activations a
       WHERE a.creator_id = p_creator_id AND a.status = 'approved' AND a.payout_id IS NULL
       ORDER BY a.approved_at, a.id
       LIMIT p.fit_count
    ) x;

  INSERT INTO public.creator_payouts
    (creator_id, amount, activations_count, status, period_start, period_end, note, created_by, created_at, paid_at)
  VALUES
    (p_creator_id, p.to_pay, p.fit_count, 'paid', v_start, v_end, nullif(btrim(p_note), ''), auth.uid(), v_now, v_now)
  RETURNING id INTO v_payout_id;

  UPDATE public.creator_activations a
     SET status = 'paid',
         payout_id = v_payout_id,
         reward_amount = public.referral_rate(p.paid_count + t.ord::integer),
         paid_at = v_now
    FROM unnest(v_ids) WITH ORDINALITY AS t(id, ord)
   WHERE a.id = t.id;

  RETURN jsonb_build_object('payout_id', v_payout_id, 'amount', p.to_pay, 'activations_count', p.fit_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_payouts(p_creator_id uuid DEFAULT NULL)
RETURNS TABLE (
  id                uuid,
  creator_id        uuid,
  creator_name      text,
  creator_code      text,
  amount            integer,
  activations_count integer,
  status            text,
  period_start      timestamptz,
  period_end        timestamptz,
  note              text,
  created_by_email  text,
  created_at        timestamptz,
  paid_at           timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public._referral_require_admin();

  RETURN QUERY
  SELECT p.id, p.creator_id, c.name, c.referral_code, p.amount, p.activations_count, p.status,
         p.period_start, p.period_end, p.note, u.email, p.created_at, p.paid_at
    FROM public.creator_payouts p
    JOIN public.creators c ON c.id = p.creator_id
    LEFT JOIN public.users u ON u.auth_user_id = p.created_by
   WHERE p_creator_id IS NULL OR p.creator_id = p_creator_id
   ORDER BY p.created_at DESC;
END;
$$;


-- ==================== 7. STORAGE: admins can open referral videos ====================
-- Lets the admin panel create signed URLs for the first video when reviewing.
-- Policies are OR-ed, so this adds admin read access and changes nothing for users.
DROP POLICY IF EXISTS "Referral admins can read uploaded videos" ON storage.objects;
CREATE POLICY "Referral admins can read uploaded videos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id IN ('videos', 'match-videos') AND public.is_admin());


-- ==================== 8. FUNCTION PRIVILEGES ====================
-- Supabase grants EXECUTE on new public functions to anon and authenticated by default.
-- Take it all back, then grant exactly what each caller needs.
REVOKE EXECUTE ON FUNCTION
  public.referral_window(),
  public.referral_rate(integer),
  public.referral_reward_total(integer),
  public.normalize_referral_code(text),
  public.is_admin(),
  public._referral_require_admin(),
  public._referral_ip_hash(text),
  public._referral_request_ip(),
  public._referral_payable(uuid),
  public._referral_has_uploads(uuid),
  public._referral_video_path(text, uuid),
  public._referral_touch_updated_at(),
  public.track_referral_visit(text, text, text, text),
  public.attach_referral(uuid, uuid, text),
  public._referral_register_first_upload(uuid, text, uuid),
  public._referral_on_upload(),
  public.admin_list_creators(),
  public.admin_upsert_creator(uuid, text, text, text, text, integer, text),
  public.admin_set_creator_status(uuid, text),
  public.admin_set_creator_cap(uuid, integer),
  public.admin_change_creator_code(uuid, text),
  public.admin_list_activations(text, uuid, integer),
  public.admin_review_activation(uuid, text, text, text),
  public.admin_preview_payout(uuid),
  public.admin_create_payout(uuid, integer, text),
  public.admin_list_payouts(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.track_referral_visit(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.attach_referral(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION
  public.admin_list_creators(),
  public.admin_upsert_creator(uuid, text, text, text, text, integer, text),
  public.admin_set_creator_status(uuid, text),
  public.admin_set_creator_cap(uuid, integer),
  public.admin_change_creator_code(uuid, text),
  public.admin_list_activations(text, uuid, integer),
  public.admin_review_activation(uuid, text, text, text),
  public.admin_preview_payout(uuid),
  public.admin_create_payout(uuid, integer, text),
  public.admin_list_payouts(uuid)
TO authenticated;
