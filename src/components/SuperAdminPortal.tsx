import { useState, type ReactNode } from 'react'

interface Props { onLogout: () => void }

type Section = 'overview' | 'clinicas' | 'solicitudes' | 'ingresos' | 'logs'

// ── Mock data ─────────────────────────────────────────────────────────────────

interface Clinica {
  id: number; name: string; nit: string; city: string; address: string; plan: string
  seats: number; usedSeats: number; usedStorage: number; maxStorage: number
  status: string; mrr: number; joined: string; logo: string
  adminName: string; adminEmail: string; adminPhone: string
  admins: Array<{ name: string; email: string; since: string }>
}

const CLINICAS_INIT: Clinica[] = [
  {
    id: 1, name: 'Clínica Herrera & Asociados', nit: '900.123.456-7', city: 'Bogotá', address: 'Cra 15 #93-47, Of. 502',
    plan: 'Enterprise', seats: 12, usedSeats: 10, usedStorage: 4.2, maxStorage: 10,
    status: 'active', mrr: 890_000, joined: '2024-03', logo: '🦷',
    adminName: 'Dr. Jorge Herrera', adminEmail: 'jorge.herrera@clinica.co', adminPhone: '+57 310 555 0101',
    admins: [
      { name: 'Dr. Jorge Herrera', email: 'jorge.herrera@clinica.co', since: '2024-03' },
      { name: 'Valentina Mora',    email: 'vmora@clinica.co',          since: '2024-05' },
    ],
  },
  {
    id: 2, name: 'Sonrisas del Norte', nit: '900.234.567-8', city: 'Medellín', address: 'El Poblado, Cra 43A #1-50 L-214',
    plan: 'Pro', seats: 5, usedSeats: 4, usedStorage: 1.8, maxStorage: 5,
    status: 'active', mrr: 320_000, joined: '2024-06', logo: '😁',
    adminName: 'Dra. Camila Restrepo', adminEmail: 'camila@sonrisas.co', adminPhone: '+57 300 555 0202',
    admins: [{ name: 'Dra. Camila Restrepo', email: 'camila@sonrisas.co', since: '2024-06' }],
  },
  {
    id: 3, name: 'OdontoPlaza Cali', nit: '900.345.678-9', city: 'Cali', address: 'Av. 5N #22N-25 Torre B',
    plan: 'Pro', seats: 8, usedSeats: 7, usedStorage: 3.1, maxStorage: 5,
    status: 'active', mrr: 320_000, joined: '2024-07', logo: '🏥',
    adminName: 'Dr. Hernán Castro', adminEmail: 'hcastro@odontoplaza.co', adminPhone: '+57 315 555 0303',
    admins: [
      { name: 'Dr. Hernán Castro', email: 'hcastro@odontoplaza.co',  since: '2024-07' },
      { name: 'Sandra Jiménez',    email: 'sjimenez@odontoplaza.co', since: '2024-09' },
    ],
  },
  {
    id: 4, name: 'DentalTech Barranquilla', nit: '900.456.789-0', city: 'Barranquilla', address: 'Cra 46 #70-21 L-8',
    plan: 'Starter', seats: 3, usedSeats: 2, usedStorage: 0.4, maxStorage: 2,
    status: 'trial', mrr: 0, joined: '2025-01', logo: '✨',
    adminName: 'Luis Martínez', adminEmail: 'admin@dentaltech.co', adminPhone: '+57 321 555 0404',
    admins: [{ name: 'Luis Martínez', email: 'admin@dentaltech.co', since: '2025-01' }],
  },
  {
    id: 5, name: 'Clínica Peñaloza', nit: '900.567.890-1', city: 'Bucaramanga', address: 'Clle 35 #28-14 Of. 301',
    plan: 'Starter', seats: 2, usedSeats: 2, usedStorage: 0.9, maxStorage: 2,
    status: 'active', mrr: 149_000, joined: '2024-09', logo: '🌟',
    adminName: 'Dra. Patricia Peñaloza', adminEmail: 'ppenaloza@clinica.co', adminPhone: '+57 317 555 0505',
    admins: [{ name: 'Dra. Patricia Peñaloza', email: 'ppenaloza@clinica.co', since: '2024-09' }],
  },
  {
    id: 6, name: 'OralCare Express', nit: '900.678.901-2', city: 'Cartagena', address: 'Bocagrande, Cra 2 #7-154',
    plan: 'Pro', seats: 6, usedSeats: 0, usedStorage: 2.2, maxStorage: 5,
    status: 'paused', mrr: 0, joined: '2024-04', logo: '💊',
    adminName: 'Marcela Torres', adminEmail: 'admin@oralcare.co', adminPhone: '+57 305 555 0606',
    admins: [{ name: 'Marcela Torres', email: 'admin@oralcare.co', since: '2024-04' }],
  },
]

