import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import coronixLogo from '../imports/coronixlogo.png'

// Registro oficial de plugins GSAP
gsap.registerPlugin(ScrollTrigger)

// ── Stats data config ────────────────────────────────────────────────────────
// NOTA: Valores demostrativos actuales de la landing page.
// Modificar aquí si se conectan a métricas reales o dinámicas.
const STATS_DATA = [
  { target: 2400, prefix: '', suffix: '+', decimals: 0, label: 'Pacientes gestionados', sub: 'en clínicas activas', formatThousand: true },
  { target: 11,   prefix: '', suffix: '',  decimals: 0, label: 'Módulos clínicos',      sub: 'integrados en 1 plataforma', formatThousand: false },
  { target: 5,    prefix: '', suffix: '',  decimals: 0, label: 'Roles de usuario',      sub: 'control granular de acceso', formatThousand: false },
  { target: 99.9, prefix: '', suffix: '%', decimals: 1, label: 'Uptime garantizado',    sub: 'SLA Enterprise', formatThousand: false },
]

// ── Logo ──────────────────────────────────────────────────────────────────────
function CxLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="lpG" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5FC9BE"/>
          <stop offset="100%" stopColor="#0B3D3A"/>
        </linearGradient>
      </defs>
      <path d="M48 10 A24 24 0 1 0 48 54" stroke="url(#lpG)" strokeWidth="5.5" strokeLinecap="round" fill="none"/>
      <circle cx="50.5" cy="8.5" r="3" fill="#5FC9BE"/>
      <circle cx="55.5" cy="13.5" r="1.8" fill="#5FC9BE" opacity="0.55"/>
      <path d="M32 19 C27 19 24 22 24 27.5 L25 40 C25.2 41.6 26.4 42.5 27.8 42.5 C29.2 42.5 30 41.2 32 41.2 C34 41.2 34.8 42.5 36.2 42.5 C37.6 42.5 38.8 41.6 39 40 L40 27.5 C40 22 37 19 32 19 Z" fill="url(#lpG)" opacity="0.9"/>
      <polyline points="26,20.5 28.5,14.5 32,19 35.5,14.5 38,20.5" stroke="#5FC9BE" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

