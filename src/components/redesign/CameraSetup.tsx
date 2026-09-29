import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useDesignCopy } from "@/hooks/useDesignCopy";
import { BONES, CONTACT_FRAME, FRAME_COUNT, GROUND_Y, KICKING_BONES, ballAt, kickData, poseAt, type Pose } from "@/lib/kickPose";

// Top-down plan: metres around the player, kick direction = +x. 30 SVG units per metre.
const PLAN = { w: 12, h: 9, unit: 30, player: { x: 6, y: 6.3 } };
const START = { x: 3.8, y: 4.8 }; // Deliberately wrong: close and diagonal from behind, so the first drag teaches something.
const IDEAL = { x: 6, y: 2.5 }; // 3.8 m straight to the side, the side the reference video was filmed from.
const MIN_DISTANCE = 1;
// A phone's main camera in landscape sees ~43° vertically; the phone is held at hip height.
const VERTICAL_FOV = 43 * Math.PI / 180, CAMERA_HEIGHT = 0.95;
const VIEWFINDER = { w: 320, h: 180 };

const contact = poseAt(CONTACT_FRAME);
const hipX = (contact.l_hip.x + contact.r_hip.x) / 2;
const pxPerMetre = (GROUND_Y - contact.nose.y) / 1.62; // nose height of a ~1.75 m player

type Check = { key: string; state: "ok" | "warn" | "bad"; label: string; value: string };

/** Projects the real pose at frame t onto a camera placed on the plan. */
function project(camera: { x: number; y: number }, t: number) {
  const dx = PLAN.player.x - camera.x, dy = PLAN.player.y - camera.y;
  const distance = Math.hypot(dx, dy);
  const view = { x: dx / distance, y: dy / distance }, right = { x: view.y, y: -view.x };
  const scale = VIEWFINDER.h / (2 * distance * Math.tan(VERTICAL_FOV / 2)); // viewfinder units per metre
  const toScreen = (worldX: number, worldY: number, height: number) => ({
    x: VIEWFINDER.w / 2 + (worldX * right.x + worldY * right.y) * scale,
    y: VIEWFINDER.h / 2 - (height - CAMERA_HEIGHT) * scale,
  });
  // MediaPipe's depth is too noisy to rotate, so the body is kept in its sagittal plane and the two sides get
  // anatomical widths. The reference camera saw the kicking (right) side, so right joints are nearer to it.
  const point = (p: { x: number; y: number }, depth: number) => toScreen((p.x - hipX) / pxPerMetre, depth, (GROUND_Y - p.y) / pxPerMetre);
  const depthOf = (name: string) => (name.startsWith("r_") ? -1 : name.startsWith("l_") ? 1 : 0) * (/shoulder|elbow|wrist/.test(name) ? 0.18 : 0.1);
  const pose = Object.fromEntries(Object.entries(poseAt(t)).map(([name, p]) => [name, { ...point(p, depthOf(name)), z: 0 }])) as Pose;
  const ball = point(ballAt(t), -0.1);
  const ballR = kickData.ball.r / pxPerMetre * scale;
  const ground = toScreen(0, 0, 0).y;
  const angleToKick = Math.abs(Math.atan2(view.y, view.x) * 180 / Math.PI); // 0 = filming from behind, 90 = side, 180 = front
  return { pose, ball, ballR, ground, distance, scale, sideError: Math.abs(90 - angleToKick), fromBehind: angleToKick < 90 };
}

