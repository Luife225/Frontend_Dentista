import { useState } from 'react'

interface UserItem {
  id: number
  name: string
  role: string
  email: string
  schedule: string
  status: 'active' | 'inactive'
  specialty?: string
}

const initialUsers: UserItem[] = [
  { id: 1, name: 'Dr. Carlos Herrera', role: 'Odontólogo', email: 'cherrera@clinica.co', schedule: 'L-V 8:00-17:00', status: 'active', specialty: 'Rehabilitación e Implantes' },
  { id: 2, name: 'Dra. Marcela Suárez', role: 'Odontóloga', email: 'msuarez@clinica.co', schedule: 'L-J 9:00-18:00', status: 'active', specialty: 'Ortodoncia y Estética' },
  { id: 3, name: 'Paula Ríos', role: 'Asistente', email: 'prios@clinica.co', schedule: 'L-V 8:00-17:00', status: 'active', specialty: 'Asistente Dental Quirúrgico' },
  { id: 4, name: 'Jorge Medina', role: 'Recepcionista', email: 'jmedina@clinica.co', schedule: 'L-S 8:00-13:00', status: 'active', specialty: 'Recepción y Caja' },
  { id: 5, name: 'Administrador General', role: 'Admin sistema', email: 'admin@clinica.co', schedule: 'L-V 8:00-18:00', status: 'active', specialty: 'Gerencia Clínica' },
]

const tabs = ['General', 'Usuarios', 'Horarios', 'Planes y suscripción', 'Notificaciones']

const INVOICES = [
  { id: 'INV-2026-08', date: '15 Ago 2026', amount: '$189.000 COP', plan: 'Plan Clínicas Pro', status: 'Pagado' },
  { id: 'INV-2026-07', date: '15 Jul 2026', amount: '$189.000 COP', plan: 'Plan Clínicas Pro', status: 'Pagado' },
  { id: 'INV-2026-06', date: '15 Jun 2026', amount: '$189.000 COP', plan: 'Plan Clínicas Pro', status: 'Pagado' },
]

