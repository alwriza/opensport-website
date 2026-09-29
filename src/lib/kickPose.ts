import kick from "@/data/kick354.json";

/** One real kick (kick_354 from the labelled dataset): MediaPipe landmarks, side view, right foot. */
export const kickData = kick;
export type Point = { x: number; y: number; z: number };
export type Pose = Record<(typeof kick.joints)[number], Point>;

export const CONTACT_FRAME = kick.contact;
export const FRAME_COUNT = kick.frames.length;

export const BONES: [keyof Pose, keyof Pose][] = [
  ["l_shoulder", "r_shoulder"], ["l_shoulder", "l_elbow"], ["l_elbow", "l_wrist"], ["r_shoulder", "r_elbow"], ["r_elbow", "r_wrist"],
  ["l_shoulder", "l_hip"], ["r_shoulder", "r_hip"], ["l_hip", "r_hip"],
  ["l_hip", "l_knee"], ["l_knee", "l_ankle"], ["l_ankle", "l_heel"], ["l_heel", "l_foot"], ["l_ankle", "l_foot"],
  ["r_hip", "r_knee"], ["r_knee", "r_ankle"], ["r_ankle", "r_heel"], ["r_heel", "r_foot"], ["r_ankle", "r_foot"],
];
export const KICKING_BONES = new Set(BONES.slice(13).map(([a, b]) => `${a}-${b}`));

function frame(index: number): Pose {
  const flat = kick.frames[index];
  return Object.fromEntries(kick.joints.map((name, i) => [name, { x: flat[i * 3], y: flat[i * 3 + 1], z: flat[i * 3 + 2] }])) as Pose;
}
const frames = kick.frames.map((_, index) => frame(index));

/** Pose at a fractional frame, linearly interpolated so playback stays smooth at any speed. */
export function poseAt(t: number): Pose {
  const clamped = Math.max(0, Math.min(FRAME_COUNT - 1, t));
  const a = frames[Math.floor(clamped)], b = frames[Math.min(FRAME_COUNT - 1, Math.floor(clamped) + 1)], k = clamped % 1;
  return Object.fromEntries(Object.keys(a).map(name => {
    const p = a[name as keyof Pose], q = b[name as keyof Pose];
    return [name, { x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k, z: p.z + (q.z - p.z) * k }];
  })) as Pose;
}

/** 2D angle at vertex b, in degrees, measured in the image plane. */
export function angle(a: Point, b: Point, c: Point) {
  const v1 = Math.atan2(a.y - b.y, a.x - b.x), v2 = Math.atan2(c.y - b.y, c.x - b.x);
  const deg = Math.abs((v1 - v2) * 180 / Math.PI) % 360;
  return deg > 180 ? 360 - deg : deg;
}

// The same four checks as the geometric scorer, with its targets (Lees & Nolan 1998).
export const ANGLE_CHECKS = {
  knee: { label: "Knee", target: 155, joints: ["r_hip", "r_knee", "r_ankle"] as const },
  ankle: { label: "Ankle", target: 115, joints: ["r_knee", "r_ankle", "r_foot"] as const },
  trunk: { label: "Trunk lean", target: 15, joints: ["r_shoulder", "r_hip", null] as const },
  hip: { label: "Hip", target: 160, joints: ["r_shoulder", "r_hip", "r_knee"] as const },
};
export type AngleCheck = keyof typeof ANGLE_CHECKS;

export function measure(pose: Pose, check: AngleCheck) {
  const [a, b, c] = ANGLE_CHECKS[check].joints;
  const vertex = pose[b];
  const end = c ? pose[c] : { x: vertex.x, y: vertex.y - 100, z: 0 };
  return angle(pose[a], vertex, end);
}

export function phaseAt(t: number) {
  if (Math.abs(t - CONTACT_FRAME) < 0.5) return "Contact";
  if (t < 13) return "Run-up";
  if (t < CONTACT_FRAME) return "Backswing";
  if (t < 34) return "Follow-through";
  return "Recovery";
}

/** Ball rests until contact, then leaves along the measured launch direction. */
export function ballAt(t: number) {
  const flight = Math.max(0, t - CONTACT_FRAME);
  return { x: kick.ball.x + flight * 145, y: kick.ball.y - flight * 14, r: kick.ball.r };
}

export const GROUND_Y = Math.max(...frames.flatMap(pose => [pose.l_heel.y, pose.r_heel.y, pose.l_foot.y, pose.r_foot.y]));
