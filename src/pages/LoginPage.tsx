import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { toast } from 'sonner'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const { login, usuario } = useAuthStore()
  const navigate = useNavigate()

  if (usuario) {
    navigate(usuario.rol === 'admin' ? '/admin' : '/operario', { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Ingresa email y contraseña')
      return
    }
    setCargando(true)
    try {
      await login(email, password)
      const u = useAuthStore.getState().usuario
      if (u) {
        navigate(u.rol === 'admin' ? '/admin' : '/operario', { replace: true })
      } else {
        toast.error('Usuario no encontrado')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--bg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -80,
          right: -80,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'var(--orange-bg)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -60,
          left: -60,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'var(--orange-bg)',
        }}
      />
      <Card style={{ maxWidth: 380, width: '100%', padding: 32, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--orange)', marginBottom: 4 }}>
            MascotasCRM
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text2)' }}>
            Inicia sesión para continuar
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid var(--border)`,
                borderRadius: 'var(--radius)',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--orange)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid var(--border)`,
                borderRadius: 'var(--radius)',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--orange)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
            />
          </div>

          <Button type="submit" size="lg" disabled={cargando} style={{ width: '100%' }}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
