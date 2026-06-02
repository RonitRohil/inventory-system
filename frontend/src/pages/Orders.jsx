import { useEffect, useState } from 'react'
import { getOrders, createOrder, deleteOrder, getCustomers, getProducts } from '../api/client'

const s = {
  btn: (color = '#3b82f6') => ({
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    background: color, color: '#fff', fontSize: 13, fontWeight: 600,
  }),
  select: {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 14,
    border: '1px solid #e2e8f0', outline: 'none', marginTop: 4,
    background: '#fff', boxSizing: 'border-box',
  },
  input: {
    padding: '9px 12px', borderRadius: 8, fontSize: 14,
    border: '1px solid #e2e8f0', outline: 'none',
    boxSizing: 'border-box',
  },
  label: { fontSize: 13, fontWeight: 600, color: '#475569' },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modal: {
    background: '#fff', borderRadius: 16, padding: 32, width: '100%',
    maxWidth: 580, boxShadow: '0 20px 60px rgba(0,0,0,.2)',
    maxHeight: '90vh', overflowY: 'auto',
  },
}

const statusColor = {
  pending:   { bg: '#fef3c7', text: '#92400e' },
  completed: { bg: '#d1fae5', text: '#065f46' },
  cancelled: { bg: '#fee2e2', text: '#991b1b' },
}

