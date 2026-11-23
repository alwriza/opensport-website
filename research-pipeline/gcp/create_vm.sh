#!/bin/bash
# Create the pipeline machine in us-central1. Run in Cloud Shell:
#   ./create_vm.sh cpu   n2-standard-8, Debian 12 (no GPU quota needed)
#   ./create_vm.sh gpu   n1-standard-4 + 1 NVIDIA T4, Deep Learning VM image (needs GPU quota)
# Zones are tried in order, because one can be out of capacity.
# Stop it after every run:  gcloud compute instances stop research-<kind> --zone=<zone>
set -euo pipefail
KIND="${1:?usage: create_vm.sh cpu|gpu}"
NAME="research-$KIND"

case "$KIND" in
  cpu)
    MACHINE=(--machine-type=n2-standard-8 --image-project=debian-cloud --image-family=debian-12)
    ;;
  gpu)
    FAMILY=$(gcloud compute images list --project=deeplearning-platform-release \
      --filter="family~^common-cu12 AND family~debian AND status=READY" \
      --format="value(family)" --sort-by=~creationTimestamp | head -1)
    [ -n "$FAMILY" ] || { echo "no Deep Learning VM image family found"; exit 1; }
    echo "image family: $FAMILY"
    MACHINE=(--machine-type=n1-standard-4 --accelerator=type=nvidia-tesla-t4,count=1
             --maintenance-policy=TERMINATE --image-project=deeplearning-platform-release
             --image-family="$FAMILY" --metadata=install-nvidia-driver=True)
    ;;
  *) echo "kind must be cpu or gpu"; exit 1 ;;
esac

for ZONE in us-central1-a us-central1-b us-central1-c us-central1-f; do
  echo "--- trying $ZONE"
  if gcloud compute instances create "$NAME" --zone="$ZONE" "${MACHINE[@]}" \
      --boot-disk-size=150GB --boot-disk-type=pd-balanced --scopes=cloud-platform; then
    echo "created $NAME in $ZONE"
    exit 0
  fi
done
echo "no us-central1 zone could create $NAME"
exit 1
