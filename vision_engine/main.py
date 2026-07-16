"""Vesti Vision Engine — FastAPI application (Stage 2).

Hosts the computer-vision pipeline (detection, pose, parsing, measurements,
garment segmentation, try-on, enhancement). Each route delegates to a module
under this package that (1) uses a hosted inference provider when configured,
(2) runs a local self-hosted model when its deps are present, or (3) returns a
clean error payload (never a raw 500) via `VisionError`.

The previous Stage-0 mock responses are removed; the pipeline now requires a
real backend (hosted or local). `app` still reports `mock_mode` only when both
the hosted provider and local models are absent — in which case routes return
503/422 with actionable hints.
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .core.errors import VisionError, vision_exception_handler
from . import schemas as s

from .detection import detect as _detect
from .pose import pose as _pose
from .parsing import parse as _parse
from .measurements import from_request as _measure
from .garments import segment as _segment
from .tryon import tryon as _tryon
from .enhancement import enhance as _enhance

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.2.0",
    description="Computer-vision pipeline for Vesti. Stage 2: real model wiring with graceful degradation.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(VisionError, vision_exception_handler)


@app.get("/health")
def health() -> JSONResponse:
    return JSONResponse(
        {
            "status": "ok",
            "service": settings.app_name,
            "mock_mode": settings.is_mock_mode,
            "device": settings.device,
            "hosted_provider": settings.hosted_provider,
        }
    )


@app.post("/v1/detect", response_model=s.DetectResponse)
def detect(req: s.DetectRequest) -> s.DetectResponse:
    return _detect(req)


@app.post("/v1/pose", response_model=s.PoseResponse)
def pose(req: s.PoseRequest) -> s.PoseResponse:
    return _pose(req)


@app.post("/v1/parse", response_model=s.ParseResponse)
def parse(req: s.ParseRequest) -> s.ParseResponse:
    return _parse(req)


@app.post("/v1/measurements", response_model=s.MeasurementsResponse)
def measurements(req: s.MeasurementsRequest) -> s.MeasurementsResponse:
    return _measure(req)


@app.post("/v1/garment/segment", response_model=s.GarmentSegmentResponse)
def garment_segment(req: s.GarmentSegmentRequest) -> s.GarmentSegmentResponse:
    return _segment(req)


@app.post("/v1/tryon", response_model=s.TryOnResponse)
def tryon(req: s.TryOnRequest) -> s.TryOnResponse:
    return _tryon(req)


@app.post("/v1/enhance", response_model=s.EnhanceResponse)
def enhance(req: s.EnhanceRequest) -> s.EnhanceResponse:
    return _enhance(req)
