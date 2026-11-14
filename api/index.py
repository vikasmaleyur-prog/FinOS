"""
Vercel Serverless Function Entry Point for FinOS API
"""

try:
    from api.main import app
except ImportError:
    from main import app

__all__ = ["app"]
