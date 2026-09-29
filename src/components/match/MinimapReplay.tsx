import { useEffect, useRef, useState } from "react";
import { TEAM_COLORS } from "@/types/matchAnalysis";
import type { FrameRecord } from "@/types/matchAnalysis";
import { PitchOutline } from "./PitchOutline";

interface Props {
  frames: FrameRecord[];
  lengthM: number;
  widthM: number;
  analysisFps: number;
  videoRef: React.RefObject<HTMLVideoElement>;
}

/** Index of the frame whose timestamp is closest to t. */
function nearestIndex(frames: FrameRecord[], t: number): number {
  let low = 0;
  let high = frames.length - 1;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (frames[mid].t < t) low = mid + 1;
    else high = mid;
  }
  if (low > 0 && Math.abs(frames[low - 1].t - t) <= Math.abs(frames[low].t - t)) return low - 1;
  return low;
}

/**
 * Top-down replay driven by the annotated video's clock.
 *
 * The annotated video is written at the analysis fps and keeps the source timeline, so
 * a record's `t` is the same clock as `video.currentTime`. Times with no record are
 * frames where the pitch could not be mapped, and the minimap shows nothing for them
 * rather than holding a stale position.
 */
export function MinimapReplay({ frames, lengthM, widthM, analysisFps, videoRef }: Props) {
  const [frame, setFrame] = useState<FrameRecord | null>(null);
  const raf = useRef<number>();
  const tolerance = 1.5 / analysisFps;

  useEffect(() => {
    if (!frames.length) return;

    const tick = () => {
      const video = videoRef.current;
      if (video) {
        const candidate = frames[nearestIndex(frames, video.currentTime)];
        setFrame(Math.abs(candidate.t - video.currentTime) <= tolerance ? candidate : null);
      }
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== undefined) cancelAnimationFrame(raf.current);
    };
  }, [frames, tolerance, videoRef]);

  return (
    <svg
      viewBox={`-2 -2 ${lengthM + 4} ${widthM + 4}`}
      className="w-full rounded-md bg-muted/40 text-muted-foreground"
      role="img"
      aria-label="Minimap replay"
    >
      <PitchOutline lengthM={lengthM} widthM={widthM} />
      {frame?.players.map(([trackId, team, x, y]) => (
        <circle
          key={trackId}
          cx={x}
          cy={y}
          r={1.3}
          fill={team ? TEAM_COLORS[team] : "#FFD700"}
          stroke="rgba(0,0,0,0.45)"
          strokeWidth={0.2}
        />
      ))}
      {frame?.ball && (
        <circle cx={frame.ball[0]} cy={frame.ball[1]} r={0.9} fill="#FFFFFF" stroke="#000" strokeWidth={0.25} />
      )}
      {!frame && (
        <text x={lengthM / 2} y={widthM / 2} textAnchor="middle" fontSize={3} fill="currentColor">
          pitch not mapped at this moment
        </text>
      )}
    </svg>
  );
}
