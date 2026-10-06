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
 * Protege vistas requiriendo autenticación y validando roles permitidos.
 * - Si no está autenticado: redirige a /login con replace: true
 * - Si está autenticado pero su rol no está autorizado: redirige a /sin-acceso con replace: true
 * - Si tiene autorización: renderiza children o <Outlet />
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
  unauthorizedRedirect = '/sin-acceso',
}: Props) {
  const { isAuthenticated, role, user } = useAuth()
  const location = useLocation()

  const savedRole = typeof window !== 'undefined' ? (localStorage.getItem('coronyx_role') as Role | null) : null
  const currentRole: Role | null = (role || user?.rol || savedRole) as Role | null
  const isAuth = Boolean(currentRole && (isAuthenticated || savedRole))

  // 1. No autenticado → Redirigir de inmediato a /login con replace: true
  if (!isAuth || !currentRole) {
    return <Navigate to="/login" replace />
  }

  // 2. Autenticado pero sin el rol requerido → Redirigir a vista de acceso denegado
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
    return <Navigate to={unauthorizedRedirect} state={{ from: location, role: currentRole }} replace />
  }

  // 3. Cumple las condiciones → Renderizar children u Outlet
  return children ? <>{children}</> : <Outlet />
}
