-- ============================================================
-- SEED TRAINING PLANS — 2 плана тренировок для команды,
-- привязанные к уже существующим тренировкам (training_sessions)
-- через join-таблицу training_plan_sessions.
-- ============================================================

DO $$
DECLARE
    my_team_id UUID;
    my_coach_id UUID;
    plan1_id UUID;
    plan2_id UUID;
BEGIN

SELECT id INTO my_team_id FROM teams WHERE name = 'OpenSport FC U19';
SELECT id INTO my_coach_id FROM users WHERE email = 'aubakirovajtuar@gmail.com';

IF my_team_id IS NULL OR my_coach_id IS NULL THEN
    RAISE EXCEPTION 'Команда или тренер не найдены — сначала выполни seed_data.sql.';
END IF;

INSERT INTO training_plans (team_id, coach_id, name, assigned_to, player_ids, start_date, end_date, status)
SELECT my_team_id, my_coach_id, 'Предсезонный сбор', 'team', '{}', '2026-07-25', '2026-08-10', 'active'
WHERE NOT EXISTS (SELECT 1 FROM training_plans WHERE team_id = my_team_id AND name = 'Предсезонный сбор')
RETURNING id INTO plan1_id;

IF plan1_id IS NULL THEN
    SELECT id INTO plan1_id FROM training_plans WHERE team_id = my_team_id AND name = 'Предсезонный сбор';
END IF;

INSERT INTO training_plan_sessions (plan_id, session_id, "order")
SELECT plan1_id, ts.id, row_number() OVER (ORDER BY ts.date)
FROM training_sessions ts WHERE ts.team_id = my_team_id
ON CONFLICT (plan_id, session_id) DO NOTHING;

INSERT INTO training_plans (team_id, coach_id, name, assigned_to, player_ids, start_date, end_date, status)
SELECT my_team_id, my_coach_id, 'Индивидуальная работа: атака', 'selected',
    (SELECT array_agg(id) FROM users WHERE clerk_id IN ('clerk_roster_1','clerk_roster_7','clerk_roster_10')),
    '2026-08-01', '2026-08-15', 'active'
WHERE NOT EXISTS (SELECT 1 FROM training_plans WHERE team_id = my_team_id AND name = 'Индивидуальная работа: атака')
RETURNING id INTO plan2_id;

IF plan2_id IS NULL THEN
    SELECT id INTO plan2_id FROM training_plans WHERE team_id = my_team_id AND name = 'Индивидуальная работа: атака';
END IF;

INSERT INTO training_plan_sessions (plan_id, session_id, "order")
SELECT plan2_id, ts.id, 1
FROM training_sessions ts WHERE ts.team_id = my_team_id AND ts.name = 'Позиционная атака'
ON CONFLICT (plan_id, session_id) DO NOTHING;

RAISE NOTICE 'Training plans seeded: % and %', plan1_id, plan2_id;

END $$;
