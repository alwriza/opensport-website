import { Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface LimitDisplayProps {
    /** Label like "Kicks today" */
    label: string;
    used: number;
    /** null = unlimited */
    limit: number | null;
    className?: string;
}

/**
 * LimitDisplay — Shows a progress bar + remaining count for usage limits.
 * Used in Player Dashboard for kicks/moments/matches.
 *
 * If limit is null (unlimited), shows a green "Unlimited" badge.
 */
export function LimitDisplay({ label, used, limit, className }: LimitDisplayProps) {
    const navigate = useNavigate();

    if (limit === null) {
        return (
            <div className={cn("flex items-center justify-between text-sm gap-2", className)}>
                <span className="text-muted-foreground">{label}</span>
                <span className="flex items-center gap-1 font-semibold text-primary text-xs">
                    <Zap className="h-3 w-3" />
                    Unlimited
                </span>
            </div>
        );
    }

    const remaining = Math.max(0, limit - used);
    const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
    const isWarning = remaining <= 1;
    const isDepleted = remaining === 0;

    return (
        <div className={cn("space-y-1.5", className)}>
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span
                    className={cn(
                        "font-semibold",
                        isDepleted ? "text-destructive" : isWarning ? "text-amber-400" : "text-foreground"
                    )}
                >
                    {remaining}/{limit}
                </span>
            </div>
            <div className="relative h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isDepleted ? "bg-destructive" : isWarning ? "bg-amber-400" : "bg-primary"
                    )}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {isDepleted && (
                <button
                    onClick={() => navigate("/pricing")}
                    className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
                >
                    <AlertTriangle className="h-3 w-3" />
                    Limit reached — Upgrade
                </button>
            )}
        </div>
    );
}

export default LimitDisplay;
