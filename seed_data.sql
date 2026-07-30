-- ============================================================
-- SEED DATA SCRIPT — OpenSport Website
-- Email: aubakirovajtuar@gmail.com
-- ============================================================
-- ВАЖНО:
-- 1) Сначала выполни в SQL Editor миграцию
--    supabase/migrations/20260729_create_coach_tables.sql
--    (создаёт matches/training_sessions/exercises/player_flags и т.д.),
--    если ты этого ещё не делал — иначе этот скрипт упадёт на INSERT INTO matches/training_sessions.
-- 2) Твоя запись в таблице users создаётся автоматически при регистрации
--    (триггер handle_new_auth_user), поэтому скрипт ищет твой существующий id
--    по email, а не создаёт новый — если ты ни разу не логинился в приложение,
--    сначала зайди на сайт и залогинься, потом запускай этот скрипт.
-- ============================================================

DO $$
DECLARE
    my_user_id UUID;
BEGIN

SELECT id INTO my_user_id FROM users WHERE email = 'aubakirovajtuar@gmail.com';

IF my_user_id IS NULL THEN
    RAISE EXCEPTION 'Пользователь с email aubakirovajtuar@gmail.com не найден. Залогинься один раз в приложении, потом запусти скрипт снова.';
END IF;

-- ============================================================
-- 1. ОБНОВЛЕНИЕ ТВОЕГО ПРОФИЛЯ (тренер)
-- ============================================================
UPDATE users SET
    name = COALESCE(name, 'Aituar Aubakirov'),
    role = 'coach',
    club = COALESCE(club, 'OpenSport FC'),
    city = COALESCE(city, 'Алматы'),
    country = COALESCE(country, 'Қазақстан')
WHERE id = my_user_id;

-- ============================================================
-- 2. SKILLS (10 навыков) + SKILL LEVELS (30 уровней)
-- ============================================================
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
  ('Game Awareness', 'mental', 'Develop tactical awareness and decision making', '🧠', 10)
ON CONFLICT (order_index) DO NOTHING;

-- Passing Accuracy
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'beginner', 1, 'https://www.youtube.com/watch?v=F8LCioV8z_s', '5 Soccer Passing Drills | adidas', 12, ARRAY['technique'], 50 FROM skills WHERE name = 'Passing Accuracy'
ON CONFLICT (skill_id, level_order) DO NOTHING;
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'intermediate', 2, 'https://www.youtube.com/watch?v=-V88Iy1X-is', 'New Passing Drills to Improve Speed & Accuracy', 15, ARRAY['technique'], 100 FROM skills WHERE name = 'Passing Accuracy'
ON CONFLICT (skill_id, level_order) DO NOTHING;
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'advanced', 3, 'https://www.youtube.com/watch?v=0kGgL_aglEE', 'Passing & 1st Touch Drill (ADVANCED)', 10, ARRAY['technique'], 150 FROM skills WHERE name = 'Passing Accuracy'
ON CONFLICT (skill_id, level_order) DO NOTHING;

-- First Touch
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'beginner', 1, 'https://www.youtube.com/watch?v=ud84rp3Vphs', '10 Exercises To Master Your First Touch', 14, ARRAY['technique'], 50 FROM skills WHERE name = 'First Touch'
ON CONFLICT (skill_id, level_order) DO NOTHING;
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'intermediate', 2, 'https://www.youtube.com/watch?v=el7QvVnprOk', 'Perfect Your First Touch | 5 First Touch Exercises', 12, ARRAY['technique'], 100 FROM skills WHERE name = 'First Touch'
ON CONFLICT (skill_id, level_order) DO NOTHING;
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'advanced', 3, 'https://www.youtube.com/watch?v=8xfWkNLdVYE', 'How I Coach First Touch Under Pressure', 16, ARRAY['technique','balance'], 150 FROM skills WHERE name = 'First Touch'
ON CONFLICT (skill_id, level_order) DO NOTHING;

