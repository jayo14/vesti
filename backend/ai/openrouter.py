"""Python client for OpenRouter GPT-4o chat completions.

Used server-side by the Django AI views (OutfitRecommend, StylingSuggestions,
SmartSearch) to generate LLM-backed responses grounded in real data.
"""
from __future__ import annotations

import json
import logging
import re

import requests
from django.conf import settings

logger = logging.getLogger("ai.openrouter")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


def _api_key() -> str:
    key = settings.OPENROUTER_API_KEY
    if not key:
        raise RuntimeError("OPENROUTER_API_KEY not configured on the server.")
    return key


def chat(
    messages: list[dict],
    model: str = "openai/gpt-4o",
    max_tokens: int = 2048,
    temperature: float = 0.7,
) -> str:
    """Send a chat completion request to OpenRouter and return the text."""
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    try:
        resp = requests.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {_api_key()}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=90,
        )
        resp.raise_for_status()
        data = resp.json()
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return (text or "").strip()
    except requests.RequestException as exc:
        logger.error("OpenRouter request failed: %s", exc)
        raise RuntimeError("AI service is temporarily unavailable.") from exc


def chat_json(
    messages: list[dict],
    model: str = "openai/gpt-4o",
    max_tokens: int = 2048,
    temperature: float = 0.5,
) -> dict:
    """Call chat and parse the response as JSON, with markdown fence fallback."""
    raw = chat(messages, model=model, max_tokens=max_tokens, temperature=temperature)
    cleaned = raw
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try to extract a JSON array or object
        match = re.search(r"(\[[\s\S]*\]|\{[\s\S]*\})", cleaned)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
        logger.warning("OpenRouter response was not valid JSON: %.200s", raw)
        return {}