type SolicitudStatus = 'pending' | 'approved' | 'rejected'
interface Solicitud {
  id: number; clinicId: number; clinicName: string; currentPlan: string; requestedPlan: string
  reason: string; createdAt: string; status: SolicitudStatus; adminEmail: string
}

const SOLICITUDES_INIT: Solicitud[] = [
  { id: 1, clinicId: 4, clinicName: 'DentalTech Barranquilla', currentPlan: 'Starter', requestedPlan: 'Pro', reason: 'Necesitamos acceso a odontograma y radiografías; ya tenemos 6 odontólogos activos.', createdAt: '2026-08-22 10:15', status: 'pending', adminEmail: 'admin@dentaltech.co' },
  { id: 2, clinicId: 5, clinicName: 'Clínica Peñaloza', currentPlan: 'Starter', requestedPlan: 'Pro', reason: 'Queremos habilitar teleodontología y el módulo de inventario.', createdAt: '2026-08-20 14:42', status: 'pending', adminEmail: 'ppenaloza@clinica.co' },
  { id: 3, clinicId: 2, clinicName: 'Sonrisas del Norte', currentPlan: 'Pro', requestedPlan: 'Enterprise', reason: 'Estamos abriendo segunda sede y necesitamos multi-sede e IA por voz.', createdAt: '2026-08-18 09:30', status: 'approved', adminEmail: 'camila@sonrisas.co' },
  { id: 4, clinicId: 3, clinicName: 'OdontoPlaza Cali', currentPlan: 'Pro', requestedPlan: 'Enterprise', reason: 'Requieren acceso a API para integrar con su HIS propio.', createdAt: '2026-08-15 16:05', status: 'rejected', adminEmail: 'hcastro@odontoplaza.co' },
]

const PLANS = [
  { name: 'Starter',    price: 149_000, seats: '1–3',  features: ['Agenda', 'Pacientes', 'Caja básica'],                         clinics: 2,  color: '#64748B' },
  { name: 'Pro',        price: 320_000, seats: '1–10', features: ['Todo Starter', 'Odontograma', 'Radiografías', 'Inventario'],   clinics: 3,  color: '#1E8C82' },
  { name: 'Enterprise', price: 890_000, seats: 'Ilim.', features: ['Todo Pro', 'IA por voz', 'Teleodontología', 'Multi-sede', 'API'],clinics: 1, color: '#D97706' },
]

const MONTHLY_MRR = [
  { month: 'Ago 24', mrr: 890000 },
  { month: 'Sep 24', mrr: 1180000 },
  { month: 'Oct 24', mrr: 1338000 },
  { month: 'Nov 24', mrr: 1338000 },
  { month: 'Dic 24', mrr: 1487000 },
  { month: 'Ene 25', mrr: 1636000 },
  { month: 'Feb 25', mrr: 1636000 },
  { month: 'Mar 25', mrr: 1679000 },
]

const LOGS = [
  { ts: '2025-03-23 14:32', level: 'info',  clinic: 'Herrera & Asoc.',   event: 'Login exitoso',            user: 'dr.herrera@clinica.co' },
  { ts: '2025-03-23 14:28', level: 'warn',  clinic: 'DentalTech Bquilla', event: 'Intento de login fallido', user: 'demo@dentaltech.co' },
  { ts: '2025-03-23 13:55', level: 'info',  clinic: 'Sonrisas del Norte', event: 'Nuevo paciente registrado', user: 'recepc@sonrisas.co' },
  { ts: '2025-03-23 13:40', level: 'info',  clinic: 'OdontoPlaza Cali',  event: 'Factura generada $320.000', user: 'caja@odontoplaza.co' },
  { ts: '2025-03-23 13:12', level: 'error', clinic: 'OralCare Express',   event: 'Pago rechazado — plan pausado', user: 'admin@oralcare.co' },
  { ts: '2025-03-23 12:50', level: 'info',  clinic: 'Clínica Peñaloza',  event: 'Teleconsulta iniciada',    user: 'dr.penaloza@clinica.co' },
  { ts: '2025-03-23 12:30', level: 'info',  clinic: 'Herrera & Asoc.',   event: 'Radiografía subida y analizada', user: 'dr.herrera@clinica.co' },
  { ts: '2025-03-23 11:58', level: 'warn',  clinic: 'Sonrisas del Norte', event: 'Stock de material bajo (< mínimo)', user: 'sistema' },
]

function fmt(n: number) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n) }

function SvgIcon({ d }: { d: string }) {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

// ── Shared modal backdrop ─────────────────────────────────────────────────────
function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}

