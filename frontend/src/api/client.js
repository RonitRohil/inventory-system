// Central API client — all fetch calls go through here.
// Set VITE_API_URL in .env (e.g. http://localhost:8000 or your Render URL).

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (res.status === 204) return null          // No Content (delete)
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Request failed')
  return data
}

// ─── Dashboard ───────────────────────────────────────────────
export const getDashboard = () => request('/dashboard')

// ─── Products ────────────────────────────────────────────────
export const getProducts   = ()         => request('/products')
export const getProduct    = (id)       => request(`/products/${id}`)
export const createProduct = (body)     => request('/products', { method: 'POST', body })
export const updateProduct = (id, body) => request(`/products/${id}`, { method: 'PUT', body })
export const deleteProduct = (id)       => request(`/products/${id}`, { method: 'DELETE' })

// ─── Customers ───────────────────────────────────────────────
export const getCustomers   = ()     => request('/customers')
export const getCustomer    = (id)   => request(`/customers/${id}`)
export const createCustomer = (body) => request('/customers', { method: 'POST', body })
export const deleteCustomer = (id)   => request(`/customers/${id}`, { method: 'DELETE' })

// ─── Orders ──────────────────────────────────────────────────
export const getOrders   = ()     => request('/orders')
export const getOrder    = (id)   => request(`/orders/${id}`)
export const createOrder = (body) => request('/orders', { method: 'POST', body })
export const deleteOrder = (id)   => request(`/orders/${id}`, { method: 'DELETE' })
