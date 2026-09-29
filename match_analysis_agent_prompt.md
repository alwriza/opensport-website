# TASK: Match Analysis v3.0-demo for OPENsport (Roboflow Sports pipeline → website)

You are working in the OPENsport repo. Build a working "Match Analysis" feature: a user uploads a football match video on the website, a GPU/CPU worker runs the open-source Roboflow Sports pipeline on it, and the site shows quantitative stats (speed, distance, heatmaps, pitch dominance, possession, team split) plus a minimap replay. This is for testing and competition demos, not the final v3.0 architecture.

## 0. WORKING RULES (non-negotiable)

6. Don't overengineer: Simple beats complex
7. No fallbacks: One correct path, no alternatives
8. One way: One way to do things, not many
9. Clarity over compatibility: Clear code beats backward compatibility
10. Throw errors: Fail fast when preconditions aren't met
11. No backups: Trust the primary mechanism
12. Separation of concerns: Each function should have a single responsibility

Development methodology:
13. Surgical changes only: Make minimal, focused fixes
14. Evidence-based debugging: Add minimal, targeted logging
15. Fix root causes: Address the underlying issue, not just symptoms
16. Simple > Complex: Let TypeScript catch errors instead of excessive runtime checks
17. Collaborative process: Work with the user to identify the most efficient solution

You are a detective. When something fails or behaves unexpectedly: state the theory of the crime, collect evidence (command output, logs, query results, saved frames), and only when the evidence proves the theory, fix it. Never apply a fix based on a theory that has no evidence behind it.

Two extra rules from the user's workflow:
- **Verification after every file edit:** in the same response as the edit, show `git diff` for that file and a `grep` proving the change landed. No exceptions.
- **SQL is never executed by you.** The user runs all SQL manually in the Supabase SQL Editor. You write SQL into a file, present it, and stop. Do not run migrations, `supabase db push`, or any DDL/DML against the remote database.

## 1. SCOPE

**In (v1):**
- Pipeline: player/ball/referee detection, pitch keypoint detection → homography (pixel → pitch coordinates), ByteTrack tracking, team classification, ball detection.
- Metrics: per-track distance and speed, team totals, per-team heatmaps, pitch dominance (Voronoi area share over time), possession (nearest player to ball), coverage diagnostics.
- Site: upload, job status, results page with team cards, heatmaps, dominance timeline, minimap replay synced to the annotated video, per-track table.

**Out (do NOT build, do NOT stub):**
- Pass / shot / attack event detection (needs its own spec later)
- Fine-tuning or training any model
- TrackNet, goal detection, jersey number OCR
- Integration with the existing v2.0 MediaPipe + MS-TCN technique pipeline
- Billing, sharing links, public access

Design one hook for later: persist per-frame track positions (see §5) so events can be derived from them without re-running models.

## 2. CONTEXT (verify everything against the repo, do not trust this blindly)

- Frontend: React + TypeScript + Vite + shadcn/ui + TailwindCSS
- Backend: Supabase (Postgres + Storage; Edge Functions on Deno). Expected active project ref: `ysunmzmcssuptbbwhfcs` (eu-central-1); confirm against repo config.
- Auth: custom Supabase Auth. RLS bridges through `current_user_id()` (SECURITY DEFINER, maps `auth.uid()` → `public.users.id`). Copy the existing RLS pattern from existing migrations.
- Existing v2.0 ML worker runs on Railway (CPU). **Do not modify it.** The new worker is a separate directory.
- Ignore `_deprecated_*` tables.
- Videos may contain minors. Everything is private, owner-only. No public buckets, no public URLs.

## 3. DECISIONS ALREADY MADE (do not reopen)

1. **Pipeline:** `github.com/roboflow/sports` (soccer example: `examples/soccer`). Pin to a specific commit and record the SHA. If M1 shows it does not work on the test clip, STOP and report with evidence. Do not silently switch to another pipeline.
2. **Worker model:** pull-based. The worker polls Supabase for queued jobs, so it runs on any machine (local, GCP L4 VM, Colab) without inbound networking. No queue service, no webhooks, no Edge Function in the path.
3. **Upload path:** browser uploads straight to a private Supabase Storage bucket; frontend inserts the job row. No custom upload endpoint.
4. **Models run locally.** The Roboflow API key is only for downloading weights. Frames must never be sent to a third-party inference API. Verify this in M1 (see gate).
5. **Honesty over polish:** metrics are computed only on frames with a valid pitch homography. Coverage numbers are always shown in the UI. Unreliable metrics are shown as unavailable with a reason, never faked.
6. **Naming:** tracker IDs fragment when players are occluded, so the UI says "Track #12", never "Player 12". Team-level numbers are the headline; per-track numbers are secondary.

