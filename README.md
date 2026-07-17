# VESTI

Fashion, reimagined through AI.

## Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Django 6.0, Django REST Framework 3.17, SimpleJWT, drf-spectacular
- **Database:** SQLite (dev) / PostgreSQL (production)
- **Vision Engine:** FastAPI (separate service) for pose, parse, measurements, try-on
- **LLM:** GPT-4o via OpenRouter for outfit recommendations, styling, smart search

## Quick start

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL (optional, SQLite works for local dev)

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env    # edit with your keys
python manage.py migrate
python manage.py seed_data
python manage.py runserver
# → http://localhost:8000/api/docs/
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env    # edit with your keys
npm run dev
# → http://localhost:3000
```

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SECRET_KEY` | **Yes** | `test-secret-key` | Django secret key (change in production!) |
| `DEBUG` | No | `True` | Django debug mode |
| `ALLOWED_HOSTS` | No | `*` | Comma-separated allowed hosts |
| `DATABASE_URL` | No | SQLite | PostgreSQL connection string `postgres://user:pass@host:5432/db` |
| `CORS_ALLOWED_ORIGINS` | No | `*` | Comma-separated allowed CORS origins |
| `OPENROUTER_API_KEY` | **Yes** | `""` | [OpenRouter](https://openrouter.ai/) key for GPT-4o |
| `VISION_ENGINE_URL` | No | `http://localhost:8100` | Vision Engine FastAPI URL |
| `ALATPAY_PUBLIC_KEY` | **Yes** | `""` | ALATPay public key |
| `ALATPAY_SECRET_KEY` | **Yes** | `""` | ALATPay secret key |
| `ALATPAY_BUSINESS_ID` | **Yes** | `""` | ALATPay business ID |
| `ALATPAY_WEBHOOK_SECRET` | **Yes** | `""` | ALATPay webhook secret |
| `ALATPAY_SPLIT_CODE` | No | `""` | ALATPay split payment code |
| `EMAIL_HOST` | No | `""` | SMTP host for admin notification emails |
| `EMAIL_HOST_USER` | No | `""` | SMTP user |
| `EMAIL_HOST_PASSWORD` | No | `""` | SMTP password |
| `EMAIL_USE_TLS` | No | `True` | SMTP TLS toggle |
| `DEFAULT_FROM_EMAIL` | No | `noreply@vesti.local` | Sender address |
| `AWS_ACCESS_KEY_ID` | No | `""` | S3 access key (files stored locally if empty) |
| `AWS_SECRET_ACCESS_KEY` | No | `""` | S3 secret key |
| `AWS_STORAGE_BUCKET_NAME` | No | `""` | S3 bucket name |
| `AWS_S3_REGION_NAME` | No | `us-east-1` | S3 region |
| `REDIS_URL` | No | `""` | Redis URL for caching (local-memory fallback) |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE` | **Yes** | `http://localhost:8000` | Backend API base URL |
| `OPENROUTER_API_KEY` | **Yes** | `""` | OpenRouter key (server-side only, not exposed to client) |

## Project layout

```
backend/             Django API
  accounts/          Auth, users, designers, body profile
  products/          Marketplace products & categories
  wardrobe/          User wardrobe items
  reviews/           Product reviews
  orders/            Checkout & orders
  studio/            Design studio, generations, try-on
  ai/                AI endpoints + LLM/vision clients
  payments/          Payment processing
  disputes/          Order dispute resolution
  analytics/         Event tracking & request timing
  core/              Settings, URLs, uploads
  API.md             Full API reference

frontend/            Next.js app
  src/app/           Pages (/, /playground, /marketplace, /wardrobe, /admin, etc.)
  src/components/    React components
  src/lib/           Auth, stores, utilities
  src/hooks/         Custom hooks
```

## API overview

| Area | Base path | Key endpoints |
|------|-----------|---------------|
| Auth | `/api/auth/` | register, login, me, password-reset, body-profile |
| Products | `/api/` | products, categories, options, smart-search |
| Wardrobe | `/api/wardrobe/` | CRUD items, analyze |
| Reviews | `/api/reviews/` | CRUD, filter by product |
| Orders | `/api/orders/` | CRUD, checkout |
| Studio | `/api/studio/` | CRUD projects, generations |
| AI | `/api/` | generate, try-on, edit, outfit-recommend, styling |
| Admin | `/api/admin/` | users, designers, products, payouts, disputes, generations |
| Upload | `/api/upload/` | Image file upload (S3 or local) |

See `backend/API.md` for full details.

## Seed data

```bash
cd backend && source venv/bin/activate
python manage.py seed_data
```

Creates a demo user (`demo` / `demo1234`) + 6 sample products.

## Launch checklist

- [ ] All env vars configured in production (see table above)
- [ ] `SECRET_KEY` changed to a long random value
- [ ] `DEBUG=False`, `ALLOWED_HOSTS` restricted
- [ ] PostgreSQL database provisioned and `DATABASE_URL` set
- [ ] Redis provisioned and `REDIS_URL` set for caching
- [ ] S3 bucket created, `AWS_STORAGE_BUCKET_NAME` set
- [ ] OpenRouter API key configured
- [ ] ALATPay credentials configured
- [ ] Vision Engine service deployed and `VISION_ENGINE_URL` set
- [ ] SMTP credentials configured for admin notifications
- [ ] CORS origins restricted
- [ ] E2E smoke test: sign up → try on → buy
- [ ] E2E smoke test: designer list → get approved → sell
- [ ] E2E smoke test: admin approve / moderate
- [ ] E2E smoke test: payout request → process
- [ ] Database backups configured
- [ ] Application monitoring in place
