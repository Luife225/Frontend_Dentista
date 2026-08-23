import { useState } from 'react'
import CoroNyxLogo from './CoroNyxLogo'

function SvgIcon({ d, className = 'w-4 h-4' }: { d: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  )
}

type PatientView = 'inicio' | 'agenda' | 'pagos' | 'tratamientos' | 'teleodontologia' | 'documentos' | 'perfil'

const PAT_NAV = [
  { id: 'inicio' as PatientView, label: 'Inicio', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'agenda' as PatientView, label: 'Mi agenda', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'pagos' as PatientView, label: 'Pagos', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { id: 'tratamientos' as PatientView, label: 'Mis tratamientos', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { id: 'teleodontologia' as PatientView, label: 'Videollamada', icon: 'M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { id: 'documentos' as PatientView, label: 'Documentos', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { id: 'perfil' as PatientView, label: 'Mi perfil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
]

interface CitaItem {
  id: number
  fecha: string
  hora: string
  tipo: string
  dr: string
  virtual: boolean
  estado?: string
}

const initialProximas: CitaItem[] = [
  { id: 1, fecha: '25 ago 2026', hora: '10:30 AM', tipo: 'Control ortodoncia', dr: 'Dra. María Herrera', virtual: false, estado: 'confirmada' },
  { id: 2, fecha: '10 sep 2026', hora: '09:00 AM', tipo: 'Limpieza dental', dr: 'Dr. Carlos Morales', virtual: false, estado: 'pendiente' },
  { id: 3, fecha: '22 sep 2026', hora: '03:00 PM', tipo: 'Consulta virtual de seguimiento', dr: 'Dra. María Herrera', virtual: true, estado: 'pendiente' },
]

const historialCitas: CitaItem[] = [
  { id: 4, fecha: '10 jul 2026', hora: '10:00 AM', tipo: 'Control mensual ortodoncia', dr: 'Dra. María Herrera', virtual: false },
  { id: 5, fecha: '15 jun 2026', hora: '11:30 AM', tipo: 'Radiografías panorámicas', dr: 'Dr. Carlos Morales', virtual: false },
  { id: 6, fecha: '01 may 2026', hora: '09:00 AM', tipo: 'Primera consulta y valoración', dr: 'Dra. María Herrera', virtual: false },
]

// ─── Sub-views ────────────────────────────────────────────────────────────────

function PaInicio({
  onNav,
  onOpenModal,
}: {
  onNav: (v: PatientView) => void
  onOpenModal: (virtual?: boolean) => void
}) {
  const proximaCita = { fecha: 'Lunes 25 de agosto, 2026', hora: '10:30 AM', tipo: 'Control de ortodoncia', dr: 'Dra. María Herrera', sala: 'Consultorio 2', virtual: false }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>Bienvenido, Carlos 👋</h2>
        <p className="text-slate-400 mt-1">Aquí está el resumen de tu atención en Clínica Herrera &amp; Asociados</p>
      </div>

      {/* Layout 2 columnas en desktop */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Próxima cita — ocupa 2 columnas */}
        <div className="lg:col-span-2 bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-6 text-white shadow-md">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-teal-200 text-xs font-semibold uppercase tracking-wide mb-1">Próxima cita</p>
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Outfit' }}>{proximaCita.tipo}</h3>
              <p className="text-teal-200 text-sm mt-1">{proximaCita.dr} · {proximaCita.sala}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">📅</div>
          </div>
          <div className="flex items-center gap-4 mb-5">
            <div className="bg-white/15 rounded-xl px-4 py-2.5 text-center">
              <p className="text-teal-100 text-xs">Fecha</p>
              <p className="text-white font-semibold text-sm mt-0.5">{proximaCita.fecha}</p>
            </div>
            <div className="bg-white/15 rounded-xl px-4 py-2.5 text-center">
              <p className="text-teal-100 text-xs">Hora</p>
              <p className="text-white font-semibold text-sm mt-0.5">{proximaCita.hora}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => onNav('agenda')}
              className="flex-1 py-2.5 bg-white text-teal-800 rounded-xl text-sm font-bold hover:bg-teal-50 transition-colors shadow-sm">
              Ver detalle
            </button>
            <button
              onClick={() => onOpenModal(false)}
              className="flex-1 py-2.5 bg-white/20 text-white rounded-xl text-sm font-semibold hover:bg-white/30 transition-colors">
              Reprogramar
            </button>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="space-y-3">
          {[
            { label: 'Pagar tratamiento', icon: '💳', view: 'pagos' as PatientView, color: '#1E8C82' },
            { label: 'Ver mis avances', icon: '📊', view: 'tratamientos' as PatientView, color: '#2BA89D' },
            { label: 'Unirme a videollamada', icon: '📹', view: 'teleodontologia' as PatientView, color: '#0B3D3A' },
          ].map(a => (
            <button key={a.label} onClick={() => onNav(a.view)}
              className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all text-left group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${a.color}15` }}>{a.icon}</div>
              <span className="text-sm font-semibold text-slate-700 group-hover:text-teal-700 transition-colors">{a.label}</span>
              <SvgIcon d="M9 5l7 7-7 7" className="w-4 h-4 text-slate-300 group-hover:text-teal-500 ml-auto transition-colors"/>
            </button>
          ))}
        </div>
      </div>

      {/* Resumen estado */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Tratamientos activos', val: '2', icon: '🦷', color: '#1E8C82' },
          { label: 'Pagos pendientes', val: '$120.000', icon: '💰', color: '#f59e0b' },
          { label: 'Documentos disponibles', val: '3', icon: '📄', color: '#2BA89D' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-2xl mb-2">{s.icon}</p>
            <p className="text-xl font-bold" style={{ fontFamily: 'Outfit', color: s.color }}>{s.val}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PaAgenda({
  citasList,
  onOpenModal,
}: {
  citasList: CitaItem[]
  onOpenModal: (virtual?: boolean) => void
}) {
  const [activeTab, setActiveTab] = useState<'proximas' | 'historial'>('proximas')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>Mi agenda de citas</h2>
          <p className="text-slate-400 text-sm">Gestiona tus consultas presenciales y virtuales con tu odontólogo</p>
        </div>
        <button
          onClick={() => onOpenModal(false)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all"
          style={{ background: 'linear-gradient(135deg, #1E8C82, #0B3D3A)' }}>
          <SvgIcon d="M12 4v16m8-8H4"/>
          Solicitar cita
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {[{ v: 'proximas', l: `Próximas (${citasList.length})` }, { v: 'historial', l: `Historial (${historialCitas.length})` }].map(t => (
          <button key={t.v} onClick={() => setActiveTab(t.v as typeof activeTab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === t.v ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}>
            {t.l}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(activeTab === 'proximas' ? citasList : historialCitas).map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:border-teal-200 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${c.virtual ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-teal-50 text-teal-700 border-teal-200'}`}>
                  {c.virtual ? '📹 Virtual' : '🏥 Presencial'}
                </div>
                {'estado' in c && (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${c.estado === 'confirmada' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {c.estado === 'confirmada' ? '✓ Confirmada' : 'Pendiente'}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1" style={{ fontFamily: 'Outfit' }}>{c.tipo}</h3>
              <p className="text-teal-700 text-xs font-semibold mb-3">{c.dr}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>📅 {c.fecha}</span>
                <span>🕐 {c.hora}</span>
              </div>
            </div>

            {activeTab === 'proximas' && (
              <div className="flex gap-2 mt-5 pt-3 border-t border-slate-50">
                {c.virtual ? (
                  <button
                    onClick={() => onOpenModal(true)}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl text-white shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #1E8C82, #0B3D3A)' }}>
                    Unirme ahora
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenModal(false)}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 transition-colors">
                    Reprogramar
                  </button>
                )}
                <button className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function PaPagos() {
  const [tab, setTab] = useState<'pendientes' | 'historial'>('pendientes')

  const pendientes = [
    { id: 1, concepto: 'Ortodoncia — cuota 6 de 18', monto: '$120.000', vence: '31 ago 2026', estado: 'Pendiente' },
    { id: 2, concepto: 'Limpieza dental (próxima cita)', monto: '$85.000', vence: '10 sep 2026', estado: 'Por vencer' },
  ]
  const historial = [
    { id: 3, concepto: 'Ortodoncia — cuota 5 de 18', monto: '$120.000', fecha: '31 jul 2026', metodo: 'Tarjeta débito' },
    { id: 4, concepto: 'Radiografías panorámicas', monto: '$95.000', fecha: '15 jun 2026', metodo: 'Transferencia' },
    { id: 5, concepto: 'Primera consulta y valoración', monto: '$80.000', fecha: '01 may 2026', metodo: 'Efectivo' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>Pagos y Facturación</h2>
        <p className="text-slate-400 text-sm">Estado de tus cuotas, tratamientos y comprobantes de pago</p>
      </div>

      {/* Resumen layout 2 cols */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-5 text-white shadow-md">
          <p className="text-teal-200 text-xs font-semibold uppercase tracking-wide mb-1">Total pendiente</p>
          <p className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }}>$205.000</p>
          <p className="text-teal-200 text-sm mt-1">2 cuotas pendientes de pago</p>
          <button className="mt-4 w-full py-2.5 bg-white text-teal-800 rounded-xl text-sm font-bold hover:bg-teal-50 transition-colors shadow-sm">
            Pagar ahora en línea (PSE / Tarjeta)
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">Plan de pagos activo</p>
          <p className="text-slate-800 font-semibold text-sm mt-2">Ortodoncia — Plan 18 meses</p>
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Progreso</span><span className="font-semibold">6 de 18 cuotas</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: '33%', background: 'linear-gradient(90deg, #1E8C82, #5FC9BE)' }}/>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Pagado: $720.000</span><span>Restante: $1.440.000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {[{ v: 'pendientes', l: 'Pendientes' }, { v: 'historial', l: 'Historial de pagos' }].map(t => (
          <button key={t.v} onClick={() => setTab(t.v as typeof tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t.v ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}>
            {t.l}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {tab === 'pendientes'
                ? ['Concepto', 'Monto', 'Vence', 'Estado', 'Acción'].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>)
                : ['Concepto', 'Monto', 'Fecha', 'Método'].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>)
              }
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tab === 'pendientes'
              ? pendientes.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-4 text-slate-700 font-medium text-[13px]">{p.concepto}</td>
                  <td className="px-5 py-4 font-bold text-teal-700 text-[13px]">{p.monto}</td>
                  <td className="px-5 py-4 text-slate-400 text-[12px]">{p.vence}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${p.estado === 'Pendiente' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{p.estado}</span>
                  </td>
                  <td className="px-5 py-4">
                    <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: 'linear-gradient(135deg, #1E8C82, #0B3D3A)' }}>
                      Pagar
                    </button>
                  </td>
                </tr>
              ))
              : historial.map(h => (
                <tr key={h.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-4 text-slate-700 font-medium text-[13px]">{h.concepto}</td>
                  <td className="px-5 py-4 font-bold text-teal-700 text-[13px]">{h.monto}</td>
                  <td className="px-5 py-4 text-slate-400 text-[12px]">{h.fecha}</td>
                  <td className="px-5 py-4">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">✓ {h.metodo}</span>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PaTratamientos() {
  const tratamientos = [
    {
      id: 1, nombre: 'Ortodoncia metálica', inicio: 'may 2026', estimadoFin: 'nov 2027', progreso: 33,
      estado: 'En curso', descripcion: 'Corrección del alineamiento dental y corrección de mordida.',
      pasos: ['Instalación de brackets ✓', 'Ajuste mensual (6/18 completados)', 'Retención final'],
    },
    {
      id: 2, nombre: 'Profilaxis dental', inicio: 'ago 2026', estimadoFin: 'sep 2026', progreso: 0,
      estado: 'Próximamente', descripcion: 'Limpieza profunda y pulido coronal.',
      pasos: ['Evaluación inicial', 'Limpieza ultrasónica', 'Flúor protector'],
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>Mis tratamientos</h2>
        <p className="text-slate-400 text-sm">Seguimiento simplificado del avance de tus tratamientos</p>
      </div>

      {/* 2-column layout on desktop */}
      <div className="grid md:grid-cols-2 gap-5">
        {tratamientos.map(t => (
          <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>{t.nombre}</h3>
                <p className="text-teal-600 text-xs mt-0.5">Inicio: {t.inicio} · Fin estimado: {t.estimadoFin}</p>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${t.estado === 'En curso' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                {t.estado}
              </span>
            </div>

            <p className="text-slate-500 text-sm leading-relaxed mb-4">{t.descripcion}</p>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Progreso general</span>
                <span className="font-semibold" style={{ color: '#1E8C82' }}>{t.progreso}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${t.progreso}%`, background: 'linear-gradient(90deg, #1E8C82, #5FC9BE)' }}/>
              </div>
            </div>

            {/* Pasos */}
            <div className="space-y-2">
              {t.pasos.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${p.includes('✓') ? 'bg-emerald-100 text-emerald-600' : i === 1 && t.estado === 'En curso' ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
                    {p.includes('✓') ? '✓' : i + 1}
                  </div>
                  <span className={p.includes('✓') ? 'text-slate-400 line-through' : 'text-slate-600'}>{p.replace(' ✓', '')}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Info card */}
      <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5 flex gap-4 items-start">
        <span className="text-2xl">💡</span>
        <div>
          <p className="text-teal-800 font-semibold text-sm">¿Tienes dudas sobre tu tratamiento?</p>
          <p className="text-teal-600 text-xs mt-1">Puedes solicitar una consulta virtual con tu odontólogo o escribir al chat de soporte de la clínica.</p>
        </div>
      </div>
    </div>
  )
}

function PaTeleodontologia({
  onOpenModal,
}: {
  onOpenModal: (virtual?: boolean) => void
}) {
  const [sala, setSala] = useState<'espera' | 'activa'>('espera')

  if (sala === 'activa') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>Videollamada activa</h2>
          <button onClick={() => setSala('espera')}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors">
            <SvgIcon d="M6 18L18 6M6 6l12 12"/>
            Finalizar llamada
          </button>
        </div>

        {/* Video room mockup */}
        <div className="bg-slate-900 rounded-2xl aspect-video relative overflow-hidden max-h-[500px]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl"
                style={{ background: 'linear-gradient(135deg, #1E8C82, #0B3D3A)' }}>👩‍⚕️</div>
              <p className="font-semibold text-lg" style={{ fontFamily: 'Outfit' }}>Dra. María Herrera</p>
              <p className="text-slate-400 text-sm">Conectando cámara y micrófono...</p>
            </div>
          </div>
          {/* Self view */}
          <div className="absolute bottom-4 right-4 w-28 h-20 bg-slate-700 rounded-xl border-2 border-white/20 flex items-center justify-center text-slate-400 text-xs">
            Tu cámara
          </div>
          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
            {[
              { icon: '🎤', label: 'Mic' },
              { icon: '📹', label: 'Cámara' },
              { icon: '💬', label: 'Chat' },
            ].map(c => (
              <button key={c.label} className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-lg transition-colors" title={c.label}>
                {c.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>Teleodontología</h2>
        <p className="text-slate-400 text-sm">Consultas virtuales con tu odontólogo tratante</p>
      </div>

      {/* Sala de espera */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-teal-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-emerald-700 text-xs font-semibold">Sala de espera activa</span>
          </div>
          <h3 className="font-bold text-slate-800 mb-1" style={{ fontFamily: 'Outfit' }}>Consulta virtual · 22 sep 2026</h3>
          <p className="text-slate-400 text-sm mb-4">Dra. María Herrera · 03:00 PM</p>
          <div className="bg-teal-50 rounded-xl p-3 mb-4 text-xs text-teal-700">
            📢 La doctora se conectará en breve. Por favor, verifica tu cámara y micrófono antes de ingresar.
          </div>
          <button onClick={() => setSala('activa')}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1E8C82, #0B3D3A)' }}>
            <span className="text-lg">📹</span>
            Ingresar a la videollamada
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-700 text-sm" style={{ fontFamily: 'Outfit' }}>Verificación técnica previa</h3>
          {[
            { label: 'Cámara HD detectada', ok: true },
            { label: 'Micrófono con cancelación detectado', ok: true },
            { label: 'Conexión a internet estable', ok: true },
            { label: 'Sala de espera activa', ok: true },
          ].map(v => (
            <div key={v.label} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${v.ok ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {v.ok ? '✓' : '!'}
              </div>
              <span className="text-sm text-slate-600">{v.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-800 mb-1">¿Necesitas una consulta virtual adicional?</p>
          <p className="text-xs text-slate-500">Programa una sesión de orientación o revisión con tu odontólogo sin salir de casa.</p>
        </div>
        <button
          onClick={() => onOpenModal(true)}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl text-white shadow-sm hover:opacity-90 transition-colors"
          style={{ background: 'linear-gradient(135deg, #1E8C82, #0B3D3A)' }}>
          <SvgIcon d="M12 4v16m8-8H4"/>
          Solicitar consulta virtual
        </button>
      </div>
    </div>
  )
}

function PaDocumentos() {
  const docs = [
    { nombre: 'Consentimiento informado — Ortodoncia.pdf', tipo: 'PDF', fecha: '01 may 2026', size: '245 KB' },
    { nombre: 'Radiografía panorámica inicial.jpg', tipo: 'Imagen', fecha: '15 jun 2026', size: '1.2 MB' },
    { nombre: 'Presupuesto tratamiento ortodoncia.pdf', tipo: 'PDF', fecha: '01 may 2026', size: '98 KB' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>Documentos y Radiografías</h2>
        <p className="text-slate-400 text-sm">Archivos, consentimientos y radiografías compartidos por tu clínica</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400 font-medium">{docs.length} documentos disponibles</p>
        </div>
        <div className="divide-y divide-slate-50">
          {docs.map(d => (
            <div key={d.nombre} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: d.tipo === 'PDF' ? '#fef2f215' : '#eff6ff15', border: '1px solid', borderColor: d.tipo === 'PDF' ? '#fecaca' : '#bfdbfe' }}>
                {d.tipo === 'PDF' ? '📄' : '🖼️'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-700 font-medium text-sm truncate">{d.nombre}</p>
                <p className="text-slate-400 text-xs mt-0.5">{d.tipo} · {d.size} · Subido {d.fecha}</p>
              </div>
              <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-teal-200 text-teal-700 hover:bg-teal-50 transition-colors shrink-0">
                <SvgIcon d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="w-3.5 h-3.5"/>
                Descargar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PaPerfil() {
  const [form, setForm] = useState({
    nombre: 'Carlos Rivas', email: 'carlos.rivas@gmail.com', telefono: '+57 300 123 4567',
    fechaNac: '1990-03-15', ciudad: 'Medellín', eps: 'Sura EPS',
  })
  const [saved, setSaved] = useState(false)

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>Mi perfil de paciente</h2>
        <p className="text-slate-400 text-sm">Datos personales y configuración de tu cuenta</p>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0"
          style={{ background: 'linear-gradient(135deg, #1E8C82, #0B3D3A)' }}>
          CR
        </div>
        <div>
          <p className="font-bold text-slate-800 text-lg" style={{ fontFamily: 'Outfit' }}>{form.nombre}</p>
          <p className="text-teal-600 text-sm">Paciente · Clínica Herrera &amp; Asociados</p>
          <p className="text-slate-400 text-xs mt-1">Desde mayo 2026</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3" style={{ fontFamily: 'Outfit' }}>Información personal</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { k: 'nombre', l: 'Nombre completo' },
            { k: 'email', l: 'Correo electrónico' },
            { k: 'telefono', l: 'Teléfono' },
            { k: 'fechaNac', l: 'Fecha de nacimiento' },
            { k: 'ciudad', l: 'Ciudad' },
            { k: 'eps', l: 'EPS / Aseguradora' },
          ].map(f => (
            <div key={f.k}>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">{f.l}</label>
              <input value={form[f.k as keyof typeof form]} onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"/>
            </div>
          ))}
        </div>
        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1800) }}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #1E8C82, #0B3D3A)' }}>
          {saved ? '✓ Guardado exitosamente' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

// ─── Root PatientApp ──────────────────────────────────────────────────────────
interface Props { onLogout: () => void }

export default function PatientApp({ onLogout }: Props) {
  const [active, setActive] = useState<PatientView>('inicio')
  const [collapsed, setCollapsed] = useState(false)
  const [citasList, setCitasList] = useState<CitaItem[]>(initialProximas)
  const [showSolicitarModal, setShowSolicitarModal] = useState(false)
  const [modalIsVirtual, setModalIsVirtual] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  // Solicitar cita form state
  const [scDr, setScDr] = useState('Dra. María Herrera (Ortodoncia)')
  const [scType, setScType] = useState('Control de ortodoncia')
  const [scDate, setScDate] = useState('2026-08-30')
  const [scTime, setScTime] = useState('10:00 AM')
  const [scNotes, setScNotes] = useState('')

  function openSolicitarModal(isVirtual = false) {
    setModalIsVirtual(isVirtual)
    if (isVirtual) {
      setScType('Consulta virtual de seguimiento')
    } else {
      setScType('Control de ortodoncia')
    }
    setShowSolicitarModal(true)
  }

  function handleConfirmarSolicitud() {
    const newCita: CitaItem = {
      id: Date.now(),
      fecha: scDate,
      hora: scTime,
      tipo: scType,
      dr: scDr.split(' (')[0],
      virtual: modalIsVirtual,
      estado: 'pendiente',
    }

    setCitasList([newCita, ...citasList])
    setShowSolicitarModal(false)
    setScNotes('')
    setToastMsg(`¡Solicitud enviada! Tu cita de ${scType} para el ${scDate} está registrada.`)
    setTimeout(() => setToastMsg(''), 4500)
  }

  function renderContent() {
    switch (active) {
      case 'inicio': return <PaInicio onNav={v => setActive(v)} onOpenModal={openSolicitarModal} />
      case 'agenda': return <PaAgenda citasList={citasList} onOpenModal={openSolicitarModal} />
      case 'pagos': return <PaPagos/>
      case 'tratamientos': return <PaTratamientos/>
      case 'teleodontologia': return <PaTeleodontologia onOpenModal={openSolicitarModal} />
      case 'documentos': return <PaDocumentos/>
      case 'perfil': return <PaPerfil/>
    }
  }

  const currentNav = PAT_NAV.find(n => n.id === active)

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#0B3D3A] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/40 fade-in">
          <span className="text-emerald-400 font-bold text-xl">✓</span>
          <div>
            <p className="font-semibold text-sm text-white" style={{ fontFamily: 'Outfit' }}>Cita Solicitada</p>
            <p className="text-xs text-emerald-100">{toastMsg}</p>
          </div>
        </div>
      )}

      {/* Sidebar paciente */}
      <aside className={`${collapsed ? 'w-14' : 'w-56'} shrink-0 flex flex-col h-full transition-all duration-200`}
        style={{ backgroundColor: '#0B3D3A' }}>

        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/8 ${collapsed ? 'justify-center' : ''}`}>
          <CoroNyxLogo size={48}/>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold leading-tight tracking-wide" style={{ fontFamily: 'Outfit' }}>CORONYX</p>
              <p className="text-xs font-medium text-emerald-400">Portal del Paciente</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {PAT_NAV.map(item => {
            const isActive = active === item.id
            return (
              <button key={item.id} onClick={() => setActive(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-sm transition-all relative ${isActive ? 'bg-emerald-500/15 text-emerald-400' : 'text-white/45 hover:text-white/80 hover:bg-white/5'} ${collapsed ? 'justify-center' : ''}`}>
                <SvgIcon d={item.icon} className="w-4 h-4 shrink-0"/>
                {!collapsed && <span className="flex-1 text-left font-medium text-[13px]">{item.label}</span>}
                {isActive && !collapsed && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-400 rounded-r"/>}
              </button>
            )
          })}
        </nav>

        {/* User row */}
        <div className={`p-3 border-t border-white/5 flex ${collapsed ? 'justify-center' : 'items-center gap-2'}`}>
          {!collapsed && (
            <>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #10b981, #047857)' }}>
                CR
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-xs font-medium truncate">Carlos Rivas</p>
                <p className="text-emerald-400/60 text-[10px] truncate">Paciente</p>
              </div>
              <button onClick={onLogout} className="text-white/25 hover:text-white/60 transition-colors text-xs" title="Cerrar sesión">⏏</button>
            </>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-white/40 hover:text-white/70 shrink-0">
            <svg className={`w-3 h-3 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-12 bg-white border-b border-slate-100 flex items-center px-5 gap-4 shrink-0">
          <h2 className="text-sm font-semibold text-slate-700" style={{ fontFamily: 'Outfit' }}>{currentNav?.label}</h2>
          <div className="flex-1"/>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Paciente</span>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #10b981, #047857)' }}>
            CR
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {renderContent()}
        </main>
      </div>

      {/* ── Modal: Solicitar Cita Odontológica ── */}
      {showSolicitarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden fade-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>
                  Solicitar Cita Odontológica
                </h2>
                <p className="text-xs text-slate-400">Elige la modalidad, doctor y fecha preferida</p>
              </div>
              <button
                onClick={() => setShowSolicitarModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center text-xl leading-none transition-colors">
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4 flex-1">
              {/* Modalidad Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Modalidad de atención</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalIsVirtual(false)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      !modalIsVirtual ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                    <span>🏥</span> Presencial en clínica
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalIsVirtual(true)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      modalIsVirtual ? 'border-violet-600 bg-violet-50 text-violet-800 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                    <span>📹</span> Teleodontología virtual
                  </button>
                </div>
              </div>

              {/* Profesional */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Odontólogo / Especialista</label>
                <select
                  value={scDr}
                  onChange={e => setScDr(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 bg-white">
                  <option value="Dra. María Herrera (Ortodoncia)">Dra. María Herrera — Ortodoncia & Estética</option>
                  <option value="Dr. Carlos Morales (General)">Dr. Carlos Morales — Odontología General & Profilaxis</option>
                  <option value="Dr. Roberto Patiño (Endodoncia)">Dr. Roberto Patiño — Endodoncia & Cirugía</option>
                </select>
              </div>

              {/* Motivo */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Motivo de la consulta</label>
                <select
                  value={scType}
                  onChange={e => setScType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 bg-white">
                  <option value="Control de ortodoncia">Control mensual de ortodoncia</option>
                  <option value="Limpieza dental">Limpieza dental / Profilaxis</option>
                  <option value="Consulta virtual de seguimiento">Consulta virtual de seguimiento</option>
                  <option value="Dolor o molestia aguda">Dolor, sensibilidad o molestia aguda</option>
                  <option value="Valoración estética">Valoración estética / Blanqueamiento</option>
                  <option value="Otro motivo">Otro procedimiento</option>
                </select>
              </div>

              {/* Fecha y Hora preferida */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Fecha deseada</label>
                  <input
                    type="date"
                    value={scDate}
                    onChange={e => setScDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Horario preferido</label>
                  <select
                    value={scTime}
                    onChange={e => setScTime(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 bg-white">
                    <option value="08:30 AM">08:30 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:30 PM">02:30 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="05:30 PM">05:30 PM</option>
                  </select>
                </div>
              </div>

              {/* Notas para el doctor */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Describe brevemente tus síntomas o comentarios</label>
                <textarea
                  rows={3}
                  value={scNotes}
                  onChange={e => setScNotes(e.target.value)}
                  placeholder="Ej: Siento molestia en el alambre del bracket superior derecho..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowSolicitarModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-100 transition-colors font-medium">
                Cancelar
              </button>
              <button
                onClick={handleConfirmarSolicitud}
                className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #1E8C82, #0B3D3A)' }}>
                Confirmar solicitud de cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
