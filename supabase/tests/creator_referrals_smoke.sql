-- ============================================================
-- Smoke test for 20261108_creator_referrals.sql
--
-- Runs the whole Definition-of-Done flow plus the edge cases from the spec inside
-- one transaction and ROLLS BACK at the end, so it leaves nothing behind.
-- Run it in the Supabase SQL editor (as postgres) or with psql -f.
-- Every check is an ASSERT: the first failing one aborts with its message.
-- Time travel is done by moving visit / expiry timestamps back.
-- ============================================================
BEGIN;

-- ---------- fixtures (as postgres) ----------
CREATE TEMP TABLE t_ids (k text PRIMARY KEY, v uuid);
GRANT ALL ON t_ids TO anon, authenticated, service_role;

CREATE TEMP TABLE t_new_user_result (k text PRIMARY KEY, v jsonb);
GRANT ALL ON t_new_user_result TO anon, authenticated, service_role;

-- Accounts: an admin, a non-admin, and the would-be referral users.
WITH ins AS (
  INSERT INTO auth.users (id, email, raw_user_meta_data)
  SELECT gen_random_uuid(), 'ref-test-' || k || '@example.test',
         jsonb_build_object('nickname', 'ref_test_' || k, 'phone', '+7700000' || lpad(n::text, 4, '0'))
    FROM unnest(ARRAY['admin', 'stranger', 'u1', 'u2', 'u3', 'u4', 'u5', 'u6']) WITH ORDINALITY AS t(k, n)
  RETURNING id, email
)
INSERT INTO t_ids SELECT 'auth_' || split_part(split_part(email, '@', 1), 'ref-test-', 2), id FROM ins;

INSERT INTO t_ids SELECT 'user_' || substr(t.k, 6), u.id
  FROM t_ids t JOIN public.users u ON u.auth_user_id = t.v WHERE t.k LIKE 'auth_%';

INSERT INTO public.admin_users (auth_user_id, note) SELECT v, 'smoke test' FROM t_ids WHERE k = 'auth_admin';

-- u5 already existed before the referral: give it an older video.
INSERT INTO public.videos (user_id, storage_path, filename)
SELECT v, 'old/old.mp4', 'old.mp4' FROM t_ids WHERE k = 'user_u5';

DO $$ BEGIN
  ASSERT (SELECT count(*) FROM t_ids WHERE k LIKE 'user_%') = 8, 'auth trigger did not create public.users rows';
END $$;

-- ---------- pure functions ----------
DO $$
DECLARE n int; s int := 0;
BEGIN
  FOR n IN 1..120 LOOP
    s := s + public.referral_rate(n);
    ASSERT public.referral_reward_total(n) = s, format('reward_total(%s) = %s, expected %s', n, public.referral_reward_total(n), s);
  END LOOP;
  ASSERT public.referral_reward_total(10) = 2500;
  ASSERT public.referral_reward_total(25) = 7000;
  ASSERT public.referral_reward_total(45) = 15000;
  ASSERT public.referral_reward_total(50) = 17000;
END $$;

-- ---------- 1. admin creates creators ----------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT v FROM t_ids WHERE k = 'auth_stranger'), 'role', 'authenticated')::text, true);
DO $$ BEGIN
  ASSERT NOT public.is_admin(), 'stranger must not be admin';
  BEGIN
    PERFORM public.admin_list_creators();
    ASSERT false, 'non-admin could list creators';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM * FROM public.creators;
    ASSERT false, 'authenticated could read creators directly';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;

SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT v FROM t_ids WHERE k = 'auth_admin'), 'role', 'authenticated')::text, true);
DO $$ BEGIN
  ASSERT public.is_admin(), 'admin not recognised';
  INSERT INTO t_ids VALUES ('arman', public.admin_upsert_creator(NULL, 'Arman', 'TikTok', '@arman', 'Arman01', NULL, NULL));
  INSERT INTO t_ids VALUES ('other', public.admin_upsert_creator(NULL, 'Other', 'Instagram', '@other', 'other02', NULL, NULL));
  INSERT INTO t_ids VALUES ('bad',   public.admin_upsert_creator(NULL, 'Blocked', NULL, NULL, 'blocked03', NULL, NULL));
  INSERT INTO t_ids VALUES ('big',   public.admin_upsert_creator(NULL, 'Big', NULL, NULL, 'big04', NULL, NULL));
  PERFORM public.admin_set_creator_status((SELECT v FROM t_ids WHERE k = 'bad'), 'blocked');

  BEGIN
    PERFORM public.admin_upsert_creator(NULL, 'Dup', NULL, NULL, 'ARMAN01', NULL, NULL);
    ASSERT false, 'duplicate code accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;

  ASSERT (SELECT referral_code FROM public.admin_list_creators() WHERE id = (SELECT v FROM t_ids WHERE k = 'arman')) = 'arman01',
    'code not normalised to lower case';
  ASSERT (SELECT payout_cap FROM public.admin_list_creators() WHERE id = (SELECT v FROM t_ids WHERE k = 'arman')) = 15000,
    'default cap is not 15000';
END $$;
RESET ROLE;

-- ---------- 2. referral visits (anon) ----------
SET LOCAL ROLE anon;
DO $$
DECLARE r jsonb; r2 jsonb;
BEGIN
  r := public.track_referral_visit('ARMAN01', 'session-u1-aaaa', '/', 'test-agent');
  ASSERT (r->>'ok')::boolean, 'valid visit rejected: ' || r::text;
  r2 := public.track_referral_visit('arman01', 'session-u1-aaaa', '/', 'test-agent');
  ASSERT r2->>'visit_id' = r->>'visit_id', 'repeat visit from the same session created a new visit';
  INSERT INTO t_ids VALUES ('visit_u1', (r->>'visit_id')::uuid);

  INSERT INTO t_ids VALUES ('visit_u2', (public.track_referral_visit('arman01', 'session-u2-aaaa')->>'visit_id')::uuid);
  INSERT INTO t_ids VALUES ('visit_u3', (public.track_referral_visit('arman01', 'session-u3-aaaa')->>'visit_id')::uuid);
  INSERT INTO t_ids VALUES ('visit_u4_b', (public.track_referral_visit('other02', 'session-u4-aaaa')->>'visit_id')::uuid);
  INSERT INTO t_ids VALUES ('visit_u5', (public.track_referral_visit('arman01', 'session-u5-aaaa')->>'visit_id')::uuid);
  INSERT INTO t_ids VALUES ('visit_u6', (public.track_referral_visit('arman01', 'session-u6-aaaa')->>'visit_id')::uuid);

  ASSERT NOT (public.track_referral_visit('nobody99', 'session-x-aaaa')->>'ok')::boolean, 'unknown code accepted';
  ASSERT NOT (public.track_referral_visit('blocked03', 'session-x-aaaa')->>'ok')::boolean, 'blocked creator accepted a visit';
  ASSERT NOT (public.track_referral_visit('a', 'session-x-aaaa')->>'ok')::boolean, 'malformed code accepted';

  BEGIN
    PERFORM public.attach_referral(gen_random_uuid(), gen_random_uuid(), NULL);
    ASSERT false, 'anon could call attach_referral';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM * FROM public.referral_visits;
    ASSERT false, 'anon could read referral_visits';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;

DO $$ BEGIN
  ASSERT (SELECT count(*) FROM public.referral_visits WHERE creator_id = (SELECT v FROM t_ids WHERE k = 'arman')) = 5,
    'expected 5 unique arman01 visits';
END $$;

-- Opened the link and came back later: move the first visits into the past.
UPDATE public.referral_visits SET visited_at = now() - interval '5 days'  WHERE id = (SELECT v FROM t_ids WHERE k = 'visit_u1');
UPDATE public.referral_visits SET visited_at = now() - interval '20 days' WHERE id = (SELECT v FROM t_ids WHERE k = 'visit_u2');
UPDATE public.referral_visits SET visited_at = now() - interval '5 days'  WHERE id = (SELECT v FROM t_ids WHERE k = 'visit_u3');

