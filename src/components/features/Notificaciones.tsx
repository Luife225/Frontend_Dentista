import { useState } from 'react'

function Icon({ d, className='w-4 h-4' }: { d: string; className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={d}/></svg>
}

type Channel = 'WhatsApp'|'Email'|'SMS'
type NStatus = 'sent'|'delivered'|'read'|'failed'

interface Notif {
  id: number; patient: string; channel: Channel; type: string; date: string; time: string
  status: NStatus; message: string; retries?: number
}

const NOTIFS: Notif[] = [
  { id:1, patient:'Carlos Rivas', channel:'WhatsApp', type:'Recordatorio cita', date:'2026-08-23', time:'07:00', status:'sent', message:'Hola Carlos, le recordamos su cita mañana a las 10:30 para Extracción #38. Confirme respondiendo SI.' },
  { id:2, patient:'Sofía Martínez', channel:'WhatsApp', type:'Confirmación cita', date:'2026-08-23', time:'07:02', status:'read', message:'Hola Sofía, su cita del 15/09 a las 09:00 está confirmada. ¡Le esperamos!' },
  { id:3, patient:'Roberto Díaz', channel:'Email', type:'Recordatorio cita', date:'2026-08-23', time:'07:00', status:'failed', message:'Estimado Roberto, le recordamos su cita mañana a las 14:00 para Endodoncia.', retries:2 },
  { id:4, patient:'Valentina Cruz', channel:'WhatsApp', type:'Resultado examen', date:'2026-08-22', time:'14:30', status:'read', message:'Valentina, sus radiografías están listas para revisión. Contáctenos para más información.' },
  { id:5, patient:'Ana Pérez', channel:'SMS', type:'Recordatorio cita', date:'2026-08-22', time:'08:00', status:'delivered', message:'Recordatorio CORONYX: cita hoy a las 08:30. Box 2, Dr. Herrera.' },
  { id:6, patient:'Jorge Salazar', channel:'WhatsApp', type:'Confirmación cita', date:'2026-08-21', time:'09:00', status:'read', message:'Jorge, confirmamos su cita urgencia mañana 08:28 a las 09:30.' },
  { id:7, patient:'María González', channel:'Email', type:'Cuenta y pago', date:'2026-08-20', time:'10:00', status:'sent', message:'María, adjuntamos su factura de limpieza realizada el 20/08. Total: $95.000 COP.' },
  { id:8, patient:'Luis Mendoza', channel:'WhatsApp', type:'Reactivación', date:'2026-08-18', time:'11:00', status:'failed', message:'Hola Luis, ha pasado tiempo desde su última visita. ¿Desea agendar una revisión?', retries:1 },
]

const TEMPLATES = [
  { label:'Recordatorio cita (1 día antes)', text:'Hola {{nombre}}, le recordamos su cita de mañana {{fecha}} a las {{hora}} para {{procedimiento}}. Confirme respondiendo SI. CORONYX Dental.' },
  { label:'Confirmación cita', text:'{{nombre}}, su cita del {{fecha}} a las {{hora}} ha sido confirmada. ¡Le esperamos en CORONYX Dental!' },
  { label:'Resultado de examen', text:'{{nombre}}, sus exámenes están listos. Contáctenos para revisarlos o visítenos en horario de atención.' },
  { label:'Reactivación de paciente', text:'Hola {{nombre}}, ha pasado tiempo desde su última visita. ¿Podemos ayudarle con una revisión? Escríbanos a este número.' },
  { label:'Mensaje personalizado', text:'' },
]

const PATIENTS = ['María González','Carlos Rivas','Sofía Martínez','Roberto Díaz','Ana Pérez','Valentina Cruz','Jorge Salazar','Luis Mendoza']
const CHANNEL_META: Record<Channel,{color:string;bg:string;icon:string}> = {
  WhatsApp: { color:'text-emerald-700', bg:'bg-emerald-100', icon:'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  Email:    { color:'text-blue-700', bg:'bg-blue-100', icon:'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  SMS:      { color:'text-slate-700', bg:'bg-slate-100', icon:'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
}
const STATUS_META: Record<NStatus,{label:string;color:string;bg:string}> = {
  sent:      { label:'Enviado',     color:'text-blue-600',    bg:'bg-blue-100' },
  delivered: { label:'Entregado',   color:'text-cyan-700',    bg:'bg-cyan-100' },
  read:      { label:'Leído',       color:'text-emerald-700', bg:'bg-emerald-100' },
  failed:    { label:'Fallido',     color:'text-rose-700',    bg:'bg-rose-100' },
}

// ── Modal Enviar recordatorio ─────────────────────────────────────────────────
function ModalEnviar({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ patient:'', channel:'WhatsApp' as Channel, template:0, message:'', date:'', time:'09:00' })
  const [sent, setSent] = useState(false)

  function handleTemplate(idx: number) {
    setForm(f=>({...f, template:idx, message:TEMPLATES[idx].text}))
  }

  function send() {
    setSent(true)
    setTimeout(()=>{ setSent(false); onClose() }, 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>+ Enviar recordatorio</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5"/></button>
        </div>

        {sent ? (
          <div className="px-6 py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Icon d="M5 13l4 4L19 7" className="w-7 h-7 text-emerald-600"/>
            </div>
            <p className="font-bold text-slate-800 text-lg mb-1" style={{fontFamily:'Outfit'}}>¡Mensaje enviado!</p>
            <p className="text-slate-500 text-sm">El recordatorio ha sido enviado al paciente.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Paciente</label>
                <select value={form.patient} onChange={e=>setForm(f=>({...f,patient:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                  <option value="">Seleccionar paciente...</option>
                  {PATIENTS.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-2">Canal de envío</label>
                <div className="flex gap-2">
                  {(['WhatsApp','Email','SMS'] as Channel[]).map(c=>(
                    <button key={c} onClick={()=>setForm(f=>({...f,channel:c}))}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${form.channel===c?'border-cyan-500 bg-cyan-50 text-cyan-700':'border-slate-200 text-slate-500'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Plantilla</label>
                <select value={form.template} onChange={e=>handleTemplate(+e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                  {TEMPLATES.map((t,i)=><option key={i} value={i}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Mensaje</label>
                <textarea value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  placeholder="Escriba o seleccione una plantilla..."/>
                <p className="text-[10px] text-slate-400 mt-1">Variables disponibles: {'{'}{'{'} nombre {'}'}{'}'}, {'{'}{'{'} fecha {'}'}{'}'}, {'{'}{'{'} hora {'}'}{'}'}, {'{'}{'{'} procedimiento {'}'}{'}'}.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Fecha de envío</label>
                  <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
                  <p className="text-[10px] text-slate-400 mt-1">Dejar vacío para enviar ahora</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Hora de envío</label>
                  <input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end shrink-0">
              <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button onClick={send} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-500">
                {form.date ? 'Programar envío' : 'Enviar ahora'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function Notificaciones() {
  const [notifs, setNotifs] = useState(NOTIFS)
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<NStatus|'all'>('all')
  const [filterChannel, setFilterChannel] = useState<Channel|'all'>('all')
  const [search, setSearch] = useState('')

  const metrics = {
    total:     notifs.length,
    sent:      notifs.filter(n=>n.status==='sent').length,
    delivered: notifs.filter(n=>n.status==='delivered').length,
    read:      notifs.filter(n=>n.status==='read').length,
    failed:    notifs.filter(n=>n.status==='failed').length,
  }

  const visible = notifs.filter(n => {
    if (filterStatus!=='all' && n.status!==filterStatus) return false
    if (filterChannel!=='all' && n.channel!==filterChannel) return false
    if (search && !n.patient.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function retry(id: number) {
    setNotifs(ns=>ns.map(n=>n.id===id?{...n,status:'sent',retries:undefined}:n))
  }

  return (
    <div className="p-5 space-y-5 max-w-5xl mx-auto">
      {showModal && <ModalEnviar onClose={()=>setShowModal(false)}/>}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-800 text-lg" style={{fontFamily:'Outfit'}}>Notificaciones y recordatorios</h2>
          <p className="text-xs text-slate-400 mt-0.5">Gestión de comunicaciones automáticas con pacientes</p>
        </div>
        <button onClick={()=>setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors" style={{backgroundColor:'#1E8C82'}}>
          <Icon d="M12 4v16m8-8H4" className="w-4 h-4"/>
          Enviar recordatorio
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { l:'Total enviados', v:metrics.total, c:'#1E8C82', bg:'bg-cyan-50' },
          { l:'Enviados',       v:metrics.sent,  c:'#2563EB', bg:'bg-blue-50' },
          { l:'Entregados',     v:metrics.delivered, c:'#0891B2', bg:'bg-cyan-50' },
          { l:'Leídos',         v:metrics.read,  c:'#059669', bg:'bg-emerald-50' },
          { l:'Fallidos',       v:metrics.failed,c:'#DC2626', bg:'bg-rose-50' },
        ].map(m=>(
          <div key={m.l} className={`${m.bg} rounded-2xl p-4`}>
            <p className="text-xs text-slate-500 mb-1">{m.l}</p>
            <p className="font-bold text-2xl" style={{color:m.c,fontFamily:'Outfit'}}>{m.v}</p>
            {m.l!=='Total enviados' && (
              <div className="h-1 bg-white/60 rounded-full mt-2 overflow-hidden">
                <div className="h-full rounded-full" style={{width:`${(m.v/metrics.total*100)||0}%`,backgroundColor:m.c}}/>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por paciente..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
        </div>
        <div className="flex gap-1.5">
          {(['all','sent','delivered','read','failed'] as const).map(s=>(
            <button key={s} onClick={()=>setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${filterStatus===s?'bg-cyan-600 text-white':'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {s==='all'?'Todos':STATUS_META[s as NStatus].label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(['all','WhatsApp','Email','SMS'] as const).map(c=>(
            <button key={c} onClick={()=>setFilterChannel(c as Channel|'all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${filterChannel===c?'bg-cyan-600 text-white':'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {c==='all'?'Todos los canales':c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {['Paciente','Canal','Tipo','Fecha y hora','Estado','Acciones'].map(h=>(
                <th key={h} className="text-left text-xs text-slate-400 font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map(n=>{
              const ch = CHANNEL_META[n.channel]
              const st = STATUS_META[n.status]
              return (
                <tr key={n.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3 font-semibold text-slate-700 text-sm">{n.patient}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 w-fit text-xs font-semibold px-2 py-1 rounded-lg ${ch.bg} ${ch.color}`}>
                      <Icon d={ch.icon} className="w-3 h-3"/>{n.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{n.type}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{n.date} · {n.time}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                    {n.retries && <span className="text-[10px] text-rose-400 ml-1">{n.retries} intento{n.retries>1?'s':''}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {n.status==='failed' && (
                        <button onClick={()=>retry(n.id)}
                          className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold">
                          <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" className="w-3.5 h-3.5"/>
                          Reintentar
                        </button>
                      )}
                      <button className="text-xs text-slate-400 hover:text-slate-600">
                        <Icon d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            <Icon d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" className="w-8 h-8 mx-auto mb-2 opacity-30"/>
            <p className="text-sm">No hay notificaciones con estos filtros</p>
          </div>
        )}
      </div>
    </div>
  )
}
