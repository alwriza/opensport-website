"""Diagnostic (temporary): which import in T-DEED's inference.py changes torch's thread count?

    cd $TDEED_DIR && python3 <this file>

Imports in the same order as inference.py and prints torch.get_num_threads() after each.
"""

import importlib
import os
import sys

sys.path.insert(0, os.getcwd())
import torch  # noqa: E402

print("torch", torch.get_num_threads(), flush=True)
for name in ["argparse", "numpy", "random", "torch.utils.data", "wandb", "util.io", "model.model", "util.eval", "dataset.frame", "util.dataset"]:
    importlib.import_module(name)
    print(f"after {name}: {torch.get_num_threads()}", flush=True)
