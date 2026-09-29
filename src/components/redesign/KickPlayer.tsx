import { useEffect, useRef, useState } from "react";
import { useDesignCopy } from "@/hooks/useDesignCopy";
import { ANGLE_CHECKS, BONES, CONTACT_FRAME, FRAME_COUNT, GROUND_Y, KICKING_BONES, ballAt, kickData, measure, phaseAt, poseAt, type AngleCheck, type Pose } from "@/lib/kickPose";

const FPS = kickData.fps;
const PLAYBACK = 0.45; // Real speed is ~1.3 s for the whole kick; slower playback lets the angles be read.
const HOLD_AT_CONTACT = 900, HOLD_AT_END = 700;
const VIEW = { x: 77, y: 540, w: 416, h: 320 };

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function AngleArc({ pose, check }: { pose: Pose; check: AngleCheck }) {
  const [a, b, c] = ANGLE_CHECKS[check].joints;
  const vertex = pose[b];
  const end = c ? pose[c] : { x: vertex.x, y: vertex.y - 100 };
  const r = 26;
  const start = Math.atan2(pose[a].y - vertex.y, pose[a].x - vertex.x), stop = Math.atan2(end.y - vertex.y, end.x - vertex.x);
  let sweep = stop - start;
  if (sweep > Math.PI) sweep -= 2 * Math.PI;
  if (sweep < -Math.PI) sweep += 2 * Math.PI;
  const p1 = { x: vertex.x + r * Math.cos(start), y: vertex.y + r * Math.sin(start) }, p2 = { x: vertex.x + r * Math.cos(stop), y: vertex.y + r * Math.sin(stop) };
  return <g>
    {!c && <path d={`M${vertex.x} ${vertex.y}V${vertex.y - 110}`} stroke="#9A9B90" strokeDasharray="4 4" strokeWidth="1.5" />}
    <path d={`M${p1.x} ${p1.y}A${r} ${r} 0 0 ${sweep > 0 ? 1 : 0} ${p2.x} ${p2.y}`} stroke="#6FD39C" strokeWidth="2.4" fill="none" />
    <circle cx={vertex.x} cy={vertex.y} r="6" fill="none" stroke="#6FD39C" strokeWidth="2" />
    <text x={vertex.x + 32} y={vertex.y - 12} fill="#6FD39C" fontFamily="IBM Plex Mono, monospace" fontSize="17">{Math.round(measure(pose, check))}°</text>
  </g>;
}

export function Skeleton({ pose, stroke = "#9A9B90", accent = "#6FD39C", width = 4 }: { pose: Pose; stroke?: string; accent?: string; width?: number }) {
  return <g strokeLinecap="round" strokeLinejoin="round">
    {BONES.map(([a, b]) => <line key={`${a}-${b}`} x1={pose[a].x} y1={pose[a].y} x2={pose[b].x} y2={pose[b].y}
      stroke={KICKING_BONES.has(`${a}-${b}`) ? accent : stroke} strokeWidth={KICKING_BONES.has(`${a}-${b}`) ? width * 1.15 : width} />)}
    <circle cx={pose.nose.x} cy={pose.nose.y - 4} r={width * 3.2} fill="none" stroke={stroke} strokeWidth={width} />
  </g>;
}

