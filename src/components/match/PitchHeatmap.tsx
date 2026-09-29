import { PitchOutline } from "./PitchOutline";

interface Props {
  /** Occupancy grid, rows x cols, already normalised to a 0..1 peak. */
  grid: number[][];
  lengthM: number;
  widthM: number;
  color: string;
}

/** Team occupancy over the pitch. Cell opacity is the normalised time spent there. */
export function PitchHeatmap({ grid, lengthM, widthM, color }: Props) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (!rows || !cols) return null;

  const cellW = lengthM / cols;
  const cellH = widthM / rows;

  return (
    <svg
      viewBox={`-1 -1 ${lengthM + 2} ${widthM + 2}`}
      className="w-full text-muted-foreground"
      role="img"
      aria-label="Team heatmap over the pitch"
    >
      <rect x={-1} y={-1} width={lengthM + 2} height={widthM + 2} className="fill-muted/30" />
      {grid.map((row, rowIndex) =>
        row.map((value, colIndex) =>
          value > 0 ? (
            <rect
              key={`${rowIndex}-${colIndex}`}
              x={colIndex * cellW}
              y={rowIndex * cellH}
              width={cellW}
              height={cellH}
              fill={color}
              opacity={value * 0.85}
            />
          ) : null,
        ),
      )}
      <PitchOutline lengthM={lengthM} widthM={widthM} />
    </svg>
  );
}
