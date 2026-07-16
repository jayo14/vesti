# VESTI API

Base URL: `http://localhost:8000/api`

## Auth (`/api/auth/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register/` | - | Create account |
| POST | `/api/auth/login/` | - | Get JWT tokens |
| POST | `/api/auth/token/refresh/` | - | Refresh access token |
| GET/PATCH | `/api/auth/me/` | Bearer | Get/update profile |
| POST | `/api/auth/password-reset/` | - | Request password reset |
| POST | `/api/auth/password-reset-confirm/` | - | Confirm password reset |
| GET | `/api/auth/designers/` | - | List designers |

### Register
```
POST /api/auth/register/
{"username": "...", "email": "...", "password": "..."}
```

### Login
```
POST /api/auth/login/
{"username": "...", "password": "..."}
→ {"access": "...", "refresh": "..."}
```

## Products (`/api/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/products/` | - | List products |
| GET | `/api/products/{id}/` | - | Get product (detail, includes reviews) |
| GET | `/api/categories/` | - | List categories |
| GET | `/api/designers/` | - | List designers (with collection count + avg rating) |
| GET | `/api/designers/{id}/` | - | Designer detail |
| GET | `/api/options/` | - | Get materials, colours, sizes |
| GET | `/api/upload/` | Bearer | Upload image |

### Product filters
- `?search=jacket` — search name/description
- `?category=outerwear` — filter by category slug
- `?min_price=10&max_price=100` — price range
- `?sort=price_asc|price_desc|newest` — sort order

## Wardrobe (`/api/wardrobe/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST | `/api/wardrobe/` | Bearer | List/create items |
| GET/PUT/PATCH/DELETE | `/api/wardrobe/{id}/` | Bearer | CRUD item |
| GET | `/api/wardrobe/analyze/` | Bearer | Analyze wardrobe |

### Create wardrobe item
```
POST /api/wardrobe/
{"name": "...", "image": "...", "category": "...", "color": "...", "brand": "..."}
```

## Reviews (`/api/reviews/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST | `/api/reviews/` | Read | List/create reviews |
| GET/PUT/PATCH/DELETE | `/api/reviews/{id}/` | Owner | CRUD review |

- `?product=1` — filter by product

## Orders (`/api/orders/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST | `/api/orders/` | Bearer | List/create orders |
| GET/PUT/PATCH/DELETE | `/api/orders/{id}/` | Bearer | CRUD order |

## Studio (`/api/studio/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST | `/api/studio/` | Bearer | List/create projects |
| GET/PUT/PATCH/DELETE | `/api/studio/{id}/` | Bearer | CRUD project |

## AI (`/api/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/outfit-recommend/` | Bearer | Outfit recommendations |
| POST | `/api/styling-suggestions/` | Bearer | Styling tips |
| POST | `/api/try-on/` | Bearer | Virtual try-on |
| GET | `/api/smart-search/` | - | AI product search |
| POST | `/api/edit/` | Bearer | AI garment editing |
| POST | `/api/generate/` | Bearer | Generate garment from prompt |

### Generate
```
POST /api/generate/
{"prompt": "A silk dress", "garment_type": "dress", "colour": "red", "material": "silk"}
```

### Smart search
```
GET /api/smart-search/?q=jacket
→ {"results": [...], "query": "jacket"}
```
