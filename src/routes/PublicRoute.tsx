import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getDefaultRouteForRole } from './routeHelpers'

interface Props {
  children?: React.ReactNode
}

/**
 * PublicRoute (Guest Guard)
 * Evita que usuarios con sesión activa ingresen a páginas de login o landing pública.
 * Solo redirige si hay una sesión autenticada real con token verificado.
 */
export default function PublicRoute({ children }: Props) {
  const { isAuthenticated, role, user, isRestoringSession } = useAuth()

  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-xs text-white/50 font-medium tracking-wide">Cargando...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated && role && user) {
    const destination = getDefaultRouteForRole(role)
    return <Navigate to={destination} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
