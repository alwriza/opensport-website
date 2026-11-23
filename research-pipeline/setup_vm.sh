#!/bin/bash
# One-time setup of the pipeline machine (Debian/Ubuntu). Run from this folder:
#   DEVICE=cpu ./setup_vm.sh     # or DEVICE=cuda on a GPU image with the NVIDIA driver
# Then put the variables from README.md into ~/research.env.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOME_DIR="$HOME"
VENV="$HOME_DIR/research-venv"
TDEED_DIR="$HOME_DIR/T-DEED"
WEIGHTS_DIR="$HOME_DIR/weights"

: "${DEVICE:?set DEVICE=cpu or DEVICE=cuda}"
case "$DEVICE" in
  cuda) nvidia-smi >/dev/null || { echo "DEVICE=cuda but no NVIDIA driver"; exit 1; } ;;
  cpu) ;;
  *) echo "DEVICE must be cpu or cuda, got $DEVICE"; exit 1 ;;
esac

sudo apt-get update -y
sudo apt-get install -y --no-install-recommends ffmpeg git python3-venv unzip curl

# yt-dlp needs a JavaScript runtime for YouTube.
if ! command -v deno >/dev/null; then
  curl -fsSL https://deno.land/install.sh | sh -s -- -y
  sudo ln -sf "$HOME_DIR/.deno/bin/deno" /usr/local/bin/deno
fi

python3 -m venv "$VENV"
"$VENV/bin/pip" install --upgrade pip
"$VENV/bin/pip" install -r "$DIR/requirements.txt"

# T-DEED at a pinned commit, with the SoccerNet Ball challenge checkpoint.
if [ ! -d "$TDEED_DIR" ]; then
  git clone https://github.com/arturxe2/T-DEED.git "$TDEED_DIR"
fi
git -C "$TDEED_DIR" checkout --quiet "$("$VENV/bin/python" -c 'import sys; sys.path.insert(0, "'"$DIR"'"); import config; print(config.TDEED_SHA)')"
"$VENV/bin/python" "$DIR/patch_tdeed.py" "$TDEED_DIR"
"$VENV/bin/python" "$DIR/fetch_tdeed_checkpoint.py" "$TDEED_DIR"

# Player and ball detectors (the same files ml-worker-match uses).
mkdir -p "$WEIGHTS_DIR"
"$VENV/bin/gdown" -O "$WEIGHTS_DIR/football-player-detection.pt" "https://drive.google.com/uc?id=17PXFNlx-jI7VjVo_vQnB1sONjRyvoB-q"
"$VENV/bin/gdown" -O "$WEIGHTS_DIR/football-ball-detection.pt"   "https://drive.google.com/uc?id=1isw4wx-MK9h9LMr36VvIWlJD6ppUvw7V"

if [ "$DEVICE" = cuda ]; then
  "$VENV/bin/python" -c "import torch; assert torch.cuda.is_available(), 'torch sees no GPU'; print('GPU:', torch.cuda.get_device_name(0))"
fi
echo "setup done: venv $VENV, T-DEED $TDEED_DIR, weights $WEIGHTS_DIR"
