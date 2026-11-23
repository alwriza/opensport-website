/**
 * Research labeling: event classes and keys. The single source for both the key
 * handling and the key hints drawn under the player.
 * Keys are matched on KeyboardEvent.code, so they work on the Russian layout and
 * with Caps Lock on.
 */

export const EVENT_CLASSES = ["pass", "drive", "cross", "shot", "header", "tackle", "block", "throw_in"] as const;
export type EventClass = (typeof EVENT_CLASSES)[number];

export const CLASS_LABEL: Record<EventClass, string> = {
  pass: "Пас",
  drive: "Приём",
  cross: "Навес",
  shot: "Удар",
  header: "Головой",
  tackle: "Отбор",
  block: "Блок",
  throw_in: "Вбрасывание",
};

/** KeyboardEvent.code → event class. Shift held = team B. */
export const CLASS_KEYS: Record<string, EventClass> = {
  KeyP: "pass",
  KeyD: "drive",
  KeyC: "cross",
  KeyS: "shot",
  KeyH: "header",
  KeyT: "tackle",
  KeyB: "block",
  KeyI: "throw_in",
};

export const SHOT_OUTCOMES = ["goal", "on_target", "off_target", "blocked"] as const;
export type ShotOutcome = (typeof SHOT_OUTCOMES)[number];

export const SHOT_OUTCOME_LABEL: Record<ShotOutcome, string> = {
  goal: "гол",
  on_target: "в створ",
  off_target: "мимо",
  blocked: "заблокирован",
};

/** KeyboardEvent.code → shot outcome, asked right after S. */
export const SHOT_OUTCOME_KEYS: Record<string, ShotOutcome> = {
  Digit1: "goal",
  Digit2: "on_target",
  Digit3: "off_target",
  Digit4: "blocked",
};

export const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1] as const;
export const FRAME_S = 0.04;
export const JUMP_S = 2;

/** Key hints for the gold mode, in the order they are drawn. */
export const GOLD_EVENT_HINTS: { key: string; label: string }[] = Object.entries(CLASS_KEYS).map(([code, cls]) => ({
  key: code.replace("Key", ""),
  label: CLASS_LABEL[cls],
}));

export const GOLD_CONTROL_HINTS: { key: string; label: string }[] = [
  { key: "Shift + клавиша", label: "команда B" },
  { key: "Пробел", label: "пауза / пуск" },
  { key: "← →", label: "± 2 секунды" },
  { key: ", .", label: "кадр (на паузе)" },
  { key: "[ ]", label: "скорость" },
  { key: "Backspace", label: "удалить последнее" },
  { key: "M", label: "последнее — на этот кадр" },
  { key: "U", label: "«не уверен»" },
];

export const CAMERA_TYPE_LABEL = { static: "статичная", operator: "оператор", phone: "телефон" } as const;
export type CameraType = keyof typeof CAMERA_TYPE_LABEL;

export function fmtTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = (s % 60).toFixed(1).padStart(4, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${String(m).padStart(2, "0")}:${sec}`;
}
