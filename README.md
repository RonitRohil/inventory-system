# Inventory & Order Management System

A full-stack app for managing products, customers, and orders — built with FastAPI, React, PostgreSQL, and Docker. Submitted as part of the Ethara AI Software Engineer technical assessment.

**GitHub:** https://github.com/RonitRohil/inventory-system  
**Docker Hub:** https://hub.docker.com/r/ronitrohil04/inventory-backend  
**Live frontend:** https://inventory-system-dun-seven.vercel.app/  
**Live backend:** https://inventory-system-s8ss.onrender.com  

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, FastAPI, SQLAlchemy ORM |
| Frontend | React 18, Vite 7, React Router v6 |
| Database | PostgreSQL 16 |
| Containerization | Docker, Docker Compose |
| API testing | Bruno |

---

## Design decisions and approach

### How I read the spec

The assessment asked for a system that manages products, customers, and orders — with the key constraint that inventory must stay consistent across order creation and cancellation. That constraint drove most of the backend design.

I started with the data model. Orders reference customers and contain multiple line items (each linking a product, a quantity, and the price at time of purchase). Storing `unit_price` on the order item rather than reading it from the product table at query time means historical orders don't change if a product's price changes later — which is how real-world order systems behave.

### Backend choices

**FastAPI over Flask** — FastAPI gives automatic OpenAPI docs and Pydantic validation out of the box. For an API-heavy assignment where the spec calls for request validation and proper error codes, it removes a lot of boilerplate.

**SQLAlchemy ORM over raw SQL** — Relationships between Order, OrderItem, Product, and Customer are handled through the ORM, which makes the cascade delete on order items automatic and reduces the chance of orphaned records.

**Stock deduction inside a transaction** — The create_order endpoint validates stock for all items first, then deducts in a single transaction using `db.flush()` to get the order ID before committing. If anything fails mid-way, the whole thing rolls back. No partial stock deductions.

**Row-level lock on cancel** — `with_for_update()` on the order row when cancelling prevents two concurrent cancellation requests from both reading the same stock value and restoring it twice.

**Eager loading on order queries** — Used `joinedload` on all order endpoints to avoid N+1 queries when loading `order_items` → `product` for each order.

**CORS** — Explicit origin list only. Wildcards are incompatible with `allow_credentials=True` per the CORS spec and get blocked by browsers.

**409 over 400 for conflicts** — Duplicate SKU and duplicate email return 409 Conflict, not 400 Bad Request. The input is valid; the state is the problem.

### Frontend choices

**React with a centralised API client** — All fetch calls go through a single `api/client.js` wrapper that handles JSON serialisation, error extraction, and the base URL from the environment variable. Pages never call `fetch` directly.

**Lazy data loading in Orders** — The Orders page only fetches the orders list on mount. Customers and products (needed for the create-order dropdown) are fetched the first time the "New Order" modal opens, then cached in state for subsequent opens.

**Modal pattern** — Add/Edit/Delete interactions happen in modals rather than separate routes to keep the URL clean and reduce navigation overhead for what is essentially a data-management tool.

### Docker setup

Three services in Docker Compose — PostgreSQL, backend, frontend. The backend waits for the database to pass its healthcheck before starting. The frontend is a two-stage build: Vite builds the static files, nginx serves them and proxies `/api/` to the backend.

### Known limitations

- **No Alembic migrations** — `Base.metadata.create_all` creates tables on startup. Fine for this scope, but in production you'd want proper migration files.
- **Float for prices** — Using Python `float` / PostgreSQL `FLOAT` for monetary values, which has floating-point precision limits. A production system would use `NUMERIC(10,2)`.
- **No idempotency keys on POST /orders** — A client retrying a timed-out order creation will create a duplicate. The fix is a client-generated UUID `idempotency_key` stored server-side and deduplicated.
- **No rate limiting** — No protection against bulk requests on the list endpoints.

---

## Project structure