-- Ball Control Basics
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'beginner', 1, 'https://www.youtube.com/watch?v=e5RxAJM-oxc', '10 EASY Ball Mastery Exercises For Beginners', 10, ARRAY['technique'], 50 FROM skills WHERE name = 'Ball Control Basics'
ON CONFLICT (skill_id, level_order) DO NOTHING;
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'intermediate', 2, 'https://www.youtube.com/watch?v=Fj3Jsn0Pa7c', '10 Close Control Dribbling Exercises', 15, ARRAY['technique','balance'], 100 FROM skills WHERE name = 'Ball Control Basics'
ON CONFLICT (skill_id, level_order) DO NOTHING;
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'advanced', 3, 'https://www.youtube.com/watch?v=ezi5VhbOgsQ', 'Tight Space Control Training Drills', 12, ARRAY['technique','balance'], 150 FROM skills WHERE name = 'Ball Control Basics'
ON CONFLICT (skill_id, level_order) DO NOTHING;

-- Speed Dribbling
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'beginner', 1, 'https://www.youtube.com/watch?v=QqjaavLXdHs', '5 Close Control Dribbling Drills', 10, ARRAY['technique'], 50 FROM skills WHERE name = 'Speed Dribbling'
ON CONFLICT (skill_id, level_order) DO NOTHING;
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'intermediate', 2, 'https://www.youtube.com/watch?v=NMfLJynwyTk', '32 Close Control Dribbling Cone Drills', 18, ARRAY['technique','power'], 100 FROM skills WHERE name = 'Speed Dribbling'
ON CONFLICT (skill_id, level_order) DO NOTHING;
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'advanced', 3, 'https://www.youtube.com/watch?v=i3jSMolxtsE', 'How To Train Solo Like a Pro | Dribbling & Ball Mastery', 20, ARRAY['technique','power'], 150 FROM skills WHERE name = 'Speed Dribbling'
ON CONFLICT (skill_id, level_order) DO NOTHING;

-- Shooting Precision
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'beginner', 1, 'https://www.youtube.com/watch?v=ARGE2_MjaNY', 'Passing - Technique - Shooting - Soccer Drills', 12, ARRAY['technique','power'], 50 FROM skills WHERE name = 'Shooting Precision'
ON CONFLICT (skill_id, level_order) DO NOTHING;
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'intermediate', 2, 'https://www.youtube.com/watch?v=BdCBar17CTU', 'Striker Masterclass | 5 Drills To Improve Finishing', 16, ARRAY['technique','power'], 100 FROM skills WHERE name = 'Shooting Precision'
ON CONFLICT (skill_id, level_order) DO NOTHING;
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'advanced', 3, 'https://www.youtube.com/watch?v=BdCBar17CTU', 'Advanced Striker Training', 16, ARRAY['technique','power'], 150 FROM skills WHERE name = 'Shooting Precision'
ON CONFLICT (skill_id, level_order) DO NOTHING;

-- Defensive Positioning
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'beginner', 1, 'https://www.youtube.com/watch?v=FS1LrWzSSmQ', 'LOADS OF SOCCER DRILLS FOR BEGINNERS', 15, ARRAY['balance','technique'], 50 FROM skills WHERE name = 'Defensive Positioning'
ON CONFLICT (skill_id, level_order) DO NOTHING;
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'intermediate', 2, 'https://www.youtube.com/watch?v=0F_sLDwOMNc', '25 Partner Passing Drills | PRO LEVEL', 18, ARRAY['balance','technique'], 100 FROM skills WHERE name = 'Defensive Positioning'
ON CONFLICT (skill_id, level_order) DO NOTHING;
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'advanced', 3, 'https://www.youtube.com/watch?v=h3o-MKSehJA', 'Full Partner Training Session', 20, ARRAY['balance','technique'], 150 FROM skills WHERE name = 'Defensive Positioning'
ON CONFLICT (skill_id, level_order) DO NOTHING;

