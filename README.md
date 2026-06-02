# Inventory & Order Management System

A full-stack app for managing products, customers, and orders, built with FastAPI, React, PostgreSQL, and Docker. Submitted as part of the Ethara AI Software Engineer technical assessment.

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

The assessment asks for a system that manages products, customers, and orders, with inventory staying consistent across order creation and cancellation. That consistency constraint is what drove most of the backend decisions.

I started with the data model. Orders reference customers and contain multiple line items, each linking a product, a quantity, and the price at time of purchase. Storing `unit_price` on the order item (rather than reading it from the product table later) means historical orders don't silently change if a product's price is updated. That's standard for any real order system, so I did it here too.

### Backend

I picked FastAPI over Flask because the spec explicitly calls for request validation and proper HTTP error codes. FastAPI's Pydantic integration handles both with almost no setup, and the auto-generated `/docs` page gives reviewers a working sandbox without any extra effort.

For the database layer, SQLAlchemy ORM over raw SQL. The relationships between Order, OrderItem, Product, and Customer are complex enough that cascade deletes on order items are hard to get right by hand. The ORM handles that automatically.

The trickiest part was the order creation flow. I validate stock for every item first, then deduct everything inside a single transaction using `db.flush()` to get the order ID before committing. If anything fails halfway through, the whole thing rolls back. No partial deductions, no phantom stock changes.

Order cancellation has a race condition risk: two concurrent cancel requests could both read the same stock value and restore it twice. Fixed with `with_for_update()` on the order row, which locks it for the duration of the transaction.

Two smaller things worth calling out: `joinedload` on all order queries to avoid N+1 when fetching `order_items` with their products, and 409 Conflict (not 400) for duplicate SKU and email. The input is valid; the state is the problem. That distinction matters.

CORS is set to explicit origins only. Wildcards can't be used with `allow_credentials=True` per the CORS spec, and browsers will block it.

### Frontend

All API calls go through a single `api/client.js` wrapper that handles JSON serialisation, error extraction, and the base URL. Pages never call `fetch` directly, which makes it easy to change the base URL or add auth headers in one place later.

The Orders page only fetches the orders list on mount. Customers and products (needed for the "New Order" modal dropdowns) load the first time that modal opens, then stay cached in state. No point hitting those endpoints on every page load when you might not even open the modal.

Add/Edit/Delete interactions use modals rather than separate routes. For a data management tool with no user-facing URLs, modals keep things simpler and the navigation cleaner.

### Docker

Three services in Docker Compose: PostgreSQL, backend, frontend. The backend waits for the database healthcheck to pass before starting. The frontend is a two-stage build: Vite compiles the static files in one stage, nginx serves them in the second and proxies `/api/` to the backend container.

### What's not done (and why)

`Base.metadata.create_all` creates tables on startup. It works fine here but a production system would use Alembic migrations for any schema changes. Worth noting.

Prices are stored as `float`, which has floating point precision issues for money. The correct type is `NUMERIC(10,2)`, but changing it would require a migration, and for this scope the difference is negligible.

`POST /orders` has no idempotency key. A client retrying a timed-out request will create a duplicate order. The fix is a client-generated UUID sent in the request and stored server-side to deduplicate, but that's out of scope here.

No rate limiting on the list endpoints.

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
| POST | `/orders` | Create order, validates stock and deducts on success |
| GET | `/orders` | List all orders |
| GET | `/orders/{id}` | Get order with customer and line items |
| DELETE | `/orders/{id}` | Cancel order, restores stock |

Swagger UI is at `/docs` when the backend is running.

---

## Business logic

- Duplicate SKUs are rejected (409 Conflict)
- Duplicate customer emails are rejected (409 Conflict)
- Orders are rejected if any item's requested quantity exceeds available stock
- Stock is deducted per line item when an order is created
- Stock is restored when an order is cancelled, with a row-level lock to prevent race conditions
- Order totals are calculated server-side (`unit_price × quantity` per item), clients cannot override
- DELETE endpoints are idempotent, cancelling an already-deleted resource returns 204

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
- Set env vars: `DATABASE_URL` (Render internal Postgres URL), `FRONTEND_URL` (Vercel URL)
- Live at: https://inventory-system-s8ss.onrender.com/docs

### 3. Frontend on Vercel

- Imported the GitHub repo on Vercel
- Set root directory to `frontend`
- Set env var: `VITE_API_URL=https://inventory-system-s8ss.onrender.com`
- Vercel auto-detects Vite and runs `npm run build`
- Live at: https://inventory-system-dun-seven.vercel.app

> Render's free tier spins down after 15 minutes idle. First request after a sleep takes 30-60 seconds. Hit `/docs` first when demoing.

---

## API testing with Bruno

The `bruno/` folder has all 14 requests organised by resource (Dashboard, Products, Customers, Orders).

Open Bruno, click **Open Collection**, select the `bruno/` folder, then pick the **Local** environment. All requests have example bodies ready to go.

After deploying, switch to **Production** — it already points to the live Render URL.

---

## Environment files

Three separate files, all git-ignored and never committed:

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
- [x] Live backend: https://inventory-system-s8ss.onrender.com (verify `/docs` loads)
