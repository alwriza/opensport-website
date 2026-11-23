"""Run the models on every match with status 'downloaded' and store predictions.

    python3 process.py

Per match: raw video from the bucket -> the segment (plus a few seconds each side)
at 25 fps -> T-DEED events -> team cluster at each event -> research_predictions.
downloaded -> processed, or error with the reason. Predictions of gold segments are
stored too; the database never shows them to the labeling page (RLS).
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile

import db
from config import (
    CLASS_MAP,
    CLIP_PAD_S,
    TDEED_FPS,
    TDEED_FRAME_WH,
    TDEED_MODEL,
    TDEED_THRESHOLD,
    env,
)
from download import raw_uri
from teams import TeamAssigner


def cut_clip(raw_path: str, clip_path: str, clip_start: float, clip_end: float) -> None:
    """The segment at exactly 25 fps; frame k of the clip is at clip_start + k / 25 s."""
    subprocess.run(
        [
            "ffmpeg", "-loglevel", "error", "-y",
            "-ss", f"{clip_start:.3f}", "-i", raw_path, "-t", f"{clip_end - clip_start:.3f}",
            "-an", "-vf", f"fps={TDEED_FPS}", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
            clip_path,
        ],
        check=True,
    )


def run_tdeed(clip_path: str) -> list[dict]:
    """T-DEED's own inference script; it writes inference_output/results_inference.json in its folder."""
    tdeed_dir = env("TDEED_DIR")
    out = os.path.join(tdeed_dir, "inference_output", "results_inference.json")
    if os.path.exists(out):
        os.remove(out)
    subprocess.run(
        [
            sys.executable, "inference.py",
            "--model", TDEED_MODEL,
            "--video_path", clip_path,
            "--frame_width", str(TDEED_FRAME_WH[0]),
            "--frame_height", str(TDEED_FRAME_WH[1]),
            "--inference_threshold", str(TDEED_THRESHOLD),
        ],
        cwd=tdeed_dir,
        check=True,
    )
    with open(out) as f:
        return json.load(f)["predictions"]


def process_one(job: db.Job, assigner: TeamAssigner, workdir: str) -> list[dict]:
    raw = os.path.join(workdir, "raw.mp4")
    clip = os.path.join(workdir, "clip.mp4")
    subprocess.run(["gcloud", "storage", "cp", raw_uri(job.match_id), raw], check=True)

    clip_start = max(0.0, job.start_s - CLIP_PAD_S)
    cut_clip(raw, clip, clip_start, job.end_s + CLIP_PAD_S)
    os.remove(raw)

    events = run_tdeed(clip)
    assigner.fit(clip)

    rows = []
    for e in events:
        label = e["label"]
        if label not in CLASS_MAP:
            raise RuntimeError(f"T-DEED returned unknown class {label!r}")
        t = clip_start + e["frame"] / TDEED_FPS
        if not job.start_s <= t <= job.end_s:
            continue
        rows.append(
            {
                "segment_id": job.segment_id,
                "source": "tdeed",
                "t": round(t, 3),
                "raw_class": label,
                "class": CLASS_MAP[label],
                "confidence": float(e["confidence"]),
                "cluster": assigner.cluster_at(int(e["frame"])),
            }
        )
    return rows


def main() -> None:
    client = db.client()
    jobs = db.matches_with_status(client, "downloaded")
    print(f"{len(jobs)} match(es) to process")
    if not jobs:
        return
    assigner = TeamAssigner(env("WEIGHTS_DIR"), os.environ.get("DEVICE", "cuda"))
    for job in jobs:
        print(f"--- {job.match_id} ({job.segment_mode}) {job.start_s:.0f}-{job.end_s:.0f} s")
        with tempfile.TemporaryDirectory() as workdir:
            try:
                rows = process_one(job, assigner, workdir)
                db.replace_predictions(client, job, rows)
            except Exception as e:  # recorded on the match, then the next match goes on
                db.set_match_status(client, job.match_id, "error", f"process: {e}")
                print(f"!!! {job.match_id}: {e}")
                continue
        db.set_match_status(client, job.match_id, "processed")
        with_team = sum(r["cluster"] is not None for r in rows)
        print(f"ok {job.match_id}: {len(rows)} predictions, {with_team} with a team")


if __name__ == "__main__":
    main()
