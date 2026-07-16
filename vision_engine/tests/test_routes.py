"""Route smoke tests: every route degrades gracefully (no raw 500s)."""
from __future__ import annotations

import base64
import io
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from fastapi.testclient import TestClient
from PIL import Image

from vision_engine.main import app


def _b64() -> str:
    buf = io.BytesIO()
    Image.new("RGB", (4, 8), "white").save(buf, "PNG")
    return base64.b64encode(buf.getvalue()).decode()


def test_health():
    c = TestClient(app)
    assert c.get("/health").json()["status"] == "ok"


def test_measurements_returns_200():
    c = TestClient(app)
    payload = {
        "landmarks": [
            {"x": 0.5, "y": 0.05 + i * 0.025, "z": 0.0, "visibility": 0.9}
            for i in range(33)
        ],
        "height_cm": 170,
    }
    r = c.post("/v1/measurements", json=payload)
    assert r.status_code == 200
    assert r.json()["estimated"] is True


def test_ml_routes_degrade_gracefully_without_backend():
    c = TestClient(app)
    b64 = _b64()
    for name in ("detect", "pose", "garment/segment", "tryon", "enhance"):
        payload = (
            {"image_base64": b64}
            if name != "tryon"
            else {
                "person_image": {"image_base64": b64},
                "garment_cutout": {"image_base64": b64},
                "measurements": {
                    "shoulder_width_cm": 42, "chest_cm": 96, "waist_cm": 80,
                    "hip_cm": 98, "arm_length_cm": 62, "leg_length_cm": 84,
                    "confidence": 0.9, "estimated": True,
                },
                "garment_metadata": {"fit_type": "regular"},
            }
        )
        r = c.post(f"/v1/{name}", json=payload)
        assert r.status_code in (422, 503, 504), (name, r.status_code, r.text)
        assert r.json().get("error") is True