export function CameraSetup() {
  const copy = useDesignCopy();
  const [camera, setCamera] = useState(START);
  const [dragging, setDragging] = useState(false);
  const planRef = useRef<SVGSVGElement>(null);
  const [t, setT] = useState(CONTACT_FRAME + 4);
  const view = project(camera, t);
  // Framing is judged over the whole kick (the player runs ~3 m), not one frame; the ball only counts before it is struck.
  const inFrame = useMemo(() => Array.from({ length: Math.ceil(FRAME_COUNT / 3) }, (_, i) => i * 3).every(frame => {
    const shot = project(camera, frame);
    const points = frame <= CONTACT_FRAME ? [...Object.values(shot.pose), { x: shot.ball.x, y: shot.ball.y + shot.ballR }] : Object.values(shot.pose);
    return points.every(p => p.x > 4 && p.x < VIEWFINDER.w - 4 && p.y > 4 && p.y < VIEWFINDER.h - 4);
  }), [camera]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      setT(((now - start) / 1000 * kickData.fps * 0.5) % (FRAME_COUNT + 12)); // short rest at the end of each loop
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const moveTo = (x: number, y: number) => {
    const clamped = { x: Math.max(0.3, Math.min(PLAN.w - 0.3, x)), y: Math.max(0.3, Math.min(PLAN.h - 0.3, y)) };
    const dx = clamped.x - PLAN.player.x, dy = clamped.y - PLAN.player.y, d = Math.hypot(dx, dy);
    setCamera(d < MIN_DISTANCE ? { x: PLAN.player.x + dx / d * MIN_DISTANCE, y: PLAN.player.y + dy / d * MIN_DISTANCE } : clamped);
  };
  const fromPointer = (event: PointerEvent<SVGSVGElement>) => {
    const svg = planRef.current, matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    moveTo(point.x / PLAN.unit, point.y / PLAN.unit);
  };
  const onKey = (event: KeyboardEvent) => {
    const step = event.shiftKey ? 1 : 0.25;
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
    if (!delta) return;
    event.preventDefault();
    moveTo(camera.x + delta[0], camera.y + delta[1]);
  };

  const bodyHeight = 1.7 * view.scale / VIEWFINDER.h;
  // Any angle is analysed (the model is trained on kicks filmed from every side); the angle only changes accuracy.
  const accuracy = view.sideError <= 20 ? copy("best accuracy") : view.sideError <= 45 ? copy("good accuracy") : copy("works");
  const checks: Check[] = [
    { key: "angle", label: copy("Camera angle"), value: `${Math.round(90 - view.sideError)}° · ${accuracy}`, state: "ok" },
    { key: "distance", label: copy("Distance"), value: `${view.distance.toFixed(1)} ${copy("m")}`,
      state: view.distance >= 3 && view.distance <= 5.5 ? "ok" : view.distance > 5.5 && view.distance <= 7 ? "warn" : "bad" },
    { key: "frame", label: copy("Whole body + ball in frame"), value: inFrame ? (bodyHeight < 0.3 ? copy("too small") : copy("yes")) : copy("cut off"),
      state: inFrame ? (bodyHeight < 0.3 ? "warn" : "ok") : "bad" },
  ];
  const ready = checks.every(check => check.state === "ok");
  const hint = !inFrame ? copy("Move the phone back: part of the body or the ball is outside the frame.")
    : view.distance < 3 ? copy("Step back a little: at 3–5 m the whole kick stays in frame.")
    : view.distance > 5.5 ? copy("Come a little closer: the player should fill about half of the frame height.")
    : view.sideError > 45 ? (view.fromBehind ? copy("This angle works: the analysis reads kicks filmed from behind too. Filming from the side gives the most accurate result.") : copy("This angle works: the analysis reads kicks filmed from the front too. Filming from the side gives the most accurate result."))
    : view.sideError > 20 ? copy("Good angle. Move a little further to the side for the most accurate result.")
    : copy("Best setup: from the side every joint angle is visible. Hit record.");

  const phone = { x: camera.x * PLAN.unit, y: camera.y * PLAN.unit };
  const facing = Math.atan2(PLAN.player.y - camera.y, PLAN.player.x - camera.x) * 180 / Math.PI;
  const ringR = (m: number) => m * PLAN.unit;

  return <div className="camera-setup" data-ready={ready || undefined}>
    <div className="camera-setup-plan">
      <span className="design-eyebrow">{copy("Drag the phone · any angle works")}</span>
      <svg ref={planRef} viewBox={`0 0 ${PLAN.w * PLAN.unit} ${PLAN.h * PLAN.unit}`}
        onPointerDown={event => { setDragging(true); event.currentTarget.setPointerCapture(event.pointerId); fromPointer(event); }}
        onPointerMove={event => dragging && fromPointer(event)}
        onPointerUp={() => setDragging(false)}
        aria-hidden="true">
        {Array.from({ length: PLAN.w - 1 }, (_, i) => Array.from({ length: PLAN.h - 1 }, (_, j) =>
          <circle key={`${i}-${j}`} cx={(i + 1) * PLAN.unit} cy={(j + 1) * PLAN.unit} r="1.2" fill="#C8C4BA" />))}
        {[-1].map(side => {
          // Best-accuracy zone: 3–5.5 m, within 20° of straight to the side (the other side is equally good but off the plan).
          const a1 = (90 - 20) * Math.PI / 180, a2 = (90 + 20) * Math.PI / 180, cx = PLAN.player.x * PLAN.unit, cy = PLAN.player.y * PLAN.unit;
          const pt = (r: number, a: number) => `${cx + Math.cos(a) * ringR(r)} ${cy + side * Math.sin(a) * ringR(r)}`;
          return <path key={side} d={`M${pt(3, a1)}L${pt(5.5, a1)}A${ringR(5.5)} ${ringR(5.5)} 0 0 ${side > 0 ? 1 : 0} ${pt(5.5, a2)}L${pt(3, a2)}A${ringR(3)} ${ringR(3)} 0 0 ${side > 0 ? 0 : 1} ${pt(3, a1)}Z`}
            fill="#E3EBE1" stroke="#A7BDA7" strokeDasharray="4 4" />;
        })}
        <text x={PLAN.player.x * PLAN.unit} y={(PLAN.player.y - 4.25) * PLAN.unit + 4} textAnchor="middle" fill="var(--pitch)" fontFamily="IBM Plex Mono, monospace" fontSize="8.5" letterSpacing=".6">{copy("MOST ACCURATE")}</text>
        <path d={`M${PLAN.player.x * PLAN.unit + 16} ${PLAN.player.y * PLAN.unit}H${PLAN.w * PLAN.unit - 12}`} stroke="#5C5E54" strokeDasharray="5 5" strokeWidth="1.5" />
        <path d={`M${PLAN.w * PLAN.unit - 20} ${PLAN.player.y * PLAN.unit - 6}L${PLAN.w * PLAN.unit - 12} ${PLAN.player.y * PLAN.unit}L${PLAN.w * PLAN.unit - 20} ${PLAN.player.y * PLAN.unit + 6}`} stroke="#5C5E54" strokeWidth="1.5" fill="none" />
        <text x={PLAN.w * PLAN.unit - 12} y={PLAN.player.y * PLAN.unit - 12} textAnchor="end" fill="#5C5E54" fontFamily="IBM Plex Mono, monospace" fontSize="10">{copy("KICK")}</text>
        <circle cx={PLAN.player.x * PLAN.unit} cy={PLAN.player.y * PLAN.unit} r="10" fill="#F3F1EC" stroke="#14150F" strokeWidth="2" />
        <circle cx={PLAN.player.x * PLAN.unit + 16} cy={PLAN.player.y * PLAN.unit + 6} r="5" fill="none" stroke="var(--pitch)" strokeWidth="1.8" />
        <line x1={phone.x} y1={phone.y} x2={PLAN.player.x * PLAN.unit} y2={PLAN.player.y * PLAN.unit} stroke={ready ? "var(--pitch)" : "#A13B18"} strokeWidth="1.2" strokeDasharray="3 4" />
        <g transform={`translate(${phone.x} ${phone.y}) rotate(${facing})`}>
          <path d="M0 0L90 -40M0 0L90 40" stroke={ready ? "var(--pitch)" : "#C8C4BA"} strokeWidth="1" />
          <rect x="-4" y="-13" width="8" height="26" fill={ready ? "var(--pitch)" : "#14150F"} />
          <circle cx="2" cy="0" r="2" fill="#F3F1EC" />
        </g>
        <text x={(phone.x + PLAN.player.x * PLAN.unit) / 2 + 6} y={(phone.y + PLAN.player.y * PLAN.unit) / 2 - 6} fill="#14150F" fontFamily="IBM Plex Mono, monospace" fontSize="11">{view.distance.toFixed(1)} {copy("m")}</text>
      </svg>
      <div className="camera-setup-actions">
        <button className="design-button-mono design-button design-button-outline camera-setup-handle" onKeyDown={onKey} aria-label={copy("Phone position. Use the arrow keys to move it.")}>{copy("Move with arrow keys")}</button>
        <button className="design-link design-link-underlined" onClick={() => setCamera(IDEAL)}>{copy("Show me the most accurate spot")}</button>
      </div>
    </div>
    <div className="camera-setup-preview">
      <span className="design-eyebrow">{copy("What your phone sees")}</span>
      <div className="camera-setup-screen">
        <svg viewBox={`0 0 ${VIEWFINDER.w} ${VIEWFINDER.h}`} role="img" aria-label={hint}>
          <rect width={VIEWFINDER.w} height={VIEWFINDER.h} fill="#1D1F18" />
          {view.ground < VIEWFINDER.h && <path d={`M0 ${view.ground}H${VIEWFINDER.w}`} stroke="#2E302A" strokeWidth="1.5" />}
          <circle cx={view.ball.x} cy={view.ball.y} r={Math.max(1.5, view.ballR)} fill="none" stroke="#F3F1EC" strokeWidth="1.4" />
          <g strokeLinecap="round">
            {BONES.map(([a, b]) => <line key={`${a}-${b}`} x1={view.pose[a].x} y1={view.pose[a].y} x2={view.pose[b].x} y2={view.pose[b].y}
              stroke={KICKING_BONES.has(`${a}-${b}`) ? "#6FD39C" : "#9A9B90"} strokeWidth="2" />)}
            <circle cx={view.pose.nose.x} cy={view.pose.nose.y} r={Math.max(2, 0.11 * view.scale)} fill="none" stroke="#9A9B90" strokeWidth="2" />
          </g>
          <text x="10" y="18" fill="#9A9B90" fontFamily="IBM Plex Mono, monospace" fontSize="7.5" letterSpacing="1">1080P · 30 FPS · {copy("LANDSCAPE")}</text>
          <text x={VIEWFINDER.w - 10} y="18" textAnchor="end" fill={ready ? "#6FD39C" : "#E7A28A"} fontFamily="IBM Plex Mono, monospace" fontSize="7.5" letterSpacing="1">{ready ? copy("READY TO RECORD") : copy("ADJUST THE PHONE")}</text>
        </svg>
      </div>
      <ul className="camera-setup-checks">
        {checks.map(check => <li key={check.key} data-state={check.state}>
          <span aria-hidden="true">{check.state === "ok" ? "✓" : check.state === "warn" ? "!" : "✕"}</span>
          {check.label}<strong>{check.value}</strong>
        </li>)}
      </ul>
      <p className="camera-setup-hint" aria-live="polite">{hint}</p>
    </div>
  </div>;
}
