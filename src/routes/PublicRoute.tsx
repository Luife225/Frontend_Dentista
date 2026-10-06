import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, type Role } from '../contexts/AuthContext'
import { getDefaultRouteForRole } from './routeHelpers'

interface Props {
  children?: React.ReactNode
}

/**
 * PublicRoute (Guest Guard)
 * Evita que usuarios ya autenticados accedan a rutas de invitados/públicas
 * (como la Landing Page o el Formulario de Login).
 *
 * Si el usuario ya tiene sesión activa:
 *   - Lo redirige de inmediato con `replace: true` al panel de su rol.
 * Si no está autenticado:
 *   - Renderiza el contenido público (`children` o `<Outlet />`).
 */
export default function PublicRoute({ children }: Props) {
  const { isAuthenticated, role, user } = useAuth()

  // Detectar rol activo desde contexto o almacenamiento persistente
  const savedRole = typeof window !== 'undefined' ? (localStorage.getItem('coronyx_role') as Role | null) : null
  const currentRole: Role | null = (role || user?.rol || savedRole) as Role | null
  const isUserAuthenticated = isAuthenticated || Boolean(currentRole)

  if (isUserAuthenticated && currentRole) {
    const destination = getDefaultRouteForRole(currentRole)
    return <Navigate to={destination} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
