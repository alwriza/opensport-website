-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create Global Ranking View
CREATE OR REPLACE VIEW global_rankings AS
SELECT 
  u.id AS user_id,
  u.name,
  u.avatar_url,
  u.age,
  u.position,
  u.club,
  u.city,
  u.country,
  MAX(a.overall) AS best_score,
  AVG(a.overall) AS avg_score,
  COUNT(a.id) AS total_analyses,
  MAX(a.created_at) AS last_analysis_at
FROM users u
JOIN analyses a ON u.id = a.user_id
GROUP BY u.id, u.name, u.avatar_url, u.age, u.position, u.club, u.city, u.country;
