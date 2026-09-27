import { useDesignCopy } from "@/hooks/useDesignCopy";
import { Link } from "react-router-dom";
import { useId, type CSSProperties } from "react";

export function Brand({ to = "/" }: { to?: string; }) {
  const filterId = useId();
  return <Link className="design-brand" to={to} aria-label="OPENsport home" style={{ "--brand-ink-filter": `url(#${filterId})` } as CSSProperties}>
    <svg width="0" height="0" aria-hidden="true" className="design-brand-filter"><defs><filter id={filterId} colorInterpolationFilters="sRGB">
      {/* Keep the original green emblem and map the white wordmark to ink on paper. */}
      <feColorMatrix type="matrix" values=".078 0 0 0 0 -.918 1 0 0 0 0 0 .059 0 0 0 0 0 1 0" />
    </filter></defs></svg>
    <img src="/logo.svg" alt="OPENsport" width="148" height="60" />
  </Link>;
}

export function PoseFigure({ highlight = false }: { highlight?: boolean; }) {
  return <svg className="design-pose" viewBox="0 0 150 130" fill="none" aria-hidden="true">
    <path d="M72 18 70 54M70 54 54 92M70 54 96 84M96 84 104 116M54 92 44 118M72 30 46 52M72 30 100 46" stroke="var(--pitch)" strokeLinecap="round" strokeWidth="2.2" />
    {highlight && <path d="M96 84 104 116" stroke="#6FD39C" strokeLinecap="round" strokeWidth="2.6" />}
    <circle cx="72" cy="12" r="7" stroke="var(--pitch)" strokeWidth="2.2" />
    {[[70, 54], [96, 84], [104, 116], [54, 92], [44, 118], [46, 52], [100, 46]].map(([cx, cy]) =>
      <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={highlight && cx === 96 ? 4.6 : 3.6} fill={highlight && cx === 96 ? "#6FD39C" : "#F3F1EC"} />)}
  </svg>;
}

export type ScoreValues = { stability: number; power: number; technique: number; balance: number; };
const metricNames: Record<keyof ScoreValues, string> = { stability: "Stability", power: "Power", technique: "Technique", balance: "Balance" };

export function MetricList({ scores, labels = metricNames, compact = false }: {
  scores: ScoreValues; labels?: Record<keyof ScoreValues, string>; compact?: boolean;
}) {
  const copy = useDesignCopy();
  return <div className={compact ? "design-metrics design-metrics-compact" : "design-metrics"}>
    {(Object.keys(metricNames) as (keyof ScoreValues)[]).map(key => <div className="design-metric" key={key}>
      <div className="design-metric-label">
        <span>{copy(labels[key])}</span>
        <span>{Number.isFinite(scores[key]) ? scores[key].toFixed(1) : "—"}</span>
      </div>
      <div className="design-meter">
        <span style={{ width: `${Math.max(0, Math.min(100, scores[key] || 0))}%` }} />
      </div>
    </div>)}
  </div>;
}
