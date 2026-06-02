import { useEffect, useState } from 'react'
import { getDashboard } from '../api/client'

const cardStyle = (color) => ({
  background: '#fff',
  borderRadius: 12,
  padding: '24px 28px',
  boxShadow: '0 1px 4px rgba(0,0,0,.08)',
  borderLeft: `4px solid ${color}`,
  flex: '1 1 180px',
})

const statColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

export default function Dashboard() {
  const [data, setData]       = useState(null)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ color: '#64748b' }}>Loading dashboard…</p>
  if (error)   return <p style={{ color: '#ef4444' }}>Error: {error}</p>

  const stats = [
    { label: 'Total Products',  value: data.total_products  },
    { label: 'Total Customers', value: data.total_customers },
    { label: 'Total Orders',    value: data.total_orders    },
    { label: 'Low Stock Items', value: data.low_stock_products.length },
  ]

  return (
    <div>
      <h1 style={{ marginBottom: 8, fontSize: 24, fontWeight: 700 }}>Dashboard</h1>
      <p style={{ color: '#64748b', marginBottom: 28 }}>System overview at a glance</p>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 36 }}>
        {stats.map((s, i) => (
          <div key={s.label} style={cardStyle(statColors[i])}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 36, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Low stock table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#ef4444' }}>⚠️</span> Low Stock Products
          <span style={{ fontSize: 12, background: '#fee2e2', color: '#ef4444', borderRadius: 20, padding: '2px 8px', marginLeft: 4 }}>
            ≤ 5 units
          </span>
        </div>

        {data.low_stock_products.length === 0 ? (
          <p style={{ padding: '20px 24px', color: '#64748b' }}>All products are well stocked ✅</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', fontSize: 13, color: '#64748b', textAlign: 'left' }}>
                {['Product', 'SKU', 'Price', 'Qty Left'].map((h) => (
                  <th key={h} style={{ padding: '10px 24px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.low_stock_products.map((p) => (
                <tr key={p.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 24px', fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: '12px 24px', color: '#64748b', fontFamily: 'monospace' }}>{p.sku}</td>
                  <td style={{ padding: '12px 24px' }}>₹{p.price.toFixed(2)}</td>
                  <td style={{ padding: '12px 24px' }}>
                    <span style={{ background: '#fee2e2', color: '#ef4444', borderRadius: 6, padding: '2px 10px', fontWeight: 600 }}>
                      {p.quantity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
