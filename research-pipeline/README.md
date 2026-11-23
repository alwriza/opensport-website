# Research pipeline (match-analysis research)

Turns the matches added on `/admin/research` into model predictions.
Research only, not commercial: YouTube videos and SoccerNet-trained weights stay internal.

```
research_matches.status   new ──download.py──> downloaded ──process.py──> processed
                                    └── error (reason in research_matches.error) ──┘
```

- `download.py` — every `new` match: yt-dlp (video only, ≤1080p) → `$RESEARCH_BUCKET/raw/<match_id>.mp4`.
- `process.py` — every `downloaded` match: the segment ±4 s at 25 fps → T-DEED
  (`SoccerNetBall_challenge1`, threshold 0.2) → team cluster of the player nearest the
  ball at each event (Roboflow sports player/ball detectors + SigLIP team classifier)
  → `research_predictions`. Review segments become `ready`; predictions of gold
  segments are stored but RLS never shows them to the labeling page.

All times are seconds from the start of the YouTube video, the same clock the
labeling page uses.

## Machine

A Google Cloud VM, created from Cloud Shell with `gcp/create_vm.sh cpu` (n2-standard-8)
or `gcp/create_vm.sh gpu` (n1-standard-4 + T4; needs GPU quota, see
`gcp/request_gpu_quota.sh`). T-DEED is patched to run on either (`patch_tdeed.py`).

```bash
git clone -b research-pipeline https://github.com/alwriza/opensport-website.git
cd opensport-website/research-pipeline
DEVICE=cpu ./setup_vm.sh
```

`~/research.env` (never commit it):

```bash
export SUPABASE_URL=https://ysunmzmcssuptbbwhfcs.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=...        # Supabase → Project settings → API keys
export RESEARCH_BUCKET=gs://opensport-research
export TDEED_DIR=$HOME/T-DEED
export WEIGHTS_DIR=$HOME/weights
export DEVICE=cpu                           # or cuda on the GPU machine
```

## Run

```bash
nohup ~/opensport-website/research-pipeline/run.sh > ~/run.log 2>&1 &
```

`run.sh` runs `download.py`, then `process.py`, with timestamps.

Both are safe to rerun: they only pick up matches in their input status, and
`process.py` replaces a segment's predictions as a whole.

If YouTube refuses downloads from the cloud ("Sign in to confirm you're not a bot"),
run `download.py` on a laptop instead (same env file, `gcloud auth login` once).

## Licenses

- T-DEED: GPL-3.0 (code and checkpoint by its authors). Trained on SoccerNet Ball
  Action Spotting, whose data are research-only under the SoccerNet NDA.
- roboflow/sports weights: see ml-worker-match/README.md.
