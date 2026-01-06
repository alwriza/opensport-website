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
