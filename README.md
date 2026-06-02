# Inventory & Order Management System

A full-stack app for managing products, customers, and orders — built with FastAPI, React, PostgreSQL, and Docker. Submitted as part of the Ethara AI Software Engineer technical assessment.

**GitHub:** https://github.com/RonitRohil/inventory-system  
**Docker Hub:** https://hub.docker.com/r/ronitrohil/inventory-backend  
**Live frontend:** (Vercel URL — add after deploy)  
**Live backend:** (Render URL — add after deploy)

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
│   │       ├── products.py  # Full CRUD + SKU uniqueness
│   │       ├── customers.py # Full CRUD + email uniqueness
│   │       └── orders.py    # Create (stock check + deduct) + get + cancel
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
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── bruno/                   # Bruno API collection (14 requests, 2 environments)
│   ├── environments/
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

- Duplicate SKUs are rejected (409)
- Duplicate customer emails are rejected (409)
- Orders are rejected if requested quantity exceeds available stock
- Stock is deducted for each line item when an order is created
- Stock is restored when an order is cancelled
- Order totals are calculated server-side (`unit_price × quantity` per item) — clients can't override it

---

## API testing with Bruno

The `bruno/` folder has all 14 requests organised by resource (Dashboard, Products, Customers, Orders).

Open Bruno → **Open Collection** → select the `bruno/` folder → pick the **Local** environment. All requests include example bodies so you can run them straight away.

After deploying, update `bruno/environments/Production.bru` with your Render URL and switch environments there.

---

## Deployment

### Backend on Render

1. Push to GitHub
2. Render → New Web Service → connect `RonitRohil/inventory-system` → root directory: `backend`
3. Add env vars: `DATABASE_URL` (Render Postgres), `FRONTEND_URL` (your Vercel URL)
4. Deploy

### Frontend on Vercel

1. Vercel → Import `RonitRohil/inventory-system` → root directory: `frontend`
2. Add env var: `VITE_API_URL=<your-render-backend-url>`
3. Deploy

### Docker Hub

```bash
docker build -t ronitrohil/inventory-backend:latest ./backend
docker push ronitrohil/inventory-backend:latest
```

Image: `docker.io/ronitrohil/inventory-backend:latest`

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

- [ ] GitHub: https://github.com/RonitRohil/inventory-system
- [ ] Docker Hub: `docker.io/ronitrohil/inventory-backend:latest`
- [ ] Live frontend URL (Vercel)
- [ ] Live backend URL (Render) — verify `/docs` loads