-- ---------- 3. registration (service_role, as the register Edge Function) ----------
SET LOCAL ROLE service_role;
DO $$
DECLARE r jsonb;
BEGIN
  -- registered 5 days after the visit -> creator saved
  r := public.attach_referral((SELECT v FROM t_ids WHERE k = 'auth_u1'), (SELECT v FROM t_ids WHERE k = 'visit_u1'), '203.0.113.7');
  ASSERT (r->>'ok')::boolean, 'u1 not attached: ' || r::text;

  -- registered 20 days after the visit -> not saved
  r := public.attach_referral((SELECT v FROM t_ids WHERE k = 'auth_u2'), (SELECT v FROM t_ids WHERE k = 'visit_u2'), NULL);
  ASSERT r->>'reason' = 'expired', 'u2 should be expired: ' || r::text;

  r := public.attach_referral((SELECT v FROM t_ids WHERE k = 'auth_u3'), (SELECT v FROM t_ids WHERE k = 'visit_u3'), '203.0.113.7');
  ASSERT (r->>'ok')::boolean, 'u3 not attached: ' || r::text;

  -- first touch: u1 is attached to arman01 and stays there
  r := public.attach_referral((SELECT v FROM t_ids WHERE k = 'auth_u1'), (SELECT v FROM t_ids WHERE k = 'visit_u4_b'), NULL);
  ASSERT r->>'reason' = 'already_attached', 'second creator overwrote the first: ' || r::text;

  -- an existing user (already has a video) is not a referral user
  r := public.attach_referral((SELECT v FROM t_ids WHERE k = 'auth_u5'), (SELECT v FROM t_ids WHERE k = 'visit_u5'), NULL);
  ASSERT r->>'reason' = 'existing_user', 'existing user attached: ' || r::text;

  r := public.attach_referral((SELECT v FROM t_ids WHERE k = 'auth_u6'), (SELECT v FROM t_ids WHERE k = 'visit_u6'), NULL);
  ASSERT (r->>'ok')::boolean, 'u6 not attached: ' || r::text;

  r := public.attach_referral((SELECT v FROM t_ids WHERE k = 'auth_u4'), gen_random_uuid(), NULL);
  ASSERT r->>'reason' = 'invalid_referral', 'unknown visit accepted: ' || r::text;
END $$;
RESET ROLE;

DO $$ BEGIN
  ASSERT (SELECT referred_by_creator_id FROM public.user_referrals WHERE user_id = (SELECT v FROM t_ids WHERE k = 'user_u1'))
         = (SELECT v FROM t_ids WHERE k = 'arman'), 'u1 is not linked to arman01';
  ASSERT (SELECT referral_expires_at - referral_first_visit_at FROM public.user_referrals
           WHERE user_id = (SELECT v FROM t_ids WHERE k = 'user_u1')) = interval '14 days', 'window is not 14 days';
  ASSERT NOT EXISTS (SELECT 1 FROM public.user_referrals WHERE user_id IN
           (SELECT v FROM t_ids WHERE k IN ('user_u2', 'user_u4', 'user_u5'))), 'invalid referrals were stored';
END $$;

-- u3's first upload happens on day 20: move its window into the past.
UPDATE public.user_referrals
   SET referral_first_visit_at = now() - interval '20 days', referral_expires_at = now() - interval '6 days'
 WHERE user_id = (SELECT v FROM t_ids WHERE k = 'user_u3');

-- ---------- 4. first upload (as the signed-in client) ----------
SET LOCAL ROLE authenticated;
INSERT INTO public.videos (user_id, storage_path, filename)
SELECT v, 'u1/first.mp4', 'first.mp4' FROM t_ids WHERE k = 'user_u1';
INSERT INTO public.videos (user_id, storage_path, filename)
SELECT v, 'u1/second.mp4', 'second.mp4' FROM t_ids WHERE k = 'user_u1';
INSERT INTO public.videos (user_id, storage_path, filename)
SELECT v, 'u3/late.mp4', 'late.mp4' FROM t_ids WHERE k = 'user_u3';
RESET ROLE;
-- u6 uploads a match clip instead of a kick video.
INSERT INTO public.match_analyses (user_id, video_path)
SELECT v, 'u6/match.mp4' FROM t_ids WHERE k = 'user_u6';

