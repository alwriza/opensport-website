import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TEAM_COLORS } from "@/types/matchAnalysis";
import type { FrameRecord } from "@/types/matchAnalysis";
import { DEMO_MATCH_PHOTO, DEMO_MATCH_PHOTO_CREDIT, DEMO_PHOTO_PITCH } from "@/demo/matchDemo";

export type Clock = { currentTime: number };

interface Props {
  /** Updated in place while playing; MinimapReplay reads it every animation frame. */
  clockRef: React.MutableRefObject<Clock>;
  duration: number;
  firstFrame: FrameRecord | undefined;
  lengthM: number;
  widthM: number;
}

const clockText = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

/**
 * Stands in for the annotated video in the demo: a still of the match with the
 * tracker's ellipses drawn on the first frame, and play / scrub controls that drive
 * the same clock the minimap follows.
 */
export function DemoReplay({ clockRef, duration, firstFrame, lengthM, widthM }: Props) {
  const { t } = useTranslation("match");
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number>();

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const next = (clockRef.current.currentTime + (now - last) / 1000) % duration;
      last = now;
      clockRef.current.currentTime = next;
      setTime(next);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== undefined) cancelAnimationFrame(raf.current);
    };
  }, [playing, duration, clockRef]);

  const seek = (value: number) => {
    clockRef.current.currentTime = value;
    setTime(value);
  };

  // The ellipses match the photo only at the very start; they fade once the clip moves on.
  const overlayOpacity = time < 0.5 ? 1 : 0;

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-md bg-black">
        <img src={DEMO_MATCH_PHOTO} alt={t("demo.photoAlt")} className="block h-auto w-full" />
        {firstFrame && (
          <svg
            className="pointer-events-none absolute transition-opacity duration-500"
            style={{
              left: `${DEMO_PHOTO_PITCH.left}%`,
              top: `${DEMO_PHOTO_PITCH.top}%`,
              width: `${DEMO_PHOTO_PITCH.width}%`,
              height: `${DEMO_PHOTO_PITCH.height}%`,
              opacity: overlayOpacity,
            }}
            viewBox={`0 0 ${lengthM} ${widthM}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {firstFrame.players.map(([trackId, team, x, y]) => (
              <ellipse
                key={trackId}
                cx={x}
                cy={y + 0.6}
                rx={1.6}
                ry={0.8}
                fill="none"
                stroke={team ? TEAM_COLORS[team] : "#FFD700"}
                strokeWidth={0.35}
              />
            ))}
          </svg>
        )}
        <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 font-mono text-xs text-white">
          {clockText(time)} / {clockText(duration)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-8 w-8 shrink-0"
          onClick={() => setPlaying((value) => !value)}
          aria-label={playing ? t("demo.pause") : t("demo.play")}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <input
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={time}
          onChange={(event) => seek(Number(event.target.value))}
          className="w-full accent-primary"
          aria-label={t("demo.seek")}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {t("demo.photoCaption")}{" "}
        <a href={DEMO_MATCH_PHOTO_CREDIT.url} target="_blank" rel="noreferrer" className="underline">
          {DEMO_MATCH_PHOTO_CREDIT.author} / {DEMO_MATCH_PHOTO_CREDIT.source}
        </a>
      </p>
    </div>
  );
}
