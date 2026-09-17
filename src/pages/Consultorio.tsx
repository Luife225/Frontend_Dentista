import { useState } from 'react'

function Icon({ d, className='w-4 h-4' }: { d: string; className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={d}/></svg>
}
function fmt(n: number) { return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n) }

// ── Types ─────────────────────────────────────────────────────────────────────
type Role = 'ODONTOLOGO'|'RECEPCIONISTA'|'ADMIN_CLINICA'|'ASISTENTE'|'PACIENTE'
interface User {
  id: number; name: string; role: Role; email: string; specialty: string
  schedule: string; status: 'active'|'inactive'; phone: string
  document?: string; dob?: string
}

const ROLES: Role[] = ['ODONTOLOGO','RECEPCIONISTA','ASISTENTE','ADMIN_CLINICA','PACIENTE']
const ROLE_LABELS: Record<Role,string> = {
  ODONTOLOGO:'Odontólogo/a',
  RECEPCIONISTA:'Recepcionista',
  ASISTENTE:'Asistente dental',
  ADMIN_CLINICA:'Administrador/a',
  PACIENTE:'Paciente',
}
const SPECIALTIES = ['Odontología general','Ortodoncia','Endodoncia','Periodoncia','Cirugía maxilofacial','Pediatría dental','Estética dental','—']
const SCHEDULES = ['L-V 8:00-17:00','L-V 9:00-18:00','L-J 8:00-16:00','L-S 7:00-13:00','Ma-Sá 10:00-19:00']

const USERS_INIT: User[] = [
  { id:1, name:'Dr. Andrés Herrera',  role:'ODONTOLOGO',    email:'aherrera@coronyx.co', specialty:'Odontología general',  schedule:'L-V 8:00-17:00',  status:'active', phone:'+57 315 100 2000' },
  { id:2, name:'Dra. Laura Suárez',   role:'ODONTOLOGO',    email:'lsuarez@coronyx.co',  specialty:'Ortodoncia',           schedule:'L-J 9:00-18:00',  status:'active', phone:'+57 314 200 3001' },
  { id:3, name:'Dr. Carlos Mejía',    role:'ODONTOLOGO',    email:'cmejia@coronyx.co',   specialty:'Cirugía maxilofacial', schedule:'Ma-Sá 10:00-19:00',status:'active', phone:'+57 316 300 4002' },
  { id:4, name:'Paula Ríos',          role:'RECEPCIONISTA', email:'prios@coronyx.co',    specialty:'—',                   schedule:'L-V 8:00-17:00',  status:'active', phone:'+57 310 400 5003' },
  { id:5, name:'Valentina Gómez',     role:'ASISTENTE',     email:'vgomez@coronyx.co',   specialty:'—',                   schedule:'L-V 8:00-17:00',  status:'active', phone:'+57 311 500 6004' },
  { id:6, name:'Jorge Castillo',      role:'ADMIN_CLINICA', email:'jcastillo@coronyx.co',specialty:'—',                   schedule:'L-V 9:00-18:00',  status:'active', phone:'+57 312 600 7005' },
  { id:7, name:'Carlos Rivas',        role:'PACIENTE',      email:'carlos.rivas@gmail.com',specialty:'—',                 schedule:'—',               status:'active', phone:'+57 313 700 8006', document:'1023456789', dob:'1990-05-14' },
]


// ── Modals ────────────────────────────────────────────────────────────────────
const BLANK_USER = (): Omit<User,'id'> => ({ name:'', role:'ODONTOLOGO', email:'', specialty:SPECIALTIES[0], schedule:SCHEDULES[0], status:'active', phone:'', document:'', dob:'' })

