-- ============================================================
-- SEED STATS V2 — заполняет реальными данными:
--  1) starting_xi/substitutes в сыгранных матчах
--  2) player_match_stats (голы/ассисты/карточки/рейтинг) за каждый матч
--  3) metric_observations (AI-метрики + shots) по игрокам
--  4) training_session_players (посещаемость тренировок)
--  5) упражнения для оставшихся тренировок
--  6) player_evaluations (оценки игроков) с валидной структурой categories
-- ВАЖНО: выполнять ПОСЛЕ seed_data.sql и ПОСЛЕ миграции
-- 20260731_fix_coach_rls_auth_mapping.sql (иначе коуч не увидит эти
-- данные из-за несовпадения auth.uid() vs users.id в RLS-политиках).
-- Скрипт безопасен для повторного запуска (не создаёт дублей).
-- ============================================================

-- 1) Составы: первые 11 игроков (по clerk_id) — в старте, остальные 4 — в запасе
UPDATE matches m SET
    starting_xi = (SELECT array_agg(u.id ORDER BY u.clerk_id) FROM users u
                   WHERE u.clerk_id IN ('clerk_roster_1','clerk_roster_2','clerk_roster_3','clerk_roster_4','clerk_roster_5',
                                        'clerk_roster_6','clerk_roster_7','clerk_roster_8','clerk_roster_9','clerk_roster_10','clerk_roster_11')),
    substitutes = (SELECT array_agg(u.id ORDER BY u.clerk_id) FROM users u
                   WHERE u.clerk_id IN ('clerk_roster_12','clerk_roster_13','clerk_roster_14','clerk_roster_15'))
WHERE m.team_id = (SELECT id FROM teams WHERE name = 'OpenSport FC U19')
  AND m.status = 'completed'
  AND (m.starting_xi IS NULL OR array_length(m.starting_xi, 1) IS NULL);

-- 2) player_match_stats — для каждого сыгранного матча и каждого игрока стартового состава
WITH match_list AS (
    SELECT id AS match_id, row_number() OVER (ORDER BY date) AS mrn
    FROM matches
    WHERE team_id = (SELECT id FROM teams WHERE name = 'OpenSport FC U19') AND status = 'completed'
),
starter_list AS (
    SELECT id AS player_id, row_number() OVER (ORDER BY clerk_id) AS prn
    FROM users
    WHERE clerk_id IN ('clerk_roster_1','clerk_roster_2','clerk_roster_3','clerk_roster_4','clerk_roster_5',
                       'clerk_roster_6','clerk_roster_7','clerk_roster_8','clerk_roster_9','clerk_roster_10','clerk_roster_11')
)
INSERT INTO player_match_stats (match_id, player_id, minutes, goals, assists, yellow_cards, red_cards, coach_rating, source)
SELECT
    ml.match_id,
    sl.player_id,
    70 + ((sl.prn * 3 + ml.mrn * 5) % 21),
    CASE WHEN (sl.prn + ml.mrn) % 4 = 0 THEN 1 ELSE 0 END,
    CASE WHEN (sl.prn + ml.mrn) % 5 = 0 THEN 1 ELSE 0 END,
    CASE WHEN (sl.prn * ml.mrn) % 9 = 0 THEN 1 ELSE 0 END,
    0,
    ROUND((6 + ((sl.prn * 7 + ml.mrn * 3) % 30) / 10.0)::numeric, 1),
    'coach'
FROM match_list ml CROSS JOIN starter_list sl
ON CONFLICT (match_id, player_id) DO NOTHING;

