# Inventory & Order Management System

A production-ready full-stack application to manage products, customers, and orders — built with FastAPI, React, PostgreSQL, and Docker.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, FastAPI, SQLAlchemy |
| Frontend | React 18, Vite, React Router |
| Database | PostgreSQL 16 |
| Containerization | Docker, Docker Compose |

## Project Structure

```
inventory-system/
├── backend/
│   ├── app/
│   │   ├── main.py          # App entry, CORS, dashboard endpoint
│   │   ├── database.py      # DB connection & session
│   │   ├── models.py        # SQLAlchemy ORM models
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   └── routers/
│   │       ├── products.py  # CRUD + SKU uniqueness
│   │       ├── customers.py # CRUD + email uniqueness
│   │       └── orders.py    # Create (stock check + auto-deduct) + get + cancel
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/client.js    # Centralised API calls
│   │   ├── pages/           # Dashboard, Products, Customers, Orders
│   │   └── components/      # Shared UI components
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── .gitignore
```

## Local Development (Docker)

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/inventory-system.git
cd inventory-system

# 2. Copy and configure env
cp .env.example .env

# 3. Start all services
docker compose up --build

# App is now running at:
#   Frontend  → http://localhost:5173
#   Backend   → http://localhost:8000
#   API Docs  → http://localhost:8000/docs
```

## Local Development (Without Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set your local DB URL
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_db

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
# Create .env.local with:  VITE_API_URL=http://localhost:8000
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Summary stats + low stock |
| POST | `/products` | Create product |
| GET | `/products` | List all products |
| GET | `/products/{id}` | Get product |
| PUT | `/products/{id}` | Update product |
| DELETE | `/products/{id}` | Delete product |
| POST | `/customers` | Create customer |
| GET | `/customers` | List all customers |
| GET | `/customers/{id}` | Get customer |
| DELETE | `/customers/{id}` | Delete customer |
| POST | `/orders` | Create order (auto-deducts stock) |
| GET | `/orders` | List all orders |
| GET | `/orders/{id}` | Get order details |
| DELETE | `/orders/{id}` | Cancel order (restores stock) |

Interactive Swagger docs at `/docs` when running locally.

## Business Logic

- Product SKU must be unique across all products
- Customer email must be unique
- Product quantity can never go negative
- Orders are rejected if requested quantity exceeds available stock
- Creating an order automatically deducts stock for each item
- Cancelling an order restores stock
- Order total is calculated automatically from `unit_price × quantity`

## Deployment

### Backend → Render

1. Push code to GitHub
2. New Web Service → connect repo → set root to `backend/`
3. Set environment variables: `DATABASE_URL`, `FRONTEND_URL`
4. Deploy

### Frontend → Vercel

1. New Project → import GitHub repo → set root to `frontend/`
2. Set environment variable: `VITE_API_URL=<your-render-backend-url>`
3. Deploy

### Docker Hub (backend image)

```bash
docker build -t YOUR_USERNAME/inventory-backend:latest ./backend
docker push YOUR_USERNAME/inventory-backend:latest
```

## Submission Checklist

- [ ] GitHub repository link
- [ ] Docker Hub image link (`YOUR_USERNAME/inventory-backend:latest`)
- [ ] Live frontend URL (Vercel)
- [ ] Live backend API URL (Render)
