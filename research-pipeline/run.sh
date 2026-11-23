#!/bin/bash
# Download every new match, then process every downloaded one, with timestamps.
# On the pipeline machine:  nohup ~/opensport-website/research-pipeline/run.sh > ~/run.log 2>&1 &
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
. "$HOME/research.env"
. "$HOME/research-venv/bin/activate"
# `import ultralytics` sets OMP_NUM_THREADS=1 when it is unset, which made torch (and the
# T-DEED subprocess, which inherits it) run on one core. One thread per physical core.
OMP_NUM_THREADS=$(lscpu -b -p=Core,Socket | grep -v '^#' | sort -u | wc -l)
export OMP_NUM_THREADS
echo "threads  $OMP_NUM_THREADS"
echo "start    $(date -u +%T)"
python3 -u download.py
echo "download $(date -u +%T)"
python3 -u process.py
echo "process  $(date -u +%T)"
