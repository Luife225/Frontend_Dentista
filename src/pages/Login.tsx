import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useAuth } from '../contexts/AuthContext'
import coronixLogo from '../imports/coronixlogo.png'

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'SUPER_ADMIN' | 'ODONTOLOGO' | 'RECEPCIONISTA' | 'ADMIN_CLINICA' | 'PACIENTE'

// ─── Isotope SVG ──────────────────────────────────────────────────────────────
function CoroNyxIsotope({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <defs>
        <linearGradient id="lcxG" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5FC9BE"/>
          <stop offset="100%" stopColor="#0B3D3A"/>
        </linearGradient>
      </defs>
      <path d="M27 5.5 A13.5 13.5 0 1 0 27 30.5" stroke="url(#lcxG)" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <circle cx="28.5" cy="4.5" r="1.6" fill="#5FC9BE"/>
      <circle cx="31.5" cy="7.5" r="1" fill="#5FC9BE" opacity="0.55"/>
      <path d="M18 11 C15.5 11 13.5 13 13.5 15.8 L14 22.8 C14.1 23.7 14.7 24.2 15.6 24.2 C16.5 24.2 17 23.4 18 23.4 C19 23.4 19.5 24.2 20.4 24.2 C21.3 24.2 21.9 23.7 22 22.8 L22.5 15.8 C22.5 13 20.5 11 18 11 Z" fill="url(#lcxG)" opacity="0.92"/>
      <polyline points="14,12 15.2,8.5 18,11 20.8,8.5 22,12" stroke="#5FC9BE" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_META: Record<Role, { label: string; desc: string; icon: string; color: string; badge?: string }> = {
  SUPER_ADMIN:   { label: 'Super Admin',   desc: 'Gestión global SaaS, clínicas y planes',    icon: '🌐', color: 'from-amber-500 to-orange-600',  badge: 'SaaS' },
  ODONTOLOGO:    { label: 'Odontólogo',    desc: 'Historia clínica, pacientes, IA',            icon: '🦷', color: 'from-cyan-600 to-cyan-700' },
  RECEPCIONISTA: { label: 'Recepcionista', desc: 'Agenda, citas, inventario',                  icon: '📋', color: 'from-violet-600 to-violet-700' },
  ADMIN_CLINICA: { label: 'Administrador', desc: 'Configuración, usuarios, reportes',          icon: '⚙️', color: 'from-slate-600 to-slate-700' },
  PACIENTE:      { label: 'Paciente',      desc: 'App móvil — mis citas y avances',            icon: '👤', color: 'from-emerald-600 to-emerald-700' },
}

// Solid hex colors for GSAP pill (can't animate Tailwind gradients directly)
const ROLE_PILL_COLORS: Record<Role, string> = {
  ODONTOLOGO:    '#0e7490', // cyan-700
  RECEPCIONISTA: '#6d28d9', // violet-700
  ADMIN_CLINICA: '#475569', // slate-600
  PACIENTE:      '#047857', // emerald-700
  SUPER_ADMIN:   '#d97706', // amber-500
}

const EMAIL_HINTS: Array<{ pattern: string; role: Role }> = [
  { pattern: 'super',      role: 'SUPER_ADMIN' },
  { pattern: 'saas',       role: 'SUPER_ADMIN' },
  { pattern: 'global',     role: 'SUPER_ADMIN' },
  { pattern: 'admin',      role: 'ADMIN_CLINICA' },
  { pattern: 'recepc',     role: 'RECEPCIONISTA' },
  { pattern: 'paula',      role: 'RECEPCIONISTA' },
  { pattern: 'jorge',      role: 'RECEPCIONISTA' },
  { pattern: 'paciente',   role: 'PACIENTE' },
  { pattern: 'gmail',      role: 'PACIENTE' },
  { pattern: 'dr',         role: 'ODONTOLOGO' },
  { pattern: 'dra',        role: 'ODONTOLOGO' },
  { pattern: 'odon',       role: 'ODONTOLOGO' },
]

// Public-facing roles — SUPER_ADMIN is internal CORONYX access
const PUBLIC_ROLES: Role[] = ['ODONTOLOGO', 'RECEPCIONISTA', 'ADMIN_CLINICA', 'PACIENTE']

// Role selector grid layout (order for pill positioning)
const SELECTOR_ROWS: Role[][] = [
  ['ODONTOLOGO', 'RECEPCIONISTA'],
  ['ADMIN_CLINICA', 'PACIENTE'],
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function Login() {
  const { login: onLogin } = useAuth()

  // ── State ──────────────────────────────────────────────────────────────────
  const [email, setEmail]               = useState('dr.herrera@clinica.co')
  const [password, setPassword]         = useState('••••••••')
  const [loading, setLoading]           = useState(false)
  const [forgot, setForgot]             = useState(false)
  const [forgotSent, setForgotSent]     = useState(false)
  const [detectedRole, setDetectedRole] = useState<Role | null>(null)
  const [demoRole, setDemoRole]         = useState<Role>('ODONTOLOGO')

  // ── Refs — layout ──────────────────────────────────────────────────────────
  const containerRef      = useRef<HTMLDivElement>(null)
  const logoRef           = useRef<HTMLDivElement>(null)
  const titleRef          = useRef<HTMLHeadingElement>(null)
  const paraRef           = useRef<HTMLParagraphElement>(null)
  const cardRef           = useRef<HTMLDivElement>(null)

  // ── Refs — inputs ──────────────────────────────────────────────────────────
  const emailInputRef     = useRef<HTMLInputElement>(null)
  const passwordInputRef  = useRef<HTMLInputElement>(null)

  // ── Refs — button ──────────────────────────────────────────────────────────
  const loginBtnRef       = useRef<HTMLButtonElement>(null)
  const spinnerRef        = useRef<HTMLDivElement>(null)

  // ── Refs — role pill ───────────────────────────────────────────────────────
  const selectorRef       = useRef<HTMLDivElement>(null)   // the relative container
  const pillRef           = useRef<HTMLDivElement>(null)
  const pillTweenRef      = useRef<gsap.core.Tween | null>(null)
  // Map role → button element for pill positioning
  const roleBtnRefs       = useRef<Partial<Record<Role, HTMLButtonElement>>>({})
  const saasIconRef       = useRef<HTMLSpanElement>(null)
  const shimmerTlRef      = useRef<gsap.core.Timeline | null>(null)

  // ─────────────────────────────────────────────────────────────────────────
  // UTIL: check reduced motion preference
  // ─────────────────────────────────────────────────────────────────────────
  const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ─────────────────────────────────────────────────────────────────────────
  // LAYOUT EFFECT: initialise pill position BEFORE first paint
  // ─────────────────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const btnEl = roleBtnRefs.current['ODONTOLOGO']
    const parent = selectorRef.current
    if (!btnEl || !parent || !pillRef.current) return

    const btnRect    = btnEl.getBoundingClientRect()
    const parentRect = parent.getBoundingClientRect()

    gsap.set(pillRef.current, {
      x: btnRect.left - parentRect.left,
      y: btnRect.top - parentRect.top,
      width: btnRect.width,
      height: btnRect.height,
      backgroundColor: ROLE_PILL_COLORS['ODONTOLOGO'],
      borderRadius: 8,
      opacity: 1,
    })
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // ENTRY ANIMATION (useGSAP — runs once on mount, auto-cleanup on unmount)
  // ─────────────────────────────────────────────────────────────────────────
  useGSAP(() => {
    const mm = gsap.matchMedia()

    // ── Full motion ──────────────────────────────────────────────────────
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out', force3D: true },
      })

      // Left panel — logo scale-in
      tl.from(logoRef.current, {
          scale: 0,
          opacity: 0,
          duration: 0.5,
          ease: 'back.out(1.4)',
        })
        // Title slide up
        .from(titleRef.current, { y: 30, opacity: 0, duration: 0.6 }, '+=0.05')
        // Paragraph
        .from(paraRef.current,  { y: 20, opacity: 0, duration: 0.5 }, '-=0.3')
        // Role list — stagger
        .from('[data-role-item]', {
          y: 15,
          opacity: 0,
          duration: 0.4,
          stagger: 0.08,
        }, '-=0.2')
        // Right card — starts 0.15s after the previous tween began (depth feel)
        .from(cardRef.current, { y: 40, opacity: 0, duration: 0.7 }, '<0.15')

      // SaaS badge shimmer — subtle loop, only in no-preference branch
      if (saasIconRef.current) {
        shimmerTlRef.current = gsap.timeline({ repeat: -1, yoyo: true })
          .to(saasIconRef.current, {
            opacity: 0.45,
            duration: 1.4,
            ease: 'sine.inOut',
          })
      }
    })

    // ── Reduced motion: skip animations, set final state immediately ──────
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
      // Ensure shimmer never starts
      shimmerTlRef.current?.pause()
    })

    // Cleanup returned automatically by useGSAP scope — mm also cleaned up
    return () => mm.revert()
  }, { scope: containerRef })

  // ─────────────────────────────────────────────────────────────────────────
  // SPINNER animation — driven by `loading` state
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

    // Cleanup: kill tween if component unmounts while loading=true
    return () => {
      gsap.killTweensOf(spinnerRef.current)
    }
  }, [loading])

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS — email / role detection
  // ─────────────────────────────────────────────────────────────────────────
  function handleEmailChange(v: string) {
    setEmail(v)
    const lower = v.toLowerCase()
    const match = EMAIL_HINTS.find(h => lower.includes(h.pattern))
    setDetectedRole(match ? match.role : null)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS — login / forgot
  // ─────────────────────────────────────────────────────────────────────────
  function handleLogin() {
    // Shake validation for empty fields
    if (!email.trim()) {
      shakeInput(emailInputRef.current)
      if (!password.trim()) shakeInput(passwordInputRef.current)
      return
    }
    if (!password.trim()) {
      shakeInput(passwordInputRef.current)
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onLogin(demoRole)
    }, 900)
  }

  function handleForgot() {
    setLoading(true)
    setTimeout(() => { setLoading(false); setForgotSent(true) }, 800)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ANIMATION HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  /** Shake an input horizontally — uses sequential timeline, safe alongside entry tl */
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

  /** Animate focus glow on an input */
  function handleInputFocus(el: HTMLInputElement | null) {
    if (!el || prefersReducedMotion()) return
    gsap.to(el, {
      boxShadow: '0 0 0 2px rgba(95,201,190,0.45), 0 0 16px rgba(95,201,190,0.2)',
      duration: 0.25,
      ease: 'power2.out',
    })
  }

  /** Revert focus glow on blur */
  function handleInputBlur(el: HTMLInputElement | null) {
    if (!el) return
    gsap.to(el, {
      boxShadow: '0 0 0 0px transparent',
      duration: 0.3,
      ease: 'power2.out',
    })
  }

  /** Slide the pill to a role button + bounce its icon */
  function selectDemoRole(role: Role, btnEl: HTMLButtonElement) {
    setDemoRole(role)

    const parent = selectorRef.current
    if (!parent || !pillRef.current) return

    const btnRect    = btnEl.getBoundingClientRect()
    const parentRect = parent.getBoundingClientRect()

    // Kill any in-flight pill tween before starting new one
    pillTweenRef.current?.kill()
    pillTweenRef.current = gsap.to(pillRef.current, {
      x: btnRect.left - parentRect.left,
      y: btnRect.top - parentRect.top,
      width: btnRect.width,
      height: btnRect.height,
      backgroundColor: ROLE_PILL_COLORS[role],
      duration: 0.38,
      ease: 'power3.out',
      overwrite: 'auto',
      force3D: true,
    })

    // Bounce icon of newly selected role
    const iconEl = btnEl.querySelector<HTMLElement>('[data-role-icon]')
    if (iconEl && !prefersReducedMotion()) {
      gsap.fromTo(
        iconEl,
        { scale: 0.7 },
        { scale: 1, ease: 'back.out(1.6)', duration: 0.4, force3D: true }
      )
    }
  }

  /** Button hover — scale + glow */
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
  // FORGOT PASSWORD SCREEN (no GSAP needed — separate route-like view)
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
        className="hidden lg:flex flex-col justify-between w-80 border-r border-white/5 p-10 shrink-0"
        style={{ background: 'linear-gradient(to bottom, #0B3D3A, #062422)' }}
      >
        <div>
          {/* Logo — animated with back.out scale-in */}
          <div ref={logoRef} className="flex items-center gap-3 mb-12">
            <img src={coronixLogo} alt="CORONYX" className="w-14 h-14 object-contain shrink-0"/>
            <div>
              <p className="text-white text-xl font-bold tracking-wide leading-tight" style={{fontFamily:'Outfit'}}>CORONYX</p>
              <p className="text-xs" style={{color:'#5FC9BE'}}>Sistema Dental</p>
            </div>
          </div>

          {/* Title — animated slide from below */}
          <h1 ref={titleRef} className="text-white text-3xl font-bold leading-tight mb-4" style={{fontFamily:'Outfit'}}>
            Gestión clínica inteligente
          </h1>

          {/* Paragraph — fade in */}
          <p ref={paraRef} className="text-white/40 text-sm leading-relaxed mb-8">
            Plataforma SaaS para clínicas odontológicas con asistente IA, análisis ML de radiografías y teleodontología integrada.
          </p>

          {/* Role list — stagger per item */}
          <div className="space-y-3">
            {PUBLIC_ROLES.map(r => (
              <div key={r} data-role-item className="flex items-center gap-3 text-sm text-white/40">
                <span className="text-base">{ROLE_META[r].icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-white/60">{ROLE_META[r].label}</span>
                  <span className="text-white/30"> — {ROLE_META[r].desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs">CORONYX v2.0 · Multi-sede Enterprise</p>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        {/* Card — ref for entry animation */}
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

            <div className="space-y-4">

              {/* ── Email input ─────────────────────────────────────────── */}
              <div>
                <label className="text-xs text-white/50 font-medium block mb-1.5">Correo electrónico</label>
                <input
                  ref={emailInputRef}
                  value={email}
                  onChange={e => handleEmailChange(e.target.value)}
                  onFocus={() => handleInputFocus(emailInputRef.current)}
                  onBlur={() => handleInputBlur(emailInputRef.current)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none transition-colors"
                  placeholder="usuario@clinica.co"
                />
                {detectedRole && (
                  <p className="text-xs text-cyan-400 mt-1.5 flex items-center gap-1.5">
                    <span>{ROLE_META[detectedRole].icon}</span>
                    Rol detectado: <strong>{ROLE_META[detectedRole].label}</strong>
                    {ROLE_META[detectedRole].badge && (
                      <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                        {ROLE_META[detectedRole].badge}
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* ── Password input ──────────────────────────────────────── */}
              <div>
                <label className="text-xs text-white/50 font-medium block mb-1.5">Contraseña</label>
                <input
                  ref={passwordInputRef}
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => handleInputFocus(passwordInputRef.current)}
                  onBlur={() => handleInputBlur(passwordInputRef.current)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex justify-end">
                <button onClick={() => setForgot(true)} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* ── Demo role selector ──────────────────────────────────── */}
              <div className="bg-white/3 border border-white/8 rounded-xl p-3">
                <p className="text-xs text-white/30 mb-2 font-medium">Demo — selecciona rol a simular:</p>

                {/* Pill container — position:relative, pill is absolute child */}
                <div ref={selectorRef} className="relative">

                  {/* The sliding pill — manipulated only by GSAP, sits behind buttons */}
                  <div
                    ref={pillRef}
                    className="absolute top-0 left-0 pointer-events-none z-0 rounded-lg opacity-0"
                    aria-hidden="true"
                    style={{ width: 0, height: 0 }}
                  />

                  {/* Role button rows — z-10 to sit above pill */}
                  <div className="relative z-10">
                    {SELECTOR_ROWS.map((row, ri) => (
                      <div key={ri} className="grid grid-cols-2 gap-1.5 mb-1.5">
                        {row.map(r => (
                          <button
                            key={r}
                            ref={el => { if (el) roleBtnRefs.current[r] = el }}
                            onClick={e => selectDemoRole(r, e.currentTarget)}
                            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                              demoRole === r ? 'text-white' : 'text-white/40 hover:text-white/60'
                            }`}
                          >
                            <span data-role-icon>{ROLE_META[r].icon}</span>
                            <span className="truncate">{ROLE_META[r].label}</span>
                          </button>
                        ))}
                      </div>
                    ))}

                    {/* Super Admin — full-width row */}
                    <div className="border-t border-white/8 pt-1.5 mt-0.5">
                      <button
                        ref={el => { if (el) roleBtnRefs.current['SUPER_ADMIN'] = el }}
                        onClick={e => selectDemoRole('SUPER_ADMIN', e.currentTarget)}
                        className={`w-full flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                          demoRole === 'SUPER_ADMIN' ? 'text-white' : 'text-amber-400/50 hover:text-amber-400'
                        }`}
                      >
                        <span data-role-icon>🌐</span>
                        <span>Super Admin</span>
                        {/* SaaS shimmer badge */}
                        <span
                          ref={saasIconRef}
                          className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400"
                        >
                          SaaS
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Login button ────────────────────────────────────────── */}
              <button
                ref={loginBtnRef}
                onClick={handleLogin}
                onMouseEnter={handleBtnEnter}
                onMouseLeave={handleBtnLeave}
                disabled={loading}
                className={`w-full py-3 text-white rounded-xl font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2 ${
                  demoRole === 'SUPER_ADMIN'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                    : 'bg-cyan-600'
                }`}
                style={{ willChange: 'transform' }}
              >
                {loading ? (
                  <>
                    {/* GSAP-animated spinner via ref */}
                    <div
                      ref={spinnerRef}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      style={{ willChange: 'transform' }}
                    />
                    Verificando acceso...
                  </>
                ) : demoRole === 'SUPER_ADMIN' ? '🌐 Acceder como Super Admin' : 'Ingresar'}
              </button>
            </div>

            <p className="text-center text-xs text-white/20 mt-6">
              ¿Eres paciente?{' '}
              <button
                onClick={() => { setDemoRole('PACIENTE'); setTimeout(() => handleLogin(), 0) }}
                className="text-white/50 hover:text-white/80 transition-colors underline underline-offset-2"
              >
                Acceder a la app móvil
              </button>
            </p>
          </div>

          <p className="text-center text-xs text-white/15 mt-5">
            CORONYX Enterprise · Multi-sede · v2.0
          </p>
        </div>
      </div>
    </div>
  )
}
