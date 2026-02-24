import React from "react";
import type { SubscriptionPermissions } from "@/types/subscription";
import { useSubscription } from "@/hooks/useSubscription";

interface FeatureGateProps {
    /** The permission key from SubscriptionPermissions to check */
    requires: keyof Pick<
        SubscriptionPermissions,
        | "canViewProfiles"
        | "canUseAdvancedFilters"
        | "canContact"
        | "canExport"
        | "hasProBadge"
        | "canSeeScoutCount"
        | "canCreateAlerts"
    >;
    /** Content to show when permission is NOT granted */
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * FeatureGate — Wraps subscription-gated UI.
 * If the user doesn't have the required permission, renders `fallback` (or nothing).
 *
 * Usage:
 * <FeatureGate requires="canContact" fallback={<UpgradePrompt />}>
 *   <ContactButton />
 * </FeatureGate>
 */
export function FeatureGate({ requires, fallback = null, children }: FeatureGateProps) {
    const sub = useSubscription();

    if (sub.isLoading) return null;

    if (!sub[requires]) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

export default FeatureGate;
