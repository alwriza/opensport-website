import { useState } from "react";
import { Copy, Loader2, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  adminErrorText,
  fmtDate,
  money,
  percent,
  referralUrl,
  useChangeCreatorCode,
  useCreatePayout,
  usePayoutPreview,
  useSetCreatorCap,
  useSetCreatorStatus,
  useUpsertCreator,
  type CreatorRow,
  type CreatorStatus,
} from "@/hooks/useAdminReferrals";
import { CreatorStatusBadge } from "./StatusBadges";

type Props = {
  creators: CreatorRow[];
  loading: boolean;
  onShowActivations: (creatorId: string) => void;
  onShowPayouts: (creatorId: string) => void;
};

export function CreatorsTab({ creators, loading, onShowActivations, onShowPayouts }: Props) {
  const { toast } = useToast();
  const setStatus = useSetCreatorStatus();
  const [editing, setEditing] = useState<CreatorRow | "new" | null>(null);
  const [codeFor, setCodeFor] = useState<CreatorRow | null>(null);
  const [capFor, setCapFor] = useState<CreatorRow | null>(null);
  const [payFor, setPayFor] = useState<CreatorRow | null>(null);

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(referralUrl(code));
      toast({ title: "Ссылка скопирована", description: referralUrl(code) });
    } catch {
      toast({ title: "Не удалось скопировать", description: referralUrl(code), variant: "destructive" });
    }
  };

  const changeStatus = (creator: CreatorRow, status: CreatorStatus) => {
    if (status === "blocked" && !window.confirm(`Заблокировать ${creator.name}? Новые визиты, регистрации и активации перестанут засчитываться.`)) return;
    setStatus.mutate(
      { id: creator.id, status },
      {
        onSuccess: () => toast({ title: "Статус обновлён" }),
        onError: (e) => toast({ title: "Ошибка", description: adminErrorText(e), variant: "destructive" }),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Ставки за approved-активацию: 1–10 → 250 ₸, 11–25 → 300 ₸, 26–50 → 400 ₸, 51+ → 500 ₸. Окно атрибуции 14 дней.
        </p>
        <Button onClick={() => setEditing("new")}>
          <Plus className="mr-2 h-4 w-4" /> Новый креатор
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Креатор</TableHead>
              <TableHead>Ссылка</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Визиты</TableHead>
              <TableHead className="text-right">Регистрации</TableHead>
              <TableHead className="whitespace-nowrap" title="На проверке / Одобрено / Отклонено / Оплачено">Активации</TableHead>
              <TableHead className="text-right">Конверсия</TableHead>
              <TableHead className="text-right">Выплачено</TableHead>
              <TableHead className="whitespace-nowrap text-right">К выплате</TableHead>
              <TableHead className="text-right">Cap</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={11} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell>
              </TableRow>
            )}
            {!loading && creators.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="py-10 text-center text-muted-foreground">Креаторов пока нет</TableCell>
              </TableRow>
            )}
            {creators.map((c) => {
              const activated = c.pending + c.approved + c.rejected + c.paid;
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{[c.platform, c.contact].filter(Boolean).join(" · ") || "—"}</div>
                  </TableCell>
                  <TableCell>
                    <button type="button" onClick={() => copy(c.referral_code)} className="inline-flex items-center gap-1 whitespace-nowrap font-mono text-sm hover:underline" title={referralUrl(c.referral_code)}>
                      ?ref={c.referral_code} <Copy className="h-3 w-3" />
                    </button>
                    {c.aliases.length > 0 && <div className="text-xs text-muted-foreground">alias: {c.aliases.join(", ")}</div>}
                  </TableCell>
                  <TableCell><CreatorStatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-right tabular-nums">{c.visits}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.registrations}
                    {c.registered_no_video > 0 && <div className="text-xs text-muted-foreground">без видео: {c.registered_no_video}</div>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs tabular-nums">
                    <div className="grid grid-cols-2 gap-x-3">
                      <span>Pending <b>{c.pending}</b></span>
                      <span>Approved <b>{c.approved}</b></span>
                      <span>Rejected <b>{c.rejected}</b></span>
                      <span>Paid <b>{c.paid}</b></span>
                    </div>
                    {c.uploaded_after_window > 0 && <div className="text-muted-foreground">видео после окна: {c.uploaded_after_window}</div>}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    <div title="Визит → регистрация">{percent(c.registrations, c.visits)}</div>
                    <div className="text-muted-foreground" title="Регистрация → активация">{percent(activated, c.registrations)}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">{money(c.paid_amount)}</TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">
                    <span className={c.to_pay > 0 ? "font-semibold" : undefined}>{money(c.to_pay)}</span>
                    {c.over_cap > 0 && <div className="text-xs text-amber-600">сверх cap: {c.over_cap}</div>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">{money(c.payout_cap)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Действия"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled={c.to_pay <= 0} onSelect={() => setPayFor(c)}>Выплатить…</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onShowActivations(c.id)}>Активации</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onShowPayouts(c.id)}>История выплат</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setEditing(c)}>Редактировать</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setCapFor(c)}>Изменить cap</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setCodeFor(c)}>Сменить код</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {c.status !== "active" && <DropdownMenuItem onSelect={() => changeStatus(c, "active")}>Активировать</DropdownMenuItem>}
                        {c.status !== "paused" && <DropdownMenuItem onSelect={() => changeStatus(c, "paused")}>Поставить на паузу</DropdownMenuItem>}
                        {c.status !== "blocked" && (
                          <DropdownMenuItem className="text-destructive" onSelect={() => changeStatus(c, "blocked")}>Заблокировать</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <CreatorDialog creator={editing} onClose={() => setEditing(null)} />
      <ChangeCodeDialog creator={codeFor} onClose={() => setCodeFor(null)} />
      <CapDialog creator={capFor} onClose={() => setCapFor(null)} />
      <PayoutDialog creator={payFor} onClose={() => setPayFor(null)} />
    </div>
  );
}

