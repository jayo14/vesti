"""Vesti Vision Engine — FastAPI application (Stage 0 scaffolding).

This service hosts the computer-vision pipeline (detection, pose, parsing,
measurements, garment segmentation, try-on, enhancement, recommendation).

Stage 0 only wires the API surface + schemas + deterministic mock responses so
the Django backend and frontend can integrate against a stable contract. No ML
models are loaded yet.
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from . import schemas as s

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Computer-vision pipeline for Vesti. Stage 0: contracts + mock responses.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> JSONResponse:
    return JSONResponse(
        {
            "status": "ok",
            "service": settings.app_name,
            "mock_mode": settings.is_mock_mode,
            "device": settings.device,
        }
    )


@app.post("/v1/detect", response_model=s.DetectResponse)
def detect(req: s.DetectRequest) -> s.DetectResponse:
    return s.DetectResponse(
        boxes=[
            s.BoundingBox(
                label="person",
                confidence=0.98,
                x_min=0.12,
                y_min=0.08,
                x_max=0.88,
                y_max=0.96,
            )
        ]
    )


@app.post("/v1/pose", response_model=s.PoseResponse)
def pose(req: s.PoseRequest) -> s.PoseResponse:
    # 33 MediaPipe landmarks laid out on a centered standing figure.
    landmarks = [
        s.Landmark(x=0.5, y=0.05 + i * 0.025, z=0.0, visibility=0.95)
        for i in range(33)
    ]
    return s.PoseResponse(landmarks=landmarks, confidence=0.95)


@app.post("/v1/parse", response_model=s.ParseResponse)
def parse(req: s.ParseRequest) -> s.ParseResponse:
    return s.ParseResponse(
        mask_image_url=None,
        regions=[
            s.ParseRegion(region="hair", confidence=0.97),
            s.ParseRegion(region="face", confidence=0.98),
            s.ParseRegion(region="upper_cloth", confidence=0.96),
            s.ParseRegion(region="lower_cloth", confidence=0.95),
            s.ParseRegion(region="left_arm", confidence=0.93),
            s.ParseRegion(region="right_arm", confidence=0.93),
            s.ParseRegion(region="left_leg", confidence=0.94),
            s.ParseRegion(region="right_leg", confidence=0.94),
            s.ParseRegion(region="skin", confidence=0.90),
        ],
    )


@app.post("/v1/measurements", response_model=s.MeasurementsResponse)
def measurements(req: s.MeasurementsRequest) -> s.MeasurementsResponse:
    # Plausible fake numbers for a ~170cm silhouette.
    return s.MeasurementsResponse(
        shoulder_width_cm=41.0,
        chest_cm=96.0,
        waist_cm=80.0,
        hip_cm=98.0,
        arm_length_cm=62.0,
        leg_length_cm=84.0,
        confidence=0.91,
    )


@app.post("/v1/garment/segment", response_model=s.GarmentSegmentResponse)
def garment_segment(req: s.GarmentSegmentRequest) -> s.GarmentSegmentResponse:
    garment_type = (req.prompt or "garment").strip().lower() or "garment"
    return s.GarmentSegmentResponse(
        cutout_image_url=None,
        garment_type=garment_type,
        bounding_polygon=[
            s.PolygonPoint(x=0.2, y=0.1),
            s.PolygonPoint(x=0.8, y=0.1),
            s.PolygonPoint(x=0.85, y=0.9),
            s.PolygonPoint(x=0.15, y=0.9),
        ],
        confidence=0.94,
    )


@app.post("/v1/tryon", response_model=s.TryOnResponse)
def tryon(req: s.TryOnRequest) -> s.TryOnResponse:
    return s.TryOnResponse(result_image_url=None, fit_confidence=0.88)


@app.post("/v1/enhance", response_model=s.EnhanceResponse)
def enhance(req: s.EnhanceRequest) -> s.EnhanceResponse:
    return s.EnhanceResponse(enhanced_image_url=None, scale=req.scale)


@app.post("/v1/recommend", response_model=s.RecommendResponse)
def recommend(req: s.RecommendRequest) -> s.RecommendResponse:
    ids = [item.id for item in req.wardrobe]
    outfits = [
        s.OutfitSuggestion(
            title=f"{req.occasion.title()} look",
            rationale=(
                f"A {req.dress_code} outfit tuned for {req.weather} weather, "
                f"built from {len(ids)} wardrobe item(s)."
            ),
            wardrobe_item_ids=ids[: min(3, len(ids))],
            marketplace_suggestions=(
                [{"productId": "p1", "reason": "Completes the silhouette."}]
                if req.marketplace_suggestions
                else []
            ),
            styling_tips=[
                "Layer for warmth if the temperature drops.",
                "Keep accessories minimal to let the outfit breathe.",
            ],
        )
    ]
    return s.RecommendResponse(outfits=outfits)
