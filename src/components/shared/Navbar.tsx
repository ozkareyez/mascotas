import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function Navbar() {
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'var(--orange)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 800, fontSize: '18px', color: '#fff', letterSpacing: '-0.3px' }}>
          MascotasCRM
        </span>
        {usuario?.rol === 'admin' && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => navigate('/admin')}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius)',
                fontSize: '13px',
                fontWeight: location.pathname === '/admin' ? 700 : 500,
                background: location.pathname === '/admin' ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: '#fff',
              }}
            >
              Dashboard
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
          {usuario?.nombre}
        </span>
        <button
          onClick={handleLogout}
          style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.7)',
            padding: '4px 8px',
            borderRadius: 'var(--radius)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          Salir
        </button>
      </div>
    </nav>
  )
}
