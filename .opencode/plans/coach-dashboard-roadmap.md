# Coach Dashboard — Полный Roadmap

## Легенда
- ✅ = сделано (UI скелет)
- 🔲 = не сделано

---

## Фаза 0: Database Migrations (новые таблицы)

### 0.1 `matches` — таблица матчей
```sql
create table public.matches (
    id uuid primary key default gen_random_uuid(),
    team_id uuid references public.teams(id) on delete cascade not null,
    date date not null,
    time time not null,
    opponent text not null,
    home_away text check (home_away in ('home','away')) not null,
    competition text,
    match_type text check (match_type in ('league','cup','friendly','tournament')) default 'league',
    location text,
    score_home integer,
    score_away integer,
    video_url text,
    notes text,
    starting_xi uuid[] default '{}',
    substitutes uuid[] default '{}',
    status text check (status in ('scheduled','completed','cancelled')) default 'scheduled',
    created_by uuid references public.users(id),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
-- RLS: coach can CRUD on their team's matches
-- RLS: player can read their team's matches
```

### 0.2 `player_match_stats` — статистика игрока за матч
```sql
create table public.player_match_stats (
    id uuid primary key default gen_random_uuid(),
    match_id uuid references public.matches(id) on delete cascade not null,
    player_id uuid references public.users(id) on delete cascade not null,
    minutes integer default 0,
    goals integer default 0,
    assists integer default 0,
    yellow_cards integer default 0,
    red_cards integer default 0,
    coach_rating numeric(3,1) check (coach_rating >= 0 and coach_rating <= 10),
    source text check (source in ('manual','coach','opensport_ai','match','training','import')) default 'coach',
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(match_id, player_id)
);
-- RLS: coach CRUD, player read
```

### 0.3 `player_evaluations` — детальные оценки тренера
```sql
create table public.player_evaluations (
    id uuid primary key default gen_random_uuid(),
    player_id uuid references public.users(id) on delete cascade not null,
    coach_id uuid references public.users(id) on delete cascade not null,
    team_id uuid references public.teams(id) on delete cascade not null,
    date date not null default current_date,
    categories jsonb not null, -- полная структура EvaluationCategories
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
-- categories jsonb хранит:
-- {"technical": {"first_touch": 7, ...}, "tactical": {...}, "physical": {...}, "mental": {...}}
```

