"""Put the worker modules on sys.path so the flat module layout imports under pytest."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
