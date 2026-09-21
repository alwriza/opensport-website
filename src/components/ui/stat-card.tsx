import * as React from "react";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  /** Period-over-period change, in percent. Positive renders green, negative red. */
  delta?: number | null;
  hint?: string;
  suffix?: string;
  decimals?: number;
  /** Highlights the tile with a green rim — use for the headline metric only. */
  accent?: boolean;
}

/**
 * One metric, one tile. Numeric values count up when the tile scrolls into
 * view; strings render as-is so it also works for "3 day streak" style copy.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  hint,
  suffix,
  decimals,
  accent = false,
  className,
  ...props
}: StatCardProps) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const up = hasDelta && delta! >= 0;

  return (
    <div
      className={cn(
        "edge-light group relative overflow-hidden rounded-2xl border bg-card p-4 shadow-card transition-all duration-300 sm:p-5",
        accent ? "border-primary/30" : "border-border hover:border-border-strong",
        className,
      )}
      {...props}
    >
      {/* Ambient wash that warms up on hover */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition-opacity duration-500",
          accent ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-subtle-foreground">{label}</p>
        {Icon && (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
              accent ? "bg-primary/15 text-primary" : "bg-surface-2 text-muted-foreground group-hover:text-primary",
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
      </div>

      <div className="relative mt-3 flex items-end gap-2">
        <span className="font-display text-3xl font-bold leading-none tracking-tight text-foreground">
          {typeof value === "number" ? (
            <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
          ) : (
            value
          )}
        </span>

        {hasDelta && (
          <span
            className={cn(
              "mb-0.5 inline-flex items-center gap-0.5 text-xs font-semibold tabular",
              up ? "text-primary" : "text-destructive",
            )}
          >
            {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {up ? "+" : ""}
            {delta!.toFixed(1)}%
          </span>
        )}
      </div>

      {hint && <p className="relative mt-1.5 text-xs text-subtle-foreground">{hint}</p>}
    </div>
  );
}
