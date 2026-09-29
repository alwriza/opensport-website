#!/bin/bash
# Download the three YOLOv8 checkpoints published by roboflow/sports examples/soccer.
# They are plain Google Drive files: no Roboflow API and no account are involved.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEIGHTS="${WEIGHTS_DIR:-$DIR/weights}"
mkdir -p "$WEIGHTS"

gdown -O "$WEIGHTS/football-player-detection.pt" "https://drive.google.com/uc?id=17PXFNlx-jI7VjVo_vQnB1sONjRyvoB-q"
gdown -O "$WEIGHTS/football-pitch-detection.pt"  "https://drive.google.com/uc?id=1Ma5Kt86tgpdjCTKfum79YMgNnSjcoOyf"
gdown -O "$WEIGHTS/football-ball-detection.pt"   "https://drive.google.com/uc?id=1isw4wx-MK9h9LMr36VvIWlJD6ppUvw7V"

echo "weights in $WEIGHTS"
