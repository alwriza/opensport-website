"""Make T-DEED's inference run on the device in $DEVICE (cuda or cpu).

    python3 patch_tdeed.py <T-DEED dir>

Upstream hard-codes CUDA in three places. Each edit is an exact replacement at the
pinned commit (config.TDEED_SHA); if the text is not there, this stops instead of
guessing. Running it twice is fine: an already patched file is left as is.
"""

from __future__ import annotations

import os
import sys

EDITS = {
    "inference.py": [
        (
            "    model = TDEEDModel(args=args)\n",
            "    model = TDEEDModel(device=os.environ['DEVICE'], args=args)\n",
        ),
        (
            "    model.load(torch.load(os.path.join(\n"
            "        os.getcwd(), 'checkpoints', args.model.split('_')[0], args.model, 'checkpoint_best.pt')))\n",
            "    model.load(torch.load(os.path.join(\n"
            "        os.getcwd(), 'checkpoints', args.model.split('_')[0], args.model, 'checkpoint_best.pt'),\n"
            "        map_location=os.environ['DEVICE']))\n",
        ),
    ],
    "model/model.py": [
        (
            "            self._pred_fine = self._pred_fine.cuda()\n",
            "            self._pred_fine = self._pred_fine.to(__import__('os').environ['DEVICE'])\n",
        ),
    ],
}


def main() -> None:
    tdeed_dir = sys.argv[1]
    for rel, edits in EDITS.items():
        path = os.path.join(tdeed_dir, rel)
        with open(path) as f:
            text = f.read()
        for old, new in edits:
            if new in text:
                continue
            if text.count(old) != 1:
                raise RuntimeError(f"{rel}: expected text not found exactly once; is T-DEED at the pinned commit?\n{old}")
            text = text.replace(old, new)
        with open(path, "w") as f:
            f.write(text)
    print("T-DEED patched for $DEVICE")


if __name__ == "__main__":
    main()
