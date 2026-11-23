#!/bin/bash
# What the pipeline is doing right now. On the pipeline machine:  research-pipeline/status.sh
date -u +%T
tail -c 3000 "$HOME/run.log" | tr '\r' '\n' | grep -v '^$' | tail -6 | cut -c1-160
P=$(pgrep -f 'python3 -u [p]rocess\.py' | head -1)
if [ -n "$P" ]; then
  echo "process.py pid $P, $(grep Threads /proc/$P/status)"
  sudo "$HOME/research-venv/bin/py-spy" dump --pid "$P" 2>/dev/null | grep -E '\(.*\.py:[0-9]+\)' | head -8 | cut -c1-120
fi
OUT="$HOME/T-DEED/inference_output/results_inference.json"
[ -f "$OUT" ] && "$HOME/research-venv/bin/python" -c "import json,sys; print(len(json.load(open(sys.argv[1]))['predictions']), 'T-DEED events in the last clip')" "$OUT"
