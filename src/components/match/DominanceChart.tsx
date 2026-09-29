import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TEAM_COLORS } from "@/types/matchAnalysis";
import type { DominancePoint } from "@/types/matchAnalysis";

/** Team A's share of pitch area over time. Frames without enough players are absent. */
export function DominanceChart({ points }: { points: DominancePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="t"
          tickFormatter={(t: number) => `${Math.round(t)}s`}
          className="text-xs"
          stroke="currentColor"
        />
        <YAxis domain={[0, 100]} className="text-xs" stroke="currentColor" />
        <Tooltip
          formatter={(value: number) => [`${value}% / ${(100 - value).toFixed(1)}%`, "A / B"]}
          labelFormatter={(t: number) => `${t.toFixed(1)} s`}
        />
        <ReferenceLine y={50} stroke="currentColor" strokeDasharray="4 4" opacity={0.5} />
        <Area
          type="monotone"
          dataKey="a_pct"
          stroke={TEAM_COLORS.A}
          fill={TEAM_COLORS.A}
          fillOpacity={0.25}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
