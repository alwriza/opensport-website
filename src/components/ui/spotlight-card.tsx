import * as React from "react";

import { cn } from "@/lib/utils";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Strength of the glow that trails the pointer, 0–1. */
  intensity?: number;
}

/**
 * Card whose border and surface light up around the pointer. Purely decorative
 * — it degrades to a plain card on touch devices and under reduced motion.
 */
export function SpotlightCard({ intensity = 0.14, className, children, ...props }: SpotlightCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setPos(null)}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition-colors duration-300 hover:border-primary/30",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:hidden"
        style={
          pos
            ? {
                background: `radial-gradient(240px circle at ${pos.x}px ${pos.y}px, hsl(var(--primary) / ${intensity}), transparent 70%)`,
              }
            : undefined
        }
      />
      <div className="relative">{children}</div>
    </div>
  );
}
