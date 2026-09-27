import { useDesignCopy } from "@/hooks/useDesignCopy";
import { Link, useLocation } from "react-router-dom";
import { MetricList, PoseFigure } from "@/components/redesign/primitives";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function Home() {
  const copy = useDesignCopy();
  const { i18n } = useTranslation();
  const { user } = useCurrentUser();
  const { pathname, hash } = useLocation();
  const playerPath = pathname.startsWith("/demo") ? "/demo" : user ? "/player-dashboard" : "/login";
  const profilePath = user && !pathname.startsWith("/demo") ? "/player-dashboard" : "/demo";
  const [audience, setAudience] = useState(hash === "#clubs" ? "leagues" : "players");

  return (
    <main className="design-page landing" lang={i18n.resolvedLanguage}>
      <section className="landing-hero" id="mission">
        <div className="landing-intro">
          <span className="landing-eyebrow">
            {copy("Smartphone video → biomechanical score")}</span>
          <h1 className="landing-title">
            {copy("A scout")}<br />
            {copy("for every")}<br />
            {copy("auyl")}</h1>
          <p className="landing-description">
            {copy("Most players in Kazakhstan never get seen by anyone who can judge them. Film one kick on a phone, get the same technique breakdown an academy would give you — in under a minute, with no equipment and no gatekeeper.")}</p>
          <div className="landing-actions">
            <Link className="landing-primary-action" to={playerPath} state={{ upload: Date.now() }}>
              {copy("Analyse a video")}</Link>
            <a className="landing-secondary-action" href="#clubs" onClick={() => setAudience("leagues")}>
              {copy("For leagues & academies")}</a>
          </div>
          <div className="landing-facts">
            <div className="landing-fact">
              <span className="landing-fact-value">
                600+
              </span>
              <span className="landing-fact-caption">
                {copy("Labelled kick videos")}</span>
            </div>
            <div className="landing-fact">
              <span className="landing-fact-value">
                &lt;60s
              </span>
              <span className="landing-fact-caption">
                {copy("Upload to report")}</span>
            </div>
            <div className="landing-fact">
              <span className="landing-fact-value">
                54
              </span>
              <span className="landing-fact-caption">
                {copy("Players ranked so far")}</span>
            </div>
            <div className="landing-fact">
              <span className="landing-fact-value">
                0₸
              </span>
              <span className="landing-fact-caption">
                {copy("Hardware required")}</span>
            </div>
          </div>
        </div>
        <div className="landing-example">
          <div className="landing-frame">
            <PoseFigure highlight />
            <span className="landing-frame-label">
              IMG_5141.MP4 · CONTACT FRAME 0:42
            </span>
            <span className="landing-frame-angle">
              KNEE 155° · SUPPORT LEG 12°
            </span>
            <span className="landing-frame-keypoints">
              33 KEYPOINTS TRACKED · CPU ONLY
            </span>
          </div>
          <div className="landing-report">
            <div className="landing-report-heading">
              <span className="landing-report-label">
                {copy("GENERATED REPORT")}</span>
              <span className="landing-report-score">
                36.3
                <span className="landing-report-scale">
                  /100
                </span>
              </span>
            </div>
            <MetricList compact scores={{ stability: 35.5, power: 37.2, technique: 35.6, balance: 36.9 }} />
          </div>
        </div>
      </section>
      <section className="landing-how" id="how">
        <div className="landing-section-heading">
          <h2 className="landing-how-title">
            {copy("Three minutes,")}<br />
            {copy("start to finish")}</h2>
          <span className="landing-how-caption">
            {copy("NO SENSORS · NO STUDIO · NO COACH REQUIRED")}</span>
        </div>
        <div className="landing-step">
          <span className="landing-step-number">
            01
          </span>
          <div className="landing-step-copy">
            <h3 className="landing-step-title">
              {copy("Film one kick from the side")}</h3>
            <p className="landing-step-description">
              {copy("Any phone, any pitch, any light. Stand at 90 degrees, keep the whole body in frame, hit record. That is the entire hardware requirement.")}</p>
          </div>
          <div className="landing-step-art">
            <svg aria-hidden="true" fill="none" height="120" viewBox="0 0 220 120" width="220">
              <rect height="72" stroke="#C8C4BA" strokeWidth="1.5" width="46" x="1" y="26" />
              <circle cx="24" cy="62" r="7" stroke="#5C5E54" strokeWidth="1.5" />
              <path d="M56 62 H150" stroke="#C8C4BA" strokeDasharray="5 5" strokeWidth="1.5" />
              <path d="M150 34 V90" stroke="var(--pitch)" strokeWidth="1.5" />
              <path d="M138 48 L150 62 L138 76" stroke="var(--pitch)" strokeWidth="1.5" />
              <text fill="#5C5E54" fontFamily="IBM Plex Mono, monospace" fontSize="11" x="96" y="52">
                90°
              </text>
              <path d="M176 22 L174 56 M174 56 L162 88 M174 56 L196 78 M176 32 L158 50 M176 32 L196 44" stroke="#5C5E54" strokeLinecap="round" strokeWidth="1.6" />
              <circle cx="176" cy="16" r="6" stroke="#5C5E54" strokeWidth="1.6" />
            </svg>
          </div>
        </div>
        <div className="landing-step">
          <span className="landing-step-number">
            02
          </span>
          <div className="landing-step-copy">
            <h3 className="landing-step-title">
              {copy("33 joints, frame by frame")}</h3>
            <p className="landing-step-description">
              {copy("Pose estimation tracks every joint through the strike, finds the contact frame, and measures the angles that coaches actually look at — not a vibe, a number you can argue with.")}</p>
          </div>
          <div className="landing-step-art">
            <svg aria-hidden="true" fill="none" height="120" viewBox="0 0 220 120" width="220">
              <path d="M12 14 V106 M12 106 H208" stroke="#C8C4BA" strokeWidth="1.5" />
              <path d="M24 88 L52 74 L80 82 L108 44 L136 30 L164 52 L192 40" stroke="var(--pitch)" strokeLinejoin="round" strokeWidth="2" />
              <circle cx="136" cy="30" fill="var(--pitch)" r="4.5" />
              <path d="M136 30 V106" stroke="var(--pitch)" strokeDasharray="4 4" strokeWidth="1.2" />
              <text fill="#5C5E54" fontFamily="IBM Plex Mono, monospace" fontSize="10" x="142" y="24">
                {copy("CONTACT")}</text>
            </svg>
          </div>
        </div>
        <div className="landing-step">
          <span className="landing-step-number">
            03
          </span>
          <div className="landing-step-copy">
            <h3 className="landing-step-title">
              {copy("A score, and what to fix")}</h3>
            <p className="landing-step-description">
              {copy("Four sub-scores, a place in the national ranking, and the two or three drills that move the weakest one. Film again next week and watch the number move.")}</p>
          </div>
          <div className="landing-step-result">
            <span className="landing-step-score">
              36.3
            </span>
            <svg aria-hidden="true" fill="none" height="60" viewBox="0 0 90 60" width="90">
              <path d="M4 48 L26 42 L48 30 L70 18 L86 8" stroke="var(--pitch)" strokeLinejoin="round" strokeWidth="2" />
              <circle cx="86" cy="8" fill="var(--pitch)" r="4" />
            </svg>
          </div>
        </div>
      </section>
      <section className="landing-science" id="science">
        <div className="landing-science-intro">
          <span className="landing-science-eyebrow">
            {copy("The method")}</span>
          <h2 className="landing-science-title">
            {copy("Not a")}<br />
            {copy("black box")}</h2>
          <p className="landing-science-description">
            {copy("Every number traces back to published sports-science literature and to a deterministic scorer we can show you. If a coach disagrees with a score, we can point at the frame and the angle that produced it.")}</p>
          <a className="landing-science-link" href="mailto:contact@opensport.app?subject=CACRE%202026%20preprint">
            {copy("Read the CACRE 2026 preprint →")}</a>
        </div>
        <div className="landing-science-metrics">
          <div className="landing-science-metric">
            <span className="landing-science-angle">
              155°
            </span>
            <div className="landing-science-copy">
              <span className="landing-science-metric-title">
                {copy("Knee angle at impact")}</span>
              <span className="landing-science-metric-description">
                {copy("The extension target a strike is measured against, taken from the kinematics literature rather than from a guess.")}</span>
            </div>
          </div>
          <div className="landing-science-metric">
            <span className="landing-science-marker">
              {copy("HIP→FOOT")}</span>
            <div className="landing-science-copy">
              <span className="landing-science-metric-title">
                {copy("Proximal-to-distal sequencing")}</span>
              <span className="landing-science-metric-description">
                {copy("The order in which hip, knee and ankle fire is what separates a trained strike from a strong one. It is the heaviest weight in the score.")}</span>
            </div>
          </div>
          <div className="landing-science-metric-last">
            <span className="landing-science-marker">
              {copy("ANY ANGLE")}</span>
            <div className="landing-science-copy">
              <span className="landing-science-metric-title">
                {copy("Trained to survive a bad camera position")}</span>
              <span className="landing-science-metric-description">
                {copy("Ground truth is computed on clean side-view footage and projected onto the same kick filmed from other angles, so the model learns the movement instead of the viewpoint.")}</span>
            </div>
          </div>
        </div>
      </section>
      <section className="landing-roadmap" id="roadmap" aria-labelledby="roadmap-title">
        <div className="landing-roadmap-heading">
          <span className="landing-roadmap-date">
            {copy("UPDATED SEP 2026")}</span>
          <h2 className="landing-roadmap-title" id="roadmap-title">
            {copy("Where we are")}</h2>
          <p className="landing-roadmap-intro">
            {copy("Kick analysis is live. Full-match analysis is next.")}</p>
          <div className="landing-roadmap-proof">
            <strong>600+</strong>
            <span>{copy("Labelled kick videos")}<br />{copy("Collected in Kazakhstan")}</span>
          </div>
        </div>
        <ol className="landing-roadmap-items">
          <li className="landing-roadmap-item">
            <span className="landing-roadmap-status" data-stage="shipped">{copy("Live now")}</span>
            <div className="landing-roadmap-copy">
              <h3 className="landing-roadmap-item-title">{copy("Kick analysis")}</h3>
              <p className="landing-roadmap-description">{copy("A phone video becomes a technique score and a clear breakdown.")}</p>
            </div>
          </li>
          <li className="landing-roadmap-item" data-stage="active">
            <span className="landing-roadmap-status" data-stage="active">{copy("In progress")}</span>
            <div className="landing-roadmap-copy">
              <h3 className="landing-roadmap-item-title">{copy("v2.0 — full match")}</h3>
              <p className="landing-roadmap-description">{copy("Tracking multiple players throughout a match.")}</p>
            </div>
          </li>
          <li className="landing-roadmap-item">
            <span className="landing-roadmap-status">{copy("Up next")}</span>
            <div className="landing-roadmap-copy">
              <h3 className="landing-roadmap-item-title">{copy("League-scale processing")}</h3>
              <p className="landing-roadmap-description">{copy("Batch match analysis, with data stored in Kazakhstan.")}</p>
            </div>
          </li>
        </ol>
      </section>
      <section className="landing-audience" id="clubs" aria-labelledby="audience-title">
        <h2 className="landing-audience-heading" id="audience-title">{copy("Your game. Your view.")}</h2>
        <Tabs value={audience} onValueChange={setAudience} className="landing-audience-tabs">
          <TabsList className="landing-audience-options" aria-label={copy("Choose your role")}>
            <TabsTrigger className="landing-audience-option" value="players">{copy("Players")}</TabsTrigger>
            <TabsTrigger className="landing-audience-option" value="coaches">{copy("Coaches")}</TabsTrigger>
            <TabsTrigger className="landing-audience-option" value="leagues">{copy("Leagues")}</TabsTrigger>
          </TabsList>
          <TabsContent className="landing-audience-panel" value="players">
            <h3 className="landing-audience-title">{copy("Proof you can send")}</h3>
            <div className="landing-audience-copy">
              <p className="landing-audience-description">{copy("Your score, progress and videos in one profile. Share it with a coach.")}</p>
              <Link className="landing-audience-link" to={profilePath}>{copy("See a player profile →")}</Link>
            </div>
          </TabsContent>
          <TabsContent className="landing-audience-panel" value="coaches">
            <h3 className="landing-audience-title">{copy("One squad, one page")}</h3>
            <div className="landing-audience-copy">
              <p className="landing-audience-description">{copy("Compare technique, follow progress and see who needs your attention.")}</p>
              <Link className="landing-audience-link" to="/demo/coach-dashboard">{copy("See the coach view →")}</Link>
            </div>
          </TabsContent>
          <TabsContent className="landing-audience-panel" value="leagues">
            <h3 className="landing-audience-title">{copy("A talent map of the country")}</h3>
            <div className="landing-audience-copy">
              <p className="landing-audience-description">{copy("Compare players across clubs. Find talent beyond the usual scouting routes.")}</p>
              <a className="landing-audience-link" href="mailto:contact@opensport.app?subject=League%20pilot">{copy("Talk about a pilot →")}</a>
            </div>
          </TabsContent>
        </Tabs>
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
          <Link className="landing-cta-primary" to={playerPath} state={{ upload: Date.now() }}>
            {copy("Analyse a video")}</Link>
          <a className="landing-cta-secondary" href="mailto:contact@opensport.app?subject=League%20pilot">
            {copy("Book a league pilot")}</a>
        </div>
      </section>
    </main>
  );
}
