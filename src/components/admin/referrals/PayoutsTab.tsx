import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminErrorText, fmtDate, fmtDateTime, money, usePayouts, type CreatorRow } from "@/hooks/useAdminReferrals";

const ALL = "all";

type Props = {
  creators: CreatorRow[];
  creatorId: string | null;
  onCreatorChange: (creatorId: string | null) => void;
};

export function PayoutsTab({ creators, creatorId, onCreatorChange }: Props) {
  const payouts = usePayouts(creatorId);
  const rows = payouts.data ?? [];
  const total = rows.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={creatorId ?? ALL} onValueChange={(v) => onCreatorChange(v === ALL ? null : v)}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Все креаторы</SelectItem>
            {creators.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name} ({c.referral_code})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">Всего выплачено: <span className="font-semibold text-foreground">{money(total)}</span></span>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Креатор</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
              <TableHead className="text-right">Активаций</TableHead>
              <TableHead>Период одобрения</TableHead>
              <TableHead>Комментарий</TableHead>
              <TableHead>Кто отметил</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell>
              </TableRow>
            )}
            {payouts.error && (
              <TableRow>
                <TableCell colSpan={7} className="py-6 text-center text-destructive">{adminErrorText(payouts.error)}</TableCell>
              </TableRow>
            )}
            {!payouts.isLoading && !payouts.error && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Выплат пока не было</TableCell>
              </TableRow>
            )}
            {rows.map((p) => (
              <TableRow key={p.id} className={p.status === "cancelled" ? "opacity-50" : undefined}>
                <TableCell className="whitespace-nowrap">{fmtDateTime(p.paid_at ?? p.created_at)}</TableCell>
                <TableCell>
                  <div>{p.creator_name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{p.creator_code}</div>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">{money(p.amount)}{p.status === "cancelled" ? " (отменена)" : ""}</TableCell>
                <TableCell className="text-right tabular-nums">{p.activations_count}</TableCell>
                <TableCell className="whitespace-nowrap text-sm">{fmtDate(p.period_start)} — {fmtDate(p.period_end)}</TableCell>
                <TableCell className="max-w-[16rem] text-sm">{p.note || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.created_by_email || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
