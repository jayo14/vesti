"""Person detection (Stage 2.1).

Wires YOLOv11n (Ultralytics) behind `POST /v1/detect`. The local path lazy-
imports `ultralytics` and runs on CPU when present. If `VISION_HOSTED_PROVIDER`
is configured, detection is delegated to a hosted replica (e.g. a Replicate
YOLOv11 deployment). When neither is available the route returns a clear
`ModelUnavailableError` (503) rather than a fabricated box — MVP multi-person
handling: a single `person` box is required, multiple people is rejected.
"""
from __future__ import annotations

from typing import Any

from PIL import Image

from ..core.errors import (
    ModelTimeoutError,
    ModelUnavailableError,
    MultiplePeopleError,
    NoPersonDetectedError,
)
from ..core.hosted import get_hosted_provider
from ..core.image import image_size, load_image
from ..core.model_loader import LocalBackend, package_present
from .. import schemas as s


def _local_backend() -> LocalBackend:
    from ..config import get_settings

    settings = get_settings()

    def loader() -> Any:
        from ultralytics import YOLO

        return YOLO(settings.detect_model_path)

    return LocalBackend(
        name="yolov11n",
        packages=["ultralytics", "torch"],
        loader=loader,
    )


def detect(req: s.DetectRequest) -> s.DetectResponse:
    img = load_image(req.image_url, req.image_base64)
    width, height = image_size(img)

    # --- Hosted path -------------------------------------------------------
    provider = get_hosted_provider()
    if provider is not None:
        try:
            out = provider.run(
                "ultralytics/yolov11n",
                {"image": req.image_base64 or req.image_url, "classes": ["person"]},
            )
            boxes_raw = out.get("output", out)
            boxes = _normalize_hosted(boxes_raw, width, height)
        except Exception as exc:  # noqa: BLE001
            raise ModelTimeoutError("hosted detection") from exc
        return _finalize(boxes, "hosted-yolov11n")

    # --- Local path --------------------------------------------------------
    backend = _local_backend()
    if backend.available:
        model = backend.load()
        results = model.predict(img, classes=[0], verbose=False)
        boxes = _normalize_ultralytics(results, width, height)
        return _finalize(boxes, "yolov11n")

    raise ModelUnavailableError("detection")


def _normalize_ultralytics(results: Any, width: int, height: int) -> list[s.BoundingBox]:
    boxes: list[s.BoundingBox] = []
    for r in results:
        for b in r.boxes:
            x1, y1, x2, y2 = (float(v) for v in b.xyxy[0].tolist())
            conf = float(b.conf[0])
            boxes.append(
                s.BoundingBox(
                    label="person",
                    confidence=round(conf, 4),
                    x_min=x1 / width,
                    y_min=y1 / height,
                    x_max=x2 / width,
                    y_max=y2 / height,
                )
            )
    return boxes


def _normalize_hosted(raw: Any, width: int, height: int) -> list[s.BoundingBox]:
    boxes: list[s.BoundingBox] = []
    items = raw if isinstance(raw, list) else raw.get("predictions", [])
    for it in items:
        x1, y1, x2, y2 = (
            it["xmin"],
            it["ymin"],
            it.get("xmax", it["xmin"] + it.get("width", 0)),
            it.get("ymax", it["ymin"] + it.get("height", 0)),
        )
        boxes.append(
            s.BoundingBox(
                label="person",
                confidence=round(float(it.get("confidence", 1.0)), 4),
                x_min=x1 / width,
                y_min=y1 / height,
                x_max=x2 / width,
                y_max=y2 / height,
            )
        )
    return boxes


def _finalize(boxes: list[s.BoundingBox], model: str) -> s.DetectResponse:
    persons = [b for b in boxes if _is_person(b)]
    persons.sort(key=lambda b: b.confidence, reverse=True)
    if not persons:
        raise NoPersonDetectedError()
    if len(persons) > 1:
        raise MultiplePeopleError(len(persons))
    return s.DetectResponse(boxes=persons, model=model)


def _is_person(b: s.BoundingBox) -> bool:
    return b.label.lower() in ("person", "0")
