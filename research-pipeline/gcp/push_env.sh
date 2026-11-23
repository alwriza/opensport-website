#!/bin/bash
# Write ~/research.env on the pipeline machine. The Supabase service-role key comes
# from $K in this shell (read -rs K, then paste), so it is never typed or logged.
#   export K; ./push_env.sh research-cpu us-central1-a cpu
set -euo pipefail
NAME="${1:?machine name}"; ZONE="${2:?zone}"; DEVICE="${3:?cpu or cuda}"
: "${K:?read -rs K and paste the service-role key first, then export K}"
printf '%s\n' \
  "export SUPABASE_URL=https://ysunmzmcssuptbbwhfcs.supabase.co" \
  "export SUPABASE_SERVICE_ROLE_KEY=$K" \
  "export RESEARCH_BUCKET=gs://opensport-research" \
  'export TDEED_DIR=$HOME/T-DEED' \
  'export WEIGHTS_DIR=$HOME/weights' \
  "export DEVICE=$DEVICE" |
  gcloud compute ssh "$NAME" --zone "$ZONE" --quiet --command 'umask 077; cat > ~/research.env; echo "research.env: $(grep -c export ~/research.env) lines"'
