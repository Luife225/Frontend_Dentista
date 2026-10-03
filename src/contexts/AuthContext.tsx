import { createContext, useContext, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

export type Role = 'SUPER_ADMIN' | 'ODONTOLOGO' | 'RECEPCIONISTA' | 'ADMIN_CLINICA' | 'PACIENTE'

interface AuthContextType {
  role: Role | null
  login: (role: Role) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null)
  const navigate = useNavigate()

  function login(r: Role) {
    setRole(r)
    // Redirect based on role
    if (r === 'SUPER_ADMIN') {
      navigate('/app/super-admin')
    } else if (r === 'PACIENTE') {
      navigate('/app/patient-portal')
    } else {
      navigate('/app/dashboard')
    }
  }

  function logout() {
    setRole(null)
    navigate('/')
  }

  return (
    <AuthContext.Provider value={{ role, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