```
inventory-system/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, /dashboard endpoint
│   │   ├── database.py      # DB connection, session factory
│   │   ├── models.py        # SQLAlchemy models (Product, Customer, Order, OrderItem)
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   └── routers/
│   │       ├── products.py  # Full CRUD + SKU uniqueness (409 on conflict)
│   │       ├── customers.py # Full CRUD + email uniqueness (409 on conflict)
│   │       └── orders.py    # Create (stock check + deduct) + get + cancel (restores stock)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/client.js    # Single fetch wrapper for all API calls
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx   # Stats cards + low-stock table
│   │   │   ├── Products.jsx    # List + add/edit/delete modals
│   │   │   ├── Customers.jsx   # List + add/delete modals
│   │   │   └── Orders.jsx      # List + create order + details modal
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile           # Multi-stage: Vite build → nginx
│   ├── nginx.conf           # SPA fallback + /api proxy to backend
│   └── package.json
├── bruno/                   # Bruno API collection (14 requests, 2 environments)
│   ├── environments/
│   │   ├── Local.bru        # http://localhost:8000
│   │   └── Production.bru   # https://inventory-system-s8ss.onrender.com
│   ├── Dashboard/
│   ├── Products/
│   ├── Customers/
│   └── Orders/
├── docker-compose.yml
├── .env.example
└── .gitignore
```

---

## Running locally

### With Docker (quickest)

```bash
git clone https://github.com/RonitRohil/inventory-system.git
cd inventory-system

cp .env.example .env
# fill in POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB in .env

docker compose up --build
```

Once up:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API docs: http://localhost:8000/docs

### Without Docker

**Backend:**

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt

# backend/.env needs:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_db
# FRONTEND_URL=http://localhost:5173

uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install

# frontend/.env.local needs:
# VITE_API_URL=http://localhost:8000

npm run dev
```

---

## API reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Stats and low-stock products |
| POST | `/products` | Create a product |
| GET | `/products` | List all products |
| GET | `/products/{id}` | Get product by ID |
| PUT | `/products/{id}` | Update product |
| DELETE | `/products/{id}` | Delete product |
| POST | `/customers` | Create a customer |
| GET | `/customers` | List all customers |
| GET | `/customers/{id}` | Get customer by ID |
| DELETE | `/customers/{id}` | Delete customer |
| POST | `/orders` | Create order — validates stock, deducts on success |
| GET | `/orders` | List all orders |
| GET | `/orders/{id}` | Get order with customer and line items |
| DELETE | `/orders/{id}` | Cancel order — restores stock |

Swagger UI is at `/docs` when the backend is running.

---

## Business logic

- Duplicate SKUs are rejected (409 Conflict)
- Duplicate customer emails are rejected (409 Conflict)
- Orders are rejected if requested quantity exceeds available stock
- Stock is deducted for each line item when an order is created
- Stock is restored when an order is cancelled (with row-level lock to prevent race conditions)
- Order totals are calculated server-side (`unit_price × quantity` per item) — clients can't override it
- DELETE endpoints are idempotent — cancelling an already-deleted resource returns 204

---

## Deployment steps taken

### 1. Docker Hub

```bash
docker build -t ronitrohil04/inventory-backend:latest ./backend
docker login
docker push ronitrohil04/inventory-backend:latest
```

Image: `docker.io/ronitrohil04/inventory-backend:latest`

### 2. Backend on Render

- Created a PostgreSQL instance on Render (free tier)
- Created a Web Service pointing to this repo, root directory `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Set env vars: `DATABASE_URL` (Render internal Postgres URL), `FRONTEND_URL` (Vercel URL after deploy)
- Live at: https://inventory-system-s8ss.onrender.com/docs

### 3. Frontend on Vercel

- Imported the GitHub repo on Vercel
- Set root directory to `frontend`
- Set env var: `VITE_API_URL=https://inventory-system-s8ss.onrender.com`
- Vercel auto-detects Vite and runs `npm run build`
- Live at: https://inventory-system-dun-seven.vercel.app

> Note: Render's free tier spins down after 15 minutes of inactivity. First request after idle takes ~30 seconds to cold-start. Hit `/docs` first if demoing.

---

## API testing with Bruno

The `bruno/` folder has all 14 requests organised by resource (Dashboard, Products, Customers, Orders).

Open Bruno → **Open Collection** → select the `bruno/` folder → pick the **Local** environment. All requests include example bodies.

After deploying, switch to the **Production** environment — it already points to the live Render URL.

---

## Environment files

Three separate files — all git-ignored, never committed:

| File | Used by | Key vars |
|------|---------|----------|
| `.env` | Docker Compose | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` |
| `backend/.env` | FastAPI | `DATABASE_URL`, `FRONTEND_URL` |
| `frontend/.env.local` | Vite | `VITE_API_URL` |

Copy from the `.env.example` files to get started.

---

## Submission checklist

- [x] GitHub: https://github.com/RonitRohil/inventory-system
- [x] Docker Hub: `docker.io/ronitrohil04/inventory-backend:latest`
- [x] Live frontend: https://inventory-system-dun-seven.vercel.app
- [x] Live backend: https://inventory-system-s8ss.onrender.com — verify `/docs` loads
