-- OpenSport v2.0 Migration 003: Watchlist Table
-- Individual users (scouts/coaches) save interesting players

CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scout_id UUID REFERENCES users(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scout_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_scout ON watchlist(scout_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_player ON watchlist(player_id);

-- RLS: Scouts see only their own watchlist; players cannot see who saved them (only count)
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scouts can manage own watchlist"
  ON watchlist FOR ALL
  USING (scout_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

-- Players can see count of how many scouts saved them (no names)
CREATE POLICY "Players can count watchlist entries for themselves"
  ON watchlist FOR SELECT
  USING (player_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));
