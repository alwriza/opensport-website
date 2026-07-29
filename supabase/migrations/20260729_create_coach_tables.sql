-- ===================================================
-- Coach Dashboard - Full Schema Migration
-- Tables: matches, player_match_stats, player_evaluations,
-- training_sessions, training_session_exercises,
-- training_session_players, training_plans,
-- training_plan_sessions, exercises, player_flags,
-- metric_observations, team columns
-- ===================================================

-- ==================== 1. MATCHES ====================
create table if not exists public.matches (
    id uuid primary key default gen_random_uuid(),
    team_id uuid references public.teams(id) on delete cascade not null,
    date date not null,
    time time not null,
    opponent text not null,
    home_away text not null check (home_away in ('home','away')),
    competition text,
    match_type text default 'league' check (match_type in ('league','cup','friendly','tournament')),
    location text,
    score_home integer,
    score_away integer,
    video_url text,
    notes text,
    starting_xi uuid[] default '{}',
    substitutes uuid[] default '{}',
    status text default 'scheduled' check (status in ('scheduled','completed','cancelled')),
    created_by uuid references public.users(id),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_matches_team_id on public.matches(team_id);
create index if not exists idx_matches_date on public.matches(date desc);
create index if not exists idx_matches_status on public.matches(status);

-- RLS
alter table public.matches enable row level security;

create policy "Coach can select matches for their team"
    on public.matches for select
    using (
        exists (
            select 1 from public.team_coaches
            where team_coaches.team_id = matches.team_id
            and team_coaches.coach_id = auth.uid()
        )
        or
        exists (
            select 1 from public.team_rosters
            where team_rosters.team_id = matches.team_id
            and team_rosters.player_id = auth.uid()
        )
    );

create policy "Coach can insert matches for their team"
    on public.matches for insert
    with check (
        exists (
            select 1 from public.team_coaches
            where team_coaches.team_id = matches.team_id
            and team_coaches.coach_id = auth.uid()
        )
    );

create policy "Coach can update matches for their team"
    on public.matches for update
    using (exists (
        select 1 from public.team_coaches
        where team_coaches.team_id = matches.team_id
        and team_coaches.coach_id = auth.uid()
    ));

create policy "Coach can delete matches for their team"
    on public.matches for delete
    using (exists (
        select 1 from public.team_coaches
        where team_coaches.team_id = matches.team_id
        and team_coaches.coach_id = auth.uid()
    ));

-- ==================== 2. PLAYER MATCH STATS ====================
create table if not exists public.player_match_stats (
    id uuid primary key default gen_random_uuid(),
    match_id uuid references public.matches(id) on delete cascade not null,
    player_id uuid references public.users(id) on delete cascade not null,
    minutes integer default 0,
    goals integer default 0,
    assists integer default 0,
    yellow_cards integer default 0,
    red_cards integer default 0,
    coach_rating numeric(3,1) check (coach_rating >= 0 and coach_rating <= 10),
    source text default 'coach' check (source in ('manual','coach','opensport_ai','match','training','import')),
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(match_id, player_id)
);

create index if not exists idx_pms_match_id on public.player_match_stats(match_id);
create index if not exists idx_pms_player_id on public.player_match_stats(player_id);

alter table public.player_match_stats enable row level security;

create policy "Users can select player_match_stats for their matches"
    on public.player_match_stats for select
    using (
        exists (
            select 1 from public.matches
            join public.team_coaches on team_coaches.team_id = matches.team_id
            where matches.id = player_match_stats.match_id
            and team_coaches.coach_id = auth.uid()
        )
        or
        player_match_stats.player_id = auth.uid()
        or
        exists (
            select 1 from public.matches
            join public.team_rosters on team_rosters.team_id = matches.team_id
            where matches.id = player_match_stats.match_id
            and team_rosters.player_id = auth.uid()
        )
    );

create policy "Coach can insert/update player_match_stats"
    on public.player_match_stats for insert
    with check (exists (
        select 1 from public.matches
        join public.team_coaches on team_coaches.team_id = matches.team_id
        where matches.id = player_match_stats.match_id
        and team_coaches.coach_id = auth.uid()
    ));

create policy "Coach can update player_match_stats"
    on public.player_match_stats for update
    using (exists (
        select 1 from public.matches
        join public.team_coaches on team_coaches.team_id = matches.team_id
        where matches.id = player_match_stats.match_id
        and team_coaches.coach_id = auth.uid()
    ));

-- ==================== 3. PLAYER EVALUATIONS ====================
create table if not exists public.player_evaluations (
    id uuid primary key default gen_random_uuid(),
    player_id uuid references public.users(id) on delete cascade not null,
    coach_id uuid references public.users(id) on delete cascade not null,
    team_id uuid references public.teams(id) on delete cascade not null,
    date date not null default current_date,
    categories jsonb not null,
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_eval_player on public.player_evaluations(player_id);
create index if not exists idx_eval_team on public.player_evaluations(team_id);
create index if not exists idx_eval_coach on public.player_evaluations(coach_id);

alter table public.player_evaluations enable row level security;

create policy "Coach can select evaluations for their team"
    on public.player_evaluations for select
    using (
        exists (
            select 1 from public.team_coaches
            where team_coaches.team_id = player_evaluations.team_id
            and team_coaches.coach_id = auth.uid()
        )
        or
        player_evaluations.player_id = auth.uid()
    );

create policy "Coach can insert evaluations"
    on public.player_evaluations for insert
    with check (auth.uid() = coach_id);

create policy "Coach can update their evaluations"
    on public.player_evaluations for update
    using (auth.uid() = coach_id);

-- ==================== 4. TRAINING SESSIONS ====================
create table if not exists public.training_sessions (
    id uuid primary key default gen_random_uuid(),
    team_id uuid references public.teams(id) on delete cascade not null,
    coach_id uuid references public.users(id) on delete cascade not null,
    name text not null,
    date date not null,
    time time not null,
    duration_minutes integer not null,
    location text,
    objective text,
    status text default 'scheduled' check (status in ('scheduled','completed','cancelled')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_ts_team on public.training_sessions(team_id);
create index if not exists idx_ts_date on public.training_sessions(date desc);

alter table public.training_sessions enable row level security;

create policy "Coach/Player can select training sessions"
    on public.training_sessions for select
    using (
        exists (
            select 1 from public.team_coaches
            where team_coaches.team_id = training_sessions.team_id
            and team_coaches.coach_id = auth.uid()
        )
        or
        exists (
            select 1 from public.team_rosters
            where team_rosters.team_id = training_sessions.team_id
            and team_rosters.player_id = auth.uid()
        )
    );

create policy "Coach can insert training sessions"
    on public.training_sessions for insert
    with check (auth.uid() = coach_id);

create policy "Coach can update training sessions"
    on public.training_sessions for update
    using (auth.uid() = coach_id);

-- ==================== 5. TRAINING SESSION EXERCISES ====================
create table if not exists public.training_session_exercises (
    id uuid primary key default gen_random_uuid(),
    session_id uuid references public.training_sessions(id) on delete cascade not null,
    name text not null,
    category text,
    duration_minutes integer not null,
    notes text,
    "order" integer not null,
    created_at timestamptz default now()
);

create index if not exists idx_tse_session on public.training_session_exercises(session_id);

alter table public.training_session_exercises enable row level security;

create policy "Users can select session exercises"
    on public.training_session_exercises for select
    using (true);

create policy "Coach can insert session exercises"
    on public.training_session_exercises for insert
    with check (
        exists (
            select 1 from public.training_sessions
            where training_sessions.id = training_session_exercises.session_id
            and training_sessions.coach_id = auth.uid()
        )
    );

create policy "Coach can update/delete session exercises"
    on public.training_session_exercises for update
    using (exists (
        select 1 from public.training_sessions
        where training_sessions.id = training_session_exercises.session_id
        and training_sessions.coach_id = auth.uid()
    ));

create policy "Coach can delete session exercises"
    on public.training_session_exercises for delete
    using (exists (
        select 1 from public.training_sessions
        where training_sessions.id = training_session_exercises.session_id
        and training_sessions.coach_id = auth.uid()
    ));

-- ==================== 6. TRAINING SESSION PLAYERS ====================
create table if not exists public.training_session_players (
    id uuid primary key default gen_random_uuid(),
    session_id uuid references public.training_sessions(id) on delete cascade not null,
    player_id uuid references public.users(id) on delete cascade not null,
    status text default 'assigned' check (status in ('assigned','completed','missed')),
    exercises_completed integer default 0,
    duration_minutes integer,
    xp_earned integer default 0,
    unique(session_id, player_id)
);

create index if not exists idx_tsp_session on public.training_session_players(session_id);
create index if not exists idx_tsp_player on public.training_session_players(player_id);

alter table public.training_session_players enable row level security;

create policy "Coach/Player can select training_session_players"
    on public.training_session_players for select
    using (
        player_id = auth.uid()
        or
        exists (
            select 1 from public.training_sessions
            join public.team_coaches on team_coaches.team_id = training_sessions.team_id
            where training_sessions.id = training_session_players.session_id
            and team_coaches.coach_id = auth.uid()
        )
    );

create policy "Coach can insert training_session_players"
    on public.training_session_players for insert
    with check (
        exists (
            select 1 from public.training_sessions
            where training_sessions.id = training_session_players.session_id
            and training_sessions.coach_id = auth.uid()
        )
    );

create policy "Player can update their own completion"
    on public.training_session_players for update
    using (player_id = auth.uid());

-- ==================== 7. TRAINING PLANS ====================
create table if not exists public.training_plans (
    id uuid primary key default gen_random_uuid(),
    team_id uuid references public.teams(id) on delete cascade not null,
    coach_id uuid references public.users(id) on delete cascade not null,
    name text not null,
    assigned_to text default 'team' check (assigned_to in ('individual','selected','team')),
    player_ids uuid[] default '{}',
    start_date date not null,
    end_date date not null,
    status text default 'active' check (status in ('active','completed')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_tp_team on public.training_plans(team_id);

alter table public.training_plans enable row level security;

create policy "Coach can select training plans"
    on public.training_plans for select
    using (
        exists (
            select 1 from public.team_coaches
            where team_coaches.team_id = training_plans.team_id
            and team_coaches.coach_id = auth.uid()
        )
        or
        auth.uid() = any(training_plans.player_ids)
    );

create policy "Coach can insert training plans"
    on public.training_plans for insert
    with check (auth.uid() = coach_id);

create policy "Coach can update training plans"
    on public.training_plans for update
    using (auth.uid() = coach_id);

-- ==================== 8. TRAINING PLAN SESSIONS ====================
create table if not exists public.training_plan_sessions (
    id uuid primary key default gen_random_uuid(),
    plan_id uuid references public.training_plans(id) on delete cascade not null,
    session_id uuid references public.training_sessions(id) on delete cascade not null,
    "order" integer,
    unique(plan_id, session_id)
);

alter table public.training_plan_sessions enable row level security;

create policy "Users can select training_plan_sessions"
    on public.training_plan_sessions for select
    using (true);

create policy "Coach can insert/delete training_plan_sessions"
    on public.training_plan_sessions for insert
    with check (
        exists (
            select 1 from public.training_plans
            where training_plans.id = training_plan_sessions.plan_id
            and training_plans.coach_id = auth.uid()
        )
    );

create policy "Coach can delete training_plan_sessions"
    on public.training_plan_sessions for delete
    using (
        exists (
            select 1 from public.training_plans
            where training_plans.id = training_plan_sessions.plan_id
            and training_plans.coach_id = auth.uid()
        )
    );

-- ==================== 9. EXERCISES (Library) ====================
create table if not exists public.exercises (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    category text not null,
    skill text,
    difficulty text default 'beginner' check (difficulty in ('beginner','intermediate','advanced')),
    duration_minutes integer,
    min_players integer default 1,
    equipment text[] default '{}',
    description text,
    created_at timestamptz default now()
);

create index if not exists idx_ex_cat on public.exercises(category);

alter table public.exercises enable row level security;

create policy "Anyone can read exercises"
    on public.exercises for select
    using (true);

create policy "Authenticated users can insert exercises"
    on public.exercises for insert
    with check (auth.role() = 'authenticated');

-- Seed exercises
insert into public.exercises (name, category, skill, difficulty, duration_minutes, min_players, equipment, description)
values
    ('Passing Rondo', 'passing', 'short_passing', 'intermediate', 15, 4, array['cones','balls'], '4v2 possession game in a circle'),
    ('Defensive Shape', 'defensive', 'positioning', 'advanced', 30, 8, array['cones','pinnies'], 'Team defensive organization drill'),
    ('Shooting Drills', 'shooting', 'shooting', 'intermediate', 25, 2, array['balls','goals','cones'], 'Finishing from various positions'),
    ('Dribbling Circuit', 'dribbling', 'dribbling', 'beginner', 20, 1, array['cones','balls'], 'Slalom dribbling through cones'),
    ('Small-Sided Game', 'tactical', 'game_awareness', 'advanced', 30, 10, array['pinnies','goals','balls'], '5v5 or 7v7 scrimmage'),
    ('Pressing Drill', 'physical', 'stamina', 'advanced', 20, 6, array['cones','pinnies'], 'High-intensity pressing patterns'),
    ('First Touch', 'technical', 'ball_control', 'beginner', 20, 1, array['balls','wall'], 'First touch control from various heights'),
    ('Ball Control', 'technical', 'ball_control', 'intermediate', 20, 1, array['balls','cones'], 'Close ball control through obstacles'),
    ('Crossing & Finishing', 'shooting', 'crossing', 'intermediate', 25, 4, array['balls','goals','cones'], 'Wide crosses with near-post and far-post runs'),
    ('Interval Sprints', 'physical', 'speed', 'advanced', 15, 1, array['cones','stopwatch'], 'High-intensity interval running')
on conflict do nothing;

-- ==================== 10. PLAYER FLAGS ====================
create table if not exists public.player_flags (
    id uuid primary key default gen_random_uuid(),
    player_id uuid references public.users(id) on delete cascade not null,
    coach_id uuid references public.users(id) on delete cascade not null,
    type text not null check (type in ('watch','needs_improvement','injured','high_potential','rest')),
    note text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(player_id, coach_id, type)
);

create index if not exists idx_pf_player on public.player_flags(player_id);
create index if not exists idx_pf_coach on public.player_flags(coach_id);

alter table public.player_flags enable row level security;

create policy "Coach can select flags for their team"
    on public.player_flags for select
    using (
        coach_id = auth.uid()
        or
        player_id = auth.uid()
    );

create policy "Coach can insert flags"
    on public.player_flags for insert
    with check (auth.uid() = coach_id);

create policy "Coach can update/delete flags"
    on public.player_flags for update
    using (auth.uid() = coach_id);

create policy "Coach can delete flags"
    on public.player_flags for delete
    using (auth.uid() = coach_id);

-- ==================== 11. METRIC OBSERVATIONS ====================
create table if not exists public.metric_observations (
    id uuid primary key default gen_random_uuid(),
    player_id uuid references public.users(id) on delete cascade not null,
    metric text not null,
    value numeric not null,
    source text not null check (source in ('coach_manual','opensport_ai','match','training','import')),
    context text,
    recorded_at timestamptz default now(),
    created_by uuid references public.users(id)
);

create index if not exists idx_mo_player on public.metric_observations(player_id);
create index if not exists idx_mo_metric on public.metric_observations(metric);
create index if not exists idx_mo_source on public.metric_observations(source);

alter table public.metric_observations enable row level security;

create policy "Users can select metric_observations"
    on public.metric_observations for select
    using (true);

create policy "Authenticated users can insert metric_observations"
    on public.metric_observations for insert
    with check (auth.role() = 'authenticated');

-- ==================== 12. TEAM ADDITIONS ====================
alter table public.teams add column if not exists logo_url text;
alter table public.teams add column if not exists city text;
alter table public.teams add column if not exists country text;

-- ==================== TRIGGER: updated_at ====================
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger set_updated_at_matches before update on public.matches for each row execute function public.update_updated_at_column();
create trigger set_updated_at_player_match_stats before update on public.player_match_stats for each row execute function public.update_updated_at_column();
create trigger set_updated_at_player_evaluations before update on public.player_evaluations for each row execute function public.update_updated_at_column();
create trigger set_updated_at_training_sessions before update on public.training_sessions for each row execute function public.update_updated_at_column();
create trigger set_updated_at_training_plans before update on public.training_plans for each row execute function public.update_updated_at_column();
create trigger set_updated_at_player_flags before update on public.player_flags for each row execute function public.update_updated_at_column();