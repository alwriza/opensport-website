import { Link } from "react-router-dom";
import { useDesignCopy } from "@/hooks/useDesignCopy";
import type { ScoreValues } from "@/components/redesign/primitives";

const RETEST_AFTER_DAYS = 7;

const analysisStages = ["Uploading video", "Detecting the player", "Tracking 33 body points", "Finding the contact frame", "Building your report"];

export function AnalysisStages({ active }: { active: number }) {
  const copy = useDesignCopy();
  return <ol className="design-stages">
    {analysisStages.map((stage, index) => <li key={stage} data-state={index < active ? "done" : index === active ? "active" : "waiting"}>
      <span>{index < active ? "✓" : `0${index + 1}`}</span>{copy(stage)}
    </li>)}
  </ol>;
}

/** The single action the player should take now, derived from where they are in the record → train → retest loop. */
export function NextStep({ processing, lastFailed, scores, overall, lastTestAt, labels, trainingPath, onUpload }: {
  processing: boolean; lastFailed: boolean; scores: ScoreValues | null; overall: number | null; lastTestAt: string | null;
  labels: Record<keyof ScoreValues, string>; trainingPath: string; onUpload: () => void;
}) {
  const copy = useDesignCopy();

  if (processing) return <section className="design-next-step" aria-live="polite">
    <div className="design-next-step-copy">
      <span className="design-eyebrow">{copy("Analysis in progress")}</span>
      <h2>{copy("Analysing your kick")}</h2>
      <p>{copy("This usually takes under a minute. Your scores and first drills will appear here.")}</p>
    </div>
    <AnalysisStages active={1} />
  </section>;

  if (!scores || overall == null) return <section className="design-next-step" data-onboarding="player-first-test">
    <div className="design-next-step-copy">
      <span className="design-eyebrow">{copy("Step 1 of the loop")}</span>
      <h2>{copy("Start with your first football assessment")}</h2>
      {lastFailed && <p className="design-next-step-warning">{copy("Your last video could not be analysed. Film again with your whole body and the ball in frame. Any angle works; from the side is the most accurate.")}</p>}
      <p>{copy("Record one kick. OPENsport will score it and pick your first training recommendations.")}</p>
    </div>
    <div className="design-next-step-side">
      <ol className="design-next-step-list">
        <li><span>01</span>{copy("Any angle works, from the side is most accurate · hip height, 3–5 m, landscape")}</li>
        <li><span>02</span>{copy("One kick per clip, whole body and ball in frame")}</li>
        <li><span>03</span>{copy("Upload it here: MP4, MOV, AVI or MKV, up to 50 MB")}</li>
      </ol>
      <button className="design-button design-next-step-action" onClick={onUpload}>{copy("Start first assessment")}</button>
    </div>
  </section>;

  const weakest = (Object.keys(scores) as (keyof ScoreValues)[]).reduce((low, key) => scores[key] < scores[low] ? key : low);
  const daysSinceTest = lastTestAt ? Math.floor((Date.now() - new Date(lastTestAt).getTime()) / 86400000) : 0;

  if (daysSinceTest >= RETEST_AFTER_DAYS) return <section className="design-next-step">
    <div className="design-next-step-copy">
      <span className="design-eyebrow">{copy("Time to retest")}</span>
      <h2>{copy("Ready to measure your progress?")}</h2>
      <p>{copy("Your last test was {days} days ago. Film the same kick from the same angle and compare it with {score}.").replace("{days}", String(daysSinceTest)).replace("{score}", overall.toFixed(1))}</p>
    </div>
    <div className="design-next-step-side">
      <button className="design-button design-next-step-action" onClick={onUpload}>{copy("Retake assessment")}</button>
      <Link className="design-link design-link-underlined" to={trainingPath}>{copy("Train first →")}</Link>
    </div>
  </section>;

  const target = Math.min(100, Math.round(scores[weakest] + 5));
  return <section className="design-next-step">
    <div className="design-next-step-copy">
      <span className="design-eyebrow">{copy("Your next goal")}</span>
      <h2>{copy("Improve {metric}").replace("{metric}", labels[weakest])}</h2>
      <p>{copy("{metric} is your lowest score right now, so it is the best place to start. Do the recommended drills, then film the same kick again.").replace("{metric}", labels[weakest])}</p>
    </div>
    <div className="design-next-step-side">
      <div className="design-next-step-target">
        <span className="design-eyebrow">{labels[weakest]}</span>
        <strong>{scores[weakest].toFixed(1)} <span>→</span> {target}</strong>
        <span className="design-eyebrow">{copy("Current → target")}</span>
      </div>
      <Link className="design-button design-next-step-action" to={trainingPath}>{copy("Start training")}</Link>
      <button className="design-link design-link-underlined" onClick={onUpload}>{copy("Retake assessment →")}</button>
    </div>
  </section>;
}
