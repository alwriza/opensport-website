import { useState } from "react";
import { Link } from "react-router-dom";
import { useDesignCopy } from "@/hooks/useDesignCopy";

/** One example player is used by every mockup on the landing page. All numbers are sample data. */
export const EXAMPLE_PLAYER = { name: "Ayan K.", age: 16, position: "RW", city: "Almaty", region: "Kazakhstan" };
export const EXAMPLE_SCORES = { technique: 82, power: 65, stability: 78, balance: 71 };
const SCORE_ORDER = ["technique", "power", "stability", "balance"] as const;
const SCORE_LABELS = { technique: "Technique", power: "Power", stability: "Stability", balance: "Balance" };
const WEAKEST = "power";
/** Overall score at each of the four weekly tests. */
const HISTORY = [61.2, 66.0, 70.4, 74.0];

export type Status = "live" | "pilot" | "next";
const STATUS_LABEL = { live: "Live now", pilot: "Pilot", next: "Coming next" };

export function StatusBadge({ status }: { status: Status }) {
  const copy = useDesignCopy();
  return <span className="eco-status" data-status={status}>{copy(STATUS_LABEL[status])}</span>;
}

function Sparkline({ values, label }: { values: number[]; label: string }) {
  const min = Math.min(...values) - 4, max = Math.max(...values) + 2;
  const points = values.map((v, i) => [6 + i * (188 / (values.length - 1)), 40 - ((v - min) / (max - min)) * 32]);
  return <svg className="eco-spark" viewBox="0 0 200 46" fill="none" role="img" aria-label={label}>
    <path d={points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ")} stroke="#6FD39C" strokeWidth="2" strokeLinejoin="round" />
    {points.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 4 : 2.6} fill={i === points.length - 1 ? "#6FD39C" : "#1D1F18"} stroke="#6FD39C" strokeWidth="1.6" />)}
  </svg>;
}

function ScoreBars({ highlight = false, only }: { highlight?: boolean; only?: typeof WEAKEST }) {
  const copy = useDesignCopy();
  return <div className="eco-bars">
    {SCORE_ORDER.filter(key => !only || key === only).map(key => <div key={key} className="eco-bar" data-weak={highlight && key === WEAKEST}>
      <span>{copy(SCORE_LABELS[key])}</span>
      <span className="eco-bar-track"><span style={{ width: `${EXAMPLE_SCORES[key]}%` }} /></span>
      <span>{EXAMPLE_SCORES[key]}</span>
    </div>)}
  </div>;
}

/* ------------------------------------------------------------------ pipeline */

/** The same example player, transformed stage by stage: scores → priority → profile → search result. */
function StageVisual({ stage }: { stage: number }) {
  const copy = useDesignCopy();
  const [saved, setSaved] = useState(false);
  if (stage === 0) return <div className="eco-card"><ScoreBars /></div>;
  if (stage === 1) return <div className="eco-card">
    <span className="eco-card-label">{copy("Priority area")}</span>
    <ScoreBars highlight only={WEAKEST} />
    <div className="eco-steps" role="img" aria-label={copy("Power 52, then 58, then 63")}>
      {[52, 58, 63].map((v, i) => <span key={v} data-last={i === 2 || undefined}>{v}</span>)}
    </div>
    <p className="eco-card-note">{copy("3 power drills → same kick again")}</p>
  </div>;
  if (stage === 2) return <div className="eco-card">
    <div className="eco-profile-head">
      <strong>{copy(EXAMPLE_PLAYER.name)}</strong>
      <span>{EXAMPLE_PLAYER.age} · {EXAMPLE_PLAYER.position} · {copy(EXAMPLE_PLAYER.city)}</span>
    </div>
    <div className="eco-profile-numbers">
      <div><b>74.0</b><small>{copy("Overall")}</small></div>
      <div><b className="eco-up">+12.8</b><small>{copy("Progress")}</small></div>
      <div><b>4</b><small>{copy("Tests")}</small></div>
    </div>
    <Sparkline values={HISTORY} label={copy("Overall score rising from 61.2 to 74.0 over four tests")} />
  </div>;
  return <div className="eco-card">
    <p className="eco-filters">RW · 15–17 · {copy("Kazakhstan")} · {copy("Technique")} 75+</p>
    <div className="eco-profile-head">
      <strong>{copy(EXAMPLE_PLAYER.name)}</strong>
      <span>{copy("Technique")} 82 · <em className="eco-up">+12.8</em> · {copy("4 videos")}</span>
    </div>
    <div className="eco-actions">
      <span>{copy("Profile")}</span><span>{copy("Video")}</span><span>{copy("Compare")}</span>
      <button type="button" aria-pressed={saved} onClick={() => setSaved(v => !v)}>{saved ? copy("✓ Saved") : copy("Save")}</button>
    </div>
  </div>;
}

