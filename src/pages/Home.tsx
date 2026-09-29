import { useDesignCopy } from "@/hooks/useDesignCopy";
import { Link, useLocation } from "react-router-dom";
import { MetricList } from "@/components/redesign/primitives";
import { KickPlayer } from "@/components/redesign/KickPlayer";
import { CameraSetup } from "@/components/redesign/CameraSetup";
import { kickData } from "@/lib/kickPose";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

// The example player shown on the landing page is the demo profile, so "open the demo" shows the same numbers.
const exampleScores = { stability: 78, power: 65, technique: 82, balance: 71 };
// Illustrative four-week block ending at the demo player's current scores.
const exampleProgress = [
  { overall: 61.2, focus: "Power", from: 52, to: 52, work: "Baseline test" },
  { overall: 66.0, focus: "Power", from: 52, to: 58, work: "3 power drills" },
  { overall: 70.4, focus: "Power", from: 58, to: 63, work: "4 power drills · 2 balance drills" },
  { overall: 74.0, focus: "Balance", from: 66, to: 71, work: "3 balance drills · 1 power drill" },
];

function LoopArt({ step }: { step: number }) {
  const line = { stroke: "#C8C4BA", strokeWidth: 1.5 };
  const accent = { stroke: "var(--pitch)", strokeWidth: 1.8 };
  return <svg aria-hidden="true" className="journey-loop-art" fill="none" viewBox="0 0 160 96">
    {step === 0 && <>
      <rect x="10" y="22" width="30" height="54" {...line} />
      <circle cx="25" cy="49" r="6" {...accent} />
      <path d="M46 49H104" stroke="#C8C4BA" strokeDasharray="5 5" strokeWidth="1.5" />
      <path d="M126 16 124 46M124 46 114 74M124 46 138 66M126 26 112 38M126 26 140 34" stroke="#5C5E54" strokeLinecap="round" strokeWidth="1.6" />
      <circle cx="127" cy="11" r="5" stroke="#5C5E54" strokeWidth="1.6" />
      <circle cx="146" cy="76" r="5" {...accent} />
      <text x="62" y="42" fill="#5C5E54" fontFamily="IBM Plex Mono, monospace" fontSize="10">90°</text>
    </>}
    {step === 1 && <>
      <rect x="44" y="10" width="72" height="54" {...line} />
      <path d="M80 52V22M68 34 80 22 92 34" {...accent} />
      <path d="M44 80H116" stroke="#E0DCD2" strokeWidth="3" />
      <path d="M44 80H96" stroke="var(--pitch)" strokeWidth="3" />
      <text x="44" y="94" fill="#5C5E54" fontFamily="IBM Plex Mono, monospace" fontSize="9">KICK.MP4 · 12 MB</text>
    </>}
    {step === 2 && [0.78, 0.65, 0.82, 0.71].map((value, index) => <g key={index}>
      <path d={`M10 ${18 + index * 20}H150`} stroke="#E0DCD2" strokeWidth="3" />
      <path d={`M10 ${18 + index * 20}H${10 + 140 * value}`} stroke={index === 1 ? "#A13B18" : "var(--pitch)"} strokeWidth="3" />
    </g>)}
    {step === 3 && [0, 1, 2].map(index => <g key={index}>
      <path d={`M10 ${14 + index * 28}H150`} {...line} />
      <rect x="10" y={20 + index * 28} width="10" height="10" stroke="var(--pitch)" strokeWidth="1.5" fill={index === 0 ? "var(--pitch)" : "none"} />
      <path d={`M30 ${25 + index * 28}H${index === 1 ? 118 : 132}`} stroke="#5C5E54" strokeWidth="1.5" />
    </g>)}
    {step === 4 && <>
      <path d="M10 10V86H152" {...line} />
      <path d="M18 74 56 60 94 46 140 24" stroke="var(--pitch)" strokeLinejoin="round" strokeWidth="2" />
      {[[18, 74], [56, 60], [94, 46]].map(([cx, cy]) => <circle key={cx} cx={cx} cy={cy} r="3.5" fill="#F3F1EC" stroke="var(--pitch)" strokeWidth="1.5" />)}
      <circle cx="140" cy="24" r="4.5" fill="var(--pitch)" />
    </>}
  </svg>;
}

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
  const { pathname, hash } = useLocation();
  const isDemo = pathname.startsWith("/demo");
  const startPath = isDemo ? "/demo" : user ? "/player-dashboard" : "/register";
  const profilePath = user && !isDemo ? "/player-dashboard" : "/demo";
  const [audience, setAudience] = useState(hash === "#clubs" ? "scouts" : "players");

  const loop = [
    { title: copy("Record"), text: copy("Film one kick from any angle. Any phone works.") },
    { title: copy("Upload"), text: copy("Send the clip and tell us which foot you kick with.") },
    { title: copy("Analyse"), text: copy("Under a minute later: four scores out of 100.") },
    { title: copy("Train"), text: copy("Drills chosen for your weakest area.") },
    { title: copy("Retest"), text: copy("Film the same kick again and see what changed.") },
  ];
  const outputs = [
    { value: "74", unit: "/100", title: copy("Performance score"), text: copy("Technique, power, stability and balance, each scored from 0 to 100.") },
    { value: copy("POWER"), unit: "65", title: copy("What to improve"), text: copy("Your lowest score is named plainly, so you know where to start.") },
    { value: "3", unit: copy("drills"), title: copy("Training plan"), text: copy("Exercises picked around your weakest area, with video and time needed.") },
    { value: "+12.8", unit: copy("pts"), title: copy("Player profile"), text: copy("Every test builds a measurable profile you can share with coaches and scouts.") },
  ];
  const pipeline = [
    { marker: copy("MATCH"), status: "beta", title: copy("Upload a match video"), text: copy("One static camera with the whole pitch in view. The video goes straight from your browser to private storage.") },
    { marker: copy("TRACKING"), status: "beta", title: copy("Every player on a 2D pitch map"), text: copy("Players, referees and the ball are detected, tracked and split into teams automatically. Replay the match as a minimap next to the video.") },
    { marker: copy("TEAM DATA"), status: "beta", title: copy("Distance, speed, heatmaps, pitch control, possession"), text: copy("Team totals first, individual tracks second. We always show how much of the match could be measured, so you know which numbers to trust.") },
    { marker: copy("TECHNIQUE"), status: "live", title: copy("Individual kick analysis"), text: copy("Each player films their kicks. Four scores per kick, comparable across the whole squad.") },
    { marker: copy("TRAINING"), status: "live", title: copy("Plans for the team, a group or one player"), text: copy("Build sessions around the weaknesses the data shows, and assign them in the same workspace.") },
    { marker: copy("PROGRESS"), status: "live", title: copy("Squad development over the season"), text: copy("Statistics, evaluations and retests in one place. See who is improving and who needs your attention.") },
  ];

  return (
    <main className="design-page landing" lang={i18n.resolvedLanguage}>
      <section className="landing-hero" id="top">
        <div className="landing-intro">
          <span className="landing-eyebrow">{copy("For football players · Free during the pilot")}</span>
          <h1 className="landing-title">
            {copy("Film a kick.")}<br />
            {copy("Get a plan.")}<br />
            {copy("Get seen.")}</h1>
          <p className="landing-description">
            {copy("Record one kick on your phone, from any angle. OPENsport scores your technique, power, stability and balance, shows what to improve first and gives you drills for it. Retest, watch your numbers move, and build a profile coaches and scouts can see.")}</p>
          <div className="landing-actions">
            <Link className="landing-primary-action" to={startPath} state={user || isDemo ? { upload: Date.now() } : undefined}>
              {copy("Analyse my first kick")}</Link>
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
              <span className="landing-fact-value">4</span>
              <span className="landing-fact-caption">{copy("Scores per kick")}</span>
            </div>
            <div className="landing-fact">
              <span className="landing-fact-value">0₸</span>
              <span className="landing-fact-caption">{copy("Free during the pilot")}</span>
            </div>
          </div>
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

      <section className="journey-loop" id="how">
        <div className="landing-section-heading">
          <h2 className="landing-how-title">{copy("One loop,")}<br />{copy("every week")}</h2>
          <span className="landing-how-caption">{copy("RECORD → ANALYSE → TRAIN → RETEST → GET SEEN")}</span>
        </div>
        <ol className="journey-loop-steps">
          {loop.map((step, index) => <li className="journey-loop-step" key={step.title}>
            <span className="journey-loop-number">0{index + 1}</span>
            <LoopArt step={index} />
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>)}
        </ol>
        <p className="journey-loop-footnote">{copy("Every result is saved to your player profile, so each week adds to the proof of what you can do.")}</p>
      </section>

      <section className="journey-first" id="first-test" aria-labelledby="first-test-title">
        <div className="journey-first-intro">
          <span className="design-eyebrow">{copy("What do I need to do?")}</span>
          <h2 className="landing-roadmap-title" id="first-test-title">{copy("Your first test takes five minutes")}</h2>
          <p>{copy("The analysis works from any camera angle. From the side it is the most accurate, because every joint angle is visible. Try it here: move the phone and watch what the camera sees. The figure is a real kick from our dataset.")}</p>
        </div>
        <CameraSetup />
        <div className="journey-first-body">
          <ol className="journey-checklist">
            <li><span>01</span><div><h3>{copy("Set up the phone")}</h3><p>{copy("Any angle works; from the side is the most accurate. Hip height, 3–5 metres away, in landscape. Your whole body and the ball must be in frame.")}</p></div></li>
            <li><span>02</span><div><h3>{copy("Record one kick")}</h3><p>{copy("A shot or a penalty with your usual foot. One kick per clip, 5–15 seconds long.")}</p></div></li>
            <li><span>03</span><div><h3>{copy("Upload the clip")}</h3><p>{copy("MP4, MOV, AVI or MKV, up to 50 MB. Tell us the camera angle and your kicking foot.")}</p></div></li>
            <li><span>04</span><div><h3>{copy("Read your report")}</h3><p>{copy("In under a minute: your scores, your weakest area and the drills to start with.")}</p></div></li>
          </ol>
          <p className="journey-honest"><span className="landing-roadmap-status" data-stage="shipped">{copy("Live now")}</span>{copy("OPENsport currently analyses kicking technique. Other skills are not scored yet, so we do not ask you to film them.")}</p>
          <Link className="design-button journey-first-action" to={startPath} state={user || isDemo ? { upload: Date.now() } : undefined}>{copy("Start my first test")}</Link>
        </div>
      </section>

      <section className="journey-outputs" aria-labelledby="outputs-title">
        <div className="landing-section-heading">
          <h2 className="landing-roadmap-title" id="outputs-title">{copy("What you get back")}</h2>
          <span className="landing-how-caption">{copy("AFTER EVERY UPLOAD")}</span>
        </div>
        <div className="journey-outputs-grid">
          {outputs.map(output => <div className="journey-output" key={output.title}>
            <strong>{output.value}<small>{output.unit}</small></strong>
            <h3>{output.title}</h3>
            <p>{output.text}</p>
          </div>)}
        </div>
      </section>

      <section className="journey-example" id="example" aria-labelledby="example-title">
        <div className="landing-science-intro">
          <span className="landing-science-eyebrow">{copy("Example analysis")}</span>
          <h2 className="landing-science-title" id="example-title">{copy("This is what")}<br />{copy("you get back")}</h2>
          <p className="landing-science-description">{copy("A real report layout for our demo player. The number on top is not a verdict. It is your baseline: the point every next test is compared with.")}</p>
          <Link className="landing-science-link" to="/demo">{copy("Open the demo player profile →")}</Link>
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
            <p><strong>65 / 100.</strong> {copy("Power is your lowest score right now, so it is the best place to start.")}</p>
          </div>
          <div className="journey-report-next">
            <span className="landing-report-label">{copy("RECOMMENDED NEXT STEP")}</span>
            <p>{copy("Complete 3 power drills → film the same kick again → compare with this baseline.")}</p>
          </div>
        </div>
      </section>

      <section className="journey-progress" aria-labelledby="progress-title">
        <div className="journey-progress-copy">
          <span className="design-eyebrow">{copy("Train → retest → improve")}</span>
          <h2 className="landing-roadmap-title" id="progress-title">{copy("One score is a test. A score every week is progress.")}</h2>
          <p>{copy("OPENsport is not a one-off AI score. Each retest is compared with your baseline, so you can see whether your training actually works, and which area to work on next.")}</p>
          <div className="journey-progress-stat">
            <strong>+12.8</strong>
            <span>{copy("Overall score in 4 weeks")}<br />{copy("Example player, same camera angle")}</span>
          </div>
        </div>
        <ProgressChart />
      </section>

      <section className="journey-profile" aria-labelledby="profile-title">
        <div className="journey-profile-copy">
          <span className="design-eyebrow">{copy("Your player profile")}</span>
          <h2 className="landing-roadmap-title" id="profile-title">{copy("Your progress becomes your opportunity")}</h2>
          <p>{copy("Every analysis is added to your OPENsport player profile. Share the link with a coach, and appear in the national ranking. Players build proof of their ability. Scouts can find it.")}</p>
          <div className="journey-scout-flow">
            <span className="design-eyebrow">{copy("How scouts use it")}</span>
            <ol>
              <li>{copy("Search")}</li>
              <li>{copy("Compare")}</li>
              <li>{copy("Watch the kicks")}</li>
              <li>{copy("Get in touch")}</li>
            </ol>
          </div>
          <Link className="landing-audience-link" to="/demo">{copy("See a player profile →")}</Link>
        </div>
        <div className="journey-profile-card" aria-label={copy("Example player profile")}>
          <div className="journey-profile-card-head">
            <span className="design-eyebrow">{copy("OPENsport player profile")}</span>
            <h3>{copy("Example player")}</h3>
            <div className="journey-tags"><span>{copy("Forward")}</span><span>{copy("17 years")}</span><span>{copy("Right foot")}</span><span>{copy("Almaty")}</span></div>
          </div>
          <dl className="journey-profile-stats">
            <div><dt>{copy("Overall")}</dt><dd>74.0</dd></div>
            <div><dt>{copy("Progress")}</dt><dd className="journey-positive">+12.8</dd></div>
            <div><dt>{copy("Tests")}</dt><dd>4</dd></div>
            <div><dt>{copy("Videos")}</dt><dd>4</dd></div>
          </dl>
          <MetricList scores={exampleScores} />
        </div>
      </section>

      <section className="landing-audience" id="clubs" aria-labelledby="audience-title">
        <h2 className="landing-audience-heading" id="audience-title">{copy("Who is OPENsport for?")}</h2>
        <Tabs value={audience} onValueChange={setAudience} className="landing-audience-tabs">
          <TabsList className="landing-audience-options" aria-label={copy("Choose your role")}>
            <TabsTrigger className="landing-audience-option" value="players">{copy("I'm a player")}</TabsTrigger>
            <TabsTrigger className="landing-audience-option" value="coaches">{copy("I'm a coach")}</TabsTrigger>
            <TabsTrigger className="landing-audience-option" value="scouts">{copy("Scout or club")}</TabsTrigger>
          </TabsList>
          <TabsContent className="landing-audience-panel" value="players">
            <div className="journey-audience-heading">
              <span className="journey-audience-flow">{copy("ANALYSE → IMPROVE → BUILD PROFILE")}</span>
              <h3 className="landing-audience-title">{copy("Know what to fix, and prove you fixed it")}</h3>
            </div>
            <div className="landing-audience-copy">
              <p className="landing-audience-description">{copy("Film a kick, get your scores and your weakest area, train it, retest. Your profile keeps the record.")}</p>
              <Link className="landing-audience-link" to={startPath} state={user || isDemo ? { upload: Date.now() } : undefined}>{copy("Analyse my first kick →")}</Link>
            </div>
          </TabsContent>
          <TabsContent className="landing-audience-panel" value="coaches">
            <div className="journey-audience-heading">
              <span className="journey-audience-flow">{copy("MATCH → TRACKING → TEAM DATA → TECHNIQUE → TRAINING → PROGRESS")}</span>
              <h3 className="landing-audience-title">{copy("The full pipeline in one workspace")}</h3>
            </div>
            <div className="landing-audience-copy">
              <p className="landing-audience-description">{copy("From a match video to team numbers, individual technique reports, training plans and each player's development.")}</p>
              <a className="landing-audience-link" href="#coaches">{copy("See the coach pipeline ↓")}</a>
            </div>
          </TabsContent>
          <TabsContent className="landing-audience-panel" value="scouts">
            <div className="journey-audience-heading">
              <span className="journey-audience-flow">{copy("SEARCH → COMPARE → WATCH → CONTACT")}</span>
              <h3 className="landing-audience-title">{copy("Find players beyond the usual routes")}</h3>
            </div>
            <div className="landing-audience-copy">
              <p className="landing-audience-description">{copy("Compare players across clubs and cities by measured technique and progress, with the video behind every score.")}</p>
              <a className="landing-audience-link" href="mailto:contact@opensport.app?subject=League%20pilot">{copy("Talk about a pilot →")}</a>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <section className="journey-coaches" id="coaches" aria-labelledby="coaches-title">
        <div className="landing-science-intro">
          <span className="landing-science-eyebrow">{copy("For coaches & academies")}</span>
          <h2 className="landing-science-title" id="coaches-title">{copy("From match video")}<br />{copy("to training plan")}</h2>
          <p className="landing-science-description">{copy("Players get a score. Coaches get the full pipeline: film a match and your players' kicks, and OPENsport turns them into team numbers, individual technique reports, training plans and a record of how every player develops.")}</p>
          <div className="journey-coaches-actions">
            <Link className="landing-primary-action" to="/demo/coach-dashboard">{copy("Open the coach demo")}</Link>
            <a className="landing-secondary-action" href="mailto:contact@opensport.app?subject=Club%20pilot">{copy("Book a club pilot")}</a>
          </div>
        </div>
        <ol className="journey-pipeline">
          {pipeline.map((stage, index) => <li className="journey-pipeline-stage" key={stage.marker}>
            <span className="journey-pipeline-marker">0{index + 1}<br />{stage.marker}</span>
            <div className="landing-science-copy">
              <span className="journey-pipeline-status" data-stage={stage.status}>{stage.status === "live" ? copy("Live") : copy("Beta")}</span>
              <span className="landing-science-metric-title">{stage.title}</span>
              <span className="landing-science-metric-description">{stage.text}</span>
            </div>
          </li>)}
        </ol>
      </section>

      <section className="journey-mission" id="mission" aria-labelledby="mission-title">
        <span className="design-eyebrow">{copy("Why we build this")}</span>
        <h2 className="landing-roadmap-title" id="mission-title">{copy("A scout")} {copy("for every")} {copy("auyl")}</h2>
        <p>{copy("Traditional scouting stops at geography, access and opinion. OPENsport measures any player with a phone, so talent in a small town gets the same chance to be seen as talent in an academy.")}</p>
        <Link className="landing-audience-link" to="/about">{copy("Our method and roadmap →")}</Link>
      </section>

      <section className="landing-cta">
        <div className="landing-cta-copy">
          <h2 className="landing-cta-title">
            {copy("Film it today.")}<br />
            {copy("Know by tonight.")}</h2>
          <p className="landing-cta-description">
            {copy("Free while we are in pilot. No card, no equipment, no waiting list.")}</p>
        </div>
        <div className="landing-cta-actions">
          <Link className="landing-cta-primary" to={startPath} state={user || isDemo ? { upload: Date.now() } : undefined}>
            {copy("Analyse my first kick")}</Link>
          <a className="landing-cta-secondary" href="mailto:contact@opensport.app?subject=Club%20pilot">
            {copy("Book a club pilot")}</a>
        </div>
      </section>
    </main>
  );
}
