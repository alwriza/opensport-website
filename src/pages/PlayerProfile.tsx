import type { PlayerEvaluation, TrainingSession } from "@/types/coach";
import { useDesignCopy } from "@/hooks/useDesignCopy";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useDemoContext } from "@/demo";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_RANKING } from "@/data/demoRanking";
import { MetricList } from "@/components/redesign/primitives";
import { AnalysisVideo } from "@/components/redesign/AnalysisVideo";
import { AnalysisHistoryTable } from "@/components/redesign/AnalysisHistoryTable";
import { TeamProfileOverlay } from "@/components/ui/TeamProfileOverlay";
import { useCoachMatches, useCoachSquad, usePlayerEvaluations, useTrainingSessions } from "@/hooks/useCoachData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const tabs = ["overview", "matches", "training", "evaluations"] as const;

export default function PlayerProfile() {
  const copy = useDesignCopy();
  const { id } = useParams<{ id: string; }>();
  const demo = useDemoContext();
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof tabs)[number]>("overview");
  const [playing, setPlaying] = useState<{ url: string; filename: string; } | null>(null);
  const [videoError, setVideoError] = useState("");
  const [teamProfileId, setTeamProfileId] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ playerId?: string; teamId: string; } | null>(null);
  const [evaluation, setEvaluation] = useState<PlayerEvaluation | null>(null);
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["player-profile", id, !!demo], enabled: !!id,
    queryFn: async () => {
      if (demo) {
        const ranked = DEMO_RANKING.find(player => player.id === id);
        const roster = demo.roster.find(player => player.id === id || player.name === ranked?.name);
        if (roster) return { id: roster.id, name: roster.name, age: roster.age, position: roster.position, city: ranked?.city || "", club: roster.club, height: roster.height, weight: roster.weight };
        if (ranked) return { id: ranked.id, name: ranked.name, age: ranked.age, position: ranked.position, city: ranked.city, club: ranked.team, height:null, weight:null };
        return null;
      }
      const { data, error } = await supabase.from("users").select("id, name, age, position, city, club, height, weight").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: analyses = [] } = useQuery({
    queryKey: ["player-profile-analyses", id, !!demo], enabled: !!profile,
    queryFn: async () => {
      if (demo) {
        const player = demo.roster.find(player => player.id === profile?.id);
        return player && player.latest_score != null ? [{ id: player.id, video_id: "", overall: player.latest_score, ...player.metrics, feedback: "Demo player technique breakdown.", created_at: player.last_upload || "" }] : [];
      }
      const { data, error } = await supabase.from("analyses").select("id, video_id, overall, stability, power, technique, balance, feedback, created_at").eq("user_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
  const { data: videos = [] } = useQuery({
    queryKey: ["player-profile-videos", id, !!demo], enabled: !!profile && !demo,
    queryFn: async () => {
      const { data, error } = await supabase.from("videos").select("id, filename, uploaded_at, duration, storage_path, status").eq("user_id", id!).order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
  const { data: memberships = [] } = useQuery({
    queryKey: ["player-profile-teams", id, !!demo], enabled: !!profile,
    queryFn: async () => {
      if (demo) return demo.roster.some(player => player.id === profile?.id) ? [{ team_id:demo.teams[0].id, name:demo.teams[0].name, age_group:demo.teams[0].age_group }] : [];
      const { data, error } = await supabase.from("team_rosters").select("team_id, teams(id, name, age_group)").eq("player_id", id!).eq("status", "active");
      if (error) throw error;
      return (data || []).flatMap(row => row.teams ? [{ team_id:row.team_id, name:row.teams.name, age_group:row.teams.age_group }] : []);
    },
  });
  const teamId = selection?.playerId === id && memberships.some(team => team.team_id === selection.teamId) ? selection.teamId : memberships[0]?.team_id;
  const { data: squad = [] } = useCoachSquad(teamId);
  const squadPlayer = squad.find(player => player.id === id || player.player_id === id);
  const { data: evaluations = [] } = usePlayerEvaluations(id, teamId);
  const { data: matches = [] } = useCoachMatches(teamId);
  const { data: training = [] } = useTrainingSessions(teamId);
  const playerMatches = matches.filter(match => match.starting_xi?.includes(id || "") || match.substitutes?.includes(id || ""));
  const playerTraining = (training as (TrainingSession & { training_session_players?: { player_id: string; }[]; })[]).filter(session => session.assigned_players?.includes(id || "") || session.training_session_players?.some(player => player.player_id === id));
  const playerEvaluations = evaluations.filter(evaluation => evaluation.player_id === id);
  const latest = analyses[0];
  const ranked = demo ? DEMO_RANKING.find(player => player.id === id) : null;
  const overall = latest?.overall ?? ranked?.aiScore;
  const latestVideo = videos.find(video => video.id === latest?.video_id) || videos.find(video => video.status === "completed");
  const averageScore = analyses.length ? analyses.reduce((sum, analysis) => sum + analysis.overall, 0) / analyses.length : null;
  const watchVideo = async (video: (typeof videos)[number]) => {
    setVideoError("");
    const { data, error } = await supabase.storage.from("videos").createSignedUrl(video.storage_path, 3600);
    if (error) { setVideoError("Could not open the video. Please try again."); return; }
    setPlaying({ url: data.signedUrl, filename: video.filename });
  };

  if (isLoading) return <div className="flex justify-center py-20">
    <Loader2 className="animate-spin text-primary" />
  </div>;
  if (!profile) return <main className="design-page p-10">
    <h1 className="text-3xl">{isError ? "Could not load this profile" : "Player not found"}</h1>
    <button className="design-link mt-6" onClick={() => navigate(-1)}>{copy("← Back")}</button>
  </main>;

  return <main className="design-page design-player-profile">
    <section className="design-player-hero">
      <div className="design-player-info">
        <div className="design-player-identity">
          <span className="design-eyebrow design-player-latest">{copy("Player profile")}</span>
          <h1 className="design-player-name">{profile.name}</h1>
          <div className="design-player-tags">
            {[profile.age != null ? `U${profile.age}` : null, profile.position, profile.city, profile.club,
              profile.height ? `${profile.height} ${copy("cm")}` : null, profile.weight ? `${profile.weight} ${copy("kg")}` : null].filter(Boolean).map(value => <span key={value}>{value}</span>)}
          </div>
        </div>
        <div className="design-player-score-row">
          <div className="design-player-score"><strong>{overall?.toFixed(1) ?? "—"}</strong><span>/100</span></div>
          <div className="design-player-trend"><span className="design-eyebrow">{copy("Overall")}</span></div>
        </div>
        <div className="design-player-actions"><button className="design-button design-button-outline design-button-dark-outline" onClick={() => navigate(-1)}>{copy("← Back")}</button></div>
      </div>
      <aside className="design-player-overview">
        <div className="design-profile-stats">
          {[{label:copy("Videos"),value:videos.length}, {label:copy("Matches"),value:playerMatches.length}, {label:copy("Evaluations"),value:playerEvaluations.length}, {label:copy("Average score"),value:averageScore?.toFixed(1) ?? "—"}].map(stat => <div key={stat.label}><span className="design-eyebrow">{stat.label}</span><strong>{stat.value}</strong></div>)}
        </div>
        <section className="design-profile-teams">
          <div className="design-section-heading"><h2>{copy("Teams")}</h2></div>
          {memberships.map(team => <div className="design-profile-team" key={team.team_id}><div><strong>{team.name}</strong><p>{team.age_group}</p></div><button className="design-link" onClick={() => setTeamProfileId(team.team_id)}>{copy("Open")} →</button></div>)}
          {!memberships.length && <p className="design-teams-empty">{profile.club || copy("Independent player")}</p>}
          {memberships.length > 1 && <label className="design-team-context"><span>{copy("Team statistics")}</span><select value={teamId} onChange={event => setSelection({ playerId:id, teamId:event.target.value })}>{memberships.map(team => <option key={team.team_id} value={team.team_id}>{team.name}</option>)}</select></label>}
        </section>
      </aside>
    </section>
    <nav className="design-coach-tabs" aria-label="Player sections">
      {tabs.map(value => <button className={value === tab ? "active" : ""} key={value} onClick={() => setTab(value)}>{copy(value.charAt(0).toUpperCase() + value.slice(1))}</button>)}
    </nav>
    <div className="design-profile-content">
      {tab === "overview" && <>
        <div className="design-player-body !p-0">
          <section className="design-breakdown">
            <div className="design-section-heading">
              <h2>{copy("Breakdown")}</h2>
              <Link className="design-link design-link-underlined" to={`${demo ? "/demo/home" : "/"}#science`}>{copy("What each score measures")}</Link>
            </div>
            <MetricList scores={latest || { stability: NaN, power: NaN, technique: NaN, balance: NaN }} />
          </section>
          <AnalysisVideo video={latestVideo} emptyMessage={copy("No shared videos available.")} />
        </div>
        <section className="mt-8">
          <div className="design-section-heading"><h2>{copy("Coach notes")}</h2></div>
          <p className="text-sm leading-relaxed text-muted-foreground max-w-prose">{latest?.feedback || copy("No detailed analysis is available for this player yet.")}</p>
        </section>
        <div className="design-profile-performance">
          {[{key:"goals",label:"Goals"},{key:"assists",label:"Assists"},{key:"appearances",label:"Appearances"},{key:"starts",label:"Starts"}].map(metric => <div key={metric.key}><span className="design-eyebrow">{copy(metric.label)}</span><strong>{squadPlayer?.[metric.key as "goals" | "assists" | "appearances" | "starts"] ?? "—"}</strong></div>)}
        </div>
        <section className="mt-8">
          <div className="design-section-heading"><h2>{copy("Recent matches")}</h2><button className="design-link" onClick={() => setTab("matches")}>{copy("All matches →")}</button></div>
          {playerMatches.slice(0,5).map(match => <button className="design-match-row" key={match.id} onClick={() => setTab("matches")}><span>{match.date} · {match.opponent}</span><span className="design-mono">{match.status === "completed" ? `${match.score_home}–${match.score_away}` : copy("Scheduled")}</span></button>)}
          {!playerMatches.length && <p className="text-sm text-muted-foreground">{copy("No match records available.")}</p>}
        </section>
        <section className="mt-8">
          <div className="design-section-heading">
            <h2>{copy("All analyses")}</h2>
          </div>
          <AnalysisHistoryTable videos={videos} onOpen={videoId => { const video = videos.find(item => item.id === videoId); if (video) void watchVideo(video); }} emptyMessage={copy("No shared videos available.")} />
          {videoError && <p role="alert" className="text-destructive text-sm mt-3">{videoError}</p>}
        </section>
      </>}
      {tab === "matches" && <div className="design-table-scroll">
        <table className="design-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Opponent</th>
              <th>{copy("Score")}</th>
              <th>{copy("Status")}</th>
            </tr>
          </thead>
          <tbody>
            {playerMatches.map(match => <tr key={match.id}>
              <td>{match.date}</td>
              <td>{match.opponent}</td>
              <td className="design-mono">{match.status === "completed" ? `${match.score_home}–${match.score_away}` : "—"}</td>
              <td>{match.status}</td>
            </tr>)}
          </tbody>
        </table>
        {!playerMatches.length && <p className="design-empty">No match records available.</p>}
      </div>}
      {tab === "training" && <section>
        {playerTraining.map(session => <div className="design-drill" key={session.id}>
          <span className="design-drill-category">{session.date} · {session.duration_minutes} min</span>
          <h2 className="design-drill-title">{session.name}</h2>
          <p className="text-sm text-muted-foreground">{session.objective}</p>
        </div>)}
        {!playerTraining.length && <p className="design-empty">No assigned training available.</p>}
      </section>}
      {tab === "evaluations" && <section>
        {playerEvaluations.map(item => <button className="design-evaluation-row" key={item.id} onClick={() => setEvaluation(item)}><span className="design-eyebrow">{item.date}</span><span>{item.notes}</span><span className="design-link">{copy("Open")} →</span></button>)}
        {!playerEvaluations.length && <p className="design-empty">No coach evaluations available.</p>}
      </section>}
    </div>
    <Dialog open={!!playing} onOpenChange={open => { if (!open) setPlaying(null); }}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{playing?.filename}</DialogTitle>
        </DialogHeader>
        {playing && <video src={playing.url} controls playsInline className="w-full max-h-[70vh] bg-black" />}
      </DialogContent>
    </Dialog>
    <Dialog open={!!evaluation} onOpenChange={open => { if (!open) setEvaluation(null); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{copy("Coach evaluation")} · {evaluation?.date}</DialogTitle></DialogHeader>
        {evaluation && <>
          <p className="text-sm text-muted-foreground">{evaluation.notes}</p>
          <MetricList scores={evaluation.ai_scores as { stability: number; power: number; technique: number; balance: number; }} />
          {Object.entries(evaluation.categories || {}).map(([category, scores]) => <section key={category}><h3 className="design-eyebrow mb-3">{copy(category)}</h3><div className="design-evaluation-scores">{Object.entries(scores).map(([label,value]) => <div key={label}><span>{copy(label.replace(/_/g, " "))}</span><strong className="design-mono">{String(value)}<small>/10</small></strong></div>)}</div></section>)}
        </>}
      </DialogContent>
    </Dialog>
    <TeamProfileOverlay teamId={teamProfileId} isOpen={!!teamProfileId} onClose={() => setTeamProfileId(null)} />
  </main>;
}
