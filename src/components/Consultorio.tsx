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

const PLANS = [
  { id:'starter', name:'Starter', price:450000, color:'#64748B', features:['1 consultorio','2 usuarios','15 GB almacenamiento','Sin asistente IA'] },
  { id:'pro',     name:'Clínicas Pro', price:980000, color:'#1E8C82', features:['5 consultorios','15 usuarios','100 GB DICOM','Asistente IA incluido','Reportes avanzados'] },
  { id:'enterprise', name:'Enterprise', price:2490000, color:'#7C3AED', features:['Ilimitado','Usuarios ilimitados','1 TB DICOM','IA prioritaria','SLA 99.9%','Soporte 24/7'] },
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

function ModalSolicitarPlan({ currentPlan, onClose }: { currentPlan: string; onClose: () => void }) {
  const [sel, setSel] = useState(currentPlan)
  const [reason, setReason] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  function submit() {
    if (sel === currentPlan || !reason.trim()) return
    setSending(true)
    setTimeout(() => { setSending(false); setSent(true) }, 1000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>Solicitar cambio de plan</h2>
            <p className="text-xs text-slate-400 mt-0.5">Tu solicitud será revisada y aprobada por el equipo CORONYX</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5"/></button>
        </div>

        <div className="px-6 py-5">
          {sent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-8 h-8 text-amber-600"/>
              </div>
              <p className="font-bold text-slate-800 text-lg mb-2" style={{fontFamily:'Outfit'}}>¡Solicitud enviada!</p>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">Tu solicitud de cambio al plan <strong>{PLANS.find(p=>p.id===sel)?.name}</strong> fue enviada al panel de CORONYX y está pendiente de aprobación.</p>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mx-auto w-fit">
                <Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-3.5 h-3.5"/>
                Tiempo estimado de respuesta: 24–48 h
              </div>
              <button onClick={onClose} className="mt-5 px-5 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500">Entendido</button>
            </div>
          ) : (
            <>
              {/* Plan grid */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                {PLANS.map(p=>(
                  <button key={p.id} onClick={()=>setSel(p.id)}
                    className={`text-left p-4 rounded-2xl border-2 transition-all ${sel===p.id?'shadow-lg':'border-slate-200 hover:border-slate-300'}`}
                    style={sel===p.id?{borderColor:p.color}:{}}>
                    {p.id===currentPlan && (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full mb-2 inline-block">Plan actual</span>
                    )}
                    <p className="font-bold text-slate-800 text-sm mb-1" style={{fontFamily:'Outfit',color:sel===p.id?p.color:undefined}}>{p.name}</p>
                    <p className="font-bold text-lg" style={{color:p.color,fontFamily:'Outfit'}}>{fmt(p.price)}<span className="text-xs font-normal text-slate-400">/mes</span></p>
                    <ul className="mt-3 space-y-1">
                      {p.features.map(f=>(
                        <li key={f} className="text-xs text-slate-600 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full shrink-0" style={{backgroundColor:p.color}}/>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              {/* Reason */}
              {sel !== currentPlan && (
                <div className="mb-5">
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Motivo de la solicitud *</label>
                  <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50 resize-none"
                    placeholder="Ej: Necesitamos acceso a teleodontología y radiografías para nuestra segunda sede..."/>
                  <p className="text-[10px] text-slate-400 mt-1">Este mensaje será visible para el equipo CORONYX al revisar tu solicitud.</p>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button onClick={submit} disabled={sending || sel===currentPlan || !reason.trim()}
                  className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                  {sending && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                  {sending ? 'Enviando...' : `Solicitar plan ${PLANS.find(p=>p.id===sel)?.name}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ModalTarjeta({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ number:'', name:'', exp:'', cvv:'' })
  const [saved, setSaved] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>Actualizar tarjeta de pago</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5"/></button>
        </div>
        {saved ? (
          <div className="px-6 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <Icon d="M5 13l4 4L19 7" className="w-6 h-6 text-emerald-600"/>
            </div>
            <p className="font-bold text-slate-800">¡Tarjeta actualizada!</p>
            <button onClick={onClose} className="mt-3 text-xs text-cyan-600 font-semibold">Cerrar</button>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 space-y-4">
              {/* Card preview */}
              <div className="rounded-2xl h-28 relative overflow-hidden flex flex-col justify-between p-4" style={{background:'linear-gradient(135deg,#0B3D3A,#1E8C82)'}}>
                <div className="flex justify-between items-start">
                  <p className="text-white/60 text-xs font-semibold">CORONYX</p>
                  <div className="flex gap-1">
                    <div className="w-6 h-4 bg-amber-400 rounded opacity-80"/>
                    <div className="w-6 h-4 bg-amber-600 rounded opacity-60 -ml-2"/>
                  </div>
                </div>
                <div>
                  <p className="text-white font-mono text-base tracking-widest">{form.number||'•••• •••• •••• ••••'}</p>
                  <div className="flex justify-between mt-1">
                    <p className="text-white/70 text-xs">{form.name||'NOMBRE TITULAR'}</p>
                    <p className="text-white/70 text-xs">{form.exp||'MM/AA'}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Número de tarjeta</label>
                <input value={form.number} onChange={e=>setForm(f=>({...f,number:e.target.value}))} maxLength={19} placeholder="1234 5678 9012 3456" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Nombre del titular</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value.toUpperCase()}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Vencimiento</label>
                  <input value={form.exp} onChange={e=>setForm(f=>({...f,exp:e.target.value}))} placeholder="MM/AA" maxLength={5} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">CVV</label>
                  <input value={form.cvv} onChange={e=>setForm(f=>({...f,cvv:e.target.value}))} placeholder="•••" maxLength={4} type="password" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                <Icon d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" className="w-4 h-4 text-slate-400 shrink-0"/>
                <p className="text-[10px] text-slate-500">Pago cifrado con SSL. No almacenamos datos de tarjeta.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end">
              <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button onClick={()=>setSaved(true)} className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500">Guardar tarjeta</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Tab: Usuarios ─────────────────────────────────────────────────────────────
function TabUsuarios() {
  const [users, setUsers] = useState(USERS_INIT)
  const [modal, setModal] = useState<'new'|'edit'|null>(null)
  const [editUser, setEditUser] = useState<User|undefined>()
  const [search, setSearch] = useState('')

  function save(data: Omit<User,'id'>) {
    if(editUser) setUsers(us=>us.map(u=>u.id===editUser.id?{...data,id:editUser.id}:u))
    else setUsers(us=>[...us,{...data,id:Date.now()}])
    setModal(null); setEditUser(undefined)
  }

  const visible = users.filter(u=>u.name.toLowerCase().includes(search.toLowerCase())||u.email.includes(search))

  const roleColors: Record<Role,string> = {
    ODONTOLOGO:'bg-cyan-100 text-cyan-700',
    RECEPCIONISTA:'bg-violet-100 text-violet-700',
    ASISTENTE:'bg-emerald-100 text-emerald-700',
    ADMIN_CLINICA:'bg-slate-100 text-slate-600',
    PACIENTE:'bg-amber-100 text-amber-700',
  }

  return (
    <div className="space-y-4">
      {(modal==='new'||modal==='edit') && <ModalUsuario user={editUser} onSave={save} onClose={()=>{setModal(null);setEditUser(undefined)}}/>}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar usuario..." className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
        </div>
        <div className="flex-1"/>
        <button onClick={()=>setModal('new')} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl" style={{backgroundColor:'#1E8C82'}}>
          <Icon d="M12 4v16m8-8H4" className="w-4 h-4"/>
          + Crear nuevo usuario
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {['Usuario','Rol','Especialidad','Horario','Estado','Acciones'].map(h=>(
                <th key={h} className="text-left text-xs text-slate-400 font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map(u=>(
              <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {u.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 text-sm">{u.name}</p>
                      <p className="text-[10px] text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColors[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{u.specialty}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{u.schedule}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.status==='active'?'bg-emerald-100 text-emerald-600':'bg-slate-100 text-slate-400'}`}>
                    {u.status==='active'?'Activo':'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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

// ── Tab: Planes ───────────────────────────────────────────────────────────────
function TabPlanes() {
  const [modal, setModal] = useState<'solicitar'|'tarjeta'|null>(null)
  const currentPlan = 'pro'
  const plan = PLANS.find(p=>p.id===currentPlan)!

  const usage = { users:6, maxUsers:15, storage:38, maxStorage:100, ai:847, maxAi:1000 }

  return (
    <div className="space-y-5 max-w-3xl">
      {modal==='solicitar' && <ModalSolicitarPlan currentPlan={currentPlan} onClose={()=>setModal(null)}/>}
      {modal==='tarjeta' && <ModalTarjeta onClose={()=>setModal(null)}/>}

      {/* Current plan */}
      <div className="rounded-2xl border-2 p-6" style={{borderColor:plan.color, background:`${plan.color}08`}}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-bold text-xl" style={{color:plan.color,fontFamily:'Outfit'}}>{plan.name}</p>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">Plan activo</span>
            </div>
            <p className="text-slate-500 text-sm">{fmt(plan.price)}/mes · Renovación 01 Sep 2026</p>
          </div>
          <button onClick={()=>setModal('solicitar')} className="px-4 py-2 text-sm font-semibold border-2 rounded-xl transition-colors hover:opacity-90" style={{borderColor:plan.color,color:plan.color}}>
            Solicitar cambio de plan
          </button>
        </div>

        {/* Usage */}
        <div className="grid grid-cols-3 gap-4 mt-5">
          {[
            { label:'Usuarios', used:usage.users, max:usage.maxUsers, unit:'usuarios' },
            { label:'Almacenamiento DICOM', used:usage.storage, max:usage.maxStorage, unit:'GB' },
            { label:'Consultas IA', used:usage.ai, max:usage.maxAi, unit:'este mes' },
          ].map(u=>(
            <div key={u.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">{u.label}</span>
                <span className="font-semibold text-slate-700">{u.used}/{u.max} {u.unit}</span>
              </div>
              <div className="h-1.5 bg-white rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{width:`${(u.used/u.max)*100}%`,backgroundColor:plan.color}}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features list */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4" style={{fontFamily:'Outfit'}}>Incluido en tu plan</p>
        <div className="grid grid-cols-2 gap-2">
          {plan.features.map(f=>(
            <div key={f} className="flex items-center gap-2 text-sm text-slate-700">
              <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Icon d="M5 13l4 4L19 7" className="w-2.5 h-2.5 text-emerald-600"/>
              </span>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Payment method */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest" style={{fontFamily:'Outfit'}}>Método de pago</p>
          <button onClick={()=>setModal('tarjeta')} className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold">Actualizar tarjeta</button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center">
            <div className="flex gap-0.5">
              <div className="w-3 h-3 bg-amber-400 rounded-full opacity-80"/>
              <div className="w-3 h-3 bg-amber-600 rounded-full opacity-60 -ml-1.5"/>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Mastercard •••• 4521</p>
            <p className="text-xs text-slate-400">Vence 09/28</p>
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4" style={{fontFamily:'Outfit'}}>Historial de facturación</p>
        <div className="space-y-2">
          {[
            ['01/08/2026', 'Clínicas Pro — Agosto 2026', fmt(980000), 'Pagada'],
            ['01/07/2026', 'Clínicas Pro — Julio 2026',  fmt(980000), 'Pagada'],
            ['01/06/2026', 'Clínicas Pro — Junio 2026',  fmt(980000), 'Pagada'],
          ].map(([d,l,v,s])=>(
            <div key={d} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-700">{l}</p>
                <p className="text-xs text-slate-400">{d}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700">{v}</span>
                <span className="text-xs bg-emerald-100 text-emerald-600 font-semibold px-2 py-0.5 rounded-full">{s}</span>
                <button className="text-xs text-slate-400 hover:text-slate-600">
                  <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-3.5 h-3.5"/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
type ConsultTab = 'usuarios'|'planes'|'clinica'|'integraciones'

export default function Consultorio() {
  const [tab, setTab] = useState<ConsultTab>('usuarios')

  const tabs: { id: ConsultTab; label: string }[] = [
    { id:'usuarios',      label:'Usuarios y roles' },
    { id:'planes',        label:'Planes y suscripción' },
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
        {tab==='planes' && <TabPlanes/>}

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
