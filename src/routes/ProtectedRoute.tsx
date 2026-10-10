import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth, type Role } from '../contexts/AuthContext'

interface Props {
  children?: React.ReactNode
  /** Restringir a roles específicos (opcional) */
  allowedRoles?: Role[]
  /** Ruta a la cual redirigir si el rol no tiene permisos. Por defecto: /sin-acceso */
  unauthorizedRedirect?: string
}

/**
 * ProtectedRoute (Role Guard / RBAC)
 * Protege vistas requiriendo autenticación real con token JWT válido y rol verificado.
 * El rol en localStorage NO concede acceso por sí solo.
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
  unauthorizedRedirect = '/sin-acceso',
}: Props) {
  const { isAuthenticated, role, user, isRestoringSession } = useAuth()
  const location = useLocation()

  // 1. Mientras se revalida el token contra /api/v1/auth/me en el montaje
  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-xs text-white/50 font-medium tracking-wide">Verificando sesión segura...</p>
        </div>
      </div>
    )
  }

  // 2. No autenticado (sin token válido en memoria o no verificado) → Redirigir a /login
  if (!isAuthenticated || !user || !role) {
    return <Navigate to="/login" replace />
  }

  // 3. Autenticado pero sin el rol requerido → Redirigir a vista de acceso denegado
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={unauthorizedRedirect} state={{ from: location, role }} replace />
  }

  // 4. Cumple autorización de negocio → Renderizar contenido
  return children ? <>{children}</> : <Outlet />
}
