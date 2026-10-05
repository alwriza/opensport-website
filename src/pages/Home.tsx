import { useDesignCopy } from "@/hooks/useDesignCopy";
import { Link, useLocation } from "react-router-dom";
import { MetricList } from "@/components/redesign/primitives";
import { KickPlayer } from "@/components/redesign/KickPlayer";
import { CameraSetup } from "@/components/redesign/CameraSetup";
import { kickData } from "@/lib/kickPose";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useState } from "react";
import { Pipeline, Roadmap, Roles, Trust } from "@/components/redesign/Ecosystem";

// The example player shown on the landing page is the demo profile, so "open the demo" shows the same numbers.
const exampleScores = { stability: 78, power: 65, technique: 82, balance: 71 };
// Illustrative four-week block ending at the demo player's current scores.
const exampleProgress = [
  { overall: 61.2, focus: "Power", from: 52, to: 52, work: "Baseline test" },
  { overall: 66.0, focus: "Power", from: 52, to: 58, work: "3 power drills" },
  { overall: 70.4, focus: "Power", from: 58, to: 63, work: "4 power drills · 2 balance drills" },
  { overall: 74.0, focus: "Balance", from: 66, to: 71, work: "3 balance drills · 1 power drill" },
];

function ProgressChart() {
  const copy = useDesignCopy();
  const [selected, setSelected] = useState(exampleProgress.length - 1);
  const x = (index: number) => 40 + index * 110;
  const y = (value: number) => 200 - (value - 55) * 7;
  const week = exampleProgress[selected];
  const change = selected ? week.overall - exampleProgress[selected - 1].overall : null;
  return <div className="journey-progress-chart">
    <svg className="journey-progress-art" fill="none" viewBox="0 0 400 240" role="group" aria-label={copy("Example progress over four weeks")}>
      <path d="M24 16V210H392" stroke="#C8C4BA" strokeWidth="1.5" />
      {[60, 70].map(value => <g key={value}>
        <path d={`M24 ${y(value)}H392`} stroke="#E4E1D9" strokeWidth="1" />
        <text x="0" y={y(value) + 4} fill="#5C5E54" fontFamily="IBM Plex Mono, monospace" fontSize="10">{value}</text>
      </g>)}
      <path d={`M${x(selected)} 16V210`} stroke="var(--pitch)" strokeDasharray="3 4" strokeWidth="1" />
      <path d={exampleProgress.map((point, index) => `${index ? "L" : "M"}${x(index)} ${y(point.overall)}`).join(" ")} stroke="var(--pitch)" strokeLinejoin="round" strokeWidth="2.2" />
      {exampleProgress.map((point, index) => <g key={point.overall} className="journey-progress-point" tabIndex={0} role="button" aria-pressed={selected === index}
        aria-label={`${copy("WK")} ${index + 1}: ${point.overall.toFixed(1)}`}
        onMouseEnter={() => setSelected(index)} onFocus={() => setSelected(index)} onClick={() => setSelected(index)}>
        <rect x={x(index) - 40} y="10" width="80" height="222" fill="transparent" />
        <circle cx={x(index)} cy={y(point.overall)} r={selected === index ? 6 : 4} fill={selected === index ? "var(--pitch)" : "#F3F1EC"} stroke="var(--pitch)" strokeWidth="1.8" />
        <text x={x(index)} y={y(point.overall) - 14} textAnchor="middle" fill="#14150F" fontFamily="IBM Plex Mono, monospace" fontSize="12">{point.overall.toFixed(1)}</text>
        <text x={x(index)} y="228" textAnchor="middle" fill={selected === index ? "#14150F" : "#5C5E54"} fontFamily="IBM Plex Mono, monospace" fontSize="10">{copy("WK")} {index + 1}</text>
      </g>)}
    </svg>
    <div className="journey-progress-detail" aria-live="polite">
      <div><span className="design-eyebrow">{copy("WK")} {selected + 1}</span><strong>{week.overall.toFixed(1)}{change != null && <small> +{change.toFixed(1)}</small>}</strong></div>
      <div><span className="design-eyebrow">{copy("Before this test")}</span><p>{copy(week.work)}</p></div>
      <div><span className="design-eyebrow">{copy(week.focus)}</span><p className="design-mono">{week.from} → {week.to}</p></div>
    </div>
  </div>;
}

