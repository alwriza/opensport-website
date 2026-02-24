// OpenSport v2.0 — Watchlist & Alerts Types

export interface WatchlistEntry {
    id: string;
    scout_id: string;
    player_id: string;
    notes: string | null;
    created_at: string;
    /** Player info joined from users table */
    player?: {
        name: string;
        photo_url: string | null;
        age: number | null;
        position: string | null;
        city: string | null;
        country: string | null;
        overall_score: number;
    };
}

export interface TalentAlertConfig {
    id: string;
    user_id: string;
    filters: {
        position?: string;
        age_category?: string;
        country?: string;
        min_score?: number;
    };
    is_active: boolean;
    last_triggered: string | null;
    created_at: string;
}

export interface PlayerNote {
    id: string;
    coach_id: string;
    player_id: string;
    note_text: string;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export interface ScoutViewStats {
    /** Total scouts who saved the player's profile */
    watchlist_count: number;
    /** Profile views this month */
    views_this_month: number;
}