-- Speed & Acceleration
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'beginner', 1, 'https://www.youtube.com/watch?v=rSlJU8cO9js', 'Fast Feet & Agility Training', 12, ARRAY['power'], 50 FROM skills WHERE name = 'Speed & Acceleration'
ON CONFLICT (skill_id, level_order) DO NOTHING;
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'intermediate', 2, 'https://www.youtube.com/watch?v=nckkvbxgnUM', 'Quick 15 Minute Soccer Training | Ball Control', 15, ARRAY['power'], 100 FROM skills WHERE name = 'Speed & Acceleration'
ON CONFLICT (skill_id, level_order) DO NOTHING;
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'advanced', 3, 'https://www.youtube.com/watch?v=5IR4Ecfssyw', 'Advanced Speed Training', 14, ARRAY['power'], 150 FROM skills WHERE name = 'Speed & Acceleration'
ON CONFLICT (skill_id, level_order) DO NOTHING;

-- Balance & Core
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'beginner', 1, 'https://www.youtube.com/watch?v=i3jSMolxtsE', 'How To Train Solo Like a Pro', 20, ARRAY['stability','balance'], 50 FROM skills WHERE name = 'Balance & Core'
ON CONFLICT (skill_id, level_order) DO NOTHING;
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'intermediate', 2, 'https://www.youtube.com/watch?v=NMfLJynwyTk', '10 Close Control Dribbling Cone Drills', 18, ARRAY['stability','balance'], 100 FROM skills WHERE name = 'Balance & Core'
ON CONFLICT (skill_id, level_order) DO NOTHING;
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'advanced', 3, 'https://www.youtube.com/watch?v=ezi5VhbOgsQ', 'Tight Space Control Training Drills', 12, ARRAY['stability','balance'], 150 FROM skills WHERE name = 'Balance & Core'
ON CONFLICT (skill_id, level_order) DO NOTHING;

-- 1v1 Attacking
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'beginner', 1, 'https://www.youtube.com/watch?v=QqjaavLXdHs', '5 Close Control Dribbling Drills', 10, ARRAY['technique'], 50 FROM skills WHERE name = '1v1 Attacking'
ON CONFLICT (skill_id, level_order) DO NOTHING;
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'intermediate', 2, 'https://www.youtube.com/watch?v=NMfLJynwyTk', '32 Close Control Dribbling Cone Drills', 18, ARRAY['technique','power'], 100 FROM skills WHERE name = '1v1 Attacking'
ON CONFLICT (skill_id, level_order) DO NOTHING;
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'advanced', 3, 'https://www.youtube.com/watch?v=i3jSMolxtsE', 'How To Train Solo Like a Pro', 20, ARRAY['technique','power'], 150 FROM skills WHERE name = '1v1 Attacking'
ON CONFLICT (skill_id, level_order) DO NOTHING;

-- Game Awareness
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'beginner', 1, 'https://www.youtube.com/watch?v=FS1LrWzSSmQ', 'LOADS OF SOCCER DRILLS FOR BEGINNERS', 15, ARRAY['technique'], 50 FROM skills WHERE name = 'Game Awareness'
ON CONFLICT (skill_id, level_order) DO NOTHING;
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'intermediate', 2, 'https://www.youtube.com/watch?v=-F6OecCUHLA', 'Passing & 1st Touch Combinations', 12, ARRAY['technique'], 100 FROM skills WHERE name = 'Game Awareness'
ON CONFLICT (skill_id, level_order) DO NOTHING;
INSERT INTO skill_levels (skill_id, level_name, level_order, youtube_url, video_title, duration_minutes, target_metrics, xp_reward)
SELECT id, 'advanced', 3, 'https://www.youtube.com/watch?v=moLy3vQ1q_E', '4v2 Rondo | Possession Exercise', 14, ARRAY['technique','balance'], 150 FROM skills WHERE name = 'Game Awareness'
ON CONFLICT (skill_id, level_order) DO NOTHING;