// ── Dashboard mockup ──────────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div className="relative w-full" style={{ aspectRatio: '16/10' }}>
      {/* Glow behind */}
      <div className="absolute inset-0 rounded-2xl blur-3xl opacity-30"
        style={{ background: 'radial-gradient(ellipse at 60% 40%, #1E8C82, transparent 70%)' }} />

      {/* Browser chrome */}
      <div className="mockup-window relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
        style={{ background: '#0d1a18' }}>

        {/* URL bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8" style={{ background: '#0a1513' }}>
          <div className="flex gap-1.5">
            {['#FF5F56','#FFBD2E','#27C93F'].map(c => (
              <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="flex-1 mx-3 px-3 py-0.5 rounded text-[10px] text-white/30 border border-white/8"
            style={{ background: '#0d1a18', maxWidth: 220 }}>
            app.coronyx.io
          </div>
        </div>

        {/* App layout */}
        <div className="flex h-full" style={{ height: 'calc(100% - 36px)' }}>

          {/* Sidebar */}
          <div className="w-12 shrink-0 flex flex-col items-center py-3 gap-3 border-r border-white/5"
            style={{ background: '#0B3D3A' }}>
            <img src={coronixLogo} alt="CORONYX" className="w-7 h-7 object-contain" />
            {[
              'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
              'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
              'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857',
              'M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
            ].map((d, i) => (
              <div key={i} className={`mockup-sidebar-icon w-7 h-7 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-cyan-500/25' : ''}`}>
                <svg className={`w-3.5 h-3.5 ${i === 0 ? 'text-cyan-400' : 'text-white/25'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d={d}/>
                </svg>
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-hidden p-3" style={{ background: '#0d1f1c' }}>
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { label: 'Citas hoy', val: '14', color: '#1E8C82' },
                { label: 'Pacientes', val: '287', color: '#7C3AED' },
                { label: 'Pendientes', val: '3', color: '#D97706' },
                { label: 'Ingresos', val: '$4.2M', color: '#059669' },
              ].map((s, i) => (
                <div key={i} className="mockup-stat-card rounded-lg p-2 border border-white/5" style={{ background: '#112220' }}>
                  <p className="text-[8px] text-white/40 mb-0.5">{s.label}</p>
                  <p className="text-sm font-bold" style={{ color: s.color, fontFamily: 'Outfit' }}>{s.val}</p>
                </div>
              ))}
            </div>

            {/* Content row */}
            <div className="grid grid-cols-3 gap-2">
              {/* Calendar */}
              <div className="mockup-calendar col-span-2 rounded-lg p-2 border border-white/5" style={{ background: '#112220' }}>
                <p className="text-[8px] text-white/50 mb-2 font-medium">Agenda · Hoy</p>
                {[
                  { time: '09:00', patient: 'Ana Torres', type: 'Revisión', color: '#1E8C82' },
                  { time: '10:30', patient: 'Luis Mora', type: 'Extracción', color: '#D97706' },
                  { time: '11:00', patient: 'María Gil', type: 'Ortodoncia', color: '#7C3AED' },
                  { time: '14:30', patient: 'Carlos V.', type: 'Blanqueamiento', color: '#1E8C82' },
                ].map((a, i) => (
                  <div key={i} className="mockup-agenda-item flex items-center gap-1.5 py-1 border-b border-white/4">
                    <span className="text-[7px] text-white/30 w-8 shrink-0 font-mono">{a.time}</span>
                    <div className="w-1 h-4 rounded-full shrink-0" style={{ backgroundColor: a.color }}/>
                    <span className="text-[7px] text-white/70 truncate flex-1">{a.patient}</span>
                    <span className="text-[6px] px-1 py-0.5 rounded-full shrink-0"
                      style={{ backgroundColor: a.color+'20', color: a.color }}>{a.type}</span>
                  </div>
                ))}
              </div>

              {/* Odontogram preview */}
              <div className="mockup-odontogram rounded-lg p-2 border border-white/5" style={{ background: '#112220' }}>
                <p className="text-[8px] text-white/50 mb-2 font-medium">Odontograma</p>
                <div className="grid grid-cols-8 gap-0.5 mb-1.5">
                  {Array.from({length: 16}).map((_, i) => (
                    <div key={i} className="mockup-odontogram-cell w-3 h-3 rounded-sm"
                      style={{ backgroundColor: [2,5,9].includes(i) ? '#1E8C82' : [7,11].includes(i) ? '#D97706' : '#ffffff12' }}/>
                  ))}
                </div>
                <div className="grid grid-cols-8 gap-0.5">
                  {Array.from({length: 16}).map((_, i) => (
                    <div key={i} className="mockup-odontogram-cell w-3 h-3 rounded-sm"
                      style={{ backgroundColor: [3,6,13].includes(i) ? '#7C3AED' : '#ffffff12' }}/>
                  ))}
                </div>
                {/* AI badge */}
                <div className="mockup-ai-badge mt-2 flex items-center gap-1 bg-rose-500/15 rounded-md px-1.5 py-1">
                  <div className="w-1 h-1 bg-rose-400 rounded-full animate-pulse"/>
                  <span className="text-[7px] text-rose-300 font-medium">IA activa · dictando</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Plans ─────────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'individual',
    name: 'Individual',
    subtitle: 'Para el odontólogo independiente',
    price: 149000,
    priceNote: '/mes',
    badge: null,
    color: '#5FC9BE',
    highlight: false,
    cta: 'Comenzar gratis',
    features: [
      '1 consultorio · 1 usuario clínico',
      'Agenda con recordatorios WhatsApp',
      'Historia clínica ilimitada',
      'Odontograma digital',
      'Portal del paciente incluido',
      '10 GB almacenamiento DICOM',
      'Soporte por email',
    ],
    missing: ['Asistente IA por voz', 'Análisis ML de radiografías', 'Teleodontología', 'Multi-sede'],
  },
  {
    id: 'pro',
    name: 'Clínicas Pro',
    subtitle: 'Para clínicas en crecimiento',
    price: 490000,
    priceNote: '/mes',
    badge: 'Más popular',
    color: '#1E8C82',
    highlight: true,
    cta: 'Solicitar plan Pro',
    features: [
      'Hasta 5 consultorios · 15 usuarios',
      'Todo lo de Individual',
      'Asistente IA por voz 🎙',
      'Análisis ML de radiografías 🔬',
      'Teleodontología integrada 📹',
      '100 GB DICOM + backups diarios',
      'Notificaciones multicanal (WA, SMS, Email)',
      'Reportes financieros avanzados',
      'Soporte prioritario',
    ],
    missing: [],
  },
  {
    id: 'enterprise',
    name: 'Red / Enterprise',
    subtitle: 'Multi-sede y grandes redes',
    price: 0,
    priceNote: 'A medida',
    badge: 'Enterprise',
    color: '#7C3AED',
    highlight: false,
    cta: 'Solicitar cotización',
    features: [
      'Consultorios y usuarios ilimitados',
      'Todo lo de Clínicas Pro',
      'Multi-sede con dashboard unificado',
      '1 TB DICOM + almacenamiento escalable',
      'IA prioritaria y modelos personalizados',
      'SLA 99.9% garantizado',
      'Integración con sistemas existentes (API)',
      'Onboarding dedicado + capacitación',
      'Soporte 24/7 con ejecutivo de cuenta',
    ],
    missing: [],
  },
]

// ── Feature card data ─────────────────────────────────────────────────────────
const FEATURES = [
  { icon: '🗓', title: 'Agenda inteligente',      desc: 'Calendario con detección de conflictos, recordatorios automáticos por WhatsApp y sincronización multi-sede.',      tag: 'Core' },
  { icon: '🦷', title: 'Odontograma digital',     desc: 'Registro por cara del diente con SVG interactivo, historial por diente y resaltado en tiempo real por dictado IA.', tag: 'Clínico' },
  { icon: '🎙', title: 'Asistente IA por voz',    desc: 'Dicta la historia clínica mientras atiendes al paciente. La IA estructura y genera el borrador en segundos.',        tag: 'IA' },
  { icon: '📹', title: 'Teleodontología',         desc: 'Videoconsultas integradas con chat, adjuntos de radiografías en tiempo real y registro automático en el historial.', tag: 'Teleconsulta' },
  { icon: '🔬', title: 'Análisis ML de RX',       desc: 'Carga imágenes DICOM y obtén detección asistida de caries, reabsorciones y lesiones óseas por machine learning.',   tag: 'IA' },
  { icon: '📋', title: 'Historia clínica unif.',  desc: 'Paciente, historial, odontograma y radiografías en una sola vista. Diseñado para el flujo clínico real.',            tag: 'Clínico' },
  { icon: '💳', title: 'Caja y facturación',      desc: 'Control de ingresos, múltiples métodos de pago y reportes mensuales. Cobro pendiente con un clic desde la agenda.', tag: 'Gestión' },
  { icon: '📦', title: 'Inventario',              desc: 'Control de stock con alertas de mínimos, historial de consumo por procedimiento y órdenes de compra integradas.',    tag: 'Gestión' },
  { icon: '👥', title: 'Multi-rol y multi-sede',  desc: 'Acceso diferenciado por rol. SUPER_ADMIN gestiona todas las clínicas; cada sede tiene su propia configuración.',      tag: 'Enterprise' },
]

// ── Role data (public — SUPER_ADMIN is internal only) ─────────────────────────
const ROLES = [
  {
    key: 'ODONTOLOGO',
    icon: '🦷',
    title: 'Odontólogo',
    badge: 'Clínico',
    badgeColor: '#1E8C82',
    desc: 'Acceso completo a la historia clínica, odontograma digital, asistente IA, análisis de radiografías y teleodontología.',
    modules: ['Historia clínica', 'Odontograma IA', 'Radiografías + ML', 'Teleodontología', 'Agenda propia'],
    bg: 'from-cyan-500/10 to-teal-500/5',
    accent: '#1E8C82',
  },
  {
    key: 'RECEPCIONISTA',
    icon: '📋',
    title: 'Recepcionista',
    badge: 'Operativo',
    badgeColor: '#7C3AED',
    desc: 'Gestión de agenda, citas, pacientes e inventario. Sin acceso a datos clínicos sensibles — privacidad garantizada.',
    modules: ['Agenda completa', 'Pacientes (sin clínica)', 'Inventario', 'Notificaciones', 'Caja básica'],
    bg: 'from-violet-500/10 to-purple-500/5',
    accent: '#7C3AED',
  },
  {
    key: 'ADMIN_CLINICA',
    icon: '⚙️',
    title: 'Administrador',
    badge: 'Config.',
    badgeColor: '#475569',
    desc: 'Configuración del consultorio, gestión del equipo médico, horarios, facturación avanzada y reportes gerenciales.',
    modules: ['Configuración sede', 'Usuarios y roles', 'Reportes financieros', 'Inventario', 'Suscripción'],
    bg: 'from-slate-500/10 to-gray-500/5',
    accent: '#64748B',
  },
  {
    key: 'PACIENTE',
    icon: '📱',
    title: 'Paciente',
    badge: 'App móvil',
    badgeColor: '#059669',
    desc: 'Portal web responsive exclusivo. Consulta tus citas, realiza pagos, sigue el avance de tu tratamiento y accede a teleconsultas.',
    modules: ['Mis citas', 'Pagos en línea', 'Avances del tratamiento', 'Teleconsulta', 'Mis documentos'],
    bg: 'from-emerald-500/10 to-green-500/5',
    accent: '#059669',
  },
]

const SECURITY = [
  { icon: '🔒', title: 'Cifrado end-to-end',    desc: 'Datos en tránsito con TLS 1.3 y en reposo con AES-256. Las radiografías y documentos se almacenan cifrados.' },
  { icon: '🛡', title: 'HIPAA Compliant',        desc: 'Arquitectura diseñada para cumplir con HIPAA, Ley 1581 de Protección de Datos (Colombia) y GDPR.' },
  { icon: '☁️', title: 'Infraestructura cloud', desc: 'Desplegado en AWS con auto-scaling, backups automáticos diarios y recuperación ante desastres en < 4 h.' },
  { icon: '📊', title: '99.9% uptime SLA',       desc: 'Acuerdo de nivel de servicio garantizado. Monitoreo 24/7 con alertas proactivas y soporte prioritario.' },
  { icon: '🔑', title: 'Control de acceso',      desc: 'Roles granulares, autenticación multifactor y auditoría de cada acción sobre datos clínicos.' },
  { icon: '📜', title: 'ISO 27001',              desc: 'Gestión de seguridad de la información certificada. Revisiones de vulnerabilidades cada trimestre.' },
]

// ── Contact form component ────────────────────────────────────────────────────
function ContactForm() {
  const [form, setForm] = useState({ name: '', clinic: '', phone: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  function submit(e: { preventDefault: () => void }) {
    e.preventDefault()
    setSending(true)
    setTimeout(() => { setSending(false); setSent(true) }, 1200)
  }

  if (sent) {
    return (
      <div className="rounded-3xl border border-white/8 p-10 text-center"
        style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h3 className="text-white font-bold text-xl mb-2" style={{ fontFamily: 'Outfit' }}>¡Mensaje enviado!</h3>
        <p className="text-white/45 text-sm">Un especialista CORONYX se pondrá en contacto contigo en menos de 24 horas hábiles.</p>
        <button onClick={() => { setSent(false); setForm({ name:'', clinic:'', phone:'', email:'', message:'' }) }}
          className="mt-6 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
          Enviar otro mensaje
        </button>
      </div>
    )
  }

  const inputCls = "w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all"
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }

  return (
    <form onSubmit={submit}
      className="rounded-3xl border border-white/8 p-8 space-y-4"
      style={{ background: 'rgba(255,255,255,0.02)' }}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-white/45 font-medium block mb-1.5" style={{ fontFamily: 'Outfit' }}>Nombre completo *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required placeholder="Tu nombre"
            className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="text-xs text-white/45 font-medium block mb-1.5" style={{ fontFamily: 'Outfit' }}>Nombre de la clínica</label>
          <input value={form.clinic} onChange={e => setForm(f => ({ ...f, clinic: e.target.value }))}
            placeholder="Clínica Dental..."
            className={inputCls} style={inputStyle} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-white/45 font-medium block mb-1.5" style={{ fontFamily: 'Outfit' }}>Teléfono / WhatsApp</label>
          <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="+57..."
            className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="text-xs text-white/45 font-medium block mb-1.5" style={{ fontFamily: 'Outfit' }}>Correo electrónico *</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required placeholder="tu@correo.co"
            className={inputCls} style={inputStyle} />
        </div>
      </div>
      <div>
        <label className="text-xs text-white/45 font-medium block mb-1.5" style={{ fontFamily: 'Outfit' }}>Mensaje *</label>
        <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          required rows={5} placeholder="Cuéntanos sobre tu clínica, número de usuarios estimado, consultas sobre planes, integraciones..."
          className={`${inputCls} resize-none`} style={inputStyle} />
      </div>

      {/* Plan interest quick select */}
      <div>
        <p className="text-xs text-white/40 mb-2" style={{ fontFamily: 'Outfit' }}>¿Qué plan te interesa? (opcional)</p>
        <div className="flex gap-2">
          {['Individual', 'Clínicas Pro', 'Enterprise', 'Aún no lo sé'].map(p => {
            const isActive = form.message.startsWith(`[Plan: ${p}]`)
            return (
              <button type="button" key={p}
                onClick={() => setForm(f => ({ ...f, message: isActive ? f.message.replace(`[Plan: ${p}] `, '') : `[Plan: ${p}] ${f.message}` }))}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all"
                style={{
                  fontFamily: 'Outfit',
                  backgroundColor: isActive ? 'rgba(30,140,130,0.2)' : 'transparent',
                  borderColor: isActive ? '#1E8C82' : 'rgba(255,255,255,0.12)',
                  color: isActive ? '#5FC9BE' : 'rgba(255,255,255,0.4)',
                }}>
                {p}
              </button>
            )
          })}
        </div>
      </div>

      <button type="submit" disabled={sending}
        className="w-full py-3.5 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ backgroundColor: '#1E8C82', fontFamily: 'Outfit' }}
        onMouseEnter={e => !sending && (e.currentTarget.style.backgroundColor = '#15635d')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1E8C82')}>
        {sending ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
            Enviando...
          </>
        ) : 'Enviar mensaje →'}
      </button>
      <p className="text-center text-white/20 text-[11px]">Respuesta garantizada en menos de 24 h hábiles.</p>
    </form>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const onNavigate = (path: string) => navigate(path)
  const [activeRole, setActiveRole] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Refs para scoping, elementos y timelines de GSAP
  const mainRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const statsRef = useRef<HTMLElement>(null)
  const statValRefs = useRef<(HTMLParagraphElement | null)[]>([])
  const rolePanelRef = useRef<HTMLDivElement>(null)
  const roleTimelineRef = useRef<gsap.core.Timeline | null>(null)

  // Refs e interacción para Carrusel Marquee Infinito de Funcionalidades
  const marqueeContainerRef = useRef<HTMLDivElement>(null)
  const marqueeTrackRef = useRef<HTMLDivElement>(null)
  const marqueeTweenRef = useRef<gsap.core.Tween | null>(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const startProgressRef = useRef(0)
  const trackHalfWidthRef = useRef(0)
  const isHoveredRef = useRef(false)

  useEffect(() => {
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mqMobile = window.matchMedia('(max-width: 767px)')

    setPrefersReducedMotion(mqMotion.matches)
    setIsMobile(mqMobile.matches)

    const onMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    const onMobileChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)

    mqMotion.addEventListener('change', onMotionChange)
    mqMobile.addEventListener('change', onMobileChange)

    return () => {
      mqMotion.removeEventListener('change', onMotionChange)
      mqMobile.removeEventListener('change', onMobileChange)
    }
  }, [])

  const handleMarqueeMouseEnter = () => {
    isHoveredRef.current = true
    if (marqueeTweenRef.current && !isDraggingRef.current) {
      gsap.to(marqueeTweenRef.current, { timeScale: 0, duration: 0.5, ease: 'power1.out', overwrite: 'auto' })
    }
  }

  const handleMarqueeMouseLeave = () => {
    isHoveredRef.current = false
    if (marqueeTweenRef.current && !isDraggingRef.current) {
      gsap.to(marqueeTweenRef.current, { timeScale: 1, duration: 0.6, ease: 'power1.out', overwrite: 'auto' })
    }
  }

  const handleMarqueePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!marqueeTweenRef.current || !marqueeTrackRef.current) return
    isDraggingRef.current = true
    startXRef.current = e.clientX
    startProgressRef.current = marqueeTweenRef.current.progress()
    trackHalfWidthRef.current = marqueeTrackRef.current.scrollWidth / 2
    marqueeTweenRef.current.pause()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Navegadores que no soportan setPointerCapture
    }
  }

  const handleMarqueePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !marqueeTweenRef.current || !trackHalfWidthRef.current) return
    const dx = e.clientX - startXRef.current
    const progressDelta = -dx / trackHalfWidthRef.current
    const newProgress = gsap.utils.wrap(0, 1, startProgressRef.current + progressDelta)
    marqueeTweenRef.current.progress(newProgress)
  }

  const handleMarqueePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // Ignorar si ya fue liberado
    }
    if (marqueeTweenRef.current) {
      marqueeTweenRef.current.play()
      if (isHoveredRef.current) {
        gsap.to(marqueeTweenRef.current, { timeScale: 0, duration: 0.4, ease: 'power1.out', overwrite: 'auto' })
      } else {
        gsap.to(marqueeTweenRef.current, { timeScale: 1, duration: 0.5, ease: 'power1.out', overwrite: 'auto' })
      }
    }
  }

  // ── Animaciones principales con useGSAP y ScrollTrigger ──
  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(
        {
          isDesktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
          isMobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { isDesktop, isMobile, reduceMotion } = context.conditions!

          if (reduceMotion) {
            // Accesibilidad: fijar elementos directamente en su estado visible sin animaciones de movimiento
            gsap.set(['.hero-anim-item', '.mockup-window', '.hero-floating-badge'], {
              opacity: 1,
              y: 0,
              scale: 1,
            })
            // Navbar estático accesible con scroll
            ScrollTrigger.create({
              start: 'top -20',
              end: 'top -20',
              onEnter: () => {
                if (navRef.current) {
                  navRef.current.style.backgroundColor = 'rgba(8,15,14,0.88)'
                  navRef.current.style.backdropFilter = 'blur(16px)'
                  navRef.current.style.borderBottomColor = 'rgba(255,255,255,0.08)'
                }
              },
              onLeaveBack: () => {
                if (navRef.current) {
                  navRef.current.style.backgroundColor = 'rgba(8,15,14,0)'
                  navRef.current.style.backdropFilter = 'blur(0px)'
                  navRef.current.style.borderBottomColor = 'transparent'
                }
              },
            })
            return
          }

          // ── 1. Floating Navbar animado con ScrollTrigger ──
          if (navRef.current) {
            gsap.to(navRef.current, {
              backgroundColor: 'rgba(8,15,14,0.88)',
              backdropFilter: 'blur(16px)',
              borderBottomColor: 'rgba(255,255,255,0.08)',
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
              duration: 0.35,
              ease: 'power2.out',
              scrollTrigger: {
                start: 'top -20',
                end: 'top -20',
                toggleActions: 'play none none reverse',
              },
            })
          }

          // ── 2. Hero: Entrada escalonada (stagger) del copy y dashboard mockup ──
          const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } })

          // Copy stagger (badge, título, párrafo, trust badges, botones)
          heroTl.fromTo(
            '.hero-anim-item',
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.7, stagger: 0.12 }
          )

          if (isDesktop) {
            // Mockup ventana del dashboard
            heroTl.fromTo(
              '.mockup-window',
              { opacity: 0, y: 36, scale: 0.95 },
              { opacity: 1, y: 0, scale: 1, duration: 0.85 },
              '-=0.4'
            )
            // Mockup: stagger de elementos internos
            heroTl.fromTo(
              '.mockup-sidebar-icon',
              { opacity: 0, x: -10 },
              { opacity: 1, x: 0, duration: 0.35, stagger: 0.05 },
              '-=0.5'
            )
            heroTl.fromTo(
              '.mockup-stat-card',
              { opacity: 0, y: 12 },
              { opacity: 1, y: 0, duration: 0.4, stagger: 0.06 },
              '-=0.4'
            )
            heroTl.fromTo(
              ['.mockup-calendar', '.mockup-odontogram'],
              { opacity: 0, y: 12 },
              { opacity: 1, y: 0, duration: 0.45, stagger: 0.08 },
              '-=0.3'
            )
            heroTl.fromTo(
              '.mockup-agenda-item',
              { opacity: 0, x: -6 },
              { opacity: 1, x: 0, duration: 0.3, stagger: 0.04 },
              '-=0.3'
            )
            heroTl.fromTo(
              '.mockup-odontogram-cell',
              { opacity: 0, scale: 0.6 },
              { opacity: 1, scale: 1, duration: 0.25, stagger: 0.015 },
              '-=0.3'
            )
            heroTl.fromTo(
              '.mockup-ai-badge',
              { opacity: 0, scale: 0.8 },
              { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.7)' },
              '-=0.2'
            )
            // Badges flotantes exteriores
            heroTl.fromTo(
              '.hero-floating-badge',
              { opacity: 0, scale: 0.8, y: 16 },
              { opacity: 1, scale: 1, y: 0, duration: 0.5, stagger: 0.15, ease: 'back.out(1.6)' },
              '-=0.2'
            )
          } else if (isMobile) {
            // Mobile: entrada suave simplificada para cuidar rendimiento y GPU
            heroTl.fromTo(
              '.mockup-window',
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.6 },
              '-=0.3'
            )
            heroTl.fromTo(
              '.hero-floating-badge',
              { opacity: 0, y: 10 },
              { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 },
              '-=0.2'
            )
          }

          // ── 3. Strip de estadísticas: contador animado odómetro con ScrollTrigger ──
          if (statsRef.current) {
            ScrollTrigger.create({
              trigger: statsRef.current,
              start: 'top 85%',
              once: true,
              onEnter: () => {
                STATS_DATA.forEach((stat, i) => {
                  const el = statValRefs.current[i]
                  if (!el) return
                  const proxy = { value: 0 }
                  gsap.to(proxy, {
                    value: stat.target,
                    duration: 1.8,
                    ease: 'power2.out',
                    onUpdate: () => {
                      if (stat.formatThousand) {
                        const valStr = Math.floor(proxy.value)
                          .toLocaleString('es-CO')
                          .replace(/,/g, ' ')
                        el.textContent = `${stat.prefix}${valStr}${stat.suffix}`
                      } else if (stat.decimals > 0) {
                        el.textContent = `${stat.prefix}${proxy.value.toFixed(stat.decimals)}${stat.suffix}`
                      } else {
                        el.textContent = `${stat.prefix}${Math.floor(proxy.value)}${stat.suffix}`
                      }
                    },
                  })
                })
              },
            })
          }
        }
      )

      return () => mm.revert()
    },
    { scope: mainRef }
  )

  // ── Carrusel Marquee Infinito Horizontal para Funcionalidades ──
  useGSAP(
    () => {
      if (!marqueeTrackRef.current) return

      // Animar el track al 50% hacia la izquierda en loop infinito continuo lento y suave
      const tween = gsap.to(marqueeTrackRef.current, {
        xPercent: -50,
        repeat: -1,
        duration: 45,
        ease: 'none',
        force3D: true,
      })

      marqueeTweenRef.current = tween

      return () => {
        tween.kill()
      }
    },
    { scope: marqueeContainerRef }
  )

  // ── 5. Selector de roles: transición fluida al cambiar de rol ──
  useGSAP(
    () => {
      if (!rolePanelRef.current) return
      // Matar timeline anterior si el usuario hace clics rápidos entre roles
      if (roleTimelineRef.current) {
        roleTimelineRef.current.kill()
      }

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReduced) return

      const activeColor = ROLES[activeRole].accent
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
      roleTimelineRef.current = tl

      tl.fromTo(
        rolePanelRef.current,
        { borderColor: 'rgba(255,255,255,0.08)' },
        { borderColor: `${activeColor}55`, duration: 0.32 },
        0
      )
        .fromTo(
          '.role-icon-box',
          { scale: 0.85, rotate: -6 },
          { scale: 1, rotate: 0, duration: 0.3, ease: 'back.out(2)' },
          0
        )
        .fromTo('.role-badge-pill', { scale: 0.88, opacity: 0.6 }, { scale: 1, opacity: 1, duration: 0.25 }, 0)
        .fromTo('.role-desc-text', { opacity: 0.3, y: 4 }, { opacity: 1, y: 0, duration: 0.22 }, 0.04)
        .fromTo(
          '.role-module-item',
          { opacity: 0.2, x: -8 },
          { opacity: 1, x: 0, duration: 0.22, stagger: 0.03 },
          0.05
        )
        .fromTo('.role-cta-btn', { scale: 0.96, opacity: 0.8 }, { scale: 1, opacity: 1, duration: 0.2 }, 0.08)
    },
    { dependencies: [activeRole], scope: rolePanelRef }
  )

  return (
    <div ref={mainRef} className="min-h-screen" style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#080f0e', color: '#e2e8f0' }}>

      {/* ── Floating Navbar ──────────────────────────────────────────────────── */}
      <nav
        ref={navRef}
        className="fixed top-0 inset-x-0 z-50 border-b border-transparent"
        style={{ backdropFilter: 'blur(0px)', backgroundColor: 'rgba(8,15,14,0)' }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-8">
          {/* Logo */}
          <button onClick={() => onNavigate('/')} className="flex items-center gap-2.5 shrink-0">
            <img src={coronixLogo} alt="CORONYX" className="w-10 h-10 object-contain shrink-0"/>
            <div>
              <p className="text-white font-bold text-sm leading-tight tracking-widest" style={{ fontFamily: 'Outfit' }}>CORONYX</p>
              <p className="text-[10px] leading-none" style={{ color: '#5FC9BE' }}>Sistema Dental</p>
            </div>
          </button>

          {/* Anchor links */}
          <div className="hidden md:flex items-center gap-6 flex-1">
            {[['#funcionalidades','Funcionalidades'],['#roles','Por rol'],['#planes','Precios'],['#contacto','Contacto']].map(([href, label]) => (
              <a key={href} href={href}
                className="text-sm text-white/45 hover:text-white/90 transition-colors"
                style={{ fontFamily: 'Outfit' }}>
                {label}
              </a>
            ))}
          </div>

          <div className="flex-1 hidden md:block" />

          <button
            onClick={() => onNavigate('/login')}
            className="px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all shrink-0"
            style={{ backgroundColor: '#1E8C82', fontFamily: 'Outfit' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0B3D3A')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1E8C82')}>
            Ingresar →
          </button>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0B3D3A 0%, #072b28 55%, #040e0d 100%)' }}>

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, #5FC9BE 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* Radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] opacity-20 blur-3xl rounded-full"
          style={{ background: 'radial-gradient(ellipse, #1E8C82, transparent 70%)' }} />

        <div className="relative max-w-6xl mx-auto px-6 py-24 w-full">
          <div className="grid grid-cols-2 gap-16 items-center">

            {/* Left — copy */}
            <div>
              <div className="hero-anim-item inline-flex items-center gap-2 border border-white/15 text-xs font-medium px-3 py-1.5 rounded-full mb-8"
                style={{ backgroundColor: 'rgba(94,201,190,0.08)', color: '#5FC9BE', fontFamily: 'Outfit' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                Plataforma SaaS · Versión 2.0 · Enterprise
              </div>

              <h1 className="hero-anim-item text-white font-bold leading-[1.08] mb-6"
                style={{ fontFamily: 'Outfit', fontSize: 'clamp(2.2rem, 4vw, 3.4rem)' }}>
                La clínica dental<br />
                <span style={{ color: '#5FC9BE' }}>del futuro</span>,<br />
                disponible hoy.
              </h1>

              <p className="hero-anim-item text-white/55 leading-relaxed mb-8 max-w-md"
                style={{ fontSize: '1.0625rem' }}>
                CORONYX unifica agenda, historia clínica, odontograma interactivo, asistente IA por voz y teleodontología en un solo sistema — diseñado para el consultorio real.
              </p>

              {/* Trust badges */}
              <div className="hero-anim-item flex flex-wrap gap-2 mb-9">
                {['HIPAA Compliant','ISO 27001','SOC 2','AES-256','99.9% SLA'].map(b => (
                  <span key={b} className="text-xs font-medium px-2.5 py-1 rounded-lg border border-white/10"
                    style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontFamily: 'Outfit' }}>
                    {b}
                  </span>
                ))}
              </div>

              <div className="hero-anim-item flex items-center gap-3">
                <button onClick={() => onNavigate('/login')}
                  className="px-7 py-3.5 text-white text-sm font-semibold rounded-xl transition-all shadow-lg"
                  style={{ backgroundColor: '#1E8C82', fontFamily: 'Outfit' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#15635d')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1E8C82')}>
                  Comenzar gratis →
                </button>
                <a href="#funcionalidades"
                  className="px-7 py-3.5 text-sm font-medium rounded-xl border border-white/15 text-white/70 hover:text-white hover:border-white/25 transition-all"
                  style={{ fontFamily: 'Outfit' }}>
                  Ver funcionalidades
                </a>
              </div>
            </div>

            {/* Right — dashboard mockup */}
            <div className="relative">
              <DashboardMockup />
              {/* Floating badges */}
              <div className="hero-floating-badge absolute -left-6 bottom-12 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 shadow-xl"
                style={{ background: 'rgba(11,61,58,0.95)', backdropFilter: 'blur(12px)' }}>
                <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse shrink-0"/>
                <div>
                  <p className="text-white text-xs font-semibold" style={{ fontFamily: 'Outfit' }}>IA dictando</p>
                  <p className="text-white/40 text-[10px]">Historia clínica · Molar #36</p>
                </div>
              </div>
              <div className="hero-floating-badge absolute -right-4 top-10 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 shadow-xl"
                style={{ background: 'rgba(11,61,58,0.95)', backdropFilter: 'blur(12px)' }}>
                <span className="text-base">🦷</span>
                <div>
                  <p className="text-white text-xs font-semibold" style={{ fontFamily: 'Outfit' }}>+14 citas hoy</p>
                  <p className="text-white/40 text-[10px]">Ocupación 92%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-32"
          style={{ background: 'linear-gradient(to bottom, transparent, #080f0e)' }} />
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────────────── */}
      <section ref={statsRef} className="border-y border-white/6" style={{ background: '#0d1a18' }}>
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-4 divide-x divide-white/8">
          {STATS_DATA.map((s, i) => (
            <div key={i} className="px-8 first:pl-0 last:pr-0">
              <p
                ref={el => { statValRefs.current[i] = el }}
                className="font-bold text-3xl text-white mb-1"
                style={{ fontFamily: 'Outfit' }}
              >
                {s.formatThousand ? '0+' : s.decimals > 0 ? '0.0%' : '0'}
              </p>
              <p className="text-white/70 text-sm font-medium">{s.label}</p>
              <p className="text-white/30 text-xs mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Funcionalidades (Carrusel Marquee Infinito de Cards) ─────────────── */}
      <section id="funcionalidades" className="py-28 overflow-hidden relative" style={{ background: '#080f0e' }}>
        {/* Encabezado centrado */}
        <div className="max-w-4xl mx-auto px-6 text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.18em] mb-3"
            style={{ color: '#1E8C82', fontFamily: 'Outfit' }}>
            Funcionalidades
          </p>
          <h2 className="text-white font-bold leading-tight mb-4"
            style={{ fontFamily: 'Outfit', fontSize: 'clamp(1.9rem, 3.5vw, 2.7rem)' }}>
            Todo lo que necesita<br />
            <span style={{ color: '#5FC9BE' }}>tu clínica</span> — en uno.
          </h2>
          <p className="text-white/45 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
            Cada módulo fue diseñado desde flujos clínicos reales, probado con odontólogos en ejercicio y construido para usarse con el paciente presente.
          </p>
        </div>

        {/* Contenedor del Carrusel Infinito */}
        <div
          ref={marqueeContainerRef}
          className="relative w-full overflow-hidden select-none py-4"
          onMouseEnter={handleMarqueeMouseEnter}
          onMouseLeave={handleMarqueeMouseLeave}
          onPointerDown={handleMarqueePointerDown}
          onPointerMove={handleMarqueePointerMove}
          onPointerUp={handleMarqueePointerUp}
          onPointerCancel={handleMarqueePointerUp}
          style={{ touchAction: 'pan-y' }}
        >
          {/* Gradient Masks (fades de difuminado lateral sin bordes duros) */}
          <div
            className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 md:w-40 z-20 pointer-events-none"
            style={{ background: 'linear-gradient(to right, #080f0e 15%, transparent 100%)' }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 md:w-40 z-20 pointer-events-none"
            style={{ background: 'linear-gradient(to left, #080f0e 15%, transparent 100%)' }}
          />

          {/* Track con doble conjunto de cards para loop infinito continuo perfecto */}
          <div
            ref={marqueeTrackRef}
            className="flex gap-6 w-max cursor-grab active:cursor-grabbing px-6"
            style={{ willChange: 'transform' }}
          >
            {[...FEATURES, ...FEATURES].map((f, idx) => (
              <div
                key={`${f.title}-${idx}`}
                className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl border border-white/10 bg-[#0c1d1a]/95 hover:bg-[#0f2724] hover:border-[#5FC9BE]/60 transition-all duration-300 hover:shadow-[0_12px_35px_-10px_rgba(95,201,190,0.25)] hover:-translate-y-1.5 w-[310px] sm:w-[350px] md:w-[380px] min-h-[220px] shrink-0"
              >
                {/* Glow decorativo sutil en hover */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at 50% 0%, rgba(95,201,190,0.12), transparent 70%)',
                  }}
                />

                <div>
                  {/* Fila superior: Icono + Tag */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-[#5FC9BE]/25 shadow-sm group-hover:scale-105 transition-transform duration-300"
                      style={{
                        background: 'rgba(30,140,130,0.2)',
                      }}
                    >
                      {f.icon}
                    </div>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full border border-[#5FC9BE]/30 bg-[#5FC9BE]/10 text-[#5FC9BE] group-hover:bg-[#5FC9BE]/20 transition-colors"
                      style={{ fontFamily: 'Outfit' }}
                    >
                      {f.tag}
                    </span>
                  </div>

                  {/* Título de la card */}
                  <h3
                    className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-[#5FC9BE] transition-colors"
                    style={{ fontFamily: 'Outfit' }}
                  >
                    {f.title}
                  </h3>

                  {/* Descripción nítida y legible */}
                  <p
                    className="text-xs md:text-sm text-white/60 leading-relaxed"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {f.desc}
                  </p>
                </div>

                {/* Fila inferior */}
                <div className="mt-5 pt-3 border-t border-white/8 flex items-center justify-between">
                  <span className="text-[11px] text-white/30 font-mono">
                    0{(idx % FEATURES.length) + 1} / 0{FEATURES.length}
                  </span>
                  <div
                    className="flex items-center gap-1.5 text-[11px] text-[#5FC9BE] opacity-70 group-hover:opacity-100 transition-opacity font-medium"
                    style={{ fontFamily: 'Outfit' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5FC9BE] animate-pulse" />
                    <span>Módulo Pro</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Indicador sutil de interacción */}
        <div className="mt-8 flex items-center justify-center gap-2 text-white/30 text-xs" style={{ fontFamily: 'Outfit' }}>
          <span>←</span>
          <span>Desplazamiento automático continuo · Pasa el cursor para pausar o arrastra</span>
          <span>→</span>
        </div>
      </section>

      {/* ── Soluciones por rol ────────────────────────────────────────────────── */}
      <section id="roles" className="py-28" style={{ background: '#0a1715' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.18em] mb-3"
              style={{ color: '#1E8C82', fontFamily: 'Outfit' }}>
              Soluciones por rol
            </p>
            <h2 className="text-white font-bold mb-4"
              style={{ fontFamily: 'Outfit', fontSize: 'clamp(1.8rem, 3vw, 2.6rem)' }}>
              Una plataforma,<br />cuatro experiencias.
            </h2>
            <p className="text-white/40 text-sm max-w-md mx-auto leading-relaxed">
              Cada usuario ve exactamente lo que necesita. Datos clínicos protegidos por rol y auditoría completa de accesos.
            </p>
          </div>

          {/* Role tabs */}
          <div className="flex gap-2 justify-center mb-10 flex-wrap">
            {ROLES.map((r, i) => (
              <button key={r.key} onClick={() => setActiveRole(i)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  fontFamily: 'Outfit',
                  backgroundColor: activeRole === i ? r.accent + '20' : 'rgba(255,255,255,0.04)',
                  color: activeRole === i ? r.accent : 'rgba(255,255,255,0.45)',
                  border: `1px solid ${activeRole === i ? r.accent + '40' : 'rgba(255,255,255,0.07)'}`,
                }}>
                <span>{r.icon}</span>
                {r.title}
              </button>
            ))}
          </div>

          {/* Role detail panel */}
          {(() => {
            const r = ROLES[activeRole]
            return (
              <div
                ref={rolePanelRef}
                className="rounded-3xl border border-white/8 p-8 grid grid-cols-2 gap-10 items-center"
                style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))` }}>
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="role-icon-box w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ background: r.accent + '20' }}>
                      {r.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-white text-xl font-bold" style={{ fontFamily: 'Outfit' }}>{r.title}</h3>
                        <span className="role-badge-pill text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: r.accent + '25', color: r.accent, fontFamily: 'Outfit' }}>
                          {r.badge}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="role-desc-text text-white/55 text-sm leading-relaxed mb-6">{r.desc}</p>
                  <button onClick={() => onNavigate('/login')}
                    className="role-cta-btn px-5 py-2.5 text-sm font-semibold rounded-xl transition-all"
                    style={{ backgroundColor: r.accent, color: '#fff', fontFamily: 'Outfit' }}>
                    Probar como {r.title} →
                  </button>
                </div>

                <div>
                  <p className="text-white/30 text-xs uppercase tracking-widest mb-4" style={{ fontFamily: 'Outfit' }}>Módulos disponibles</p>
                  <div className="space-y-2.5">
                    {r.modules.map(m => (
                      <div key={m} className="role-module-item flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: r.accent + '20' }}>
                          <svg className="w-2.5 h-2.5" fill="none" stroke={r.accent} viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                        </div>
                        <span className="text-white/70 text-sm">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </section>

      {/* ── Seguridad y Beneficios ────────────────────────────────────────────── */}
      <section id="seguridad" className="py-28 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.18em] mb-3"
            style={{ color: '#1E8C82', fontFamily: 'Outfit' }}>
            Seguridad y cumplimiento
          </p>
          <h2 className="text-white font-bold mb-4"
            style={{ fontFamily: 'Outfit', fontSize: 'clamp(1.8rem, 3vw, 2.6rem)' }}>
            Datos clínicos protegidos<br />al más alto nivel.
          </h2>
          <p className="text-white/40 text-sm max-w-md mx-auto leading-relaxed">
            La información de tus pacientes es confidencial y sensible. Diseñamos cada capa de CORONYX con seguridad de primera clase.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {SECURITY.map((s, i) => (
            <div key={i}
              className="p-6 rounded-2xl border border-white/6 hover:border-white/12 transition-all"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4"
                style={{ background: 'rgba(30,140,130,0.12)' }}>
                {s.icon}
              </div>
              <h3 className="text-white font-semibold text-sm mb-2" style={{ fontFamily: 'Outfit' }}>{s.title}</h3>
              <p className="text-white/40 text-xs leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Compliance strip */}
        <div className="mt-10 flex items-center justify-center gap-8 py-6 border-y border-white/6">
          {['HIPAA', 'ISO 27001', 'SOC 2 Type II', 'Ley 1581 CO', 'GDPR Ready'].map(c => (
            <div key={c} className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              <span className="text-white/50 text-xs font-medium" style={{ fontFamily: 'Outfit' }}>{c}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Planes y Precios ─────────────────────────────────────────────────── */}
      <section id="planes" className="py-28" style={{ background: '#0a1715' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.18em] mb-3"
              style={{ color: '#1E8C82', fontFamily: 'Outfit' }}>Planes y precios</p>
            <h2 className="text-white font-bold mb-4"
              style={{ fontFamily: 'Outfit', fontSize: 'clamp(1.8rem, 3vw, 2.6rem)' }}>
              El plan adecuado<br />para tu consultorio.
            </h2>
            <p className="text-white/40 text-sm max-w-md mx-auto leading-relaxed">
              Sin contratos de permanencia. Cambia o cancela cuando quieras. 14 días gratis en todos los planes.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 items-start">
            {PLANS.map(plan => (
              <div key={plan.id}
                className={`relative rounded-3xl p-7 flex flex-col transition-all ${plan.highlight ? 'shadow-2xl ring-2' : 'border border-white/8'}`}
                style={{
                  background: plan.highlight
                    ? `linear-gradient(135deg, ${plan.color}18, ${plan.color}08)`
                    : 'rgba(255,255,255,0.02)',
                  ...(plan.highlight ? { ringColor: plan.color } : {}),
                  ...(plan.highlight ? { border: `2px solid ${plan.color}50` } : {}),
                }}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full text-white"
                      style={{ backgroundColor: plan.color, fontFamily: 'Outfit' }}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <p className="text-white font-bold text-xl mb-0.5" style={{ fontFamily: 'Outfit' }}>{plan.name}</p>
                  <p className="text-white/40 text-xs">{plan.subtitle}</p>
                </div>

                <div className="mb-6">
                  {plan.price > 0 ? (
                    <>
                      <span className="text-white font-bold text-3xl" style={{ fontFamily: 'Outfit' }}>
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(plan.price)}
                      </span>
                      <span className="text-white/40 text-sm">{plan.priceNote}</span>
                    </>
                  ) : (
                    <span className="text-white font-bold text-2xl" style={{ fontFamily: 'Outfit', color: plan.color }}>
                      {plan.priceNote}
                    </span>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-xs">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: plan.color + '25' }}>
                        <svg className="w-2.5 h-2.5" fill="none" stroke={plan.color} viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                      <span className="text-white/70 leading-relaxed">{f}</span>
                    </li>
                  ))}
                  {plan.missing.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-xs opacity-30">
                      <div className="w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </div>
                      <span className="text-white/30">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    fontFamily: 'Outfit',
                    backgroundColor: plan.highlight ? plan.color : 'transparent',
                    color: plan.highlight ? '#fff' : plan.color,
                    border: plan.highlight ? 'none' : `1.5px solid ${plan.color}50`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
                  {plan.cta} →
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-white/25 text-xs mt-8" style={{ fontFamily: 'Outfit' }}>
            Todos los precios en COP + IVA. Sin tarjeta de crédito para el período de prueba.
          </p>
        </div>
      </section>

      {/* ── Contacto ──────────────────────────────────────────────────────────── */}
      <section id="contacto" className="py-28 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 gap-16 items-start">
          {/* Left — info */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] mb-3"
              style={{ color: '#1E8C82', fontFamily: 'Outfit' }}>Contacto</p>
            <h2 className="text-white font-bold mb-5 leading-tight"
              style={{ fontFamily: 'Outfit', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)' }}>
              Hablemos sobre<br />tu clínica.
            </h2>
            <p className="text-white/45 text-sm leading-relaxed mb-10">
              Nuestro equipo de especialistas en tecnología dental está disponible para acompañarte en la implementación, resolver dudas y personalizar el plan adecuado para ti.
            </p>

            <div className="space-y-5">
              {[
                { icon: '📧', label: 'Email institucional', value: 'hola@coronyx.io', sub: 'Respuesta en menos de 24 h' },
                { icon: '💬', label: 'WhatsApp soporte',    value: '+57 601 456 7890',  sub: 'L-V de 8:00 a 18:00' },
                { icon: '📍', label: 'Oficina',             value: 'Bogotá, Colombia',  sub: 'Cra. 15 # 93-47 Of. 301' },
                { icon: '🌐', label: 'Plataforma web',      value: 'app.coronyx.io',    sub: 'Acceso 24/7' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: 'rgba(30,140,130,0.12)' }}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-white/40 text-xs font-medium mb-0.5">{item.label}</p>
                    <p className="text-white text-sm font-semibold">{item.value}</p>
                    <p className="text-white/30 text-xs">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust strip */}
            <div className="mt-10 flex items-center gap-4 pt-8 border-t border-white/6">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              </div>
              <p className="text-white/40 text-xs leading-relaxed">
                Tus datos están protegidos bajo la <span className="text-white/60">Ley 1581 de Colombia</span> y nuestras políticas de privacidad HIPAA-compliant.
              </p>
            </div>
          </div>

          {/* Right — form */}
          <ContactForm />
        </div>
      </section>

      {/* ── CTA Final ────────────────────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0B3D3A 0%, #0d2e2b 60%, #051a18 100%)' }}>
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, #5FC9BE 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 border border-white/15 text-xs font-medium px-3 py-1.5 rounded-full mb-8"
            style={{ backgroundColor: 'rgba(94,201,190,0.08)', color: '#5FC9BE', fontFamily: 'Outfit' }}>
            Sin tarjeta de crédito · Plan Starter gratis por 14 días
          </div>
          <h2 className="text-white font-bold mb-5"
            style={{ fontFamily: 'Outfit', fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', lineHeight: 1.1 }}>
            Moderniza tu clínica<br />con inteligencia artificial.
          </h2>
          <p className="text-white/50 text-sm mb-10 leading-relaxed">
            Más de 6 clínicas en Colombia ya gestionan su agenda, historia clínica y facturación en CORONYX. Únete hoy.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => onNavigate('/login')}
              className="px-8 py-4 text-white font-semibold text-sm rounded-xl shadow-xl transition-all"
              style={{ backgroundColor: '#1E8C82', fontFamily: 'Outfit' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#15635d')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1E8C82')}>
              Ingresar a la plataforma →
            </button>
            <a href="#funcionalidades"
              className="px-8 py-4 text-sm font-medium rounded-xl border border-white/20 text-white/60 hover:text-white hover:border-white/30 transition-all"
              style={{ fontFamily: 'Outfit' }}>
              Ver demo
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/6" style={{ background: '#040e0d' }}>
        <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img src={coronixLogo} alt="CORONYX" className="w-10 h-10 object-contain shrink-0"/>
              <div>
                <p className="text-white font-bold text-sm tracking-wide" style={{ fontFamily: 'Outfit' }}>CORONYX</p>
                <p className="text-[10px]" style={{ color: '#5FC9BE' }}>Sistema Dental</p>
              </div>
            </div>
            <p className="text-white/30 text-xs leading-relaxed">
              Plataforma SaaS de gestión odontológica con inteligencia artificial para clínicas modernas.
            </p>
          </div>

          {/* Plataforma */}
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4" style={{ fontFamily: 'Outfit' }}>Plataforma</p>
            {['Funcionalidades', 'Precios', 'Seguridad', 'Integraciones', 'API'].map(l => (
              <p key={l} className="text-white/30 text-xs mb-2 hover:text-white/60 transition-colors cursor-pointer">{l}</p>
            ))}
          </div>

          {/* Soluciones */}
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4" style={{ fontFamily: 'Outfit' }}>Soluciones</p>
            {['Para odontólogos', 'Para clínicas', 'Multi-sede', 'Pacientes', 'Telemedicina'].map(l => (
              <p key={l} className="text-white/30 text-xs mb-2 hover:text-white/60 transition-colors cursor-pointer">{l}</p>
            ))}
          </div>

          {/* Soporte */}
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4" style={{ fontFamily: 'Outfit' }}>Soporte</p>
            {['Documentación', 'Estado del sistema', 'Contacto', 'Política de privacidad', 'Términos'].map(l => (
              <p key={l} className="text-white/30 text-xs mb-2 hover:text-white/60 transition-colors cursor-pointer">{l}</p>
            ))}
          </div>
        </div>

        <div className="border-t border-white/5 py-5">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
            <p className="text-white/20 text-xs">© 2026 CORONYX · Todos los derechos reservados</p>
            <p className="text-white/15 text-xs">Colombia · Bogotá · v2.0 Enterprise</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
