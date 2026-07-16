"""Pose estimation (Stage 2.2).

Wires MediaPipe Pose behind `POST /v1/pose`, returning the 33-point landmark
set with per-point visibility. The local path uses `mediapipe` (CPU). Hosted
fallback delegates to a Replicate MediaPipe deployment. Key joints (shoulders,
hips, knees) are checked for confidence; if too low the route raises
`LowPoseConfidenceError` so the frontend can show "try a clearer full-body
photo".
"""
from __future__ import annotations

from typing import Any

from PIL import Image

from ..core.errors import LowPoseConfidenceError, ModelTimeoutError, ModelUnavailableError
from ..core.hosted import get_hosted_provider
from ..core.image import load_image
from ..core.model_loader import LocalBackend
from .. import schemas as s

# MediaPipe Pose landmark indices for the joints we require to be confident.
_SHOULDER_L, _SHOULDER_R = 11, 12
_HIP_L, _HIP_R = 23, 24
_KNEE_L, _KNEE_R = 25, 26
_KEY_JOINTS = (_SHOULDER_L, _SHOULDER_R, _HIP_L, _HIP_R, _KNEE_L, _KNEE_R)
_MIN_KEY_CONF = 0.5


def _local_backend() -> LocalBackend:
    def loader() -> Any:
        import mediapipe as mp

        return mp.solutions.pose.Pose(
            static_image_mode=True,
            model_complexity=1,
            min_detection_confidence=0.5,
        )

    return LocalBackend(name="mediapipe-pose", packages=["mediapipe"], loader=loader)


def _landmarks_from_mediapipe(results: Any) -> list[s.Landmark]:
    lm = results.pose_landmarks
    if not lm:
        return []
    return [
        s.Landmark(
            x=round(p.x, 5),
            y=round(p.y, 5),
            z=round(p.z, 5),
            visibility=round(p.visibility, 4),
        )
        for p in lm.landmark
    ]


def _check_confidence(landmarks: list[s.Landmark]) -> None:
    if len(landmarks) < 33:
        raise LowPoseConfidenceError("Pose detector did not return 33 landmarks.")
    weak = [
        i
        for i in _KEY_JOINTS
        if i >= len(landmarks) or landmarks[i].visibility < _MIN_KEY_CONF
    ]
    if weak:
        raise LowPoseConfidenceError(
            "Low confidence on key joints (shoulders, hips, knees)."
        )


def pose(req: s.PoseRequest) -> s.PoseResponse:
    img = load_image(req.image_url, req.image_base64)

    provider = get_hosted_provider()
    if provider is not None:
        try:
            out = provider.run("google/mediapipe-pose", {"image": req.image_base64 or req.image_url})
            landmarks = [s.Landmark(**d) for d in out.get("output", out)]
        except Exception as exc:  # noqa: BLE001
            raise ModelTimeoutError("hosted pose") from exc
        _check_confidence(landmarks)
        conf = round(min(l.visibility for l in landmarks), 4)
        return s.PoseResponse(landmarks=landmarks, confidence=conf, model="hosted-mediapipe")

    backend = _local_backend()
    if backend.available:
        import mediapipe as mp
        import numpy as np

        model = backend.load()
        arr = np.asarray(img.convert("RGB"))
        results = model.process(arr)
        landmarks = _landmarks_from_mediapipe(results)
        if not landmarks:
            raise LowPoseConfidenceError("No pose detected in the image.")
        _check_confidence(landmarks)
        conf = round(min(l.visibility for l in landmarks), 4)
        return s.PoseResponse(landmarks=landmarks, confidence=conf, model="mediapipe")

    raise ModelUnavailableError("pose")
