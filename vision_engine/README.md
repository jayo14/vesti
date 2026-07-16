# Vesti Vision Engine

A standalone FastAPI service hosting the computer-vision pipeline for Vesti.
It is **independent of the Django backend** and runs on its own port (default
**8100**).

> **Stage 0 — Scaffolding.** This service currently exposes the full API
> contract and returns **deterministic mock responses** that validate against
> the Pydantic schemas. No ML models are loaded yet (see *Model Plan* below).
> This lets the Django backend and frontend integrate against a stable contract
> before real models are wired in (Stage 1–3).

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
| `VISION_*`_MODEL_PATH | `./models/*.onnx` | On-disk model artifact paths |

See `.env.example` for a copy-paste template.

---

## API Contract

Base URL: `http://localhost:8100`

Every route accepts/returns JSON and validates against `schemas.py`.

### `GET /health`
Liveness check. Returns `{ "status": "ok", "service", "mock_mode", "device" }`.

### `POST /v1/detect`
Detection of people/objects in an image.
- **Request** (`DetectRequest`): `{ image_url | image_base64 }`
- **Response** (`DetectResponse`): `boxes[]` of `BoundingBox { label, confidence, x_min, y_min, x_max, y_max }` (normalized 0–1).

### `POST /v1/pose`
33-point MediaPipe pose landmark extraction.
- **Request** (`PoseRequest`): `{ image_url | image_base64 }`
- **Response** (`PoseResponse`): `landmarks[33]` of `Landmark { x, y, z, visibility }` + `confidence`.

### `POST /v1/parse`
Human parsing / semantic segmentation.
- **Request** (`ParseRequest`): `{ image_url | image_base64 }`
- **Response** (`ParseResponse`): `mask_image_url`/`mask_base64` + `regions[]` of `ParseRegion { region, confidence }`.

### `POST /v1/measurements`
Body measurements derived from pose landmarks + parsing mask + declared height.
- **Request** (`MeasurementsRequest`): `{ landmarks[33], parsing_mask?, height_cm }`
- **Response** (`MeasurementsResponse`): `{ shoulder_width_cm, chest_cm, waist_cm, hip_cm, arm_length_cm, leg_length_cm, confidence }`.

### `POST /v1/garment/segment`
Segment a garment from an image, optionally guided by a text prompt.
- **Request** (`GarmentSegmentRequest`): `{ image_url | image_base64, prompt? }`
- **Response** (`GarmentSegmentResponse`): `cutout_image_url`/`cutout_base64` + `garment_type` + `bounding_polygon[]` + `confidence`.

### `POST /v1/tryon`
Generate a virtual try-on image.
- **Request** (`TryOnRequest`): `{ person_image, garment_cutout, measurements, garment_metadata { material?, fit_type, size? } }`
- **Response** (`TryOnResponse`): `result_image_url`/`result_base64` + `fit_confidence`.

### `POST /v1/enhance`
Upscale / clean an image.
- **Request** (`EnhanceRequest`): `{ image_url | image_base64, scale (1–4), denoise }`
- **Response** (`EnhanceResponse`): `enhanced_image_url`/`enhanced_base64` + `scale`.

### `POST /v1/recommend`
Outfit recommendations from a wardrobe + context.
- **Request** (`RecommendRequest`): `{ wardrobe[WardrobeItem], occasion, weather, dress_code, marketplace_suggestions }`
- **Response** (`RecommendResponse`): `outfits[]` of `OutfitSuggestion`.

---

## Model Plan (for Stage 1–3)

| Route | Eventually backed by | Notes |
| --- | --- | --- |
| `/v1/detect` | YOLO / DETR object detector (ONNX) | Person + garment bounding boxes |
| `/v1/pose` | MediaPipe Pose (33 landmarks) | Onnx or TF Lite |
| `/v1/parse` | SCHP / Human-Parse (semantic seg) | Per-pixel garment/body regions |
| `/v1/measurements` | Geometric solver over landmarks+mask | Calibrated by declared height |
| `/v1/garment/segment` | SAM / Text-guided segmenter | Prompt = garment class |
| `/v1/tryon` | Diffusion try-on (e.g. OOTDiffusion / IDM-VTON) or hosted provider | `VISION_HOSTED_PROVIDER` |
| `/v1/enhance` | Real-ESRGAN / GFPGAN | Super-resolution + cleanup |
| `/v1/recommend` | LLM / embedding ranker | Uses wardrobe + marketplace items |

---

## Project layout

```
vision_engine/
├── main.py                 # FastAPI app, CORS, health, route stubs (mock responses)
├── config.py               # env-driven settings (model paths, hosted-inference keys)
├── schemas.py              # Pydantic request/response contracts
├── requirements.txt
├── Dockerfile
├── docker-compose.yml      # run alongside Django backend on port 8100
├── detection/  pose/  parsing/  measurements/  garments/
├── tryon/  enhancement/  recommendation/   # submodules (Stage 1+ logic)
├── notebooks/              # experimentation only — never imported by the app
└── README.md
```

The `notebooks/` directory is for experimentation and is **never imported** by
the application.
