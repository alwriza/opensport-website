import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SubscriptionPermissions, SubscriptionTier, UserTrack } from "@/types/subscription";

/**
 * useSubscription — Returns the current user's subscription tier, track, and permissions.
 *
 * CRITICAL: If is_admin = true, returns PRO-level permissions for ALL checks,
 * regardless of actual subscription_tier or subscription_status.
 * Admin bypasses all limit checks (do NOT consume or check limits for admin).
 */
export function useSubscription(): SubscriptionPermissions & { isLoading: boolean } {
    const { user } = useUser();

    const { data: dbUser, isLoading } = useQuery({
        queryKey: ["subscription-user", user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data, error } = await (supabase.from("users") as any)
                .select(
                    "id, user_track, subscription_tier, subscription_status, is_admin"
                )
                .eq("clerk_id", user.id)
                .maybeSingle();
            if (error) throw error;
            return data;
        },
        enabled: !!user,
        staleTime: 30_000, // cache for 30s
    });

    // Default while loading
    const isAdmin: boolean = !!(dbUser as any)?.is_admin;
    const tier: SubscriptionTier = isAdmin
        ? "pro"
        : ((dbUser as any)?.subscription_tier as SubscriptionTier) ?? "free";
    const track: UserTrack = isAdmin
        ? "individual"
        : ((dbUser as any)?.user_track as UserTrack) ?? "player";

    const isPlayer = track === "player";
    const isIndividual = track === "individual";

    // Admin gets everything. Otherwise derive from tier + track.
    const canViewProfiles = isAdmin || ["basic", "pro"].includes(tier);
    const canUseAdvancedFilters = isAdmin || tier === "pro";
    const canContact = isAdmin || tier === "pro";
    const canExport = isAdmin || ["premium", "basic", "pro"].includes(tier);
    const hasProBadge = isAdmin || tier === "premium";
    const canSeeScoutCount = isAdmin || tier === "premium";
    const canCreateAlerts = isAdmin || tier === "pro";

    // Watchlist limit
    let watchlistLimit: number | null = null;
    if (!isAdmin) {
        if (tier === "basic") watchlistLimit = 20;
        // pro = null (unlimited), player = N/A (no watchlist)
    }

    // Compare limit
    let compareLimit: number | null = null;
    if (!isAdmin) {
        if (tier === "basic") compareLimit = 3;
        // pro = null (unlimited)
    }

    // Analysis limits — null = unlimited, admin always gets null (unlimited)
    let kicksPerDay: number | null = null;
    let momentsPerWeek: number | null = null;
    let playerMatchesPerMonth: number | null = null;
    let teamMatchesPerMonth: number | null = null;

    if (!isAdmin) {
        switch (tier) {
            case "free":
                kicksPerDay = 5;
                momentsPerWeek = 1;
                playerMatchesPerMonth = 2;
                teamMatchesPerMonth = 0;
                break;
            case "premium":
                kicksPerDay = null;
                momentsPerWeek = 5;
                playerMatchesPerMonth = 4;
                teamMatchesPerMonth = 0;
                break;
            case "basic":
                kicksPerDay = null;
                momentsPerWeek = null;
                playerMatchesPerMonth = 10;
                teamMatchesPerMonth = 4;
                break;
            case "pro":
                kicksPerDay = null;
                momentsPerWeek = null;
                playerMatchesPerMonth = 50;
                teamMatchesPerMonth = 10;
                break;
        }
    }

    return {
        isLoading,
        tier,
        track,
        isPlayer,
        isIndividual,
        isAdmin,
        canViewProfiles,
        canUseAdvancedFilters,
        canContact,
        canExport,
        hasProBadge,
        canSeeScoutCount,
        canCreateAlerts,
        watchlistLimit,
        compareLimit,
        kicksPerDay,
        momentsPerWeek,
        playerMatchesPerMonth,
        teamMatchesPerMonth,
    };
}