## 4. MILESTONES

Work through these in order. Use a task list. After each milestone, output a 5-line status (what was done, evidence, what's next).

### M0. Recon (read-only)
Report file paths and findings (max ~15 lines) for:
- Router and page structure, how protected routes are declared, how the Supabase client is created
- Migrations folder and an existing RLS policy example using `current_user_id()`
- Existing storage buckets/policies, existing data-fetching pattern (react-query or other) and charting lib
- Existing ML worker directory, env-var conventions
- Whether any `match_*` tables/buckets already exist
- Supabase Storage max upload size for this project (check config/dashboard docs; if you can't determine it, say so)
- GPU available? (`nvidia-smi`); Python version; ffmpeg present?

### Inputs you need from the user (ask ONCE, at the start, in a single message, then continue with whatever is unblocked)
- A test clip: broadcast-style, static elevated camera, whole pitch visible, 1080p, 60–120 s
- `ROBOFLOW_API_KEY` (free account) for weight download
- Where the worker will run for the demo (local machine vs GCP VM). If no GPU is available, use CPU with clips ≤ 60 s and say so.

### M1. Pipeline evidence run (standalone, before any integration)
Clone `roboflow/sports` at a pinned commit into a scratch dir. Read `examples/soccer` first and record the ACTUAL API (class names, config names, model ids, how weights are obtained). The names in this prompt are from memory; the repo is the truth. Run player detection, pitch detection, tracking, team classification, ball detection and the radar view on the test clip.

Produce an evidence table:
| Item | What to record |
|---|---|
| Models / weights | ids, source, **license of code, weights and training datasets** |
| Runtime | seconds per 1000 frames, on which hardware |
| Homography coverage | % of analyzed frames with a valid transform |
| Players per frame | mean detected players (expect ~18–24 on a full-pitch view) |
| Ball | % of frames with a ball detection |
| Tracks | number of distinct track IDs vs ~22–25 real people |
| Teams | save 3 sample frames + radar frames to disk and LOOK at them; is the team split visibly right? |
| Privacy | prove frames are not sent off-machine (inspect how the models are loaded; check network calls during a run) |

**Gate:** homography coverage ≥ 70% AND mean players/frame ≥ 18 on the broadcast-style clip, AND inference verified local. If it fails, STOP and report the table. Do not tune blindly.
If any license forbids commercial use, do not stop, but flag it prominently in the final report.

### M2. Worker package `ml-worker-match/` (new directory)
Single-responsibility modules:
- `config.py`: constants only (see §6)
- `pipeline.py`: wraps the Roboflow calls; input video path → per-frame raw records (timestamp, tracker id, class, team, pitch xy, ball xy). No metrics here.
- `metrics.py`: **pure functions**, raw records in → metrics out. No I/O.
- `results.py`: builds and validates `results.json` (§5)
- `worker.py`: poll → claim → download → run → upload → update row. Nothing else.
- `Dockerfile` (CUDA base) and a short `README.md` with run commands
- Unit tests for `metrics.py` using synthetic trajectories with known answers (e.g. a player moving 10 m in 2 s → distance 10.0 m, speed 5.0 m/s; a teleporting track is rejected; two symmetric teams → 50/50 dominance).

Worker uses the Supabase service-role key from env only. It never appears in the frontend or in git.
On any exception the worker sets `status='failed'` with a readable `error` and re-raises. No retries, no silent fallbacks.

### M3. Database + Storage (SQL file only, NOT executed)
Write `supabase/match_analysis.sql` (or the repo's migration convention) containing:
- Table `match_analyses`: `id uuid pk`, `user_id` (FK to `public.users.id`, same convention as existing tables), `status` (`queued|processing|done|failed`), `video_path`, `annotated_video_path`, `results_path`, `error`, `summary jsonb`, `created_at`, `started_at`, `finished_at`
- RLS: owner-only select/insert (via `current_user_id()`); no client update/delete of status fields
- Private buckets `match-videos` and `match-results` with owner-scoped storage policies; set the file size limit consistent with M0
- SQL function `claim_next_match_analysis()` using `FOR UPDATE SKIP LOCKED`, callable only with the service role
Present the SQL in chat with a one-line explanation per block, then STOP that thread and tell the user to run it in the SQL Editor. Continue with frontend work in the meantime; end-to-end testing waits for the user's confirmation that SQL ran.

### M4. Frontend
Route `/match-analysis` (protected like the other authenticated pages), built with existing shadcn components. Add a new dependency only if there is no existing one that does the job (say why).
- Upload: resumable upload if the file is > 6 MB (verify what supabase-js supports here); show progress; insert the row after upload succeeds
- List of the user's analyses with status; poll every 5 s while any is queued/processing (plain polling, no realtime subscriptions)
- Detail page:
  - Coverage badges (pitch calibration %, ball detection %) and an explicit note on how many seconds were analyzed
  - Team cards: total distance, mean/top speed, possession % (or "unavailable: ball detected in X% of frames"), dominance %
  - Per-team heatmaps (canvas or SVG on a pitch outline)
  - Dominance-over-time chart
  - Annotated video + minimap replay driven by `video.currentTime`
  - Per-track table (only tracks ≥ MIN_TRACK_SECONDS), labeled "Track #"
- Failed jobs show the `error` text
- TypeScript types for `results.json` are the single source of truth on the frontend; no runtime schema library unless one already exists

### M5. End-to-end verification
User confirms SQL is applied → run the worker against the queue → upload the test clip through the actual website → job reaches `done` → every UI block renders from real data.
Sanity checks (report actual numbers; investigate anything outside range with evidence, do not just tweak thresholds):
- No track top speed above ~36 km/h
- Team distance for a 2-min clip in a plausible range (~150–350 m per active player)
- Dominance shares sum to ~100%
- Track count vs real players; report fragmentation honestly
- Run one deliberately bad clip (handheld phone video, few pitch lines) and confirm it fails with `pitch_calibration_insufficient`, not with garbage metrics

## 5. RESULTS CONTRACT (`results.json` in bucket `match-results`)

```
meta:      { source_video, analyzed_seconds, analysis_fps, homography_coverage, ball_coverage,
             roboflow_sports_sha, model_ids, pitch_dims_m, generated_at }
teams:     { A: {distance_m, avg_speed_kmh, top_speed_kmh, dominance_pct, possession_pct|null,
                 possession_unavailable_reason|null, heatmap: number[][]},
             B: { ...same } }
tracks:    [ { track_id, team, role, mapped_seconds, distance_m, avg_speed_kmh, top_speed_kmh } ]
dominance: [ { t, a_pct } ]                     // time series
frames:    [ { t, players: [[track_id, team, x_m, y_m]], ball: [x_m, y_m] | null } ]   // for minimap replay + future event detection
```
Coordinates in meters, derived from the pitch configuration's dimensions (do not hardcode 105×68; read them from the pipeline's pitch config).

## 6. INITIAL CONSTANTS (chosen by me, adjust ONLY with evidence)

- `ANALYSIS_FPS = 10`
- `MAX_ANALYZE_SECONDS = 300` (worker analyzes the first N seconds; `analyzed_seconds` in meta and shown in the UI. This is explicit truncation, not silent.)
- `MAX_PLAYER_SPEED_MS = 12`: between consecutive mapped frames, a jump implying a higher speed is rejected (track switch / homography glitch) and not added to distance
- Speed: smoothed over a 1 s window
- `MIN_TRACK_SECONDS = 3` for a track to appear in per-track stats
- `POSSESSION_RADIUS_M = 3`: nearest player to the ball within this radius holds possession; otherwise nobody
- Possession reported only if ball coverage ≥ 30%; otherwise `null` + reason
- Dominance frame counts only if ≥ 5 mapped players per team; area share via grid sampling of the pitch
- Job fails with `pitch_calibration_insufficient` if homography coverage < 30%

## 7. STOP CONDITIONS (stop and ask, do not improvise)

- Missing test clip / API key / unknown worker host (ask once, up front)
- M1 gate failed
- Any step that would run SQL, touch the existing Railway worker, or delete anything
- A license that blocks the demo use case
- Two failed attempts at the same problem without new evidence

## 8. FINAL REPORT (short)

1. What works end-to-end, with the M5 numbers
2. Evidence table from M1 (updated if anything changed)
3. Known limitations: track fragmentation, ball coverage, homography failures on handheld footage, license flags
4. Exact commands to start the worker and where it must be deployed for the demo
5. What is NOT built (events: passes/shots/attacks) and where the data hook for it is (`frames` in `results.json`)