-- ============================================================
-- 3. EXERCISES (библиотека упражнений для тренера)
-- ============================================================
INSERT INTO exercises (name, category, skill, difficulty, duration_minutes, min_players, equipment, description)
VALUES
    ('Passing Rondo', 'passing', 'short_passing', 'intermediate', 15, 4, ARRAY['cones','balls'], '4v2 possession game in a circle'),
    ('Defensive Shape', 'defensive', 'positioning', 'advanced', 30, 8, ARRAY['cones','pinnies'], 'Team defensive organization drill'),
    ('Shooting Drills', 'shooting', 'shooting', 'intermediate', 25, 2, ARRAY['balls','goals','cones'], 'Finishing from various positions'),
    ('Dribbling Circuit', 'dribbling', 'dribbling', 'beginner', 20, 1, ARRAY['cones','balls'], 'Slalom dribbling through cones'),
    ('Small-Sided Game', 'tactical', 'game_awareness', 'advanced', 30, 10, ARRAY['pinnies','goals','balls'], '5v5 or 7v7 scrimmage'),
    ('Pressing Drill', 'physical', 'stamina', 'advanced', 20, 6, ARRAY['cones','pinnies'], 'High-intensity pressing patterns'),
    ('First Touch', 'technical', 'ball_control', 'beginner', 20, 1, ARRAY['balls','wall'], 'First touch control from various heights'),
    ('Ball Control', 'technical', 'ball_control', 'intermediate', 20, 1, ARRAY['balls','cones'], 'Close ball control through obstacles'),
    ('Crossing & Finishing', 'shooting', 'crossing', 'intermediate', 25, 4, ARRAY['balls','goals','cones'], 'Wide crosses with near-post and far-post runs'),
    ('Interval Sprints', 'physical', 'speed', 'advanced', 15, 1, ARRAY['cones','stopwatch'], 'High-intensity interval running')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. CLUB + TEAM (для тренерской панели), с тобой как коучем
-- ============================================================
INSERT INTO clubs (name, country, city) VALUES ('OpenSport FC', 'Қазақстан', 'Алматы') ON CONFLICT DO NOTHING;

INSERT INTO teams (club_id, name, age_group, season, invite_code)
SELECT id, 'OpenSport FC U19', 'U19', '2025/2026', 'OSFC-U19' FROM clubs WHERE name = 'OpenSport FC'
ON CONFLICT (invite_code) DO NOTHING;

INSERT INTO team_coaches (team_id, coach_id)
SELECT t.id, my_user_id FROM teams t WHERE t.name = 'OpenSport FC U19'
ON CONFLICT (team_id, coach_id) DO NOTHING;

