import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface SkillData {
  skill: string;
  score: number;
  fullMark: number;
}

interface RadarSkillChartProps {
  data: SkillData[];
  className?: string;
}

export function RadarSkillChart({ data, className }: RadarSkillChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <PolarAngleAxis 
            dataKey="skill" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            className="text-sm"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: 'hsl(var(--subtle-foreground))', fontSize: 10 }}
            axisLine={false}
          />
          <Radar
            name="Skills"
            dataKey="score"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.22}
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}