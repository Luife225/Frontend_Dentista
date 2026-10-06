import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LoginResponse } from '../services/authService'
import { getDefaultRouteForRole } from '../routes/routeHelpers'

export type Role = 'SUPER_ADMIN' | 'ODONTOLOGO' | 'RECEPCIONISTA' | 'ADMIN_CLINICA' | 'PACIENTE'

interface AuthContextType {
  role: Role | null
  user: LoginResponse | null
  isAuthenticated: boolean
  login: (role: Role, targetRoute?: string) => void
  loginWithSession: (session: LoginResponse, targetRoute?: string) => void
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
    const saved = typeof window !== 'undefined' ? localStorage.getItem('coronyx_role') : null
    return (saved as Role) || null
  })
  const [user, setUser] = useState<LoginResponse | null>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('coronyx_user') : null
    return saved ? JSON.parse(saved) : null
  })

  const navigate = useNavigate()

  const isAuthenticated = Boolean(role || user?.rol)

  // Invalidador de BFCache (Back-Forward Cache): si el navegador intenta restaurar la vista desde memoria tras cerrar sesión
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        const saved = localStorage.getItem('coronyx_role')
        if (!saved) {
          window.location.replace('/login')
        }
      }
    }

    window.addEventListener('pageshow', handlePageShow)
    return () => {
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  function redirectByRole(r: Role, targetRoute?: string) {
    const destination = targetRoute || getDefaultRouteForRole(r)
    navigate(destination, { replace: true })
  }

  function loginWithSession(session: LoginResponse, targetRoute?: string) {
    setUser(session)
    setRole(session.rol)
    localStorage.setItem('coronyx_role', session.rol)
    localStorage.setItem('coronyx_user', JSON.stringify(session))
    sessionStorage.removeItem('coronyx_logged_out')
    redirectByRole(session.rol, targetRoute)
  }

  function login(r: Role, targetRoute?: string) {
    const demoUser: LoginResponse = {
      id: `demo-${r.toLowerCase()}`,
      correo: `${r.toLowerCase()}@coronyx.co`,
      nombres: r,
      apellidos: 'Demo',
      nombreCompleto: `${r} Demo`,
      rol: r,
    }
    setRole(r)
    setUser(demoUser)
    localStorage.setItem('coronyx_role', r)
    localStorage.setItem('coronyx_user', JSON.stringify(demoUser))
    sessionStorage.removeItem('coronyx_logged_out')
    redirectByRole(r, targetRoute)
  }

  function logout() {
    setRole(null)
    setUser(null)
    localStorage.removeItem('coronyx_role')
    localStorage.removeItem('coronyx_user')
    localStorage.removeItem('coronyx_jwt_token')
    sessionStorage.clear()
    sessionStorage.setItem('coronyx_logged_out', 'true')
    // window.location.replace destruye todo el contexto en memoria y reemplaza la entrada en el historial
    window.location.replace('/login')
  }

  return (
    <AuthContext.Provider value={{ role, user, isAuthenticated, login, loginWithSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