-- ============================================================
-- 5. 50 MOCK ИГРОКОВ ДЛЯ GLOBAL RANKING
--    (Казахстанские игроки с видео + анализами → попадают в view global_rankings)
-- ============================================================
WITH ranked_players AS (
    SELECT * FROM (VALUES
        (1, 'Абылай', 'Серік', 16, 'MID', 'Кайрат', 'Алматы'),
        (2, 'Алишер', 'Омаров', 17, 'DEF', 'Астана', 'Астана'),
        (3, 'Арман', 'Ахметов', 15, 'FWD', 'Тобол', 'Қостанай'),
        (4, 'Батыр', 'Кусаинов', 18, 'GK', 'Шахтер', 'Қарағанды'),
        (5, 'Дамир', 'Нурмагамбетов', 16, 'MID', 'Ордабасы', 'Шымкент'),
        (6, 'Данияр', 'Искаков', 17, 'DEF', 'Кайсар', 'Қызылорда'),
        (7, 'Ержан', 'Турсынбаев', 15, 'FWD', 'Жетысу', 'Талдықорған'),
        (8, 'Ернар', 'Жумабек', 16, 'MID', 'Атырау', 'Атырау'),
        (9, 'Жандос', 'Садыков', 17, 'DEF', 'Кызыл-Жар', 'Петропавл'),
        (10, 'Жасұлан', 'Абдрахманов', 18, 'FWD', 'Мактаарал', 'Түркістан'),
        (11, 'Ильяс', 'Бекетаев', 15, 'MID', 'Кайрат', 'Алматы'),
        (12, 'Максат', 'Ермеков', 16, 'DEF', 'Астана', 'Астана'),
        (13, 'Марат', 'Жапаров', 17, 'GK', 'Тобол', 'Қостанай'),
        (14, 'Нұрлан', 'Закиров', 18, 'MID', 'Ордабасы', 'Шымкент'),
        (15, 'Нұржан', 'Ибраев', 15, 'FWD', 'Шахтер', 'Қарағанды'),
        (16, 'Олжас', 'Калмырзаев', 16, 'DEF', 'Акжайык', 'Орал'),
        (17, 'Рахат', 'Маханов', 17, 'MID', 'Тараз', 'Тараз'),
        (18, 'Руслан', 'Нурпеисов', 18, 'FWD', 'Кайсар', 'Қызылорда'),
        (19, 'Санжар', 'Сапарбаев', 15, 'GK', 'Астана', 'Астана'),
        (20, 'Тимур', 'Толегенов', 16, 'DEF', 'Кайрат', 'Алматы'),
        (21, 'Талгат', 'Умирзаков', 17, 'MID', 'Тобол', 'Қостанай'),
        (22, 'Темирлан', 'Шарипов', 18, 'FWD', 'Ордабасы', 'Шымкент'),
        (23, 'Азамат', 'Юсупов', 15, 'DEF', 'Шахтер', 'Қарағанды'),
        (24, 'Асхат', 'Серік', 16, 'MID', 'Жетысу', 'Талдықорған'),
        (25, 'Бекжан', 'Омаров', 17, 'FWD', 'Атырау', 'Атырау'),
        (26, 'Ғалымжан', 'Ахметов', 18, 'DEF', 'Кайсар', 'Қызылорда'),
        (27, 'Дастан', 'Кусаинов', 15, 'MID', 'Кызыл-Жар', 'Петропавл'),
        (28, 'Еркебулан', 'Турсынбаев', 16, 'GK', 'Мактаарал', 'Түркістан'),
        (29, 'Жанболат', 'Нурмагамбетов', 17, 'FWD', 'Акжайык', 'Орал'),
        (30, 'Мейрамбек', 'Искаков', 18, 'MID', 'Тараз', 'Тараз'),
        (31, 'Абылай', 'Садыков', 15, 'DEF', 'Кайрат', 'Алматы'),
        (32, 'Алишер', 'Жумабек', 16, 'FWD', 'Астана', 'Астана'),
        (33, 'Батыр', 'Абдрахманов', 17, 'MID', 'Тобол', 'Қостанай'),
        (34, 'Дамир', 'Бекетаев', 18, 'DEF', 'Ордабасы', 'Шымкент'),
        (35, 'Ержан', 'Ермеков', 15, 'GK', 'Шахтер', 'Қарағанды'),
        (36, 'Жандос', 'Жапаров', 16, 'MID', 'Жетысу', 'Талдықорған'),
        (37, 'Ильяс', 'Закиров', 17, 'FWD', 'Атырау', 'Атырау'),
        (38, 'Максат', 'Ибраев', 18, 'DEF', 'Кайсар', 'Қызылорда'),
        (39, 'Марат', 'Маханов', 15, 'MID', 'Кызыл-Жар', 'Петропавл'),
        (40, 'Нұрлан', 'Нурпеисов', 16, 'FWD', 'Мактаарал', 'Түркістан'),
        (41, 'Олжас', 'Сапарбаев', 17, 'DEF', 'Акжайык', 'Орал'),
        (42, 'Рахат', 'Толегенов', 18, 'MID', 'Тараз', 'Тараз'),
        (43, 'Руслан', 'Умирзаков', 15, 'GK', 'Кайрат', 'Алматы'),
        (44, 'Санжар', 'Шарипов', 16, 'FWD', 'Астана', 'Астана'),
        (45, 'Тимур', 'Юсупов', 17, 'DEF', 'Тобол', 'Қостанай'),
        (46, 'Азамат', 'Серік', 18, 'MID', 'Ордабасы', 'Шымкент'),
        (47, 'Бекжан', 'Омаров', 15, 'FWD', 'Шахтер', 'Қарағанды'),
        (48, 'Данияр', 'Ахметов', 16, 'DEF', 'Жетысу', 'Талдықорған'),
        (49, 'Ернар', 'Кусаинов', 17, 'MID', 'Атырау', 'Атырау'),
        (50, 'Жасұлан', 'Турсынбаев', 18, 'FWD', 'Кайсар', 'Қызылорда')
    ) AS t(rank, fn, ln, age, pos, team, city)
)
INSERT INTO users (clerk_id, email, name, role, age, position, club, city, country)
SELECT
    'clerk_mock_' || t.rank,
    'mock.player' || t.rank || '@opensport.app',
    t.fn || ' ' || t.ln,
    'player',
    t.age,
    t.pos,
    t.team,
    t.city,
    'Қазақстан'
