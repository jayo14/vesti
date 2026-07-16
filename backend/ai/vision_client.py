"""Client for the Vesti vision_engine CV pipeline.

Wraps the Stage-2 FastAPI service (default VISION_ENGINE_URL) so the Django
backend can orchestrate the try-on sequence: detect -> pose -> parse ->
measurements -> garment segment -> tryon -> enhance.

Each method raises `VisionEngineError` (with a user-facing `message`/`hint`
and an HTTP `status`) when the pipeline rejects input or times out, so the
caller can surface a clear message instead of a generic 500.
"""
from __future__ import annotations

import requests
from django.conf import settings


class VisionEngineError(Exception):
    """Raised when vision_engine returns an error or is unreachable.

    ``code`` is a stable machine-readable identifier (e.g. ``no_person_detected``,
    ``model_timeout``) that survives all the way to persistence so the admin
    AI-health dashboard can group failures without parsing free-text messages.
    """

    def __init__(
        self,
        message: str,
        *,
        status: int = 502,
        hint: str | None = None,
        code: str | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status = status
        self.hint = hint
        self.code = code or "unknown"


def _base() -> str:
    return settings.VISION_ENGINE_URL.rstrip("/")


def _image_field(value: str) -> dict:
    """Map a data URL or remote URL to the vision_engine ImageInput shape."""
    if value.startswith("data:"):
        return {"image_base64": value}
    return {"image_url": value}


def _call(path: str, payload: dict, timeout: int = 120) -> dict:
    url = f"{_base()}{path}"
    try:
        resp = requests.post(url, json=payload, timeout=timeout)
    except requests.RequestException as exc:
        raise VisionEngineError(
            "The vision service is unreachable. Please try again shortly.",
            status=503,
            hint="The image-processing service may be starting up.",
            code="pipeline_unreachable",
        ) from exc

    if resp.ok:
        return resp.json()

    # Map pipeline errors (they return JSON {error, code, message, hint}).
    try:
        body = resp.json()
    except ValueError:
        body = {}
    code = body.get("code") or "unknown"
    message = body.get("message") or body.get("detail") or f"Vision pipeline error ({resp.status_code})."
    hint = body.get("hint")
    status = resp.status_code if 400 <= resp.status_code < 500 else 502
    # Map well-known codes to friendlier copy.
    if code == "no_person_detected":
        message = "We couldn't find a person in your photo."
        hint = "Upload a clear, full-body photo with one person in frame."
        status = 422
    elif code == "multiple_people":
        message = "Please use a photo with only one person."
        hint = "Multi-person try-on isn't supported yet."
        status = 422
    elif code == "low_pose_confidence":
        message = "We couldn't read your pose clearly."
        hint = "Try a clearer full-body photo with arms and legs visible."
        status = 422
    elif code == "segmentation_failed":
        message = "We couldn't isolate the garment."
        hint = "Upload the garment on a plain background with good lighting."
        status = 422
    elif code in ("model_unavailable", "model_timeout"):
        hint = hint or "The image model is temporarily busy. Please try again."
        status = 503 if code == "model_unavailable" else 504
    raise VisionEngineError(message, status=status, hint=hint, code=code)


def detect(person_image: str) -> dict:
    return _call("/v1/detect", _image_field(person_image))


def pose(person_image: str) -> dict:
    return _call("/v1/pose", _image_field(person_image))


def parse(person_image: str) -> dict:
    return _call("/v1/parse", _image_field(person_image))


def measurements(landmarks: list, height_cm: float, parsing_mask: str | None = None) -> dict:
    payload: dict = {"landmarks": landmarks, "height_cm": height_cm}
    if parsing_mask:
        payload["parsing_mask"] = parsing_mask
    return _call("/v1/measurements", payload)


def garment_segment(garment_image: str, prompt: str | None = None) -> dict:
    payload = _image_field(garment_image)
    if prompt:
        payload["prompt"] = prompt
    return _call("/v1/garment/segment", payload)


def tryon(
    person_image: str,
    garment_cutout: str,
    measurements_payload: dict,
    garment_metadata: dict,
) -> dict:
    payload = {
        "person_image": _image_field(person_image),
        "garment_cutout": _image_field(garment_cutout),
        "measurements": measurements_payload,
        "garment_metadata": garment_metadata,
    }
    return _call("/v1/tryon", payload, timeout=180)


def enhance(image: str, scale: int = 2) -> dict:
    payload = _image_field(image)
    payload["scale"] = scale
    return _call("/v1/enhance", payload)
