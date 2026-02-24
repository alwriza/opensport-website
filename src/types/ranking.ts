// OpenSport v2.0 — Ranking Types

export interface PlayerRankingEntry {
    user_id: string;
    overall_score: number;
    total_analyses: number;
    rank_position: number;
    percentile: number;
    last_updated: string;
}

/** Shadow leaderboard row (Player view — no identifying info) */
export interface ShadowLeaderboardRow {
    rank: number;
    /** Anonymised ID like "Player #8492" */
    player_hash: string;
    score: number;
    /** True if this is the current user's row */
    is_current_user: boolean;
}

/** Full leaderboard row (Individual view — real player info) */
export interface FullLeaderboardRow {
    rank: number;
    user_id: string;
    name: string;
    photo_url: string | null;
    age: number | null;
    position: string | null;
    city: string | null;
    country: string | null;
    score: number;
    is_in_watchlist: boolean;
}

export interface RankingPosition {
    rank: number;
    total_players: number;
    percentile: number;
    weekly_change: number;
    score: number;
}

export interface RankingBenchmarks {
    top_1_percent: number;
    top_10_percent: number;
    top_25_percent: number;
    average: number;
    your_score: number;
}

export interface RankingFilters {
    position?: string;
    age_category?: string;
    country?: string;
    city?: string;
    /** PRO only */
    min_score?: number;
    /** PRO only */
    max_score?: number;
}
