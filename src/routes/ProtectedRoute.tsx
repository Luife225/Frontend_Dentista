import { Navigate } from 'react-router-dom'
import { useAuth, type Role } from '../contexts/AuthContext'

interface Props {
  children: React.ReactNode
  /** Optional: restrict to specific roles */
  allowedRoles?: Role[]
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { role } = useAuth()

  // Not authenticated → redirect to login
  if (!role) {
    return <Navigate to="/login" replace />
  }

  // Authenticated but role not allowed → redirect to app root
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/app/dashboard" replace />
  }

  return <>{children}</>
}
