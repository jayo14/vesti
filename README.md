# VESTI

Fashion, reimagined through AI.

## Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Django 6.0, Django REST Framework 3.17, SimpleJWT, drf-spectacular
- **Database:** SQLite (dev) / PostgreSQL (production)

## Quick start

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py runserver
# → http://localhost:8000/api/docs/

# Frontend
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

## Project layout

```
backend/           Django API
  accounts/        Auth, users, designers
  products/        Marketplace products & categories
  wardrobe/        User wardrobe items
  reviews/         Product reviews
  orders/          Checkout & orders
  studio/          Design studio projects
  ai/              AI endpoints (search, generate, try-on, edit)
  core/            Settings, URLs, uploads
  API.md           Full API reference

frontend/          Next.js app
  src/app/         Pages (/, /playground, /marketplace, /wardrobe, etc.)
  src/components/  React components
  src/lib/         Auth, stores, utilities
  src/hooks/       Custom hooks
```

## API overview

| Area | Base path | Key endpoints |
|------|-----------|---------------|
| Auth | `/api/auth/` | register, login, me, password-reset |
| Products | `/api/` | products, categories, options, smart-search |
| Wardrobe | `/api/wardrobe/` | CRUD items, analyze |
| Reviews | `/api/reviews/` | CRUD, filter by product |
| Orders | `/api/orders/` | CRUD |
| Studio | `/api/studio/` | CRUD projects |
| AI | `/api/` | generate, try-on, edit, outfit-recommend |
| Upload | `/api/upload/` | Image file upload |

See `backend/API.md` for full details.

## Seed data

```bash
cd backend && source venv/bin/activate
python manage.py seed_data
```

Creates a demo user (`demo` / `demo1234`) + 6 sample products.
