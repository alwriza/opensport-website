-- ============================================================
-- Teams: invite codes, coach self-assignment, joining without a code.
--
-- Before this migration any client could:
--  * read every team's invite_code (teams was readable by anyone);
--  * add themselves as coach of ANY team (team_coaches insert only checked
--    coach_id = self), which then opened that team's rosters, analyses,
--    metrics and videos through the coach policies;
--  * add themselves to ANY team's roster as 'active' without a code (the
--    code was only checked in the browser);
--  * read every team invitation, including invitees' emails and phones.
--
-- Now creating a team, joining with a code and reading your teams' codes go
-- through SECURITY DEFINER functions that do the checks server-side.
-- Safe to re-run.
-- ============================================================

-- ==================== teams: hide invite_code ====================
REVOKE SELECT ON public.teams FROM anon, authenticated;
GRANT SELECT (id, club_id, name, age_group, season, created_at, updated_at, logo_url, city, country)
  ON public.teams TO anon, authenticated;

-- Creation goes through create_team(); coaches may still edit their team.
DROP POLICY IF EXISTS teams_insert ON public.teams;
REVOKE INSERT, TRUNCATE ON public.teams FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.teams FROM anon;
-- Coaches keep editing their team (teams_update policy), except the code.
REVOKE UPDATE ON public.teams FROM authenticated;
GRANT UPDATE (name, age_group, season, logo_url, city, country, club_id, updated_at) ON public.teams TO authenticated;

DROP POLICY IF EXISTS clubs_insert ON public.clubs;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.clubs FROM anon, authenticated;

-- ==================== team_coaches: no self-assignment ====================
DROP POLICY IF EXISTS team_coaches_insert ON public.team_coaches;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.team_coaches FROM anon, authenticated;

-- ==================== team_rosters: join only with a valid code ====================
DROP POLICY IF EXISTS team_rosters_insert ON public.team_rosters;
REVOKE INSERT, TRUNCATE ON public.team_rosters FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.team_rosters FROM anon;

-- "Leave team" deletes the player's own roster row; there was no policy, so it
-- silently did nothing.
DROP POLICY IF EXISTS "Player can leave a team" ON public.team_rosters;
CREATE POLICY "Player can leave a team"
ON public.team_rosters FOR DELETE
TO authenticated
USING (player_id = public.current_app_user_id());

-- ==================== team_invitations: coaches of the team only ====================
DROP POLICY IF EXISTS team_invitations_select ON public.team_invitations;
CREATE POLICY team_invitations_select
ON public.team_invitations FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.team_coaches tc
  WHERE tc.team_id = team_invitations.team_id AND tc.coach_id = public.current_app_user_id()
));
REVOKE ALL ON public.team_invitations FROM anon;


-- ==================== functions ====================

-- Create a team (and its club, if new) with the caller as head coach.
CREATE OR REPLACE FUNCTION public.create_team(
  p_team_name text,
  p_age_group text,
  p_season    text,
  p_club_name text
)
RETURNS TABLE (id uuid, invite_code text)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user uuid := public.current_app_user_id();
  v_club uuid;
  v_team public.teams%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_signed_in' USING ERRCODE = '42501';
  END IF;
  IF coalesce(btrim(p_team_name), '') = '' OR coalesce(btrim(p_club_name), '') = '' THEN
    RAISE EXCEPTION 'name_required' USING ERRCODE = '22023';
  END IF;

  SELECT c.id INTO v_club FROM public.clubs c WHERE c.name = btrim(p_club_name) LIMIT 1;
  IF v_club IS NULL THEN
    INSERT INTO public.clubs (name) VALUES (btrim(p_club_name)) RETURNING clubs.id INTO v_club;
  END IF;

  INSERT INTO public.teams (club_id, name, age_group, season)
  VALUES (v_club, btrim(p_team_name), p_age_group, p_season)
  RETURNING * INTO v_team;

  INSERT INTO public.team_coaches (team_id, coach_id, role) VALUES (v_team.id, v_user, 'head_coach');

  id := v_team.id;
  invite_code := v_team.invite_code;
  RETURN NEXT;
END;
$$;

-- Invite codes of the teams the caller coaches.
CREATE OR REPLACE FUNCTION public.get_my_team_invite_codes()
RETURNS TABLE (team_id uuid, invite_code text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT t.id, t.invite_code
  FROM public.teams t
  JOIN public.team_coaches tc ON tc.team_id = t.id
  WHERE tc.coach_id = public.current_app_user_id()
$$;

-- The team behind a code, for the join screen.
CREATE OR REPLACE FUNCTION public.find_team_by_invite_code(p_code text)
RETURNS TABLE (id uuid, name text, age_group text, club_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT t.id, t.name, t.age_group, c.name
  FROM public.teams t
  LEFT JOIN public.clubs c ON c.id = t.club_id
  WHERE t.invite_code = upper(btrim(p_code))
  LIMIT 1
$$;

-- Join with a code. A valid code approves the player straight away (as before).
CREATE OR REPLACE FUNCTION public.join_team_by_invite_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user   uuid := public.current_app_user_id();
  v_team   public.teams%ROWTYPE;
  v_status text;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_signed_in');
  END IF;

  SELECT * INTO v_team FROM public.teams WHERE invite_code = upper(btrim(p_code));
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_code');
  END IF;

  IF EXISTS (SELECT 1 FROM public.team_coaches WHERE team_id = v_team.id AND coach_id = v_user) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'coach_of_team');
  END IF;

  SELECT status INTO v_status FROM public.team_rosters WHERE team_id = v_team.id AND player_id = v_user;
  IF FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_' || coalesce(v_status, 'member'), 'team_name', v_team.name);
  END IF;

  INSERT INTO public.team_rosters (team_id, player_id, status) VALUES (v_team.id, v_user, 'active');
  RETURN jsonb_build_object('ok', true, 'team_id', v_team.id, 'team_name', v_team.name);
END;
$$;

REVOKE EXECUTE ON FUNCTION
  public.create_team(text, text, text, text),
  public.get_my_team_invite_codes(),
  public.find_team_by_invite_code(text),
  public.join_team_by_invite_code(text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.create_team(text, text, text, text),
  public.get_my_team_invite_codes(),
  public.find_team_by_invite_code(text),
  public.join_team_by_invite_code(text)
TO authenticated;
