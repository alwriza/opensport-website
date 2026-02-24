-- OpenSport v2.0 Migration 006: Talent Alerts Table
-- PRO scouts get notified when matching players appear

CREATE TABLE IF NOT EXISTS talent_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  filters JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_triggered TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talent_alerts_user ON talent_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_talent_alerts_active ON talent_alerts(is_active) WHERE is_active = true;

-- RLS: Scouts only see their own alerts
ALTER TABLE talent_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alerts"
  ON talent_alerts FOR ALL
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));
