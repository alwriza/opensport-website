import { useDesignCopy } from "@/hooks/useDesignCopy";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function About() {
  const copy = useDesignCopy();
  const { i18n } = useTranslation();

  return (
    <main className="design-page landing" lang={i18n.resolvedLanguage}>
      <section className="journey-about-hero" id="mission">
        <span className="landing-eyebrow">{copy("About OPENsport")}</span>
        <h1 className="landing-title">
          {copy("A scout")}<br />
          {copy("for every")}<br />
          {copy("auyl")}</h1>
        <p className="landing-description">
          {copy("Most players in Kazakhstan never get seen by anyone who can judge them. Traditional scouting stops at geography, access and opinion. We measure football technique from a phone video, so any player can build proof of what they can do.")}</p>
        <div className="landing-facts">
          <div className="landing-fact">
            <span className="landing-fact-value">600+</span>
            <span className="landing-fact-caption">{copy("Labelled kick videos")}</span>
          </div>
          <div className="landing-fact">
            <span className="landing-fact-value">54</span>
            <span className="landing-fact-caption">{copy("Players ranked so far")}</span>
          </div>
          <div className="landing-fact">
            <span className="landing-fact-value">33</span>
            <span className="landing-fact-caption">{copy("Body keypoints tracked")}</span>
          </div>
          <div className="landing-fact">
            <span className="landing-fact-value">0</span>
            <span className="landing-fact-caption">{copy("Hardware required")}</span>
          </div>
        </div>
      </section>
      <section className="landing-roadmap" id="roadmap" aria-labelledby="roadmap-title">
        <div className="landing-roadmap-heading">
          <span className="landing-roadmap-date">{copy("UPDATED SEP 2026")}</span>
          <h2 className="landing-roadmap-title" id="roadmap-title">{copy("Where we are")}</h2>
          <p className="landing-roadmap-intro">{copy("Kick analysis is live. Full-match analysis is in beta.")}</p>
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
            <span className="landing-roadmap-status" data-stage="active">{copy("Beta")}</span>
            <div className="landing-roadmap-copy">
              <h3 className="landing-roadmap-item-title">{copy("v2.0 — full match")}</h3>
              <p className="landing-roadmap-description">{copy("Tracking every player through a match: distance, speed, heatmaps, pitch control and possession.")}</p>
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
      <section className="landing-science journey-about-science" id="method">
        <div className="landing-science-intro">
          <span className="landing-science-eyebrow">{copy("The method")}</span>
          <h2 className="landing-science-title">{copy("Not a")}<br />{copy("black box")}</h2>
          <p className="landing-science-description">
            {copy("Every number traces back to published sports-science literature and to a deterministic scorer we can show you. If a coach disagrees with a score, we can point at the frame and the angle that produced it.")}</p>
          <a className="landing-science-link" href="mailto:contact@opensport.app?subject=CACRE%202026%20preprint">
            {copy("Read the CACRE 2026 preprint →")}</a>
        </div>
        <div className="landing-science-metrics">
          <div className="landing-science-metric">
            <span className="landing-science-angle">155°</span>
            <div className="landing-science-copy">
              <span className="landing-science-metric-title">{copy("Knee angle at impact")}</span>
              <span className="landing-science-metric-description">{copy("The extension target a strike is measured against, taken from the kinematics literature rather than from a guess.")}</span>
            </div>
          </div>
          <div className="landing-science-metric">
            <span className="landing-science-marker">{copy("HIP→FOOT")}</span>
            <div className="landing-science-copy">
              <span className="landing-science-metric-title">{copy("Proximal-to-distal sequencing")}</span>
              <span className="landing-science-metric-description">{copy("The order in which hip, knee and ankle fire is what separates a trained strike from a strong one. It is the heaviest weight in the score.")}</span>
            </div>
          </div>
          <div className="landing-science-metric-last">
            <span className="landing-science-marker">{copy("ANY ANGLE")}</span>
            <div className="landing-science-copy">
              <span className="landing-science-metric-title">{copy("Trained to survive a bad camera position")}</span>
              <span className="landing-science-metric-description">{copy("Ground truth is computed on clean side-view footage and projected onto the same kick filmed from other angles, so the model learns the movement instead of the viewpoint.")}</span>
            </div>
          </div>
        </div>
      </section>
      <section className="journey-mission">
        <span className="design-eyebrow">{copy("Try it")}</span>
        <h2 className="landing-roadmap-title">{copy("Film it today.")} {copy("Know by tonight.")}</h2>
        <Link className="landing-audience-link" to="/">{copy("How OPENsport works →")}</Link>
      </section>
    </main>
  );
}
