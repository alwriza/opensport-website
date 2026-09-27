-- ============================================================
-- FIX: RLS policies compared coach_id/player_id (users.id) directly
-- to auth.uid() (auth.users.id / users.auth_user_id). These are
-- different UUID spaces, so every policy below silently returned
-- zero rows for real logged-in coaches even though the data existed.
-- This adds a SECURITY DEFINER helper that maps auth.uid() -> users.id,
-- and rewrites every affected policy to use it.
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE auth_user_id = auth.uid()
$$;

-- ==================== MATCHES ====================
DROP POLICY IF EXISTS "Coach can select matches for their team" ON public.matches;
CREATE POLICY "Coach can select matches for their team"
    ON public.matches FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.team_coaches WHERE team_coaches.team_id = matches.team_id AND team_coaches.coach_id = public.current_app_user_id())
        OR EXISTS (SELECT 1 FROM public.team_rosters WHERE team_rosters.team_id = matches.team_id AND team_rosters.player_id = public.current_app_user_id())
    );

DROP POLICY IF EXISTS "Coach can insert matches for their team" ON public.matches;
CREATE POLICY "Coach can insert matches for their team"
    ON public.matches FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.team_coaches WHERE team_coaches.team_id = matches.team_id AND team_coaches.coach_id = public.current_app_user_id()));

DROP POLICY IF EXISTS "Coach can update matches for their team" ON public.matches;
CREATE POLICY "Coach can update matches for their team"
    ON public.matches FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.team_coaches WHERE team_coaches.team_id = matches.team_id AND team_coaches.coach_id = public.current_app_user_id()));

DROP POLICY IF EXISTS "Coach can delete matches for their team" ON public.matches;
CREATE POLICY "Coach can delete matches for their team"
    ON public.matches FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.team_coaches WHERE team_coaches.team_id = matches.team_id AND team_coaches.coach_id = public.current_app_user_id()));

-- ==================== PLAYER MATCH STATS ====================
DROP POLICY IF EXISTS "Users can select player_match_stats for their matches" ON public.player_match_stats;
CREATE POLICY "Users can select player_match_stats for their matches"
    ON public.player_match_stats FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.matches JOIN public.team_coaches ON team_coaches.team_id = matches.team_id WHERE matches.id = player_match_stats.match_id AND team_coaches.coach_id = public.current_app_user_id())
        OR player_match_stats.player_id = public.current_app_user_id()
        OR EXISTS (SELECT 1 FROM public.matches JOIN public.team_rosters ON team_rosters.team_id = matches.team_id WHERE matches.id = player_match_stats.match_id AND team_rosters.player_id = public.current_app_user_id())
    );

DROP POLICY IF EXISTS "Coach can insert/update player_match_stats" ON public.player_match_stats;
CREATE POLICY "Coach can insert/update player_match_stats"
    ON public.player_match_stats FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.matches JOIN public.team_coaches ON team_coaches.team_id = matches.team_id WHERE matches.id = player_match_stats.match_id AND team_coaches.coach_id = public.current_app_user_id()));

DROP POLICY IF EXISTS "Coach can update player_match_stats" ON public.player_match_stats;
CREATE POLICY "Coach can update player_match_stats"
    ON public.player_match_stats FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.matches JOIN public.team_coaches ON team_coaches.team_id = matches.team_id WHERE matches.id = player_match_stats.match_id AND team_coaches.coach_id = public.current_app_user_id()));

-- ==================== PLAYER EVALUATIONS ====================
DROP POLICY IF EXISTS "Coach can select evaluations for their team" ON public.player_evaluations;
CREATE POLICY "Coach can select evaluations for their team"
    ON public.player_evaluations FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.team_coaches WHERE team_coaches.team_id = player_evaluations.team_id AND team_coaches.coach_id = public.current_app_user_id())
        OR player_evaluations.player_id = public.current_app_user_id()
    );

DROP POLICY IF EXISTS "Coach can insert evaluations" ON public.player_evaluations;
CREATE POLICY "Coach can insert evaluations"
    ON public.player_evaluations FOR INSERT
    WITH CHECK (public.current_app_user_id() = coach_id);

DROP POLICY IF EXISTS "Coach can update their evaluations" ON public.player_evaluations;
CREATE POLICY "Coach can update their evaluations"
    ON public.player_evaluations FOR UPDATE
    USING (public.current_app_user_id() = coach_id);

-- ==================== TRAINING SESSIONS ====================
DROP POLICY IF EXISTS "Coach/Player can select training sessions" ON public.training_sessions;
CREATE POLICY "Coach/Player can select training sessions"
    ON public.training_sessions FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.team_coaches WHERE team_coaches.team_id = training_sessions.team_id AND team_coaches.coach_id = public.current_app_user_id())
        OR EXISTS (SELECT 1 FROM public.team_rosters WHERE team_rosters.team_id = training_sessions.team_id AND team_rosters.player_id = public.current_app_user_id())
    );

DROP POLICY IF EXISTS "Coach can insert training sessions" ON public.training_sessions;
CREATE POLICY "Coach can insert training sessions"
    ON public.training_sessions FOR INSERT
    WITH CHECK (public.current_app_user_id() = coach_id);

