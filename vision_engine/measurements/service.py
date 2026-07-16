"""Body measurements estimator (Stage 2.4).

Pure geometric estimator — no ML. Given 33 MediaPipe pose landmarks, an
optional parsing mask, and a user-declared `height_cm`, it:

  1. Computes the person's pixel height from the head (landmark 0) to the
     ankle (landmark 27/28) and derives a cm-per-pixel scale.
  2. Converts landmark pixel distances into cm for shoulder width, arm
     length, leg length.
  3. Uses the parsing mask's regional widths (torso at chest level, hip level)
     scaled by the same factor to estimate chest / waist / hip *circumference*
     (with a body-depth assumption, clearly flagged as estimates).
  4. Returns every value with an aggregate confidence score.

Nothing is persisted (stateless). Circumferences are estimates, not lab
measurements — the response flags `estimated=True`.
"""
from __future__ import annotations

from dataclasses import dataclass

from .. import schemas as s


# MediaPipe Pose landmark indices.
_NOSE, _L_SHOULDER, _R_SHOULDER = 0, 11, 12
_L_ELBOW, _L_WRIST = 13, 15
_R_ELBOW, _R_WRIST = 14, 16
_L_HIP, _R_HIP = 23, 24
_L_KNEE, _L_ANKLE = 25, 27
_R_KNEE, _R_ANKLE = 26, 28
_L_HEEL, _R_HEEL = 29, 31


def _px(lm: s.Landmark) -> tuple[float, float]:
    return lm.x, lm.y


def _dist(a: s.Landmark, b: s.Landmark) -> float:
    import math

    return math.hypot(a.x - b.x, a.y - b.y)


@dataclass
class MaskRegions:
    """Pixel-space widths/heights extracted from the parsing mask."""

    torso_width_px: float = 0.0
    hip_width_px: float = 0.0
    image_height_px: int = 1


def estimate(
    landmarks: list[s.Landmark],
    height_cm: float,
    mask_regions: MaskRegions | None = None,
) -> s.MeasurementsResponse:
    """Run the full estimator. `landmarks` are normalized 0–1 (MediaPipe)."""
    if len(landmarks) < 33:
        raise ValueError("Expected 33 pose landmarks.")

    # --- Pixel height: nose to the lower of the two heels -----------------
    head = landmarks[_NOSE]
    heel_l = landmarks[_L_HEEL]
    heel_r = landmarks[_R_HEEL]
    ankle_l = landmarks[_L_ANKLE]
    ankle_r = landmarks[_R_ANKLE]
    heel_y = max(heel_l.y, heel_r.y, ankle_l.y, ankle_r.y)
    pixel_height = max(heel_y - head.y, 1e-3)
    scale = height_cm / pixel_height  # cm per normalized unit

    # --- Direct limb/shoulder lengths ------------------------------------
    shoulder_width = _dist(landmarks[_L_SHOULDER], landmarks[_R_SHOULDER]) * scale
    arm_len_l = (_dist(landmarks[_L_SHOULDER], landmarks[_L_ELBOW]) + _dist(landmarks[_L_ELBOW], landmarks[_L_WRIST])) * scale
    arm_len_r = (_dist(landmarks[_R_SHOULDER], landmarks[_R_ELBOW]) + _dist(landmarks[_R_ELBOW], landmarks[_R_WRIST])) * scale
    arm_length = (arm_len_l + arm_len_r) / 2
    leg_len_l = (_dist(landmarks[_L_HIP], landmarks[_L_KNEE]) + _dist(landmarks[_L_KNEE], landmarks[_L_ANKLE])) * scale
    leg_len_r = (_dist(landmarks[_R_HIP], landmarks[_R_KNEE]) + _dist(landmarks[_R_KNEE], landmarks[_R_ANKLE])) * scale
    leg_length = (leg_len_l + leg_len_r) / 2

    # --- Circumferences from mask widths (estimate) ----------------------
    # Heuristic: circumference ≈ width * π * body_ratio, with body_ratio
    # accounting for how much of the body cross-section the frontal width
    # represents. Flagged as estimates via separate field.
    BODY_RATIO = 1.6  # torso/hip depth relative to frontal width
    if mask_regions is not None and mask_regions.image_height_px:
        m_scale = height_cm / mask_regions.image_height_px
        chest_cm = mask_regions.torso_width_px * m_scale * 3.14159 * BODY_RATIO
        waist_cm = (mask_regions.torso_width_px * 0.82) * m_scale * 3.14159 * BODY_RATIO
        hip_cm = mask_regions.hip_width_px * m_scale * 3.14159 * BODY_RATIO
    else:
        # Fallback: derive from shoulder/hip landmark spread with a typical
        # aspect ratio. Marked lower confidence.
        hip_width = _dist(landmarks[_L_HIP], landmarks[_R_HIP]) * scale
        chest_cm = shoulder_width * 2.4
        waist_cm = shoulder_width * 2.0
        hip_cm = max(hip_width * 3.14159 * BODY_RATIO, shoulder_width * 2.5)

    # --- Confidence -------------------------------------------------------
    vis = [landmarks[i].visibility for i in (_L_SHOULDER, _R_SHOULDER, _L_HIP, _R_HIP, _L_KNEE, _R_KNEE)]
    confidence = round(min(vis + [1.0 if mask_regions else 0.82]), 4)

    return s.MeasurementsResponse(
        shoulder_width_cm=round(shoulder_width, 1),
        chest_cm=round(chest_cm, 1),
        waist_cm=round(waist_cm, 1),
        hip_cm=round(hip_cm, 1),
        arm_length_cm=round(arm_length, 1),
        leg_length_cm=round(leg_length, 1),
        confidence=confidence,
        model="geometric-estimator",
        estimated=True,
    )


def from_request(req: s.MeasurementsRequest) -> s.MeasurementsResponse:
    """Convert an API request (with optional parsing-mask base64) to a result."""
    mask = None
    if isinstance(req.parsing_mask, str) and req.parsing_mask:
        mask = _mask_regions_from_base64(req.parsing_mask)
    elif isinstance(req.parsing_mask, list):
        # Precomputed regions supplied; we can't derive pixel widths, so skip.
        mask = None
    return estimate(req.landmarks, req.height_cm, mask)


def _mask_regions_from_base64(b64: str) -> MaskRegions | None:
    from ..core.image import load_image

    img = load_image(None, b64)
    w, h = img.size
    # The parsing mask is a palette/label image: torso around y=0.35, hips
    # around y=0.55. We measure the horizontal extent of foreground (region
    # id != 0) at those bands as a proxy for body width.
    import numpy as np

    arr = np.asarray(img.convert("P")) if img.mode == "P" else np.asarray(img.convert("L"))
    fg = arr > 0
    torso_band = fg[int(h * 0.30): int(h * 0.42), :]
    hip_band = fg[int(h * 0.50): int(h * 0.62), :]
    torso_width = float(torso_band.any(axis=0).sum())
    hip_width = float(hip_band.any(axis=0).sum())
    return MaskRegions(torso_width_px=torso_width, hip_width_px=hip_width, image_height_px=h)
