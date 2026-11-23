#!/bin/bash
# Ask for one GPU: the global limit and one T4 and one L4 in us-central1.
# New projects start at 0. Run in Cloud Shell.
set -euo pipefail
PROJECT=$(gcloud config get-value project)
ACCOUNT=$(gcloud config get-value account)
gcloud services enable cloudquotas.googleapis.com

request() {  # quota-id [dimension]
  local args=(--service=compute.googleapis.com --quota-id="$1" --preferred-value=1 --project="$PROJECT" --billing-project="$PROJECT"
              --email="$ACCOUNT" --justification="Non-commercial research: one GPU for offline football video analysis")
  if [ -n "${2:-}" ]; then args+=(--dimensions="$2"); fi
  gcloud beta quotas preferences create "${args[@]}"
}

request GPUS-ALL-REGIONS-per-project
request NVIDIA-T4-GPUS-per-project-region region=us-central1
request NVIDIA-L4-GPUS-per-project-region region=us-central1

gcloud beta quotas preferences list --project="$PROJECT" --billing-project="$PROJECT" \
  --format="table(quotaId, dimensions, quotaConfig.preferredValue, quotaConfig.grantedValue, reconciling)"
