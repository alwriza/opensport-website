import { Brain, CircleDot, Crosshair, Dumbbell, Flame, Footprints, Gauge, Goal, HeartPulse, Shield, Star, Swords, Target, Trophy, Zap, type LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = {
  '⚽': Goal, '🎯': Crosshair, '🏃': Footprints, '🦶': CircleDot, '🔥': Flame,
  '💪': Dumbbell, '🧠': Brain, '🛡️': Shield, '🛡': Shield, '⭐': Star,
  '🏆': Trophy, '⚡': Zap, '🎮': Swords, '🤾': HeartPulse, '🧘': Gauge,
};
const sizes = { sm: "w-8 h-8 [&>svg]:h-4 [&>svg]:w-4", md: "w-12 h-12 [&>svg]:h-6 [&>svg]:w-6", lg: "w-14 h-14 [&>svg]:h-7 [&>svg]:w-7", xl: "w-20 h-20 [&>svg]:h-10 [&>svg]:w-10" };

export function SkillIcon({ icon, size = "lg" }: { icon: string; size?: keyof typeof sizes; }) {
  const Icon = icons[icon] || Target;
  return <div className={`${sizes[size]} bg-primary/10 flex items-center justify-center shrink-0`}>
    <Icon className="text-primary" />
  </div>;
}
