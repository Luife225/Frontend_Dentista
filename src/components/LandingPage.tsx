import { useState, useEffect } from 'react'

interface Props {
  onLogin: () => void
}

// ─── Logo isotipo SVG fiel al logo proporcionado ──────────────────────────────
function CoroNyxLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <defs>
        <linearGradient id="lg-main" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5FC9BE"/>
          <stop offset="50%" stopColor="#1E8C82"/>
          <stop offset="100%" stopColor="#0B3D3A"/>
        </linearGradient>
        <linearGradient id="lg-tooth" x1="35" y1="28" x2="65" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7DD9D3"/>
          <stop offset="100%" stopColor="#1E8C82"/>
        </linearGradient>
      </defs>
      {/* C arc — open right, ~300° */}
      <path d="M72 14 A38 38 0 1 0 72 86" stroke="url(#lg-main)" strokeWidth="7" strokeLinecap="round" fill="none"/>
      {/* Tech nodes at the open end */}
      <circle cx="75" cy="12" r="4" fill="#5FC9BE"/>
      <circle cx="84" cy="20" r="2.5" fill="#5FC9BE" opacity="0.6"/>
      <circle cx="90" cy="29" r="1.5" fill="#5FC9BE" opacity="0.35"/>
      <line x1="75" y1="12" x2="84" y2="20" stroke="#5FC9BE" strokeWidth="1.5" opacity="0.5"/>
      <line x1="84" y1="20" x2="90" y2="29" stroke="#5FC9BE" strokeWidth="1.5" opacity="0.35"/>
      {/* Tooth body */}
      <path d="M50 30 C42 30 36 36 36 44 L37.5 63 C37.8 66 39.5 67.5 42 67.5 C44.5 67.5 46 65.5 50 65.5 C54 65.5 55.5 67.5 58 67.5 C60.5 67.5 62.2 66 62.5 63 L64 44 C64 36 58 30 50 30 Z" fill="url(#lg-tooth)" opacity="0.95"/>
      {/* Crown — 3 points */}
      <polyline points="37,33 40,23 50,30 60,23 63,33" stroke="#5FC9BE" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" fill="none"/>
      {/* Crown orbs */}
      <circle cx="40" cy="23" r="2.5" fill="#5FC9BE" opacity="0.8"/>
      <circle cx="50" cy="19" r="2.5" fill="#5FC9BE"/>
      <circle cx="60" cy="23" r="2.5" fill="#5FC9BE" opacity="0.8"/>
    </svg>
  )
}

const FEATURES = [
  {
    icon: '🦷',
    title: 'Historia clínica unificada',
    desc: 'Expediente digital completo del paciente: odontograma interactivo, radiografías, evoluciones y documentos en un solo lugar.',
    color: '#1E8C82',
  },
  {
    icon: '📅',
    title: 'Agenda inteligente',
    desc: 'Gestión de citas presenciales y virtuales con confirmaciones automáticas, recordatorios y vista semanal/mensual.',
    color: '#2BA89D',
  },
  {
    icon: '🗺️',
    title: 'Odontograma digital',
    desc: 'Odontograma SVG interactivo por pieza dental. Registra diagnósticos, tratamientos y evolución con un clic.',
    color: '#1E8C82',
  },
  {
    icon: '🎙️',
    title: 'Asistente IA por voz',
    desc: 'Dicta notas clínicas durante la atención. La IA las estructura automáticamente y las guarda en la historia del paciente.',
    color: '#2BA89D',
  },
  {
    icon: '🔬',
    title: 'Análisis ML de radiografías',
    desc: 'Inteligencia artificial asiste en la detección de hallazgos en radiografías, marcando regiones de interés para el odontólogo.',
    color: '#1E8C82',
  },
  {
    icon: '📹',
    title: 'Teleodontología integrada',
    desc: 'Consultas virtuales por videollamada directamente dentro de la plataforma, con sala de espera digital y chat.',
    color: '#2BA89D',
  },
  {
    icon: '📊',
    title: 'Dashboard y reportes',
    desc: 'Indicadores en tiempo real: ingresos, ocupación, pacientes atendidos, inventario y rendimiento del equipo.',
    color: '#1E8C82',
  },
]

