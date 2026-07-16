"""Pydantic request/response contracts for the Vesti Vision Engine.

Scaffolding stage (Stage 0): these models define the full API surface. Route
handlers in `main.py` return deterministic mock responses that validate against
these schemas. Real model logic is wired in later stages.
"""
from __future__ import annotations

from enum import Enum
from typing import Literal, Optional, Union

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Shared input helpers
# ---------------------------------------------------------------------------
class ImageInput(BaseModel):
    """One of `image_url` (remote) or `image_base64` (data URL or raw base64)."""

    image_url: Optional[str] = Field(
        None, description="Publicly reachable URL of the source image."
    )
    image_base64: Optional[str] = Field(
        None,
        description="Base64-encoded image. May include the `data:image/...;base64,` prefix.",
    )

    def model_post_init(self, __context) -> None:  # noqa: D401
        if not self.image_url and not self.image_base64:
            raise ValueError("Provide either image_url or image_base64.")


# ---------------------------------------------------------------------------
# /v1/detect
# ---------------------------------------------------------------------------
class BoundingBox(BaseModel):
    label: str = Field(..., description="Detected object class, e.g. 'person'.")
    confidence: float = Field(..., ge=0.0, le=1.0)
    x_min: float = Field(..., ge=0.0, le=1.0, description="Normalized 0–1.")
    y_min: float = Field(..., ge=0.0, le=1.0)
    x_max: float = Field(..., ge=0.0, le=1.0)
    y_max: float = Field(..., ge=0.0, le=1.0)


class DetectRequest(ImageInput):
    pass


class DetectResponse(BaseModel):
    boxes: list[BoundingBox]
    model: str = Field("stub-detector", description="Backend that produced this result.")


# ---------------------------------------------------------------------------
# /v1/pose
# ---------------------------------------------------------------------------
class Landmark(BaseModel):
    x: float = Field(..., ge=0.0, le=1.0, description="Normalized 0–1.")
    y: float = Field(..., ge=0.0, le=1.0)
    z: float = Field(0.0, description="Relative depth (MediaPipe convention).")
    visibility: float = Field(..., ge=0.0, le=1.0)


class PoseRequest(ImageInput):
    model_config = {"extra": "allow"}


class PoseResponse(BaseModel):
    # 33 MediaPipe Pose landmarks
    landmarks: list[Landmark] = Field(..., min_length=33, max_length=33)
    confidence: float = Field(..., ge=0.0, le=1.0)
    model: str = "stub-pose"


# ---------------------------------------------------------------------------
# /v1/parse  (human parsing)
# ---------------------------------------------------------------------------
class ParseRegion(BaseModel):
    region: str = Field(..., description="e.g. 'hair', 'upper_cloth', 'left_leg'.")
    confidence: float = Field(..., ge=0.0, le=1.0)


class ParseRequest(ImageInput):
    model_config = {"extra": "allow"}


class ParseResponse(BaseModel):
    mask_image_url: Optional[str] = Field(
        None, description="URL or data URL of the per-pixel segment mask."
    )
    mask_base64: Optional[str] = None
    regions: list[ParseRegion]
    model: str = "stub-parsing"


# ---------------------------------------------------------------------------
# /v1/measurements
# ---------------------------------------------------------------------------
class MeasurementsRequest(BaseModel):
    landmarks: list[Landmark] = Field(..., min_length=33, max_length=33)
    parsing_mask: Optional[Union[str, list[ParseRegion]]] = Field(
        None, description="Mask URL/base64 or precomputed region list."
    )
    height_cm: float = Field(..., gt=0, description="Declared user height in cm.")


class MeasurementsResponse(BaseModel):
    shoulder_width_cm: float
    chest_cm: float
    waist_cm: float
    hip_cm: float
    arm_length_cm: float
    leg_length_cm: float
    confidence: float = Field(..., ge=0.0, le=1.0)
    estimated: bool = Field(
        True,
        description="True for all MVP results: circumferences are geometric estimates, not lab measurements.",
    )
    model: str = "stub-measurements"


