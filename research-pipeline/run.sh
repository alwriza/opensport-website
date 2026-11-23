#!/bin/bash
# Download every new match, then process every downloaded one, with timestamps.
# On the pipeline machine:  nohup ~/opensport-website/research-pipeline/run.sh > ~/run.log 2>&1 &
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
. "$HOME/research.env"
. "$HOME/research-venv/bin/activate"
echo "start    $(date -u +%T)"
python3 -u download.py
echo "download $(date -u +%T)"
python3 -u process.py
echo "process  $(date -u +%T)"
