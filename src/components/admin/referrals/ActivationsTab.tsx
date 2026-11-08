import { useState } from "react";
import { AlertTriangle, Check, Loader2, PlayCircle, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  ACTIVATION_STATUS_LABEL,
  REJECTION_REASONS,
  REJECTION_REASON_LABEL,
  adminErrorText,
  fmtDateTime,
  money,
  openActivationVideo,
  useActivations,
  useReviewActivation,
  type ActivationRow,
  type ActivationStatus,
  type CreatorRow,
  type RejectionReason,
} from "@/hooks/useAdminReferrals";
import { ActivationStatusBadge } from "./StatusBadges";

const ALL = "all";

type Props = {
  creators: CreatorRow[];
  status: ActivationStatus | null;
  creatorId: string | null;
  onStatusChange: (status: ActivationStatus | null) => void;
  onCreatorChange: (creatorId: string | null) => void;
};

export function ActivationsTab({ creators, status, creatorId, onStatusChange, onCreatorChange }: Props) {
  const { toast } = useToast();
  const activations = useActivations(status, creatorId);
  const review = useReviewActivation();
  const [rejecting, setRejecting] = useState<ActivationRow | null>(null);
  const rows = activations.data ?? [];

  const decide = (row: ActivationRow, decision: "approved" | "pending") => {
    review.mutate(
      { id: row.id, decision },
      {
        onSuccess: () => toast({ title: decision === "approved" ? "Активация одобрена" : "Возвращена на проверку" }),
        onError: (e) => toast({ title: "Ошибка", description: adminErrorText(e), variant: "destructive" }),
      },
    );
  };

  const openVideo = async (row: ActivationRow) => {
    if (!row.video_bucket || !row.video_path) return;
    try {
      await openActivationVideo(row.video_bucket, row.video_path);
    } catch (e) {
      toast({ title: "Не удалось открыть видео", description: adminErrorText(e), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={status ?? ALL} onValueChange={(v) => onStatusChange(v === ALL ? null : (v as ActivationStatus))}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Все статусы</SelectItem>
            {(Object.keys(ACTIVATION_STATUS_LABEL) as ActivationStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{ACTIVATION_STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={creatorId ?? ALL} onValueChange={(v) => onCreatorChange(v === ALL ? null : v)}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Все креаторы</SelectItem>
            {creators.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name} ({c.referral_code})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="self-center text-sm text-muted-foreground">{rows.length} шт.</span>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Пользователь</TableHead>
              <TableHead>Креатор</TableHead>
              <TableHead>Визит</TableHead>
              <TableHead>Регистрация</TableHead>
              <TableHead>Первое видео</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activations.isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell>
              </TableRow>
            )}
            {activations.error && (
              <TableRow>
                <TableCell colSpan={7} className="py-6 text-center text-destructive">{adminErrorText(activations.error)}</TableCell>
              </TableRow>
            )}
            {!activations.isLoading && !activations.error && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Активаций нет</TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="font-medium">{row.user_nickname || "—"}</div>
                  <div className="text-xs text-muted-foreground">{[row.user_email, row.user_phone].filter(Boolean).join(" · ")}</div>
                  {row.same_ip_users > 0 && (
                    <div className="mt-1 inline-flex items-center gap-1 text-xs text-amber-600" title="Другие referral-пользователи регистрировались с того же IP">
                      <AlertTriangle className="h-3 w-3" /> тот же IP: ещё {row.same_ip_users}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div>{row.creator_name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{row.creator_code}{row.creator_status !== "active" ? ` · ${row.creator_status}` : ""}</div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">{fmtDateTime(row.referral_first_visit_at)}</TableCell>
                <TableCell className="whitespace-nowrap text-sm">{fmtDateTime(row.registered_at)}</TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {fmtDateTime(row.first_video_uploaded_at ?? row.activated_at)}
                  {row.video_bucket && row.video_path && (
                    <button type="button" onClick={() => openVideo(row)} className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline">
                      <PlayCircle className="h-3 w-3" /> {row.video_source === "match_analyses" ? "матч" : "видео"}
                    </button>
                  )}
                </TableCell>
                <TableCell>
                  <ActivationStatusBadge status={row.status} />
                  {row.status === "rejected" && row.rejection_reason && (
                    <div className="mt-1 max-w-[14rem] text-xs text-muted-foreground">
                      {REJECTION_REASON_LABEL[row.rejection_reason]}{row.rejection_comment ? `: ${row.rejection_comment}` : ""}
                    </div>
                  )}
                  {row.status === "paid" && <div className="mt-1 text-xs text-muted-foreground">{money(row.reward_amount)} · {fmtDateTime(row.paid_at)}</div>}
                </TableCell>
                <TableCell className="text-right">
                  {row.status !== "paid" && (
                    <div className="flex justify-end gap-1">
                      {row.status !== "approved" && (
                        <Button size="sm" variant="outline" disabled={review.isPending} onClick={() => decide(row, "approved")}>
                          <Check className="mr-1 h-3.5 w-3.5" /> Approve
                        </Button>
                      )}
                      {row.status !== "rejected" && (
                        <Button size="sm" variant="outline" disabled={review.isPending} onClick={() => setRejecting(row)}>
                          <X className="mr-1 h-3.5 w-3.5" /> Reject
                        </Button>
                      )}
                      {row.status !== "pending" && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="Вернуть на проверку" disabled={review.isPending} onClick={() => decide(row, "pending")}>
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <RejectDialog row={rejecting} onClose={() => setRejecting(null)} />
    </div>
  );
}

function RejectDialog({ row, onClose }: { row: ActivationRow | null; onClose: () => void }) {
  return (
    <Dialog open={!!row} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">{row && <RejectForm key={row.id} row={row} onDone={onClose} />}</DialogContent>
    </Dialog>
  );
}

function RejectForm({ row, onDone }: { row: ActivationRow; onDone: () => void }) {
  const { toast } = useToast();
  const review = useReviewActivation();
  const [reason, setReason] = useState<RejectionReason | "">("");
  const [comment, setComment] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    review.mutate(
      { id: row.id, decision: "rejected", reason, comment },
      {
        onSuccess: () => { toast({ title: "Активация отклонена" }); onDone(); },
        onError: (err) => toast({ title: "Ошибка", description: adminErrorText(err), variant: "destructive" }),
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Отклонить активацию</DialogTitle>
        <DialogDescription>{row.user_nickname || row.user_email} · креатор {row.creator_name}</DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label>Причина</Label>
        <Select value={reason} onValueChange={(v) => setReason(v as RejectionReason)}>
          <SelectTrigger><SelectValue placeholder="Выберите причину" /></SelectTrigger>
          <SelectContent>
            {REJECTION_REASONS.map((r) => (
              <SelectItem key={r} value={r}>{REJECTION_REASON_LABEL[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reject-comment">Комментарий</Label>
        <Textarea id="reject-comment" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>Отмена</Button>
        <Button type="submit" variant="destructive" disabled={!reason || review.isPending}>Отклонить</Button>
      </DialogFooter>
    </form>
  );
}
