import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "./useSubscription";
import type { AnalysisType } from "@/types/subscription";

interface UsageLimitRecord {
    kicks_used: number;
    moments_used: number;
    player_matches_used: number;
    team_matches_used: number;
}

interface LimitCheckResult {
    allowed: boolean;
    used: number;
    limit: number | null; // null = unlimited
    remaining: number | null; // null = unlimited
}

function getPeriodStart(type: "daily" | "weekly" | "monthly"): string {
    const now = new Date();
    if (type === "daily") {
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
            .toISOString()
            .split("T")[0];
    }
    if (type === "weekly") {
        const day = now.getDay(); // 0=Sun,1=Mon…
        const diff = day === 0 ? 6 : day - 1; // Monday start
        const monday = new Date(now);
        monday.setDate(now.getDate() - diff);
        return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate())
            .toISOString()
            .split("T")[0];
    }
    // monthly
    return new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
}

function analysisTypeToPeriod(type: AnalysisType): "daily" | "weekly" | "monthly" {
    if (type === "kick") return "daily";
    if (type === "moment") return "weekly";
    return "monthly"; // player_match, team_match
}

function analysisTypeToField(type: AnalysisType): keyof UsageLimitRecord {
    if (type === "kick") return "kicks_used";
    if (type === "moment") return "moments_used";
    if (type === "player_match") return "player_matches_used";
    return "team_matches_used";
}

/**
 * useLimits — Check and manage usage limits for uploads.
 *
 * Admin bypasses ALL limit checks and does NOT consume limits.
 */
export function useLimits(dbUserId?: string) {
    const { user } = useUser();
    const sub = useSubscription();
    const queryClient = useQueryClient();

    // Fetch current usage records for all periods
    const { data: usage, isLoading } = useQuery({
        queryKey: ["usage-limits", dbUserId],
        queryFn: async () => {
            if (!dbUserId) return {} as Record<string, UsageLimitRecord>;

            const today = getPeriodStart("daily");
            const weekStart = getPeriodStart("weekly");
            const monthStart = getPeriodStart("monthly");

            const { data, error } = await (supabase.from("usage_limits") as any)
                .select("*")
                .eq("user_id", dbUserId)
                .in("period_start", [today, weekStart, monthStart]);

            if (error) throw error;

            const map: Record<string, UsageLimitRecord> = {};
            for (const row of data || []) {
                map[`${row.period_type}:${row.period_start}`] = row;
            }
            return map;
        },
        enabled: !!dbUserId && !sub.isAdmin,
    });

    function getRecord(period: "daily" | "weekly" | "monthly"): UsageLimitRecord {
        const key = `${period}:${getPeriodStart(period)}`;
        return (
            usage?.[key] || {
                kicks_used: 0,
                moments_used: 0,
                player_matches_used: 0,
                team_matches_used: 0,
            }
        );
    }

    function checkLimit(type: AnalysisType): LimitCheckResult {
        // Admin always allowed, unlimited
        if (sub.isAdmin) return { allowed: true, used: 0, limit: null, remaining: null };

        const period = analysisTypeToPeriod(type);
        const field = analysisTypeToField(type);
        const record = getRecord(period);
        const used = record[field];

        let limit: number | null = null;
        if (type === "kick") limit = sub.kicksPerDay;
        else if (type === "moment") limit = sub.momentsPerWeek;
        else if (type === "player_match") limit = sub.playerMatchesPerMonth;
        else if (type === "team_match") limit = sub.teamMatchesPerMonth;

        if (limit === null) return { allowed: true, used, limit: null, remaining: null };

        const remaining = Math.max(0, limit - used);
        return { allowed: remaining > 0, used, limit, remaining };
    }

    // Consume a limit slot after successful analysis
    const consumeMutation = useMutation({
        mutationFn: async ({ type }: { type: AnalysisType }) => {
            if (!dbUserId || sub.isAdmin) return; // Admin never consumes

            const period = analysisTypeToPeriod(type);
            const field = analysisTypeToField(type);
            const periodStart = getPeriodStart(period);

            // Upsert usage record (create if not exists, then increment)
            const { error } = await (supabase.from("usage_limits") as any).upsert(
                {
                    user_id: dbUserId,
                    period_type: period,
                    period_start: periodStart,
                    [field]: 1,
                },
                {
                    onConflict: "user_id,period_type,period_start",
                    // Supabase upsert: on conflict we increment using rpc
                }
            );

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["usage-limits", dbUserId] });
        },
    });

    return {
        isLoading,
        checkLimit,
        consumeLimit: (type: AnalysisType) => consumeMutation.mutate({ type }),
        isConsuming: consumeMutation.isPending,
        // Convenience: pre-checked limits for the UI
        kicks: checkLimit("kick"),
        moments: checkLimit("moment"),
        playerMatches: checkLimit("player_match"),
        teamMatches: checkLimit("team_match"),
    };
}
