import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Pencil, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminOnly } from "@/components/admin/research/AdminOnly";
import { YouTubePlayer } from "@/components/admin/research/YouTubePlayer";
import { useSaveQueue } from "@/hooks/useSaveQueue";
import { useSegmentPlayer } from "@/hooks/useSegmentPlayer";
import {
  researchErrorText,
  updateSegment,
  upsertReview,
  useReviewSession,
  type Prediction,
  type ResearchMatch,
  type ResearchSegment,
  type Review,
} from "@/hooks/useResearch";
import {
  CLASS_KEYS,
  CLASS_LABEL,
  PLAYBACK_RATES,
  REVIEW_AFTER_S,
  REVIEW_BEFORE_S,
  REVIEW_HINTS,
  SHOT_OUTCOME_KEYS,
  SHOT_OUTCOME_LABEL,
  SHOT_OUTCOMES,
  fmtTime,
  type EventClass,
} from "@/lib/research/keymap";
import { YT_STATE, youtubeErrorText, type YTPlayer } from "@/lib/research/youtube";

type SaveOp = { kind: "review"; review: Review } | { kind: "segment"; patch: Parameters<typeof updateSegment>[1] };

type Team = "A" | "B";

/** Review of the model's events on one segment: keys only, every answer saved right away. Admins only. */
export default function ResearchReview() {
  const { segmentId } = useParams<{ segmentId: string }>();
  if (!segmentId) throw new Error("segmentId is missing from the route");
  return (
    <AdminOnly>
      <ReviewLoader segmentId={segmentId} />
    </AdminOnly>
  );
}

function ReviewLoader({ segmentId }: { segmentId: string }) {
  const session = useReviewSession(segmentId);
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
  const { segment, match, predictions, reviews } = session.data;
  return <Reviewer segment={segment} match={match} predictions={predictions} initialReviews={reviews} />;
}

