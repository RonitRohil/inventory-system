import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Customers from './pages/Customers'
import Orders from './pages/Orders'

const navItems = [
  { to: '/',          label: '📊 Dashboard'  },
  { to: '/products',  label: '📦 Products'   },
  { to: '/customers', label: '👤 Customers'  },
  { to: '/orders',    label: '🛒 Orders'     },
]

const styles = {
  sidebar: {
    width: 220, minHeight: '100vh', background: '#1e293b', color: '#f8fafc',
    display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0,
  },
  logo: {
    padding: '0 24px 28px', fontSize: 17, fontWeight: 700,
    borderBottom: '1px solid #334155', marginBottom: 12,
  },
  link: {
    display: 'block', padding: '11px 24px', textDecoration: 'none',
    color: '#94a3b8', fontSize: 14, fontWeight: 500, transition: 'all .15s',
  },
  activeLink: { color: '#f8fafc', background: '#334155', borderLeft: '3px solid #3b82f6' },
  main: { flex: 1, padding: 32, maxWidth: 1100 },
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <nav style={styles.sidebar}>
          <div style={styles.logo}>🏭 InvManager</div>
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive ? styles.activeLink : {}),
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Page content */}
        <main style={styles.main}>
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/products"  element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/orders"    element={<Orders />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
