-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clerk_id text NOT NULL UNIQUE,
  email text NOT NULL,
  name text,
  role text DEFAULT 'player'::text,
  age integer,
  position text,
  club text,
  height double precision,
  weight double precision,
  city text,
  country text,
  avatar_url text,
  terms_accepted_at timestamp with time zone,
  privacy_accepted_at timestamp with time zone,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.videos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  storage_path text NOT NULL,
  filename text NOT NULL,
  duration double precision,
  file_size_mb double precision,
  status text DEFAULT 'processing'::text,
  uploaded_at timestamp without time zone DEFAULT now(),
  CONSTRAINT videos_pkey PRIMARY KEY (id),
  CONSTRAINT videos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  video_id uuid,
  stability double precision NOT NULL,
  power double precision NOT NULL,
  technique double precision NOT NULL,
  balance double precision NOT NULL,
  overall double precision NOT NULL,
  feedback text NOT NULL,
  tags jsonb,
  processing_time_ms integer,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT analyses_pkey PRIMARY KEY (id),
  CONSTRAINT analyses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT analyses_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id)
);
CREATE TABLE public.player_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  full_name text NOT NULL,
  email text NOT NULL,
  date_of_birth date NOT NULL,
  nationality text NOT NULL,
  position text NOT NULL,
  academy text NOT NULL,
  height numeric NOT NULL,
  weight numeric NOT NULL,
  video_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT player_registrations_pkey PRIMARY KEY (id),
  CONSTRAINT player_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.player_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid,
  overall_score numeric,
  speed_score numeric,
  dribbling_score numeric,
  passing_score numeric,
  shooting_score numeric,
  defending_score numeric,
  physicality_score numeric,
  training_tips ARRAY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT player_analysis_pkey PRIMARY KEY (id),
  CONSTRAINT player_analysis_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.player_registrations(id)
);
CREATE TABLE public.training_exercises (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid,
  exercise_type text NOT NULL,
  difficulty text NOT NULL,
  video_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT training_exercises_pkey PRIMARY KEY (id),
  CONSTRAINT training_exercises_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.player_registrations(id)
);
CREATE TABLE public.exercise_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exercise_id uuid,
  technique_score numeric,
  speed_score numeric,
  control_score numeric,
  overall_score numeric,
  feedback jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exercise_results_pkey PRIMARY KEY (id),
  CONSTRAINT exercise_results_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.training_exercises(id)
);
CREATE TABLE public.ai_recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid,
  recommendation_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ai_recommendations_pkey PRIMARY KEY (id),
  CONSTRAINT ai_recommendations_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.player_registrations(id)
);
CREATE TABLE public.weekly_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid,
  week_start date NOT NULL,
  week_end date NOT NULL,
  progress_summary text,
  strengths jsonb,
  areas_for_improvement jsonb,
  exercises_completed integer DEFAULT 0,
  average_score numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT weekly_reports_pkey PRIMARY KEY (id),
  CONSTRAINT weekly_reports_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.player_registrations(id)
);
CREATE TABLE public.clubs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  country text,
  city text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clubs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  club_id uuid,
  name text NOT NULL,
  age_group text,
  season text,
  invite_code text UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT teams_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id)
);
CREATE TABLE public.team_coaches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid,
  coach_id uuid,
  role text DEFAULT 'coach'::text,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_coaches_pkey PRIMARY KEY (id),
  CONSTRAINT team_coaches_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT team_coaches_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.users(id)
);
CREATE TABLE public.team_rosters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid,
  player_id uuid,
  status text DEFAULT 'pending'::text,
  jersey_number integer,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_rosters_pkey PRIMARY KEY (id),
  CONSTRAINT team_rosters_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT team_rosters_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.users(id)
);
CREATE TABLE public.coach_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  coach_id uuid,
  player_id uuid,
  note text,
  tags ARRAY,
  visibility text DEFAULT 'private'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coach_notes_pkey PRIMARY KEY (id),
  CONSTRAINT coach_notes_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.users(id),
  CONSTRAINT coach_notes_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.users(id)
);
CREATE TABLE public.training_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid,
  coach_id uuid,
  title text NOT NULL,
  description text,
  drills jsonb,
  status text DEFAULT 'active'::text,
  assigned_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT training_plans_pkey PRIMARY KEY (id),
  CONSTRAINT training_plans_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.users(id),
  CONSTRAINT training_plans_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.users(id)
);
CREATE TABLE public.team_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid,
  email text,
  phone text,
  invite_code text NOT NULL,
  status text DEFAULT 'pending'::text,
  expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT team_invitations_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.skills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  icon text,
  order_index integer NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT skills_pkey PRIMARY KEY (id)
);
CREATE TABLE public.skill_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL,
  level_name text NOT NULL CHECK (level_name = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text])),
  level_order integer NOT NULL CHECK (level_order = ANY (ARRAY[1, 2, 3])),
  youtube_url text NOT NULL,
  video_title text NOT NULL,
  duration_minutes integer,
  target_metrics ARRAY DEFAULT '{}'::text[],
  xp_reward integer DEFAULT 50,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT skill_levels_pkey PRIMARY KEY (id),
  CONSTRAINT skill_levels_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id)
);
CREATE TABLE public.player_skill_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  skill_id uuid NOT NULL,
  completed_levels ARRAY DEFAULT '{}'::text[],
  is_completed boolean DEFAULT false,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT player_skill_progress_pkey PRIMARY KEY (id),
  CONSTRAINT player_skill_progress_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.users(id),
  CONSTRAINT player_skill_progress_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id)
);
CREATE TABLE public.level_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  skill_level_id uuid NOT NULL,
  completed_at timestamp with time zone DEFAULT now(),
  xp_earned integer NOT NULL,
  CONSTRAINT level_completions_pkey PRIMARY KEY (id),
  CONSTRAINT level_completions_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.users(id),
  CONSTRAINT level_completions_skill_level_id_fkey FOREIGN KEY (skill_level_id) REFERENCES public.skill_levels(id)
);
CREATE TABLE public.player_progress (
  player_id uuid NOT NULL,
  total_xp integer DEFAULT 0,
  level integer DEFAULT 1,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT player_progress_pkey PRIMARY KEY (player_id),
  CONSTRAINT player_progress_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.users(id)
);