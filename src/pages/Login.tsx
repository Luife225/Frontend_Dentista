import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { loginWithApi, fetchUsersFromApi, UserItem } from '../services/authService'
import coronixLogo from '../imports/coronixlogo.png'

type Role = 'SUPER_ADMIN' | 'ODONTOLOGO' | 'RECEPCIONISTA' | 'ADMIN_CLINICA' | 'PACIENTE'

const ROLE_META: Record<Role, { label: string; desc: string; icon: string; color: string; badge?: string }> = {
  SUPER_ADMIN:   { label: 'Super Admin',   desc: 'Gestión global SaaS, clínicas y planes',    icon: '🌐', color: 'from-amber-500 to-orange-600',  badge: 'SaaS' },
  ODONTOLOGO:    { label: 'Odontólogo',    desc: 'Historia clínica, pacientes, IA',            icon: '🦷', color: 'from-cyan-600 to-cyan-700' },
  RECEPCIONISTA: { label: 'Recepcionista', desc: 'Agenda, citas, inventario',                  icon: '📋', color: 'from-violet-600 to-violet-700' },
  ADMIN_CLINICA: { label: 'Administrador', desc: 'Configuración, usuarios, reportes',          icon: '⚙️', color: 'from-slate-600 to-slate-700' },
  PACIENTE:      { label: 'Paciente',      desc: 'App móvil — mis citas y avances',            icon: '👤', color: 'from-emerald-600 to-emerald-700' },
}