const ROLES = [
  {
    role: 'Administrador de clínica',
    icon: '⚙️',
    desc: 'Controla usuarios, configuración de la clínica, reportes financieros, inventario y planes del equipo.',
    color: 'from-slate-600 to-slate-700',
    tag: 'ADMIN_CLINICA',
  },
  {
    role: 'Odontólogo',
    icon: '🦷',
    desc: 'Accede a la historia clínica completa, agenda sus citas, usa el asistente IA y atiende consultas virtuales.',
    color: 'from-cyan-600 to-cyan-700',
    tag: 'ODONTOLOGO',
  },
  {
    role: 'Recepcionista',
    icon: '📋',
    desc: 'Gestiona la agenda, confirma citas, administra el inventario y registra datos básicos de pacientes.',
    color: 'from-violet-600 to-violet-700',
    tag: 'RECEPCIONISTA',
  },
  {
    role: 'Paciente',
    icon: '👤',
    desc: 'Accede a su portal web personal: ve sus citas, paga tratamientos, revisa su historial y se une a videollamadas.',
    color: 'from-emerald-600 to-emerald-700',
    tag: 'PACIENTE',
  },
]

const TRUST = [
  {
    icon: '🔒',
    title: 'Datos clínicos seguros',
    desc: 'Cifrado de extremo a extremo. Cumplimiento de normativas de salud digital y protección de datos de pacientes.',
  },
  {
    icon: '⚡',
    title: 'Ahorra tiempo administrativo',
    desc: 'Reduce hasta 70% el tiempo en registros manuales gracias al asistente de voz y la automatización de agendas.',
  },
  {
    icon: '😊',
    title: 'Mejor experiencia del paciente',
    desc: 'El paciente ve su historial, paga en línea y accede a videollamadas desde su computador o celular.',
  },
  {
    icon: '☁️',
    title: '100% en la nube',
    desc: 'Sin instalaciones. Accede desde cualquier dispositivo. Actualizaciones automáticas sin interrupciones.',
  },
]

