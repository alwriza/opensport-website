import * as React from "react";

import { cn } from "@/lib/utils";

interface AnimatedCounterProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  /** Decimal places to render. Defaults to whatever `value` needs, capped at 1. */
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  /** Group thousands (1 240 -> "1,240"). */
  separator?: boolean;
}

/**
 * Counts up to `value` the first time it scrolls into view, then tracks any
 * later changes to `value`. Respects prefers-reduced-motion by jumping
 * straight to the final number.
 */
export function AnimatedCounter({
  value,
  decimals,
  duration = 1100,
  prefix = "",
  suffix = "",
  separator = true,
  className,
  ...props
}: AnimatedCounterProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = React.useState(0);
  const [started, setStarted] = React.useState(false);

  const places = decimals ?? (Number.isInteger(value) ? 0 : 1);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || started) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  React.useEffect(() => {
    if (!started) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || duration <= 0) {
      setDisplay(value);
      return;
    }

    const from = display;
    const delta = value - from;
    if (delta === 0) return;

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutExpo — fast out of the gate, settles gently on the final value
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplay(from + delta * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // `display` is intentionally excluded: it is the animation's own output.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, started, duration]);

  const text = separator
    ? display.toLocaleString("en-US", { minimumFractionDigits: places, maximumFractionDigits: places })
    : display.toFixed(places);

  return (
    <span ref={ref} className={cn("tabular", className)} {...props}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}
