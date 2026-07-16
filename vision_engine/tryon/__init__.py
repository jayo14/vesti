"""tryon submodule — IDM-VTON core with CatVTON fallback + fit analysis (Stage 2.6)."""
from __future__ import annotations

from .service import tryon
from . import fit

__all__ = ["tryon", "fit"]
