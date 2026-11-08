import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ACTIVATION_STATUS_LABEL,
  CREATOR_STATUS_LABEL,
  type ActivationStatus,
  type CreatorStatus,
} from "@/hooks/useAdminReferrals";

const CREATOR_TONE: Record<CreatorStatus, string> = {
  active: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
  paused: "border-amber-500/40 text-amber-700 dark:text-amber-300",
  blocked: "border-destructive/50 text-destructive",
};

const ACTIVATION_TONE: Record<ActivationStatus, string> = {
  pending: "border-amber-500/40 text-amber-700 dark:text-amber-300",
  approved: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
  rejected: "border-destructive/50 text-destructive",
  paid: "border-sky-500/40 text-sky-700 dark:text-sky-300",
};

export function CreatorStatusBadge({ status }: { status: CreatorStatus }) {
  return <Badge variant="outline" className={cn("whitespace-nowrap", CREATOR_TONE[status])}>{CREATOR_STATUS_LABEL[status]}</Badge>;
}

export function ActivationStatusBadge({ status }: { status: ActivationStatus }) {
  return <Badge variant="outline" className={cn("whitespace-nowrap", ACTIVATION_TONE[status])}>{ACTIVATION_STATUS_LABEL[status]}</Badge>;
}