const STAGES = [
  { title: "Analyze", line: "Film a kick. Get four scores.", status: "live" as Status },
  { title: "Improve", line: "Find the weak spot. Train it. Retest.", status: "live" as Status },
  { title: "Prove", line: "Every test adds to your profile.", status: "live" as Status },
  { title: "Become visible", line: "Scouts can find your profile and watch the evidence.", status: "pilot" as Status },
];

export function Pipeline({ profilePath }: { profilePath: string }) {
  const copy = useDesignCopy();
  return <section className="eco-pipeline" id="pipeline" aria-labelledby="pipeline-title">
    <div className="eco-pipeline-intro">
      <span className="landing-science-eyebrow">{copy("What happens after the first analysis?")}</span>
      <h2 className="landing-science-title" id="pipeline-title">{copy("From analysis")}<br />{copy("to opportunity")}</h2>
      <p className="landing-science-description">{copy("Follow one example player. The same data grows from a single test into a profile scouts can review.")}</p>
    </div>
    <ol className="eco-stages">
      {STAGES.map((s, i) => <li key={s.title} className="eco-stage">
        <span className="eco-stage-number">0{i + 1}</span>
        <h3>{copy(s.title)}{s.status === "pilot" && <StatusBadge status="pilot" />}</h3>
        <p>{copy(s.line)}</p>
        <StageVisual stage={i} />
      </li>)}
    </ol>
    <div className="eco-pipeline-foot">
      <p>{copy("Players see their development. Coaches track it. Scouts review the evidence.")}</p>
      <Link className="landing-science-link" to={profilePath}>{copy("See a player profile →")}</Link>
    </div>
  </section>;
}

/* --------------------------------------------------------------------- roles */

type Role = { key: string; status?: Status; title: string; question: string; value: string; points: string[]; cta: string; to?: string; href?: string };

