import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useAuth } from '../contexts/AuthContext'
import { loginWithApi, fetchUsersFromApi, UserItem } from '../services/authService'
import coronixLogo from '../imports/coronixlogo.png'

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'SUPER_ADMIN' | 'ODONTOLOGO' | 'RECEPCIONISTA' | 'ADMIN_CLINICA' | 'PACIENTE'

const ROLE_META: Record<Role, { label: string; desc: string; icon: string; color: string; badge?: string }> = {
  SUPER_ADMIN:   { label: 'Super Admin',   desc: 'Gestión global SaaS, clínicas y planes',    icon: '🌐', color: 'from-amber-500 to-orange-600',  badge: 'SaaS' },
  ODONTOLOGO:    { label: 'Odontólogo',    desc: 'Historia clínica, pacientes, IA',            icon: '🦷', color: 'from-cyan-600 to-cyan-700' },
  RECEPCIONISTA: { label: 'Recepcionista', desc: 'Agenda, citas, inventario',                  icon: '📋', color: 'from-violet-600 to-violet-700' },
  ADMIN_CLINICA: { label: 'Administrador', desc: 'Configuración, usuarios, reportes',          icon: '⚙️', color: 'from-slate-600 to-slate-700' },
  PACIENTE:      { label: 'Paciente',      desc: 'App móvil — mis citas y avances',            icon: '👤', color: 'from-emerald-600 to-emerald-700' },
}

// ─── Demo credentials ─────────────────────────────────────────────────────────
const DEMO_ACCOUNTS: { email: string; password: string; role: Role; name: string; label: string; icon: string }[] = [
  { email: 'dr.herrera@coronyx.co',      password: 'demo1234', role: 'ODONTOLOGO',    name: 'Dr. Herrera',     label: 'Odontólogo',    icon: '🦷' },
  { email: 'paula.rios@coronyx.co',      password: 'demo1234', role: 'RECEPCIONISTA', name: 'Paula Ríos',      label: 'Recepcionista', icon: '📋' },
  { email: 'admin@coronyx.co',           password: 'demo1234', role: 'ADMIN_CLINICA', name: 'Administrador',   label: 'Administrador', icon: '⚙️' },
  { email: 'carlos.rivas@coronyx.co',    password: 'demo1234', role: 'PACIENTE',      name: 'Carlos Rivas',    label: 'Paciente',      icon: '👤' },
  { email: 'superadmin@coronyx.co',      password: 'demo1234', role: 'SUPER_ADMIN',   name: 'Super Admin',     label: 'Super Admin',   icon: '🌐' },
]

