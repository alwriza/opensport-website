import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminOnly } from "@/components/admin/research/AdminOnly";
import { AddMatchForm } from "@/components/admin/research/AddMatchForm";
import { researchErrorText, useResearchMatches, type MatchWithSegment, type ResearchSegment } from "@/hooks/useResearch";
import { CAMERA_TYPE_LABEL, fmtTime } from "@/lib/research/keymap";

const TARGET_MATCHES = 15;

type Tab = "home" | "matches";

/** Research labeling: progress and the match list. Admins only. */
export default function AdminResearch() {
  return (
    <AdminOnly>
      <ResearchPanel />
    </AdminOnly>
  );
}

function ResearchPanel() {
  const matches = useResearchMatches();
  const [tab, setTab] = useState<Tab>("home");
  const list = matches.data ?? [];

  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">Исследование: разметка матчей</h1>
        <p className="text-muted-foreground">Внутренний инструмент. Видео с YouTube — только для исследования, не публикуем.</p>
      </div>

      {matches.error && (
        <Alert variant="destructive"><AlertDescription>{researchErrorText(matches.error)}</AlertDescription></Alert>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="home">Главная</TabsTrigger>
          <TabsTrigger value="matches">Матчи ({list.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="home" className="pt-4">
          {matches.isLoading ? <Spinner /> : <Home matches={list} onAddMatches={() => setTab("matches")} />}
        </TabsContent>
        <TabsContent value="matches" className="space-y-6 pt-4">
          <AddMatchForm />
          {matches.isLoading ? <Spinner /> : <MatchesTable matches={list} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
}

function Home({ matches, onAddMatches }: { matches: MatchWithSegment[]; onAddMatches: () => void }) {
  const segments = matches.map((m) => m.research_segments).filter((s): s is ResearchSegment => s !== null);
  const gold = matches.filter((m) => m.research_segments?.mode === "gold");
  const goldDone = gold.filter((m) => m.research_segments?.status === "done").length;
  const review = segments.filter((s) => s.mode === "review");
  const reviewDone = review.filter((s) => s.status === "done").length;
  const reviewWaiting = review.filter((s) => s.status === "waiting").length;
  const nextGold = gold.find((m) => m.research_segments?.status !== "done");
  const nextReview = matches.find(
    (m) => m.research_segments?.mode === "review" && (m.research_segments.status === "ready" || m.research_segments.status === "in_progress"),
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat title="Матчи" value={`${matches.length} из ${TARGET_MATCHES}`} />
        <Stat title="Эталон" value={`${goldDone} из ${gold.length}`} hint="по одному на каждый тип камеры" />
        <Stat title="Проверка" value={`${reviewDone} из ${review.length}`} hint={reviewWaiting ? `${reviewWaiting} ждут модель` : undefined} />
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-2 font-semibold">Что делать сейчас</h2>
        {matches.length < TARGET_MATCHES ? (
          <div className="flex flex-wrap items-center gap-3">
            <p>Добавьте ещё {TARGET_MATCHES - matches.length} матч(ей).</p>
            <Button size="sm" onClick={onAddMatches}>К матчам</Button>
          </div>
        ) : null}
        {nextGold?.research_segments && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p>Разметьте эталон {nextGold.id} ({CAMERA_TYPE_LABEL[nextGold.camera_type]} камера).</p>
            <Button size="sm" asChild><Link to={`/admin/research/gold/${nextGold.research_segments.id}`}>Разметить</Link></Button>
          </div>
        )}
        {nextReview?.research_segments && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p>Проверьте, что нашла модель в {nextReview.id}.</p>
            <Button size="sm" asChild><Link to={`/admin/research/review/${nextReview.research_segments.id}`}>Проверить</Link></Button>
          </div>
        )}
        {matches.length >= TARGET_MATCHES && !nextGold && !nextReview && (
          <p>Всё, что можно, сделано. Остальные отрезки ждут прогона модели — они появятся здесь, когда придут её результаты.</p>
        )}
      </div>
    </div>
  );
}

function Stat({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const SEGMENT_STATUS_TEXT: Record<ResearchSegment["mode"], Record<ResearchSegment["status"], string>> = {
  gold: { waiting: "—", ready: "Можно размечать", in_progress: "В работе", done: "Готово" },
  review: { waiting: "Ждёт модель", ready: "Можно проверять", in_progress: "В работе", done: "Готово" },
};

function MatchesTable({ matches }: { matches: MatchWithSegment[] }) {
  if (matches.length === 0) return <p className="text-muted-foreground">Матчей пока нет.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Лига</TableHead>
          <TableHead>Камера</TableHead>
          <TableHead>Формат</TableHead>
          <TableHead>Команды (A / B)</TableHead>
          <TableHead>Отрезок</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {matches.map((m) => {
          const s = m.research_segments;
          return (
            <TableRow key={m.id}>
              <TableCell className="font-mono">
                <a href={m.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                  {m.id} <ExternalLink className="h-3 w-3" />
                </a>
              </TableCell>
              <TableCell>{m.league}</TableCell>
              <TableCell>{CAMERA_TYPE_LABEL[m.camera_type]}</TableCell>
              <TableCell>{m.format}</TableCell>
              <TableCell>{m.team_a_color} / {m.team_b_color}</TableCell>
              <TableCell>
                {s && (
                  <div className="space-y-1">
                    <Badge variant={s.mode === "gold" ? "default" : "secondary"}>{s.mode === "gold" ? "Эталон" : "Проверка"}</Badge>
                    <p className="font-mono text-xs text-muted-foreground">{fmtTime(s.start_s)}–{fmtTime(s.end_s)}</p>
                  </div>
                )}
              </TableCell>
              <TableCell>
                {s && SEGMENT_STATUS_TEXT[s.mode][s.status]}
                {m.status === "error" && <p className="text-xs text-destructive">Ошибка обработки: {m.error}</p>}
              </TableCell>
              <TableCell className="text-right">
                {s && s.status !== "waiting" && (
                  <Button size="sm" variant={s.status === "done" ? "outline" : "default"} asChild>
                    <Link to={`/admin/research/${s.mode}/${s.id}`}>
                      {s.status === "ready" ? (s.mode === "gold" ? "Разметить" : "Проверить") : s.status === "in_progress" ? "Продолжить" : "Открыть"}
                    </Link>
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
