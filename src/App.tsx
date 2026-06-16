import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from './store/authStore'
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import { LoadingScreen } from './components/shared/LoadingScreen'
import { LoginPage } from './pages/LoginPage'

function ServiceWorkerManager() {
  useEffect(() => {
    let refrescando = false
    const manejarActualizacion = () => {
      if (refrescando) return
      refrescando = true
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg && reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' })
            window.location.reload()
          }
        })
      }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          reg.addEventListener('updatefound', () => {
            const nuevoSW = reg.installing
            if (nuevoSW) {
              nuevoSW.addEventListener('statechange', () => {
                if (nuevoSW.state === 'installed' && navigator.serviceWorker.controller) {
                  manejarActualizacion()
                }
              })
            }
          })
        }
      })

      let recarga = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (recarga) return
        recarga = true
        window.location.reload()
      })
    }
  }, [])

  return null
}

const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })))
const OperarioPage = lazy(() => import('./pages/OperarioPage').then(m => ({ default: m.OperarioPage })))

function AppRoutes() {
  const { inicializar, cargando } = useAuthStore()

  useEffect(() => {
    inicializar()
  }, [inicializar])

  if (cargando) {
    return <LoadingScreen />
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
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
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ServiceWorkerManager />
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
