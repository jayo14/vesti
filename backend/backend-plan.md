# Backend Plan — VESTI

## Overview

Django REST API powering VESTI's fashion-tech platform.  
Frontend is Next.js at `/home/codegallantx/moi/vesti/frontend`.

## Architecture

```
backend/
├── core/              # Django project config
├── accounts/          # Users, auth, profiles
├── products/          # Marketplace items
├── wardrobe/          # User wardrobe items
├── reviews/           # Product reviews
├── orders/            # Checkout / purchases
├── studio/            # Design studio projects
└── ai/                # AI feature endpoints
```

## Data Models

### accounts.User
- Extends AbstractUser
- `bio`, `avatar`, `is_designer` (bool)

### products.Product
- `name`, `description`, `price`, `category`, `images`, `sizes`, `colors`, `stock`
- Timestamps

### products.Category
- `name`, `slug`

### wardrobe.WardrobeItem
- FK → user
- `name`, `image`, `category`, `color`, `brand`, `notes`

### reviews.Review
- FK → user, product
- `rating` (1-5), `body`
- Timestamps

### orders.Order
- FK → user
- `status` (pending/paid/shipped/delivered)
- Items, total, timestamps

### studio.Project
- FK → user
- `name`, `garment_data` (JSON), `created_at`, `updated_at`

## API Endpoints

| Method | Endpoint | App | Auth | Description |
|--------|----------|-----|------|-------------|
| POST | /api/auth/register/ | accounts | No | Register |
| POST | /api/auth/login/ | accounts | No | Login → JWT |
| POST | /api/auth/token/refresh/ | accounts | No | Refresh JWT |
| GET/PUT | /api/auth/me/ | accounts | Yes | Profile CRUD |
| GET | /api/products/ | products | No | List products |
| GET | /api/products/{id}/ | products | No | Product detail |
| GET | /api/products/categories/ | products | No | List categories |
| GET/POST | /api/products/{id}/reviews/ | reviews | Yes* | List/create reviews |
| GET/POST | /api/wardrobe/ | wardrobe | Yes | List/create items |
| GET/PUT/DELETE | /api/wardrobe/{id}/ | wardrobe | Yes | Item CRUD |
| POST | /api/wardrobe/analyze/ | wardrobe | Yes | AI analyze item |
| GET/POST | /api/orders/ | orders | Yes | List/create orders |
| GET | /api/orders/{id}/ | orders | Yes | Order detail |
| GET/POST | /api/studio/ | studio | Yes | List/create projects |
| GET/PUT/DELETE | /api/studio/{id}/ | studio | Yes | Project CRUD |
| POST | /api/ai/outfit-recommend/ | ai | Yes | AI outfits |
| POST | /api/ai/styling-suggestions/ | ai | Yes | AI styling |
| POST | /api/ai/try-on/ | ai | Yes | Virtual try-on |
| GET | /api/ai/smart-search/ | ai | No | Search products |
| GET | /api/edit/ | ai | Yes | AI garment edit |

*Reviews: GET is public, POST requires auth.

## Auth Flow

- JWT via SimpleJWT (access + refresh tokens)
- Access token: 30 min, Refresh token: 7 days
- All /api/auth/ endpoints public
- All mutation endpoints require Bearer token

## Tech Stack

- Django 6.0 + DRF 3.17
- SimpleJWT for auth
- django-cors-headers
- PostgreSQL (via psycopg2-binary)
- python-dotenv for env vars