-- 3a) AI-метрики (растущий тренд за последние 60 дней) для стартовых игроков
WITH starter_list AS (
    SELECT id AS player_id, row_number() OVER (ORDER BY clerk_id) AS prn
    FROM users
    WHERE clerk_id IN ('clerk_roster_1','clerk_roster_2','clerk_roster_3','clerk_roster_4','clerk_roster_5',
                       'clerk_roster_6','clerk_roster_7','clerk_roster_8','clerk_roster_9','clerk_roster_10','clerk_roster_11')
),
ai_metrics AS (
    SELECT * FROM (VALUES ('ai_score'),('ai_passing'),('ai_shooting'),('ai_dribbling'),('ai_balance'),('ai_stability')) AS m(metric)
),
timepoints AS (
    SELECT * FROM (VALUES (1,60),(2,30),(3,0)) AS t(seq, days_ago)
)
INSERT INTO metric_observations (player_id, metric, value, source, recorded_at, context)
SELECT
    sl.player_id,
    am.metric,
    LEAST(99, 55 + (sl.prn * 2) + (tp.seq * 5) + (CASE am.metric WHEN 'ai_score' THEN 5 ELSE 0 END)),
    'opensport_ai',
    NOW() - (tp.days_ago || ' days')::interval,
    'seed_v2_ai_' || tp.seq
FROM starter_list sl CROSS JOIN ai_metrics am CROSS JOIN timepoints tp
WHERE NOT EXISTS (
    SELECT 1 FROM metric_observations mo
    WHERE mo.player_id = sl.player_id AND mo.metric = am.metric AND mo.context = 'seed_v2_ai_' || tp.seq
);

-- 3b) Удары по воротам (shots / shots_on_target) за каждый сыгранный матч
WITH match_list AS (
    SELECT id AS match_id, row_number() OVER (ORDER BY date) AS mrn
    FROM matches
    WHERE team_id = (SELECT id FROM teams WHERE name = 'OpenSport FC U19') AND status = 'completed'
),
starter_list AS (
    SELECT id AS player_id, row_number() OVER (ORDER BY clerk_id) AS prn
    FROM users
    WHERE clerk_id IN ('clerk_roster_1','clerk_roster_2','clerk_roster_3','clerk_roster_4','clerk_roster_5',
                       'clerk_roster_6','clerk_roster_7','clerk_roster_8','clerk_roster_9','clerk_roster_10','clerk_roster_11')
)
INSERT INTO metric_observations (player_id, metric, value, source, recorded_at, context)
SELECT sl.player_id, 'shots', 1 + ((sl.prn + ml.mrn) % 4), 'match', NOW() - ((4 - ml.mrn) * 7 || ' days')::interval, 'seed_v2_shots_' || ml.match_id
FROM starter_list sl CROSS JOIN match_list ml
WHERE NOT EXISTS (
    SELECT 1 FROM metric_observations mo WHERE mo.player_id = sl.player_id AND mo.context = 'seed_v2_shots_' || ml.match_id
)
UNION ALL
SELECT sl.player_id, 'shots_on_target', GREATEST(0, ((1 + ((sl.prn + ml.mrn) % 4)) / 2)), 'match', NOW() - ((4 - ml.mrn) * 7 || ' days')::interval, 'seed_v2_shotsot_' || ml.match_id
FROM starter_list sl CROSS JOIN match_list ml
WHERE NOT EXISTS (
    SELECT 1 FROM metric_observations mo WHERE mo.player_id = sl.player_id AND mo.context = 'seed_v2_shotsot_' || ml.match_id
);

-- 4) Посещаемость тренировок для всех трёх сессий
WITH roster_list AS (
    SELECT id AS player_id, row_number() OVER (ORDER BY clerk_id) AS prn
    FROM users WHERE clerk_id LIKE 'clerk_roster_%'
),
session_list AS (
    SELECT id AS session_id, status, row_number() OVER (ORDER BY date) AS srn
    FROM training_sessions WHERE team_id = (SELECT id FROM teams WHERE name = 'OpenSport FC U19')
)
INSERT INTO training_session_players (session_id, player_id, status, exercises_completed, duration_minutes, xp_earned)
SELECT
    sl.session_id,
    rl.player_id,
    CASE WHEN sl.status = 'completed' THEN 'completed' ELSE 'assigned' END,
    CASE WHEN sl.status = 'completed' THEN 2 + (rl.prn % 3) ELSE 0 END,
    CASE WHEN sl.status = 'completed' THEN 60 + (rl.prn % 30) ELSE NULL END,
    CASE WHEN sl.status = 'completed' THEN 50 + (rl.prn * 3 % 100) ELSE 0 END
