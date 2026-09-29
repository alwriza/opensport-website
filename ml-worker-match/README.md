# ml-worker-match

Match Analysis worker. Pull-based: it polls Supabase for queued jobs, so it runs on any
machine with outbound HTTPS — no inbound networking, no queue service, no webhooks.

It is a **separate** worker from the existing v2.0 Railway technique worker, which it
does not touch.

## Pipeline

[roboflow/sports](https://github.com/roboflow/sports) pinned at
`42c80c06b6b65a7f89455b89fe31cdf4c38ba227`, `examples/soccer`.

| Stage | Model | Notes |
|---|---|---|
| Players, goalkeepers, referees, ball | YOLOv8 `football-player-detection.pt` | `imgsz=1280` |
| Pitch keypoints | YOLOv8 `football-pitch-detection.pt` | 32 vertices → homography |
| Ball | YOLOv8 `football-ball-detection.pt` | run through `sv.InferenceSlicer` |
| Tracking | ByteTrack (supervision) | `minimum_consecutive_frames=3` |
| Teams | SigLIP → UMAP → KMeans(2) | fitted on crops sampled every 60 source frames |

Pitch dimensions come from `SoccerPitchConfiguration` (120 m × 70 m, stored in cm and
converted here), not from a hardcoded 105 × 68.

### supervision is pinned

`supervision==0.30.5`. The upstream example was written against an older release and
two of the calls it uses have moved since:

- `InferenceSlicer(overlap_filter_strategy=...)` is now `overlap_filter=...`.
- `sv.KeyPoints` exposes `keypoint_confidence`, not `confidence`, and the pitch model is
  trained with a two-value `kpt_shape`, so ultralytics reports `None` for it. Keypoints
  the model did not place stay at the origin, so the homography filters on coordinates
  (`x > 1 and y > 1`), the same way the upstream example does.
- `sv.VideoSink` writes `mp4v`, which browsers will not play, so the annotated video is
  re-encoded to H.264/yuv420p with ffmpeg before upload.

### Privacy

Every model is loaded from a local `.pt` file or the local HuggingFace cache and run
in-process through `ultralytics` / `transformers`. No frame leaves the machine. The only
outbound traffic is the one-time weight download and the Supabase calls in `worker.py`.

### Licenses

- `sports` and `supervision`: MIT.
- **`ultralytics` (YOLOv8): AGPL-3.0.** Serving its output from a network service pulls
  the AGPL's network clause in. Fine for a competition demo; it needs a decision (an
  Ultralytics Enterprise licence, or a non-AGPL detector) before this is a paid product.
- Weights are trained on data derived from the Kaggle *DFL — Bundesliga Data Shootout*
  competition, whose rules restrict use to the competition unless separately licensed.

## Modules

| File | Responsibility |
|---|---|
| `config.py` | constants only |
| `pipeline.py` | video → raw per-frame records + annotated H.264 video. No metrics. |
| `metrics.py` | pure functions: records → numbers. No I/O, no torch. Owns the record schema. |
| `results.py` | builds and validates `results.json` |
| `worker.py` | poll → claim → download → run → upload → update |

## Run

```bash
python3 -m venv venv && ./venv/bin/pip install -r requirements.txt
./setup.sh                      # weights into ./weights
cp .env.example .env            # then fill SUPABASE_SERVICE_ROLE_KEY
set -a && . ./.env && set +a
python3 worker.py
```

Docker (CUDA):

```bash
docker build -t opensport-match-worker .
docker run --gpus all --env-file .env opensport-match-worker
```

Tests (no GPU, no weights, no network needed):

```bash
./venv/bin/python -m pytest tests -q
```

## Behaviour on failure

One correct path, no retries and no fallbacks. Any exception writes `status='failed'`
with a readable `error` on the row and re-raises. A clip whose pitch is mapped in under
30% of analysed frames fails with `pitch_calibration_insufficient` rather than producing
metrics nobody should trust.

## Honesty rules baked in

- Only frames with a valid homography contribute to any metric.
- `meta.homography_coverage` and `meta.ball_coverage` always ship and are always shown.
- Possession is `null` with a reason when the ball is seen in under 30% of frames.
- Dominance ignores frames without at least 5 mapped players on each team.
- Steps implying over 12 m/s are dropped, and a track gone for over 1 s is not joined
  back across the hole.
- Analysis stops at 300 s; `meta.analyzed_seconds` says how much was actually used.
