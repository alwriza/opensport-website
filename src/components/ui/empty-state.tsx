import * as React from "react";
import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Primary call to action — the one thing to do from here. */
  action?: React.ReactNode;
  /** `inline` drops the border so it can sit inside an existing card. */
  variant?: "card" | "inline";
}

/**
 * Shown wherever a list, chart or feed has nothing in it yet. Always names the
 * next step so an empty screen never becomes a dead end.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "card",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        variant === "card" && "rounded-2xl border border-dashed border-border bg-card/50",
        className,
      )}
      {...props}
    >
      {Icon && (
        <div className="relative mb-4">
          <div aria-hidden className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface-2 text-muted-foreground">
            <Icon className="h-6 w-6" />
          </span>
        </div>
      )}

      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
