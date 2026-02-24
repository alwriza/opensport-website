// OpenSport v2.0 — Subscription Types
// Based on OpenSport_Platform_v2_Documentation.md

export type UserTrack = 'player' | 'individual';

export type SubscriptionTier = 'free' | 'premium' | 'basic' | 'pro';

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'none';

export interface SubscriptionPermissions {
    /** Current subscription tier */
    tier: SubscriptionTier;
    /** Current user track */
    track: UserTrack;
    /** True if user is on the Player track */
    isPlayer: boolean;
    /** True if user is on the Individual (coach/scout) track */
    isIndividual: boolean;
    /** True if the user has admin privileges — bypasses all checks */
    isAdmin: boolean;

    // Feature permissions
    /** Can view other players' real profiles (Individual BASIC/PRO) */
    canViewProfiles: boolean;
    /** Can use advanced metric filters in ranking (Individual PRO only) */
    canUseAdvancedFilters: boolean;
    /** Can contact players directly (Individual PRO only) */
    canContact: boolean;
    /** Can export PDF/Excel reports (Player PREMIUM, Individual BASIC/PRO) */
    canExport: boolean;
    /** Has Pro Badge visible to scouts (Player PREMIUM only) */
    hasProBadge: boolean;
    /** Can see how many scouts saved them (Player PREMIUM only) */
    canSeeScoutCount: boolean;
    /** Can create Talent Alerts (Individual PRO only) */
    canCreateAlerts: boolean;

    // Limits
    /** Max players on watchlist, null = unlimited (Individual only) */
    watchlistLimit: number | null;
    /** Max players to compare, null = unlimited (Individual only) */
    compareLimit: number | null;
    /** Max kick analyses per day, null = unlimited */
    kicksPerDay: number | null;
    /** Max match moments per week, null = unlimited */
    momentsPerWeek: number | null;
    /** Max player match analyses per month, null = unlimited */
    playerMatchesPerMonth: number | null;
    /** Max team match analyses per month, null = unlimited */
    teamMatchesPerMonth: number | null;
}

/** Limit values per tier for quick reference */
export const TIER_LIMITS: Record<SubscriptionTier, Omit<SubscriptionPermissions, 'tier' | 'track' | 'isPlayer' | 'isIndividual' | 'isAdmin' | 'canViewProfiles' | 'canUseAdvancedFilters' | 'canContact' | 'canExport' | 'hasProBadge' | 'canSeeScoutCount' | 'canCreateAlerts' | 'watchlistLimit' | 'compareLimit'>> = {
    free: {
        kicksPerDay: 5,
        momentsPerWeek: 1,
        playerMatchesPerMonth: 2,
        teamMatchesPerMonth: 0,
    },
    premium: {
        kicksPerDay: null, // unlimited
        momentsPerWeek: 5,
        playerMatchesPerMonth: 4,
        teamMatchesPerMonth: 0,
    },
    basic: {
        kicksPerDay: null,
        momentsPerWeek: null,
        playerMatchesPerMonth: 10,
        teamMatchesPerMonth: 4,
    },
    pro: {
        kicksPerDay: null,
        momentsPerWeek: null,
        playerMatchesPerMonth: 50,
        teamMatchesPerMonth: 10,
    },
};

export type AnalysisType = 'kick' | 'moment' | 'player_match' | 'team_match';
