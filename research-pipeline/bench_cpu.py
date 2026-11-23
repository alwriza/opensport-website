"""Diagnostic (temporary): does T-DEED's backbone use more than one CPU thread?

    python3 bench_cpu.py

Times regnety_002 on 100 frames of 796x448 (one T-DEED clip) at 1, 2 and 4 torch threads.
"""

import time

import timm
import torch

model = timm.create_model("regnety_002", pretrained=False).eval()
x = torch.rand(100, 3, 448, 796)
for threads in (1, 2, 4):
    torch.set_num_threads(threads)
    with torch.no_grad():
        model.forward_features(x[:10])  # warm-up
        start = time.time()
        model.forward_features(x)
    print(f"threads={threads}: {time.time() - start:.1f} s per clip", flush=True)
