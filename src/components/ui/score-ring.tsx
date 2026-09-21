import * as React from "react";

import { cn } from "@/lib/utils";

interface ScoreRingProps {
  /** Current score. */
  value: number;
  /** Top of the scale. Scores in this app are 0–10 or 0–100. */
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  /** Show the numeric value in the middle. */
  showValue?: boolean;
  className?: string;
}

/** Bands let a score read at a glance before the number is even parsed. */
function bandColor(ratio: number) {
  if (ratio >= 0.75) return "hsl(var(--primary))";
  if (ratio >= 0.5) return "hsl(var(--chart-3))";
  if (ratio >= 0.3) return "hsl(var(--chart-4))";
  return "hsl(var(--destructive))";
}

/**
 * Circular gauge for a single score. The arc animates from empty on mount so
 * a freshly returned analysis feels like it is being measured.
 */
export function ScoreRing({
  value,
  max = 10,
  size = 132,
  strokeWidth = 10,
  label,
  showValue = true,
  className,
}: ScoreRingProps) {
  const ratio = Math.max(0, Math.min(1, value / max));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const [drawn, setDrawn] = React.useState(0);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(ratio));
    return () => cancelAnimationFrame(id);
  }, [ratio]);

  const color = bandColor(ratio);

  return (
    <div className={cn("relative inline-flex shrink-0 items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${value} of ${max}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--surface-3))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - drawn)}
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)",
            filter: `drop-shadow(0 0 8px ${color}55)`,
          }}
        />
      </svg>

      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-display font-bold leading-none tabular"
            style={{ fontSize: size * 0.26, color }}
          >
            {Number.isInteger(value) ? value : value.toFixed(1)}
          </span>
          {label && (
            <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-subtle-foreground">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  className?: string;
}

/** Horizontal counterpart to ScoreRing, for lists of sub-metrics. */
export function StatBar({ label, value, max = 10, className }: StatBarProps) {
  const ratio = Math.max(0, Math.min(1, value / max));
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(ratio));
    return () => cancelAnimationFrame(id);
  }, [ratio]);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="font-display text-sm font-bold tabular text-foreground">
          {Number.isInteger(value) ? value : value.toFixed(1)}
          <span className="text-subtle-foreground">/{max}</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${width * 100}%`, backgroundColor: bandColor(ratio) }}
        />
      </div>
    </div>
  );
}
