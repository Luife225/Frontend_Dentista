import { useState } from 'react'
import CoroNyxLogo from './CoroNyxLogo'

type Role = 'SUPER_ADMIN' | 'ODONTOLOGO' | 'RECEPCIONISTA' | 'ADMIN_CLINICA' | 'PACIENTE'

interface Props {
  onLogin: (role: Role) => void
}

const ROLE_META: Record<Role, { label: string; desc: string; icon: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', desc: 'Gestión global de la plataforma', icon: '🛡️', color: 'from-amber-600 to-amber-700' },
  ODONTOLOGO: { label: 'Odontólogo', desc: 'Historia clínica, pacientes, IA', icon: '🦷', color: 'from-cyan-600 to-cyan-700' },
  RECEPCIONISTA: { label: 'Recepcionista', desc: 'Agenda, citas, inventario', icon: '📋', color: 'from-violet-600 to-violet-700' },
  ADMIN_CLINICA: { label: 'Administrador', desc: 'Configuración, usuarios, reportes', icon: '⚙️', color: 'from-slate-700 to-slate-800' },
  PACIENTE: { label: 'Paciente', desc: 'Portal web — mis citas y avances', icon: '👤', color: 'from-emerald-600 to-emerald-700' },
}

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
    if (v.includes('super') || v.includes('superadmin')) setDetectedRole('SUPER_ADMIN')
    else if (v.includes('admin')) setDetectedRole('ADMIN_CLINICA')
    else if (v.includes('recepc') || v.includes('paula') || v.includes('jorge')) setDetectedRole('RECEPCIONISTA')
    else if (v.includes('paciente') || v.includes('gmail')) setDetectedRole('PACIENTE')
    else if (v.includes('dr') || v.includes('dra') || v.includes('odon')) setDetectedRole('ODONTOLOGO')
    else setDetectedRole(null)
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

  if (forgot) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm fade-in">
          <div className="flex items-center gap-3 mb-8">
            <CoroNyxLogo size={36} />
            <div>
              <span className="text-white text-xl font-bold tracking-wide" style={{ fontFamily: 'Outfit' }}>CORONYX</span>
              <p className="text-xs" style={{ color: '#5FC9BE' }}>Sistema Dental</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-white/8 rounded-2xl p-8 shadow-2xl">
            {forgotSent ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-white font-semibold text-lg mb-2" style={{ fontFamily: 'Outfit' }}>Revisa tu correo</h2>
                <p className="text-white/50 text-sm mb-6">Enviamos instrucciones a <span className="text-white/80">{email}</span></p>
                <button onClick={() => { setForgot(false); setForgotSent(false) }}
                  className="w-full py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 transition-colors">
                  Volver al login
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-white font-semibold text-xl mb-1" style={{ fontFamily: 'Outfit' }}>Recuperar contraseña</h2>
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

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-80 border-r border-white/5 p-10"
        style={{ background: 'linear-gradient(to bottom, #0B3D3A, #062422)' }}>
        <div>
          <div className="flex items-center gap-3 mb-12">
            <CoroNyxLogo size={44} />
            <div>
              <p className="text-white text-xl font-bold tracking-wide leading-tight" style={{ fontFamily: 'Outfit' }}>CORONYX</p>
              <p className="text-xs" style={{ color: '#5FC9BE' }}>Sistema Dental</p>
            </div>
          </div>
          <h1 className="text-white text-3xl font-bold leading-tight mb-4" style={{ fontFamily: 'Outfit' }}>
            Gestión clínica inteligente
          </h1>
          <p className="text-white/40 text-sm leading-relaxed">
            Plataforma SaaS para clínicas odontológicas con asistente IA, análisis ML de radiografías y teleodontología integrada.
          </p>
          <div className="mt-8 space-y-3">
            {(Object.keys(ROLE_META) as Role[]).filter(r => r !== 'PACIENTE').map(r => (
              <div key={r} className="flex items-center gap-3 text-sm text-white/40">
                <span className="text-base">{ROLE_META[r].icon}</span>
                <span>{ROLE_META[r].label} — {ROLE_META[r].desc}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/20 text-xs">Plataforma CORONYX · v2.1 · 5 roles activos</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <CoroNyxLogo size={32} />
            <div>
              <span className="text-white text-lg font-bold tracking-wide" style={{ fontFamily: 'Outfit' }}>CORONYX</span>
              <p className="text-xs" style={{ color: '#5FC9BE' }}>Sistema Dental</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-white/8 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-white text-2xl font-semibold mb-1" style={{ fontFamily: 'Outfit' }}>Bienvenido</h2>
            <p className="text-white/40 text-sm mb-7">Ingresa con tu cuenta institucional</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50 font-medium block mb-1.5">Correo electrónico</label>
                <input value={email} onChange={e => handleEmailChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  placeholder="usuario@clinica.co" />
                {detectedRole && (
                  <p className="text-xs text-cyan-400 mt-1.5 flex items-center gap-1">
                    <span>{ROLE_META[detectedRole].icon}</span>
                    Rol detectado: <strong>{ROLE_META[detectedRole].label}</strong>
                  </p>
                )}
              </div>

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

              {/* Demo role selector — 5 roles */}
              <div className="bg-white/3 border border-white/8 rounded-xl p-3">
                <p className="text-xs text-white/30 mb-2 font-medium">Demo — selecciona rol a simular:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(ROLE_META) as Role[]).map(r => (
                    <button key={r} onClick={() => setDemoRole(r)}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left ${demoRole === r ? `bg-gradient-to-r ${ROLE_META[r].color} text-white shadow-sm` : 'text-white/40 hover:bg-white/5'}`}>
                      <span>{ROLE_META[r].icon}</span>
                      {ROLE_META[r].label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleLogin} disabled={loading}
                className="w-full py-3 bg-cyan-600 text-white rounded-xl font-semibold text-sm hover:bg-cyan-500 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verificando rol...
                  </>
                ) : 'Ingresar'}
              </button>
            </div>

            <p className="text-center text-xs text-white/20 mt-6">
              ¿Eres paciente?{' '}
              <button onClick={() => { setDemoRole('PACIENTE'); handleLogin() }} className="text-white/50 hover:text-white/80 transition-colors underline underline-offset-2">
                Acceder a tu portal web
              </button>
            </p>
          </div>

          <p className="text-center text-xs text-white/15 mt-5">
            5 roles disponibles: SUPER_ADMIN · ADMIN_CLINICA · ODONTOLOGO · RECEPCIONISTA · PACIENTE
          </p>
        </div>
      </div>
    </div>
  )
}
