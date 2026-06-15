import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from './store/authStore'
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import { LoadingScreen } from './components/shared/LoadingScreen'
import { LoginPage } from './pages/LoginPage'
import { OperarioPage } from './pages/OperarioPage'
import { AdminPage } from './pages/AdminPage'

function AppRoutes() {
  const { inicializar, cargando } = useAuthStore()

  useEffect(() => {
    inicializar()
  }, [inicializar])

  if (cargando) {
    return <LoadingScreen />
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/operario"
        element={
          <ProtectedRoute rol="operario">
            <OperarioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute rol="admin">
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontSize: '14px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  )
}
