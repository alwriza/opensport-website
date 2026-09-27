-- Add a real "growth" metric to global_rankings: difference between the
-- player's most recent analysis score and their earliest one. Previously
-- this column didn't exist at all, so the frontend always read 0/undefined
-- for every player, making the "Progress" tab sort into a no-op.
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
  MAX(a.created_at) AS last_analysis_at,
  COALESCE(
    (SELECT a2.overall FROM analyses a2 WHERE a2.user_id = u.id ORDER BY a2.created_at DESC LIMIT 1)
    - (SELECT a3.overall FROM analyses a3 WHERE a3.user_id = u.id ORDER BY a3.created_at ASC LIMIT 1),
    0
  ) AS growth
FROM users u
JOIN analyses a ON u.id = a.user_id
GROUP BY u.id, u.name, u.avatar_url, u.age, u.position, u.club, u.city, u.country;
