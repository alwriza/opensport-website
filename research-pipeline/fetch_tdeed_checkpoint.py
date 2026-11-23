"""Download only the SoccerNetBall_challenge1 checkpoint from the authors' Drive folder.

    python3 fetch_tdeed_checkpoint.py <T-DEED dir>

The folder holds checkpoints for every dataset; the listing is read first and only
the one file is downloaded, to <T-DEED>/checkpoints/SoccerNetBall/SoccerNetBall_challenge1/.
"""

from __future__ import annotations

import os
import sys

import gdown

from config import TDEED_CHECKPOINT_FOLDER, TDEED_MODEL

WANTED = f"{TDEED_MODEL}/checkpoint_best.pt"


def main() -> None:
    tdeed_dir = sys.argv[1]
    target = os.path.join(tdeed_dir, "checkpoints", TDEED_MODEL.split("_")[0], TDEED_MODEL, "checkpoint_best.pt")
    if os.path.isfile(target):
        print(f"checkpoint already at {target}")
        return
    files = gdown.download_folder(url=TDEED_CHECKPOINT_FOLDER, skip_download=True, quiet=True)
    matches = [f for f in files if f.path.replace("\\", "/").endswith(WANTED)]
    if len(matches) != 1:
        listing = "\n".join(f.path for f in files)
        raise RuntimeError(f"expected exactly one {WANTED} in the folder, found {len(matches)}:\n{listing}")
    os.makedirs(os.path.dirname(target), exist_ok=True)
    gdown.download(id=matches[0].id, output=target, quiet=False)
    print(f"checkpoint at {target}")


if __name__ == "__main__":
    main()
