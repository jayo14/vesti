"""Image input/output helpers shared across pipeline modules.

Handles the three input shapes from `ImageInput` (remote URL, base64, or
data-URL) and returns a decoded `PIL.Image` plus an in-memory numpy array.
All decoding goes through a single validate-decode path that raises
`InvalidImageError` (HTTP 422) instead of an opaque 500.
"""
from __future__ import annotations

import base64
import io
from typing import Tuple

import httpx
from PIL import Image

from .errors import InvalidImageError

MAX_IMAGE_BYTES = 20 * 1024 * 1024  # 20 MB guardrail


def _decode_base64(raw: str) -> bytes:
    # Tolerate a "data:image/png;base64," prefix.
    if "," in raw and raw.strip().lower().startswith("data:"):
        raw = raw.split(",", 1)[1]
    try:
        return base64.b64decode(raw, validate=False)
    except Exception as exc:  # noqa: BLE001
        raise InvalidImageError("Image base64 could not be decoded.") from exc


def _load_from_bytes(data: bytes) -> Image.Image:
    if len(data) > MAX_IMAGE_BYTES:
        raise InvalidImageError("Image exceeds the 20 MB size limit.")
    try:
        img = Image.open(io.BytesIO(data))
        img = img.convert("RGB")
        img.load()  # force full decode so corrupt files fail here
        return img
    except InvalidImageError:
        raise
    except Exception as exc:  # noqa: BLE001
        raise InvalidImageError("File is not a readable image.") from exc


def load_image(image_url: str | None, image_base64: str | None) -> Image.Image:
    """Resolve an `ImageInput` into a decoded RGB PIL image."""
    if image_url:
        try:
            resp = httpx.get(image_url, timeout=15.0, follow_redirects=True)
        except Exception as exc:  # noqa: BLE001
            raise InvalidImageError(f"Could not fetch image URL: {exc}") from exc
        if resp.status_code != 200:
            raise InvalidImageError(f"Image URL returned HTTP {resp.status_code}.")
        return _load_from_bytes(resp.content)
    if image_base64:
        return _load_from_bytes(_decode_base64(image_base64))
    raise InvalidImageError("Provide either image_url or image_base64.")


def to_array(img: Image.Image):
    import numpy as np

    return np.asarray(img.convert("RGB"))


def array_to_image(arr) -> Image.Image:
    import numpy as np

    return Image.fromarray(arr.astype("uint8"), "RGB")


def to_base64(img: Image.Image, fmt: str = "PNG") -> str:
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return base64.b64encode(buf.getvalue()).decode("ascii")


def to_data_url(img: Image.Image, fmt: str = "PNG") -> str:
    return f"data:image/{fmt.lower()};base64,{to_base64(img, fmt)}"


def image_size(img: Image.Image) -> Tuple[int, int]:
    return img.size  # (width, height)