function Reviewer({
  segment,
  match,
  predictions,
  initialReviews,
}: {
  segment: ResearchSegment;
  match: ResearchMatch;
  predictions: Prediction[];
  initialReviews: Review[];
}) {
  const navigate = useNavigate();
  const [player, setPlayer] = useState<YTPlayer | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [rateIndex, setRateIndex] = useState(PLAYBACK_RATES.length - 1);
  const [reviews, setReviews] = useState<Map<string, Review>>(() => new Map(initialReviews.map((r) => [r.prediction_id, r])));
  const [teamACluster, setTeamACluster] = useState(segment.team_a_cluster);
  // Resume at the first prediction without an answer.
  const [index, setIndex] = useState(() => {
    const first = predictions.findIndex((p) => !initialReviews.some((r) => r.prediction_id === p.id));
    return first === -1 ? 0 : first;
  });
  const [pendingShot, setPendingShot] = useState<{ verdict: "correct" | "relabel"; team: Team } | null>(null);
  const [lastAnswered, setLastAnswered] = useState<string | null>(null);
  const status = useRef(segment.status);
  const stopAt = useRef<number | null>(null);

  const { time, seek, currentTime } = useSegmentPlayer(player, segment.start_s, segment.end_s, segment.start_s);
  const { save, retry, flush, unsaved, error: saveError } = useSaveQueue<SaveOp>((op) =>
    op.kind === "review" ? upsertReview(op.review) : updateSegment(segment.id, op.patch),
  );

  const clustered = predictions.some((p) => p.cluster !== null);
  const needsTeamMapping = clustered && teamACluster === null;
  const blocked = saveError !== null || videoError !== null || !player || needsTeamMapping;
  const current = predictions[index] as Prediction | undefined;

  const modelTeam = useCallback(
    (p: Prediction): Team | null => (p.cluster === null || teamACluster === null ? null : p.cluster === teamACluster ? "A" : "B"),
    [teamACluster],
  );

  // ---------- playback: each event plays from 2 s before to 1 s after ----------
  const playAround = useCallback(
    (t: number) => {
      if (!player) return;
      seek(t - REVIEW_BEFORE_S);
      stopAt.current = t + REVIEW_AFTER_S;
      player.playVideo();
    },
    [player, seek],
  );

  useEffect(() => {
    if (!player || stopAt.current === null) return;
    if (player.getPlayerState() === YT_STATE.PLAYING && time >= stopAt.current) {
      player.pauseVideo();
      seek(stopAt.current);
      stopAt.current = null;
    }
  }, [time, player, seek]);

  useEffect(() => {
    if (current && player && !needsTeamMapping) playAround(current.t);
    // Only when the event under review changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, player, needsTeamMapping]);

  const onReady = (p: YTPlayer) => {
    p.seekTo(segment.start_s, true);
    p.pauseVideo();
    setPlayer(p);
  };

  // ---------- answers ----------
  const answer = useCallback(
    (review: Review) => {
      setReviews((m) => new Map(m).set(review.prediction_id, review));
      save({ kind: "review", review });
      if (status.current === "ready") {
        status.current = "in_progress";
        save({ kind: "segment", patch: { status: "in_progress" } });
      }
      setLastAnswered(review.prediction_id);
      setIndex((i) => Math.min(i + 1, predictions.length - 1));
    },
    [save, predictions.length],
  );

  const toggleUnsure = useCallback(() => {
    if (!lastAnswered) return;
    const r = reviews.get(lastAnswered);
    if (!r) return;
    const next = { ...r, unsure: !r.unsure };
    setReviews((m) => new Map(m).set(next.prediction_id, next));
    save({ kind: "review", review: next });
  }, [lastAnswered, reviews, save]);

  const chooseTeamA = (cluster: 0 | 1) => {
    setTeamACluster(cluster);
    save({ kind: "segment", patch: { team_a_cluster: cluster } });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (target?.tagName === "BUTTON") target.blur();
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (blocked || !player || !current) return;
      if (e.repeat && e.code !== "ArrowLeft" && e.code !== "ArrowRight") return;

      if (pendingShot) {
        const outcome = SHOT_OUTCOME_KEYS[e.code];
        if (outcome) {
          e.preventDefault();
          answer({
            prediction_id: current.id,
            verdict: pendingShot.verdict,
            class: "shot",
            team: pendingShot.team,
            t: current.t,
            shot_outcome: outcome,
            unsure: false,
          });
          setPendingShot(null);
        } else if (e.code === "Escape") {
          e.preventDefault();
          setPendingShot(null);
        }
        return;
      }

      const give = (verdict: "correct" | "relabel", cls: EventClass, team: Team) => {
        if (cls === "shot") {
          player.pauseVideo();
          setPendingShot({ verdict, team });
          return;
        }
        answer({ prediction_id: current.id, verdict, class: cls, team, t: current.t, shot_outcome: null, unsure: false });
      };

      const cls = CLASS_KEYS[e.code];
      if (cls) {
        e.preventDefault();
        give("relabel", cls, e.shiftKey ? "B" : "A");
        return;
      }

      switch (e.code) {
        case "Enter":
        case "NumpadEnter": {
          e.preventDefault();
          // A known model team is taken as is; an unknown one is A, or B with Shift.
          const team = modelTeam(current) ?? (e.shiftKey ? "B" : "A");
          give("correct", current.class, team);
          return;
        }
        case "KeyN":
          e.preventDefault();
          answer({ prediction_id: current.id, verdict: "not_event", class: null, team: null, t: null, shot_outcome: null, unsure: false });
          return;
        case "KeyR":
          e.preventDefault();
          playAround(current.t);
          return;
        case "KeyU":
          e.preventDefault();
          toggleUnsure();
          return;
        case "ArrowLeft":
          e.preventDefault();
          setIndex((i) => Math.max(i - 1, 0));
          return;
        case "ArrowRight":
          e.preventDefault();
          setIndex((i) => Math.min(i + 1, predictions.length - 1));
          return;
        case "Space":
          e.preventDefault();
          stopAt.current = null;
          if (player.getPlayerState() === YT_STATE.PLAYING) {
            player.pauseVideo();
            seek(currentTime());
          } else {
            player.playVideo();
          }
          return;
        case "BracketLeft":
        case "BracketRight": {
          e.preventDefault();
          const next = Math.min(Math.max(rateIndex + (e.code === "BracketLeft" ? -1 : 1), 0), PLAYBACK_RATES.length - 1);
          setRateIndex(next);
          player.setPlaybackRate(PLAYBACK_RATES[next]);
          return;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [blocked, player, current, pendingShot, rateIndex, predictions.length, answer, toggleUnsure, playAround, modelTeam, seek, currentTime]);

  const finish = async () => {
    if (!window.confirm("Отметить проверку отрезка как готовую? Вернуться и поправить можно будет и потом.")) return;
    player?.pauseVideo();
    status.current = "done";
    save({ kind: "segment", patch: { status: "done" } });
    if (await flush()) navigate("/admin/research");
  };

  const answered = reviews.size;
  const clusterExample = useMemo(() => predictions.find((p) => p.cluster === 0), [predictions]);

  return (
    <div className="container mx-auto max-w-7xl space-y-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/research" aria-label="Назад"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Проверка · {match.id}</h1>
            <p className="text-sm text-muted-foreground">
              {match.league} · команда A — <b>{match.team_a_color}</b>, команда B (с Shift) — <b>{match.team_b_color}</b>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">Проверено {answered} из {predictions.length}</span>
          <span className={unsaved > 0 ? "text-amber-600" : "text-muted-foreground"}>
            {unsaved > 0 ? `Сохраняется: ${unsaved}` : "Всё сохранено"}
          </span>
          <Button onClick={finish} disabled={saveError !== null}>Готово</Button>
        </div>
      </div>

      {saveError && (
        <Alert variant="destructive">
          <AlertTitle>Не сохранилось — проверка остановлена</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>{saveError}. Ничего не потеряно: несохранённое ({unsaved}) ждёт повтора. Не закрывайте страницу.</span>
            <Button size="sm" variant="outline" onClick={retry}>Повторить</Button>
          </AlertDescription>
        </Alert>
      )}
      {videoError && <Alert variant="destructive"><AlertDescription>{videoError}</AlertDescription></Alert>}
      {predictions.length === 0 && (
        <Alert><AlertDescription>Модель не нашла на этом отрезке ни одного события.</AlertDescription></Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <YouTubePlayer
            videoId={match.youtube_id}
            startS={segment.start_s}
            controls={false}
            onReady={onReady}
            onError={(code) => setVideoError(youtubeErrorText(code))}
            onLoadFailed={setVideoError}
          />
          <div className="flex items-center gap-3 font-mono text-sm">
            <span>{fmtTime(time)}</span>
            <Progress value={predictions.length ? (answered / predictions.length) * 100 : 0} className="h-2 flex-1" />
            <span>{answered}/{predictions.length}</span>
            <Badge variant="outline">×{PLAYBACK_RATES[rateIndex]}</Badge>
          </div>

          {needsTeamMapping && clusterExample ? (
            <div className="space-y-3 rounded-lg border-2 border-primary p-4">
              <p className="font-semibold">Сначала один вопрос: модель делит игроков на две группы, но не знает, кто из них A.</p>
              <p className="text-sm">
                Посмотрите момент в {fmtTime(clusterExample.t)} — кто играет мячом? Это игрок группы, которую надо назвать.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" disabled={!player} onClick={() => playAround(clusterExample.t)}>Показать момент</Button>
                <Button onClick={() => chooseTeamA(0)}>Это команда A ({match.team_a_color})</Button>
                <Button onClick={() => chooseTeamA(1)}>Это команда B ({match.team_b_color})</Button>
              </div>
            </div>
          ) : current ? (
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-sm">
                <span className="text-muted-foreground">Модель, {fmtTime(current.t)}:</span>{" "}
                <b>{CLASS_LABEL[current.class]}</b>
                {current.raw_class !== current.class.toUpperCase() && (
                  <span className="text-muted-foreground"> ({current.raw_class.toLowerCase()})</span>
                )}
                {" · "}
                {modelTeam(current) ? <>команда <b>{modelTeam(current)}</b></> : <span className="text-amber-600">команда неизвестна: Enter — A, Shift+Enter — B</span>}
                <span className="text-muted-foreground"> · уверенность {Math.round(current.confidence * 100)}%</span>
              </p>
              {pendingShot ? (
                <div className="flex flex-wrap gap-2">
                  <span className="font-semibold">Удар — чем закончился?</span>
                  {SHOT_OUTCOMES.map((o, i) => (
                    <Badge key={o} variant="secondary" className="text-sm">{i + 1} — {SHOT_OUTCOME_LABEL[o]}</Badge>
                  ))}
                  <Badge variant="outline" className="text-sm">Esc — отмена</Badge>
                </div>
              ) : (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {REVIEW_HINTS.map((h) => (
                    <span key={h.key}><kbd className="rounded border bg-muted px-1.5 font-mono">{h.key}</kbd> {h.label}</span>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <ScrollArea className="h-[520px] rounded-lg border">
          <ul className="divide-y">
            {predictions.map((p, i) => {
              const r = reviews.get(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={blocked}
                    onClick={() => setIndex(i)}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${i === index ? "bg-primary/10" : ""}`}
                  >
                    <span className="font-mono text-muted-foreground">{fmtTime(p.t)}</span>
                    <span className="flex-1">{CLASS_LABEL[p.class]}</span>
                    {r?.verdict === "correct" && <Check className="h-4 w-4 text-green-600" />}
                    {r?.verdict === "not_event" && <X className="h-4 w-4 text-destructive" />}
                    {r?.verdict === "relabel" && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Pencil className="h-3.5 w-3.5" />
                        {r.class && CLASS_LABEL[r.class]}
                      </span>
                    )}
                    {r && r.verdict !== "not_event" && <Badge variant="outline" className="px-1.5">{r.team}</Badge>}
                    {r?.unsure && <span className="text-amber-600">?</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </div>
    </div>
  );
}
