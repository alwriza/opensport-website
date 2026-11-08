import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { adminErrorText, money, useCreators, useIsAdmin, type ActivationStatus } from "@/hooks/useAdminReferrals";
import { CreatorsTab } from "@/components/admin/referrals/CreatorsTab";
import { ActivationsTab } from "@/components/admin/referrals/ActivationsTab";
import { PayoutsTab } from "@/components/admin/referrals/PayoutsTab";
import NotFound from "@/pages/NotFound";

type Tab = "creators" | "activations" | "payouts";

/** Internal panel of the creator referral program. Only for rows in public.admin_users. */
export default function AdminReferrals() {
  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin(!!user);

  if (isAdmin.isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }
  if (!isAdmin.data) return <NotFound />;
  return <AdminReferralsPanel />;
}

function AdminReferralsPanel() {
  const creators = useCreators();
  const list = creators.data ?? [];
  const [tab, setTab] = useState<Tab>("creators");
  const [activationStatus, setActivationStatus] = useState<ActivationStatus | null>("pending");
  const [activationCreator, setActivationCreator] = useState<string | null>(null);
  const [payoutCreator, setPayoutCreator] = useState<string | null>(null);

  const totals = list.reduce(
    (t, c) => ({
      visits: t.visits + c.visits,
      registrations: t.registrations + c.registrations,
      pending: t.pending + c.pending,
      approved: t.approved + c.approved,
      toPay: t.toPay + c.to_pay,
      paid: t.paid + c.paid_amount,
    }),
    { visits: 0, registrations: 0, pending: 0, approved: 0, toPay: 0, paid: 0 },
  );

  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Реферальная программа</h1>
        <p className="text-muted-foreground">Креаторы, активации и выплаты. Активация: регистрация по ссылке и первое видео в течение 14 дней.</p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Summary label="Визиты" value={totals.visits} />
        <Summary label="Регистрации" value={totals.registrations} />
        <Summary label="На проверке" value={totals.pending} accent={totals.pending > 0} />
        <Summary label="Одобрено, не оплачено" value={totals.approved} />
        <Summary label="К выплате" value={money(totals.toPay)} accent={totals.toPay > 0} />
        <Summary label="Выплачено всего" value={money(totals.paid)} />
      </section>

      {creators.error && <p className="text-sm text-destructive">{adminErrorText(creators.error)}</p>}

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="creators">Креаторы</TabsTrigger>
          <TabsTrigger value="activations">Активации{totals.pending > 0 ? ` · ${totals.pending}` : ""}</TabsTrigger>
          <TabsTrigger value="payouts">Выплаты</TabsTrigger>
        </TabsList>
        <TabsContent value="creators" className="mt-4">
          <CreatorsTab
            creators={list}
            loading={creators.isLoading}
            onShowActivations={(id) => { setActivationCreator(id); setActivationStatus(null); setTab("activations"); }}
            onShowPayouts={(id) => { setPayoutCreator(id); setTab("payouts"); }}
          />
        </TabsContent>
        <TabsContent value="activations" className="mt-4">
          <ActivationsTab
            creators={list}
            status={activationStatus}
            creatorId={activationCreator}
            onStatusChange={setActivationStatus}
            onCreatorChange={setActivationCreator}
          />
        </TabsContent>
        <TabsContent value="payouts" className="mt-4">
          <PayoutsTab creators={list} creatorId={payoutCreator} onCreatorChange={setPayoutCreator} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Summary({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={accent ? "text-xl font-semibold tabular-nums text-primary" : "text-xl font-semibold tabular-nums"}>{value}</div>
    </div>
  );
}
