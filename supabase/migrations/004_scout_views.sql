-- OpenSport v2.0 Migration 004: Scout Views Table
-- Track when scouts view player profiles (for "X scouts viewed you" feature)

CREATE TABLE IF NOT EXISTS scout_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scout_id UUID REFERENCES users(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scout_views_player ON scout_views(player_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_scout_views_scout ON scout_views(scout_id);

-- RLS: Players can count their views; scouts can insert views
ALTER TABLE scout_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scouts can record views"
  ON scout_views FOR INSERT
  WITH CHECK (scout_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

CREATE POLICY "Players can see own view stats"
  ON scout_views FOR SELECT
  USING (player_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));