/** Hero: one real labelled kick, replayed from its pose data with the angles the scorer checks. */
export function KickPlayer() {
  const copy = useDesignCopy();
  const [t, setT] = useState(prefersReducedMotion() ? CONTACT_FRAME : 0);
  const [playing, setPlaying] = useState(!prefersReducedMotion());
  const [check, setCheck] = useState<AngleCheck>("knee");
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !visible) return;
    let raf = 0, last = performance.now(), holdUntil = 0, current = t;
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      if (now >= holdUntil) {
        const next = current + dt / 1000 * FPS * PLAYBACK;
        if (current >= FRAME_COUNT - 1) current = 0;
        else if (current < CONTACT_FRAME && next >= CONTACT_FRAME) { current = CONTACT_FRAME; holdUntil = now + HOLD_AT_CONTACT; }
        else if (next >= FRAME_COUNT - 1) { current = FRAME_COUNT - 1; holdUntil = now + HOLD_AT_END; }
        else current = next;
        setT(current);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // The loop owns `t` while playing; restarting it on every frame would reset the hold timers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, visible]);

  const pose = poseAt(t);
  const ball = ballAt(t);
  const contactPose = poseAt(CONTACT_FRAME);
  const trail = Array.from({ length: 10 }, (_, i) => t - 9 + i).filter(f => f >= 0).map(f => poseAt(f).r_foot);
  const phase = phaseAt(t);
  const atContact = measure(contactPose, check);
  const target = ANGLE_CHECKS[check].target;
  const time = (t / FPS).toFixed(2);

  return <div className="kick-player" ref={rootRef}>
    <div className="kick-player-screen">
      <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} role="img" aria-label={copy("A real kick replayed from pose data. Use the timeline to move through it.")}>
        <defs><clipPath id="kick-player-clip"><rect x={VIEW.x} y={VIEW.y} width={VIEW.w} height={VIEW.h} /></clipPath></defs>
        <g clipPath="url(#kick-player-clip)">
          <path d={`M${VIEW.x} ${GROUND_Y + 4}H${VIEW.x + VIEW.w}`} stroke="#2E302A" strokeWidth="2" />
          {trail.length > 1 && <path d={trail.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ")} stroke="#6FD39C" strokeOpacity=".35" strokeWidth="2" strokeDasharray="3 4" fill="none" />}
          <circle cx={ball.x} cy={ball.y} r={ball.r} fill="none" stroke="#F3F1EC" strokeWidth="2.4" />
          <Skeleton pose={pose} />
          <AngleArc pose={pose} check={check} />
        </g>
      </svg>
      <span className="kick-player-label">KICK_354.MOV · {copy("REAL POSE DATA")}</span>
      <span className="kick-player-phase" data-contact={phase === "Contact" || undefined}>{copy(phase).toUpperCase()}</span>
      <span className="kick-player-time">F{String(Math.round(t)).padStart(2, "0")} · 0:{time.padStart(5, "0")}</span>
    </div>
    <div className="kick-player-controls">
      <button className="kick-player-play" onClick={() => { if (!playing && t >= FRAME_COUNT - 1) setT(0); setPlaying(!playing); }} aria-label={playing ? copy("Pause") : copy("Play")}>
        {playing ? <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2v8M9 2v8" stroke="currentColor" strokeWidth="2" /></svg> : <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5 10 6 3 10.5Z" fill="currentColor" /></svg>}
      </button>
      <div className="kick-player-track">
        <input type="range" min={0} max={FRAME_COUNT - 1} step={0.01} value={t} aria-label={copy("Kick timeline")}
          onChange={event => { setPlaying(false); setT(Number(event.target.value)); }} />
        <span className="kick-player-contact" style={{ left: `${CONTACT_FRAME / (FRAME_COUNT - 1) * 100}%` }} aria-hidden="true" />
      </div>
      <button className="kick-player-jump" onClick={() => { setPlaying(false); setT(CONTACT_FRAME); }}>{copy("Contact")}</button>
    </div>
    <div className="kick-player-checks" role="group" aria-label={copy("Choose which angle to show")}>
      {(Object.keys(ANGLE_CHECKS) as AngleCheck[]).map(key => <button key={key} aria-pressed={check === key} onClick={() => setCheck(key)}>
        <span>{copy(ANGLE_CHECKS[key].label)}</span>
        <strong>{Math.round(measure(pose, key))}°</strong>
      </button>)}
    </div>
    <p className="kick-player-verdict">
      {copy("At contact")}: <strong>{Math.round(atContact)}°</strong> · {copy("target")} {target}° · {copy("difference")} <strong>{Math.round(Math.abs(atContact - target))}°</strong>
    </p>
  </div>;
}
