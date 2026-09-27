-- ============================================================
-- SEED DUELS — один завершённый дуэль с реально проигрываемым видео
-- с обеих сторон (оба видео указывают на один и тот же уже
-- загруженный файл в storage, так как остальные mock-видео —
-- это синтетические пути без реального файла).
-- ВАЖНО: таблица `duels` управляется не из файлов миграций этого
-- репозитория (создана напрямую в Supabase), поэтому её RLS-политики
-- не проверены отсюда — если дуэль не появится в интерфейсе после
-- вставки, вероятно там та же проблема auth.uid() vs users.id,
-- которую мы чинили для matches/training/evaluations — скажи мне.
-- ============================================================

DO $$
DECLARE
    my_user_id UUID;
    opponent_user_id UUID;
    my_video_id UUID;
    opponent_video_id UUID;
BEGIN

SELECT id INTO my_user_id FROM users WHERE email = 'aubakirovajtuar@gmail.com';
IF my_user_id IS NULL THEN
    RAISE EXCEPTION 'Пользователь с email aubakirovajtuar@gmail.com не найден.';
END IF;

SELECT id INTO opponent_user_id FROM users WHERE clerk_id = 'clerk_roster_2';
IF opponent_user_id IS NULL THEN
    RAISE EXCEPTION 'Роастер-игрок clerk_roster_2 не найден — сначала выполни seed_data.sql.';
END IF;

SELECT id INTO my_video_id FROM videos WHERE user_id = my_user_id ORDER BY uploaded_at DESC LIMIT 1;
IF my_video_id IS NULL THEN
    INSERT INTO videos (user_id, storage_path, filename, duration, file_size_mb, status, uploaded_at)
    VALUES (my_user_id, 'bd5aa96f-6963-4067-99c4-80e474064a3f.mp4', 'duel-my-clip.mp4', 45, 15.2, 'completed', NOW() - INTERVAL '2 days')
    RETURNING id INTO my_video_id;
END IF;

-- Второе видео для оппонента: тот же реальный файл в storage, чтобы оно реально проигрывалось
INSERT INTO videos (user_id, storage_path, filename, duration, file_size_mb, status, uploaded_at)
SELECT opponent_user_id, 'bd5aa96f-6963-4067-99c4-80e474064a3f.mp4', 'duel-opponent-clip.mp4', 40, 12.0, 'completed', NOW() - INTERVAL '3 days'
WHERE NOT EXISTS (
    SELECT 1 FROM videos WHERE user_id = opponent_user_id AND filename = 'duel-opponent-clip.mp4'
)
RETURNING id INTO opponent_video_id;

IF opponent_video_id IS NULL THEN
    SELECT id INTO opponent_video_id FROM videos WHERE user_id = opponent_user_id AND filename = 'duel-opponent-clip.mp4';
END IF;

INSERT INTO duels (challenger_id, opponent_id, challenger_video_id, opponent_video_id, challenger_score, opponent_score, status, winner_id, deadline_at, completed_at)
SELECT my_user_id, opponent_user_id, my_video_id, opponent_video_id, 87.3, 82.1, 'completed', my_user_id, NULL, NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (
    SELECT 1 FROM duels WHERE challenger_id = my_user_id AND opponent_id = opponent_user_id AND status = 'completed'
);

RAISE NOTICE 'Duel seeded between % and %', my_user_id, opponent_user_id;

END $$;
