import * as React from "react";
import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface SectionHeadingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  /** Visual size. `hero` is reserved for the top of a marketing section. */
  size?: "md" | "lg";
}

/** Marketing section header: small label, big display title, supporting copy. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  size = "lg",
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
      {...props}
    >
      {eyebrow && (
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary",
            align === "center" ? "self-center" : "self-start",
          )}
        >
          {eyebrow}
        </span>
      )}

      <h2
        className={cn(
          "font-display font-bold text-foreground",
          size === "lg" ? "text-3xl sm:text-4xl lg:text-5xl" : "text-2xl sm:text-3xl",
        )}
      >
        {title}
      </h2>

      {description && (
        <p
          className={cn(
            "text-base leading-relaxed text-muted-foreground sm:text-lg",
            align === "center" ? "max-w-2xl" : "max-w-2xl",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  /** Buttons or filters rendered on the trailing edge. */
  actions?: React.ReactNode;
}

/** App-side page header: title, one line of context, and the page's actions. */
export function PageHeader({ title, description, icon: Icon, actions, className, ...props }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-4">
        {Icon && (
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary sm:flex">
            <Icon className="h-6 w-6" />
          </span>
        )}
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            {title}
          </h1>
          {description && <p className="text-sm text-muted-foreground sm:text-base">{description}</p>}
        </div>
      </div>

      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