export default function Home() {
  const copy = useDesignCopy();
  const { i18n } = useTranslation();
  const { user } = useCurrentUser();
  const { pathname } = useLocation();
  const isDemo = pathname.startsWith("/demo");
  const startPath = isDemo ? "/demo" : user ? "/player-dashboard" : "/register";
  const profilePath = user && !isDemo ? "/player-dashboard" : "/demo";
  const startState = user || isDemo ? { upload: Date.now() } : undefined;

  const loop = [
    { title: copy("Film"), text: copy("One kick on your phone.") },
    { title: copy("Upload"), text: copy("Pick your kicking foot.") },
    { title: copy("Analyze"), text: copy("Movement tracked frame by frame.") },
    { title: copy("Understand"), text: copy("Four scores and one priority.") },
    { title: copy("Practice"), text: copy("Drills for your weakest area.") },
    { title: copy("Retest"), text: copy("Same kick, compare the numbers.") },
  ];

  return (
    <main className="design-page landing" lang={i18n.resolvedLanguage}>
      <section className="landing-hero" id="top">
        <div className="landing-intro">
          <span className="landing-eyebrow">{copy("Football development & talent discovery")}</span>
          <h1 className="landing-title landing-title-statement">
            {copy("Turn football performance into measurable progress.")}</h1>
          <p className="landing-description">
            {copy("Record one kick on your phone. OPENsport measures your movement, shows what to improve and tracks your development over time.")}</p>
          <div className="landing-actions">
            <Link className="landing-primary-action" to={startPath} state={startState}>
              {copy("Analyze my first video")}</Link>
            <a className="landing-secondary-action" href="#example">
              {copy("See an example analysis")}</a>
          </div>
          <div className="landing-facts">
            <div className="landing-fact">
              <span className="landing-fact-value">1</span>
              <span className="landing-fact-caption">{copy("Phone is all you need")}</span>
            </div>
            <div className="landing-fact">
              <span className="landing-fact-value">&lt;60s</span>
              <span className="landing-fact-caption">{copy("Upload to report")}</span>
            </div>
            <div className="landing-fact">
              <span className="landing-fact-value">33</span>
              <span className="landing-fact-caption">{copy("Body keypoints tracked")}</span>
            </div>
          </div>
          <p className="landing-flow" aria-label={copy("The OPENsport pipeline")}>
            {[copy("Analyze"), copy("Improve"), copy("Prove"), copy("Become visible")].map((w, i) => <span key={w}>{i > 0 && <i aria-hidden="true">→</i>}<a href="#pipeline">{w}</a></span>)}
          </p>
        </div>
        <div className="landing-example">
          <KickPlayer />
          <div className="landing-report">
            <div className="landing-report-heading">
              <span className="landing-report-label">{copy("SCORES FOR THIS KICK")}</span>
              <span className="landing-report-score">{kickData.scores.overall}<span className="landing-report-scale">/100</span></span>
            </div>
            <MetricList compact scores={kickData.scores} />
          </div>
        </div>
      </section>

      <section className="journey-loop" id="how" aria-labelledby="how-title">
        <h2 className="landing-roadmap-title" id="how-title">{copy("Three minutes,")} {copy("start to finish")}</h2>
        <ol className="journey-flow">
          {loop.map((step, index) => <li key={step.title}>
            <span className="journey-flow-dot" aria-hidden="true">{index + 1}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>)}
        </ol>
      </section>

      <section className="journey-first" id="first-test" aria-labelledby="first-test-title">
        <div className="journey-first-intro">
          <span className="design-eyebrow">{copy("How to film")}</span>
          <h2 className="landing-roadmap-title" id="first-test-title">{copy("Move the phone. See what the camera sees.")}</h2>
          <p>{copy("Any angle works; the side view is the most accurate. The figure is a real kick from our dataset.")}</p>
        </div>
        <CameraSetup />
        <div className="journey-first-body">
          <dl className="journey-specs">
            <div><dt>{copy("One kick")}</dt><dd>{copy("5–15 seconds, your usual foot")}</dd></div>
            <div><dt>{copy("File")}</dt><dd>{copy("MP4, MOV, AVI or MKV, up to 50 MB")}</dd></div>
            <div><dt>{copy("Result")}</dt><dd>{copy("Scores and drills in under a minute")}</dd></div>
          </dl>
          <p className="journey-honest">{copy("OPENsport currently analyses kicking technique. Other skills are not scored yet, so we do not ask you to film them.")}</p>
        </div>
      </section>

      <section className="journey-example" id="example" aria-labelledby="example-title">
        <div className="landing-science-intro">
          <span className="landing-science-eyebrow">{copy("Example analysis")}</span>
          <h2 className="landing-science-title" id="example-title">{copy("This is what")}<br />{copy("you get back")}</h2>
          <p className="landing-science-description">{copy("This number is your starting point, not a verdict. Every next test is compared with it.")}</p>
          <Link className="landing-primary-action journey-example-action" to={startPath} state={startState}>{copy("Analyze my first video")}</Link>
        </div>
        <div className="journey-report">
          <div className="journey-report-head">
            <div>
              <span className="landing-report-label">{copy("YOUR FIRST PERFORMANCE BASELINE")}</span>
              <span className="journey-report-score">74<small>/100</small></span>
            </div>
            <span className="landing-report-label">IMG_5141.MP4</span>
          </div>
          <MetricList compact scores={exampleScores} />
          <div className="journey-report-priority">
            <span className="journey-report-tag">{copy("Your priority: Power")}</span>
            <p>{copy("Power is your lowest score right now, so it is the best place to start.")}</p>
          </div>
          <div className="journey-report-next">
            <span className="landing-report-label">{copy("RECOMMENDED NEXT STEP")}</span>
            <p>{copy("Complete 3 power drills → film the same kick again → compare with this baseline.")}</p>
          </div>
        </div>
      </section>

      <section className="journey-progress" aria-labelledby="progress-title">
        <div className="journey-progress-copy">
          <span className="design-eyebrow">{copy("Why come back")}</span>
          <h2 className="landing-roadmap-title" id="progress-title">{copy("One score is a test. A score every week is progress.")}</h2>
          <p>{copy("Each retest is compared with your baseline, so you can see whether training works and what to work on next.")}</p>
        </div>
        <ProgressChart />
      </section>

      <Pipeline profilePath={profilePath} />

      <Roles startPath={startPath} startState={startState} />

      <Trust />

      <Roadmap />

      <section className="journey-mission" id="mission" aria-labelledby="mission-title">
        <span className="design-eyebrow">{copy("A scout")} {copy("for every")} {copy("auyl")}</span>
        <h2 className="journey-mission-title" id="mission-title">{copy("Talent can exist anywhere.")}<br />{copy("Opportunity should too.")}</h2>
        <ul className="eco-barriers">
          <li><strong>{copy("Geography")}</strong>{copy("Players outside big academy networks are hard to see.")}</li>
          <li><strong>{copy("Access")}</strong>{copy("Professional evaluation is not available to everyone.")}</li>
          <li><strong>{copy("Networks")}</strong>{copy("Big decisions rest on limited viewing and who you know.")}</li>
        </ul>
        <Link className="landing-audience-link" to="/about">{copy("Our method and roadmap →")}</Link>
      </section>

      <section className="landing-cta">
        <div className="landing-cta-copy">
          <h2 className="landing-cta-title">
            {copy("Film it today.")}<br />
            {copy("Know by tonight.")}</h2>
          <p className="landing-cta-description">
            {copy("Any phone. Any pitch. No sensors, no studio.")}</p>
        </div>
        <div className="landing-cta-actions">
          <Link className="landing-cta-primary" to={startPath} state={startState}>{copy("Analyze my first video")}</Link>
          <div className="landing-cta-roles">
            <Link to="/demo/coach-dashboard">{copy("Coach: see a player report")}</Link>
            <Link to="/demo/ranking">{copy("Scout: how search works")}</Link>
            <a href="mailto:contact@opensport.app?subject=League%20pilot">{copy("Academy or league: book a pilot")}</a>
          </div>
        </div>
      </section>
    </main>
  );
}