DROP POLICY IF EXISTS "Coach can update training sessions" ON public.training_sessions;
CREATE POLICY "Coach can update training sessions"
    ON public.training_sessions FOR UPDATE
    USING (public.current_app_user_id() = coach_id);

-- ==================== TRAINING SESSION EXERCISES ====================
DROP POLICY IF EXISTS "Coach can insert session exercises" ON public.training_session_exercises;
CREATE POLICY "Coach can insert session exercises"
    ON public.training_session_exercises FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.training_sessions WHERE training_sessions.id = training_session_exercises.session_id AND training_sessions.coach_id = public.current_app_user_id()));

DROP POLICY IF EXISTS "Coach can update/delete session exercises" ON public.training_session_exercises;
CREATE POLICY "Coach can update/delete session exercises"
    ON public.training_session_exercises FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.training_sessions WHERE training_sessions.id = training_session_exercises.session_id AND training_sessions.coach_id = public.current_app_user_id()));

DROP POLICY IF EXISTS "Coach can delete session exercises" ON public.training_session_exercises;
CREATE POLICY "Coach can delete session exercises"
    ON public.training_session_exercises FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.training_sessions WHERE training_sessions.id = training_session_exercises.session_id AND training_sessions.coach_id = public.current_app_user_id()));

-- ==================== TRAINING SESSION PLAYERS ====================
DROP POLICY IF EXISTS "Coach/Player can select training_session_players" ON public.training_session_players;
CREATE POLICY "Coach/Player can select training_session_players"
    ON public.training_session_players FOR SELECT
    USING (
        player_id = public.current_app_user_id()
        OR EXISTS (SELECT 1 FROM public.training_sessions JOIN public.team_coaches ON team_coaches.team_id = training_sessions.team_id WHERE training_sessions.id = training_session_players.session_id AND team_coaches.coach_id = public.current_app_user_id())
    );

DROP POLICY IF EXISTS "Coach can insert training_session_players" ON public.training_session_players;
CREATE POLICY "Coach can insert training_session_players"
    ON public.training_session_players FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.training_sessions WHERE training_sessions.id = training_session_players.session_id AND training_sessions.coach_id = public.current_app_user_id()));

DROP POLICY IF EXISTS "Player can update their own completion" ON public.training_session_players;
CREATE POLICY "Player can update their own completion"
    ON public.training_session_players FOR UPDATE
    USING (player_id = public.current_app_user_id());

-- ==================== TRAINING PLANS ====================
DROP POLICY IF EXISTS "Coach can select training plans" ON public.training_plans;
CREATE POLICY "Coach can select training plans"
    ON public.training_plans FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.team_coaches WHERE team_coaches.team_id = training_plans.team_id AND team_coaches.coach_id = public.current_app_user_id())
        OR public.current_app_user_id() = ANY(training_plans.player_ids)
    );

DROP POLICY IF EXISTS "Coach can insert training plans" ON public.training_plans;
CREATE POLICY "Coach can insert training plans"
    ON public.training_plans FOR INSERT
    WITH CHECK (public.current_app_user_id() = coach_id);

DROP POLICY IF EXISTS "Coach can update training plans" ON public.training_plans;
CREATE POLICY "Coach can update training plans"
    ON public.training_plans FOR UPDATE
    USING (public.current_app_user_id() = coach_id);

-- ==================== TRAINING PLAN SESSIONS ====================
DROP POLICY IF EXISTS "Coach can insert/delete training_plan_sessions" ON public.training_plan_sessions;
CREATE POLICY "Coach can insert/delete training_plan_sessions"
    ON public.training_plan_sessions FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.training_plans WHERE training_plans.id = training_plan_sessions.plan_id AND training_plans.coach_id = public.current_app_user_id()));

DROP POLICY IF EXISTS "Coach can delete training_plan_sessions" ON public.training_plan_sessions;
CREATE POLICY "Coach can delete training_plan_sessions"
    ON public.training_plan_sessions FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.training_plans WHERE training_plans.id = training_plan_sessions.plan_id AND training_plans.coach_id = public.current_app_user_id()));

-- ==================== PLAYER FLAGS ====================
DROP POLICY IF EXISTS "Coach can select flags for their team" ON public.player_flags;
CREATE POLICY "Coach can select flags for their team"
    ON public.player_flags FOR SELECT
    USING (coach_id = public.current_app_user_id() OR player_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Coach can insert flags" ON public.player_flags;
CREATE POLICY "Coach can insert flags"
    ON public.player_flags FOR INSERT
    WITH CHECK (public.current_app_user_id() = coach_id);

DROP POLICY IF EXISTS "Coach can update/delete flags" ON public.player_flags;
CREATE POLICY "Coach can update/delete flags"
    ON public.player_flags FOR UPDATE
    USING (public.current_app_user_id() = coach_id);

DROP POLICY IF EXISTS "Coach can delete flags" ON public.player_flags;
CREATE POLICY "Coach can delete flags"
    ON public.player_flags FOR DELETE
    USING (public.current_app_user_id() = coach_id);
