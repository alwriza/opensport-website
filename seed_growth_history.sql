-- ============================================================
-- SEED GROWTH HISTORY — добавляет ВТОРОЙ (более ранний) анализ
-- каждому mock-игроку, чтобы поле growth (рост) в global_rankings
-- было реально ненулевым и разным у разных игроков, а не 0 у всех.
-- Выполнять ПОСЛЕ миграции 20260801_add_growth_to_global_rankings.sql.
-- ============================================================

WITH mock_users AS (
    SELECT id, row_number() OVER (ORDER BY created_at) AS rn
    FROM users WHERE clerk_id LIKE 'clerk_mock_%'
)
INSERT INTO videos (user_id, storage_path, filename, duration, file_size_mb, status, uploaded_at)
SELECT
    u.id,
    'mock/' || u.rn || '-early.mp4',
    'training-' || u.rn || '-early.mp4',
    30 + (u.rn % 40),
    8 + (u.rn % 15),
    'completed',
    NOW() - ((u.rn + 45) || ' days')::interval
FROM mock_users u
WHERE NOT EXISTS (SELECT 1 FROM videos v WHERE v.storage_path = 'mock/' || u.rn || '-early.mp4');

WITH mock_users AS (
    SELECT id, row_number() OVER (ORDER BY created_at) AS rn
    FROM users WHERE clerk_id LIKE 'clerk_mock_%'
),
early_videos AS (
    SELECT v.id, v.user_id, row_number() OVER (ORDER BY v.uploaded_at) AS rn
    FROM videos v WHERE v.storage_path LIKE 'mock/%-early.mp4'
)
INSERT INTO analyses (user_id, video_id, stability, power, technique, balance, overall, feedback, tags, processing_time_ms, created_at)
SELECT
    v.user_id,
    v.id,
    55 + (u.rn % 25),
    50 + ((u.rn * 2) % 30),
    55 + ((u.rn * 3) % 25),
    55 + ((u.rn * 5) % 25),
    -- earlier score: mostly lower than the current one (so growth > 0),
    -- but a subset (every 7th player) starts higher and declines
    CASE WHEN u.rn % 7 = 0
        THEN LEAST(95, GREATEST(50, 100 - u.rn * 1.8 + (u.rn % 10)) + 8 + (u.rn % 6))
        ELSE GREATEST(40, GREATEST(50, 100 - u.rn * 1.8 + (u.rn % 10)) - 6 - (u.rn % 12))
    END,
    'Earlier baseline analysis.',
    '["baseline"]'::jsonb,
    2500 + (u.rn * 80),
    NOW() - ((u.rn + 45) || ' days')::interval
FROM mock_users u
JOIN early_videos v ON v.user_id = u.id
WHERE NOT EXISTS (
    SELECT 1 FROM analyses a WHERE a.video_id = v.id
);
