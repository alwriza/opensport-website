import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TEAM_COLORS } from "@/types/matchAnalysis";
import type { DominancePoint } from "@/types/matchAnalysis";

/** Seconds as m:ss, rounded first so 59.96 s reads 1:00, not 0:60. */
const clock = (t: number) => {
  const total = Math.round(t);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

/** Team A's share of pitch area over time. Frames without enough players are absent. */
export function DominanceChart({ points }: { points: DominancePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="t"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickFormatter={clock}
          minTickGap={32}
          className="text-xs"
          stroke="currentColor"
        />
        <YAxis domain={[0, 100]} className="text-xs" stroke="currentColor" />
        <Tooltip
          formatter={(value: number) => [`${value.toFixed(1)}% / ${(100 - value).toFixed(1)}%`, "A / B"]}
          labelFormatter={clock}
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