// ── ModalCrearClinica ─────────────────────────────────────────────────────────
function ModalCrearClinica({ onClose, onCreate }: { onClose: () => void; onCreate: (c: Clinica) => void }) {
  const [form, setForm] = useState({ name: '', nit: '', city: '', address: '', adminName: '', adminEmail: '', adminPhone: '', plan: 'Starter', seats: '3' })
  const [saving, setSaving] = useState(false)

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function submit() {
    if (!form.name || !form.nit || !form.adminEmail) return
    setSaving(true)
    setTimeout(() => {
      const newC: Clinica = {
        id: Date.now(), name: form.name, nit: form.nit, city: form.city, address: form.address,
        plan: form.plan, seats: parseInt(form.seats) || 3, usedSeats: 0, usedStorage: 0,
        maxStorage: form.plan === 'Enterprise' ? 10 : form.plan === 'Pro' ? 5 : 2,
        status: 'trial', mrr: 0, joined: new Date().toISOString().slice(0, 7),
        logo: '🆕', adminName: form.adminName, adminEmail: form.adminEmail, adminPhone: form.adminPhone,
        admins: [{ name: form.adminName, email: form.adminEmail, since: new Date().toISOString().slice(0, 7) }],
      }
      onCreate(newC)
      onClose()
    }, 1200)
  }

  const labelCls = 'block text-xs text-white/40 mb-1'
  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50'

  return (
    <Modal onClose={onClose}>
      <div className="w-[540px] rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'linear-gradient(135deg,#1C1917 0%,#0C0A09 100%)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'Outfit' }}>Nueva clínica</h3>
            <p className="text-white/30 text-xs mt-0.5">Registrar nueva organización en CORONYX</p>
          </div>
          <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-colors text-lg leading-none">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">
          <div>
            <p className="text-amber-400/80 text-[10px] font-semibold uppercase tracking-widest mb-3">Datos de la clínica</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Nombre de la clínica *</label>
                <input className={inputCls} placeholder="Ej: Clínica Dental XYZ" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>NIT / Identificación fiscal *</label>
                <input className={inputCls} placeholder="900.000.000-0" value={form.nit} onChange={e => set('nit', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Ciudad</label>
                <input className={inputCls} placeholder="Bogotá" value={form.city} onChange={e => set('city', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Dirección</label>
                <input className={inputCls} placeholder="Cra 00 #00-00, Piso 0" value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-amber-400/80 text-[10px] font-semibold uppercase tracking-widest mb-3">Administrador principal</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Nombre completo</label>
                <input className={inputCls} placeholder="Dr. Nombre Apellido" value={form.adminName} onChange={e => set('adminName', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Correo electrónico *</label>
                <input className={inputCls} type="email" placeholder="admin@clinica.co" value={form.adminEmail} onChange={e => set('adminEmail', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Teléfono</label>
                <input className={inputCls} placeholder="+57 300 000 0000" value={form.adminPhone} onChange={e => set('adminPhone', e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-amber-400/80 text-[10px] font-semibold uppercase tracking-widest mb-3">Plan y recursos</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Plan asignado inicial</label>
                <select className={inputCls + ' cursor-pointer'} value={form.plan} onChange={e => set('plan', e.target.value)}>
                  {PLANS.map(p => <option key={p.name} value={p.name}>{p.name} — {fmt(p.price)}/mes</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Límite de profesionales</label>
                <input className={inputCls} type="number" min="1" max="100" placeholder="3" value={form.seats} onChange={e => set('seats', e.target.value)} />
              </div>
            </div>
            {form.plan && (
              <div className="mt-3 rounded-xl border border-white/8 bg-white/3 p-3 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: PLANS.find(p => p.name === form.plan)?.color }} />
                <div>
                  <p className="text-white/60 text-xs font-medium">{form.plan}</p>
                  <p className="text-white/30 text-xs mt-0.5">{PLANS.find(p => p.name === form.plan)?.features.join(' · ')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/8 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">Cancelar</button>
          <button onClick={submit} disabled={saving || !form.name || !form.nit || !form.adminEmail}
            className="px-5 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#D97706,#B45309)', color: '#fff' }}>
            {saving ? 'Creando...' : '+ Crear clínica'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── ModalDetalleClinica ───────────────────────────────────────────────────────
function ModalDetalleClinica({ clinica, onClose, onSave }: { clinica: Clinica; onClose: () => void; onSave: (c: Clinica) => void }) {
  const [tab, setTab] = useState<'info' | 'recursos' | 'admins'>('info')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: clinica.name, nit: clinica.nit, city: clinica.city, address: clinica.address, plan: clinica.plan })
  const [saving, setSaving] = useState(false)

  function setF(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function save() {
    setSaving(true)
    setTimeout(() => {
      onSave({ ...clinica, ...form })
      setEditing(false)
      setSaving(false)
    }, 800)
  }

  const planColor = PLANS.find(p => p.name === clinica.plan)?.color ?? '#64748B'
  const seatsPercent = Math.round((clinica.usedSeats / clinica.seats) * 100)
  const storagePercent = Math.round((clinica.usedStorage / clinica.maxStorage) * 100)

  const statusLabel: Record<string, { text: string; cls: string }> = {
    active: { text: 'Activa',  cls: 'bg-emerald-500/15 text-emerald-400' },
    trial:  { text: 'Trial',   cls: 'bg-amber-500/15 text-amber-400' },
    paused: { text: 'Pausada', cls: 'bg-rose-500/15 text-rose-400' },
  }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50'
  const labelCls = 'block text-xs text-white/40 mb-1'

  return (
    <Modal onClose={onClose}>
      <div className="w-[600px] rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'linear-gradient(135deg,#1C1917 0%,#0C0A09 100%)' }}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/8">
          <span className="text-2xl">{clinica.logo}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-sm truncate" style={{ fontFamily: 'Outfit' }}>{clinica.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-white/30 text-xs font-mono">{clinica.nit}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusLabel[clinica.status].cls}`}>{statusLabel[clinica.status].text}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: planColor + '20', color: planColor }}>{clinica.plan}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-colors text-lg leading-none">✕</button>
        </div>

        <div className="flex border-b border-white/8 px-6">
          {(['info', 'recursos', 'admins'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-3 px-4 text-xs font-medium border-b-2 transition-all -mb-px ${tab === t ? 'border-amber-400 text-amber-400' : 'border-transparent text-white/40 hover:text-white/60'}`}>
              {t === 'info' ? 'Datos' : t === 'recursos' ? 'Recursos' : 'Administradores'}
            </button>
          ))}
        </div>

        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {tab === 'info' && (
            <div className="space-y-4">
              {!editing ? (
                <div className="space-y-3">
                  {([['Nombre', clinica.name], ['NIT', clinica.nit], ['Ciudad', clinica.city], ['Dirección', clinica.address], ['Plan', clinica.plan], ['Administrador', clinica.adminName], ['Email admin', clinica.adminEmail], ['Teléfono', clinica.adminPhone], ['Activo desde', clinica.joined]] as [string, string][]).map(([k, v]) => (
                    <div key={k} className="flex items-start gap-3">
                      <span className="text-white/30 text-xs w-28 shrink-0">{k}</span>
                      <span className="text-white/70 text-xs flex-1">{v || '—'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelCls}>Nombre de la clínica</label>
                    <input className={inputCls} value={form.name} onChange={e => setF('name', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>NIT</label>
                    <input className={inputCls} value={form.nit} onChange={e => setF('nit', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Ciudad</label>
                    <input className={inputCls} value={form.city} onChange={e => setF('city', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Dirección</label>
                    <input className={inputCls} value={form.address} onChange={e => setF('address', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Plan</label>
                    <select className={inputCls + ' cursor-pointer'} value={form.plan} onChange={e => setF('plan', e.target.value)}>
                      {PLANS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'recursos' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/3 border border-white/8 rounded-xl p-4">
                  <p className="text-white/40 text-xs mb-3">Usuarios / Sillas</p>
                  <p className="text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Outfit' }}>{clinica.usedSeats}<span className="text-white/30 text-base font-normal">/{clinica.seats}</span></p>
                  <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${seatsPercent}%`, backgroundColor: seatsPercent > 90 ? '#F43F5E' : seatsPercent > 70 ? '#F59E0B' : '#1E8C82' }} />
                  </div>
                  <p className="text-white/25 text-xs mt-1.5">{seatsPercent}% utilizado</p>
                </div>
                <div className="bg-white/3 border border-white/8 rounded-xl p-4">
                  <p className="text-white/40 text-xs mb-3">Almacenamiento</p>
                  <p className="text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Outfit' }}>{clinica.usedStorage}<span className="text-white/30 text-base font-normal"> GB</span></p>
                  <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(storagePercent, 100)}%`, backgroundColor: storagePercent > 90 ? '#F43F5E' : storagePercent > 70 ? '#F59E0B' : '#1E8C82' }} />
                  </div>
                  <p className="text-white/25 text-xs mt-1.5">{clinica.usedStorage}/{clinica.maxStorage} GB ({storagePercent}%)</p>
                </div>
              </div>
              <div className="bg-white/3 border border-white/8 rounded-xl p-4">
                <p className="text-white/40 text-xs mb-3">Plan activo</p>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: planColor }} />
                  <div className="flex-1">
                    <p className="text-white/80 text-sm font-semibold" style={{ fontFamily: 'Outfit' }}>{clinica.plan}</p>
                    <p className="text-white/30 text-xs mt-0.5">{PLANS.find(p => p.name === clinica.plan)?.features.join(' · ')}</p>
                  </div>
                  <p className="text-white/60 text-sm font-mono">{fmt(PLANS.find(p => p.name === clinica.plan)?.price ?? 0)}<span className="text-white/30 text-xs">/mes</span></p>
                </div>
              </div>
              <div className="bg-white/3 border border-white/8 rounded-xl p-4">
                <p className="text-white/40 text-xs mb-2">MRR de esta clínica</p>
                <p className="text-white text-xl font-bold font-mono">{clinica.mrr > 0 ? fmt(clinica.mrr) : <span className="text-white/30">—</span>}</p>
                {clinica.status === 'trial' && <p className="text-amber-400/70 text-xs mt-1">Período de prueba activo</p>}
                {clinica.status === 'paused' && <p className="text-rose-400/70 text-xs mt-1">Pago pendiente — servicio suspendido</p>}
              </div>
            </div>
          )}

          {tab === 'admins' && (
            <div className="space-y-3">
              <p className="text-white/40 text-xs mb-1">{clinica.admins.length} administrador{clinica.admins.length !== 1 ? 'es' : ''} registrado{clinica.admins.length !== 1 ? 's' : ''}</p>
              {clinica.admins.map((a, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: 'linear-gradient(135deg,#D97706,#B45309)' }}>
                    {a.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-xs font-medium truncate">{a.name}</p>
                    <p className="text-white/30 text-xs font-mono truncate">{a.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">ADMIN_CLINICA</span>
                    <p className="text-white/20 text-xs mt-1">Desde {a.since}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/8 flex justify-between items-center">
          <p className="text-white/20 text-xs">ID clínica #{clinica.id}</p>
          <div className="flex gap-2">
            {tab === 'info' && !editing && (
              <button onClick={() => setEditing(true)} className="px-4 py-2 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/8 transition-all border border-white/10">Editar datos</button>
            )}
            {editing && (
              <>
                <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg text-xs text-white/40 hover:text-white/60 transition-colors">Cancelar</button>
                <button onClick={save} disabled={saving}
                  className="px-5 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#D97706,#B45309)', color: '#fff' }}>
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </>
            )}
            {!editing && (
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs text-white/40 hover:text-white/60 transition-colors">Cerrar</button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ── Mini bar chart (inline, no library) ──────────────────────────────────────
function MiniBarChart({ data }: { data: typeof MONTHLY_MRR }) {
  const max = Math.max(...data.map(d => d.mrr))
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-sm transition-all"
            style={{ height: `${(d.mrr / max) * 64}px`, backgroundColor: i === data.length - 1 ? '#D97706' : '#1E8C82', opacity: i === data.length - 1 ? 1 : 0.55 }} />
          <span className="text-[9px] text-white/30 rotate-45 origin-left">{d.month}</span>
        </div>
      ))}
    </div>
  )
}

// ── NAV ───────────────────────────────────────────────────────────────────────
const NAV: Array<{ id: Section; label: string; icon: string }> = [
  { id: 'overview',    label: 'Resumen',      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'clinicas',    label: 'Clínicas',     icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { id: 'solicitudes', label: 'Solicitudes',  icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { id: 'ingresos',    label: 'Ingresos',     icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'logs',        label: 'Actividad',    icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
]

// ── SECTIONS ──────────────────────────────────────────────────────────────────

function SectionOverview() {
  const activeCount  = CLINICAS_INIT.filter(c => c.status === 'active').length
  const totalMRR     = CLINICAS_INIT.filter(c => c.status === 'active').reduce((s, c) => s + c.mrr, 0)
  const trialCount   = CLINICAS_INIT.filter(c => c.status === 'trial').length
  const totalSeats   = CLINICAS_INIT.reduce((s, c) => s + c.seats, 0)

  const kpis = [
    { label: 'MRR Total',          value: fmt(totalMRR),      sub: '+8.4% vs. mes anterior', accent: '#D97706' },
    { label: 'Clínicas activas',   value: String(activeCount), sub: `${trialCount} en período trial`, accent: '#1E8C82' },
    { label: 'Sillas / usuarios',  value: String(totalSeats),  sub: 'Usuarios con acceso activo',  accent: '#7C3AED' },
    { label: 'ARR estimado',       value: fmt(totalMRR * 12),  sub: 'Proyección anual',            accent: '#059669' },
  ]

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-slate-800/60 border border-white/8 rounded-2xl p-5">
            <p className="text-white/40 text-xs mb-1">{k.label}</p>
            <p className="text-white text-2xl font-bold" style={{fontFamily:'Outfit'}}>{k.value}</p>
            <p className="text-xs mt-1" style={{color: k.accent}}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* MRR chart + recent activity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5">
          <p className="text-white/70 text-sm font-semibold mb-4" style={{fontFamily:'Outfit'}}>MRR mensual</p>
          <MiniBarChart data={MONTHLY_MRR} />
        </div>

        <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5">
          <p className="text-white/70 text-sm font-semibold mb-4" style={{fontFamily:'Outfit'}}>Distribución de planes</p>
          <div className="space-y-3">
            {PLANS.map(p => {
              const share = Math.round((p.clinics / CLINICAS_INIT.length) * 100)
              return (
                <div key={p.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/60">{p.name}</span>
                    <span className="text-white/40">{p.clinics} clínica{p.clinics !== 1 ? 's' : ''} · {share}%</span>
                  </div>
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{width:`${share}%`, backgroundColor: p.color}} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent log preview */}
      <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5">
        <p className="text-white/70 text-sm font-semibold mb-4" style={{fontFamily:'Outfit'}}>Actividad reciente</p>
        <div className="space-y-2">
          {LOGS.slice(0,4).map((l, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${l.level === 'error' ? 'bg-rose-500' : l.level === 'warn' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span className="text-white/25 shrink-0 font-mono">{l.ts.split(' ')[1]}</span>
              <span className="text-white/50 shrink-0">{l.clinic}</span>
              <span className="text-white/70 flex-1 truncate">{l.event}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SectionClinicas() {
  const [clinicas, setClinicas] = useState<Clinica[]>(CLINICAS_INIT)
  const [filter, setFilter] = useState<'all' | 'active' | 'trial' | 'paused'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [detalle, setDetalle] = useState<Clinica | null>(null)

  const visible = filter === 'all' ? clinicas : clinicas.filter(c => c.status === filter)

  const statusLabel: Record<string, { text: string; cls: string }> = {
    active: { text: 'Activa',  cls: 'bg-emerald-500/15 text-emerald-400' },
    trial:  { text: 'Trial',   cls: 'bg-amber-500/15 text-amber-400' },
    paused: { text: 'Pausada', cls: 'bg-rose-500/15 text-rose-400' },
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'active', 'trial', 'paused'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-amber-500 text-white' : 'text-white/40 hover:bg-white/8'}`}>
              {f === 'all' ? `Todas (${clinicas.length})` : f === 'active' ? `Activas (${clinicas.filter(c => c.status === 'active').length})` : f === 'trial' ? `Trial (${clinicas.filter(c => c.status === 'trial').length})` : `Pausadas (${clinicas.filter(c => c.status === 'paused').length})`}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{ background: 'linear-gradient(135deg,#D97706,#B45309)', color: '#fff' }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Crear nueva clínica
        </button>
      </div>

      <div className="bg-slate-800/60 border border-white/8 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {['Clínica', 'Ciudad', 'Plan', 'Usuarios', 'MRR', 'Estado', ''].map(h => (
                <th key={h} className="text-left text-xs text-white/30 font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map(c => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{c.logo}</span>
                    <div>
                      <p className="text-white/80 font-medium text-xs">{c.name}</p>
                      <p className="text-white/30 text-xs">Desde {c.joined}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-white/50 text-xs">{c.city}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: PLANS.find(p => p.name === c.plan)?.color + '20', color: PLANS.find(p => p.name === c.plan)?.color }}>
                    {c.plan}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/50 text-xs">{c.usedSeats}/{c.seats}</td>
                <td className="px-4 py-3 text-white/70 text-xs font-mono">{c.mrr > 0 ? fmt(c.mrr) : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusLabel[c.status].cls}`}>{statusLabel[c.status].text}</span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setDetalle(c)} className="text-amber-400/50 hover:text-amber-400 transition-colors text-xs font-medium">Ver →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <ModalCrearClinica onClose={() => setShowCreate(false)} onCreate={c => setClinicas(prev => [...prev, c])} />
      )}
      {detalle && (
        <ModalDetalleClinica clinica={detalle} onClose={() => setDetalle(null)}
          onSave={updated => { setClinicas(prev => prev.map(c => c.id === updated.id ? updated : c)); setDetalle(updated) }} />
      )}
    </div>
  )
}

function SectionSolicitudes() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(SOLICITUDES_INIT)
  const [filter, setFilter] = useState<'all' | SolicitudStatus>('all')
  const [processing, setProcessing] = useState<number | null>(null)

  const visible = filter === 'all' ? solicitudes : solicitudes.filter(s => s.status === filter)
  const pendingCount = solicitudes.filter(s => s.status === 'pending').length

  function act(id: number, action: 'approved' | 'rejected') {
    setProcessing(id)
    setTimeout(() => {
      setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, status: action } : s))
      setProcessing(null)
    }, 800)
  }

  const statusMeta: Record<SolicitudStatus, { text: string; cls: string }> = {
    pending:  { text: 'Pendiente', cls: 'bg-amber-500/15 text-amber-400' },
    approved: { text: 'Aprobada',  cls: 'bg-emerald-500/15 text-emerald-400' },
    rejected: { text: 'Rechazada', cls: 'bg-rose-500/15 text-rose-400' },
  }

  const planColor = (name: string) => PLANS.find(p => p.name === name)?.color ?? '#64748B'

  return (
    <div className="space-y-4">
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3">
          <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shrink-0" />
          <p className="text-amber-400/90 text-xs font-medium">{pendingCount} solicitud{pendingCount !== 1 ? 'es' : ''} de cambio de plan pendiente{pendingCount !== 1 ? 's' : ''} de revisión</p>
        </div>
      )}

      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-amber-500 text-white' : 'text-white/40 hover:bg-white/8'}`}>
            {f === 'all' ? `Todas (${solicitudes.length})` : f === 'pending' ? `Pendientes (${solicitudes.filter(s => s.status === 'pending').length})` : f === 'approved' ? `Aprobadas (${solicitudes.filter(s => s.status === 'approved').length})` : `Rechazadas (${solicitudes.filter(s => s.status === 'rejected').length})`}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.length === 0 && (
          <div className="text-center py-12 text-white/20 text-sm">No hay solicitudes en esta categoría</div>
        )}
        {visible.map(s => (
          <div key={s.id} className={`bg-slate-800/60 border rounded-2xl p-5 transition-all ${s.status === 'pending' ? 'border-amber-500/20' : 'border-white/8'}`}>
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-white/80 text-sm font-semibold" style={{ fontFamily: 'Outfit' }}>{s.clinicName}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusMeta[s.status].cls}`}>{statusMeta[s.status].text}</span>
                </div>
                <p className="text-white/30 text-xs font-mono mb-3">{s.adminEmail} · {s.createdAt}</p>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: planColor(s.currentPlan) }} />
                    <span className="text-xs font-semibold" style={{ color: planColor(s.currentPlan) }}>{s.currentPlan}</span>
                  </div>
                  <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: planColor(s.requestedPlan) }} />
                    <span className="text-xs font-semibold" style={{ color: planColor(s.requestedPlan) }}>{s.requestedPlan}</span>
                  </div>
                  <span className="text-white/20 text-xs">— Diferencia: {fmt((PLANS.find(p => p.name === s.requestedPlan)?.price ?? 0) - (PLANS.find(p => p.name === s.currentPlan)?.price ?? 0))}/mes</span>
                </div>

                <div className="bg-white/3 border border-white/6 rounded-xl px-3 py-2.5">
                  <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest mb-1">Motivo del administrador</p>
                  <p className="text-white/60 text-xs leading-relaxed">{s.reason}</p>
                </div>
              </div>

              {s.status === 'pending' ? (
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => act(s.id, 'approved')} disabled={processing === s.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all disabled:opacity-40">
                    {processing === s.id ? '...' : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        Aprobar
                      </>
                    )}
                  </button>
                  <button onClick={() => act(s.id, 'rejected')} disabled={processing === s.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition-all disabled:opacity-40">
                    {processing === s.id ? '...' : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        Rechazar
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium ${statusMeta[s.status].cls}`}>{statusMeta[s.status].text}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionIngresos() {
  const totalMRR   = CLINICAS_INIT.filter(c => c.status === 'active').reduce((s, c) => s + c.mrr, 0)
  const lastMonth  = MONTHLY_MRR[MONTHLY_MRR.length - 2].mrr
  const thisMrr    = MONTHLY_MRR[MONTHLY_MRR.length - 1].mrr
  const growth     = (((thisMrr - lastMonth) / lastMonth) * 100).toFixed(1)

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'MRR actual',     value: fmt(totalMRR),       sub: `+${growth}% vs. mes anterior`, accent: '#D97706' },
          { label: 'ARR proyectado', value: fmt(totalMRR * 12),  sub: 'Sin churns',                   accent: '#1E8C82' },
          { label: 'Ingreso acum.',  value: fmt(MONTHLY_MRR.reduce((s,m)=>s+m.mrr,0)), sub: 'Desde Ago 2024', accent: '#7C3AED' },
        ].map((k, i) => (
          <div key={i} className="bg-slate-800/60 border border-white/8 rounded-2xl p-5">
            <p className="text-white/40 text-xs mb-1">{k.label}</p>
            <p className="text-white text-2xl font-bold" style={{fontFamily:'Outfit'}}>{k.value}</p>
            <p className="text-xs mt-1" style={{color: k.accent}}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Monthly breakdown */}
      <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-6">
        <p className="text-white/70 text-sm font-semibold mb-5" style={{fontFamily:'Outfit'}}>Historial mensual</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {['Período','MRR','Variación','Acumulado'].map(h=>(
                <th key={h} className="text-left text-xs text-white/30 font-medium pb-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MONTHLY_MRR.map((m, i) => {
              const prev = i > 0 ? MONTHLY_MRR[i-1].mrr : m.mrr
              const delta = ((m.mrr - prev) / prev * 100).toFixed(1)
              const acum = MONTHLY_MRR.slice(0, i+1).reduce((s,x)=>s+x.mrr,0)
              return (
                <tr key={i} className="border-b border-white/5">
                  <td className="py-3 text-white/70 text-xs">{m.month}</td>
                  <td className="py-3 text-white/80 text-xs font-mono">{fmt(m.mrr)}</td>
                  <td className="py-3 text-xs">
                    {i === 0 ? <span className="text-white/30">—</span> : (
                      <span className={parseFloat(delta) > 0 ? 'text-emerald-400' : parseFloat(delta) < 0 ? 'text-rose-400' : 'text-white/40'}>
                        {parseFloat(delta) > 0 ? '↑' : parseFloat(delta) < 0 ? '↓' : ''} {Math.abs(parseFloat(delta))}%
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-white/40 text-xs font-mono">{fmt(acum)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Breakdown by plan */}
      <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-6">
        <p className="text-white/70 text-sm font-semibold mb-4" style={{fontFamily:'Outfit'}}>Ingresos por plan</p>
        <div className="space-y-4">
          {PLANS.map(p => {
            const planMRR = p.price * p.clinics
            const share   = Math.round((planMRR / totalMRR) * 100)
            return (
              <div key={p.name} className="flex items-center gap-4">
                <span className="w-20 text-xs text-white/60 shrink-0">{p.name}</span>
                <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{width:`${share}%`, backgroundColor: p.color}} />
                </div>
                <span className="w-28 text-right text-xs font-mono text-white/60 shrink-0">{fmt(planMRR)}</span>
                <span className="w-8 text-right text-xs text-white/30 shrink-0">{share}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SectionLogs() {
  const levelStyle: Record<string, string> = {
    info:  'bg-emerald-500/10 text-emerald-400',
    warn:  'bg-amber-500/10  text-amber-400',
    error: 'bg-rose-500/10   text-rose-400',
  }

  return (
    <div className="bg-slate-800/60 border border-white/8 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
        <p className="text-white/70 text-sm font-semibold" style={{fontFamily:'Outfit'}}>Log de actividad global</p>
        <div className="flex gap-2">
          {['info','warn','error'].map(l => (
            <span key={l} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${levelStyle[l]}`}>{l.toUpperCase()}</span>
          ))}
        </div>
      </div>
      <div className="divide-y divide-white/5">
        {LOGS.map((l, i) => (
          <div key={i} className="flex items-start gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${levelStyle[l.level]}`}>
              {l.level.toUpperCase()}
            </span>
            <span className="text-white/25 text-xs font-mono shrink-0 mt-0.5 w-20">{l.ts.split(' ')[1]}</span>
            <div className="flex-1 min-w-0">
              <span className="text-white/70 text-xs">{l.event}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-white/30 text-xs">{l.clinic}</span>
                <span className="text-white/15 text-xs">·</span>
                <span className="text-white/25 text-xs font-mono">{l.user}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export default function SuperAdminPortal({ onLogout }: Props) {
  const [active, setActive] = useState<Section>('overview')

  const pendingCount = SOLICITUDES_INIT.filter(s => s.status === 'pending').length

  const TITLE: Record<Section, string> = {
    overview:    'Resumen global',
    clinicas:    'Gestión de clínicas',
    solicitudes: 'Solicitudes de cambio de plan',
    ingresos:    'Ingresos y MRR',
    logs:        'Log de actividad',
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 flex flex-col border-r border-white/8" style={{background:'linear-gradient(to bottom, #1C1917, #0C0A09)'}}>

        {/* Brand */}
        <div className="px-4 py-5 border-b border-white/8">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold" style={{fontFamily:'Outfit'}}>S</div>
            <div>
              <p className="text-white text-xs font-bold tracking-wide" style={{fontFamily:'Outfit'}}>CORONYX</p>
              <p className="text-amber-400/80 text-[10px] font-semibold">SUPER ADMIN</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 py-4">
          <p className="text-white/20 text-[10px] font-semibold uppercase tracking-widest px-2 mb-2" style={{fontFamily:'Outfit'}}>Plataforma</p>
          {NAV.map(item => {
            const isActive = active === item.id
            return (
              <button key={item.id} onClick={() => setActive(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all relative text-left ${
                  isActive ? 'bg-amber-500/15 text-amber-400' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}>
                <SvgIcon d={item.icon} />
                <span className="font-medium flex-1">{item.label}</span>
                {item.id === 'solicitudes' && pendingCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">{pendingCount}</span>
                )}
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r bg-amber-400" />}
              </button>
            )
          })}
        </nav>

        {/* User row */}
        <div className="p-3 border-t border-white/8 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">SA</div>
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-xs font-medium truncate">Super Admin</p>
            <p className="text-white/25 text-xs truncate">admin@coronyx.io</p>
          </div>
          <button onClick={onLogout} className="text-white/20 hover:text-white/60 transition-colors text-xs" title="Cerrar sesión">⏏</button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-12 border-b border-white/8 bg-slate-900/50 flex items-center px-5 gap-4 shrink-0">
          <h2 className="text-white/80 text-sm font-semibold" style={{fontFamily:'Outfit'}}>{TITLE[active]}</h2>
          <div className="flex-1" />
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shrink-0" />
            <span className="text-amber-400/80 text-xs font-medium">Modo administración global</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {active === 'overview'    && <SectionOverview />}
          {active === 'clinicas'    && <SectionClinicas />}
          {active === 'solicitudes' && <SectionSolicitudes />}
          {active === 'ingresos'    && <SectionIngresos />}
          {active === 'logs'        && <SectionLogs />}
        </main>
      </div>
    </div>
  )
}
