import { useCallback, useEffect, useRef, useState } from "react";
import { YT_STATE, type YTPlayer } from "@/lib/research/youtube";

const CLOCK_MS = 100;

/**
 * Keeps a YouTube player inside [startS, endS] and reports its time.
 *
 * Right after seekTo, YouTube keeps returning the old time for a while. While the
 * video is not playing, the last seek target is the true position, so `currentTime()`
 * returns it (frame steps, labels and "move here" all depend on this).
 */
export function useSegmentPlayer(player: YTPlayer | null, startS: number, endS: number, initialS: number) {
  const [time, setTime] = useState(initialS);
  // The page seeks the player to initialS when it is ready; until it plays, that is the position.
  const seekTarget = useRef<number | null>(initialS);

  const seek = useCallback(
    (t: number) => {
      if (!player) return;
      const target = Math.min(Math.max(t, startS), endS);
      seekTarget.current = target;
      player.seekTo(target, true);
    },
    [player, startS, endS],
  );

  const currentTime = useCallback(() => {
    if (!player) throw new Error("player is not ready");
    const playing = player.getPlayerState() === YT_STATE.PLAYING;
    return !playing && seekTarget.current !== null ? seekTarget.current : player.getCurrentTime();
  }, [player]);

  useEffect(() => {
    if (!player) return;
    const id = window.setInterval(() => {
      if (player.getPlayerState() === YT_STATE.PLAYING) seekTarget.current = null;
      const t = seekTarget.current ?? player.getCurrentTime();
      if (t > endS) {
        player.pauseVideo();
        seekTarget.current = endS;
        player.seekTo(endS, true);
      } else if (t < startS - 0.5) {
        seekTarget.current = startS;
        player.seekTo(startS, true);
      }
      setTime(Math.min(Math.max(t, startS), endS));
    }, CLOCK_MS);
    return () => window.clearInterval(id);
  }, [player, startS, endS]);

  return { time, seek, currentTime };
}
