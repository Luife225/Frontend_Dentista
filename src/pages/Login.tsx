import { useState } from 'react'

type Role = 'SUPER_ADMIN' | 'ODONTOLOGO' | 'RECEPCIONISTA' | 'ADMIN_CLINICA' | 'PACIENTE'

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

interface Props {
  onLogin: (role: Role) => void
}

const ROLE_META: Record<Role, { label: string; desc: string; icon: string; color: string; badge?: string }> = {
  SUPER_ADMIN:   { label: 'Super Admin',   desc: 'Gestión global SaaS, clínicas y planes',    icon: '🌐', color: 'from-amber-500 to-orange-600',  badge: 'SaaS' },
  ODONTOLOGO:    { label: 'Odontólogo',    desc: 'Historia clínica, pacientes, IA',            icon: '🦷', color: 'from-cyan-600 to-cyan-700' },
  RECEPCIONISTA: { label: 'Recepcionista', desc: 'Agenda, citas, inventario',                  icon: '📋', color: 'from-violet-600 to-violet-700' },
  ADMIN_CLINICA: { label: 'Administrador', desc: 'Configuración, usuarios, reportes',          icon: '⚙️', color: 'from-slate-600 to-slate-700' },
  PACIENTE:      { label: 'Paciente',      desc: 'App móvil — mis citas y avances',            icon: '👤', color: 'from-emerald-600 to-emerald-700' },
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

// Public-facing roles only — SUPER_ADMIN is internal CORONYX access
const PUBLIC_ROLES: Role[] = ['ODONTOLOGO', 'RECEPCIONISTA', 'ADMIN_CLINICA', 'PACIENTE']

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('dr.herrera@clinica.co')
  const [password, setPassword] = useState('••••••••')
  const [loading, setLoading] = useState(false)
  const [forgot, setForgot] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [detectedRole, setDetectedRole] = useState<Role | null>(null)
  const [demoRole, setDemoRole] = useState<Role>('ODONTOLOGO')

  function handleEmailChange(v: string) {
    setEmail(v)
    const lower = v.toLowerCase()
    const match = EMAIL_HINTS.find(h => lower.includes(h.pattern))
    setDetectedRole(match ? match.role : null)
  }

  function handleLogin() {
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

  // ── Forgot password screen ───────────────────────────────────────────────────
  if (forgot) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm fade-in">
          <div className="flex items-center gap-3 mb-8">
            <CoroNyxIsotope size={36} />
            <div>
              <span className="text-white text-xl font-bold tracking-wide" style={{fontFamily:'Outfit'}}>CORONYX</span>
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

  // ── Main login screen ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-80 border-r border-white/5 p-10 shrink-0"
        style={{background:'linear-gradient(to bottom, #0B3D3A, #062422)'}}>
        <div>
          <div className="flex items-center gap-3 mb-12">
            <CoroNyxIsotope size={40} />
            <div>
              <p className="text-white text-xl font-bold tracking-wide leading-tight" style={{fontFamily:'Outfit'}}>CORONYX</p>
              <p className="text-xs" style={{color:'#5FC9BE'}}>Sistema Dental</p>
            </div>
          </div>

          <h1 className="text-white text-3xl font-bold leading-tight mb-4" style={{fontFamily:'Outfit'}}>
            Gestión clínica inteligente
          </h1>
          <p className="text-white/40 text-sm leading-relaxed mb-8">
            Plataforma SaaS para clínicas odontológicas con asistente IA, análisis ML de radiografías y teleodontología integrada.
          </p>

          <div className="space-y-3">
            {PUBLIC_ROLES.map(r => (
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
        <p className="text-white/20 text-xs">CORONYX v2.0 · Multi-sede Enterprise</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md fade-in">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <CoroNyxIsotope size={32} />
            <div>
              <span className="text-white text-lg font-bold tracking-wide" style={{fontFamily:'Outfit'}}>CORONYX</span>
              <p className="text-xs" style={{color:'#5FC9BE'}}>Sistema Dental</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-white/8 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-white text-2xl font-semibold mb-1" style={{fontFamily:'Outfit'}}>Bienvenido</h2>
            <p className="text-white/40 text-sm mb-7">Ingresa con tu cuenta institucional</p>

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-xs text-white/50 font-medium block mb-1.5">Correo electrónico</label>
                <input value={email} onChange={e => handleEmailChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  placeholder="usuario@clinica.co" />
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

              {/* Password */}
              <div>
                <label className="text-xs text-white/50 font-medium block mb-1.5">Contraseña</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  placeholder="••••••••" />
              </div>

              <div className="flex justify-end">
                <button onClick={() => setForgot(true)} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Demo role selector — all 5 roles */}
              <div className="bg-white/3 border border-white/8 rounded-xl p-3">
                <p className="text-xs text-white/30 mb-2 font-medium">Demo — selecciona rol a simular:</p>
                <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                  {(['ODONTOLOGO','RECEPCIONISTA'] as Role[]).map(r => (
                    <button key={r} onClick={() => setDemoRole(r)}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        demoRole === r ? `bg-gradient-to-r ${ROLE_META[r].color} text-white shadow-sm` : 'text-white/40 hover:bg-white/5'
                      }`}>
                      <span>{ROLE_META[r].icon}</span>
                      <span className="truncate">{ROLE_META[r].label}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                  {(['ADMIN_CLINICA','PACIENTE'] as Role[]).map(r => (
                    <button key={r} onClick={() => setDemoRole(r)}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                        demoRole === r ? `bg-gradient-to-r ${ROLE_META[r].color} text-white shadow-sm` : 'text-white/40 hover:bg-white/5'
                      }`}>
                      <span>{ROLE_META[r].icon}</span>
                      {ROLE_META[r].label}
                    </button>
                  ))}
                </div>
                {/* Super Admin — always visible */}
                <div className="border-t border-white/8 pt-1.5 mt-0.5">
                  <button onClick={() => setDemoRole('SUPER_ADMIN')}
                    className={`w-full flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      demoRole === 'SUPER_ADMIN' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm' : 'text-amber-400/50 hover:bg-amber-500/10 hover:text-amber-400'
                    }`}>
                    <span>🌐</span>
                    <span>Super Admin</span>
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">SaaS</span>
                  </button>
                </div>
              </div>

              <button onClick={handleLogin} disabled={loading}
                className={`w-full py-3 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${
                  demoRole === 'SUPER_ADMIN' ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500' : 'bg-cyan-600 hover:bg-cyan-500'
                }`}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verificando acceso...
                  </>
                ) : demoRole === 'SUPER_ADMIN' ? '🌐 Acceder como Super Admin' : 'Ingresar'}
              </button>
            </div>

            <p className="text-center text-xs text-white/20 mt-6">
              ¿Eres paciente?{' '}
              <button onClick={() => { setDemoRole('PACIENTE'); setTimeout(() => handleLogin(), 0) }}
                className="text-white/50 hover:text-white/80 transition-colors underline underline-offset-2">
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
