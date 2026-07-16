"""Fit analysis (Stage 2.6).

Given the user's estimated body measurements and a garment's declared size
chart + declared `fit_type`, derive a structured Fit Analysis object:

  - estimated_fit: true_to_size | runs_small | runs_large
  - sleeve_note / waist_note: short human-readable explanations
  - recommended_size: best-matching size label from the chart
  - style_match_pct: 0–100 how closely the body matches the garment's
    intended fit (lower when the garment runs small/large for the body)

Pure, deterministic, unit-testable. No ML.
"""
from __future__ import annotations

from .. import schemas as s


# Metric keys we compare against the size chart.
_BODY_KEYS = ("chest_cm", "waist_cm", "hip_cm")


def analyze_fit(
    measurements: s.MeasurementsResponse,
    metadata: s.GarmentMetadata,
) -> s.FitAnalysis:
    chart = metadata.size_chart or {}
    if not chart:
        # No chart: fall back to a generic fit_type statement.
        return s.FitAnalysis(
            estimated_fit=_from_fit_type(metadata.fit_type),
            sleeve_note="No size chart provided; using declared fit type.",
            waist_note="",
            recommended_size=metadata.size,
            style_match_pct=70.0,
        )

    best_label, best_signed, best_pct = None, None, 0.0
    for label, spec in chart.items():
        signed = 0.0
        n = 0
        for key in _BODY_KEYS:
            body_val = getattr(measurements, key, None)
            chart_val = spec.get(key)
            if body_val is None or chart_val is None:
                continue
            # Positive => body larger than chart (garment will fit tight).
            signed += body_val - chart_val
            n += 1
        if n == 0:
            continue
        avg_signed = signed / n
        avg_abs = abs(avg_signed)
        # 100% match at 0cm diff, ~0% at 12cm+ avg diff.
        pct = max(0.0, 100.0 - (avg_abs / 12.0) * 100.0)
        if best_signed is None or avg_abs < abs(best_signed):
            best_signed = avg_signed
            best_label = label
            best_pct = pct

    estimated_fit = _classify(best_signed)
    sleeve_note, waist_note = _notes(measurements, chart.get(best_label, {}), metadata.fit_type)

    return s.FitAnalysis(
        estimated_fit=estimated_fit,
        sleeve_note=sleeve_note,
        waist_note=waist_note,
        recommended_size=best_label,
        style_match_pct=round(best_pct, 1),
    )


def _classify(avg_signed: float | None) -> str:
    if avg_signed is None:
        return "true_to_size"
    if abs(avg_signed) <= 3.0:
        return "true_to_size"
    # Positive avg_signed => body is larger than the closest size => the
    # garment runs small (fits tight) for this body. Negative => runs large.
    return "runs_small" if avg_signed > 0 else "runs_large"


def _from_fit_type(fit: s.FitType) -> str:
    return {
        s.FitType.slim: "runs_small",
        s.FitType.regular: "true_to_size",
        s.FitType.oversized: "runs_large",
    }[fit]


def _notes(
    m: s.MeasurementsResponse, spec: dict, fit: s.FitType
) -> tuple[str, str]:
    sleeve_note = ""
    waist_note = ""
    chart_waist = spec.get("waist_cm")
    if chart_waist is not None and m.waist_cm:
        diff = m.waist_cm - chart_waist
        if diff > 4:
            waist_note = "Runs slightly snug at the waist for your measurements."
        elif diff < -4:
            waist_note = "Roomy at the waist; consider sizing down."
        else:
            waist_note = "Waist sits true to your measurements."
    if fit == s.FitType.oversized:
        sleeve_note = "Intentionally relaxed/oversized cut."
    elif fit == s.FitType.slim:
        sleeve_note = "Slim cut — size up if between sizes."
    else:
        sleeve_note = "Standard sleeve length."
    return sleeve_note, waist_note