DO $$ BEGIN
  ASSERT (SELECT count(*) FROM public.creator_activations WHERE user_id = (SELECT v FROM t_ids WHERE k = 'user_u1')) = 1,
    'u1 must have exactly one activation after two uploads';
  ASSERT (SELECT status FROM public.creator_activations WHERE user_id = (SELECT v FROM t_ids WHERE k = 'user_u1')) = 'pending',
    'new activation is not pending';
  ASSERT (SELECT video_source FROM public.creator_activations WHERE user_id = (SELECT v FROM t_ids WHERE k = 'user_u1')) = 'videos';
  ASSERT (SELECT first_video_uploaded_at IS NOT NULL AND creator_activated_at IS NOT NULL
            FROM public.user_referrals WHERE user_id = (SELECT v FROM t_ids WHERE k = 'user_u1')), 'u1 referral row not updated';

  ASSERT NOT EXISTS (SELECT 1 FROM public.creator_activations WHERE user_id = (SELECT v FROM t_ids WHERE k = 'user_u3')),
    'upload after the 14-day window created an activation';
  ASSERT (SELECT first_video_uploaded_at IS NOT NULL FROM public.user_referrals
           WHERE user_id = (SELECT v FROM t_ids WHERE k = 'user_u3')), 'late upload not recorded';

  ASSERT (SELECT video_source FROM public.creator_activations WHERE user_id = (SELECT v FROM t_ids WHERE k = 'user_u6')) = 'match_analyses',
    'match upload did not create an activation';
  ASSERT NOT EXISTS (SELECT 1 FROM public.creator_activations WHERE user_id = (SELECT v FROM t_ids WHERE k = 'user_u5')),
    'existing user got an activation';
END $$;

-- ---------- 5-8. review, reward, payout ----------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT v FROM t_ids WHERE k = 'auth_admin'), 'role', 'authenticated')::text, true);
DO $$
DECLARE
  a_u1 uuid := (SELECT id FROM public.admin_list_activations('pending', NULL) WHERE user_id = (SELECT v FROM t_ids WHERE k = 'user_u1'));
  a_u6 uuid := (SELECT id FROM public.admin_list_activations('pending', NULL) WHERE user_id = (SELECT v FROM t_ids WHERE k = 'user_u6'));
  arman uuid := (SELECT v FROM t_ids WHERE k = 'arman');
  prev jsonb;
  res jsonb;
  c record;
BEGIN
  ASSERT a_u1 IS NOT NULL AND a_u6 IS NOT NULL, 'admin does not see pending activations';
  ASSERT (SELECT same_ip_users FROM public.admin_list_activations(NULL, NULL) WHERE id = a_u1) = 1,
    'same-IP hint missing (u1 and u3 registered from one IP)';

  BEGIN
    PERFORM public.admin_review_activation(a_u6, 'rejected', NULL, NULL);
    ASSERT false, 'reject without a reason accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;

  PERFORM public.admin_review_activation(a_u1, 'approved');
  PERFORM public.admin_review_activation(a_u6, 'rejected', 'fake_account', 'test');
  ASSERT (SELECT rejection_reason FROM public.admin_list_activations('rejected', NULL) WHERE id = a_u6) = 'fake_account';

  SELECT * INTO c FROM public.admin_list_creators() WHERE id = arman;
  ASSERT c.visits = 5 AND c.registrations = 3, format('stats: visits %s, registrations %s', c.visits, c.registrations);
  ASSERT c.approved = 1 AND c.rejected = 1 AND c.pending = 0, 'activation counters wrong';
  ASSERT c.uploaded_after_window = 1, 'late upload not counted in stats';
  ASSERT c.to_pay = 250, 'reward for the first approved activation is not 250';

  prev := public.admin_preview_payout(arman);
  ASSERT (prev->>'amount')::int = 250 AND jsonb_array_length(prev->'activations') = 1, 'preview wrong: ' || prev::text;

  BEGIN
    PERFORM public.admin_create_payout(arman, 999, NULL);
    ASSERT false, 'payout with a stale amount accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;

  res := public.admin_create_payout(arman, 250, 'smoke');
  ASSERT (res->>'amount')::int = 250, 'payout amount wrong';
  ASSERT (SELECT status FROM public.admin_list_activations(NULL, NULL) WHERE id = a_u1) = 'paid', 'activation not marked paid';
  ASSERT (SELECT reward_amount FROM public.admin_list_activations(NULL, NULL) WHERE id = a_u1) = 250;

  -- a paid activation can never be paid again or re-reviewed
  BEGIN
    PERFORM public.admin_create_payout(arman, 0, NULL);
    ASSERT false, 'second payout created';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  BEGIN
    PERFORM public.admin_review_activation(a_u1, 'rejected', 'fraud');
    ASSERT false, 'paid activation was re-reviewed';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;

  SELECT * INTO c FROM public.admin_list_creators() WHERE id = arman;
  ASSERT c.paid = 1 AND c.paid_amount = 250 AND c.to_pay = 0, 'stats after payout wrong';
  ASSERT (SELECT count(*) FROM public.admin_list_payouts(arman)) = 1, 'payout history wrong';

  -- the code can change; the old one keeps working as an alias
  PERFORM public.admin_change_creator_code(arman, 'arman_new');
  ASSERT (SELECT aliases FROM public.admin_list_creators() WHERE id = arman) = ARRAY['arman01'], 'old code not kept as alias';