export default function Consultorio() {
  const [tab, setTab] = useState('General')
  const [usersList, setUsersList] = useState<UserItem[]>(initialUsers)
  const [editingGeneral, setEditingGeneral] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  // User modals state
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  
  // Subscription modals
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [currentPlan, setCurrentPlan] = useState('Plan Clínicas Pro')

  // New user form state
  const [nuName, setNuName] = useState('')
  const [nuEmail, setNuEmail] = useState('')
  const [nuRole, setNuRole] = useState('Odontólogo')
  const [nuSpecialty, setNuSpecialty] = useState('Odontología General')
  const [nuSchedule, setNuSchedule] = useState('L-V 8:00-17:00')

  function handleCreateUser() {
    if (!nuName.trim() || !nuEmail.trim()) return

    const newUser: UserItem = {
      id: Date.now(),
      name: nuName.trim(),
      email: nuEmail.trim(),
      role: nuRole,
      specialty: nuSpecialty,
      schedule: nuSchedule,
      status: 'active',
    }

    setUsersList([...usersList, newUser])
    setShowCreateUserModal(false)
    setNuName('')
    setNuEmail('')
    setToastMsg(`Usuario ${newUser.name} creado exitosamente con rol ${newUser.role}.`)
    setTimeout(() => setToastMsg(''), 4000)
  }

  function handleSaveEditUser() {
    if (!editingUser) return
    setUsersList(prev => prev.map(u => u.id === editingUser.id ? editingUser : u))
    setToastMsg(`Datos de ${editingUser.name} actualizados.`)
    setEditingUser(null)
    setTimeout(() => setToastMsg(''), 3500)
  }

  return (
    <div className="p-6 space-y-5 fade-in relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-teal-500/40 fade-in">
          <span className="text-emerald-400 font-bold text-lg">✓</span>
          <div>
            <p className="font-semibold text-xs text-white" style={{ fontFamily: 'Outfit' }}>Configuración Actualizada</p>
            <p className="text-xs text-slate-300">{toastMsg}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900" style={{ fontFamily: 'Outfit' }}>Configuración de la Clínica</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gestión de sede, equipo de trabajo, suscripción CORONYX y parámetros clínicos</p>
        </div>
        {editingGeneral && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditingGeneral(false)}
              className="px-3.5 py-1.5 text-xs sm:text-sm border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium">
              Cancelar
            </button>
            <button
              onClick={() => {
                setEditingGeneral(false)
                setToastMsg('Datos generales de la clínica guardados.')
                setTimeout(() => setToastMsg(''), 3000)
              }}
              className="px-4 py-1.5 text-xs sm:text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 font-semibold shadow-sm">
              Guardar cambios
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === t ? 'border-cyan-600 text-cyan-700 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* TAB 1: General */}
      {tab === 'General' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900" style={{ fontFamily: 'Outfit' }}>Datos institucionales</h2>
              <button
                onClick={() => setEditingGeneral(!editingGeneral)}
                className="text-xs text-cyan-700 hover:text-cyan-800 font-semibold underline underline-offset-2">
                {editingGeneral ? 'Descartar' : 'Editar información'}
              </button>
            </div>
            {[
              { label: 'Nombre de la clínica', val: 'Clínica Dental Herrera & Asociados' },
              { label: 'NIT / Registro tributario', val: '900.456.123-1' },
              { label: 'Dirección física', val: 'Cra. 15 #93-47 Of. 502, Bogotá, Colombia' },
              { label: 'Teléfono de contacto', val: '+57 (601) 234-5678 / +57 315 987 6543' },
              { label: 'Correo institucional', val: 'info@clinicaherrera.co' },
              { label: 'Sitio web', val: 'www.clinicaherrera.co' },
            ].map(({ label, val }) => (
              <div key={label} className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">{label}</label>
                {editingGeneral ? (
                  <input
                    defaultValue={val}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-700">{val}</p>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'Outfit' }}>Horario de atención al público</h3>
              {[
                { day: 'Lunes – Viernes', hours: '8:00 – 18:00' },
                { day: 'Sábado', hours: '8:00 – 13:00' },
                { day: 'Domingo y Festivos', hours: 'Cerrado (Urgencias telefónicas)' },
              ].map(({ day, hours }) => (
                <div key={day} className="flex justify-between py-2.5 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-600">{day}</span>
                  <span className={`text-sm font-semibold ${hours.includes('Cerrado') ? 'text-slate-400' : 'text-slate-800'}`}>{hours}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-3" style={{ fontFamily: 'Outfit' }}>Consultorios / Sillones Odontológicos</h3>
              {[
                { name: 'Box 1 — Principal', equip: 'Unidad dental eléctrica + RX periapical digital', status: 'Activo' },
                { name: 'Box 2 — Estética & Higiene', equip: 'Unidad dental + lámpara blanqueamiento LED', status: 'Activo' },
                { name: 'Box 3 — Ortodoncia & Cirugía', equip: 'Unidad dental quirúrgica con ultrasonido', status: 'Activo' },
              ].map(({ name, equip, status }) => (
                <div key={name} className="flex items-start justify-between py-2.5 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{name}</p>
                    <p className="text-xs text-slate-400">{equip}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${status === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Usuarios */}
      {tab === 'Usuarios' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-semibold text-slate-900" style={{ fontFamily: 'Outfit' }}>Equipo y Usuarios del Sistema</h2>
              <p className="text-xs text-slate-400">Control de accesos para odontólogos, asistentes y recepción</p>
            </div>
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="flex items-center gap-1.5 text-xs sm:text-sm px-4 py-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors font-semibold shadow-sm">
              <span>+</span> Crear nuevo usuario
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Usuario / Nombre', 'Rol', 'Especialidad', 'Email institucional', 'Horario', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {usersList.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 block text-xs sm:text-sm">{u.name}</span>
                        <span className="text-[11px] text-slate-400">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      u.role.includes('Odonto') ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                      u.role.includes('Admin') ? 'bg-slate-100 text-slate-800' :
                      'bg-violet-50 text-violet-700 border border-violet-200'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">{u.specialty || 'General'}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">{u.email}</td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">{u.schedule}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full font-medium">Activo</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="text-xs text-cyan-700 hover:text-cyan-900 font-semibold underline underline-offset-2">
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Horarios */}
      {tab === 'Horarios' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 text-base" style={{ fontFamily: 'Outfit' }}>Configuración de Turnos y Agendas</h2>
          <p className="text-xs text-slate-500">Define los intervalos de consulta predeterminados y duración de citas.</p>
          <div className="grid sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Duración estándar de cita</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none">
                <option>30 minutos</option>
                <option>45 minutos (Recomendado)</option>
                <option>60 minutos</option>
              </select>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Hora de inicio de atención</label>
              <input type="time" defaultValue="08:00" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none" />
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Hora de cierre de atención</label>
              <input type="time" defaultValue="18:00" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none" />
            </div>
          </div>
          <button
            onClick={() => {
              setToastMsg('Horarios clínicos guardados.')
              setTimeout(() => setToastMsg(''), 3000)
            }}
            className="px-5 py-2.5 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-700 transition-colors">
            Guardar configuración de horarios
          </button>
        </div>
      )}

      {/* TAB 4: Planes y suscripción (ADMIN_CLINICA) */}
      {tab === 'Planes y suscripción' && (
        <div className="space-y-6">
          {/* Main Plan Card */}
          <div className="bg-gradient-to-br from-[#0B3D3A] via-[#115952] to-[#1E8C82] rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
              <div>
                <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-xs px-3 py-1 rounded-full font-semibold">
                  Suscripción Activa
                </span>
                <h2 className="text-2xl font-bold mt-2" style={{ fontFamily: 'Outfit' }}>{currentPlan}</h2>
                <p className="text-teal-100 text-xs mt-0.5">Licencia institucional para Clínicas Dentales</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold" style={{ fontFamily: 'Outfit' }}>$189.000 <span className="text-xs font-normal text-teal-200">COP / mes</span></p>
                <p className="text-teal-200 text-xs mt-1">Próxima renovación: 15 Sep 2026</p>
              </div>
            </div>

            {/* Resources meter */}
            <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <div className="bg-white/10 rounded-xl p-3.5 backdrop-blur-sm">
                <p className="text-teal-200 text-xs font-medium">Odontólogos activos</p>
                <p className="text-lg font-bold text-white mt-1">5 de 10 usuarios</p>
                <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: '50%' }} />
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-3.5 backdrop-blur-sm">
                <p className="text-teal-200 text-xs font-medium">Almacenamiento RX / DICOM</p>
                <p className="text-lg font-bold text-white mt-1">14.2 GB / Ilimitado</p>
                <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-teal-300 h-full rounded-full" style={{ width: '15%' }} />
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-3.5 backdrop-blur-sm">
                <p className="text-teal-200 text-xs font-medium">Asistente IA Dental</p>
                <p className="text-lg font-bold text-white mt-1">Dictado y Análisis ML Activos</p>
                <span className="text-[11px] text-emerald-300 font-semibold">✓ Sin límite de consultas</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-5 py-2.5 bg-white text-teal-900 rounded-xl text-xs font-bold hover:bg-teal-50 transition-all shadow-md">
                Cambiar de Plan
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-semibold transition-all">
                Gestionar método de pago
              </button>
            </div>
          </div>

          {/* Payment & Invoices Section */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Payment method */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-slate-800 text-sm mb-3" style={{ fontFamily: 'Outfit' }}>Método de pago registrado</h3>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 mb-4">
                <div className="w-10 h-7 bg-blue-900 text-white text-[10px] font-bold rounded flex items-center justify-center tracking-wider">
                  VISA
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800">Visa terminada en •••• 4242</p>
                  <p className="text-[11px] text-slate-400">Vence 09/2028 · Débito automático</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-colors">
                Actualizar tarjeta
              </button>
            </div>

            {/* Invoices list */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-slate-800 text-sm mb-3" style={{ fontFamily: 'Outfit' }}>Facturas y Recibos de Suscripción</h3>
              <div className="divide-y divide-slate-100 text-xs">
                {INVOICES.map(inv => (
                  <div key={inv.id} className="py-3 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-semibold text-slate-800">{inv.id} — {inv.plan}</p>
                      <p className="text-slate-400">{inv.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-700 font-mono">{inv.amount}</span>
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">{inv.status}</span>
                      <button
                        onClick={() => {
                          setToastMsg(`Descargando factura ${inv.id}...`)
                          setTimeout(() => setToastMsg(''), 2500)
                        }}
                        className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 rounded-lg text-cyan-700 font-semibold">
                        PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Notificaciones */}
      {tab === 'Notificaciones' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 text-base" style={{ fontFamily: 'Outfit' }}>Canales y Automatizaciones</h2>
          <p className="text-xs text-slate-500">Configura la integración de WhatsApp Business API y servidor de correo para recordatorios automáticos.</p>
          <div className="space-y-3 pt-2">
            {[
              { name: 'WhatsApp Business Cloud API', desc: 'Envío automático de recordatorios 24h y 2h antes de la cita', status: 'Conectado' },
              { name: 'Servidor de Correo SMTP / Resend', desc: 'Envío de consentimientos informados, historias y facturas', status: 'Conectado' },
              { name: 'Gateway SMS de Respaldo', desc: 'Para pacientes sin acceso a datos o WhatsApp', status: 'Inactivo' },
            ].map(int => (
              <div key={int.name} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{int.name}</p>
                  <p className="text-xs text-slate-400">{int.desc}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${int.status === 'Conectado' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600'}`}>
                  {int.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal: Crear Nuevo Usuario ── */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden fade-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>
                Crear nuevo usuario clínico
              </h2>
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center text-xl leading-none transition-colors">
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4 flex-1">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Nombre completo del profesional *</label>
                <input
                  type="text"
                  value={nuName}
                  onChange={e => setNuName(e.target.value)}
                  placeholder="Ej: Dra. Andrea Castro Ramos"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Correo institucional *</label>
                  <input
                    type="email"
                    value={nuEmail}
                    onChange={e => setNuEmail(e.target.value)}
                    placeholder="acastro@clinica.co"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Rol en la clínica</label>
                  <select
                    value={nuRole}
                    onChange={e => setNuRole(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-white">
                    <option value="Odontólogo">Odontólogo / Especialista</option>
                    <option value="Odontóloga">Odontóloga / Especialista</option>
                    <option value="Asistente">Asistente Dental</option>
                    <option value="Recepcionista">Recepcionista</option>
                    <option value="Admin sistema">Administrador Clínico</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Especialidad o área</label>
                  <input
                    type="text"
                    value={nuSpecialty}
                    onChange={e => setNuSpecialty(e.target.value)}
                    placeholder="Ej: Ortodoncia, Periodoncia..."
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Horario asignado</label>
                  <input
                    type="text"
                    value={nuSchedule}
                    onChange={e => setNuSchedule(e.target.value)}
                    placeholder="L-V 8:00-17:00"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              </div>

              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-cyan-800">
                ℹ️ Al crear el usuario, se le enviará un correo con su contraseña temporal y enlace de acceso al portal institucional de CORONYX.
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-100 transition-colors font-medium">
                Cancelar
              </button>
              <button
                onClick={handleCreateUser}
                className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
                Crear nuevo usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Editar Usuario ── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden fade-in flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>
                Editar usuario: {editingUser.name}
              </h2>
              <button
                onClick={() => setEditingUser(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center text-lg leading-none transition-colors">
                ×
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Nombre</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Rol</label>
                <input
                  type="text"
                  value={editingUser.role}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Horario</label>
                <input
                  type="text"
                  value={editingUser.schedule}
                  onChange={e => setEditingUser({ ...editingUser, schedule: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
            </div>
            <div className="flex gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-100">
                Cancelar
              </button>
              <button
                onClick={handleSaveEditUser}
                className="flex-1 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-700">
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Cambiar Plan ── */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden fade-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>
                Planes y Suscripciones CORONYX
              </h2>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center text-xl leading-none transition-colors">
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: 'Plan Individual', price: '$89.000', period: 'COP / mes', features: ['1 Odontólogo', 'Odontograma digital', 'Agenda básica', 'Hasta 300 pacientes'] },
                  { name: 'Plan Clínicas Pro', price: '$189.000', period: 'COP / mes', popular: true, features: ['Hasta 10 Odontólogos', 'Asistente IA de Voz', 'Teleodontología HD', 'Análisis Rx con ML', 'Inventario y Caja'] },
                  { name: 'Plan Red / Enterprise', price: '$349.000', period: 'COP / mes', features: ['Odontólogos Ilimitados', 'Multi-sede centralizada', 'API & Facturación DIAN', 'Soporte VIP 24/7'] },
                ].map(p => (
                  <div key={p.name} className={`p-4 rounded-2xl border flex flex-col justify-between ${p.popular ? 'border-teal-500 bg-teal-50/30 ring-2 ring-teal-500/20' : 'border-slate-200 bg-white'}`}>
                    <div>
                      {p.popular && <span className="bg-teal-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Actual</span>}
                      <h4 className="font-bold text-slate-800 text-sm mt-1" style={{ fontFamily: 'Outfit' }}>{p.name}</h4>
                      <p className="text-xl font-extrabold text-slate-900 mt-2" style={{ fontFamily: 'Outfit' }}>{p.price} <span className="text-[10px] font-normal text-slate-400">{p.period}</span></p>
                      <ul className="space-y-1.5 mt-3 text-xs text-slate-600">
                        {p.features.map(f => <li key={f} className="flex items-center gap-1.5"><span>✓</span><span>{f}</span></li>)}
                      </ul>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentPlan(p.name)
                        setShowUpgradeModal(false)
                        setToastMsg(`Plan actualizado a ${p.name}.`)
                        setTimeout(() => setToastMsg(''), 3000)
                      }}
                      className={`w-full mt-4 py-2 rounded-xl text-xs font-semibold transition-colors ${p.name === currentPlan ? 'bg-slate-200 text-slate-700 cursor-default' : 'bg-cyan-600 text-white hover:bg-cyan-700'}`}>
                      {p.name === currentPlan ? 'Plan Actual' : 'Seleccionar'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Gestionar Pago ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden fade-in flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>
                Actualizar tarjeta de crédito
              </h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center text-lg leading-none transition-colors">
                ×
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Nombre en la tarjeta</label>
                <input placeholder="Dr. Carlos Herrera" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Número de tarjeta</label>
                <input placeholder="•••• •••• •••• 4242" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Expiración (MM/AA)</label>
                  <input placeholder="09/28" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-center" />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">CVC / CVV</label>
                  <input placeholder="•••" maxLength={4} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-center" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-100">
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setToastMsg('Método de pago actualizado exitosamente.')
                  setTimeout(() => setToastMsg(''), 3000)
                }}
                className="flex-1 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-700">
                Guardar tarjeta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