function ModalUsuario({ user, onSave, onClose }: { user?: User; onSave: (u: Omit<User,'id'>) => void; onClose: () => void }) {
  const [form, setForm] = useState<Omit<User,'id'>>(user ? {...user} : BLANK_USER())
  const set = (k: string) => (e: { target: { value: string } }) => setForm(f=>({...f,[k]:e.target.value}))
  const isPaciente = form.role === 'PACIENTE'
  const isStaff = !isPaciente

  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50'

  const roleColors: Record<Role, string> = {
    ODONTOLOGO:'bg-cyan-500',RECEPCIONISTA:'bg-violet-500',ASISTENTE:'bg-emerald-500',ADMIN_CLINICA:'bg-slate-500',PACIENTE:'bg-amber-500',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>{user?'Editar usuario':'Crear nuevo usuario'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5"/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Role selector */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-2">Tipo de usuario *</label>
            <div className="grid grid-cols-3 gap-1.5">
              {ROLES.map(r => (
                <button key={r} onClick={() => setForm(f => ({...f, role:r, specialty: r === 'PACIENTE' || r === 'RECEPCIONISTA' || r === 'ASISTENTE' ? '—' : f.specialty, schedule: r === 'PACIENTE' ? '—' : f.schedule }))}
                  className={`py-2 px-2 rounded-xl text-[11px] font-semibold border-2 transition-all ${form.role===r?`border-transparent text-white ${roleColors[r]}`:'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Datos personales */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Nombre completo *</label>
            <input value={form.name} onChange={set('name')} className={inputCls} placeholder={isPaciente ? 'Nombre completo del paciente' : 'Dr./Dra. Nombre Apellido'}/>
          </div>

          {isPaciente && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Documento de identidad</label>
                <input value={form.document ?? ''} onChange={set('document')} className={inputCls} placeholder="CC / TI / Pasaporte"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Fecha de nacimiento</label>
                <input type="date" value={form.dob ?? ''} onChange={set('dob')} className={inputCls}/>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Correo electrónico *</label>
            <input type="email" value={form.email} onChange={set('email')} className={inputCls} placeholder={isPaciente ? 'paciente@correo.com' : 'usuario@clinica.co'}/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Teléfono</label>
              <input value={form.phone} onChange={set('phone')} className={inputCls} placeholder="+57..."/>
            </div>
            {isStaff && (
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Especialidad</label>
                <select value={form.specialty} onChange={set('specialty')} className={inputCls + ' bg-white'}>
                  {SPECIALTIES.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>

          {isStaff && (
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Horario de trabajo</label>
              <select value={form.schedule} onChange={set('schedule')} className={inputCls + ' bg-white'}>
                {SCHEDULES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          )}

          {/* Credentials hint */}
          {!user && (
            <div className="flex items-start gap-2 bg-cyan-50 rounded-xl p-3">
              <Icon d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5"/>
              <p className="text-[11px] text-cyan-700">Se enviará un correo a <strong>{form.email || 'la dirección indicada'}</strong> con las credenciales de acceso.</p>
            </div>
          )}

          {user && (
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Estado</label>
              <div className="flex gap-2">
                {(['active','inactive'] as const).map(s=>(
                  <button key={s} onClick={()=>setForm(f=>({...f,status:s}))}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${form.status===s?s==='active'?'border-emerald-500 bg-emerald-50 text-emerald-700':'border-rose-500 bg-rose-50 text-rose-700':'border-slate-200 text-slate-400'}`}>
                    {s==='active'?'Activo':'Inactivo'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button onClick={()=>onSave(form)} disabled={!form.name || !form.email}
            className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 disabled:opacity-40">
            {user?'Guardar cambios':'Crear usuario'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Usuarios ─────────────────────────────────────────────────────────────
function TabUsuarios() {
  const [users, setUsers] = useState(USERS_INIT)
  const [modal, setModal] = useState<'new'|'edit'|null>(null)
  const [editUser, setEditUser] = useState<User|undefined>()
  const [filterRole, setFilterRole] = useState<Role|'ALL'>('ALL')
  const [filterStatus, setFilterStatus] = useState<'all'|'active'|'inactive'>('all')
  const [search, setSearch] = useState('')

  const visible = users.filter(u => {
    if (filterRole !== 'ALL' && u.role !== filterRole) return false
    if (filterStatus !== 'all' && u.status !== filterStatus) return false
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function saveUser(u: Omit<User,'id'>) {
    if (editUser) {
      setUsers(us => us.map(x => x.id === editUser.id ? { ...u, id: editUser.id } : x))
    } else {
      setUsers(us => [...us, { ...u, id: Date.now() }])
    }
    setModal(null)
    setEditUser(undefined)
  }

  const roleColors: Record<Role, string> = {
    ODONTOLOGO:'bg-cyan-100 text-cyan-700',
    RECEPCIONISTA:'bg-violet-100 text-violet-700',
    ASISTENTE:'bg-emerald-100 text-emerald-700',
    ADMIN_CLINICA:'bg-slate-100 text-slate-700',
    PACIENTE:'bg-amber-100 text-amber-700',
  }

  return (
    <div className="space-y-4">
      {modal && (
        <ModalUsuario user={editUser} onSave={saveUser} onClose={()=>{setModal(null);setEditUser(undefined)}}/>
      )}

      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
          <div className="relative w-full">
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre o correo..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
            <span className="absolute left-3 top-2.5 text-slate-400">
              <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="w-3.5 h-3.5"/>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Role filter */}
          <select value={filterRole} onChange={e=>setFilterRole(e.target.value as Role|'ALL')}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none">
            <option value="ALL">Todos los roles</option>
            {ROLES.map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>

          {/* Status filter */}
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value as 'all'|'active'|'inactive')}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none">
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          <button onClick={()=>{setEditUser(undefined);setModal('new')}}
            className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-500 flex items-center gap-1.5 transition-colors">
            <Icon d="M12 4v16m8-8H4" className="w-3.5 h-3.5"/>
            Nuevo usuario
          </button>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left">
              {['Usuario / Nombre','Rol','Especialidad','Horario','Teléfono','Estado',''].map(h=>(
                <th key={h} className="text-xs font-semibold text-slate-400 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {visible.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800 text-sm">{u.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${roleColors[u.role]}`}>
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{u.specialty}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{u.schedule}</td>
                <td className="px-4 py-3 text-xs text-slate-500 font-mono">{u.phone}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.status==='active'?'bg-emerald-100 text-emerald-600':'bg-slate-100 text-slate-400'}`}>
                    {u.status==='active'?'Activo':'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={()=>{setEditUser(u);setModal('edit')}} className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold">Editar</button>
                    <button className="text-xs text-rose-400 hover:text-rose-600 font-semibold">Desactivar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">{visible.length} de {users.length} usuarios · {users.filter(u=>u.status==='active').length} activos</p>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
type ConsultTab = 'usuarios'|'clinica'|'integraciones'

export default function Consultorio() {
  const [tab, setTab] = useState<ConsultTab>('usuarios')

  const tabs: { id: ConsultTab; label: string }[] = [
    { id:'usuarios',      label:'Usuarios y roles' },
    { id:'clinica',       label:'Datos del consultorio' },
    { id:'integraciones', label:'Integraciones' },
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Sub-nav */}
      <div className="bg-white border-b border-slate-100 px-5 flex gap-1 shrink-0">
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${tab===t.id?'border-cyan-500 text-cyan-700':'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {tab==='usuarios' && <TabUsuarios/>}

        {tab==='clinica' && (
          <div className="max-w-2xl space-y-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4" style={{fontFamily:'Outfit'}}>Información del consultorio</p>
              <div className="grid grid-cols-2 gap-4">
                {[['Nombre del consultorio','Clínica Dental CORONYX'],['NIT','900.123.456-7'],['Teléfono','+57 601 456 7890'],['Email','info@coronyx.co'],['Ciudad','Bogotá, Colombia'],['Dirección','Cra. 15 # 93-47 Of. 301']].map(([l,v])=>(
                  <div key={l}>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">{l}</label>
                    <input defaultValue={v} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
                  </div>
                ))}
              </div>
              <button className="mt-4 px-5 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500">Guardar cambios</button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4" style={{fontFamily:'Outfit'}}>Boxes y salas</p>
              <div className="space-y-2">
                {['Box 1 — Odontología general','Box 2 — Cirugía','Box 3 — Ortodoncia','Box 4 — Multifuncional'].map(b=>(
                  <div key={b} className="flex items-center justify-between py-2 border-b border-slate-50">
                    <p className="text-sm text-slate-700">{b}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-emerald-100 text-emerald-600 font-bold px-2 py-0.5 rounded-full">Activo</span>
                      <button className="text-xs text-slate-400 hover:text-slate-600">Editar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab==='integraciones' && (
          <div className="max-w-2xl space-y-3">
            {[
              { name:'WhatsApp Business API', status:'active', desc:'Recordatorios y confirmaciones automáticas' },
              { name:'SIIGO Nube Contabilidad', status:'active', desc:'Sincronización de facturación electrónica' },
              { name:'Calendly', status:'inactive', desc:'Reserva de citas en línea desde su web' },
              { name:'Google Calendar', status:'inactive', desc:'Sincronización bidireccional de agenda' },
              { name:'Zoom',  status:'inactive', desc:'Videoconsultas alternativas a Teleodontología' },
            ].map(i=>(
              <div key={i.name} className="flex items-center gap-4 bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-sm transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 ${i.status==='active'?'bg-gradient-to-br from-cyan-400 to-cyan-700':'bg-slate-100 text-slate-400'}`}>
                  {i.name.slice(0,2)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-700 text-sm">{i.name}</p>
                  <p className="text-xs text-slate-400">{i.desc}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${i.status==='active'?'bg-emerald-100 text-emerald-600':'bg-slate-100 text-slate-400'}`}>
                  {i.status==='active'?'Conectado':'Desconectado'}
                </span>
                <button className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${i.status==='active'?'border-rose-200 text-rose-500 hover:bg-rose-50':'border-cyan-200 text-cyan-600 hover:bg-cyan-50'}`}>
                  {i.status==='active'?'Desconectar':'Conectar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
