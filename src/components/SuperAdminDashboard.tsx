import { useState } from 'react'
import CoroNyxLogo from './CoroNyxLogo'

function Icon({ d, className = 'w-4 h-4' }: { d: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────
interface Clinica {
  id: number; nombre: string; plan: string; estado: 'Activa' | 'Suspendida' | 'En prueba' | 'Cancelada'
  admin: string; fecha: string; usuarios: number
}

const CLINICAS_DEMO: Clinica[] = [
  { id: 1, nombre: 'Clínica Herrera & Asociados', plan: 'Pro', estado: 'Activa', admin: 'Diego Herrera', fecha: '2024-01-15', usuarios: 12 },
  { id: 2, nombre: 'Odontología Integral García', plan: 'Starter', estado: 'En prueba', admin: 'Lucía García', fecha: '2026-07-01', usuarios: 3 },
  { id: 3, nombre: 'Centro Dental Moderno', plan: 'Enterprise', estado: 'Activa', admin: 'Roberto Sánchez', fecha: '2023-09-10', usuarios: 28 },
  { id: 4, nombre: 'Clínica Dental del Norte', plan: 'Pro', estado: 'Suspendida', admin: 'Ana Torres', fecha: '2025-03-20', usuarios: 6 },
  { id: 5, nombre: 'Sonrisas Perfectas', plan: 'Starter', estado: 'Cancelada', admin: '—', fecha: '2025-11-01', usuarios: 0 },
]

interface Admin { id: number; nombre: string; email: string; clinica: string; clinicaId: number; activo: boolean; creado: string }

const ADMINS_DEMO: Admin[] = [
  { id: 1, nombre: 'Diego Herrera', email: 'diego@herrera.co', clinica: 'Clínica Herrera & Asociados', clinicaId: 1, activo: true, creado: '2024-01-15' },
  { id: 2, nombre: 'Lucía García', email: 'lucia@integral.co', clinica: 'Odontología Integral García', clinicaId: 2, activo: true, creado: '2026-07-01' },
  { id: 3, nombre: 'Roberto Sánchez', email: 'r.sanchez@cdm.co', clinica: 'Centro Dental Moderno', clinicaId: 3, activo: true, creado: '2023-09-10' },
  { id: 4, nombre: 'Ana Torres', email: 'ana@norte.co', clinica: 'Clínica Dental del Norte', clinicaId: 4, activo: false, creado: '2025-03-20' },
]

const PLANES = [
  { nombre: 'Starter', precio: '$290.000/mes', usuarios: '1-3', funciones: ['Historia clínica', 'Agenda básica', 'Portal paciente'], color: '#64748b' },
  { nombre: 'Pro', precio: '$690.000/mes', usuarios: '4-15', funciones: ['Todo Starter', 'Odontograma digital', 'IA por voz', 'Teleodontología', 'Caja y reportes'], color: '#1E8C82', destacado: true },
  { nombre: 'Enterprise', precio: 'A medida', usuarios: 'Ilimitado', funciones: ['Todo Pro', 'Múltiples sedes', 'SLA garantizado', 'Onboarding dedicado', 'API access'], color: '#0B3D3A' },
]

type SuperView = 'dashboard' | 'clinicas' | 'admins' | 'planes' | 'config' | 'soporte'

const SUPER_NAV: { id: SuperView; label: string; icon: string; group: string }[] = [
  { id: 'dashboard', label: 'Dashboard global', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', group: 'Principal' },
  { id: 'clinicas', label: 'Clínicas / Sedes', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', group: 'Gestión' },
  { id: 'admins', label: 'Administradores', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', group: 'Gestión' },
  { id: 'planes', label: 'Planes y suscripciones', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', group: 'Gestión' },
  { id: 'config', label: 'Configuración global', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', group: 'Sistema' },
  { id: 'soporte', label: 'Soporte / Métricas', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z', group: 'Sistema' },
]

function StatusBadge({ estado }: { estado: Clinica['estado'] }) {
  const map = {
    'Activa': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'En prueba': 'bg-amber-50 text-amber-700 border-amber-200',
    'Suspendida': 'bg-red-50 text-red-700 border-red-200',
    'Cancelada': 'bg-slate-100 text-slate-500 border-slate-200',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${map[estado]}`}>{estado}</span>
}

// ─── Sub-vistas ───────────────────────────────────────────────────────────────

function SADashboard() {
  const kpis = [
    { label: 'Clínicas activas', val: '4', icon: '🏥', sub: '+1 este mes', color: '#1E8C82' },
    { label: 'Usuarios totales', val: '49', icon: '👥', sub: 'en todas las sedes', color: '#2BA89D' },
    { label: 'Suscripciones vigentes', val: '3', icon: '📋', sub: '1 en prueba, 1 vencida', color: '#f59e0b' },
    { label: 'Alertas de soporte', val: '2', icon: '⚠️', sub: 'incidencias abiertas', color: '#ef4444' },
  ]

  const reciente = [
    { accion: 'Nueva clínica registrada', detalle: 'Odontología Integral García', tiempo: 'hace 2h', tipo: 'nueva' },
    { accion: 'Plan cambiado', detalle: 'Centro Dental Moderno → Enterprise', tiempo: 'hace 1d', tipo: 'plan' },
    { accion: 'Admin desactivado', detalle: 'Ana Torres · Clínica del Norte', tiempo: 'hace 3d', tipo: 'alerta' },
    { accion: 'Incidencia resuelta', detalle: 'Error al cargar radiografías', tiempo: 'hace 4d', tipo: 'ok' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-0.5" style={{ fontFamily: 'Outfit' }}>Dashboard global</h2>
        <p className="text-slate-400 text-sm">Vista general de la plataforma CORONYX</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{k.icon}</span>
              <span className="text-xs text-slate-400 text-right leading-tight">{k.sub}</span>
            </div>
            <p className="text-3xl font-bold mb-1" style={{ fontFamily: 'Outfit', color: k.color }}>{k.val}</p>
            <p className="text-xs text-slate-500 font-medium">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Gráfico simple de clínicas */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4" style={{ fontFamily: 'Outfit' }}>Estado de clínicas</h3>
          <div className="space-y-3">
            {[{ l: 'Activas', v: 4, max: 5, c: '#1E8C82' }, { l: 'En prueba', v: 1, max: 5, c: '#f59e0b' }, { l: 'Suspendidas', v: 1, max: 5, c: '#ef4444' }, { l: 'Canceladas', v: 1, max: 5, c: '#94a3b8' }].map(b => (
              <div key={b.l}>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{b.l}</span><span className="font-semibold">{b.v}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(b.v/b.max)*100}%`, background: b.c }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4" style={{ fontFamily: 'Outfit' }}>Actividad reciente</h3>
          <div className="space-y-3">
            {reciente.map(r => (
              <div key={r.detalle} className="flex gap-3 items-start">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${r.tipo === 'alerta' ? 'bg-red-50 text-red-500' : r.tipo === 'nueva' ? 'bg-emerald-50 text-emerald-600' : r.tipo === 'plan' ? 'bg-cyan-50 text-cyan-600' : 'bg-slate-50 text-slate-500'}`}>
                  {r.tipo === 'alerta' ? '⚠' : r.tipo === 'nueva' ? '+' : r.tipo === 'plan' ? '↑' : '✓'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700">{r.accion}</p>
                  <p className="text-xs text-slate-400">{r.detalle}</p>
                </div>
                <span className="text-[10px] text-slate-300 shrink-0">{r.tiempo}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Distribución por plan */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4" style={{ fontFamily: 'Outfit' }}>Distribución por plan</h3>
        <div className="grid grid-cols-3 gap-4">
          {[{ n: 'Starter', c: 2, col: '#64748b' }, { n: 'Pro', c: 2, col: '#1E8C82' }, { n: 'Enterprise', c: 1, col: '#0B3D3A' }].map(p => (
            <div key={p.n} className="text-center py-4 rounded-xl" style={{ background: `${p.col}12`, border: `1px solid ${p.col}30` }}>
              <p className="text-2xl font-bold" style={{ color: p.col, fontFamily: 'Outfit' }}>{p.c}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{p.n}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SAClinicas({ onNueva }: { onNueva: () => void }) {
  const [clinicas, setClinicas] = useState(CLINICAS_DEMO)
  const [modalDesactivar, setModalDesactivar] = useState<Clinica | null>(null)
  const [searchQ, setSearchQ] = useState('')

  const filtered = clinicas.filter(c => c.nombre.toLowerCase().includes(searchQ.toLowerCase()))

  function toggleEstado(id: number) {
    setClinicas(prev => prev.map(c => c.id === id ? { ...c, estado: c.estado === 'Activa' ? 'Suspendida' : 'Activa' } : c))
    setModalDesactivar(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>Clínicas / Sedes</h2>
          <p className="text-slate-400 text-sm">{clinicas.length} clínicas registradas en la plataforma</p>
        </div>
        <button onClick={onNueva}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #1E8C82, #0B3D3A)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Nueva clínica
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
          placeholder="Buscar clínica..."
          className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white w-full"/>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Nombre', 'Plan', 'Estado', 'Admin. principal', 'Usuarios', 'Fecha de alta', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: 'linear-gradient(135deg, #1E8C82, #0B3D3A)' }}>
                        {c.nombre[0]}
                      </div>
                      <span className="font-medium text-slate-800 text-[13px]">{c.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg"
                      style={{ background: c.plan === 'Enterprise' ? '#0B3D3A15' : c.plan === 'Pro' ? '#1E8C8215' : '#64748b15', color: c.plan === 'Enterprise' ? '#0B3D3A' : c.plan === 'Pro' ? '#1E8C82' : '#64748b' }}>
                      {c.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge estado={c.estado}/></td>
                  <td className="px-4 py-3.5 text-slate-600 text-[13px]">{c.admin}</td>
                  <td className="px-4 py-3.5 text-slate-500 text-center">{c.usuarios}</td>
                  <td className="px-4 py-3.5 text-slate-400 text-[12px]">{c.fecha}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all" title="Ver detalle">
                        <Icon d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
                        <Icon d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </button>
                      <button onClick={() => setModalDesactivar(c)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                        title={c.estado === 'Activa' ? 'Desactivar' : 'Reactivar'}>
                        <Icon d={c.estado === 'Activa' ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-sm">No se encontraron clínicas con ese nombre</p>
          </div>
        )}
      </div>

      {/* Modal desactivar/reactivar */}
      {modalDesactivar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 slide-up">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${modalDesactivar.estado === 'Activa' ? 'bg-amber-100' : 'bg-emerald-100'}`}>
              <span className="text-2xl">{modalDesactivar.estado === 'Activa' ? '⚠️' : '✅'}</span>
            </div>
            <h3 className="text-base font-bold text-slate-800 text-center mb-1" style={{ fontFamily: 'Outfit' }}>
              {modalDesactivar.estado === 'Activa' ? 'Desactivar clínica' : 'Reactivar clínica'}
            </h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              {modalDesactivar.estado === 'Activa'
                ? `Se suspenderá el acceso a "${modalDesactivar.nombre}". Los datos se conservarán.`
                : `Se reactivará el acceso a "${modalDesactivar.nombre}".`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalDesactivar(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
              <button onClick={() => toggleEstado(modalDesactivar.id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white ${modalDesactivar.estado === 'Activa' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                {modalDesactivar.estado === 'Activa' ? 'Sí, desactivar' : 'Sí, reactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SANuevaClinica({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({ nombre: '', plan: 'Pro', adminNombre: '', adminEmail: '' })
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => { setSaved(false); onBack() }, 1200)
  }

  return (
    <div className="max-w-xl">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-teal-600 mb-5 transition-colors">
        <Icon d="M15 19l-7-7 7-7"/>
        Volver a clínicas
      </button>
      <h2 className="text-xl font-bold text-slate-800 mb-1" style={{ fontFamily: 'Outfit' }}>Nueva clínica</h2>
      <p className="text-slate-400 text-sm mb-6">Registra una nueva sede en la plataforma CORONYX.</p>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nombre de la clínica *</label>
          <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            placeholder="Ej. Odontología del Valle"/>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Plan asignado *</label>
          <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white">
            <option>Starter</option>
            <option>Pro</option>
            <option>Enterprise</option>
          </select>
        </div>
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Administrador inicial (opcional)</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nombre completo</label>
              <input value={form.adminNombre} onChange={e => setForm({ ...form, adminNombre: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                placeholder="Ej. Carlos Ruiz"/>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Email institucional</label>
              <input value={form.adminEmail} onChange={e => setForm({ ...form, adminEmail: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                placeholder="admin@clinica.co"/>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onBack} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!form.nombre}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #1E8C82, #0B3D3A)' }}>
            {saved ? '✓ Guardado' : 'Registrar clínica'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SAAdmins() {
  const [admins, setAdmins] = useState(ADMINS_DEMO)
  const [modalEliminar, setModalEliminar] = useState<Admin | null>(null)
  const [editing, setEditing] = useState<Admin | null>(null)

  function eliminar(id: number) {
    setAdmins(prev => prev.filter(a => a.id !== id))
    setModalEliminar(null)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>Administradores de clínica</h2>
        <p className="text-slate-400 text-sm">Gestión de cuentas ADMIN_CLINICA en toda la plataforma</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Administrador', 'Clínica', 'Estado', 'Registrado', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {admins.map(a => (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: a.activo ? 'linear-gradient(135deg, #1E8C82, #0B3D3A)' : '#94a3b8' }}>
                        {a.nombre.split(' ').map(n => n[0]).join('').slice(0,2)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-[13px]">{a.nombre}</p>
                        <p className="text-[11px] text-slate-400">{a.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 text-[13px]">{a.clinica}</td>
                  <td className="px-4 py-3.5">
                    {a.activo
                      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>Activo</span>
                      : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"/>Inactivo</span>
                    }
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-[12px]">{a.creado}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditing(a)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
                        <Icon d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </button>
                      <button onClick={() => setModalEliminar(a)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Eliminar">
                        <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400 text-sm">No hay administradores registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal eliminar — DESTRUCTIVO */}
      {modalEliminar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 slide-up">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.07 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
            </div>
            <h3 className="text-base font-bold text-slate-800 text-center mb-1" style={{ fontFamily: 'Outfit' }}>Eliminar administrador</h3>
            <p className="text-sm text-slate-500 text-center mb-2">Esta acción es <strong>irreversible</strong>. Se eliminará la cuenta de:</p>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5 text-center">
              <p className="font-semibold text-red-700 text-sm">{modalEliminar.nombre}</p>
              <p className="text-red-500 text-xs">{modalEliminar.email}</p>
              <p className="text-red-400 text-xs mt-0.5">{modalEliminar.clinica}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModalEliminar(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
              <button onClick={() => eliminar(modalEliminar.id)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-semibold text-white transition-colors">
                Sí, eliminar cuenta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 slide-up">
            <h3 className="text-base font-bold text-slate-800 mb-4" style={{ fontFamily: 'Outfit' }}>Editar administrador</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Nombre</label>
                <input value={editing.nombre} onChange={e => setEditing({ ...editing, nombre: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"/>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Email</label>
                <input value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"/>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="activo-check" checked={editing.activo} onChange={e => setEditing({ ...editing, activo: e.target.checked })} className="accent-teal-600"/>
                <label htmlFor="activo-check" className="text-sm text-slate-600">Cuenta activa</label>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button onClick={() => { setAdmins(prev => prev.map(a => a.id === editing.id ? editing : a)); setEditing(null) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #1E8C82, #0B3D3A)' }}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SAPlanes() {
  const [suscripciones, setSuscripciones] = useState(
    CLINICAS_DEMO.filter(c => c.estado !== 'Cancelada').map(c => ({ ...c, _plan: c.plan }))
  )
  const [modalCambio, setModalCambio] = useState<typeof suscripciones[0] | null>(null)
  const [nuevoPlan, setNuevoPlan] = useState('')

  function confirmarCambio() {
    if (!modalCambio || !nuevoPlan) return
    setSuscripciones(prev => prev.map(s => s.id === modalCambio.id ? { ...s, plan: nuevoPlan } : s))
    setModalCambio(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>Planes y suscripciones</h2>
        <p className="text-slate-400 text-sm">Gestiona los planes activos por clínica</p>
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {PLANES.map(p => (
          <div key={p.nombre} className={`rounded-2xl p-5 border-2 ${p.destacado ? 'border-teal-300 shadow-lg shadow-teal-50' : 'border-slate-100'}`}
            style={{ background: p.destacado ? 'linear-gradient(135deg, #ecfaf9, #ffffff)' : 'white' }}>
            {p.destacado && <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-teal-700 bg-teal-100 rounded-full mb-2">MÁS POPULAR</span>}
            <h3 className="font-bold text-base mb-1" style={{ fontFamily: 'Outfit', color: p.col }}>{p.nombre}</h3>
            <p className="text-xl font-bold text-slate-800 mb-1" style={{ fontFamily: 'Outfit' }}>{p.precio}</p>
            <p className="text-xs text-slate-400 mb-3">hasta {p.usuarios} usuarios</p>
            <ul className="space-y-1.5">
              {p.funciones.map(f => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <svg className="w-3.5 h-3.5 text-teal-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Suscripciones por clínica */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700" style={{ fontFamily: 'Outfit' }}>Estado de suscripciones</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-50">
                {['Clínica', 'Plan actual', 'Estado', 'Vencimiento', 'Acción'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {suscripciones.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3.5 font-medium text-slate-800 text-[13px]">{s.nombre}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg"
                      style={{ background: s.plan === 'Enterprise' ? '#0B3D3A15' : s.plan === 'Pro' ? '#1E8C8215' : '#64748b15', color: s.plan === 'Enterprise' ? '#0B3D3A' : s.plan === 'Pro' ? '#1E8C82' : '#64748b' }}>
                      {s.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge estado={s.estado}/></td>
                  <td className="px-4 py-3.5 text-slate-400 text-[12px]">2027-01-15</td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => { setModalCambio(s); setNuevoPlan(s.plan) }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all hover:bg-teal-50"
                      style={{ borderColor: '#b3e8e5', color: '#1E8C82' }}>
                      Cambiar plan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalCambio && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 slide-up">
            <h3 className="text-base font-bold text-slate-800 mb-1" style={{ fontFamily: 'Outfit' }}>Cambiar plan</h3>
            <p className="text-sm text-slate-400 mb-4">{modalCambio.nombre}</p>
            <div className="space-y-2 mb-5">
              {PLANES.map(p => (
                <label key={p.nombre} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${nuevoPlan === p.nombre ? 'border-teal-400 bg-teal-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="plan-radio" value={p.nombre} checked={nuevoPlan === p.nombre} onChange={() => setNuevoPlan(p.nombre)} className="accent-teal-600"/>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: p.col }}>{p.nombre}</p>
                    <p className="text-xs text-slate-400">{p.precio} · {p.usuarios} usuarios</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModalCambio(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button onClick={confirmarCambio} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #1E8C82, #0B3D3A)' }}>
                Confirmar cambio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SAConfig() {
  const [config, setConfig] = useState({
    nombrePlataforma: 'CORONYX — Sistema Dental',
    emailSoporte: 'soporte@coronyx.co',
    maxClinicas: '50',
    periodoProeba: '14',
    mantenimiento: false,
    registro: true,
    notifEmail: true,
    version: '2.1.0',
  })
  const [saved, setSaved] = useState(false)

  function guardar() { setSaved(true); setTimeout(() => setSaved(false), 1800) }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>Configuración global</h2>
        <p className="text-slate-400 text-sm">Parámetros generales de la plataforma</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
        <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3" style={{ fontFamily: 'Outfit' }}>Identidad</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Nombre de la plataforma</label>
            <input value={config.nombrePlataforma} onChange={e => setConfig({ ...config, nombrePlataforma: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Email de soporte</label>
            <input value={config.emailSoporte} onChange={e => setConfig({ ...config, emailSoporte: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"/>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
        <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3" style={{ fontFamily: 'Outfit' }}>Límites y períodos</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Máx. clínicas registradas</label>
            <input type="number" value={config.maxClinicas} onChange={e => setConfig({ ...config, maxClinicas: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Período de prueba (días)</label>
            <input type="number" value={config.periodoProeba} onChange={e => setConfig({ ...config, periodoProeba: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"/>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3" style={{ fontFamily: 'Outfit' }}>Flags del sistema</h3>
        {[
          { key: 'mantenimiento', label: 'Modo mantenimiento', desc: 'Bloquea el acceso a todas las clínicas (solo SUPER_ADMIN puede entrar)', danger: true },
          { key: 'registro', label: 'Registro abierto', desc: 'Permite que nuevas clínicas creen su cuenta sin invitación', danger: false },
          { key: 'notifEmail', label: 'Notificaciones por email', desc: 'Envía alertas del sistema a los administradores de clínica', danger: false },
        ].map(f => (
          <div key={f.key} className="flex items-start justify-between gap-4">
            <div>
              <p className={`text-sm font-medium ${f.danger ? 'text-red-600' : 'text-slate-700'}`}>{f.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
            </div>
            <button onClick={() => setConfig({ ...config, [f.key]: !config[f.key as keyof typeof config] })}
              className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${config[f.key as keyof typeof config] ? (f.danger ? 'bg-red-500' : 'bg-teal-500') : 'bg-slate-200'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${config[f.key as keyof typeof config] ? 'left-7' : 'left-1'}`}/>
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={guardar}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #1E8C82, #0B3D3A)' }}>
          {saved ? '✓ Guardado' : 'Guardar configuración'}
        </button>
        <span className="text-xs text-slate-300">v{config.version}</span>
      </div>
    </div>
  )
}

function SASoporte() {
  const incidencias = [
    { id: 'INC-001', titulo: 'Error al cargar radiografías', clinica: 'Centro Dental Moderno', prioridad: 'Alta', estado: 'Abierta', fecha: '2026-08-20' },
    { id: 'INC-002', titulo: 'La IA de voz no transcribe correctamente', clinica: 'Clínica Herrera & Asociados', prioridad: 'Media', estado: 'En revisión', fecha: '2026-08-21' },
    { id: 'INC-003', titulo: 'No llegan recordatorios de citas', clinica: 'Odontología Integral García', prioridad: 'Baja', estado: 'Resuelta', fecha: '2026-08-18' },
  ]
  const metricas = [
    { label: 'Usuarios activos hoy', val: '34', icon: '👥' },
    { label: 'Citas registradas (mes)', val: '412', icon: '📅' },
    { label: 'Atenciones de IA (mes)', val: '189', icon: '🎙️' },
    { label: 'Videollamadas (mes)', val: '67', icon: '📹' },
    { label: 'Radiografías analizadas', val: '93', icon: '🔬' },
    { label: 'Uptime del mes', val: '99.8%', icon: '✅' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>Soporte y métricas de uso</h2>
        <p className="text-slate-400 text-sm">Indicadores globales de la plataforma e incidencias activas</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {metricas.map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
            <p className="text-xl mb-1">{m.icon}</p>
            <p className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>{m.val}</p>
            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700" style={{ fontFamily: 'Outfit' }}>Incidencias de soporte</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-50">
                {['ID', 'Incidencia', 'Clínica', 'Prioridad', 'Estado', 'Fecha'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {incidencias.map(i => (
                <tr key={i.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3.5 text-[12px] font-mono text-slate-400">{i.id}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-800 text-[13px]">{i.titulo}</td>
                  <td className="px-4 py-3.5 text-slate-500 text-[13px]">{i.clinica}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${i.prioridad === 'Alta' ? 'bg-red-50 text-red-700 border-red-200' : i.prioridad === 'Media' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {i.prioridad}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${i.estado === 'Abierta' ? 'bg-red-50 text-red-700 border-red-200' : i.estado === 'En revisión' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                      {i.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-[12px]">{i.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Root SUPER_ADMIN panel ───────────────────────────────────────────────────
interface SAProps { onLogout: () => void }

export default function SuperAdminDashboard({ onLogout }: SAProps) {
  const [active, setActive] = useState<SuperView>('dashboard')
  const [showNuevaClinica, setShowNuevaClinica] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const groups = [...new Set(SUPER_NAV.map(n => n.group))]

  function renderContent() {
    if (active === 'clinicas' && showNuevaClinica) return <SANuevaClinica onBack={() => setShowNuevaClinica(false)}/>
    switch (active) {
      case 'dashboard': return <SADashboard/>
      case 'clinicas': return <SAClinicas onNueva={() => setShowNuevaClinica(true)}/>
      case 'admins': return <SAAdmins/>
      case 'planes': return <SAPlanes/>
      case 'config': return <SAConfig/>
      case 'soporte': return <SASoporte/>
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-14' : 'w-60'} shrink-0 flex flex-col h-full transition-all duration-200`}
        style={{ background: 'linear-gradient(to bottom, #062422, #0B3D3A)' }}>

        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/8 ${collapsed ? 'justify-center' : ''}`}>
          <CoroNyxLogo size={48}/>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold leading-tight tracking-wide" style={{ fontFamily: 'Outfit' }}>CORONYX</p>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#f59e0b' }}>Super Admin</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
          {groups.map(group => (
            <div key={group}>
              {!collapsed && <p className="text-white/20 text-xs font-semibold uppercase tracking-widest px-2 mb-1.5" style={{ fontFamily: 'Outfit' }}>{group}</p>}
              <div className="space-y-0.5">
                {SUPER_NAV.filter(n => n.group === group).map(item => {
                  const isActive = active === item.id
                  return (
                    <button key={item.id} onClick={() => { setActive(item.id); setShowNuevaClinica(false) }}
                      title={collapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all relative ${isActive ? 'bg-amber-500/15 text-amber-400' : 'text-white/45 hover:text-white/80 hover:bg-white/5'} ${collapsed ? 'justify-center' : ''}`}>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d={item.icon}/>
                      </svg>
                      {!collapsed && <span className="flex-1 text-left font-medium text-[13px]">{item.label}</span>}
                      {isActive && !collapsed && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-amber-400 rounded-r"/>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User row */}
        <div className={`p-3 border-t border-white/5 flex ${collapsed ? 'justify-center' : 'items-center gap-2'}`}>
          {!collapsed && (
            <>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                SA
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-xs font-medium truncate">Super Admin</p>
                <p className="text-amber-400/60 text-[10px] truncate">Administrador global</p>
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
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"/>
            <h2 className="text-sm font-semibold text-slate-700" style={{ fontFamily: 'Outfit' }}>
              {SUPER_NAV.find(n => n.id === active)?.label}
            </h2>
          </div>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">SUPER_ADMIN</span>
          <div className="flex-1"/>
          <button onClick={onLogout}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50">
            <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            Cerrar sesión
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
