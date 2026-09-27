import { useDesignCopy } from "@/hooks/useDesignCopy";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { useCoachSquad, useTeamFlags, useUpcomingEvents } from "@/hooks/useCoachData";
import { useDemoContext } from "@/demo";
import { supabase } from "@/integrations/supabase/client";
import { positionCode } from "@/lib/player";

export function OverviewTab({ teamId, onInvite }: { teamId?: string; onInvite: () => void; }) {
  const copy = useDesignCopy();
  const { t } = useTranslation("dashboard");
  const demo = useDemoContext();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("All");
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 100]);
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [sortBy, setSortBy] = useState<"name" | "age" | "score">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const { data: squad = [], isLoading, isError } = useCoachSquad(teamId);
  const { data: flags = [] } = useTeamFlags(teamId);
  const { data: upcoming = [] } = useUpcomingEvents(teamId);
  const playerIds = useMemo(() => squad.map(player => player.player_id || player.id), [squad]);

  const { data: activity = [], isError: activityError } = useQuery({
    queryKey: ["team-analysis-activity", teamId, playerIds, !!demo],
    enabled: !demo && playerIds.length > 0,
    queryFn: async () => {
      const { data: videos, error } = await supabase.from("videos").select("id, user_id, uploaded_at, status").in("user_id", playerIds).order("uploaded_at", { ascending: false });
      if (error) throw error;
      const completed = (videos || []).filter(video => video.status === "completed").map(video => video.id);
      if (!completed.length) return (videos || []).map(video => ({ ...video, score: null as number | null }));
      const { data: analyses, error: analysisError } = await supabase.from("analyses").select("video_id, overall").in("video_id", completed);
      if (analysisError) throw analysisError;
      const scores = new Map((analyses || []).map(analysis => [analysis.video_id, analysis.overall]));
      return (videos || []).map(video => ({ ...video, score: scores.get(video.id) ?? null }));
    },
  });

  const roster = useMemo(() => demo ? demo.roster.map(player => ({ id: player.id, name: player.name, age: player.age, position: positionCode(player.position), score: player.latest_score, uploaded: player.last_upload })) : squad.map(player => {
    const id = player.player_id || player.id;
    return { id, name: player.name || "Unnamed player", age: player.age, position: positionCode(player.position), score: activity.find(video => video.user_id === id && video.score != null)?.score ?? null, uploaded: activity.find(video => video.user_id === id)?.uploaded_at };
  }), [demo, squad, activity]);
  const filtered = useMemo(() => {
    const ageFiltered = ageRange[0] !== 0 || ageRange[1] !== 100;
    const scoreFiltered = scoreRange[0] !== 0 || scoreRange[1] !== 100;
    return roster.filter(player => (
      player.name.toLowerCase().includes(search.trim().toLowerCase())
      && (position === "All" || player.position === position)
      && (!ageFiltered || (player.age != null && player.age >= ageRange[0] && player.age <= ageRange[1]))
      && (!scoreFiltered || (player.score != null && player.score >= scoreRange[0] && player.score <= scoreRange[1]))
    )).sort((a, b) => {
      const direction = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "name") return a.name.localeCompare(b.name) * direction;
      const first = a[sortBy];
      const second = b[sortBy];
      if (first == null) return second == null ? 0 : 1;
      if (second == null) return -1;
      return (first - second) * direction;
    });
  }, [roster, search, position, ageRange, scoreRange, sortBy, sortOrder]);
  const resetFilters = () => {
    setSearch("");
    setPosition("All");
    setAgeRange([0, 100]);
    setScoreRange([0, 100]);
    setSortBy("name");
    setSortOrder("asc");
  };
  const updateRange = (range: [number, number], index: 0 | 1, value: string) => {
    const next: [number, number] = [...range];
    next[index] = value === "" ? (index === 0 ? 0 : 100) : Math.min(100, Math.max(0, Number(value)));
    return next;
  };
  const shown = showAll ? filtered : filtered.slice(0, 11);
  const scored = roster.filter(player => player.score != null);
  const average = scored.length ? (scored.reduce((total, player) => total + player.score!, 0) / scored.length).toFixed(1) : "—";
  const top = scored.reduce<(typeof roster)[number] | null>((best, player) => !best || player.score! > best.score! ? player : best, null);
  const uploadedThisWeek = roster.filter(player => player.uploaded && Date.now() - new Date(player.uploaded).getTime() < 7 * 86400000).length;
  const attention = demo ? demo.roster.filter(player => player.trend > 3 || !player.last_upload).map(player => ({ id: player.id, key: player.id, name: player.name, type: player.last_upload ? "high_potential" : "no_upload", note: player.last_upload ? `+${player.trend.toFixed(1)} since last upload. Keep the momentum.` : "No video uploaded yet. Invite this player to record a kick." })) : flags.map(flag => ({ id: flag.player_id, key: flag.id, name: roster.find(player => player.id === flag.player_id)?.name || flag.player_name || "Player", type: flag.type, note: flag.note }));
  const profilePath = (id: string) => `${demo ? "/demo" : ""}/player/${id}`;

  if (isLoading) return <div className="flex justify-center py-16">
    <Loader2 className="animate-spin text-primary" />
  </div>;
  if (isError) return <div className="design-empty">Could not load the team. Please reload the page.
  </div>;

  return <>
    <section className="design-team-stats" aria-label="Squad summary">
      <div className="design-team-stat">
        <span className="design-eyebrow">{copy("Players")}</span>
        <strong>{roster.length}</strong>
      </div>
      <div className="design-team-stat">
        <span className="design-eyebrow">{copy("Squad average")}</span>
        <strong>{average}<small> /100</small></strong>
      </div>
      <div className="design-team-stat">
        <span className="design-eyebrow">{copy("Uploaded this week")}</span>
        <strong>{uploadedThisWeek}<small> / {roster.length}</small></strong>
      </div>
      <div className="design-team-stat">
        <span className="design-eyebrow">{copy("Top performer")}</span>
        <div className="design-top-player">
          <strong>{top?.name || "—"}</strong>
          <span>{top?.score?.toFixed(1)}</span>
        </div>
      </div>
    </section>
    {activityError && <p role="alert" className="text-sm text-destructive py-4">Could not load video activity. Scores will appear when the connection is restored.</p>}
    <section className="design-attention">
      <h2>{copy("Needs attention")}</h2>
      {attention.map(flag => <div key={flag.key} className="design-flag">
        <span className={`design-tag ${flag.type === "high_potential" ? "" : "design-tag-signal"}`}>{flag.type.replace(/_/g, " ")}</span>
        <strong>{flag.name}</strong>
        <p>{flag.note}</p>
        <Link className="design-link" to={profilePath(flag.id)}>{copy("Open profile →")}</Link>
      </div>)}
      {!attention.length && <p className="text-sm text-muted-foreground border-t py-4">{copy("No players flagged for attention.")}</p>}
    </section>
    <section className="design-upcoming">
      <div className="design-section-heading"><h2>{copy("Upcoming events")}</h2></div>
      {upcoming.slice(0,3).map(event => <button key={event.id} className="design-upcoming-row" onClick={() => { const next = new URLSearchParams(params); next.set("tab", event.type === "match" ? "matches" : "training"); setParams(next, { replace:true }); }}><span className="design-tag">{copy(event.type === "match" ? "Match" : "Training")}</span><strong>{event.title}</strong><span className="design-mono">{event.date} · {event.time}</span>{event.location && <span>{event.location}</span>}<span className="design-link">{copy("Open")} →</span></button>)}
      {!upcoming.length && <p className="text-sm text-muted-foreground">{copy("No upcoming events.")}</p>}
    </section>
    <section className="design-roster">
      <div className="design-section-heading">
        <h2>{copy("Roster")}</h2>
        <div className="design-table-tools">
          <label htmlFor="roster-search">{copy("Search")}</label>
          <input id="roster-search" className="design-search" placeholder={copy("Player name")} value={search} onChange={event => setSearch(event.target.value)} />
          <button className="design-button design-button-outline design-button-mono" aria-expanded={showFilters} aria-controls="roster-filters" onClick={() => setShowFilters(!showFilters)}>{copy("FILTERS ↓")}</button>
        </div>
      </div>
      {showFilters && <div className="design-filter-panel" id="roster-filters">
        <div className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0 space-y-2">
            <label className="design-eyebrow" htmlFor="roster-position">{copy("Position")}</label>
            <select id="roster-position" className="design-search" style={{ width: "100%" }} value={position} onChange={event => setPosition(event.target.value)}>{["All", "GK", "DEF", "MID", "FWD"].map(value => <option key={value} value={value}>{value === "All" ? t("coach.filters.allPositions") : value}</option>)}</select>
          </div>
          <div className="min-w-0 space-y-2">
            <label className="design-eyebrow" htmlFor="roster-age-min">{t("coach.filters.ageRange")}</label>
            <div className="flex gap-2">
              <input id="roster-age-min" className="design-search" style={{ width: "50%", minWidth: 0 }} type="number" min={0} max={100} aria-label={`${t("coach.filters.ageRange")}: ${t("coach.filters.min")}`} value={ageRange[0]} onChange={event => setAgeRange(updateRange(ageRange, 0, event.target.value))} />
              <input id="roster-age-max" className="design-search" style={{ width: "50%", minWidth: 0 }} type="number" min={0} max={100} aria-label={`${t("coach.filters.ageRange")}: ${t("coach.filters.max")}`} value={ageRange[1]} onChange={event => setAgeRange(updateRange(ageRange, 1, event.target.value))} />
            </div>
          </div>
          <div className="min-w-0 space-y-2">
            <label className="design-eyebrow" htmlFor="roster-score-min">{copy("AI score")}</label>
            <div className="flex gap-2">
              <input id="roster-score-min" className="design-search" style={{ width: "50%", minWidth: 0 }} type="number" min={0} max={100} aria-label={t("coach.filters.minScore")} value={scoreRange[0]} onChange={event => setScoreRange(updateRange(scoreRange, 0, event.target.value))} />
              <input id="roster-score-max" className="design-search" style={{ width: "50%", minWidth: 0 }} type="number" min={0} max={100} aria-label={t("coach.filters.maxScore")} value={scoreRange[1]} onChange={event => setScoreRange(updateRange(scoreRange, 1, event.target.value))} />
            </div>
          </div>
          <div className="min-w-0 space-y-2">
            <label className="design-eyebrow" htmlFor="roster-sort">{t("coach.filters.sortBy")}</label>
            <select id="roster-sort" className="design-search" style={{ width: "100%" }} value={sortBy} onChange={event => setSortBy(event.target.value as "name" | "age" | "score")}>
              <option value="name">{t("coach.filters.sorting.name")}</option>
              <option value="age">{t("coach.filters.sorting.age")}</option>
              <option value="score">{copy("AI score")}</option>
            </select>
          </div>
          <div className="min-w-0 space-y-2">
            <label className="design-eyebrow" htmlFor="roster-sort-order">{t("coach.filters.order")}</label>
            <select id="roster-sort-order" className="design-search" style={{ width: "100%" }} value={sortOrder} onChange={event => setSortOrder(event.target.value as "asc" | "desc")}>
              <option value="asc">{t("coach.filters.ascending")}</option>
              <option value="desc">{t("coach.filters.descending")}</option>
            </select>
          </div>
          <button className="design-link self-end justify-self-start" onClick={resetFilters}>{copy("Reset filters")}</button>
        </div>
      </div>}
      <div className="design-table-scroll">
        <table className="design-table design-roster-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{copy("Player")}</th>
              <th>{copy("Age")}</th>
              <th>{copy("Pos")}</th>
              <th>{copy("AI score")}</th>
              <th>{copy("Last upload")}</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {shown.map((player, index) => <tr key={player.id}>
              <td>{String(index + 1).padStart(2, "0")}</td>
              <td>{player.name}</td>
              <td className="design-mono">{player.age ?? "—"}</td>
              <td className="design-mono">{player.position}</td>
              <td><div className="design-roster-score">
                <span>{player.score != null ? Math.round(player.score) : "—"}</span>
                <div className="design-meter">
                  <span style={{ width: `${Math.min(100, Math.max(0, player.score || 0))}%` }} />
                </div>
              </div></td>
              <td className="design-mono">{player.uploaded ? new Date(player.uploaded).toLocaleDateString() : "No video"}</td>
              <td>{player.uploaded ? <Link className="design-link" to={profilePath(player.id)}>{copy("Open →")}</Link> : <button className="design-link" onClick={onInvite}>{copy("Invite →")}</button>}</td>
            </tr>)}
          </tbody>
        </table>
        {!shown.length && <div className="design-empty">
          {roster.length ? "No players match these filters." : "Invite players to build your squad."}
        </div>}
      </div>
      <div className="design-table-footer">
        <span>{copy("Showing")}{" "}{shown.length} {" "}{copy("of")}{" "}{filtered.length} {" "}{copy("players")}</span>
        {filtered.length > 11 && <button className="design-link" onClick={() => setShowAll(!showAll)}>{showAll ? "Show fewer players ↑" : "Show all players →"}</button>}
      </div>
    </section>
  </>;
}