FROM ranked_players t
ON CONFLICT (clerk_id) DO NOTHING;

-- Видео + анализы для каждого mock игрока (формируют global_rankings)
WITH mock_users AS (
    SELECT id, name, row_number() OVER (ORDER BY created_at) AS rn
    FROM users WHERE clerk_id LIKE 'clerk_mock_%'
)
INSERT INTO videos (user_id, storage_path, filename, duration, file_size_mb, status, uploaded_at)
SELECT
    u.id,
    'mock/' || u.rn || '.mp4',
    'training-' || u.rn || '.mp4',
    30 + (u.rn % 60),
    10 + (u.rn % 20),
    'completed',
    NOW() - (u.rn || ' days')::interval
FROM mock_users u
ON CONFLICT DO NOTHING;

WITH mock_users AS (
    SELECT id, name, row_number() OVER (ORDER BY created_at) AS rn
    FROM users WHERE clerk_id LIKE 'clerk_mock_%'
),
mock_videos AS (
    SELECT v.id, v.user_id, row_number() OVER (ORDER BY v.uploaded_at) AS rn
    FROM videos v WHERE v.storage_path LIKE 'mock/%'
)
INSERT INTO analyses (user_id, video_id, stability, power, technique, balance, overall, feedback, tags, processing_time_ms, created_at)
SELECT
    v.user_id,
    v.id,
    65 + (u.rn % 30),
    60 + ((u.rn * 2) % 35),
    70 + ((u.rn * 3) % 25),
    65 + ((u.rn * 5) % 30),
    GREATEST(50, 100 - u.rn * 1.8 + (u.rn % 10)),
    CASE
        WHEN u.rn < 10 THEN 'Excellent technique and form. Keep up the great work!'
        WHEN u.rn < 25 THEN 'Good fundamentals. Focus on improving power generation.'
        WHEN u.rn < 40 THEN 'Solid effort. Work on balance and stability for better results.'
        ELSE 'Keep practicing consistently. Focus on basic technique.'
    END,
    CASE
        WHEN u.rn % 3 = 0 THEN '["right-foot", "instep-drive"]'::jsonb
        WHEN u.rn % 3 = 1 THEN '["left-foot", "volley"]'::jsonb
        ELSE '["right-foot", "curve-shot"]'::jsonb
    END,
    2000 + (u.rn * 100),
    NOW() - ((u.rn + 2) || ' days')::interval