// Role feature list for left panel
const ROLE_FEATURES: { icon: string; label: string; desc: string }[] = [
  { icon: '🦷', label: 'Odontólogo',    desc: 'Historia clínica, pacientes, IA' },
  { icon: '📋', label: 'Recepcionista', desc: 'Agenda, citas, inventario' },
  { icon: '⚙️', label: 'Administrador', desc: 'Configuración, usuarios, reportes' },
  { icon: '👤', label: 'Paciente',      desc: 'App móvil — mis citas y avances' },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function Login() {
  const { login: onLogin, loginWithSession } = useAuth()

  // ── State ──────────────────────────────────────────────────────────────────
  const [email, setEmail]               = useState('odontologo@coronyx.pe')
  const [password, setPassword]         = useState('123456')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [forgot, setForgot]             = useState(false)
  const [forgotSent, setForgotSent]     = useState(false)
  const [dbUsers, setDbUsers]           = useState<UserItem[]>([])
  const [dbConnected, setDbConnected]   = useState<boolean | null>(null)

  // ── Refs ───────────────────────────────────────────────────────────────────
  const containerRef      = useRef<HTMLDivElement>(null)
  const logoRef           = useRef<HTMLDivElement>(null)
  const titleRef          = useRef<HTMLHeadingElement>(null)
  const paraRef           = useRef<HTMLParagraphElement>(null)
  const cardRef           = useRef<HTMLDivElement>(null)
  const emailInputRef     = useRef<HTMLInputElement>(null)
  const passwordInputRef  = useRef<HTMLInputElement>(null)
  const loginBtnRef       = useRef<HTMLButtonElement>(null)
  const spinnerRef        = useRef<HTMLDivElement>(null)

  // ─────────────────────────────────────────────────────────────────────────
  // Cargar usuarios reales registrados en PostgreSQL
  // ─────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────
  // UTIL: check reduced motion preference
  // ─────────────────────────────────────────────────────────────────────────
  const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ─────────────────────────────────────────────────────────────────────────
  // ENTRY ANIMATION
  // ─────────────────────────────────────────────────────────────────────────
  useGSAP(() => {
    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out', force3D: true },
      })

      tl.from(logoRef.current, {
          scale: 0,
          opacity: 0,
          duration: 0.5,
          ease: 'back.out(1.4)',
        })
        .from(titleRef.current, { y: 30, opacity: 0, duration: 0.6 }, '+=0.05')
        .from(paraRef.current,  { y: 20, opacity: 0, duration: 0.5 }, '-=0.3')
        .from('[data-role-item]', {
          y: 15,
          opacity: 0,
          duration: 0.4,
          stagger: 0.08,
        }, '-=0.2')
        .from(cardRef.current, { y: 40, opacity: 0, duration: 0.7 }, '<0.15')
    })

    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(
        [
          logoRef.current,
          titleRef.current,
          paraRef.current,
          '[data-role-item]',
          cardRef.current,
        ],
        { opacity: 1, y: 0, scale: 1, clearProps: 'transform' }
      )
    })

    return () => mm.revert()
  }, { scope: containerRef })

  // ─────────────────────────────────────────────────────────────────────────
  // SPINNER animation
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!spinnerRef.current) return

    if (loading) {
      gsap.to(spinnerRef.current, {
        rotation: 360,
        duration: 0.8,
        repeat: -1,
        ease: 'none',
      })
    } else {
      gsap.killTweensOf(spinnerRef.current)
      gsap.set(spinnerRef.current, { rotation: 0 })
    }

    return () => {
      gsap.killTweensOf(spinnerRef.current)
    }
  }, [loading])

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setError('')

    if (!email.trim()) {
      shakeInput(emailInputRef.current)
      if (!password.trim()) shakeInput(passwordInputRef.current)
      setError('Por favor ingresa tu correo electrónico.')
      return
    }
    if (!password.trim()) {
      shakeInput(passwordInputRef.current)
      setError('Por favor ingresa tu contraseña.')
      return
    }

    setLoading(true)

    try {
      const session = await loginWithApi(email.trim(), password)
      loginWithSession(session)
    } catch (apiErr: any) {
      // Fallback a cuenta demo si falla backend o coincide con credencial demo
      const demoAccount = DEMO_ACCOUNTS.find(
        a => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password
      )

      if (demoAccount) {
        onLogin(demoAccount.role)
      } else {
        setError(apiErr?.message || 'Credenciales inválidas o servicio no disponible.')
        shakeInput(emailInputRef.current)
        shakeInput(passwordInputRef.current)
      }
    } finally {
      setLoading(false)
    }
  }

  function selectUserAccount(user: UserItem) {
    setEmail(user.correo)
    setPassword('123456')
    setError('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleLogin()
  }

  // Fill fields with a demo credential when clicked
  function fillCredential(account: typeof DEMO_ACCOUNTS[0]) {
    setEmail(account.email)
    setPassword(account.password)
    setError('')
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ANIMATION HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  function shakeInput(el: HTMLElement | null) {
    if (!el) return
    gsap.timeline()
      .to(el, { x: -8, duration: 0.06, ease: 'none' })
      .to(el, { x: 8,  duration: 0.06 })
      .to(el, { x: -6, duration: 0.06 })
      .to(el, { x: 6,  duration: 0.06 })
      .to(el, { x: -3, duration: 0.06 })
      .to(el, { x: 3,  duration: 0.06 })
      .to(el, { x: 0,  duration: 0.1,  ease: 'power2.out' })
  }

  function handleInputFocus(el: HTMLInputElement | null) {
    if (!el || prefersReducedMotion()) return
    gsap.to(el, {
      boxShadow: '0 0 0 2px rgba(95,201,190,0.45), 0 0 16px rgba(95,201,190,0.2)',
      duration: 0.25,
      ease: 'power2.out',
    })
  }

  function handleInputBlur(el: HTMLInputElement | null) {
    if (!el) return
    gsap.to(el, {
      boxShadow: '0 0 0 0px transparent',
      duration: 0.3,
      ease: 'power2.out',
    })
  }

  function handleBtnEnter() {
    if (prefersReducedMotion() || loading) return
    gsap.to(loginBtnRef.current, {
      scale: 1.02,
      boxShadow: '0 0 24px rgba(95,201,190,0.35)',
      duration: 0.2,
      ease: 'power2.out',
      overwrite: 'auto',
      force3D: true,
    })
  }

  function handleBtnLeave() {
    gsap.to(loginBtnRef.current, {
      scale: 1,
      boxShadow: '0 0 0px transparent',
      duration: 0.25,
      ease: 'power2.out',
      overwrite: 'auto',
      force3D: true,
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FORGOT PASSWORD SCREEN
  // ─────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN LOGIN SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="min-h-screen bg-slate-950 flex">

      {/* ── Left branding panel ──────────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[340px] border-r border-white/5 p-10 shrink-0"
        style={{ background: 'linear-gradient(to bottom, #0B3D3A, #062422)' }}
      >
        <div>
          {/* Logo */}
          <div ref={logoRef} className="flex items-center gap-3 mb-12">
            <img src={coronixLogo} alt="CORONYX" className="w-14 h-14 object-contain shrink-0"/>
            <div>
              <p className="text-white text-xl font-bold tracking-wide leading-tight" style={{fontFamily:'Outfit'}}>CORONYX</p>
              <p className="text-xs" style={{color:'#5FC9BE'}}>Sistema Dental</p>
            </div>
          </div>

          {/* Title */}
          <h1 ref={titleRef} className="text-white text-3xl font-bold leading-tight mb-4" style={{fontFamily:'Outfit'}}>
            Gestión clínica inteligente
          </h1>

          {/* Paragraph */}
          <p ref={paraRef} className="text-white/40 text-sm leading-relaxed mb-8">
            Plataforma SaaS para clínicas odontológicas con base de datos real PostgreSQL, roles institucionales, análisis ML y teleodontología.
          </p>

          {/* Role list */}
          <div className="space-y-3 mb-10">
            {ROLE_FEATURES.map(r => (
              <div key={r.label} data-role-item className="flex items-center gap-3 text-sm text-white/40">
                <span className="text-base">{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-white/60">{r.label}</span>
                  <span className="text-white/30"> — {r.desc}</span>
                </div>
              </div>
            ))}
          </div>

        </div>

        <p className="text-white/20 text-xs">CORONYX Enterprise · PostgreSQL 16 · v2.0</p>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div ref={cardRef} className="w-full max-w-md">

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
                <p className="text-white/40 text-xs mt-0.5">Ingresa con tus credenciales de acceso</p>
              </div>
              {dbConnected === true && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  PostgreSQL Conectado
                </span>
              )}
            </div>

            {/* Error message banner */}
            {error && (
              <div className="mb-4 flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5">
                <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <p className="text-xs text-rose-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4" onKeyDown={handleKeyDown}>

              {/* ── Email input ─────────────────────────────────────────── */}
              <div>
                <label className="text-xs text-white/50 font-medium block mb-1.5">Correo electrónico</label>
                <input
                  ref={emailInputRef}
                  type="email"
                  required
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  onFocus={() => handleInputFocus(emailInputRef.current)}
                  onBlur={() => handleInputBlur(emailInputRef.current)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-colors"
                  placeholder="usuario@coronyx.pe"
                />
              </div>

              {/* ── Password input ──────────────────────────────────────── */}
              <div>
                <label className="text-xs text-white/50 font-medium block mb-1.5">Contraseña</label>
                <input
                  ref={passwordInputRef}
                  type="password"
                  required
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  onFocus={() => handleInputFocus(passwordInputRef.current)}
                  onBlur={() => handleInputBlur(passwordInputRef.current)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-colors"
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

              {/* ── Login button ────────────────────────────────────────── */}
              <button
                ref={loginBtnRef}
                type="submit"
                onMouseEnter={handleBtnEnter}
                onMouseLeave={handleBtnLeave}
                disabled={loading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 cursor-pointer"
                style={{ willChange: 'transform' }}
              >
                {loading ? (
                  <>
                    <div
                      ref={spinnerRef}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      style={{ willChange: 'transform' }}
                    />
                    Autenticando en PostgreSQL...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>

            {/* Mobile: demo credentials hint */}
            <div className="lg:hidden mt-6 bg-white/3 border border-white/8 rounded-xl p-3">
              <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest mb-2" style={{fontFamily:'Outfit'}}>Credenciales demo</p>
              <div className="space-y-1.5">
                {DEMO_ACCOUNTS.map(a => (
                  <button
                    key={a.email}
                    onClick={() => fillCredential(a)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm shrink-0">{a.icon}</span>
                    <span className="text-white/50 truncate">{a.email}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-white/20 mt-2">Contraseña: <span className="text-white/35 font-mono">demo1234</span></p>
            </div>
          </div>

          <p className="text-center text-xs text-white/15 mt-5">
            CORONYX Enterprise · Base de Datos PostgreSQL · v2.0
          </p>
        </div>
      </div>
    </div>
  )
}