export default function Login() {
  const { loginWithSession } = useAuth()
  const [email, setEmail] = useState('odontologo@coronyx.pe')
  const [password, setPassword] = useState('123456')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [forgot, setForgot] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [dbUsers, setDbUsers] = useState<UserItem[]>([])
  const [dbConnected, setDbConnected] = useState<boolean | null>(null)

  // Cargar usuarios reales registrados en PostgreSQL
  useEffect(() => {
    let isMounted = true
    async function loadUsers() {
      try {
        const users = await fetchUsersFromApi()
        if (!isMounted) return
        setDbUsers(users)
        setDbConnected(true)
      } catch (err) {
        if (!isMounted) return
        setDbConnected(false)
        console.warn('Backend PostgreSQL no accesible o desconectado:', err)
      }
    }
    loadUsers()
    return () => { isMounted = false }
  }, [])

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!email || !password) {
      setErrorMessage('Por favor ingresa tu correo y contraseña')
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const session = await loginWithApi(email, password)
      loginWithSession(session)
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de autenticación con PostgreSQL')
    } finally {
      setLoading(false)
    }
  }

  function selectUserAccount(user: UserItem) {
    setEmail(user.correo)
    setPassword('123456')
    setErrorMessage(null)
  }

  // ── Forgot password screen ───────────────────────────────────────────────────
  if (forgot) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm fade-in">
          <div className="flex items-center gap-3 mb-8">
            <img src={coronixLogo} alt="CORONYX" className="w-12 h-12 object-contain shrink-0"/>
            <div>
              <p className="text-white text-xl font-bold tracking-wide" style={{fontFamily:'Outfit'}}>CORONYX</p>
              <p className="text-xs" style={{color:'#5FC9BE'}}>Sistema Dental</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-white/8 rounded-2xl p-8 shadow-2xl">
            {forgotSent ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <h2 className="text-white font-semibold text-lg mb-2" style={{fontFamily:'Outfit'}}>Revisa tu correo</h2>
                <p className="text-white/50 text-sm mb-6">
                  Enviamos instrucciones a <span className="text-white/80">{email}</span>
                </p>
                <button onClick={() => { setForgot(false); setForgotSent(false) }}
                  className="w-full py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 transition-colors">
                  Volver al login
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-white font-semibold text-xl mb-1" style={{fontFamily:'Outfit'}}>Recuperar contraseña</h2>
                <p className="text-white/40 text-sm mb-6">Ingresa tu email y te enviaremos el enlace</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/50 font-medium block mb-1.5">Email</label>
                    <input value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50" />
                  </div>
                  <button onClick={() => setForgotSent(true)}
                    className="w-full py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 transition-colors">
                    Enviar instrucciones
                  </button>
                  <button onClick={() => setForgot(false)} className="w-full text-center text-sm text-white/40 hover:text-white/70 transition-colors">
                    Volver al login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Main login screen ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-80 border-r border-white/5 p-10 shrink-0"
        style={{background:'linear-gradient(to bottom, #0B3D3A, #062422)'}}>
        <div>
          <div className="flex items-center gap-3 mb-12">
            <img src={coronixLogo} alt="CORONYX" className="w-14 h-14 object-contain shrink-0"/>
            <div>
              <p className="text-white text-xl font-bold tracking-wide leading-tight" style={{fontFamily:'Outfit'}}>CORONYX</p>
              <p className="text-xs" style={{color:'#5FC9BE'}}>Sistema Dental</p>
            </div>
          </div>

          <h1 className="text-white text-3xl font-bold leading-tight mb-4" style={{fontFamily:'Outfit'}}>
            Gestión clínica inteligente
          </h1>
          <p className="text-white/40 text-sm leading-relaxed mb-8">
            Plataforma con base de datos real en PostgreSQL, roles institucionales y seguridad por perfiles.
          </p>

          <div className="space-y-3">
            {(['ODONTOLOGO','RECEPCIONISTA','ADMIN_CLINICA','PACIENTE'] as Role[]).map(r => (
              <div key={r} className="flex items-center gap-3 text-sm text-white/40">
                <span className="text-base">{ROLE_META[r].icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-white/60">{ROLE_META[r].label}</span>
                  <span className="text-white/30"> — {ROLE_META[r].desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/20 text-xs">CORONYX Enterprise · PostgreSQL 16 · v2.0</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md fade-in">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src={coronixLogo} alt="CORONYX" className="w-10 h-10 object-contain shrink-0"/>
            <div>
              <p className="text-white text-lg font-bold tracking-wide" style={{fontFamily:'Outfit'}}>CORONYX</p>
              <p className="text-xs" style={{color:'#5FC9BE'}}>Sistema Dental</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-white/8 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white text-2xl font-semibold" style={{fontFamily:'Outfit'}}>Iniciar Sesión</h2>
                <p className="text-white/40 text-xs mt-0.5">Ingresa con tus credenciales reales</p>
              </div>
              {dbConnected === true && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  PostgreSQL Conectado
                </span>
              )}
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
                <span className="text-base leading-none">⚠</span>
                <span className="flex-1">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-xs text-white/50 font-medium block mb-1.5">Correo electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  placeholder="usuario@coronyx.pe"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-xs text-white/50 font-medium block mb-1.5">Contraseña</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={() => setForgot(true)} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Real accounts registered in PostgreSQL */}
              {dbUsers.length > 0 && (
                <div className="bg-white/3 border border-white/8 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] text-white/40 font-medium">Cuentas activas en PostgreSQL:</p>
                    <span className="text-[10px] text-cyan-400 font-mono">Clave: 123456</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {dbUsers.map(u => {
                      const meta = ROLE_META[u.rol as Role] || { icon: '👤', label: u.rol }
                      const isSelected = email.toLowerCase() === u.correo.toLowerCase()
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => selectUserAccount(u)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                            isSelected
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'text-white/50 hover:bg-white/5 hover:text-white/80 border border-transparent'
                          }`}
                        >
                          <span className="text-sm">{meta.icon}</span>
                          <div className="truncate flex-1 min-w-0">
                            <p className="truncate leading-none text-[11px]">{meta.label}</p>
                            <p className="text-[9px] text-white/30 truncate mt-0.5">{u.correo}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Autenticando en PostgreSQL...
                  </>
                ) : (
                  'Iniciar Sesión con cuenta real'
                )}
              </button>
            </form>

          </div>

          <p className="text-center text-xs text-white/15 mt-5">
            CORONYX Enterprise · Base de Datos PostgreSQL · v2.0
          </p>
        </div>
      </div>
    </div>
  )
}
