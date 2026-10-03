import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useAuth } from '../contexts/AuthContext'
import coronixLogo from '../imports/coronixlogo.png'

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'SUPER_ADMIN' | 'ODONTOLOGO' | 'RECEPCIONISTA' | 'ADMIN_CLINICA' | 'PACIENTE'

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
  const { login: onLogin } = useAuth()

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
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  function handleLogin() {
    setError('')

    if (!email.trim()) {
      shakeInput(emailInputRef.current)
      if (!password.trim()) shakeInput(passwordInputRef.current)
      return
    }
    if (!password.trim()) {
      shakeInput(passwordInputRef.current)
      return
    }

    const account = DEMO_ACCOUNTS.find(
      a => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password
    )

    if (!account) {
      setError('Credenciales inválidas. Revisa el email y la contraseña.')
      shakeInput(emailInputRef.current)
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onLogin(account.role)
    }, 900)
  }

  function handleForgot() {
    setLoading(true)
    setTimeout(() => { setLoading(false); setForgotSent(true) }, 800)
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
                  <button onClick={handleForgot} disabled={loading}
                    className="w-full py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 transition-colors disabled:opacity-60">
                    {loading ? 'Enviando...' : 'Enviar instrucciones'}
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
            Plataforma SaaS para clínicas odontológicas con asistente IA, análisis ML de radiografías y teleodontología integrada.
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

        <p className="text-white/20 text-xs">CORONYX v2.0 · Multi-sede Enterprise</p>
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
            <h2 className="text-white text-2xl font-semibold mb-1" style={{fontFamily:'Outfit'}}>Bienvenido</h2>
            <p className="text-white/40 text-sm mb-7">Ingresa con tu cuenta institucional</p>

            <div className="space-y-4" onKeyDown={handleKeyDown}>

              {/* ── Email input ─────────────────────────────────────────── */}
              <div>
                <label className="text-xs text-white/50 font-medium block mb-1.5">Correo electrónico</label>
                <input
                  ref={emailInputRef}
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  onFocus={() => handleInputFocus(emailInputRef.current)}
                  onBlur={() => handleInputBlur(emailInputRef.current)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none transition-colors"
                  placeholder="usuario@coronyx.co"
                />
              </div>

              {/* ── Password input ──────────────────────────────────────── */}
              <div>
                <label className="text-xs text-white/50 font-medium block mb-1.5">Contraseña</label>
                <input
                  ref={passwordInputRef}
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  onFocus={() => handleInputFocus(passwordInputRef.current)}
                  onBlur={() => handleInputBlur(passwordInputRef.current)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5">
                  <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                  <p className="text-xs text-rose-300">{error}</p>
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={() => setForgot(true)} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* ── Login button ────────────────────────────────────────── */}
              <button
                ref={loginBtnRef}
                onClick={handleLogin}
                onMouseEnter={handleBtnEnter}
                onMouseLeave={handleBtnLeave}
                disabled={loading}
                className="w-full py-3 bg-cyan-600 text-white rounded-xl font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2 hover:bg-cyan-500 transition-colors"
                style={{ willChange: 'transform' }}
              >
                {loading ? (
                  <>
                    <div
                      ref={spinnerRef}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      style={{ willChange: 'transform' }}
                    />
                    Verificando acceso...
                  </>
                ) : 'Ingresar'}
              </button>
            </div>

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
            CORONYX Enterprise · Multi-sede · v2.0
          </p>
        </div>
      </div>
    </div>
  )
}
