-- Users table (synced from Clerk)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'player',
  age INTEGER,
  position TEXT,
  club TEXT,
  height FLOAT,
  weight FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Videos table
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  duration FLOAT,
  file_size_mb FLOAT,
  status TEXT DEFAULT 'processing',
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Analyses table (ML results)
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  stability FLOAT NOT NULL,
  power FLOAT NOT NULL,
  technique FLOAT NOT NULL,
  balance FLOAT NOT NULL,
  overall FLOAT NOT NULL,
  feedback TEXT NOT NULL,
  tags JSONB,
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_video_id ON analyses(video_id);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Public profiles are viewable by everyone" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (true); -- In a real app, you'd check auth.uid() if using Supabase Auth

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (true); -- Simplified for MVP, ideally check clerk_id

-- Videos table policies
CREATE POLICY "Users see own videos" ON videos
  FOR SELECT USING (true); -- Simplified for now to avoid auth.uid() mismatch with Clerk

CREATE POLICY "Users insert own videos" ON videos
  FOR INSERT WITH CHECK (true);

-- Analyses table policies
CREATE POLICY "Users see own analyses" ON analyses
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert analyses" ON analyses
  FOR INSERT WITH CHECK (true);

-- Recommendations tables
CREATE TABLE player_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  position TEXT,
  date_of_birth DATE,
  height FLOAT,
  weight FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE player_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES player_registrations(id) ON DELETE CASCADE,
  speed_score INTEGER,
  dribbling_score INTEGER,
  passing_score INTEGER,
  shooting_score INTEGER,
  defending_score INTEGER,
  overall_score INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE training_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES player_registrations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE exercise_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID REFERENCES training_exercises(id) ON DELETE CASCADE,
  overall_score INTEGER,
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES player_registrations(id) ON DELETE CASCADE,
  recommendation_type TEXT,
  title TEXT,
  description TEXT,
  priority TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE player_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

sql-- ============================================================================
-- COACH DASHBOARD TABLES
-- ============================================================================

-- 1. Clubs table
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "U16 2026"
  age_group TEXT, -- "U16", "U18", etc.
  season TEXT, -- "2025-26"
  invite_code TEXT UNIQUE, -- для приглашений
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Team memberships (связь тренеров и команд)
CREATE TABLE IF NOT EXISTS team_coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'coach', -- 'head_coach', 'assistant', 'coach'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, coach_id)
);

-- 4. Team rosters (связь игроков и команд)
CREATE TABLE IF NOT EXISTS team_rosters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'declined'
  jersey_number INTEGER,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, player_id)
);

-- 5. Coach notes (приватные заметки тренера)
CREATE TABLE IF NOT EXISTS coach_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES users(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  note TEXT,
  tags TEXT[], -- ['top_prospect', 'needs_review', 'injury']
  visibility TEXT DEFAULT 'private', -- 'private' (only coach), 'club' (all club coaches)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Training plans
CREATE TABLE IF NOT EXISTS training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  drills JSONB, -- [{name, duration, sets, reps, video_url}]
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'archived'
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 7. Team invitations
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  invite_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for coach dashboard tables
CREATE INDEX IF NOT EXISTS idx_teams_club ON teams(club_id);
CREATE INDEX IF NOT EXISTS idx_team_coaches_team ON team_coaches(team_id);
CREATE INDEX IF NOT EXISTS idx_team_coaches_coach ON team_coaches(coach_id);
CREATE INDEX IF NOT EXISTS idx_team_rosters_team ON team_rosters(team_id);
CREATE INDEX IF NOT EXISTS idx_team_rosters_player ON team_rosters(player_id);
CREATE INDEX IF NOT EXISTS idx_coach_notes_coach ON coach_notes(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_notes_player ON coach_notes(player_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_player ON training_plans(player_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_code ON team_invitations(invite_code);

-- RLS Policies (временно отключены для разработки)
ALTER TABLE clubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_coaches DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_rosters DISABLE ROW LEVEL SECURITY;
ALTER TABLE coach_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations DISABLE ROW LEVEL SECURITY;

-- Функция для генерации invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- без похожих символов
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger для автоматической генерации invite_code
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER teams_invite_code_trigger
  BEFORE INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION set_invite_code();