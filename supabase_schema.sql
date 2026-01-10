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


-- ==========================================
-- TRAINING SYSTEM TABLES
-- ==========================================

-- 1. Skills (10 nodes в Skill Tree)
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  order_index INT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Skill Levels (30 levels: 10 skills × 3 levels each)
CREATE TABLE skill_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level_name TEXT NOT NULL CHECK (level_name IN ('beginner', 'intermediate', 'advanced')),
  level_order INT NOT NULL CHECK (level_order IN (1, 2, 3)),
  youtube_url TEXT NOT NULL,
  video_title TEXT NOT NULL,
  duration_minutes INT,
  target_metrics TEXT[] DEFAULT '{}',
  xp_reward INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(skill_id, level_order)
);

-- 3. Player Skill Progress (tracking прогресса по skills)
CREATE TABLE player_skill_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  completed_levels TEXT[] DEFAULT '{}',
  is_completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(player_id, skill_id)
);

-- 4. Level Completions (история завершенных уровней)
CREATE TABLE level_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_level_id UUID NOT NULL REFERENCES skill_levels(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  xp_earned INT NOT NULL
);

-- 5. Player Progress (XP, Level, Streak)
CREATE TABLE player_progress (
  player_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_xp INT DEFAULT 0,
  level INT DEFAULT 1,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEXES для производительности
-- ==========================================

CREATE INDEX idx_skill_levels_skill_id ON skill_levels(skill_id);
CREATE INDEX idx_player_skill_progress_player_id ON player_skill_progress(player_id);
CREATE INDEX idx_level_completions_player_id ON level_completions(player_id);
CREATE INDEX idx_skills_order_index ON skills(order_index);

-- ==========================================
-- TRIGGER для auto-update updated_at
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_player_progress_updated_at
  BEFORE UPDATE ON player_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- SEED: 10 SKILLS
-- ==========================================

INSERT INTO skills (name, category, description, icon, order_index) VALUES
  ('Passing Accuracy', 'passing', 'Master short and long passing techniques', '🎯', 1),
  ('First Touch', 'technical', 'Improve ball control and first touch', '⚡', 2),
  ('Ball Control Basics', 'technical', 'Develop fundamental ball control skills', '🦶', 3),
  ('Speed Dribbling', 'dribbling', 'Enhance dribbling speed and agility', '💨', 4),
  ('Shooting Precision', 'shooting', 'Improve shooting accuracy and power', '⚽', 5),
  ('Defensive Positioning', 'defensive', 'Learn proper defensive stance and positioning', '🛡️', 6),
  ('Speed & Acceleration', 'physical', 'Build explosive speed and acceleration', '🏃', 7),
  ('Balance & Core', 'physical', 'Strengthen balance and core stability', '⚖️', 8),
  ('1v1 Attacking', 'attacking', 'Master one-on-one attacking moves', '⚔️', 9),
  ('Game Awareness', 'mental', 'Develop tactical awareness and decision making', '🧠', 10);

-- ==========================================
-- SEED: 30 SKILL LEVELS (10 skills × 3 levels)
-- ==========================================

-- 1) Passing Accuracy
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics) VALUES
  ((SELECT id FROM skills WHERE name = 'Passing Accuracy'), 'beginner', 1, 'https://www.youtube.com/watch?v=F8LCioV8z_s', '5 Soccer Passing Drills | adidas', 12, '{"technique"}'),
  ((SELECT id FROM skills WHERE name = 'Passing Accuracy'), 'intermediate', 2, 'https://www.youtube.com/watch?v=-V88Iy1X-is', 'New Passing Drills to Improve Speed & Accuracy', 15, '{"technique"}'),
  ((SELECT id FROM skills WHERE name = 'Passing Accuracy'), 'advanced', 3, 'https://www.youtube.com/watch?v=0kGgL_aglEE', 'Passing & 1st Touch Drill (ADVANCED)', 10, '{"technique"}');

-- 2) First Touch
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics) VALUES
  ((SELECT id FROM skills WHERE name = 'First Touch'), 'beginner', 1, 'https://www.youtube.com/watch?v=ud84rp3Vphs', '10 Exercises To Master Your First Touch', 14, '{"technique"}'),
  ((SELECT id FROM skills WHERE name = 'First Touch'), 'intermediate', 2, 'https://www.youtube.com/watch?v=el7QvVnprOk', 'Perfect Your First Touch | 5 First Touch Exercises', 12, '{"technique"}'),
  ((SELECT id FROM skills WHERE name = 'First Touch'), 'advanced', 3, 'https://www.youtube.com/watch?v=8xfWkNLdVYE', 'How I Coach First Touch Under Pressure', 16, '{"technique", "balance"}');

-- 3) Ball Control Basics
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics) VALUES
  ((SELECT id FROM skills WHERE name = 'Ball Control Basics'), 'beginner', 1, 'https://www.youtube.com/watch?v=e5RxAJM-oxc', '10 EASY Ball Mastery Exercises For Beginners', 10, '{"technique"}'),
  ((SELECT id FROM skills WHERE name = 'Ball Control Basics'), 'intermediate', 2, 'https://www.youtube.com/watch?v=Fj3Jsn0Pa7c', '10 Close Control Dribbling Exercises', 15, '{"technique", "balance"}'),
  ((SELECT id FROM skills WHERE name = 'Ball Control Basics'), 'advanced', 3, 'https://www.youtube.com/watch?v=ezi5VhbOgsQ', 'Tight Space Control Training Drills', 12, '{"technique", "balance"}');