END $$;
RESET ROLE;

SET LOCAL ROLE anon;
DO $$ BEGIN
  ASSERT (public.track_referral_visit('arman01', 'session-alias-aaaa')->>'ok')::boolean, 'alias stopped working';
  ASSERT (public.track_referral_visit('arman_new', 'session-alias-aaaa')->>'ok')::boolean, 'new code does not work';
END $$;
RESET ROLE;

-- ---------- tiers + cap: 50 approved activations for one creator ----------
WITH ins AS (
  INSERT INTO public.users (email, nickname)
  SELECT 'tier-' || g || '@example.test', 'tier_' || g FROM generate_series(1, 50) g
  RETURNING id
)
INSERT INTO public.creator_activations (creator_id, user_id, status, approved_at)
SELECT (SELECT v FROM t_ids WHERE k = 'big'), id, 'approved', now() - (row_number() OVER ()) * interval '1 minute'
  FROM ins;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT v FROM t_ids WHERE k = 'auth_admin'), 'role', 'authenticated')::text, true);
DO $$
DECLARE
  big uuid := (SELECT v FROM t_ids WHERE k = 'big');
  prev jsonb;
BEGIN
  prev := public.admin_preview_payout(big);
  -- 10*250 + 15*300 + 20*400 = 15000: activations 46-50 are over the default cap
  ASSERT (prev->>'amount')::int = 15000 AND (prev->>'fit_count')::int = 45 AND (prev->>'over_cap')::int = 5,
    'cap preview wrong: ' || (prev - 'activations')::text;
  PERFORM public.admin_create_payout(big, 15000, NULL);
  ASSERT (SELECT to_pay FROM public.admin_list_creators() WHERE id = big) = 0, 'cap exceeded';
  ASSERT (SELECT over_cap FROM public.admin_list_creators() WHERE id = big) = 5;

  -- the admin raises the cap: the 5 waiting activations are paid at 400 each (ordinals 46-50)
  PERFORM public.admin_set_creator_cap(big, 17000);
  prev := public.admin_preview_payout(big);
  ASSERT (prev->>'amount')::int = 2000 AND (prev->>'fit_count')::int = 5, 'after cap raise: ' || (prev - 'activations')::text;
  PERFORM public.admin_create_payout(big, 2000, NULL);

  ASSERT (SELECT sum(reward_amount) FROM public.admin_list_activations('paid', big)) = 17000, 'per-activation rewards do not add up';
  ASSERT (SELECT sum(amount) FROM public.admin_list_payouts(big)) = 17000, 'payout history does not add up';

  -- lowering the cap below what was paid never produces a negative amount
  PERFORM public.admin_set_creator_cap(big, 1000);
  ASSERT (SELECT to_pay FROM public.admin_list_creators() WHERE id = big) = 0;
END $$;
RESET ROLE;

SELECT 'creator referral smoke test: all checks passed' AS result;
ROLLBACK;
