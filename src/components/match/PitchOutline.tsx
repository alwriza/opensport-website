/** Pitch markings drawn in metres, so callers can share one coordinate system. */
export function PitchOutline({ lengthM, widthM }: { lengthM: number; widthM: number }) {
  const penaltyBoxLength = 20.15;
  const penaltyBoxWidth = 41;
  const goalBoxLength = 5.5;
  const goalBoxWidth = 18.32;
  const circleRadius = 9.15;
  const stroke = "currentColor";

  return (
    <g fill="none" stroke={stroke} strokeWidth={0.25} opacity={0.45}>
      <rect x={0} y={0} width={lengthM} height={widthM} />
      <line x1={lengthM / 2} y1={0} x2={lengthM / 2} y2={widthM} />
      <circle cx={lengthM / 2} cy={widthM / 2} r={circleRadius} />
      {[0, 1].map((side) => {
        const flip = side === 1;
        const boxX = flip ? lengthM - penaltyBoxLength : 0;
        const goalX = flip ? lengthM - goalBoxLength : 0;
        return (
          <g key={side}>
            <rect
              x={boxX}
              y={(widthM - penaltyBoxWidth) / 2}
              width={penaltyBoxLength}
              height={penaltyBoxWidth}
            />
            <rect
              x={goalX}
              y={(widthM - goalBoxWidth) / 2}
              width={goalBoxLength}
              height={goalBoxWidth}
            />
          </g>
        );
      })}
    </g>
  );
}