// ---------- create / edit ----------
function CreatorDialog({ creator, onClose }: { creator: CreatorRow | "new" | null; onClose: () => void }) {
  const isNew = creator === "new";
  const existing = creator && creator !== "new" ? creator : null;
  return (
    <Dialog open={!!creator} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {creator && <CreatorForm key={existing?.id ?? "new"} isNew={isNew} existing={existing} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function CreatorForm({ isNew, existing, onDone }: { isNew: boolean; existing: CreatorRow | null; onDone: () => void }) {
  const { toast } = useToast();
  const upsert = useUpsertCreator();
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    platform: existing?.platform ?? "",
    contact: existing?.contact ?? "",
    referral_code: existing?.referral_code ?? "",
    payout_cap: String(existing?.payout_cap ?? 15000),
    notes: existing?.notes ?? "",
  });
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cap = Number(form.payout_cap);
    if (!Number.isInteger(cap) || cap < 0) {
      toast({ title: "Cap должен быть целым числом ≥ 0", variant: "destructive" });
      return;
    }
    upsert.mutate(
      { id: existing?.id ?? null, ...form, referral_code: form.referral_code.trim().toLowerCase(), payout_cap: cap },
      {
        onSuccess: () => {
          toast({ title: isNew ? "Креатор создан" : "Сохранено", description: isNew ? referralUrl(form.referral_code.trim().toLowerCase()) : undefined });
          onDone();
        },
        onError: (err) => toast({ title: "Ошибка", description: adminErrorText(err), variant: "destructive" }),
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{isNew ? "Новый креатор" : `Редактировать: ${existing?.name}`}</DialogTitle>
        {isNew && <DialogDescription>Ссылка будет вида {referralUrl(form.referral_code.trim().toLowerCase() || "code")}</DialogDescription>}
      </DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="cr-name">Имя</Label>
          <Input id="cr-name" required value={form.name} onChange={set("name")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cr-platform">Платформа</Label>
          <Input id="cr-platform" placeholder="TikTok, Instagram…" value={form.platform} onChange={set("platform")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cr-contact">Контакт</Label>
          <Input id="cr-contact" placeholder="@username, телефон" value={form.contact} onChange={set("contact")} />
        </div>
        {isNew && (
          <div className="space-y-1.5">
            <Label htmlFor="cr-code">Referral code</Label>
            <Input id="cr-code" required pattern="[A-Za-z0-9_\-]{3,32}" placeholder="arman01" value={form.referral_code} onChange={set("referral_code")} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="cr-cap">Payout cap, ₸</Label>
          <Input id="cr-cap" type="number" min={0} step={1} required value={form.payout_cap} onChange={set("payout_cap")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="cr-notes">Заметки</Label>
          <Textarea id="cr-notes" rows={2} value={form.notes} onChange={set("notes")} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>Отмена</Button>
        <Button type="submit" disabled={upsert.isPending}>
          {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isNew ? "Создать" : "Сохранить"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ---------- change code ----------
function ChangeCodeDialog({ creator, onClose }: { creator: CreatorRow | null; onClose: () => void }) {
  const { toast } = useToast();
  const change = useChangeCreatorCode();
  const [code, setCode] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creator) return;
    change.mutate(
      { id: creator.id, code: code.trim().toLowerCase() },
      {
        onSuccess: () => {
          toast({ title: "Код изменён", description: referralUrl(code.trim().toLowerCase()) });
          setCode("");
          onClose();
        },
        onError: (err) => toast({ title: "Ошибка", description: adminErrorText(err), variant: "destructive" }),
      },
    );
  };

  return (
    <Dialog open={!!creator} onOpenChange={(open) => { if (!open) { setCode(""); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Сменить код: {creator?.name}</DialogTitle>
            <DialogDescription>
              Старый код <span className="font-mono">{creator?.referral_code}</span> продолжит работать как alias, уже выданные ссылки не сломаются.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="cr-new-code">Новый код</Label>
            <Input id="cr-new-code" required pattern="[A-Za-z0-9_\-]{3,32}" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={change.isPending}>Сменить</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- cap ----------
function CapDialog({ creator, onClose }: { creator: CreatorRow | null; onClose: () => void }) {
  return (
    <Dialog open={!!creator} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">{creator && <CapForm key={creator.id} creator={creator} onDone={onClose} />}</DialogContent>
    </Dialog>
  );
}

function CapForm({ creator, onDone }: { creator: CreatorRow; onDone: () => void }) {
  const { toast } = useToast();
  const setCap = useSetCreatorCap();
  const [value, setValue] = useState(String(creator.payout_cap));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cap = Number(value);
    if (!Number.isInteger(cap) || cap < 0) {
      toast({ title: "Cap должен быть целым числом ≥ 0", variant: "destructive" });
      return;
    }
    setCap.mutate(
      { id: creator.id, cap },
      {
        onSuccess: () => { toast({ title: "Cap обновлён" }); onDone(); },
        onError: (err) => toast({ title: "Ошибка", description: adminErrorText(err), variant: "destructive" }),
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Payout cap: {creator.name}</DialogTitle>
        <DialogDescription>
          Лимит на сумму всех выплат креатору за всё время. Уже выплачено {money(creator.paid_amount)}.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="cr-cap-value">Cap, ₸</Label>
        <Input id="cr-cap-value" type="number" min={0} step={1} required value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>Отмена</Button>
        <Button type="submit" disabled={setCap.isPending}>Сохранить</Button>
      </DialogFooter>
    </form>
  );
}

// ---------- payout ----------
function PayoutDialog({ creator, onClose }: { creator: CreatorRow | null; onClose: () => void }) {
  return (
    <Dialog open={!!creator} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">{creator && <PayoutForm key={creator.id} creator={creator} onDone={onClose} />}</DialogContent>
    </Dialog>
  );
}

function PayoutForm({ creator, onDone }: { creator: CreatorRow; onDone: () => void }) {
  const { toast } = useToast();
  const preview = usePayoutPreview(creator.id);
  const pay = useCreatePayout();
  const [note, setNote] = useState("");
  const p = preview.data;

  const submit = () => {
    if (!p) return;
    pay.mutate(
      { creatorId: creator.id, expectedAmount: p.amount, note },
      {
        onSuccess: (res) => {
          toast({ title: "Выплата отмечена", description: `${creator.name}: ${money(res.amount)} за ${res.activations_count} акт.` });
          onDone();
        },
        onError: (err) => {
          toast({ title: "Ошибка", description: adminErrorText(err), variant: "destructive" });
          preview.refetch();
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Выплата: {creator.name}</DialogTitle>
        <DialogDescription>
          Переведите деньги креатору, затем нажмите «Отметить как выплачено». Вошедшие активации станут paid и больше не попадут в выплату.
        </DialogDescription>
      </DialogHeader>

      {preview.isLoading && <Loader2 className="mx-auto h-5 w-5 animate-spin" />}
      {preview.error && <p className="text-sm text-destructive">{adminErrorText(preview.error)}</p>}
      {p && (
        <>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Stat label="К выплате" value={money(p.amount)} strong />
            <Stat label="Активаций" value={String(p.fit_count)} />
            <Stat label="Уже выплачено" value={money(p.paid_amount)} />
            <Stat label="Остаток cap" value={money(p.cap_left)} />
          </div>
          {p.over_cap > 0 && (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-sm">
              {p.over_cap} approved-активаций не входят в cap {money(p.payout_cap)} и останутся ждать, пока cap не поднимут.
            </p>
          )}
          <div className="max-h-56 overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Одобрена</TableHead>
                  <TableHead className="text-right">Ставка</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.activations.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="tabular-nums">{a.ordinal}</TableCell>
                    <TableCell>{a.user_nickname || a.user_email || "—"}</TableCell>
                    <TableCell>{fmtDate(a.approved_at)}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(a.rate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payout-note">Комментарий (номер перевода и т.п.)</Label>
            <Input id="payout-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>Отмена</Button>
        <Button type="button" onClick={submit} disabled={!p || p.amount <= 0 || pay.isPending}>
          {pay.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Отметить как выплачено{p ? ` · ${money(p.amount)}` : ""}
        </Button>
      </DialogFooter>
    </div>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-md border p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={strong ? "text-lg font-semibold tabular-nums" : "tabular-nums"}>{value}</div>
    </div>
  );
}