FROM session_list sl CROSS JOIN roster_list rl
ON CONFLICT (session_id, player_id) DO NOTHING;

-- 5) Упражнения для оставшихся тренировок (у "Позиционная атака" уже есть свои)
INSERT INTO training_session_exercises (session_id, name, category, duration_minutes, notes, "order")
SELECT ts.id, 'Defensive Shape', 'defensive', 30, 'Blocks and covering runs', 1
FROM training_sessions ts WHERE ts.name = 'Защитные построения'
AND NOT EXISTS (SELECT 1 FROM training_session_exercises e WHERE e.session_id = ts.id AND e.name = 'Defensive Shape');

INSERT INTO training_session_exercises (session_id, name, category, duration_minutes, notes, "order")
SELECT ts.id, 'Pressing Drill', 'physical', 20, 'High press triggers', 2
FROM training_sessions ts WHERE ts.name = 'Защитные построения'
AND NOT EXISTS (SELECT 1 FROM training_session_exercises e WHERE e.session_id = ts.id AND e.name = 'Pressing Drill');

INSERT INTO training_session_exercises (session_id, name, category, duration_minutes, notes, "order")
SELECT ts.id, 'First Touch', 'technical', 20, 'Individual technical work', 1
FROM training_sessions ts WHERE ts.name = 'Индивидуальная техника'
AND NOT EXISTS (SELECT 1 FROM training_session_exercises e WHERE e.session_id = ts.id AND e.name = 'First Touch');

INSERT INTO training_session_exercises (session_id, name, category, duration_minutes, notes, "order")
SELECT ts.id, 'Ball Control', 'technical', 25, 'Close control through obstacles', 2
FROM training_sessions ts WHERE ts.name = 'Индивидуальная техника'
AND NOT EXISTS (SELECT 1 FROM training_session_exercises e WHERE e.session_id = ts.id AND e.name = 'Ball Control');

-- 6) Оценки игроков (player_evaluations) — категории строго в формате, который ждёт UI
INSERT INTO player_evaluations (player_id, coach_id, team_id, date, categories, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'aubakirovajtuar@gmail.com'), (SELECT id FROM teams WHERE name = 'OpenSport FC U19'),
    '2026-07-25',
    '{"technical":{"first_touch":8,"ball_control":8,"short_passing":7,"long_passing":6,"shooting":6,"finishing":6,"dribbling":7,"crossing":5,"heading":5,"one_vs_one":7},
      "tactical":{"positioning":7,"decision_making":7,"game_awareness":8,"off_ball_movement":7,"defensive_awareness":5},
      "physical":{"speed":8,"acceleration":8,"agility":7,"balance":7,"strength":6,"stamina":8},
      "mental":{"concentration":7,"confidence":8,"discipline":8,"work_rate":9,"teamwork":8}}'::jsonb,
    'Уверенный прогресс, лидер атаки команды.'
FROM users u WHERE u.clerk_id = 'clerk_roster_1'
AND NOT EXISTS (SELECT 1 FROM player_evaluations pe WHERE pe.player_id = u.id AND pe.date = '2026-07-25');

INSERT INTO player_evaluations (player_id, coach_id, team_id, date, categories, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'aubakirovajtuar@gmail.com'), (SELECT id FROM teams WHERE name = 'OpenSport FC U19'),
    '2026-07-25',
    '{"technical":{"first_touch":7,"ball_control":7,"short_passing":8,"long_passing":7,"shooting":5,"finishing":5,"dribbling":6,"crossing":6,"heading":4,"one_vs_one":6},
      "tactical":{"positioning":7,"decision_making":8,"game_awareness":8,"off_ball_movement":7,"defensive_awareness":6},
      "physical":{"speed":6,"acceleration":6,"agility":7,"balance":7,"strength":5,"stamina":7},
      "mental":{"concentration":8,"confidence":7,"discipline":8,"work_rate":8,"teamwork":9}}'::jsonb,
    'Отличное распределение мяча, нужно больше атакующей активности.'
