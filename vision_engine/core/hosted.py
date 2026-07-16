"""Hosted-inference provider abstraction.

Heavy models (try-on diffusion, SAM2, Real-ESRGAN, etc.) are best run on a
hosted endpoint when one is reasonably available. This module is the single
integration point; each pipeline module calls `get_hosted_provider()` and,
if a provider is configured, delegates the work via a typed method.

Only a Replicate-style HTTP client is implemented. Extend the `_dispatch`
switch to add fal.ai / HF / RunPod without touching the pipeline modules.
"""
from __future__ import annotations

import os

import httpx

from ..config import get_settings


class HostedProvider:
    """Minimal Replicate-style hosted inference client."""

    def __init__(self, provider: str, api_key: str, endpoint: str = "") -> None:
        self.provider = provider
        self.api_key = api_key
        self.endpoint = endpoint

    @property
    def available(self) -> bool:
        return bool(self.api_key)

    def run(self, model_ref: str, input: dict, *, timeout: float = 120.0) -> dict:
        """Run a prediction against a Replicate-style endpoint.

        `model_ref` is the published model id (e.g. "owner/model:version").
        Returns the parsed output dict. Raises `httpx.HTTPError` on transport
        failures so callers can fall back or map to a `ModelTimeoutError`.
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Prefer": "wait",
        }
        url = self.endpoint or f"https://api.replicate.com/v1/models/{model_ref}/predictions"
        resp = httpx.post(url, headers=headers, json={"input": input}, timeout=timeout)
        resp.raise_for_status()
        data = resp.json()
        # Replicate returns output either inline (Prefer: wait) or as a poll URL.
        if isinstance(data.get("output"), dict) and "error" in data["output"]:
            raise RuntimeError(data["output"]["error"])
        return data


_provider: HostedProvider | None = None


def get_hosted_provider() -> HostedProvider | None:
    """Return a configured hosted provider, or None when running local-only."""
    global _provider
    if _provider is not None:
        return _provider if _provider.available else None
    settings = get_settings()
    if settings.hosted_provider in ("none", "") or not settings.hosted_api_key:
        _provider = HostedProvider("none", "")
        return None
    _provider = HostedProvider(
        settings.hosted_provider,
        settings.hosted_api_key,
        settings.hosted_endpoint,
    )
    return _provider if _provider.available else None


def reset_provider_cache() -> None:
    global _provider
    _provider = None
