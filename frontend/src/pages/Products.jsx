import { useEffect, useState } from 'react'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/client'

const EMPTY_FORM = { name: '', sku: '', price: '', quantity: '' }

const s = {
  btn: (color = '#3b82f6') => ({
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    background: color, color: '#fff', fontSize: 13, fontWeight: 600,
  }),
  input: {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 14,
    border: '1px solid #e2e8f0', outline: 'none', marginTop: 4,
  },
  label: { fontSize: 13, fontWeight: 600, color: '#475569' },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modal: {
    background: '#fff', borderRadius: 16, padding: 32, width: '100%',
    maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,.2)',
  },
}

function Modal({ title, form, onChange, onSubmit, onClose, error }) {
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: 24, fontSize: 18 }}>{title}</h2>
        {error && <p style={{ color: '#ef4444', marginBottom: 12, fontSize: 13 }}>{error}</p>}
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { key: 'name',     label: 'Product Name', type: 'text',   placeholder: 'e.g. Laptop Stand' },
            { key: 'sku',      label: 'SKU / Code',   type: 'text',   placeholder: 'e.g. LS-001' },
            { key: 'price',    label: 'Price (₹)',    type: 'number', placeholder: '0.00', step: '0.01' },
            { key: 'quantity', label: 'Qty in Stock', type: 'number', placeholder: '0' },
          ].map(({ key, label, ...rest }) => (
            <div key={key}>
              <label style={s.label}>{label}</label>
              <input
                {...rest}
                value={form[key]}
                onChange={(e) => onChange(key, e.target.value)}
                style={s.input}
                required
                min={key === 'quantity' ? 0 : undefined}
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={s.btn('#94a3b8')}>Cancel</button>
            <button type="submit" style={s.btn()}>Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  // Modal state
  const [showAdd, setShowAdd]   = useState(false)
  const [editing, setEditing]   = useState(null)   // product object being edited
  const [form, setForm]         = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')

  const load = () => {
    setLoading(true)
    getProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setFormError('')
    setShowAdd(true)
  }

  const openEdit = (product) => {
    setForm({ name: product.name, sku: product.sku, price: product.price, quantity: product.quantity })
    setFormError('')
    setEditing(product)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      await createProduct({ ...form, price: parseFloat(form.price), quantity: parseInt(form.quantity) })
      setShowAdd(false)
      load()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    try {
      await updateProduct(editing.id, { ...form, price: parseFloat(form.price), quantity: parseInt(form.quantity) })
      setEditing(null)
      load()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await deleteProduct(id)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  const badgeColor = (qty) => qty === 0 ? '#ef4444' : qty <= 5 ? '#f59e0b' : '#10b981'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Products</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>{products.length} products in inventory</p>
        </div>
        <button style={s.btn()} onClick={openAdd}>+ Add Product</button>
      </div>

      {error   && <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>}
      {loading && <p style={{ color: '#64748b' }}>Loading…</p>}

      {!loading && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden' }}>
          {products.length === 0 ? (
            <p style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>No products yet — add your first one!</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', fontSize: 13, color: '#64748b', textAlign: 'left' }}>
                  {['Name', 'SKU', 'Price', 'Stock', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px 20px', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '13px 20px', fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '13px 20px', color: '#64748b', fontFamily: 'monospace', fontSize: 13 }}>{p.sku}</td>
                    <td style={{ padding: '13px 20px' }}>₹{parseFloat(p.price).toFixed(2)}</td>
                    <td style={{ padding: '13px 20px' }}>
                      <span style={{ background: badgeColor(p.quantity) + '1a', color: badgeColor(p.quantity), borderRadius: 6, padding: '3px 10px', fontWeight: 600, fontSize: 13 }}>
                        {p.quantity} units
                      </span>
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(p)} style={s.btn('#6366f1')}>Edit</button>
                        <button onClick={() => handleDelete(p.id, p.name)} style={s.btn('#ef4444')}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showAdd && (
        <Modal
          title="Add New Product"
          form={form}
          onChange={handleChange}
          onSubmit={handleAdd}
          onClose={() => setShowAdd(false)}
          error={formError}
        />
      )}

      {editing && (
        <Modal
          title={`Edit — ${editing.name}`}
          form={form}
          onChange={handleChange}
          onSubmit={handleEdit}
          onClose={() => setEditing(null)}
          error={formError}
        />
      )}
    </div>
  )
}
