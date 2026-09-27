import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LoginResponse } from '../services/authService'

export type Role = 'SUPER_ADMIN' | 'ODONTOLOGO' | 'RECEPCIONISTA' | 'ADMIN_CLINICA' | 'PACIENTE'

interface AuthContextType {
  role: Role | null
  user: LoginResponse | null
  login: (role: Role) => void
  loginWithSession: (session: LoginResponse) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(() => {
    const saved = localStorage.getItem('coronyx_role')
    return (saved as Role) || null
  })
  const [user, setUser] = useState<LoginResponse | null>(() => {
    const saved = localStorage.getItem('coronyx_user')
    return saved ? JSON.parse(saved) : null
  })

  const navigate = useNavigate()

  function redirectByRole(r: Role) {
    if (r === 'SUPER_ADMIN') {
      navigate('/app/super-admin')
    } else if (r === 'PACIENTE') {
      navigate('/app/patient-portal')
    } else {
      navigate('/app/dashboard')
    }
  }

  function loginWithSession(session: LoginResponse) {
    setUser(session)
    setRole(session.rol)
    localStorage.setItem('coronyx_role', session.rol)
    localStorage.setItem('coronyx_user', JSON.stringify(session))
    redirectByRole(session.rol)
  }

  function login(r: Role) {
    setRole(r)
    localStorage.setItem('coronyx_role', r)
    redirectByRole(r)
  }

  function logout() {
    setRole(null)
    setUser(null)
    localStorage.removeItem('coronyx_role')
    localStorage.removeItem('coronyx_user')
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ role, user, login, loginWithSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
