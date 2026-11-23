#!/bin/bash
# Create the GPU machine: n1-standard-4 + 1 NVIDIA T4, Google Deep Learning VM image
# (NVIDIA driver installed on first boot). Tries the us-central1 zones in order,
# because a zone can be out of T4s. Run in Cloud Shell.
#   Stop it after every run:  gcloud compute instances stop research-gpu --zone=<zone>
set -euo pipefail
NAME=research-gpu
FAMILY=$(gcloud compute images list --project=deeplearning-platform-release \
  --filter="family~^common-cu12 AND family~debian AND status=READY" \
  --format="value(family)" --sort-by=~creationTimestamp | head -1)
[ -n "$FAMILY" ] || { echo "no Deep Learning VM image family found"; exit 1; }
echo "image family: $FAMILY"

for ZONE in us-central1-a us-central1-b us-central1-c us-central1-f; do
  echo "--- trying $ZONE"
  if gcloud compute instances create "$NAME" --zone="$ZONE" \
      --machine-type=n1-standard-4 --accelerator=type=nvidia-tesla-t4,count=1 \
      --maintenance-policy=TERMINATE \
      --image-project=deeplearning-platform-release --image-family="$FAMILY" \
      --boot-disk-size=150GB --boot-disk-type=pd-balanced \
      --metadata=install-nvidia-driver=True \
      --scopes=cloud-platform; then
    echo "created $NAME in $ZONE"
    exit 0
  fi
done
echo "no us-central1 zone could create the machine"
exit 1
