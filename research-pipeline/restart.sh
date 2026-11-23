#!/bin/bash
# Stop a running pipeline (run.sh and its python children), then start run.sh again.
# On the pipeline machine:  ~/opensport-website/research-pipeline/restart.sh
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Bracketed patterns never match this script's own command line.
pkill -f '[r]esearch-pipeline/run\.sh' || true
pkill -f 'python3 -u [d]ownload\.py' || true
pkill -f 'python3 -u [p]rocess\.py' || true
pkill -f '[i]nference\.py --model' || true
sleep 2
nohup "$DIR/run.sh" > "$HOME/run.log" 2>&1 &
echo "run.sh started, log in ~/run.log"
