"""Model quality against the gold set, and what the reviews say.

    python3 evaluate.py            # prints the tables, writes evaluation.json

Gold (segments in mode 'gold' and status 'done'):
  A prediction and a label match when they have the same class and are at most
  TOLERANCE_S apart (0.48 s = 12 frames at 25 fps, as in SoccerNet; also 1 s).
  Per class, predictions are taken by confidence, highest first, each matching the
  nearest unmatched label. Precision, recall and F1 for every confidence threshold.
  Team: the model's clusters are anonymous, so per segment the cluster->team mapping
  that agrees with the gold labels most often is used; team accuracy is over matched
  pairs whose prediction has a cluster.

Review (segments in mode 'review'): share of predictions marked correct per class.
"""

from __future__ import annotations

import json
from collections import defaultdict
from dataclasses import dataclass

import db
from config import TDEED_THRESHOLD

CLASSES = ["pass", "drive", "cross", "shot", "header", "tackle", "block", "throw_in"]
TOLERANCES_S = [0.48, 1.0]
THRESHOLDS = [round(TDEED_THRESHOLD + 0.1 * i, 2) for i in range(6)]  # 0.2 .. 0.7


@dataclass
class Label:
    t: float
    cls: str
    team: str


@dataclass
class Pred:
    t: float
    cls: str
    confidence: float
    cluster: int | None


def match(labels: list[Label], preds: list[Pred], tol: float) -> list[tuple[Label, Pred | None, Pred | None]]:
    """Pairs (label, pred) per class; unmatched labels come with pred None, unmatched preds with label None."""
    out: list = []
    for cls in CLASSES:
        free = [l for l in labels if l.cls == cls]
        for p in sorted((p for p in preds if p.cls == cls), key=lambda p: -p.confidence):
            near = [l for l in free if abs(l.t - p.t) <= tol]
            if near:
                best = min(near, key=lambda l: abs(l.t - p.t))
                free.remove(best)
                out.append((best, p, None))
            else:
                out.append((None, None, p))
        out += [(l, None, None) for l in free]
    return out


def prf(tp: int, fp: int, fn: int) -> dict:
    p = tp / (tp + fp) if tp + fp else 0.0
    r = tp / (tp + fn) if tp + fn else 0.0
    f = 2 * p * r / (p + r) if p + r else 0.0
    return {"tp": tp, "fp": fp, "fn": fn, "precision": round(p, 3), "recall": round(r, 3), "f1": round(f, 3)}


def best_team_mapping(pairs: list[tuple[Label, Pred]]) -> dict[int, str]:
    agree = {0: 0, 1: 0}  # mapping "cluster 0 = A" vs "cluster 0 = B"
    for label, pred in pairs:
        if pred.cluster is None:
            continue
        as_a = "A" if pred.cluster == 0 else "B"
        agree[0 if as_a == label.team else 1] += 1
    return {0: "A", 1: "B"} if agree[0] >= agree[1] else {0: "B", 1: "A"}


def gold_report(client) -> dict:
    segments = (
        client.table("research_segments").select("id, match_id").eq("mode", "gold").eq("status", "done").execute().data
    )
    data = []
    for s in segments:
        labels = client.table("research_labels").select("t, class, team").eq("segment_id", s["id"]).execute().data
        preds = (
            client.table("research_predictions")
            .select("t, class, confidence, cluster")
            .eq("segment_id", s["id"])
            .not_.is_("class", "null")
            .execute()
            .data
        )
        data.append(
            (
                s["match_id"],
                [Label(float(l["t"]), l["class"], l["team"]) for l in labels],
                [Pred(float(p["t"]), p["class"], float(p["confidence"]), p["cluster"]) for p in preds],
            )
        )

    report: dict = {"segments": [d[0] for d in data], "tolerances": {}}
    for tol in TOLERANCES_S:
        per_threshold = {}
        for thr in THRESHOLDS:
            counts = defaultdict(lambda: [0, 0, 0])
            team_ok = team_total = no_cluster = 0
            for _, labels, preds in data:
                kept = [p for p in preds if p.confidence >= thr]
                pairs = match(labels, kept, tol)
                matched = [(l, p) for l, p, _ in pairs if p is not None]
                mapping = best_team_mapping(matched)
                for label, pred, extra in pairs:
                    if pred is not None:
                        counts[label.cls][0] += 1
                        if pred.cluster is None:
                            no_cluster += 1
                        else:
                            team_total += 1
                            team_ok += mapping[pred.cluster] == label.team
                    elif extra is not None:
                        counts[extra.cls][1] += 1
                    else:
                        counts[label.cls][2] += 1
            per_threshold[str(thr)] = {
                "classes": {c: prf(*counts[c]) for c in CLASSES},
                "all": prf(*(sum(counts[c][i] for c in CLASSES) for i in range(3))),
                "team_accuracy": round(team_ok / team_total, 3) if team_total else None,
                "matched_without_team": no_cluster,
            }
        report["tolerances"][str(tol)] = per_threshold
    return report


def review_report(client) -> dict:
    rows = (
        client.table("research_predictions")
        .select("class, research_segments!inner(mode), research_reviews(verdict)")
        .eq("research_segments.mode", "review")
        .not_.is_("class", "null")
        .execute()
        .data
    )
    verdicts: dict = defaultdict(lambda: defaultdict(int))
    for r in rows:
        review = r["research_reviews"]
        verdicts[r["class"]][review["verdict"] if review else "not_reviewed"] += 1
    out = {}
    for cls in CLASSES:
        v = verdicts[cls]
        reviewed = v["correct"] + v["not_event"] + v["relabel"]
        out[cls] = {**v, "correct_share": round(v["correct"] / reviewed, 3) if reviewed else None}
    return out


def main() -> None:
    client = db.client()
    report = {"gold": gold_report(client), "review": review_report(client)}
    with open("evaluation.json", "w") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    gold = report["gold"]
    print(f"gold segments done: {len(gold['segments'])} {gold['segments']}")
    for tol, per_thr in gold["tolerances"].items():
        print(f"\n=== tolerance {tol} s ===")
        print("thr   " + " ".join(f"{c[:8]:>9}" for c in CLASSES) + "      all   team")
        for thr, r in per_thr.items():
            f1s = " ".join(f"{r['classes'][c]['f1']:>9.2f}" for c in CLASSES)
            team = "-" if r["team_accuracy"] is None else f"{r['team_accuracy']:.2f}"
            print(f"{thr:<5} {f1s} {r['all']['f1']:>8.2f} {team:>6}")
        print("(F1 per class)")
    print("\n=== review: share of predictions marked correct ===")
    for cls, v in report["review"].items():
        print(f"{cls:<9} {v['correct_share'] if v['correct_share'] is not None else '-':>6}  {dict(v)}")
    print("\nfull numbers in evaluation.json")


if __name__ == "__main__":
    main()