FROM mock_users u
JOIN mock_videos v ON v.user_id = u.id
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. РОСТЕР КОМАНДЫ — 15 mock игроков в твоей команде
-- ============================================================
INSERT INTO users (clerk_id, email, name, role, age, position, club) VALUES
    ('clerk_roster_1', 'player1@opensport.app', 'Абылай Серік', 'player', 17, 'FWD', 'OpenSport FC'),
    ('clerk_roster_2', 'player2@opensport.app', 'Алишер Омаров', 'player', 16, 'MID', 'OpenSport FC'),
    ('clerk_roster_3', 'player3@opensport.app', 'Арман Ахметов', 'player', 18, 'DEF', 'OpenSport FC'),
    ('clerk_roster_4', 'player4@opensport.app', 'Батыр Кусаинов', 'player', 17, 'GK', 'OpenSport FC'),
    ('clerk_roster_5', 'player5@opensport.app', 'Дамир Нурмагамбетов', 'player', 16, 'MID', 'OpenSport FC'),
    ('clerk_roster_6', 'player6@opensport.app', 'Данияр Искаков', 'player', 17, 'DEF', 'OpenSport FC'),
    ('clerk_roster_7', 'player7@opensport.app', 'Ержан Турсынбаев', 'player', 15, 'FWD', 'OpenSport FC'),
    ('clerk_roster_8', 'player8@opensport.app', 'Ернар Жумабек', 'player', 16, 'MID', 'OpenSport FC'),
    ('clerk_roster_9', 'player9@opensport.app', 'Жандос Садыков', 'player', 18, 'DEF', 'OpenSport FC'),
    ('clerk_roster_10', 'player10@opensport.app', 'Жасұлан Абдрахманов', 'player', 17, 'FWD', 'OpenSport FC'),
    ('clerk_roster_11', 'player11@opensport.app', 'Ильяс Бекетаев', 'player', 15, 'MID', 'OpenSport FC'),
    ('clerk_roster_12', 'player12@opensport.app', 'Максат Ермеков', 'player', 16, 'DEF', 'OpenSport FC'),
    ('clerk_roster_13', 'player13@opensport.app', 'Марат Жапаров', 'player', 17, 'GK', 'OpenSport FC'),
    ('clerk_roster_14', 'player14@opensport.app', 'Нұрлан Закиров', 'player', 18, 'MID', 'OpenSport FC'),
    ('clerk_roster_15', 'player15@opensport.app', 'Нұржан Ибраев', 'player', 16, 'FWD', 'OpenSport FC')
ON CONFLICT (clerk_id) DO NOTHING;

INSERT INTO team_rosters (team_id, player_id, status, jersey_number, joined_at)
SELECT t.id, u.id, CASE WHEN u.name IN ('Нұрлан Закиров', 'Нұржан Ибраев') THEN 'pending' ELSE 'active' END,
       row_number() OVER (ORDER BY u.name), NOW()
FROM teams t, users u
WHERE t.name = 'OpenSport FC U19'
  AND u.clerk_id LIKE 'clerk_roster_%'
  AND u.id NOT IN (SELECT player_id FROM team_rosters WHERE team_id = t.id)
LIMIT 15;

-- ============================================================
-- 7. MATCHES (требует применённой миграции 20260729_create_coach_tables.sql)
-- ============================================================
INSERT INTO matches (team_id, date, time, opponent, home_away, competition, match_type, location, score_home, score_away, status, notes, created_by)
SELECT t.id, '2026-07-20', '18:00', 'FC Astana', 'home', 'U18 League', 'league', 'Astana Arena', 3, 1, 'completed', 'Strong performance', my_user_id
FROM teams t WHERE t.name = 'OpenSport FC U19'
ON CONFLICT DO NOTHING;

INSERT INTO matches (team_id, date, time, opponent, home_away, competition, match_type, location, status, created_by)
SELECT t.id, '2026-08-03', '16:30', 'Kairat Academy', 'away', 'U18 League', 'league', 'Kairat Stadium', 'scheduled', my_user_id
FROM teams t WHERE t.name = 'OpenSport FC U19'
ON CONFLICT DO NOTHING;

INSERT INTO matches (team_id, date, time, opponent, home_away, competition, match_type, location, score_home, score_away, status, notes, created_by)
SELECT t.id, '2026-07-13', '19:00', 'Shakhter U18', 'home', 'U18 League', 'league', 'Home Field', 1, 2, 'completed', 'Tough loss, defensive errors', my_user_id
FROM teams t WHERE t.name = 'OpenSport FC U19'
ON CONFLICT DO NOTHING;

