import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDesignCopy } from "@/hooks/useDesignCopy";
import { PoseFigure } from "@/components/redesign/primitives";

/** One example player is used by every mockup on the landing page. All numbers are sample data. */
export const EXAMPLE_PLAYER = { name: "Ayan K.", age: 16, position: "RW", city: "Almaty", region: "Kazakhstan" };
export const EXAMPLE_SCORES = { technique: 82, power: 65, stability: 78, balance: 71 };
const SCORE_ORDER = ["technique", "power", "stability", "balance"] as const;
const SCORE_LABELS = { technique: "Technique", power: "Power", stability: "Stability", balance: "Balance" };
const WEAKEST = "power";
/** Overall score at each of the four weekly tests. */
const HISTORY = [61.2, 66.0, 70.4, 74.0];

export type Status = "live" | "pilot" | "next";

export function StatusBadge({ status }: { status: Status }) {
  const copy = useDesignCopy();
  const label = { live: "Live now", pilot: "Pilot", next: "Coming next" }[status];
  return <span className="eco-status" data-status={status}>{copy(label)}</span>;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function Sparkline({ values, label }: { values: number[]; label: string }) {
  const min = Math.min(...values) - 4, max = Math.max(...values) + 2;
  const points = values.map((v, i) => [8 + i * (184 / (values.length - 1)), 52 - ((v - min) / (max - min)) * 44]);
  return <svg className="eco-spark" viewBox="0 0 200 60" fill="none" role="img" aria-label={label}>
    <path d={points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ")} stroke="#6FD39C" strokeWidth="2" strokeLinejoin="round" />
    {points.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 4.5 : 3} fill={i === points.length - 1 ? "#6FD39C" : "#14150F"} stroke="#6FD39C" strokeWidth="1.6" />)}
  </svg>;
}

function ScoreBars({ highlight = false }: { highlight?: boolean }) {
  const copy = useDesignCopy();
  return <div className="eco-bars">
    {SCORE_ORDER.map(key => <div key={key} className="eco-bar" data-weak={highlight && key === WEAKEST}>
      <div><span>{copy(SCORE_LABELS[key])}</span><span>{EXAMPLE_SCORES[key]}</span></div>
      <span className="eco-bar-track"><span style={{ width: `${EXAMPLE_SCORES[key]}%` }} /></span>
    </div>)}
  </div>;
}

function PlayerLine() {
  const copy = useDesignCopy();
  return <span className="eco-player">{EXAMPLE_PLAYER.name} · {EXAMPLE_PLAYER.age} · {EXAMPLE_PLAYER.position} · {copy(EXAMPLE_PLAYER.region)}</span>;
}

function ScoutMock() {
  const copy = useDesignCopy();
  const [shortlisted, setShortlisted] = useState(false);
  const filters = [["Position", "RW"], ["Age", "15–17"], ["Region", "Kazakhstan"], ["Technique", "75+"], ["Progress", "Positive"]];
  return <div className="eco-mock eco-scout">
    <div className="eco-mock-bar"><span>{copy("DISCOVER PLAYERS")}</span><StatusBadge status="pilot" /></div>
    <ul className="eco-chips" aria-label={copy("Filters")}>
      {filters.map(([k, v]) => <li key={k}><small>{copy(k)}</small> {copy(v)}</li>)}
    </ul>
    <div className="eco-result">
      <div className="eco-result-head"><strong>{EXAMPLE_PLAYER.name}</strong><PlayerLine /></div>
      <dl className="eco-result-stats">
        <div><dt>{copy("Technique")}</dt><dd>82</dd></div>
        <div><dt>{copy("Progress")}</dt><dd className="eco-up">+12.8</dd></div>
        <div><dt>{copy("Tests")}</dt><dd>4</dd></div>
        <div><dt>{copy("Video")}</dt><dd>{copy("Yes")}</dd></div>
      </dl>
      <div className="eco-actions">
        <span>{copy("View profile")}</span><span>{copy("Watch evidence")}</span><span>{copy("Compare")}</span>
        <button type="button" aria-pressed={shortlisted} onClick={() => setShortlisted(v => !v)}>{shortlisted ? copy("✓ Shortlisted") : copy("Add to shortlist")}</button>
      </div>
    </div>
  </div>;
}

function CoachMock() {
  const copy = useDesignCopy();
  const rows = [["Ayan K.", "Power 65 · priority area", "↓"], ["Said M.", "Technique +6", "↑"], ["Miras T.", "Retest due", "•"]];
  return <div className="eco-mock">
    <div className="eco-mock-bar"><span>{copy("MY SQUAD")}</span><span className="eco-sample">{copy("Sample data")}</span></div>
    <ul className="eco-rows">
      {rows.map(([name, note, mark]) => <li key={name}><strong>{name}</strong><span>{copy(note)}</span><span className="eco-mark" data-mark={mark}>{mark}</span></li>)}
    </ul>
  </div>;
}

