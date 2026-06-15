import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { LoadingScreen } from './LoadingScreen'
import type { Rol } from '../../types'

interface ProtectedRouteProps {
  rol?: Rol
  children: React.ReactNode
}

export function ProtectedRoute({ rol, children }: ProtectedRouteProps) {
  const { usuario, cargando } = useAuthStore()

  if (cargando) return <LoadingScreen />

  if (!usuario) return <Navigate to="/login" replace />

  if (rol && usuario.rol !== rol) {
    if (usuario.rol === 'admin') return <Navigate to="/admin" replace />
    return <Navigate to="/operario" replace />
  }

  return <>{children}</>
}
