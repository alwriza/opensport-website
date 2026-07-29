import { TeamMember, Match, PlayerMatchStat, PlayerEvaluation, TrainingSession, TrainingPlan, Exercise, PlayerFlag, ExtendedPlayerStats, UpcomingEvent, MetricSource } from "@/types/coach";

const firstNames = ["Абылай","Алишер","Арман","Батыр","Дамир","Данияр","Ержан","Ернар","Жандос","Ильяс","Максат","Марат","Нұрлан","Олжас","Рахат","Руслан","Санжар","Тимур","Азамат","Бекжан"];
const lastNames = ["Серік","Омаров","Ахметов","Кусаинов","Нурмагамбетов","Искаков","Турсынбаев","Садыков","Абдрахманов","Бекетаев","Жапаров","Закиров","Ибраев","Нурпеисов","Шарипов"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

const positions = ["GK","DEF","DEF","DEF","DEF","MID","MID","MID","FWD","FWD"];

const MOCK_SQUAD: TeamMember[] = Array.from({ length: 15 }, (_, i) => ({
    id: `member-${i + 1}`,
    player_id: `player-${i + 1}`,
    name: `${pick(firstNames)} ${pick(lastNames)}`,
    avatar_url: null,
    position: positions[i % positions.length],
    age: rand(15, 19),
    team_id: "team-1",
    jersey_number: i + 1,
    status: i < 13 ? "active" as const : "pending" as const,
    starts: rand(3, 12),
    appearances: rand(5, 15),
    goals: rand(0, 8),
    penalties: rand(0, 2),
    assists: rand(0, 6),
    yellow_cards: rand(0, 4),
    red_cards: rand(0, 1),
    coach_rating: rand(5, 10),
    stat_sources: {
        starts: "coach" as MetricSource,
        appearances: "coach" as MetricSource,
        goals: "coach" as MetricSource,
        penalties: "manual" as MetricSource,
        assists: "coach" as MetricSource,
        yellow_cards: "manual" as MetricSource,
        red_cards: "manual" as MetricSource,
        coach_rating: "coach" as MetricSource,
    },
}));

const MOCK_MATCHES: Match[] = [
    { id: "match-1", team_id: "team-1", date: "2026-07-20", time: "18:00", opponent: "FC Astana", home_away: "home", competition: "U18 League", match_type: "league", location: "Astana Arena", score_home: 3, score_away: 1, video_url: null, notes: "Strong performance", starting_xi: ["player-1","player-2","player-3","player-4","player-5","player-6","player-7","player-8","player-9","player-10","player-11"], substitutes: ["player-12","player-13"], status: "completed" },
    { id: "match-2", team_id: "team-1", date: "2026-07-27", time: "16:30", opponent: "Kairat Academy", home_away: "away", competition: "U18 League", match_type: "league", location: "Kairat Stadium", score_home: null, score_away: null, video_url: null, notes: null, starting_xi: [], substitutes: [], status: "scheduled" },
    { id: "match-3", team_id: "team-1", date: "2026-07-13", time: "19:00", opponent: "Shakhter U18", home_away: "home", competition: "U18 League", match_type: "league", location: "Home Field", score_home: 1, score_away: 2, video_url: null, notes: "Tough loss, defensive errors", starting_xi: ["player-1","player-2","player-3","player-4","player-5","player-6","player-7","player-8","player-9","player-10","player-11"], substitutes: ["player-14","player-15"], status: "completed" },
    { id: "match-4", team_id: "team-1", date: "2026-07-06", time: "17:00", opponent: "Tobol Youth", home_away: "away", competition: "U18 Cup", match_type: "cup", location: "Tobol Arena", score_home: 0, score_away: 4, video_url: null, notes: "Dominant performance", starting_xi: ["player-1","player-2","player-3","player-4","player-5","player-6","player-7","player-8","player-9","player-10","player-11"], substitutes: ["player-12","player-13","player-14"], status: "completed" },
    { id: "match-5", team_id: "team-1", date: "2026-08-03", time: "15:00", opponent: "Ordabasy U18", home_away: "home", competition: "U18 League", match_type: "league", location: "Home Field", score_home: null, score_away: null, video_url: null, notes: null, starting_xi: [], substitutes: [], status: "scheduled" },
];

const MOCK_MATCH_STATS: PlayerMatchStat[] = MOCK_MATCHES.filter(m => m.status === "completed").flatMap(m =>
    m.starting_xi.map((pid, i) => ({
        id: `ms-${m.id}-${pid}`,
        match_id: m.id,
        player_id: pid,
        player_name: MOCK_SQUAD.find(s => s.player_id === pid)?.name || pid,
        minutes: rand(60, 90),
        goals: rand(0, 2),
        assists: rand(0, 2),
        yellow_cards: rand(0, 1),
        red_cards: 0,
        coach_rating: rand(5, 10),
        source: "coach" as MetricSource,
    }))
);

const MOCK_EVALUATIONS: PlayerEvaluation[] = MOCK_SQUAD.slice(0, 5).map((p, i) => ({
    id: `eval-${i + 1}`,
    player_id: p.player_id,
    player_name: p.name,
    coach_id: "coach-1",
    team_id: "team-1",
    date: ["2026-07-15","2026-07-18","2026-07-19","2026-07-21","2026-07-22"][i],
    notes: ["Good progress","Needs work on passing","Excellent attitude","Raw talent","Consistent performer"][i],
    ai_scores: { stability: rand(60,95), power: rand(60,95), technique: rand(60,95), balance: rand(60,95) },
    categories: {
        technical: { first_touch: rand(5,10), ball_control: rand(5,10), short_passing: rand(5,10), long_passing: rand(5,10), shooting: rand(5,10), finishing: rand(5,10), dribbling: rand(5,10), crossing: rand(5,10), heading: rand(5,10), one_vs_one: rand(5,10) },
        tactical: { positioning: rand(5,10), decision_making: rand(5,10), game_awareness: rand(5,10), off_ball_movement: rand(5,10), defensive_awareness: rand(5,10) },
        physical: { speed: rand(5,10), acceleration: rand(5,10), agility: rand(5,10), balance: rand(5,10), strength: rand(5,10), stamina: rand(5,10) },
        mental: { concentration: rand(5,10), confidence: rand(5,10), discipline: rand(5,10), work_rate: rand(5,10), teamwork: rand(5,10) },
    },
}));

const MOCK_TRAINING_SESSIONS: TrainingSession[] = [
    { id: "ts-1", team_id: "team-1", name: "Позиционная атака", date: "2026-07-28", time: "10:00", duration_minutes: 90, location: "Main Pitch", objective: "Отработка атакующих комбинаций", coach_id: "coach-1", assigned_players: MOCK_SQUAD.slice(0,11).map(s => s.player_id), exercises: [
        { id: "te-1", exercise_id: "ex-1", exercise_name: "Passing Rondo", category: "passing", duration_minutes: 15, notes: "4v2", order: 1 },
        { id: "te-2", exercise_id: "ex-3", exercise_name: "Shooting Drills", category: "shooting", duration_minutes: 25, notes: "Both feet", order: 2 },
        { id: "te-3", exercise_id: "ex-5", exercise_name: "Small-Sided Game", category: "tactical", duration_minutes: 30, notes: "5v5", order: 3 },
    ], status: "scheduled" },
    { id: "ts-2", team_id: "team-1", name: "Защитные построения", date: "2026-07-25", time: "10:00", duration_minutes: 90, location: "Main Pitch", objective: "Отработка оборонительных действий", coach_id: "coach-1", assigned_players: MOCK_SQUAD.slice(0,11).map(s => s.player_id), exercises: [
        { id: "te-4", exercise_id: "ex-2", exercise_name: "Defensive Shape", category: "defensive", duration_minutes: 30, notes: "Back 4", order: 1 },
        { id: "te-5", exercise_id: "ex-6", exercise_name: "Pressing Drill", category: "physical", duration_minutes: 20, notes: "High intensity", order: 2 },
    ], status: "completed" },
    { id: "ts-3", team_id: "team-1", name: "Индивидуальная техника", date: "2026-07-30", time: "09:00", duration_minutes: 60, location: "Training Ground", objective: "Улучшение технических навыков", coach_id: "coach-1", assigned_players: MOCK_SQUAD.slice(0,8).map(s => s.player_id), exercises: [
        { id: "te-6", exercise_id: "ex-4", exercise_name: "Dribbling Circuit", category: "dribbling", duration_minutes: 20, notes: "Cone drills", order: 1 },
        { id: "te-7", exercise_id: "ex-7", exercise_name: "First Touch", category: "technical", duration_minutes: 20, notes: "Various heights", order: 2 },
        { id: "te-8", exercise_id: "ex-8", exercise_name: "Ball Control", category: "technical", duration_minutes: 20, notes: "Close control", order: 3 },
    ], status: "scheduled" },
];

const MOCK_TRAINING_PLANS: TrainingPlan[] = [
    { id: "tp-1", name: "Pre-Season Camp", team_id: "team-1", team_name: "U18 Team Alpha", coach_id: "coach-1", assigned_to: "team", player_ids: MOCK_SQUAD.map(s => s.player_id), session_ids: ["ts-1","ts-2","ts-3"], start_date: "2026-07-25", end_date: "2026-07-31", status: "active" },
    { id: "tp-2", name: "Finishing Focus", team_id: "team-1", team_name: "U18 Team Alpha", coach_id: "coach-1", assigned_to: "selected", player_ids: ["player-9","player-10","player-11"], session_ids: ["ts-3"], start_date: "2026-08-01", end_date: "2026-08-14", status: "active" },
];

const MOCK_EXERCISES: Exercise[] = [
    { id: "ex-1", name: "Passing Rondo", category: "passing", skill: "short_passing", difficulty: "intermediate", duration_minutes: 15, min_players: 4, equipment: ["cones","balls"], description: "4v2 possession game in a circle" },
    { id: "ex-2", name: "Defensive Shape", category: "defensive", skill: "positioning", difficulty: "advanced", duration_minutes: 30, min_players: 8, equipment: ["cones","pinnies"], description: "Team defensive organization drill" },
    { id: "ex-3", name: "Shooting Drills", category: "shooting", skill: "shooting", difficulty: "intermediate", duration_minutes: 25, min_players: 2, equipment: ["balls","goals","cones"], description: "Finishing from various positions" },
    { id: "ex-4", name: "Dribbling Circuit", category: "dribbling", skill: "dribbling", difficulty: "beginner", duration_minutes: 20, min_players: 1, equipment: ["cones","balls"], description: "Slalom dribbling through cones" },
    { id: "ex-5", name: "Small-Sided Game", category: "tactical", skill: "game_awareness", difficulty: "advanced", duration_minutes: 30, min_players: 10, equipment: ["pinnies","goals","balls"], description: "5v5 or 7v7 scrimmage" },
    { id: "ex-6", name: "Pressing Drill", category: "physical", skill: "stamina", difficulty: "advanced", duration_minutes: 20, min_players: 6, equipment: ["cones","pinnies"], description: "High-intensity pressing patterns" },
    { id: "ex-7", name: "First Touch", category: "technical", skill: "ball_control", difficulty: "beginner", duration_minutes: 20, min_players: 1, equipment: ["balls","wall"], description: "First touch control from various heights" },
    { id: "ex-8", name: "Ball Control", category: "technical", skill: "ball_control", difficulty: "intermediate", duration_minutes: 20, min_players: 1, equipment: ["balls","cones"], description: "Close ball control through obstacles" },
    { id: "ex-9", name: "Crossing & Finishing", category: "shooting", skill: "crossing", difficulty: "intermediate", duration_minutes: 25, min_players: 4, equipment: ["balls","goals","cones"], description: "Wide crosses with near-post and far-post runs" },
    { id: "ex-10", name: "Interval Sprints", category: "physical", skill: "speed", difficulty: "advanced", duration_minutes: 15, min_players: 1, equipment: ["cones","stopwatch"], description: "High-intensity interval running" },
];

const MOCK_FLAGS: PlayerFlag[] = [
    { id: "flag-1", player_id: "player-3", player_name: MOCK_SQUAD[2].name, type: "high_potential", note: "Top prospect for academy selection", created_at: "2026-07-10" },
    { id: "flag-2", player_id: "player-7", player_name: MOCK_SQUAD[6].name, type: "injured", note: "Ankle sprain, estimated return 2 weeks", created_at: "2026-07-22" },
    { id: "flag-3", player_id: "player-10", player_name: MOCK_SQUAD[9].name, type: "watch", note: "Inconsistent form, monitor closely", created_at: "2026-07-15" },
    { id: "flag-4", player_id: "player-5", player_name: MOCK_SQUAD[4].name, type: "needs_improvement", note: "Stamina needs work", created_at: "2026-07-18" },
    { id: "flag-5", player_id: "player-12", player_name: MOCK_SQUAD[11].name, type: "rest", note: "Minor fatigue, reduce workload", created_at: "2026-07-24" },
];

const MOCK_EXTENDED_STATS: ExtendedPlayerStats[] = MOCK_SQUAD.slice(0, 13).map((p, i) => ({
    player_id: p.player_id,
    name: p.name,
    position: p.position,
    age: p.age,
    games: rand(5, 10),
    starts: rand(3, 9),
    minutes: rand(270, 900),
    wins: rand(2, 6),
    draws: rand(1, 3),
    losses: rand(1, 4),
    goals: rand(0, 6),
    assists: rand(0, 5),
    shots: rand(5, 30),
    shots_on_target: rand(3, 18),
    yellow_cards: rand(0, 3),
    red_cards: rand(0, 1),
    training_sessions: rand(8, 15),
    training_minutes: rand(480, 1350),
    exercises_completed: rand(20, 60),
    ai_score: rand(60, 95),
    ai_passing: rand(55, 92),
    ai_shooting: rand(50, 88),
    ai_dribbling: rand(55, 90),
    ai_balance: rand(60, 92),
    ai_stability: rand(55, 90),
    improvement_pct: rand(-5, 15),
}));

const MOCK_UPCOMING: UpcomingEvent[] = [
    { id: "ue-1", type: "training", title: "Позиционная атака", date: "2026-07-28", time: "10:00", location: "Main Pitch" },
    { id: "ue-2", type: "match", title: " vs Kairat Academy", date: "2026-07-27", time: "16:30", opponent: "Kairat Academy", home_away: "away" },
    { id: "ue-3", type: "training", title: "Индивидуальная техника", date: "2026-07-30", time: "09:00", location: "Training Ground" },
    { id: "ue-4", type: "match", title: " vs Ordabasy U18", date: "2026-08-03", time: "15:00", opponent: "Ordabasy U18", home_away: "home" },
];

export {
    MOCK_SQUAD, MOCK_MATCHES, MOCK_MATCH_STATS, MOCK_EVALUATIONS,
    MOCK_TRAINING_SESSIONS, MOCK_TRAINING_PLANS, MOCK_EXERCISES,
    MOCK_FLAGS, MOCK_EXTENDED_STATS, MOCK_UPCOMING,
};
