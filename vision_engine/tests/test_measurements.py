"""Tests for the geometric measurements estimator (Stage 2.4)."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from vision_engine import schemas as s
from vision_engine.measurements.service import estimate, MaskRegions


def _standing_pose() -> list[s.Landmark]:
    def L(x, y, v=0.99):
        return s.Landmark(x=x, y=y, z=0.0, visibility=v)

    lm = [L(0.5, 0.05)] * 33
    lm[11] = L(0.37, 0.30)
    lm[12] = L(0.63, 0.30)
    lm[13] = L(0.30, 0.44)
    lm[14] = L(0.70, 0.44)
    lm[15] = L(0.24, 0.56)
    lm[16] = L(0.76, 0.56)
    lm[23] = L(0.40, 0.56)
    lm[24] = L(0.60, 0.56)
    lm[25] = L(0.40, 0.74)
    lm[26] = L(0.60, 0.74)
    lm[27] = L(0.40, 0.94)
    lm[28] = L(0.60, 0.94)
    lm[29] = L(0.40, 0.98)
    lm[31] = L(0.60, 0.98)
    return lm


def test_plausible_for_170cm():
    r = estimate(_standing_pose(), 170.0)
    # Absolute spot-check against a typical adult (values are estimates).
    assert 34 <= r.shoulder_width_cm <= 50
    assert 55 <= r.chest_cm <= 115
    assert 55 <= r.waist_cm <= 110
    assert 55 <= r.hip_cm <= 120
    assert 40 <= r.arm_length_cm <= 75
    assert 60 <= r.leg_length_cm <= 100
    assert 0.0 <= r.confidence <= 1.0
    assert r.estimated is True


def test_scales_with_height():
    short = estimate(_standing_pose(), 150.0)
    tall = estimate(_standing_pose(), 190.0)
    assert tall.leg_length_cm > short.leg_length_cm
    assert tall.shoulder_width_cm > short.shoulder_width_cm


def test_mask_aware_uses_region_widths():
    pose = _standing_pose()
    mask = MaskRegions(torso_width_px=120, hip_width_px=150, image_height_px=1000)
    r = estimate(pose, 170.0, mask)
    assert r.chest_cm > 0 and r.hip_cm > 0
    assert r.confidence >= 0.99


def test_low_visibility_lowers_confidence():
    pose = _standing_pose()
    pose[11] = s.Landmark(x=0.37, y=0.30, z=0.0, visibility=0.3)
    pose[12] = s.Landmark(x=0.63, y=0.30, z=0.0, visibility=0.3)
    r = estimate(pose, 170.0)
    assert r.confidence <= 0.3
