"""Environment-driven configuration for the Vesti Vision Engine.

All values are read from environment variables (see .env.example) with sensible
local defaults. No secrets are hardcoded.
"""
from __future__ import annotations

import os
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="VISION_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Service ---
    app_name: str = "Vesti Vision Engine"
    host: str = "0.0.0.0"
    port: int = 8100
    log_level: str = "info"

    # --- CORS (comma-separated origins; "*" allows all) ---
    cors_origins: str = "http://localhost:3000,http://localhost:8000"

    # --- Model artifacts (paths on disk) ---
    models_dir: str = "./models"
    detect_model_path: str = "./models/detection.onnx"
    pose_model_path: str = "./models/pose.onnx"
    parse_model_path: str = "./models/parsing.onnx"
    garment_seg_model_path: str = "./models/garment_segment.onnx"
    tryon_model_path: str = "./models/tryon.onnx"
    enhance_model_path: str = "./models/enhance.onnx"

    # --- Hosted-inference providers (keys only — never log these) ---
    # e.g. Replicate, fal.ai, Hugging Face Inference, RunPod, etc.
    hosted_provider: str = "none"  # none | replicate | fal | hf | runpod
    hosted_api_key: str = ""
    hosted_endpoint: str = ""

    # --- Device selection ---
    device: str = "cpu"  # cpu | cuda | mps

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_mock_mode(self) -> bool:
        """True while real model artifacts are absent (Stage 0 scaffolding)."""
        return self.hosted_provider in ("none", "") and not os.path.exists(
            self.detect_model_path
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
