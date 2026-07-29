export type MetricSource = "manual" | "coach" | "opensport_ai" | "import";

export interface TeamMember {
    id: string;
    player_id: string;
    name: string;
    avatar_url: string | null;
    position: string;
    age: number;
    team_id: string;
    jersey_number: number | null;
    status: "active" | "pending";
    starts: number;
    appearances: number;
    goals: number;
    penalties: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
    coach_rating: number;
    stat_sources: Record<string, MetricSource>;
}

export interface Match {
    id: string;
    team_id: string;
    date: string;
    time: string;
    opponent: string;
    home_away: "home" | "away";
    competition: string;
    match_type: "league" | "cup" | "friendly" | "tournament";
    location: string;
    score_home: number | null;
    score_away: number | null;
    video_url: string | null;
    notes: string | null;
    starting_xi: string[];
    substitutes: string[];
    status: "scheduled" | "completed" | "cancelled";
}

export interface PlayerMatchStat {
    id: string;
    match_id: string;
    player_id: string;
    player_name: string;
    minutes: number;
    goals: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
    coach_rating: number;
    source: MetricSource;
}

export interface PlayerEvaluation {
    id: string;
    player_id: string;
    player_name: string;
    coach_id: string;
    team_id: string;
    date: string;
    notes: string;
    ai_scores: Record<string, number>;
    categories: EvaluationCategories;
}

export interface EvaluationCategories {
    technical: {
        first_touch: number;
        ball_control: number;
        short_passing: number;
        long_passing: number;
        shooting: number;
        finishing: number;
        dribbling: number;
        crossing: number;
        heading: number;
        one_vs_one: number;
    };
    tactical: {
        positioning: number;
        decision_making: number;
        game_awareness: number;
        off_ball_movement: number;
        defensive_awareness: number;
    };
    physical: {
        speed: number;
        acceleration: number;
        agility: number;
        balance: number;
        strength: number;
        stamina: number;
    };
    mental: {
        concentration: number;
        confidence: number;
        discipline: number;
        work_rate: number;
        teamwork: number;
    };
}

export interface TrainingSession {
    id: string;
    team_id: string;
    name: string;
    date: string;
    time: string;
    duration_minutes: number;
    location: string;
    objective: string;
    coach_id: string;
    assigned_players: string[];
    exercises: TrainingExerciseBlock[];
    status: "scheduled" | "completed" | "cancelled";
}

export interface TrainingExerciseBlock {
    id: string;
    exercise_id: string;
    exercise_name: string;
    category: string;
    duration_minutes: number;
    notes: string;
    order: number;
}

export interface TrainingPlan {
    id: string;
    name: string;
    team_id: string;
    team_name: string;
    coach_id: string;
    assigned_to: "individual" | "selected" | "team";
    player_ids: string[];
    session_ids: string[];
    start_date: string;
    end_date: string;
    status: "active" | "completed";
}

export interface PlayerFlag {
    id: string;
    player_id: string;
    player_name: string;
    type: "watch" | "needs_improvement" | "injured" | "high_potential" | "rest";
    note: string;
    created_at: string;
}

export interface ExtendedPlayerStats {
    player_id: string;
    name: string;
    position: string;
    age: number;
    games: number;
    starts: number;
    minutes: number;
    wins: number;
    draws: number;
    losses: number;
    goals: number;
    assists: number;
    shots: number;
    shots_on_target: number;
    yellow_cards: number;
    red_cards: number;
    training_sessions: number;
    training_minutes: number;
    exercises_completed: number;
    ai_score: number;
    ai_passing: number;
    ai_shooting: number;
    ai_dribbling: number;
    ai_balance: number;
    ai_stability: number;
    improvement_pct: number;
}

export interface Exercise {
    id: string;
    name: string;
    category: string;
    skill: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    duration_minutes: number;
    min_players: number;
    equipment: string[];
    description: string;
}

export interface UpcomingEvent {
    id: string;
    type: "training" | "match";
    title: string;
    date: string;
    time: string;
    location?: string;
    opponent?: string;
    home_away?: "home" | "away";
}
