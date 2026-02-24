-- OpenSport v2.0 Migration 005: Player Notes Table
-- Private notes coaches write about players

CREATE TABLE IF NOT EXISTS player_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES users(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_notes_coach ON player_notes(coach_id);
CREATE INDEX IF NOT EXISTS idx_player_notes_player ON player_notes(player_id);

-- RLS: Notes are private to the coach who wrote them
ALTER TABLE player_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own notes"
  ON player_notes FOR ALL
  USING (coach_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));
