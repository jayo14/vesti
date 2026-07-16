"""Tests for the structured Fit Analysis (Stage 2.6)."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from vision_engine import schemas as s
from vision_engine.tryon import fit


def _measurements(**kw) -> s.MeasurementsResponse:
    base = dict(
        shoulder_width_cm=42, chest_cm=96, waist_cm=80, hip_cm=98,
        arm_length_cm=62, leg_length_cm=84, confidence=0.9, estimated=True,
    )
    base.update(kw)
    return s.MeasurementsResponse(**base)


def test_true_to_size_when_match():
    m = _measurements(chest_cm=96, waist_cm=80, hip_cm=98)
    meta = s.GarmentMetadata(fit_type="regular", size_chart={"M": {"chest_cm": 96, "waist_cm": 80, "hip_cm": 98}})
    a = fit.analyze_fit(m, meta)
    assert a.estimated_fit == "true_to_size"
    assert a.recommended_size == "M"
    assert a.style_match_pct > 90


def test_runs_small_when_body_larger():
    m = _measurements(chest_cm=110, waist_cm=96, hip_cm=112)
    meta = s.GarmentMetadata(fit_type="regular", size_chart={"M": {"chest_cm": 96, "waist_cm": 80, "hip_cm": 98}})
    a = fit.analyze_fit(m, meta)
    assert a.estimated_fit == "runs_small"
    assert a.recommended_size == "M"


def test_runs_large_when_body_smaller():
    m = _measurements(chest_cm=82, waist_cm=68, hip_cm=86)
    meta = s.GarmentMetadata(fit_type="regular", size_chart={"M": {"chest_cm": 96, "waist_cm": 80, "hip_cm": 98}})
    a = fit.analyze_fit(m, meta)
    assert a.estimated_fit == "runs_large"


def test_fit_type_fallback_without_chart():
    m = _measurements()
    a = fit.analyze_fit(m, s.GarmentMetadata(fit_type="oversized"))
    assert a.estimated_fit == "runs_large"
    a2 = fit.analyze_fit(m, s.GarmentMetadata(fit_type="slim"))
    assert a2.estimated_fit == "runs_small"


def test_recommends_closest_size_from_chart():
    m = _measurements(chest_cm=90, waist_cm=74, hip_cm=92)
    chart = {
        "S": {"chest_cm": 88, "waist_cm": 72, "hip_cm": 90},
        "M": {"chest_cm": 96, "waist_cm": 80, "hip_cm": 98},
    }
    a = fit.analyze_fit(m, s.GarmentMetadata(fit_type="regular", size_chart=chart))
    assert a.recommended_size == "S"
