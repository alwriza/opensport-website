-- OpenSport v2.0 Migration 007: Player Rankings View
-- Materialized view for Global Ranking leaderboard
-- Refreshed hourly via cron job

-- First ensure analyses table has camera_uploaded_by for distinguishing player vs coach uploads
ALTER TABLE analyses
  ADD COLUMN IF NOT EXISTS uploaded_by_role TEXT CHECK (uploaded_by_role IN ('player', 'coach')) DEFAULT 'player';

-- Create player_rankings as a materialized view
-- Only counts analyses uploaded BY PLAYERS (not coach uploads)
-- Minimum 3 analyses required to appear in ranking
CREATE MATERIALIZED VIEW IF NOT EXISTS player_rankings AS
WITH player_scores AS (
  SELECT
    a.user_id,
    -- Weight recent analyses more (exponential decay: analyses in last 7 days = 2x, 30 days = 1.5x, older = 1x)
    AVG(
      a.overall * CASE
        WHEN a.created_at > NOW() - INTERVAL '7 days' THEN 2.0
        WHEN a.created_at > NOW() - INTERVAL '30 days' THEN 1.5
        ELSE 1.0
      END
    ) / CASE
      WHEN AVG(CASE WHEN a.created_at > NOW() - INTERVAL '7 days' THEN 2.0 WHEN a.created_at > NOW() - INTERVAL '30 days' THEN 1.5 ELSE 1.0 END) = 0 THEN 1
      ELSE AVG(CASE WHEN a.created_at > NOW() - INTERVAL '7 days' THEN 2.0 WHEN a.created_at > NOW() - INTERVAL '30 days' THEN 1.5 ELSE 1.0 END)
    END AS weighted_score,
    COUNT(*) AS total_analyses,
    MAX(a.created_at) AS last_analysis_at
  FROM analyses a
  JOIN users u ON u.id = a.user_id
  WHERE
    u.user_track = 'player'
    AND (a.uploaded_by_role = 'player' OR a.uploaded_by_role IS NULL) -- Only player-uploaded analyses
  GROUP BY a.user_id
  HAVING COUNT(*) >= 3 -- Minimum 3 analyses to appear
)
SELECT
  ps.user_id,
  ROUND(ps.weighted_score::numeric, 2) AS overall_score,
  ps.total_analyses,
  RANK() OVER (ORDER BY ps.weighted_score DESC)::INTEGER AS rank_position,
  ROUND(
    (1.0 - (RANK() OVER (ORDER BY ps.weighted_score DESC) - 1.0) / NULLIF(COUNT(*) OVER (), 1)) * 100,
    1
  ) AS percentile,
  NOW() AS last_updated
FROM player_scores ps;

-- Index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_player_rankings_user ON player_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_player_rankings_rank ON player_rankings(rank_position);
CREATE INDEX IF NOT EXISTS idx_player_rankings_score ON player_rankings(overall_score DESC);

-- Function to refresh rankings (called by cron job)
CREATE OR REPLACE FUNCTION refresh_player_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY player_rankings;
END;
$$;
