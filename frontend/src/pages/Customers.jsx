import { useEffect, useState } from 'react'
import { getCustomers, createCustomer, deleteCustomer } from '../api/client'

const EMPTY_FORM = { full_name: '', email: '', phone: '' }

const s = {
  btn: (color = '#3b82f6') => ({
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    background: color, color: '#fff', fontSize: 13, fontWeight: 600,
  }),
  input: {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 14,
    border: '1px solid #e2e8f0', outline: 'none', marginTop: 4,
    boxSizing: 'border-box',
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

function AddModal({ form, onChange, onSubmit, onClose, error }) {
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: 24, fontSize: 18 }}>Add New Customer</h2>
        {error && <p style={{ color: '#ef4444', marginBottom: 12, fontSize: 13 }}>{error}</p>}
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { key: 'full_name', label: 'Full Name',     type: 'text',  placeholder: 'e.g. Priya Sharma' },
            { key: 'email',     label: 'Email Address', type: 'email', placeholder: 'priya@example.com' },
            { key: 'phone',     label: 'Phone Number',  type: 'tel',   placeholder: '+91 98765 43210' },
          ].map(({ key, label, ...rest }) => (
            <div key={key}>
              <label style={s.label}>{label}</label>
              <input
                {...rest}
                value={form[key]}
                onChange={(e) => onChange(key, e.target.value)}
                style={s.input}
                required
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={s.btn('#94a3b8')}>Cancel</button>
            <button type="submit" style={s.btn()}>Add Customer</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [showAdd, setShowAdd]     = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')

  const load = () => {
    setLoading(true)
    getCustomers()
      .then(setCustomers)
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

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      await createCustomer(form)
      setShowAdd(false)
      load()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await deleteCustomer(id)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Customers</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>{customers.length} registered customers</p>
        </div>
        <button style={s.btn()} onClick={openAdd}>+ Add Customer</button>
      </div>

      {error   && <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>}
      {loading && <p style={{ color: '#64748b' }}>Loading…</p>}

      {!loading && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden' }}>
          {customers.length === 0 ? (
            <p style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>No customers yet — add your first one!</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', fontSize: 13, color: '#64748b', textAlign: 'left' }}>
                  {['Name', 'Email', 'Phone', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px 20px', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '13px 20px', fontWeight: 500 }}>{c.full_name}</td>
                    <td style={{ padding: '13px 20px', color: '#64748b' }}>{c.email}</td>
                    <td style={{ padding: '13px 20px', color: '#64748b' }}>{c.phone}</td>
                    <td style={{ padding: '13px 20px' }}>
                      <button onClick={() => handleDelete(c.id, c.full_name)} style={s.btn('#ef4444')}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showAdd && (
        <AddModal
          form={form}
          onChange={handleChange}
          onSubmit={handleAdd}
          onClose={() => setShowAdd(false)}
          error={formError}
        />
      )}
    </div>
  )
}