export function Roles({ startPath, startState }: { startPath: string; startState?: object }) {
  const copy = useDesignCopy();
  const roles: Role[] = [
    { key: "player", title: "Player", question: "What should I improve?", value: "Know your weak spot and prove that training works.",
      points: ["Kick analysis", "Targeted drills", "Progress tracking"], cta: "Analyze my first video", to: startPath },
    { key: "coach", title: "Coach", question: "How do I make this player better?", value: "Objective data next to your judgment. It supports you, it doesn't replace you.",
      points: ["Weaknesses", "Development trend", "Training priorities"], cta: "See a player report", to: "/demo/coach-dashboard" },
    { key: "scout", status: "pilot", title: "Scout / club", question: "Is this player worth watching?", value: "Decide who deserves a closer look, beyond the players you already know.",
      points: ["Metrics", "Video evidence", "Comparison"], cta: "How search works", to: "/demo/ranking" },
    { key: "academy", status: "pilot", title: "Academy / league", question: "How do we measure development at scale?", value: "One protocol for every team, one consistent dataset.",
      points: ["Standardized assessment", "Team data", "Program trends"], cta: "Book a pilot", href: "mailto:contact@opensport.app?subject=League%20pilot" },
  ];
  return <section className="eco-roles" id="roles" aria-labelledby="roles-title">
    <div className="eco-roles-intro">
      <span className="design-eyebrow">{copy("Built for the whole pathway")}</span>
      <h2 className="landing-roadmap-title" id="roles-title">{copy("Same player data.")} {copy("Different decisions.")}</h2>
    </div>
    <div className="eco-role-grid">
      {roles.map(role => <article className="eco-role" key={role.key} id={role.key === "scout" ? "scouts" : role.key === "coach" ? "coaches" : undefined}>
        <header><span className="design-eyebrow">{copy(role.title)}</span>{role.status && <StatusBadge status={role.status} />}</header>
        <h3>{copy(role.question)}</h3>
        <p>{copy(role.value)}</p>
        <ul>{role.points.map(p => <li key={p}>{copy(p)}</li>)}</ul>
        {role.to
          ? <Link className="eco-role-link" to={role.to} state={role.key === "player" ? startState : undefined}>{copy(role.cta)} →</Link>
          : <a className="eco-role-link" href={role.href}>{copy(role.cta)} →</a>}
      </article>)}
    </div>
  </section>;
}

/* ---------------------------------------------------------------------- trust */

const CHAIN = [
  { title: "Video", text: "One kick from a phone. No sensors or markers." },
  { title: "33 body points", text: "Tracked frame by frame, so the model reads movement, not pixels." },
  { title: "Measurements", text: "Knee, hip, ankle and trunk angles at contact, and the order in which they fire." },
  { title: "Deterministic scoring", text: "The same movement always gets the same four scores, from 0 to 100." },
  { title: "Report", text: "If a coach disagrees with a number, we can show the frame and angle behind it." },
];

export function Trust() {
  const copy = useDesignCopy();
  return <section className="eco-trust" id="science" aria-labelledby="trust-title">
    <div className="landing-science-intro">
      <span className="landing-science-eyebrow">{copy("Why trust the score?")}</span>
      <h2 className="landing-science-title" id="trust-title">{copy("Not a")}<br />{copy("black box")}</h2>
      <p className="landing-science-description">{copy("One kick is only one part of football, not a verdict on talent.")}</p>
      <Link className="landing-science-link" to="/about#method">{copy("Read the full method →")}</Link>
    </div>
    <ol className="eco-chain" aria-label={copy("How a video becomes a score")}>
      {CHAIN.map((c, i) => <li key={c.title}>
        <span>0{i + 1}</span>
        <div><h3>{copy(c.title)}</h3><p>{copy(c.text)}</p></div>
      </li>)}
    </ol>
  </section>;
}

/* -------------------------------------------------------------------- roadmap */

export function Roadmap() {
  const copy = useDesignCopy();
  const columns: { status: Status; items: string[] }[] = [
    { status: "live", items: ["Kick video analysis and four scores", "Weakest area and training plans", "Retests and progress over time", "Player profile and national ranking", "Coach squad workspace"] },
    { status: "pilot", items: ["Scout accounts and remote evidence review", "League and academy assessment programs", "Full-match tracking (beta)"] },
    { status: "next", items: ["More football actions", "Position-specific analysis", "League-scale batch processing", "Advanced team dashboards"] },
  ];
  return <section className="eco-roadmap" id="roadmap" aria-labelledby="roadmap-heading">
    <div className="eco-roadmap-intro">
      <span className="design-eyebrow">{copy("We label what is not built yet")}</span>
      <h2 className="landing-roadmap-title" id="roadmap-heading">{copy("What works today")}</h2>
    </div>
    <div className="eco-roadmap-grid">
      {columns.map(col => <div key={col.status} className="eco-roadmap-col" data-status={col.status}>
        <StatusBadge status={col.status} />
        <ul>{col.items.map(item => <li key={item}>{copy(item)}</li>)}</ul>
      </div>)}
    </div>
  </section>;
}