export default function LandingPage({ onLogin }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-100' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-8">
          {/* Logo */}
          <a href="#hero" className="flex items-center gap-2.5 shrink-0">
            <CoroNyxLogo size={38} />
            <div>
              <p className="text-[#0B3D3A] text-base font-bold tracking-wide leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>CORONYX</p>
              <p className="text-[#1E8C82] text-[10px] leading-tight">Sistema Dental</p>
            </div>
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6 flex-1">
            <a href="#funcionalidades" className="text-sm text-slate-600 hover:text-[#1E8C82] transition-colors font-medium">Funcionalidades</a>
            <a href="#roles" className="text-sm text-slate-600 hover:text-[#1E8C82] transition-colors font-medium">Para tu clínica</a>
            <a href="#beneficios" className="text-sm text-slate-600 hover:text-[#1E8C82] transition-colors font-medium">Beneficios</a>
            <a href="#contacto" className="text-sm text-slate-600 hover:text-[#1E8C82] transition-colors font-medium">Contacto</a>
          </div>

          <div className="flex-1 md:flex-none" />

          {/* CTA button */}
          <button
            onClick={onLogin}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-teal-700/20"
            style={{ background: 'linear-gradient(135deg, #1E8C82, #0B3D3A)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
            Ingresar
          </button>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-slate-600" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 pb-4 space-y-3">
            {['#funcionalidades', '#roles', '#beneficios', '#contacto'].map((href, i) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}
                className="block text-sm text-slate-700 font-medium py-1.5">
                {['Funcionalidades', 'Para tu clínica', 'Beneficios', 'Contacto'][i]}
              </a>
            ))}
            <button onClick={onLogin}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #1E8C82, #0B3D3A)' }}>
              Ingresar al sistema
            </button>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section id="hero" className="relative min-h-screen flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #062422 0%, #0B3D3A 40%, #115952 100%)' }}>

        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #5FC9BE, transparent)' }}/>
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-8"
            style={{ background: 'radial-gradient(circle, #1E8C82, transparent)' }}/>
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#5FC9BE" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-24 pb-16 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — copy */}
            <div className="fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border"
                style={{ background: 'rgba(95,201,190,0.12)', borderColor: 'rgba(95,201,190,0.3)', color: '#5FC9BE' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                Plataforma SaaS · Odontología Inteligente
              </div>

              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-6"
                style={{ fontFamily: 'Outfit, sans-serif' }}>
                La gestión dental{' '}
                <span style={{ background: 'linear-gradient(90deg, #5FC9BE, #2BA89D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  impulsada por IA
                </span>{' '}
                que tu clínica necesita
              </h1>

              <p className="text-lg text-white/60 leading-relaxed mb-8 max-w-xl">
                Asistente de voz clínico, odontograma digital, análisis de radiografías con Machine Learning, teleodontología y gestión integral — todo en una sola plataforma.
              </p>

              <div className="flex flex-wrap gap-3">
                <button onClick={onLogin}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-white transition-all hover:opacity-90 hover:shadow-xl hover:shadow-teal-900/40 hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #2BA89D, #1E8C82)' }}>
                  Ingresar al sistema
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                </button>
                <a href="#funcionalidades"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold transition-all hover:bg-white/10"
                  style={{ border: '1px solid rgba(95,201,190,0.3)', color: '#5FC9BE' }}>
                  Conocer más
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 mt-8 text-white/40 text-xs">
                {['🔒 Datos cifrados', '☁️ 100% en la nube', '⚡ Sin instalaciones'].map(b => (
                  <span key={b} className="flex items-center gap-1">{b}</span>
                ))}
              </div>
            </div>

            {/* Right — Dashboard mockup */}
            <div className="relative hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}>
                {/* Mock top bar */}
                <div className="bg-white/8 px-4 py-2.5 flex items-center gap-2 border-b border-white/8">
                  <div className="flex gap-1.5">
                    {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{background:c}}/>)}
                  </div>
                  <div className="flex-1 mx-4 h-5 rounded-md bg-white/10 flex items-center px-2">
                    <span className="text-white/30 text-[10px]">coronyx.clinica.co · dashboard</span>
                  </div>
                </div>

                {/* Mock dashboard content */}
                <div className="p-5 space-y-4">
                  {/* KPI cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Pacientes hoy', val: '24', icon: '👤', color: '#5FC9BE' },
                      { label: 'Ingresos', val: '$4.2M', icon: '💰', color: '#34d399' },
                      { label: 'Citas pendientes', val: '8', icon: '📅', color: '#f59e0b' },
                    ].map(k => (
                      <div key={k.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <p className="text-[10px] text-white/40 mb-1">{k.label}</p>
                        <p className="text-lg font-bold" style={{ color: k.color, fontFamily: 'Outfit' }}>{k.val}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">{k.icon}</p>
                      </div>
                    ))}
                  </div>

                  {/* Odontograma preview mini */}
                  <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(95,201,190,0.15)' }}>
                    <p className="text-[10px] text-white/40 mb-3">Odontograma · Carlos Rivas</p>
                    <div className="flex gap-1 flex-wrap">
                      {Array.from({length: 16}).map((_, i) => (
                        <div key={i} className="w-5 h-6 rounded-md flex items-center justify-center text-[8px]"
                          style={{
                            background: [2,5,11].includes(i) ? 'rgba(239,68,68,0.7)' : [7,13].includes(i) ? 'rgba(95,201,190,0.5)' : 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.1)'
                          }}>
                          {[2,5,11].includes(i) ? '⚠' : ''}
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] text-white/25 mt-2">16 piezas · 3 diagnósticos activos</p>
                  </div>

                  {/* Next appointments */}
                  <div className="space-y-2">
                    {[
                      { name: 'María García', time: '09:00', proc: 'Exodoncia' },
                      { name: 'Juan López', time: '10:30', proc: 'Ortodoncia control' },
                      { name: 'Ana Torres', time: '11:00', proc: 'Teleodontología 📹' },
                    ].map(a => (
                      <div key={a.name} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: 'linear-gradient(135deg,#5FC9BE,#1E8C82)' }}>
                          {a.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/80 text-[11px] font-medium">{a.name}</p>
                          <p className="text-white/35 text-[10px]">{a.proc}</p>
                        </div>
                        <span className="text-[10px] font-semibold" style={{ color: '#5FC9BE' }}>{a.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating AI badge */}
              <div className="absolute -top-4 -right-4 rounded-xl px-3 py-2 shadow-lg border border-white/10 flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #1E8C82, #0B3D3A)' }}>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
                <span className="text-white text-[11px] font-semibold">Asistente IA · Activo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-12 lg:h-16">
            <path d="M0 60 L0 30 Q360 0 720 30 Q1080 60 1440 30 L1440 60 Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ── Qué hace CORONYX ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 border"
            style={{ background: '#ecfaf9', borderColor: '#b3e8e5', color: '#1E8C82' }}>
            ¿Qué es CORONYX?
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif', color: '#0B3D3A' }}>
            La plataforma que digitaliza tu clínica de punta a punta
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed max-w-3xl mx-auto">
            CORONYX es un sistema de gestión odontológica en la nube diseñado para clínicas que quieren dejar atrás el papel, los cuadernos y los Excel. Desde el primer contacto del paciente hasta el seguimiento post-tratamiento, todo queda registrado, organizado y accesible para tu equipo en segundos.
          </p>
          <div className="mt-10 grid sm:grid-cols-3 gap-6 text-left">
            {[
              { n: '+40%', label: 'más productividad clínica', sub: 'con el asistente de voz IA' },
              { n: '-70%', label: 'tiempo en papeleo', sub: 'gracias a la automatización' },
              { n: '100%', label: 'datos en la nube', sub: 'seguros y siempre disponibles' },
            ].map(s => (
              <div key={s.n} className="rounded-2xl p-6 text-center border" style={{ borderColor: '#d9f4f2', background: '#ecfaf9' }}>
                <p className="text-3xl font-bold mb-1" style={{ fontFamily: 'Outfit', color: '#1E8C82' }}>{s.n}</p>
                <p className="text-sm font-semibold text-slate-700">{s.label}</p>
                <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Funcionalidades ── */}
      <section id="funcionalidades" className="py-20 px-6" style={{ background: '#FAFAFA' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 border"
              style={{ background: '#ecfaf9', borderColor: '#b3e8e5', color: '#1E8C82' }}>
              Funcionalidades
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#0B3D3A' }}>
              Todo lo que tu clínica necesita, integrado
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">Un ecosistema completo para la gestión clínica moderna, sin módulos externos ni integraciones complicadas.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {FEATURES.map(f => (
              <div key={f.title}
                className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-50 transition-all duration-300 group cursor-default">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110"
                  style={{ background: 'linear-gradient(135deg, #ecfaf9, #d9f4f2)' }}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-slate-800 mb-2 text-sm" style={{ fontFamily: 'Outfit' }}>{f.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para cada rol ── */}
      <section id="roles" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 border"
              style={{ background: '#ecfaf9', borderColor: '#b3e8e5', color: '#1E8C82' }}>
              Para tu equipo
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#0B3D3A' }}>
              Cada persona, con lo que necesita
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              CORONYX adapta la experiencia según el rol. Cada usuario ve solo lo que le corresponde, con su propio dashboard personalizado.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ROLES.map(r => (
              <div key={r.role} className="rounded-2xl overflow-hidden border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`bg-gradient-to-br ${r.color} p-5`}>
                  <div className="text-3xl mb-2">{r.icon}</div>
                  <h3 className="text-white font-bold text-base" style={{ fontFamily: 'Outfit' }}>{r.role}</h3>
                  <span className="text-white/60 text-[10px] font-mono">{r.tag}</span>
                </div>
                <div className="p-5 bg-white">
                  <p className="text-slate-500 text-sm leading-relaxed">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Confianza / Beneficios ── */}
      <section id="beneficios" className="py-20 px-6" style={{ background: 'linear-gradient(135deg, #0B3D3A 0%, #115952 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 border"
              style={{ background: 'rgba(95,201,190,0.15)', borderColor: 'rgba(95,201,190,0.3)', color: '#5FC9BE' }}>
              Por qué CORONYX
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Confianza en cada clic
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST.map(t => (
              <div key={t.title} className="rounded-2xl p-6 border" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(95,201,190,0.15)' }}>
                <div className="text-3xl mb-4">{t.icon}</div>
                <h3 className="text-white font-semibold mb-2 text-sm" style={{ fontFamily: 'Outfit' }}>{t.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-24 px-6 bg-white text-center">
        <div className="max-w-2xl mx-auto">
          <CoroNyxLogo size={56} />
          <h2 className="text-3xl lg:text-4xl font-bold mt-6 mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#0B3D3A' }}>
            ¿Listo para transformar tu clínica?
          </h2>
          <p className="text-slate-500 mb-8 text-lg">
            Ingresa ahora y explora todas las funcionalidades de CORONYX. Gestión inteligente, desde hoy.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={onLogin}
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white transition-all hover:opacity-90 hover:shadow-xl hover:shadow-teal-700/20 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #1E8C82, #0B3D3A)' }}>
              Ingresar al sistema
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </button>
            <a href="#funcionalidades"
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition-all border hover:bg-slate-50"
              style={{ borderColor: '#b3e8e5', color: '#1E8C82' }}>
              Ver funcionalidades
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="contacto" className="py-12 px-6 border-t border-slate-100" style={{ background: '#FAFAFA' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <CoroNyxLogo size={36} />
                <div>
                  <p className="font-bold text-base" style={{ fontFamily: 'Outfit', color: '#0B3D3A' }}>CORONYX</p>
                  <p className="text-xs" style={{ color: '#1E8C82' }}>Sistema Dental</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Plataforma SaaS de gestión odontológica con inteligencia artificial, teleodontología y odontograma digital.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3" style={{ fontFamily: 'Outfit' }}>Plataforma</h4>
              <ul className="space-y-2">
                {['Funcionalidades', 'Para tu clínica', 'Precios', 'Integraciones'].map(l => (
                  <li key={l}><a href="#" className="text-sm text-slate-400 hover:text-teal-600 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3" style={{ fontFamily: 'Outfit' }}>Contacto</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>📧 soporte@coronyx.co</li>
                <li>📞 +57 310 000 0000</li>
                <li>🕐 Lunes a viernes 8am – 6pm</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-slate-400 text-xs">© 2026 CORONYX — Sistema Dental. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              {['Privacidad', 'Términos', 'HABEAS DATA'].map(l => (
                <a key={l} href="#" className="text-slate-400 text-xs hover:text-teal-600 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
