"""Lazy local-model loading with availability checks.

Each pipeline module declares the python packages it needs for its *local*
(self-hosted) path. Before importing heavy deps (torch, ultralytics, etc.)
we check `is_local_available()` so we can fall back to a hosted provider or
return a clean `ModelUnavailableError` instead of crashing at import time.
"""
from __future__ import annotations

import importlib
from typing import Callable


def package_present(name: str) -> bool:
    try:
        importlib.import_module(name)
        return True
    except Exception:  # noqa: BLE001
        return False


class LocalBackend:
    """Describes the local self-hosted path for a single module."""

    def __init__(self, name: str, packages: list[str], loader: Callable[[], object]) -> None:
        self.name = name
        self.packages = packages
        self._loader = loader
        self._instance: object | None = None

    @property
    def available(self) -> bool:
        return all(package_present(p) for p in self.packages)

    def load(self) -> object:
        """Load (and cache) the model instance; raises if deps are missing."""
        if not self.available:
            missing = [p for p in self.packages if not package_present(p)]
            raise RuntimeError(
                f"Local backend '{self.name}' requires missing packages: {missing}"
            )
        if self._instance is None:
            self._instance = self._loader()
        return self._instance
