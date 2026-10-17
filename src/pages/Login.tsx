import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useAuth } from '../contexts/AuthContext'
import { loginWithApi } from '../services/authService'
import { getDefaultRouteForRole } from '../routes/routeHelpers'
import coronixLogo from '../imports/coronixLogoData'

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'ODONTOLOGO' | 'RECEPCIONISTA' | 'ADMIN_CLINICA' | 'PACIENTE'

// Role feature list for left panel (describiendo funcionalidades reales existentes)
const ROLE_FEATURES: { icon: string; label: string; desc: string }[] = [
  { icon: '🦷', label: 'Odontólogo',    desc: 'Historia clínica, odontograma, atenciones' },
  { icon: '📋', label: 'Recepcionista', desc: 'Gestión de agenda, citas y pacientes' },
  { icon: '⚙️', label: 'Administrador', desc: 'Sedes, personal, horarios y métricas' },
  { icon: '👤', label: 'Paciente',      desc: 'Portal de citas y documentos médicos' },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function Login() {
  const { loginWithSession } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // ── State ──────────────────────────────────────────────────────────────────
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [forgot, setForgot]             = useState(false)
  const [forgotSent, setForgotSent]     = useState(false)

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
  // PREVENCIÓN DE NAVEGACIÓN "ATRÁS" TRAS CERRAR SESIÓN
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Si no hay sesión iniciada, atrapar el evento popstate para que el botón "Atrás"
    // no pueda restaurar vistas previas de la sesión cerrada
    window.history.pushState(null, '', window.location.href)

    const handlePopState = () => {
      const savedRole = typeof window !== 'undefined' ? localStorage.getItem('coronyx_role') : null
      if (!savedRole) {
        window.history.pushState(null, '', window.location.href)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

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

    const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname
    const targetPath =
      fromPath && fromPath !== '/login' && fromPath !== '/sin-acceso' && fromPath !== '/403'
        ? fromPath
        : null

    try {
      // Autenticación real contra PostgreSQL con JWT
      const session = await loginWithApi(email.trim(), password)
      const destination = targetPath || getDefaultRouteForRole(session.rol)
      loginWithSession(session, destination)
    } catch (apiErr: any) {
      // Error real de la API o conexión fallida: sin fallback demo
      setError(apiErr?.message || 'Error de autenticación. Verifique correo y contraseña.')
      shakeInput(emailInputRef.current)
      shakeInput(passwordInputRef.current)
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleLogin()
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
  // FORGOT PASSWORD SCREEN (Light Mode)
  // ─────────────────────────────────────────────────────────────────────────
  if (forgot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-sky-50/40 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <img src={coronixLogo} alt="CORONYX" className="w-12 h-12 object-contain shrink-0"/>
            <div>
              <p className="text-slate-900 text-xl font-bold tracking-wide" style={{fontFamily:'Outfit'}}>CORONYX</p>
              <p className="text-xs font-semibold text-teal-700">Sistema Odontológico</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-8 shadow-xl shadow-slate-200/50">
            {forgotSent ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <h2 className="text-slate-900 font-semibold text-lg mb-2" style={{fontFamily:'Outfit'}}>Revisa tu correo</h2>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                  Enviamos instrucciones a <span className="text-slate-800 font-medium">{email}</span>
                </p>
                <button
                  type="button"
                  onClick={() => { setForgot(false); setForgotSent(false) }}
                  className="w-full py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm cursor-pointer"
                >
                  Volver al login
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-slate-900 font-bold text-xl mb-1" style={{fontFamily:'Outfit'}}>Recuperar contraseña</h2>
                <p className="text-slate-500 text-sm mb-6">Ingresa tu correo y te enviaremos el enlace</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-700 font-semibold block mb-1.5">Correo electrónico</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="usuario@coronyx.pe"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setForgotSent(true)}
                    className="w-full py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm cursor-pointer"
                  >
                    Enviar instrucciones
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgot(false)}
                    className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
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
  // MAIN LOGIN SCREEN (Light Mode Clínico Profesional)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/15 to-sky-50/25 flex">

      {/* ── Left branding panel ──────────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[380px] p-10 shrink-0 text-white shadow-xl relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0B3D3A 0%, #082927 50%, #031716 100%)' }}
      >
        <div className="relative z-10">
          {/* Logo */}
          <div ref={logoRef} className="flex items-center gap-3 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center p-2.5 border border-white/15">
              <img src={coronixLogo} alt="CORONYX" className="w-full h-full object-contain"/>
            </div>
            <div>
              <p className="text-white text-2xl font-extrabold tracking-wide leading-tight" style={{fontFamily:'Outfit'}}>CORONYX</p>
              <p className="text-xs font-medium tracking-wide text-teal-300">Sistema Odontológico</p>
            </div>
          </div>

          {/* Title */}
          <h1 ref={titleRef} className="text-white text-3xl font-extrabold leading-snug mb-4" style={{fontFamily:'Outfit'}}>
            Gestión clínica <br/>y dental integral
          </h1>

          {/* Paragraph */}
          <p ref={paraRef} className="text-white/70 text-sm leading-relaxed mb-8 font-normal">
            Plataforma para consultorios y clínicas dentales: agenda en tiempo real, expedientes seguros, historia clínica inmutable, odontograma interactivo y portal de pacientes.
          </p>

          {/* Role list */}
          <div className="space-y-3 mb-10">
            {ROLE_FEATURES.map(r => (
              <div
                key={r.label}
                data-role-item
                className="flex items-center gap-3.5 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <span className="text-xl shrink-0">{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-white font-semibold text-xs block">{r.label}</span>
                  <span className="text-white/60 text-xs">{r.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
          <span>CORONYX Enterprise</span>
          <span>v2.0 · Multi-sede</span>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div ref={cardRef} className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img src={coronixLogo} alt="CORONYX" className="w-12 h-12 object-contain shrink-0"/>
            <div>
              <p className="text-slate-900 text-xl font-bold tracking-wide" style={{fontFamily:'Outfit'}}>CORONYX</p>
              <p className="text-xs font-semibold text-teal-700">Sistema Dental</p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50">
            <div className="mb-8">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/60 mb-2">
                Acceso Clínico Autorizado
              </span>
              <h2 className="text-slate-900 text-2xl font-bold tracking-tight" style={{fontFamily:'Outfit'}}>Bienvenido</h2>
              <p className="text-slate-500 text-sm mt-1">Ingresa tus credenciales para acceder a la plataforma</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5" onKeyDown={handleKeyDown}>

              {/* ── Email input ─────────────────────────────────────────── */}
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1.5">Correo electrónico</label>
                <div className="relative">
                  <input
                    ref={emailInputRef}
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    onFocus={() => handleInputFocus(emailInputRef.current)}
                    onBlur={() => handleInputBlur(emailInputRef.current)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600 transition-all shadow-2xs"
                    placeholder="usuario@coronyx.pe"
                  />
                </div>
              </div>

              {/* ── Password input ──────────────────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-slate-700 font-semibold">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => setForgot(true)}
                    className="text-xs text-teal-700 hover:text-teal-800 font-medium transition-colors cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <input
                  ref={passwordInputRef}
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  onFocus={() => handleInputFocus(passwordInputRef.current)}
                  onBlur={() => handleInputBlur(passwordInputRef.current)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600 transition-all shadow-2xs"
                  placeholder="••••••••"
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-3 text-rose-700">
                  <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                  <p className="text-xs font-medium">{error}</p>
                </div>
              )}

              {/* ── Login button ────────────────────────────────────────── */}
              <button
                ref={loginBtnRef}
                type="submit"
                onMouseEnter={handleBtnEnter}
                onMouseLeave={handleBtnLeave}
                disabled={loading}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-all shadow-md shadow-teal-600/20 hover:shadow-teal-600/30 cursor-pointer"
                style={{ willChange: 'transform' }}
              >
                {loading ? (
                  <>
                    <div
                      ref={spinnerRef}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      style={{ willChange: 'transform' }}
                    />
                    <span>Verificando acceso...</span>
                  </>
                ) : <span>Ingresar a la Plataforma</span>}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            CORONYX Dental Enterprise · Sesión Segura y Cifrada
          </p>
        </div>
      </div>
    </div>
  )
}
