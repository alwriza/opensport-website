import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminOnly } from "@/components/admin/research/AdminOnly";
import { YouTubePlayer } from "@/components/admin/research/YouTubePlayer";
import {
  deleteLabel,
  researchErrorText,
  updateSegment,
  upsertLabel,
  useGoldSession,
  type GoldLabel,
  type ResearchMatch,
  type ResearchSegment,
} from "@/hooks/useResearch";
import {
  CLASS_KEYS,
  CLASS_LABEL,
  EVENT_CLASSES,
  FRAME_S,
  GOLD_CONTROL_HINTS,
  GOLD_EVENT_HINTS,
  JUMP_S,
  PLAYBACK_RATES,
  SHOT_OUTCOME_KEYS,
  SHOT_OUTCOME_LABEL,
  SHOT_OUTCOMES,
  fmtTime,
  type EventClass,
} from "@/lib/research/keymap";
import { YT_STATE, youtubeErrorText, type YTPlayer } from "@/lib/research/youtube";

type Label = Omit<GoldLabel, "created_at">;

type SaveOp =
  | { kind: "upsert"; label: Label }
  | { kind: "delete"; id: string }
  | { kind: "segment"; patch: Parameters<typeof updateSegment>[1] };

const POSITION_SAVE_MS = 10_000;
const CLOCK_MS = 100;

/** Gold labeling of one segment: keys only, every event saved right away. Admins only. */
export default function ResearchGold() {
  const { segmentId } = useParams<{ segmentId: string }>();
  if (!segmentId) throw new Error("segmentId is missing from the route");
  return (
    <AdminOnly>
      <GoldLoader segmentId={segmentId} />
    </AdminOnly>
  );
}

function GoldLoader({ segmentId }: { segmentId: string }) {
  const session = useGoldSession(segmentId);
  if (session.isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }
  if (session.error || !session.data) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <Alert variant="destructive"><AlertDescription>{researchErrorText(session.error)}</AlertDescription></Alert>
      </div>
    );
  }
  return <GoldLabeler segment={session.data.segment} match={session.data.match} initialLabels={session.data.labels} />;
}

