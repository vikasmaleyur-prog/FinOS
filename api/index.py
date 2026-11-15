"""
Vercel Serverless Function Entrypoint for FinOS FastAPI Backend.
Exposes the ASGI app instance for Python runtime.
"""

import os
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.main import app
