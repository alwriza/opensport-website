import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { loadYouTubeApi, type YTPlayer } from "@/lib/research/youtube";

type Props = {
  videoId: string;
  startS: number;
  /** false: no YouTube controls and no mouse on the video; the page drives it with keys. */
  controls: boolean;
  onReady: (player: YTPlayer) => void;
  onError: (code: number) => void;
  onLoadFailed: (message: string) => void;
  className?: string;
};

/**
 * YouTube embed. Nothing is drawn over the video (YouTube's embed rules);
 * hints and lists go next to it.
 */
export function YouTubePlayer({ videoId, startS, controls, onReady, onError, onLoadFailed, className }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onReady, onError, onLoadFailed });
  callbacks.current = { onReady, onError, onLoadFailed };

  useEffect(() => {
    let player: YTPlayer | null = null;
    let cancelled = false;
    loadYouTubeApi().then(
      (YT) => {
        if (cancelled || !host.current) return;
        const el = document.createElement("div");
        host.current.replaceChildren(el);
        player = new YT.Player(el, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            controls: controls ? 1 : 0,
            disablekb: 1,
            rel: 0,
            playsinline: 1,
            start: Math.floor(startS),
          },
          events: {
            onReady: (e) => callbacks.current.onReady(e.target),
            onError: (e) => callbacks.current.onError(e.data),
          },
        });
      },
      (e: Error) => callbacks.current.onLoadFailed(e.message),
    );
    return () => {
      cancelled = true;
      player?.destroy();
    };
    // startS only matters for the first load of a video.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, controls]);

  return (
    <div
      ref={host}
      className={cn("aspect-video w-full overflow-hidden rounded-lg bg-black", !controls && "[&_iframe]:pointer-events-none", className)}
    />
  );
}