FROM users u WHERE u.clerk_id = 'clerk_roster_2'
AND NOT EXISTS (SELECT 1 FROM player_evaluations pe WHERE pe.player_id = u.id AND pe.date = '2026-07-25');

INSERT INTO player_evaluations (player_id, coach_id, team_id, date, categories, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'aubakirovajtuar@gmail.com'), (SELECT id FROM teams WHERE name = 'OpenSport FC U19'),
    '2026-07-25',
    '{"technical":{"first_touch":6,"ball_control":6,"short_passing":6,"long_passing":5,"shooting":4,"finishing":4,"dribbling":5,"crossing":4,"heading":8,"one_vs_one":6},
      "tactical":{"positioning":8,"decision_making":7,"game_awareness":7,"off_ball_movement":5,"defensive_awareness":9},
      "physical":{"speed":6,"acceleration":5,"agility":6,"balance":7,"strength":9,"stamina":7},
      "mental":{"concentration":8,"confidence":7,"discipline":9,"work_rate":8,"teamwork":8}}'::jsonb,
    'Топ-прогноз на позицию центрального защитника. Отличная игра головой.'
FROM users u WHERE u.clerk_id = 'clerk_roster_3'
AND NOT EXISTS (SELECT 1 FROM player_evaluations pe WHERE pe.player_id = u.id AND pe.date = '2026-07-25');

INSERT INTO player_evaluations (player_id, coach_id, team_id, date, categories, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'aubakirovajtuar@gmail.com'), (SELECT id FROM teams WHERE name = 'OpenSport FC U19'),
    '2026-07-25',
    '{"technical":{"first_touch":9,"ball_control":9,"short_passing":6,"long_passing":5,"shooting":3,"finishing":3,"dribbling":5,"crossing":4,"heading":6,"one_vs_one":5},
      "tactical":{"positioning":9,"decision_making":8,"game_awareness":8,"off_ball_movement":6,"defensive_awareness":8},
      "physical":{"speed":6,"acceleration":6,"agility":8,"balance":8,"strength":7,"stamina":6},
      "mental":{"concentration":9,"confidence":8,"discipline":8,"work_rate":7,"teamwork":7}}'::jsonb,
    'Надёжный вратарь, отличная реакция и позиционирование.'
FROM users u WHERE u.clerk_id = 'clerk_roster_4'
AND NOT EXISTS (SELECT 1 FROM player_evaluations pe WHERE pe.player_id = u.id AND pe.date = '2026-07-25');

INSERT INTO player_evaluations (player_id, coach_id, team_id, date, categories, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'aubakirovajtuar@gmail.com'), (SELECT id FROM teams WHERE name = 'OpenSport FC U19'),
    '2026-07-18',
    '{"technical":{"first_touch":5,"ball_control":5,"short_passing":6,"long_passing":5,"shooting":6,"finishing":6,"dribbling":6,"crossing":5,"heading":5,"one_vs_one":5},
      "tactical":{"positioning":6,"decision_making":5,"game_awareness":6,"off_ball_movement":6,"defensive_awareness":5},
      "physical":{"speed":8,"acceleration":8,"agility":6,"balance":5,"strength":5,"stamina":7},
      "mental":{"concentration":5,"confidence":6,"discipline":6,"work_rate":7,"teamwork":6}}'::jsonb,
    'Быстрый, но нужно поработать над принятием решений в финальной трети.'
FROM users u WHERE u.clerk_id = 'clerk_roster_7'
AND NOT EXISTS (SELECT 1 FROM player_evaluations pe WHERE pe.player_id = u.id AND pe.date = '2026-07-18');
