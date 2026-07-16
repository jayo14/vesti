"""Human parsing (Stage 2.3).

Wires a human-parsing model (SCHP or a SegFormer-based parser) behind
`POST /v1/parse`. Returns per-region masks: head, torso, arms, legs,
background — encoded as a single RGB-indexed mask plus a region confidence
list. The local path lazy-loads a parsing checkpoint referenced by
`VISION_PARSE_MODEL_PATH`; the hosted path delegates to a Replicate
deployment. When neither is available the route returns `ModelUnavailableError`.

The region set is intentionally coarse (MVP): the downstream measurements and
garment alignment only need torso/arm/leg widths and a torso/leg split.
"""
from __future__ import annotations

from typing import Any

from PIL import Image

from ..core.errors import ModelTimeoutError, ModelUnavailableError
from ..core.hosted import get_hosted_provider
from ..core.image import load_image
from ..core.model_loader import LocalBackend
from .. import schemas as s

# Canonical MVP region vocabulary returned to clients.
REGIONS = ["hair", "face", "upper_cloth", "lower_cloth", "left_arm", "right_arm", "left_leg", "right_leg", "skin"]


def _local_backend() -> LocalBackend:
    from ..config import get_settings

    settings = get_settings()

    def loader() -> Any:
        # SCHP / simple_ext provides a runner script; we expect a thin wrapper
        # module at models/parse_runner.py that exposes parse(img)->label_map.
        import importlib.util
        import os

        path = os.path.join(settings.models_dir, "parse_runner.py")
        if not os.path.exists(path):
            raise RuntimeError("parse_runner.py not found under models_dir")
        spec = importlib.util.spec_from_file_location("parse_runner", path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    return LocalBackend(
        name="schp-parser",
        packages=["torch", "torchvision"],
        loader=loader,
    )


def _region_confidences(label_map) -> list[s.ParseRegion]:
    import numpy as np

    arr = np.asarray(label_map)
    total = float(arr.size)
    # SCHP 18-class ids (subset mapped to MVP regions).
    schp_map = {
        1: "hair", 2: "skin", 4: "upper_cloth", 5: "upper_cloth",
        6: "lower_cloth", 7: "lower_cloth", 9: "left_arm", 10: "right_arm",
        12: "face", 13: "left_leg", 14: "right_leg", 15: "left_leg", 16: "right_leg",
    }
    counts: dict[str, float] = {}
    unique, counts_arr = np.unique(arr, return_counts=True)
    for uid, c in zip(unique.tolist(), counts_arr.tolist()):
        region = schp_map.get(int(uid))
        if region:
            counts[region] = counts.get(region, 0.0) + c
    return [
        s.ParseRegion(region=r, confidence=round(min(1.0, counts.get(r, 0.0) / (total * 0.08)), 4))
        for r in REGIONS
    ]


def parse(req: s.ParseRequest) -> s.ParseResponse:
    img = load_image(req.image_url, req.image_base64)

    provider = get_hosted_provider()
    if provider is not None:
        try:
            out = provider.run("schp/human-parsing", {"image": req.image_base64 or req.image_url})
            mask_b64 = out.get("output", out).get("mask_base64")
            regions = [s.ParseRegion(**r) for r in out.get("regions", [])]
        except Exception as exc:  # noqa: BLE001
            raise ModelTimeoutError("hosted parsing") from exc
        return s.ParseResponse(mask_base64=mask_b64, regions=regions, model="hosted-schp")

    backend = _local_backend()
    if backend.available:
        runner = backend.load()
        label_map = runner.parse(img)
        regions = _region_confidences(label_map)
        mask_b64 = _encode_mask(label_map)
        return s.ParseResponse(mask_base64=mask_b64, regions=regions, model="schp")

    raise ModelUnavailableError("parsing")


def _encode_mask(label_map) -> str:
    from ..core.image import to_base64
    from PIL import Image as _Image
    import numpy as np

    palette = _build_palette()
    arr = np.asarray(label_map).astype("uint8")
    im = _Image.fromarray(arr, "P")
    im.putpalette(palette)
    return to_base64(im, "PNG")


def _build_palette() -> list[int]:
    # 18-class SCHP palette (RGB triples flattened).
    base = [
        (0, 0, 0), (128, 0, 0), (255, 0, 0), (0, 85, 0), (170, 0, 51),
        (255, 85, 0), (0, 0, 85), (0, 119, 221), (85, 85, 0), (0, 85, 85),
        (85, 85, 85), (0, 0, 170), (170, 255, 255), (255, 255, 0), (255, 0, 170),
        (0, 255, 85), (0, 170, 255), (85, 0, 0),
    ]
    palette: list[int] = []
    for r, g, b in base:
        palette += [r, g, b]
    while len(palette) < 768:
        palette.append(0)
    return palette