# ---------------------------------------------------------------------------
# /v1/garment/segment
# ---------------------------------------------------------------------------
class PolygonPoint(BaseModel):
    x: float = Field(..., ge=0.0, le=1.0)
    y: float = Field(..., ge=0.0, le=1.0)


class GarmentSegmentRequest(ImageInput):
    prompt: Optional[str] = Field(
        None, description="Optional text prompt, e.g. 'hoodie', to guide segmentation."
    )


class GarmentSegmentResponse(BaseModel):
    cutout_image_url: Optional[str] = None
    cutout_base64: Optional[str] = None
    garment_type: str = Field(..., description="e.g. 'hoodie', 'dress', 'trousers'.")
    bounding_polygon: list[PolygonPoint]
    confidence: float = Field(..., ge=0.0, le=1.0)
    model: str = "stub-garment-seg"


# ---------------------------------------------------------------------------
# /v1/tryon
# ---------------------------------------------------------------------------
class FitType(str, Enum):
    slim = "slim"
    regular = "regular"
    oversized = "oversized"


class GarmentMetadata(BaseModel):
    material: Optional[str] = None
    fit_type: FitType = FitType.regular
    size: Optional[str] = None
    size_chart: Optional[dict] = Field(
        None,
        description="Optional declared size chart, e.g. {'S': {'chest_cm': 92, 'waist_cm': 76}, ...}.",
    )


class FitAnalysis(BaseModel):
    estimated_fit: Literal["true_to_size", "runs_small", "runs_large"]
    sleeve_note: str = ""
    waist_note: str = ""
    recommended_size: Optional[str] = None
    style_match_pct: float = Field(0.0, ge=0.0, le=100.0)


class TryOnRequest(BaseModel):
    person_image: ImageInput
    garment_cutout: ImageInput
    measurements: MeasurementsResponse
    garment_metadata: GarmentMetadata = Field(default_factory=GarmentMetadata)


class TryOnResponse(BaseModel):
    result_image_url: Optional[str] = None
    result_base64: Optional[str] = None
    fit_confidence: float = Field(..., ge=0.0, le=1.0)
    fit_analysis: Optional[FitAnalysis] = None
    model: str = "stub-tryon"


# ---------------------------------------------------------------------------
# /v1/enhance
# ---------------------------------------------------------------------------
class EnhanceRequest(ImageInput):
    scale: int = Field(2, ge=1, le=4, description="Upscale factor.")
    denoise: bool = True


class EnhanceResponse(BaseModel):
    enhanced_image_url: Optional[str] = None
    enhanced_base64: Optional[str] = None
    scale: int
    model: str = "stub-enhance"


# ---------------------------------------------------------------------------
# /v1/recommend
# ---------------------------------------------------------------------------
class WardrobeItem(BaseModel):
    id: str
    name: str
    category: str
    colors: list[str] = Field(default_factory=list)
    style_tags: list[str] = Field(default_factory=list)


class RecommendRequest(BaseModel):
    wardrobe: list[WardrobeItem]
    occasion: str
    weather: Literal[
        "hot", "warm", "mild", "cool", "cold", "rainy", "snowy"
    ]
    dress_code: Literal[
        "casual", "smart-casual", "business", "formal", "black-tie", "creative"
    ]
    marketplace_suggestions: bool = Field(
        True, description="Whether to include marketplace product ids in the response."
    )


class OutfitSuggestion(BaseModel):
    title: str
    rationale: str
    wardrobe_item_ids: list[str] = Field(default_factory=list)
    marketplace_suggestions: list[dict] = Field(default_factory=list)
    styling_tips: list[str] = Field(default_factory=list)


class RecommendResponse(BaseModel):
    outfits: list[OutfitSuggestion]
    model: str = "stub-recommend"