function GoldLabeler({ segment, match, initialLabels }: { segment: ResearchSegment; match: ResearchMatch; initialLabels: GoldLabel[] }) {
  const navigate = useNavigate();
  const [player, setPlayer] = useState<YTPlayer | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [time, setTime] = useState(segment.position_s ?? segment.start_s);
  const [rateIndex, setRateIndex] = useState(PLAYBACK_RATES.length - 1);
  // Creation order: the last element is "the last event" for Backspace / M / U.
  const [labels, setLabels] = useState<Label[]>(() => initialLabels.map(({ created_at: _c, ...l }) => l));
  const [pendingShot, setPendingShot] = useState<{ t: number; team: "A" | "B" } | null>(null);
  // Right after seekTo, YouTube keeps returning the old time for a while. While paused,
  // the page's own last seek target is the true position (frame steps, labels, M).
  const seekTarget = useRef<number | null>(null);

  // ---------- saving: one queue, in order; a failed write stops input until it is retried ----------
  const queue = useRef<SaveOp[]>([]);
  const pumping = useRef<Promise<void> | null>(null);
  const [unsaved, setUnsaved] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const status = useRef(segment.status);

  const pump = useCallback(() => {
    if (pumping.current) return pumping.current;
    pumping.current = (async () => {
      while (queue.current.length > 0) {
        const op = queue.current[0];
        try {
          if (op.kind === "upsert") await upsertLabel(op.label);
          else if (op.kind === "delete") await deleteLabel(op.id);
          else await updateSegment(segment.id, op.patch);
        } catch (e) {
          setSaveError(researchErrorText(e));
          break;
        }
        queue.current.shift();
        setUnsaved(queue.current.length);
      }
      pumping.current = null;
    })();
    return pumping.current;
  }, [segment.id]);

  const save = useCallback(
    (op: SaveOp) => {
      queue.current.push(op);
      setUnsaved(queue.current.length);
      if (!saveError) void pump();
    },
    [pump, saveError],
  );

  const retry = () => {
    setSaveError(null);
    void pump();
  };

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (queue.current.length > 0) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const blocked = saveError !== null || videoError !== null || !player;

  // ---------- playback: clock, segment bounds, periodic position save ----------
  useEffect(() => {
    if (!player) return;
    const id = window.setInterval(() => {
      if (player.getPlayerState() === YT_STATE.PLAYING) seekTarget.current = null;
      const t = seekTarget.current ?? player.getCurrentTime();
      if (t > segment.end_s) {
        player.pauseVideo();
        seekTarget.current = segment.end_s;
        player.seekTo(segment.end_s, true);
      } else if (t < segment.start_s - 0.5) {
        seekTarget.current = segment.start_s;
        player.seekTo(segment.start_s, true);
      }
      setTime(Math.min(Math.max(t, segment.start_s), segment.end_s));
    }, CLOCK_MS);
    return () => window.clearInterval(id);
  }, [player, segment.start_s, segment.end_s]);

  const timeRef = useRef(time);
  timeRef.current = time;
  useEffect(() => {
    if (!player) return;
    let lastSaved = -1;
    const id = window.setInterval(() => {
      const t = timeRef.current;
      if (Math.abs(t - lastSaved) < 0.5) return;
      lastSaved = t;
      if (status.current === "ready") {
        status.current = "in_progress";
        save({ kind: "segment", patch: { position_s: t, status: "in_progress" } });
      } else {
        save({ kind: "segment", patch: { position_s: t } });
      }
    }, POSITION_SAVE_MS);
    return () => window.clearInterval(id);
  }, [player, save]);

  const onReady = (p: YTPlayer) => {
    seekTarget.current = segment.position_s ?? segment.start_s;
    p.seekTo(seekTarget.current, true);
    p.pauseVideo();
    setPlayer(p);
  };

  // ---------- labeling actions ----------
  const addLabel = useCallback(
    (label: Label) => {
      setLabels((ls) => [...ls, label]);
      save({ kind: "upsert", label });
    },
    [save],
  );

  const changeLast = useCallback(
    (patch: Partial<Pick<Label, "t" | "unsure">>) => {
      const last = labels[labels.length - 1];
      if (!last) return;
      const next = { ...last, ...patch };
      setLabels((ls) => [...ls.slice(0, -1), next]);
      save({ kind: "upsert", label: next });
    },
    [labels, save],
  );

  const removeLabel = useCallback(
    (id: string) => {
      setLabels((ls) => ls.filter((l) => l.id !== id));
      save({ kind: "delete", id });
    },
    [save],
  );

  const seek = useCallback(
    (t: number) => {
      if (!player) return;
      const target = Math.min(Math.max(t, segment.start_s), segment.end_s);
      seekTarget.current = target;
      player.seekTo(target, true);
    },
    [player, segment.start_s, segment.end_s],
  );

  const currentTime = useCallback(() => {
    if (!player) throw new Error("player is not ready");
    const paused = player.getPlayerState() !== YT_STATE.PLAYING;
    return paused && seekTarget.current !== null ? seekTarget.current : player.getCurrentTime();
  }, [player]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      // A clicked button keeps focus, and Space would press it again.
      if (target?.tagName === "BUTTON") target.blur();
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (blocked || !player) return;

      if (pendingShot) {
        const outcome = SHOT_OUTCOME_KEYS[e.code];
        if (outcome) {
          e.preventDefault();
          addLabel({ id: crypto.randomUUID(), segment_id: segment.id, t: pendingShot.t, class: "shot", team: pendingShot.team, shot_outcome: outcome, unsure: false });
          setPendingShot(null);
        } else if (e.code === "Escape") {
          e.preventDefault();
          setPendingShot(null);
        }
        return;
      }

      const cls = CLASS_KEYS[e.code];
      if (cls) {
        e.preventDefault();
        if (e.repeat) return;
        const t = currentTime();
        const team = e.shiftKey ? "B" : "A";
        if (cls === "shot") {
          player.pauseVideo();
          setPendingShot({ t, team });
        } else {
          addLabel({ id: crypto.randomUUID(), segment_id: segment.id, t, class: cls, team, shot_outcome: null, unsure: false });
        }
        return;
      }

      const paused = player.getPlayerState() !== YT_STATE.PLAYING;
      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (e.repeat) return;
          if (paused) player.playVideo();
          else player.pauseVideo();
          return;
        case "ArrowLeft":
          e.preventDefault();
          seek(currentTime() - JUMP_S);
          return;
        case "ArrowRight":
          e.preventDefault();
          seek(currentTime() + JUMP_S);
          return;
        case "Comma":
        case "Period":
          e.preventDefault();
          if (!paused) return;
          seek(currentTime() + (e.code === "Comma" ? -FRAME_S : FRAME_S));
          return;
        case "BracketLeft":
        case "BracketRight": {
          e.preventDefault();
          if (e.repeat) return;
          const next = Math.min(Math.max(rateIndex + (e.code === "BracketLeft" ? -1 : 1), 0), PLAYBACK_RATES.length - 1);
          setRateIndex(next);
          player.setPlaybackRate(PLAYBACK_RATES[next]);
          return;
        }
        case "Backspace": {
          e.preventDefault();
          if (e.repeat) return;
          const last = labels[labels.length - 1];
          if (last) removeLabel(last.id);
          return;
        }
        case "KeyM":
          e.preventDefault();
          if (e.repeat) return;
          changeLast({ t: currentTime() });
          return;
        case "KeyU": {
          e.preventDefault();
          if (e.repeat) return;
          const last = labels[labels.length - 1];
          if (last) changeLast({ unsure: !last.unsure });
          return;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [blocked, player, pendingShot, labels, rateIndex, segment.id, addLabel, changeLast, removeLabel, seek, currentTime]);

  const finish = async () => {
    if (!window.confirm("Отметить отрезок как готовый? Вернуться и поправить можно будет и потом.")) return;
    player?.pauseVideo();
    status.current = "done";
    save({ kind: "segment", patch: { status: "done", position_s: timeRef.current } });
    await pump();
    if (queue.current.length === 0) navigate("/admin/research");
  };

  const lastId = labels[labels.length - 1]?.id;
  const sorted = useMemo(() => [...labels].sort((a, b) => b.t - a.t), [labels]);
  const counts = useMemo(() => EVENT_CLASSES.map((c) => [c, labels.filter((l) => l.class === c).length] as const), [labels]);
  const progress = ((time - segment.start_s) / (segment.end_s - segment.start_s)) * 100;

  return (
    <div className="container mx-auto max-w-7xl space-y-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/research" aria-label="Назад"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Эталон · {match.id}</h1>
            <p className="text-sm text-muted-foreground">
              {match.league} · команда A — <b>{match.team_a_color}</b>, команда B (с Shift) — <b>{match.team_b_color}</b>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className={unsaved > 0 ? "text-amber-600" : "text-muted-foreground"}>
            {unsaved > 0 ? `Сохраняется: ${unsaved}` : "Всё сохранено"}
          </span>
          <Button onClick={finish} disabled={saveError !== null}>Готово</Button>
        </div>
      </div>

      {saveError && (
        <Alert variant="destructive">
          <AlertTitle>Не сохранилось — разметка остановлена</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>{saveError}. Ничего не потеряно: несохранённое ({unsaved}) ждёт повтора. Не закрывайте страницу.</span>
            <Button size="sm" variant="outline" onClick={retry}>Повторить</Button>
          </AlertDescription>
        </Alert>
      )}
      {videoError && (
        <Alert variant="destructive"><AlertDescription>{videoError}</AlertDescription></Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <YouTubePlayer
            videoId={match.youtube_id}
            startS={segment.position_s ?? segment.start_s}
            controls={false}
            onReady={onReady}
            onError={(code) => setVideoError(youtubeErrorText(code))}
            onLoadFailed={setVideoError}
          />
          <div className="flex items-center gap-3 font-mono text-sm">
            <span>{fmtTime(time)}</span>
            <Progress value={progress} className="h-2 flex-1" />
            <span>{fmtTime(segment.end_s)}</span>
            <Badge variant="outline">×{PLAYBACK_RATES[rateIndex]}</Badge>
          </div>

          {pendingShot ? (
            <div className="rounded-lg border-2 border-primary p-4">
              <p className="font-semibold">Удар команды {pendingShot.team} в {fmtTime(pendingShot.t)} — чем закончился?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SHOT_OUTCOMES.map((o, i) => (
                  <Badge key={o} variant="secondary" className="text-sm">{i + 1} — {SHOT_OUTCOME_LABEL[o]}</Badge>
                ))}
                <Badge variant="outline" className="text-sm">Esc — отмена</Badge>
              </div>
            </div>
          ) : (
            <div className="space-y-2 rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap gap-2">
                {GOLD_EVENT_HINTS.map((h) => (
                  <span key={h.key}><kbd className="rounded border bg-muted px-1.5 font-mono">{h.key}</kbd> {h.label}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                {GOLD_CONTROL_HINTS.map((h) => (
                  <span key={h.key}><kbd className="rounded border bg-muted px-1.5 font-mono">{h.key}</kbd> {h.label}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {counts.map(([c, n]) => (
              <Badge key={c} variant="outline">{CLASS_LABEL[c]}: {n}</Badge>
            ))}
          </div>
          <ScrollArea className="h-[480px] rounded-lg border">
            {sorted.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Событий пока нет. Включите видео пробелом и жмите клавиши.</p>
            ) : (
              <ul className="divide-y">
                {sorted.map((l) => (
                  <li key={l.id} className={`flex items-center gap-2 px-3 py-1.5 text-sm ${l.id === lastId ? "bg-primary/10" : ""}`}>
                    <button type="button" className="flex flex-1 items-center gap-2 text-left" onClick={() => { player?.pauseVideo(); seek(l.t - 1); }}>
                      <span className="font-mono text-muted-foreground">{fmtTime(l.t)}</span>
                      <span>{CLASS_LABEL[l.class as EventClass]}</span>
                      <Badge variant={l.team === "A" ? "default" : "secondary"} className="px-1.5">{l.team}</Badge>
                      {l.shot_outcome && <span className="text-muted-foreground">{SHOT_OUTCOME_LABEL[l.shot_outcome]}</span>}
                      {l.unsure && <span className="text-amber-600">?</span>}
                    </button>
                    <button type="button" aria-label="Удалить" disabled={blocked} onClick={() => removeLabel(l.id)} className="text-muted-foreground hover:text-destructive disabled:opacity-40">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