### 0.4 `training_sessions` — тренировочные сессии
```sql
create table public.training_sessions (
    id uuid primary key default gen_random_uuid(),
    team_id uuid references public.teams(id) on delete cascade not null,
    coach_id uuid references public.users(id) on delete cascade not null,
    name text not null,
    date date not null,
    time time not null,
    duration_minutes integer not null,
    location text,
    objective text,
    status text check (status in ('scheduled','completed','cancelled')) default 'scheduled',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

### 0.5 `training_session_exercises` — упражнения внутри сессии
```sql
create table public.training_session_exercises (
    id uuid primary key default gen_random_uuid(),
    session_id uuid references public.training_sessions(id) on delete cascade not null,
    name text not null,
    category text,
    duration_minutes integer not null,
    notes text,
    "order" integer not null,
    created_at timestamptz default now()
);
```

### 0.6 `training_session_players` — связь игроков с сессией
```sql
create table public.training_session_players (
    id uuid primary key default gen_random_uuid(),
    session_id uuid references public.training_sessions(id) on delete cascade not null,
    player_id uuid references public.users(id) on delete cascade not null,
    status text check (status in ('assigned','completed','missed')) default 'assigned',
    exercises_completed integer default 0,
    duration_minutes integer,
    xp_earned integer default 0,
    unique(session_id, player_id)
);
```

### 0.7 `training_plans` — multi-week планы
```sql
create table public.training_plans (
    id uuid primary key default gen_random_uuid(),
    team_id uuid references public.teams(id) on delete cascade not null,
    coach_id uuid references public.users(id) on delete cascade not null,
    name text not null,
    assigned_to text check (assigned_to in ('individual','selected','team')) default 'team',
    player_ids uuid[] default '{}',
    start_date date not null,
    end_date date not null,
    status text check (status in ('active','completed')) default 'active',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

### 0.8 `training_plan_sessions` — связь планов с сессиями
```sql
create table public.training_plan_sessions (
    id uuid primary key default gen_random_uuid(),
    plan_id uuid references public.training_plans(id) on delete cascade not null,
    session_id uuid references public.training_sessions(id) on delete cascade not null,
    "order" integer,
    unique(plan_id, session_id)
);
```

### 0.9 `exercises` — библиотека упражнений
```sql
create table public.exercises (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    category text not null,
    skill text,
    difficulty text check (difficulty in ('beginner','intermediate','advanced')) default 'beginner',
    duration_minutes integer,
    min_players integer default 1,
    equipment text[] default '{}',
    description text,
    created_at timestamptz default now()
);
```

### 0.10 `player_flags` — флаги игроков (персистентные)
```sql
create table public.player_flags (
    id uuid primary key default gen_random_uuid(),
    player_id uuid references public.users(id) on delete cascade not null,
    coach_id uuid references public.users(id) on delete cascade not null,
    type text check (type in ('watch','needs_improvement','injured','high_potential','rest')) not null,
    note text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(player_id, coach_id, type) -- один флаг каждого типа на игрока
);
```

### 0.11 `metric_observations` — универсальная таблица для всех статов с provenance
```sql
create table public.metric_observations (
    id uuid primary key default gen_random_uuid(),
    player_id uuid references public.users(id) on delete cascade not null,
    metric text not null,
    value numeric not null,
    source text check (source in ('coach_manual','opensport_ai','match','training','import')) not null,
    context text, -- 'match:<match_id>', 'evaluation:<eval_id>', 'training:<session_id>', etc.
    recorded_at timestamptz default now(),
    created_by uuid references public.users(id)
);
```

### 0.12 Добавить колонки в `teams`
```sql
alter table public.teams add column if not exists logo_url text;
alter table public.teams add column if not exists city text;
alter table public.teams add column if not exists country text;
```

### Проверка Фазы 0
- [ ] `npx supabase db diff` — проверить что миграции корректны
- [ ] `npx supabase db push` — применить миграции
- [ ] Проверить RLS политики для каждой таблицы
- [ ] `npx tsc --noEmit` — типы должны соответствовать

---

## Фаза 1: Edge Functions (CRUD API)

### 1.1 `create-match` — создание матча
- Валидация: обязательные поля (team_id, date, time, opponent)
- Создаёт запись в `matches`
- Опционально: если статус "completed" — создаёт `player_match_stats` для каждого игрока

### 1.2 `update-match-stats` — обновление/создание статов игроков за матч
- Принимает `match_id` + массив `{player_id, minutes, goals, assists, yc, rc, coach_rating}`
- Upsert в `player_match_stats` (source = 'coach' | 'manual')
- Также пишет в `metric_observations`

### 1.3 `create-evaluation` — создание оценки игрока
- Валидация: player_id, coach_id, team_id, categories
- Сохраняет в `player_evaluations`
- Пишет метрики в `metric_observations` с source = 'coach_manual'

### 1.4 `create-training-session` — создание тренировки
- Создаёт `training_sessions`
- Создаёт `training_session_exercises` (mass insert)
- Создаёт `training_session_players` для каждого assigned_player
- Если назначен план — связывает через `training_plan_sessions`

### 1.5 `complete-training-session` — отметка тренировки как завершённой
- Обновляет статус
- Для каждого `training_session_players` обновляет exercises_completed, duration_minutes, xp_earned
- Начисляет XP игрокам (обновляет `player_progress`)

### 1.6 `manage-flags` — создание/удаление флагов
- POST: upsert в `player_flags`
- DELETE: удаляет флаг по id
- GET: возвращает флаги для team_id

### 1.7 `get-team-stats` — агрегированная статистика по команде
- Возвращает `ExtendedPlayerStats[]` для всех игроков команды
- Собирает из: `player_match_stats`, `training_session_players`, `player_evaluations`, `metric_observations`, `analyses`

### 1.8 `get-coach-data` — полный слепок данных для Coach Dashboard
- Возвращает: команды, состав, матчи, тренировки, оценки, флаги, упражнения, события
- Один endpoint для инициализации дашборда

### Проверка Фазы 1
- [ ] Проверить статус ответа (200/400/404/500)
- [ ] Проверить валидацию входных данных
- [ ] Проверить изоляцию между командами (coach не может менять данные чужой команды)
- [ ] `supabase functions serve` — локальный тест
- [ ] Все edge функции используют `SERVICE_ROLE_SECRET_KEY` (не `SUPABASE_SERVICE_ROLE_KEY`)

---

## Фаза 2: Frontend — Switch from Mocks to Supabase

### 2.1 `src/hooks/useCoachData.ts` — главный хук данных
```typescript
function useCoachData(teamId: string) {
    // Вызывает get-coach-data edge function
    // Возвращает { matches, squad, trainingSessions, evaluations, flags, stats, exercises, upcoming }
    // DEMO: fallback to mock data
    // Caching: staleTime 30s, refetchInterval 10s (для матчей в реальном времени)
}
```

### 2.2 OverviewTab — интеграция с Supabase
- Заменить `MOCK_SQUAD` → `useCoachData().squad`
- Заменить `MOCK_UPCOMING` → вычислять из upcoming matches + training sessions
- Заменить `MOCK_FLAGS` → `useCoachData().flags`
- Team selector: загружать команды из `get-coach-data`
- Кнопка "Create Team" → вызывает регистрацию в Supabase (уже работает)

### 2.3 SquadTab — интеграция с Supabase
- Заменить `squadData` state → `useCoachData().squad`
- commitEdit → вызывает `update-match-stats` edge function
- Source badges: читать из `metric_observations` где source = 'coach_manual'

### 2.4 StatisticsTab — интеграция
- Заменить `MOCK_EXTENDED_STATS` → `get-team-stats` edge function
- AI колонки берутся из последних `analyses` для каждого игрока

### 2.5 MatchesTab — интеграция
- Список матчей → `useCoachData().matches`
- "New Match" → вызывает `create-match` edge function
- Редактирование статов → `update-match-stats` edge function
- Стартовый состав/запасные: выбирать из `useCoachData().squad` с checkbox

### 2.6 EvaluationsTab — интеграция
- Список → `useCoachData().evaluations`
- AI Scores → читать из последних `analyses` для каждого игрока
- "Save Evaluation" → вызывает `create-evaluation` edge function

### 2.7 TrainingTab — интеграция
- Sessions → `useCoachData().trainingSessions`
- Create Session → `create-training-session` edge function
- Complete → `complete-training-session` edge function
- Exercises → `useCoachData().exercises`
- Plans → `useCoachData().trainingPlans`

### 2.8 Flags — интеграция
- Заменить локальный `playerFlags` state → `useCoachData().flags`
- Toggle flag → `manage-flags` edge function (POST/DELETE)
- Notes → добавить поле в UI формы

### Проверка Фазы 2
- [ ] Все табы работают без моков (кроме demo)
- [ ] DEMO mode продолжает использовать мок-данные
- [ ] `useDemoMutationGuard()` показывает toast при попытке мутации в demo
- [ ] После мутации queryClient.invalidateQueries() для свежих данных

---

## Фаза 3: Drag-and-Drop в Training Builder

### 3.1 Установить `@dnd-kit/core` и `@dnd-kit/sortable`
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 3.2 Переписать TrainingBuilder
- Использовать `DndContext`, `SortableContext`, `useSortable`
- Exercise Blocks перетаскиваются внутри сессии
- Можно добавить упражнение из Exercise Library через `useDraggable`

### 3.3 Exercise Library → Session
- Кнопка "Add to Training" открывает диалог выбора сессии
- Или drag-and-drop из библиотеки прямо в Training Builder

### Проверка Фазы 3
- [ ] Порядок упражнений сохраняется (send order array to API)
- [ ] После перетаскивания обновляется `"order"` поле

---

## Фаза 4: Player Profile Page (`/player/:id`)

### 4.1 `src/pages/PlayerProfile.tsx`
- Новый роут: `/player/:id` (ProtectedRoute)
- Использует `useCoachData()` для получения данных игрока

### 4.2 6 вкладок
1. **Overview** — существующий `PlayerProfileOverlay` (видео, AI анализ, метрики)
2. **Performance** — таблица из `ExtendedPlayerStats` (матчи, атака, защита, AI)
3. **Matches** — история матчей игрока с его статами
4. **Training** — прогресс тренировок (из `training_session_players` + `player_progress`)
5. **Evaluation** — история оценок тренера
6. **Videos** — все видео игрока (из `videos` таблицы)

### 4.3 Флаги на странице профиля
- Отображать текущие флаги
- Кнопка "Add Flag" для тренера

### Проверка Фазы 4
- [ ] `/player/:id` доступен для coach
- [ ] `/demo/player/:id` работает
- [ ] Выход из профиля → назад в CoachDashboard с сохранённым tab

---

## Фаза 5: Training Sync (Coach → Player)

### 5.1 Player Training Center — отображение назначенных тренировок
- В `Training.tsx` (Player) добавить секцию "Coach Assignments"
- Запрос: `training_session_players` где `player_id = current_user`
- Показывать: название, дата, статус, завершённые упражнения

### 5.2 Комплит тренировки игроком
- В Player-стороне: кнопка "Mark Completed"
- Вызывает `complete-training-session` edge function
- Обновляет `training_session_players.status`, начисляет XP

### 5.3 Coach Dashboard — просмотр завершения
- В Training Sessions карточке: статус выполнения для каждого игрока
- Зелёный/жёлтый/красный индикатор

### Проверка Фазы 5
- [ ] Player видит назначенные тренировки
- [ ] После завершения, Coach видит обновлённый статус
- [ ] XP начисляются корректно

---

## Фаза 6: Стартовый состав — интерактивный выбор

### 6.1 Starting XI Selector (drag-to-order)
- Поле выбора: 11 игроков из состава
- Drag-and-drop для расстановки
- Остальные игроки → Substitutes

### 6.2 Формация
- Выбор формации: 4-4-2, 4-3-3, 3-5-2, etc.
- Визуальное отображение на поле (svg grid)

### Проверка Фазы 6
- [ ] starting_xi и substitutes сохраняются в `matches` таблице
- [ ] Формация не обязательна (опционально)

---

## Фаза 7: Привязка к существующим данным

### 7.1 Roster → Coach Dashboard синхронизация
- Игроки из `team_rosters` автоматически появляются в SquadTab
- Их AI Score берётся из `global_rankings` view или последнего `analyses`

### 7.2 Coach Notes — перенос флагов
- Использовать существующую `coach_notes` таблицу
- Или новую `player_flags` (более строгая типизация)

### Проверка Фазы 7
- [ ] При добавлении игрока в команду, он появляется в Squad
- [ ] При удалении — пропадает

---

## Фаза 8: Очистка кода и оптимизация

### 8.1 Удалить устаревшие компоненты
- `src/components/ranking/*` — если не используется Coach Dashboard
- Старые импорты из CoachDashboard неиспользуемых хуков

### 8.2 Размер бандла
- Динамический импорт для тяжёлых табов (Training, Statistics)
- `React.lazy()` для каждого таба

### 8.3 Оптимизация запросов
- Debounce поиска (300ms)
- Pagination для больших списков (50+ игроков)
- Batch updates для массового редактирования статов

---

## Итоговый чеклист

```
Фаза 0: ✅ SQL миграции (11 таблиц + alter)
Фаза 1: ✅ Edge Functions (6/8 — upsert-match-stats, upsert-evaluation, create-training-session, get-team-squad, get-team-matches, get-player-evaluations)
         🔲 Ещё: complete-training-session, manage-flags, get-team-stats
Фаза 2: ✅ Frontend → Supabase (все 6 табов + useCoachData hook)
Фаза 3: 🔲 Drag-and-drop Training Builder
Фаза 4: 🔲 Player Profile page (/player/:id)
Фаза 5: 🔲 Training Sync (Coach → Player)
Фаза 6: 🔲 Interactive Starting XI
Фаза 7: 🔲 Привязка к существующим данным
Фаза 8: 🔲 Cleanup & Performance
```

Начало — **Фаза 0**. Первый шаг: написать SQL миграцию для всех 11 таблиц + RLS политики + типы TypeScript.