-- 4) Speed Dribbling
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics) VALUES
  ((SELECT id FROM skills WHERE name = 'Speed Dribbling'), 'beginner', 1, 'https://www.youtube.com/watch?v=QqjaavLXdHs', '5 Close Control Dribbling Drills', 10, '{"technique"}'),
  ((SELECT id FROM skills WHERE name = 'Speed Dribbling'), 'intermediate', 2, 'https://www.youtube.com/watch?v=NMfLJynwyTk', '32 Close Control Dribbling Cone Drills', 18, '{"technique", "power"}'),
  ((SELECT id FROM skills WHERE name = 'Speed Dribbling'), 'advanced', 3, 'https://www.youtube.com/watch?v=i3jSMolxtsE', 'How To Train Solo Like a Pro | Dribbling & Ball Mastery', 20, '{"technique", "power"}');

-- 5) Shooting Precision
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics) VALUES
  ((SELECT id FROM skills WHERE name = 'Shooting Precision'), 'beginner', 1, 'https://www.youtube.com/watch?v=ARGE2_MjaNY', 'Passing - Technique - Shooting - Soccer Drills', 12, '{"technique", "power"}'),
  ((SELECT id FROM skills WHERE name = 'Shooting Precision'), 'intermediate', 2, 'https://www.youtube.com/watch?v=BdCBar17CTU', 'Striker Masterclass | 5 Drills To Improve Finishing', 16, '{"technique", "power"}'),
  ((SELECT id FROM skills WHERE name = 'Shooting Precision'), 'advanced', 3, 'https://www.youtube.com/watch?v=BdCBar17CTU', 'Advanced Striker Training', 16, '{"technique", "power"}');

-- 6) Defensive Positioning
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics) VALUES
  ((SELECT id FROM skills WHERE name = 'Defensive Positioning'), 'beginner', 1, 'https://www.youtube.com/watch?v=FS1LrWzSSmQ', 'LOADS OF SOCCER DRILLS FOR BEGINNERS', 15, '{"balance", "technique"}'),
  ((SELECT id FROM skills WHERE name = 'Defensive Positioning'), 'intermediate', 2, 'https://www.youtube.com/watch?v=0F_sLDwOMNc', '25 Partner Passing Drills | PRO LEVEL', 18, '{"balance", "technique"}'),
  ((SELECT id FROM skills WHERE name = 'Defensive Positioning'), 'advanced', 3, 'https://www.youtube.com/watch?v=h3o-MKSehJA', 'Full Partner Training Session', 20, '{"balance", "technique"}');

-- 7) Speed & Acceleration
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics) VALUES
  ((SELECT id FROM skills WHERE name = 'Speed & Acceleration'), 'beginner', 1, 'https://www.youtube.com/watch?v=rSlJU8cO9js', 'Fast Feet & Agility Training', 12, '{"power"}'),
  ((SELECT id FROM skills WHERE name = 'Speed & Acceleration'), 'intermediate', 2, 'https://www.youtube.com/watch?v=nckkvbxgnUM', 'Quick 15 Minute Soccer Training | Ball Control', 15, '{"power"}'),
  ((SELECT id FROM skills WHERE name = 'Speed & Acceleration'), 'advanced', 3, 'https://www.youtube.com/watch?v=5IR4Ecfssyw', 'Advanced Speed Training', 14, '{"power"}');

-- 8) Balance & Core
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics) VALUES
  ((SELECT id FROM skills WHERE name = 'Balance & Core'), 'beginner', 1, 'https://www.youtube.com/watch?v=i3jSMolxtsE', 'How To Train Solo Like a Pro', 20, '{"stability", "balance"}'),
  ((SELECT id FROM skills WHERE name = 'Balance & Core'), 'intermediate', 2, 'https://www.youtube.com/watch?v=NMfLJynwyTk', '10 Close Control Dribbling Cone Drills', 18, '{"stability", "balance"}'),
  ((SELECT id FROM skills WHERE name = 'Balance & Core'), 'advanced', 3, 'https://www.youtube.com/watch?v=ezi5VhbOgsQ', 'Tight Space Control Training Drills', 12, '{"stability", "balance"}');

-- 9) 1v1 Attacking
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics) VALUES
  ((SELECT id FROM skills WHERE name = '1v1 Attacking'), 'beginner', 1, 'https://www.youtube.com/watch?v=QqjaavLXdHs', '5 Close Control Dribbling Drills', 10, '{"technique"}'),
  ((SELECT id FROM skills WHERE name = '1v1 Attacking'), 'intermediate', 2, 'https://www.youtube.com/watch?v=NMfLJynwyTk', '32 Close Control Dribbling Cone Drills', 18, '{"technique", "power"}'),
  ((SELECT id FROM skills WHERE name = '1v1 Attacking'), 'advanced', 3, 'https://www.youtube.com/watch?v=i3jSMolxtsE', 'How To Train Solo Like a Pro', 20, '{"technique", "power"}');

-- 10) Game Awareness
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics) VALUES
  ((SELECT id FROM skills WHERE name = 'Game Awareness'), 'beginner', 1, 'https://www.youtube.com/watch?v=FS1LrWzSSmQ', 'LOADS OF SOCCER DRILLS FOR BEGINNERS', 15, '{"technique"}'),
  ((SELECT id FROM skills WHERE name = 'Game Awareness'), 'intermediate', 2, 'https://www.youtube.com/watch?v=-F6OecCUHLA', 'Passing & 1st Touch Combinations', 12, '{"technique"}'),
  ((SELECT id FROM skills WHERE name = 'Game Awareness'), 'advanced', 3, 'https://www.youtube.com/watch?v=moLy3vQ1q_E', '4v2 Rondo | Possession Exercise', 14, '{"technique", "balance"}');


-- Add compliance tracking fields
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_terms_accepted 
  ON users(terms_accepted_at) 
  WHERE terms_accepted_at IS NULL;