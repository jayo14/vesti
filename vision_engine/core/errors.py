"""Shared error hierarchy for the vision pipeline.

Every route maps a `VisionError` to a clean JSON error payload (never a raw
500). The frontend can surface `detail`/`code`/`hint` directly.
"""
from __future__ import annotations

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse


class VisionError(Exception):
    """Base class for all pipeline errors.

    `status_code` is the HTTP status to return; `hint` is an optional,
    user-facing message the frontend can show (e.g. "try a clearer
    full-body photo").
    """

    status_code: int = status.HTTP_400_BAD_REQUEST
    code: str = "vision_error"

    def __init__(
        self,
        message: str,
        *,
        hint: str | None = None,
        code: str | None = None,
        status_code: int | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.hint = hint
        if code is not None:
            self.code = code
        if status_code is not None:
            self.status_code = status_code

    def to_dict(self) -> dict:
        return {
            "error": True,
            "code": self.code,
            "message": self.message,
            **({"hint": self.hint} if self.hint else {}),
        }


class InvalidImageError(VisionError):
    code = "invalid_image"
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY


class NoPersonDetectedError(VisionError):
    code = "no_person_detected"
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY

    def __init__(self, message: str = "No person detected in the image.") -> None:
        super().__init__(
            message,
            hint="Upload a clear, full-body photo with one person in frame.",
        )


class MultiplePeopleError(VisionError):
    code = "multiple_people"
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY

    def __init__(self, count: int) -> None:
        super().__init__(
            f"Detected {count} people. Try-on supports a single person.",
            hint="Use a photo with only one person for the best result.",
        )


class LowPoseConfidenceError(VisionError):
    code = "low_pose_confidence"
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY

    def __init__(self, message: str = "Pose confidence too low on key joints.") -> None:
        super().__init__(
            message,
            hint="Try a clearer full-body photo with arms and legs visible.",
        )


class SegmentationFailedError(VisionError):
    code = "segmentation_failed"
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY

    def __init__(self, message: str = "Could not segment the garment.") -> None:
        super().__init__(
            message,
            hint="Upload a garment on a plain background with good lighting.",
        )


class ModelUnavailableError(VisionError):
    """Raised when no real backend (local model or hosted provider) is ready."""

    code = "model_unavailable"
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    def __init__(self, backend: str, message: str | None = None) -> None:
        super().__init__(
            message or f"The {backend} backend is not available in this environment.",
            hint="Configure a hosted provider or install the local model.",
        )


class ModelTimeoutError(VisionError):
    code = "model_timeout"
    status_code = status.HTTP_504_GATEWAY_TIMEOUT

    def __init__(self, backend: str, seconds: float | None = None) -> None:
        msg = f"The {backend} backend timed out"
        if seconds is not None:
            msg += f" after {seconds:.1f}s"
        msg += "."
        super().__init__(msg, hint="Please try again in a moment.")


class TryOnFailedError(VisionError):
    code = "tryon_failed"
    status_code = status.HTTP_502_BAD_GATEWAY

    def __init__(self, message: str = "Virtual try-on failed.") -> None:
        super().__init__(message, hint="Please try a different photo and try again.")


def vision_exception_handler(request: Request, exc: VisionError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=exc.to_dict())
