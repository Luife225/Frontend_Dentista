import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { type LoginResponse, getMeFromApi, isOperativeRole, validateOperativeSession } from '../services/authService'
import { getJwtToken, clearAuthStorage } from '../services/apiClient'
import { getDefaultRouteForRole } from '../routes/routeHelpers'

export type Role = 'SUPER_ADMIN' | 'ODONTOLOGO' | 'RECEPCIONISTA' | 'ADMIN_CLINICA' | 'PACIENTE'

interface AuthContextType {
  role: Role | null
  user: LoginResponse | null
  isAuthenticated: boolean
  isRestoringSession: boolean
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
  const [user, setUser] = useState<LoginResponse | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(true)
  const navigate = useNavigate()

  // Restaurar y revalidar sesión con GET /api/v1/auth/me en el montaje
  useEffect(() => {
    let isMounted = true

    async function restoreSession() {
      const token = getJwtToken()
      if (!token) {
        clearAuthStorage()
        if (isMounted) {
          setUser(null)
          setRole(null)
          setIsRestoringSession(false)
        }
        return
      }

      try {
        // Revalidación real contra la base de datos a través de /auth/me
        const validatedSession = await getMeFromApi()
        if (isMounted) {
          setUser(validatedSession)
          setRole(validatedSession.rol)
          localStorage.setItem('coronyx_user', JSON.stringify(validatedSession))
          localStorage.setItem('coronyx_role', validatedSession.rol)
        }
      } catch (err) {
        console.warn('[AUTH] Error al revalidar sesión con /auth/me:', err)
        clearAuthStorage()
        if (isMounted) {
          setUser(null)
          setRole(null)
        }
      } finally {
        if (isMounted) {
          setIsRestoringSession(false)
        }
      }
    }

    restoreSession()

    // Escuchar eventos de 401 emitidos centralizadamente por apiClient
    const handleUnauthorizedEvent = () => {
      logout()
    }

    window.addEventListener('coronyx:unauthorized', handleUnauthorizedEvent)

    return () => {
      isMounted = false
      window.removeEventListener('coronyx:unauthorized', handleUnauthorizedEvent)
    }
  }, [])

  // Invalidador de BFCache: si el navegador intenta restaurar la vista desde memoria tras cerrar sesión
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        const token = getJwtToken()
        if (!token) {
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
    validateOperativeSession(session)
    if (!session.token) throw new Error('No se recibió un token de sesión válido')
    setUser(session)
    setRole(session.rol)
    if (session.token) {
      localStorage.setItem('coronyx_jwt_token', session.token)
    }
    localStorage.setItem('coronyx_role', session.rol)
    localStorage.setItem('coronyx_user', JSON.stringify(session))
    sessionStorage.removeItem('coronyx_logged_out')
    redirectByRole(session.rol, targetRoute)
  }

  function logout() {
    clearAuthStorage()
    setUser(null)
    setRole(null)
    sessionStorage.clear()
    sessionStorage.setItem('coronyx_logged_out', 'true')
    window.location.replace('/login')
  }

  // El acceso requiere tener usuario real con token y rol verificado
  const isAuthenticated = Boolean(user && user.token && isOperativeRole(role))

  return (
    <AuthContext.Provider value={{ role, user, isAuthenticated, isRestoringSession, loginWithSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
