export const PLAYER_POSITIONS = [
  { value: "Forward", code: "FWD", label: "forward" },
  { value: "Midfielder", code: "MID", label: "midfielder" },
  { value: "Defender", code: "DEF", label: "defender" },
  { value: "Goalkeeper", code: "GK", label: "goalkeeper" },
] as const;

export function positionCode(position: string | null | undefined) {
  return PLAYER_POSITIONS.find(item => item.value === position || item.code === position)?.code || position || "—";
}
