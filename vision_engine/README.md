# Vesti Vision Engine

A standalone FastAPI service hosting the computer-vision pipeline for Vesti.
It is **independent of the Django backend** and runs on its own port (default
**8100**).

> **Stage 2 — Real model wiring.** Every route now delegates to a real model
> backend, selected per request:
> 1. **Hosted provider** (Replicate / fal / HF / RunPod) when `VISION_HOSTED_PROVIDER`
>    is configured — preferred for heavy diffusion models.
> 2. **Local self-hosted model** when its python deps are importable.
> 3. Otherwise a **clean error payload** (never a raw 500): `503` when no
>    backend is ready, `422` for bad input (no person, low pose confidence,
>    segmentation failure), `504` on timeout.
>
> The Stage-0 deterministic mocks are removed.

---

## Run locally

```bash
cd vision_engine
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn vision_engine.main:app --host 0.0.0.0 --port 8100 --reload
```

Or with Docker:

```bash
docker compose up --build vision_engine
```

Then verify:

```bash
curl http://localhost:8100/health
```

Interactive docs: **http://localhost:8100/docs**

---

## Configuration

All settings are env-driven with the `VISION_` prefix (see `config.py`).
Key variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `VISION_HOST` | `0.0.0.0` | Bind host |
| `VISION_PORT` | `8100` | Bind port |
| `VISION_CORS_ORIGINS` | `http://localhost:3000,http://localhost:8000` | Comma-separated CORS allowlist |
| `VISION_DEVICE` | `cpu` | `cpu` \| `cuda` \| `mps` |
| `VISION_HOSTED_PROVIDER` | `none` | `none` \| `replicate` \| `fal` \| `hf` \| `runpod` |
| `VISION_HOSTED_API_KEY` | `""` | API key for the hosted provider |
| `VISION_HOSTED_ENDPOINT` | `""` | Endpoint URL for the hosted provider |
| `VISION_*`_MODEL_PATH` | `./models/*.onnx` | On-disk model artifact paths |

See `.env.example` for a copy-paste template.

---

## Model deployment decisions (per model)

| Route | Model | Decision |
| --- | --- | --- |
| `/v1/detect` | YOLOv11n | Local `ultralytics` on CPU is fine; hosted Replicate fallback available. |
| `/v1/pose` | MediaPipe Pose | Local `mediapipe` (CPU, fast). Hosted Replicate fallback. |
| `/v1/parse` | SCHP / SegFormer | Local via `models/parse_runner.py`; hosted Replicate fallback. Heavy — GPU box or hosted. |
| `/v1/measurements` | Geometric solver | **No model.** Pure math over landmarks + mask, calibrated by declared `height_cm`. Always available. |
| `/v1/garment/segment` | SAM2 + Grounding DINO | Hosted preferred (heavy). Local path lazy-loads `segment_anything` + `groundingdino`. RMBG-2.0 pass for product-photo cleanup. |
| `/v1/tryon` | IDM-VTON (CatVTON fallback) | **Hosted preferred.** Local path lazy-loads `torch` + `diffusers`. Logs which model served the request. |
| `/v1/enhance` | Real-ESRGAN | Hosted preferred; local via `realesrgan`/`basicsr`. |

---

## API Contract

Base URL: `http://localhost:8100`

Every route accepts/returns JSON and validates against `schemas.py`.

### `GET /health`
Liveness check. Returns `{ "status", "service", "mock_mode", "device", "hosted_provider" }`.

### `POST /v1/detect`
Detection of people in an image.
- **Request**: `{ image_url | image_base64 }`
- **Response**: `boxes[]` of `BoundingBox { label, confidence, x_min, y_min, x_max, y_max }` (normalized 0–1).
- **Errors**: `422 no_person_detected` (no person), `422 multiple_people` (MVP = single person).

### `POST /v1/pose`
33-point MediaPipe pose landmark extraction.
- **Request**: `{ image_url | image_base64 }`
- **Response**: `landmarks[33]` of `Landmark { x, y, z, visibility }` + `confidence`.
- **Errors**: `422 low_pose_confidence` when shoulders/hips/knees are below threshold.

### `POST /v1/parse`
Human parsing / semantic segmentation.
- **Request**: `{ image_url | image_base64 }`
- **Response**: `mask_base64` + `regions[]` of `ParseRegion { region, confidence }` (head, torso, arms, legs, background).

### `POST /v1/measurements`
Body measurements derived from pose landmarks + parsing mask + declared height.
- **Request**: `{ landmarks[33], parsing_mask?, height_cm }`
- **Response**: `{ shoulder_width_cm, chest_cm, waist_cm, hip_cm, arm_length_cm, leg_length_cm, confidence, estimated }`.
- All results are **estimates** with a confidence score; nothing is persisted.

### `POST /v1/garment/segment`
Segment a garment from an image, text-prompted by category (e.g. "hoodie").
- **Request**: `{ image_url | image_base64, prompt? }`
- **Response**: `cutout_base64` + `garment_type` + `bounding_polygon[]` + `confidence`.
- The same segmentation is reused for designer product-photo cleanup; an extra RMBG-2.0 pass handles garment-on-white-background.

### `POST /v1/tryon`
Generate a virtual try-on image (composites the garment onto the **real** person pixels).
- **Request**: `{ person_image, garment_cutout, measurements, garment_metadata { material?, fit_type, size?, size_chart? } }`
- **Response**: `result_base64` + `fit_confidence` + `fit_analysis { estimated_fit, sleeve_note, waist_note, recommended_size, style_match_pct }` + `model` (which backend served it).
- IDM-VTON primary; CatVTON fallback on timeout/failure; model logged.

### `POST /v1/enhance`
Upscale / clean an image (Real-ESRGAN).
- **Request**: `{ image_url | image_base64, scale (1–4), denoise }`
- **Response**: `enhanced_base64` + `scale`.

---

## Project layout

```
vision_engine/
├── main.py                 # FastAPI app, CORS, health, routes (Stage 2)
├── config.py               # env-driven settings
├── schemas.py              # Pydantic request/response contracts
├── core/                   # image IO, errors, hosted-provider client, model loader
├── detection/  pose/  parsing/  measurements/  garments/
├── tryon/  enhancement/    # submodule service + (tryon) fit analysis
├── tests/                  # pytest: measurements, fit analysis, route degradation
├── notebooks/              # per-module experiments (validation only, never imported)
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── README.md
```

The `notebooks/` directory is for experimentation and is **never imported** by
the application.