INSERT INTO matches (team_id, date, time, opponent, home_away, competition, match_type, location, score_home, score_away, status, notes, created_by)
SELECT t.id, '2026-07-06', '17:00', 'Tobol Youth', 'away', 'U18 Cup', 'cup', 'Tobol Arena', 0, 4, 'completed', 'Dominant performance', my_user_id
FROM teams t WHERE t.name = 'OpenSport FC U19'
ON CONFLICT DO NOTHING;

INSERT INTO matches (team_id, date, time, opponent, home_away, competition, match_type, location, status, created_by)
SELECT t.id, '2026-08-10', '15:00', 'Ordabasy U18', 'home', 'U18 League', 'league', 'Home Field', 'scheduled', my_user_id
FROM teams t WHERE t.name = 'OpenSport FC U19'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. TRAINING SESSIONS (плейсхолдеры для вкладки Training)
-- ============================================================
INSERT INTO training_sessions (team_id, coach_id, name, date, time, duration_minutes, location, objective, status)
SELECT t.id, my_user_id, 'Позиционная атака', '2026-08-04', '10:00', 90, 'Main Pitch', 'Отработка атакующих комбинаций', 'scheduled'
FROM teams t WHERE t.name = 'OpenSport FC U19'
ON CONFLICT DO NOTHING;

INSERT INTO training_sessions (team_id, coach_id, name, date, time, duration_minutes, location, objective, status)
SELECT t.id, my_user_id, 'Защитные построения', '2026-07-25', '10:00', 90, 'Main Pitch', 'Отработка оборонительных действий', 'completed'
FROM teams t WHERE t.name = 'OpenSport FC U19'
ON CONFLICT DO NOTHING;

INSERT INTO training_sessions (team_id, coach_id, name, date, time, duration_minutes, location, objective, status)
SELECT t.id, my_user_id, 'Индивидуальная техника', '2026-08-01', '09:00', 60, 'Training Ground', 'Улучшение технических навыков', 'scheduled'
FROM teams t WHERE t.name = 'OpenSport FC U19'
ON CONFLICT DO NOTHING;

-- Упражнения внутри первой тренировки
INSERT INTO training_session_exercises (session_id, name, category, duration_minutes, notes, "order")
SELECT ts.id, 'Passing Rondo', 'passing', 15, '4v2 possession', 1
FROM training_sessions ts WHERE ts.name = 'Позиционная атака'
ON CONFLICT DO NOTHING;

INSERT INTO training_session_exercises (session_id, name, category, duration_minutes, notes, "order")
SELECT ts.id, 'Small-Sided Game', 'tactical', 30, '7v7 scrimmage focus on width', 2
FROM training_sessions ts WHERE ts.name = 'Позиционная атака'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. COACH NOTES / PLAYER FLAGS
-- ============================================================
INSERT INTO coach_notes (coach_id, player_id, note, tags, visibility)
SELECT my_user_id, u.id, 'Top prospect for academy selection', ARRAY['high_potential'], 'private'
FROM users u WHERE u.clerk_id = 'clerk_roster_3'
ON CONFLICT DO NOTHING;

INSERT INTO coach_notes (coach_id, player_id, note, tags, visibility)
SELECT my_user_id, u.id, 'Ankle sprain, estimated return 2 weeks', ARRAY['injured'], 'private'
FROM users u WHERE u.clerk_id = 'clerk_roster_7'
ON CONFLICT DO NOTHING;

INSERT INTO player_flags (player_id, coach_id, type, note)
SELECT u.id, my_user_id, 'high_potential', 'Standout in recent matches'
FROM users u WHERE u.clerk_id = 'clerk_roster_3'
ON CONFLICT DO NOTHING;

INSERT INTO player_flags (player_id, coach_id, type, note)
SELECT u.id, my_user_id, 'injured', 'Ankle sprain, out ~2 weeks'
FROM users u WHERE u.clerk_id = 'clerk_roster_7'
ON CONFLICT DO NOTHING;

RAISE NOTICE 'Seed complete for user %', my_user_id;

END $$;