// ─── Create Order Modal ───────────────────────────────────────────────────────
function CreateOrderModal({ customers, products, onSubmit, onClose, error }) {
  const [customerId, setCustomerId] = useState('')
  const [rows, setRows] = useState([{ product_id: '', quantity: 1 }])

  const addRow = () => setRows((r) => [...r, { product_id: '', quantity: 1 }])
  const removeRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i))
  const updateRow = (i, field, value) =>
    setRows((r) => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row))

  const total = rows.reduce((sum, row) => {
    const p = products.find((p) => p.id === parseInt(row.product_id))
    return sum + (p ? p.price * (parseInt(row.quantity) || 0) : 0)
  }, 0)

  const handleSubmit = (e) => {
    e.preventDefault()
    const items = rows
      .filter((r) => r.product_id && parseInt(r.quantity) > 0)
      .map((r) => ({ product_id: parseInt(r.product_id), quantity: parseInt(r.quantity) }))
    if (!customerId) return
    if (items.length === 0) return
    onSubmit({ customer_id: parseInt(customerId), items })
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: 24, fontSize: 18 }}>Create New Order</h2>
        {error && <p style={{ color: '#ef4444', marginBottom: 12, fontSize: 13 }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Customer */}
          <div>
            <label style={s.label}>Customer</label>
            <select
              style={s.select}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            >
              <option value="">— Select a customer —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
              ))}
            </select>
          </div>

          {/* Product rows */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={s.label}>Products</label>
              <button type="button" onClick={addRow} style={{ ...s.btn('#10b981'), padding: '4px 12px', fontSize: 12 }}>
                + Add Product
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rows.map((row, i) => {
                const selectedProduct = products.find((p) => p.id === parseInt(row.product_id))
                return (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select
                      style={{ ...s.select, flex: 1, marginTop: 0 }}
                      value={row.product_id}
                      onChange={(e) => updateRow(i, 'product_id', e.target.value)}
                      required
                    >
                      <option value="">— Select product —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                          {p.name} — ₹{parseFloat(p.price).toFixed(2)} (stock: {p.quantity})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={selectedProduct?.quantity || 9999}
                      value={row.quantity}
                      onChange={(e) => updateRow(i, 'quantity', e.target.value)}
                      style={{ ...s.input, width: 70 }}
                      required
                    />
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        style={{ ...s.btn('#ef4444'), padding: '8px 10px' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Running total */}
          <div style={{
            background: '#f8fafc', borderRadius: 10, padding: '12px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>Estimated Total</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>₹{total.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={s.btn('#94a3b8')}>Cancel</button>
            <button type="submit" style={s.btn()}>Place Order</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Order Details Modal ──────────────────────────────────────────────────────
function DetailsModal({ order, onClose }) {
  const sc = statusColor[order.status] || { bg: '#f1f5f9', text: '#64748b' }
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>Order #{order.id}</h2>
            <span style={{
              background: sc.bg, color: sc.text,
              borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700,
            }}>
              {order.status.toUpperCase()}
            </span>
          </div>
          <button onClick={onClose} style={{ ...s.btn('#94a3b8'), padding: '6px 12px' }}>✕ Close</button>
        </div>

        {/* Customer info */}
        {order.customer && (
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Customer</p>
            <p style={{ fontWeight: 600 }}>{order.customer.full_name}</p>
            <p style={{ fontSize: 13, color: '#64748b' }}>{order.customer.email} · {order.customer.phone}</p>
          </div>
        )}

        {/* Items */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <thead>
            <tr style={{ background: '#f8fafc', fontSize: 13, color: '#64748b', textAlign: 'left' }}>
              {['Product', 'Qty', 'Unit Price', 'Subtotal'].map((h) => (
                <th key={h} style={{ padding: '10px 14px', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((item) => (
              <tr key={item.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 14px', fontWeight: 500 }}>
                  {item.product?.name || `Product #${item.product_id}`}
                </td>
                <td style={{ padding: '10px 14px' }}>{item.quantity}</td>
                <td style={{ padding: '10px 14px' }}>₹{parseFloat(item.unit_price).toFixed(2)}</td>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                  ₹{(item.quantity * item.unit_price).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>
            Total: ₹{parseFloat(order.total_amount).toFixed(2)}
          </span>
        </div>

        {order.created_at && (
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 16 }}>
            Placed on {new Date(order.created_at).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Orders() {
  const [orders, setOrders]       = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [modalLoading, setModalLoading] = useState(false)
  const [error, setError]         = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [formError, setFormError]   = useState('')
  const [viewing, setViewing]       = useState(null)

  // Only fetch orders on mount — customers/products load lazily when modal opens
  const loadOrders = () => {
    setLoading(true)
    getOrders()
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(loadOrders, [])

  const handleCreate = async (payload) => {
    try {
      await createOrder(payload)
      setShowCreate(false)
      setFormError('')
      loadOrders()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(`Cancel order #${id}? Stock will be restored.`)) return
    try {
      await deleteOrder(id)
      loadOrders()
    } catch (err) {
      alert(err.message)
    }
  }

  const openCreate = () => {
    setFormError('')
    setShowCreate(true)
    // Fetch customers + products only when the modal is actually opened
    if (customers.length === 0 || products.length === 0) {
      setModalLoading(true)
      Promise.all([getCustomers(), getProducts()])
        .then(([c, p]) => { setCustomers(c); setProducts(p) })
        .catch((e) => setFormError(e.message))
        .finally(() => setModalLoading(false))
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Orders</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>{orders.length} orders total</p>
        </div>
        <button style={s.btn()} onClick={openCreate}>+ New Order</button>
      </div>

      {error   && <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>}
      {loading && <p style={{ color: '#64748b' }}>Loading…</p>}

      {!loading && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden' }}>
          {orders.length === 0 ? (
            <p style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>No orders yet — create the first one!</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', fontSize: 13, color: '#64748b', textAlign: 'left' }}>
                  {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px 20px', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const sc = statusColor[o.status] || { bg: '#f1f5f9', text: '#64748b' }
                  return (
                    <tr key={o.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '13px 20px', fontWeight: 700, color: '#3b82f6' }}>#{o.id}</td>
                      <td style={{ padding: '13px 20px' }}>
                        {o.customer?.full_name || `Customer #${o.customer_id}`}
                      </td>
                      <td style={{ padding: '13px 20px', color: '#64748b' }}>
                        {o.order_items?.length ?? '—'} item{o.order_items?.length !== 1 ? 's' : ''}
                      </td>
                      <td style={{ padding: '13px 20px', fontWeight: 600 }}>
                        ₹{parseFloat(o.total_amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{
                          background: sc.bg, color: sc.text,
                          borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700,
                        }}>
                          {o.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '13px 20px', color: '#64748b', fontSize: 13 }}>
                        {o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '13px 20px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setViewing(o)} style={s.btn('#6366f1')}>Details</button>
                          <button onClick={() => handleDelete(o.id)} style={s.btn('#ef4444')}>Cancel</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showCreate && (
        <CreateOrderModal
          customers={customers}
          products={products}
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
          error={formError}
        />
      )}

      {viewing && (
        <DetailsModal order={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  )
}