function LeagueMock() {
  const copy = useDesignCopy();
  return <div className="eco-mock">
    <div className="eco-mock-bar"><span>{copy("PROGRAM OVERVIEW")}</span><span className="eco-sample">{copy("Sample data")}</span></div>
    <dl className="eco-result-stats">
      <div><dt>{copy("Players assessed")}</dt><dd>126</dd></div>
      <div><dt>{copy("Teams")}</dt><dd>8</dd></div>
      <div><dt>{copy("Protocol")}</dt><dd>1</dd></div>
    </dl>
  </div>;
}

function PlayerMock() {
  const copy = useDesignCopy();
  return <div className="eco-mock">
    <div className="eco-mock-bar"><span>{copy("YOUR NEXT PRIORITY")}</span><span className="eco-sample">{copy("Sample data")}</span></div>
    <ScoreBars highlight />
  </div>;
}

/* ------------------------------------------------------------------ pipeline */

const STAGES = [
  { key: "analyze", title: "Analyze", line: "Film a kick. Get four scores." },
  { key: "improve", title: "Improve", line: "Find the weak spot. Train it." },
  { key: "prove", title: "Prove", line: "Every test builds your profile." },
  { key: "discover", title: "Get discovered", line: "Scouts search profiles, not rumours." },
] as const;

function StagePanel({ stage }: { stage: number }) {
  const copy = useDesignCopy();
  if (stage === 0) return <div className="eco-stage">
    <div className="eco-phone" aria-hidden="true"><PoseFigure highlight /><span>{copy("33 keypoints tracked")}</span></div>
    <div className="eco-stage-body">
      <span className="eco-label">{copy("VIDEO → SCORES")}</span>
      <ScoreBars />
      <p>{copy("Sample scores. Your own come from your own video.")}</p>
    </div>
  </div>;
  if (stage === 1) return <div className="eco-stage">
    <div className="eco-stage-body">
      <span className="eco-label">{copy("PRIORITY AREA")}</span>
      <ScoreBars highlight />
      <ul className="eco-drills">
        <li>{copy("3 power drills, with video")}</li>
        <li>{copy("Retest: same kick, same angle")}</li>
      </ul>
    </div>
    <div className="eco-stage-body">
      <span className="eco-label">{copy("POWER OVER 3 TESTS")}</span>
      <div className="eco-steps" aria-label={copy("Power 52, then 58, then 63")}>
        {[52, 58, 63].map((v, i) => <div key={v}><strong>{v}</strong><span className="eco-step-bar" style={{ height: `${v}px` }} /><small>{copy("TEST")} {i + 1}</small></div>)}
      </div>
      <p>{copy("Identify weaknesses. Train them. Test again.")}</p>
    </div>
  </div>;
  if (stage === 2) return <div className="eco-stage">
    <div className="eco-stage-body eco-profile">
      <span className="eco-label">{copy("PLAYER PERFORMANCE PROFILE")}</span>
      <h3>{EXAMPLE_PLAYER.name}</h3>
      <PlayerLine />
      <ScoreBars />
    </div>
    <div className="eco-stage-body">
      <span className="eco-label">{copy("OVERALL, 4 TESTS")}</span>
      <Sparkline values={HISTORY} label={copy("Overall score rising from 61.2 to 74.0 over four tests")} />
      <dl className="eco-result-stats"><div><dt>{copy("Progress")}</dt><dd className="eco-up">+12.8</dd></div><div><dt>{copy("Videos")}</dt><dd>4</dd></div></dl>
      <p className="eco-bridge">{copy("The profile is the bridge between training and scouting.")}</p>
    </div>
  </div>;
  return <div className="eco-stage eco-stage-single">
    <ScoutMock />
    <p className="eco-note">{copy("Sample interface. The national ranking already offers search, compare and a saved list; dedicated scout accounts are in pilot.")}</p>
  </div>;
}

