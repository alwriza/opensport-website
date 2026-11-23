/**
 * Minimal YouTube IFrame Player API wrapper for the research labeling tool.
 * Only the calls the tool uses are typed.
 */

export type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  setPlaybackRate(rate: number): void;
  destroy(): void;
};

export const YT_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } as const;

/** YouTube onError codes → readable text. 101/150: the owner disabled embedding. */
export function youtubeErrorText(code: number): string {
  if (code === 101 || code === 150) return "Владелец видео запретил встраивание. Это видео не подходит — найдите другое.";
  if (code === 100) return "Видео не найдено или закрыто.";
  if (code === 2) return "Неверная ссылка на видео.";
  return `YouTube не может воспроизвести видео (код ${code}).`;
}

type YTNamespace = {
  Player: new (
    el: HTMLElement,
    options: {
      videoId: string;
      width: string;
      height: string;
      playerVars: Record<string, number | string>;
      events: {
        onReady: (e: { target: YTPlayer }) => void;
        onError: (e: { data: number }) => void;
        onStateChange?: (e: { data: number }) => void;
      };
    },
  ) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

export function loadYouTubeApi(): Promise<YTNamespace> {
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      if (window.YT?.Player) {
        resolve(window.YT);
        return;
      }
      window.onYouTubeIframeAPIReady = () => resolve(window.YT as YTNamespace);
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.onerror = () => {
        apiPromise = null;
        reject(new Error("Не удалось загрузить плеер YouTube. Проверьте интернет и обновите страницу."));
      };
      document.head.appendChild(script);
    });
  }
  return apiPromise;
}

/** Video id from watch, youtu.be, shorts, live and embed links; null when the link is not a YouTube video. */
export function parseYouTubeId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = parsed.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (parsed.pathname === "/watch") id = parsed.searchParams.get("v");
    else {
      const m = parsed.pathname.match(/^\/(shorts|live|embed)\/([^/?]+)/);
      id = m ? m[2] : null;
    }
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}
