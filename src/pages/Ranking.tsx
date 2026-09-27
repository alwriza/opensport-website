import { useDesignCopy } from "@/hooks/useDesignCopy";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, ChevronDown, Eye, Loader2, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDemoContext } from "@/demo";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { DEMO_RANKING } from "@/data/demoRanking";
import type { RankingPlayer } from "@/types/ranking";
import { positionCode } from "@/lib/player";
import { RankingFilters } from "@/components/ranking/RankingFilters";
import { PlayerPreviewModal } from "@/components/ranking/PlayerPreviewModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const PAGE_SIZE = 12;
type SortField = "rank" | "aiScore" | "growth" | "age" | "name" | "totalVideos";

export default function Ranking() {
  const copy = useDesignCopy();
  const demo = useDemoContext();
  const { user } = useCurrentUser();
  const [params, setParams] = useSearchParams();
  const [preview, setPreview] = useState<RankingPlayer | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const savedKey = `opensport:saved-players:${demo ? "demo" : user?.id || "guest"}`;
  const [saved, setSaved] = useState<{ key: string; ids: string[]; }>({ key: savedKey, ids: [] });

  useEffect(() => {
    try {
      let stored = localStorage.getItem(savedKey);
      const migratedFor = localStorage.getItem("opensport:saved-players:legacy-owner");
      const legacy = localStorage.getItem("ranking_saved_players");
      if (stored === null && !demo && user?.id && legacy && (!migratedFor || migratedFor === user.id)) {
        const legacyIds: unknown = JSON.parse(legacy);
        if (Array.isArray(legacyIds)) {
          stored = JSON.stringify(legacyIds.filter(id => typeof id === "string"));
          localStorage.setItem(savedKey, stored);
          localStorage.setItem("opensport:saved-players:legacy-owner", user.id);
        }
      }
      const value = JSON.parse(stored || "[]");
      setSaved({ key: savedKey, ids: Array.isArray(value) ? value.filter(id => typeof id === "string") : [] });
    } catch { setSaved({ key: savedKey, ids: [] }); }
  }, [demo, savedKey, user?.id]);
  const savedIds = useMemo(() => saved.key === savedKey ? saved.ids : [], [saved, savedKey]);
  const toggleSaved = (id: string) => {
    const ids = savedIds.includes(id) ? savedIds.filter(value => value !== id) : [...savedIds, id];
    setSaved({ key: savedKey, ids });
    try { localStorage.setItem(savedKey, JSON.stringify(ids)); } catch { /* Keep the session selection when browser storage is unavailable. */ }
  };

  const { data: players = [], isLoading, isError, refetch } = useQuery<RankingPlayer[]>({
    queryKey: ["global-ranking", !!demo],
    queryFn: async () => {
      if (demo) return DEMO_RANKING;
      const { data, error } = await supabase.from("global_rankings").select("*").order("best_score", { ascending: false }).limit(200);
      if (error) throw error;
      const growthByPlayer = new Map<string, number>();
      for (const row of data || []) {
        const growth = (row as typeof row & { growth?: number | null }).growth;
        if (typeof growth === "number" && Number.isFinite(growth)) growthByPlayer.set(row.user_id, growth);
      }
      const ids = (data || []).filter(row => !growthByPlayer.has(row.user_id)).map(row => row.user_id);
      if (ids.length) {
        const { data: history, error: historyError } = await supabase.from("analyses").select("user_id, overall").in("user_id", ids).order("created_at", { ascending: false }).limit(1000);
        if (historyError) throw historyError;
        const latestScores = new Map<string, number[]>();
        for (const analysis of history || []) {
          const scores = latestScores.get(analysis.user_id) || [];
          if (scores.length < 2) { scores.push(analysis.overall); latestScores.set(analysis.user_id, scores); }
        }
        for (const [id, scores] of latestScores) if (scores.length === 2) growthByPlayer.set(id, scores[0] - scores[1]);
      }
      return (data || []).map((row, index) => ({
        id: row.user_id, rank: index + 1, name: row.name || "Unnamed player", age: row.age ?? null,
        position: positionCode(row.position), team: row.club || null, city: row.city || "", country: row.country || "",
        avatarUrl: row.avatar_url || null, aiScore: row.best_score ?? 0, growth: growthByPlayer.get(row.user_id) ?? null,
        totalVideos: row.total_analyses ?? 0, lastActive: row.last_analysis_at || "", trend: (growthByPlayer.get(row.user_id) ?? 0) > 0 ? "up" : (growthByPlayer.get(row.user_id) ?? 0) < 0 ? "down" : "stable",
      }));
    },
    refetchInterval: demo ? false : 60 * 60 * 1000,
  });
  const updateURL = (updates: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(updates)) {
      if (value && value !== "all") next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  };
  const filters = { position: params.get("position") || "all", ageGroup: params.get("ageGroup") || "all", country: params.get("country") || "", city: params.get("city") || "" };
  const search = params.get("search") || "";
  const tab = ["saved", "alerts"].includes(params.get("tab") || "") ? params.get("tab")! : "rankings";
  const sub = params.get("sub") || "global";
  const requestedSort = params.get("sort");
  const sortField: SortField = ["rank", "aiScore", "growth", "age", "name", "totalVideos"].includes(requestedSort || "") ? requestedSort as SortField : sub === "improved" ? "growth" : "rank";
  const direction = params.get("dir") === "desc" || (!params.get("dir") && sub === "improved") ? -1 : 1;
  const filtered = useMemo(() => {
    let list = players.filter(player => {
      const age = player.age;
      return `${player.name} ${player.team || ""} ${player.city}`.toLowerCase().includes(search.toLowerCase())
        && (filters.position === "all" || player.position === filters.position)
        && (filters.ageGroup === "all" || age != null && (filters.ageGroup === "U14" ? age <= 14 : filters.ageGroup === "U19+" ? age >= 19 : age === Number(filters.ageGroup.slice(1))))
        && player.country.toLowerCase().includes(filters.country.toLowerCase())
        && player.city.toLowerCase().includes(filters.city.toLowerCase());
    });
    if (tab === "saved" || tab === "alerts") list = list.filter(player => savedIds.includes(player.id));
    if (tab === "alerts") list = list.filter(player => player.growth != null && player.growth !== 0);
    if (tab === "rankings" && sub === "gems") list = list.filter(player => player.totalVideos <= 5 && player.aiScore >= 75);
    if (tab === "rankings" && sub === "trending") list = list.filter(player => (player.growth ?? 0) > 0);
    return list.sort((a, b) => sortField === "name" ? a.name.localeCompare(b.name) * direction : ((a[sortField] as number ?? 0) - (b[sortField] as number ?? 0)) * direction);
  }, [players, search, filters.position, filters.ageGroup, filters.country, filters.city, tab, sub, savedIds, sortField, direction]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number(params.get("page")) || 1));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageNumbers = Array.from({ length: Math.min(3, totalPages) }, (_, index) => Math.min(Math.max(1, page - 1), Math.max(1, totalPages - 2)) + index);
  const profilePath = (id: string) => `${demo ? "/demo" : ""}/player/${id}`;
  const sort = (field: SortField) => updateURL({ sort: field, dir: sortField === field && direction === -1 ? "asc" : "desc", page: "1" });
  const comparePlayers = players.filter(player => compareIds.includes(player.id));
  const toggleCompare = (id: string) => setCompareIds(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  const pageSelected = paged.length > 0 && paged.every(player => compareIds.includes(player.id));
  const togglePageComparison = () => setCompareIds(ids => pageSelected ? ids.filter(id => !paged.some(player => player.id === id)) : [...new Set([...ids, ...paged.map(player => player.id)])]);

  return <main className="design-page design-rank">
    <header className="design-rank-header">
      <div className="design-rank-heading">
        <span className="design-eyebrow">{players.length} players · {demo ? "Demo" : "Global"} · updated hourly</span>
        <h1>{copy("Global ranking")}</h1>
      </div>
      <div className="design-table-tools">
        <label htmlFor="rank-search">{copy("Search")}</label>
        <input id="rank-search" type="search" className="design-search" placeholder={copy("Player, club or city")} value={search} onChange={event => updateURL({ search: event.target.value, page: "1" })} />
        <button className="design-button design-button-outline design-button-mono gap-2" aria-expanded={filtersOpen} aria-controls="ranking-filters" onClick={() => setFiltersOpen(open => !open)}>{copy("FILTERS")}<ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} /></button>
      </div>
    </header>
    {filtersOpen && <section className="design-filter-panel" id="ranking-filters" aria-label={copy("FILTERS")}>
      <RankingFilters filters={filters} onFilterChange={(key, value) => updateURL({ [key]: value, page: "1" })} onReset={() => updateURL({ position: "", ageGroup: "", country: "", city: "", search: "", page: "1" })} />
    </section>}
    <nav className="design-rank-tabs" aria-label="Ranking categories">
      {[{ key: "global", label: "Global" }, { key: "improved", label: "Most improved" }, { key: "gems", label: "Hidden gems" }, { key: "trending", label: "Trending" }].map(item => <button key={item.key} className={tab === "rankings" && sub === item.key ? "active" : ""} onClick={() => updateURL({ tab: "rankings", sub: item.key, sort: "", dir: "", page: "1" })}>{copy(item.label)}</button>)}
      <button className={tab === "saved" ? "active" : ""} onClick={() => updateURL({ tab: "saved", page: "1" })}>{copy("Saved")}</button>
      <button className={tab === "alerts" ? "active" : ""} onClick={() => updateURL({ tab: "alerts", page: "1" })}>{copy("Alerts")}</button>
    </nav>
    {tab === "alerts" && <p className="text-sm text-muted-foreground pt-5">{copy("Score changes for your saved players.")}</p>}
    {isLoading ? <div className="flex justify-center py-20">
      <Loader2 className="animate-spin text-primary" />
    </div> : isError ? <div className="design-empty">Could not load the ranking.
      <button className="design-link" onClick={() => refetch()}>Try again</button>
    </div> : <>
      <div className="design-table-scroll">
        <table className="design-table design-rank-table">
          <thead>
            <tr>
              <th><button aria-label={copy("Rank")} title={copy("Rank")} onClick={() => sort("rank")}>№</button></th>
              <th><button onClick={() => sort("name")}>{copy("Player")}</button></th>
              <th><button onClick={() => sort("age")}>{copy("Age")}</button></th>
              <th>{copy("Pos")}</th>
              <th>{copy("City")}</th>
              <th><button onClick={() => sort("aiScore")}>{copy("Score")}</button></th>
              <th><button onClick={() => sort("growth")}>{copy("Growth")}</button></th>
              <th><button onClick={() => sort("totalVideos")}>{copy("Videos")}</button></th>
              <th><label className="design-compare-heading"><input type="checkbox" checked={pageSelected} onChange={togglePageComparison} aria-label={copy("Select page for comparison")} />{copy("Actions")}</label></th>
            </tr>
          </thead>
          <tbody>
            {paged.map(player => <tr key={player.id} className="design-clickable-row" onClick={() => setPreview(player)}>
              <td>{String(player.rank).padStart(2, "0")}</td>
              <td><button className="text-left" onClick={event => { event.stopPropagation(); setPreview(player); }}>{player.name}</button></td>
              <td>{player.age != null ? `U${player.age}` : "—"}</td>
              <td>{player.position}</td>
              <td>{player.city || "—"}</td>
              <td>{player.aiScore.toFixed(1)}</td>
              <td><span className={`design-growth ${(player.growth ?? 0) < 0 ? "design-growth-negative" : ""}`}>{player.growth == null || player.growth === 0 ? "—" : `${(player.growth ?? 0) > 0 ? "▲ +" : "▼ "}${player.growth?.toFixed(1)}`}</span></td>
              <td>{player.totalVideos}</td>
              <td onClick={event => event.stopPropagation()}><div className="design-rank-actions">
                <button className="design-icon-button" aria-label={`${copy("Compare")} ${player.name}`} aria-pressed={compareIds.includes(player.id)} onClick={() => toggleCompare(player.id)}><Scale /></button>
                <button className="design-icon-button" aria-label={`${savedIds.includes(player.id) ? "Unsave" : "Save"} ${player.name}`} aria-pressed={savedIds.includes(player.id)} onClick={() => toggleSaved(player.id)}><Bookmark fill={savedIds.includes(player.id) ? "currentColor" : "none"} /></button>
                <Link className="design-icon-button" aria-label={`Open ${player.name} profile`} to={profilePath(player.id)}><Eye /></Link>
              </div></td>
            </tr>)}
          </tbody>
        </table>
        {!paged.length && <div className="design-empty">
          {tab === "saved" ? "Save players using the bookmark button to build your shortlist." : tab === "alerts" ? "No score changes for your saved players." : "No players match these filters."}
        </div>}
      </div>
      <div className="design-table-footer">
        <span>{copy("Showing")}{" "}{filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, filtered.length)} {" "}{copy("of")}{" "}{filtered.length} {" "}{copy("players")}</span>
        <div className="design-pagination">
          <button disabled={page === 1} onClick={() => updateURL({ page: String(page - 1) })}>{copy("← Prev")}</button>
          {pageNumbers.map(value => <button key={value} className={page === value ? "active" : ""} aria-current={page === value ? "page" : undefined} onClick={() => updateURL({ page: String(value) })}>{value}</button>)}
          <button disabled={page === totalPages} onClick={() => updateURL({ page: String(page + 1) })}>{copy("Next →")}</button>
        </div>
      </div>
    </>}
    <PlayerPreviewModal player={preview} isOpen={!!preview} onClose={() => setPreview(null)} selectedForComparison={!!preview && compareIds.includes(preview.id)} onCompare={toggleCompare} />
    {compareIds.length > 0 && <div className="design-compare-tray">
      <span className="design-eyebrow">{compareIds.length} {copy("selected")}</span>
      <div className="design-compare-names">{comparePlayers.map(player => <button key={player.id} onClick={() => toggleCompare(player.id)}>{player.name} ×</button>)}</div>
      <button className="design-link" onClick={() => setCompareIds([])}>{copy("Clear")}</button>
      <button className="design-button" disabled={compareIds.length < 2} onClick={() => setCompareOpen(true)}>{copy("Compare players")}</button>
    </div>}
    <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{copy("Compare players")}</DialogTitle>
        </DialogHeader>
        <div className="design-table-scroll"><table className="design-table design-comparison-table">
          <thead>
            <tr>
              <th>{copy("Metric")}</th>
              {comparePlayers.map(player => <th key={player.id}>{player.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {([{ key: "aiScore", label: "AI score" }, { key: "growth", label: "Growth" }, { key: "rank", label: "Rank" }, { key: "totalVideos", label: "Videos" }] as const).map(metric => <tr key={metric.key}>
              <td>{metric.label}</td>
              {comparePlayers.map(player => <td className="design-mono" key={player.id}>{player[metric.key]}</td>)}
            </tr>)}
          </tbody>
        </table></div>
      </DialogContent>
    </Dialog>
  </main>;
}