export function Pipeline() {
  const copy = useDesignCopy();
  const [stage, setStage] = useState(0);
  const [touched, setTouched] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Walk through the stages once while the section is on screen; stop as soon as the visitor picks one.
  useEffect(() => {
    if (!visible || touched || prefersReducedMotion()) return;
    const timer = window.setInterval(() => setStage(s => (s + 1) % STAGES.length), 4800);
    return () => window.clearInterval(timer);
  }, [visible, touched]);

  return <section className="eco-pipeline" id="pipeline" aria-labelledby="pipeline-title">
    <div className="eco-pipeline-intro">
      <span className="landing-science-eyebrow">{copy("What happens after the first analysis?")}</span>
      <h2 className="landing-science-title" id="pipeline-title">{copy("From analysis")}<br />{copy("to opportunity")}</h2>
      <p className="landing-science-description">{copy("One continuous system connecting assessment, development and talent discovery. Follow one example player.")}</p>
    </div>
    <div className="eco-pipeline-body" ref={rootRef}>
      <div className="eco-stage-tabs" role="tablist" aria-label={copy("Pipeline stages")}>
        {STAGES.map((s, i) => <button key={s.key} type="button" role="tab" id={`eco-tab-${s.key}`} aria-selected={stage === i} aria-controls="eco-stage-panel"
          tabIndex={stage === i ? 0 : -1} data-active={stage === i} onClick={() => { setStage(i); setTouched(true); }}
          onKeyDown={e => {
            if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
            const next = (stage + (e.key === "ArrowRight" ? 1 : STAGES.length - 1)) % STAGES.length;
            setStage(next); setTouched(true);
            (e.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
          }}>
          <span className="eco-stage-number">0{i + 1}</span>
          <span className="eco-stage-title">{copy(s.title)}</span>
          <span className="eco-stage-line">{copy(s.line)}</span>
        </button>)}
      </div>
      <div className="eco-stage-panel" id="eco-stage-panel" role="tabpanel" aria-labelledby={`eco-tab-${STAGES[stage].key}`} aria-live={touched ? "polite" : "off"}>
        <StagePanel stage={stage} />
      </div>
    </div>
  </section>;
}

/* --------------------------------------------------------------------- roles */

type Role = {
  key: string; status: Status; title: string; value: string; points: string[]; flow: string; cta: string; mock: JSX.Element;
  detail: string; to?: string; href?: string;
};

export function Roles({ startPath, startState }: { startPath: string; startState?: object }) {
  const copy = useDesignCopy();
  const [open, setOpen] = useState<string | null>(null);
  const roles: Role[] = [
    { key: "player", status: "live", title: "Player", value: "Know what to improve. Prove how you're improving.",
      points: ["Understand your weaknesses", "Train with purpose", "Track progress", "Build performance evidence"],
      flow: "Record → Analyze → Train → Retest → Profile", cta: "Analyze my first kick", to: startPath, mock: <PlayerMock />,
      detail: "Every test is saved to your profile. Your next priority is always the lowest score, with drills attached, so you never open an empty dashboard." },
    { key: "coach", status: "live", title: "Coach", value: "See what the eye can't measure. OPENsport supports your decisions. It doesn't replace you.",
      points: ["Assess: standardized tests", "Develop: name the technical weakness", "Track: compare tests over time", "Decide: data next to your judgment"],
      flow: "Assess → Develop → Track → Decide", cta: "See a player report", to: "/demo/coach-dashboard", mock: <CoachMock />,
      detail: "Build a squad, review each player's report, assign training plans and watch retests come in. Squad, evaluations, training and statistics are in the coach workspace today." },
    { key: "scout", status: "pilot", title: "Scout / club", value: "Find talent beyond the players you already know. Use data to decide who deserves a closer look.",
      points: ["Filter by position, age, region, metrics", "Compare players side by side", "Watch the video behind each score", "Shortlist who to see in person"],
      flow: "Discover → Filter → Compare → Evidence → Shortlist", cta: "Explore scout workflow", to: "/demo/ranking", mock: <ScoutMock />,
      detail: "Today the national ranking offers search, filters, compare and a saved list. A dedicated scout workspace with remote evidence review is in pilot. It helps you decide where to look. It does not pick players for you." },
    { key: "academy", status: "pilot", title: "Academy / league", value: "Measure player development at scale.",
      points: ["Assess many players the same way", "Standardize the data", "Track development", "Review program insights"],
      flow: "Assess many → Standardize → Track → Review", cta: "Book a pilot", href: "mailto:contact@opensport.app?subject=League%20pilot", mock: <LeagueMock />,
      detail: "Run one protocol across teams and build a consistent dataset. We are running the first pilots now. Program-level dashboards are still being built, so the numbers shown are a sample." },
  ];
  return <section className="eco-roles" id="roles" aria-labelledby="roles-title">
    <div className="landing-section-heading">
      <h2 className="landing-how-title" id="roles-title">{copy("Built for the")}<br />{copy("whole pathway")}</h2>
      <span className="landing-how-caption">{copy("PLAYER → COACH → SCOUT → ACADEMY")}</span>
    </div>
    <div className="eco-role-grid">
      {roles.map(role => <article className="eco-role" key={role.key} id={role.key === "scout" ? "scouts" : role.key === "coach" ? "coaches" : undefined}>
        <header><span className="design-eyebrow">{copy(role.title)}</span><StatusBadge status={role.status} /></header>
        <h3>{copy(role.value)}</h3>
        <ul>{role.points.map(p => <li key={p}>{copy(p)}</li>)}</ul>
        <span className="eco-flow">{copy(role.flow)}</span>
        {open === role.key && <div className="eco-role-detail" id={`role-${role.key}`}>
          {role.mock}
          <p>{copy(role.detail)}</p>
        </div>}
        <div className="eco-role-foot">
          {role.to
            ? <Link className="landing-audience-link" to={role.to} state={role.key === "player" ? startState : undefined}>{copy(role.cta)} →</Link>
            : <a className="landing-audience-link" href={role.href}>{copy(role.cta)} →</a>}
          <button type="button" className="eco-more" aria-expanded={open === role.key} aria-controls={`role-${role.key}`} onClick={() => setOpen(open === role.key ? null : role.key)}>
            {open === role.key ? copy("Hide workflow") : copy("Show workflow")}
          </button>
        </div>
      </article>)}
    </div>
  </section>;
}

/* ------------------------------------------------------- same data, decisions */

export function Decisions() {
  const copy = useDesignCopy();
  return <section className="eco-decisions" aria-labelledby="decisions-title">
    <h2 className="landing-roadmap-title" id="decisions-title">{copy("Different decisions.")} {copy("Same player data.")}</h2>
    <div className="eco-decision-grid">
      <div className="eco-decision">
        <span className="design-eyebrow">{copy("Coach")}</span>
        <h3>{copy("How do I make this player better?")}</h3>
        <ul><li>{copy("Weaknesses")}</li><li>{copy("Development trend")}</li><li>{copy("Training priorities")}</li><li>{copy("Retest history")}</li></ul>
      </div>
      <div className="eco-decision-core" aria-label={copy("Player performance data")}>
        <PoseFigure />
        <strong>{copy("PLAYER PERFORMANCE DATA")}</strong>
        <small>{EXAMPLE_PLAYER.name}</small>
      </div>
      <div className="eco-decision">
        <span className="design-eyebrow">{copy("Scout")}</span>
        <h3>{copy("Is this player worth watching?")}</h3>
        <ul><li>{copy("Performance metrics")}</li><li>{copy("Progress")}</li><li>{copy("Video evidence")}</li><li>{copy("Position and comparison")}</li></ul>
      </div>
    </div>
  </section>;
}

/* ---------------------------------------------------------------------- trust */

const CHAIN = [
  { key: "video", title: "Video", text: "One kick from a phone, from any angle. No sensors or markers." },
  { key: "keypoints", title: "Keypoints", text: "33 body keypoints are tracked frame by frame, so the model works from the movement, not from the picture." },
  { key: "measure", title: "Measurements", text: "Knee, hip, ankle and trunk angles are measured at contact, along with the order in which hip, knee and ankle fire." },
  { key: "scores", title: "Scores", text: "Measurements are combined by a deterministic scorer into technique, power, stability and balance, each from 0 to 100." },
  { key: "report", title: "Report", text: "You get the scores, your weakest area and drills. If a coach disagrees with a number, we can point at the frame and the angle behind it." },
];

export function Trust() {
  const copy = useDesignCopy();
  const [active, setActive] = useState(2);
  return <section className="eco-trust" id="science" aria-labelledby="trust-title">
    <div className="landing-science-intro">
      <span className="landing-science-eyebrow">{copy("Why trust the score?")}</span>
      <h2 className="landing-science-title" id="trust-title">{copy("Not a")}<br />{copy("black box")}</h2>
      <p className="landing-science-description">{copy("Every number traces back to a measurement you can inspect. One kick is one part of your football, not a verdict on your talent.")}</p>
      <Link className="landing-science-link" to="/about#method">{copy("Read the full method →")}</Link>
    </div>
    <div className="eco-chain">
      <ol className="eco-chain-steps" aria-label={copy("How a video becomes a score")}>
        {CHAIN.map((c, i) => <li key={c.key}>
          <button type="button" aria-pressed={active === i} aria-controls="eco-chain-detail" onClick={() => setActive(i)}>
            <span>0{i + 1}</span>{copy(c.title)}
          </button>
        </li>)}
      </ol>
      <p className="eco-chain-detail" id="eco-chain-detail" aria-live="polite">{copy(CHAIN[active].text)}</p>
    </div>
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
    <div className="landing-section-heading">
      <h2 className="landing-how-title" id="roadmap-heading">{copy("Live now.")}<br />{copy("What's next.")}</h2>
      <span className="landing-how-caption">{copy("WE LABEL WHAT IS NOT BUILT YET")}</span>
    </div>
    <div className="eco-roadmap-grid">
      {columns.map(col => <div key={col.status} className="eco-roadmap-col" data-status={col.status}>
        <StatusBadge status={col.status} />
        <ul>{col.items.map(item => <li key={item}>{copy(item)}</li>)}</ul>
      </div>)}
    </div>
  </section>;
}
