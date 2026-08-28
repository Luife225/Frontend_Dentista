import { useState } from 'react'

// ── Types & data ──────────────────────────────────────────────────────────────
const HOUR_START = 8
const HOUR_END   = 19
const TOTAL_H    = HOUR_END - HOUR_START

interface Cita {
  id: number; patientId: number; patient: string; doc: string
  day: number   // 0=Mon … 4=Fri
  hour: number; minute: number; duration: number // minutes
  procedure: string; doctor: string; box: string; type: 'Presencial'|'Virtual'
  status: 'confirmed'|'pending'|'completed'|'cancelled'
  phone: string; email: string; notes: string
}

const PROC_COLORS: Record<string,string> = {
  'Ortodoncia':   '#7C3AED',
  'Endodoncia':   '#DC2626',
  'Extracción':   '#D97706',
  'Limpieza':     '#1E8C82',
  'Restauración': '#0369A1',
  'Control':      '#059669',
  'Urgencia':     '#BE123C',
  'Implante':     '#9333EA',
}
function procColor(proc: string) {
  for(const [k,v] of Object.entries(PROC_COLORS)) { if(proc.includes(k)) return v }
  return '#64748B'
}

const CITAS: Cita[] = [
  { id:1, patientId:1, patient:'María González', doc:'52.453.121', day:0, hour:9, minute:0, duration:60, procedure:'Limpieza ultrasónica', doctor:'Dr. Herrera', box:'Box 1', type:'Presencial', status:'confirmed', phone:'+57 320 455 1234', email:'maria@gmail.com', notes:'' },
  { id:2, patientId:2, patient:'Carlos Rivas', doc:'1.015.672.340', day:0, hour:10, minute:30, duration:90, procedure:'Extracción #38', doctor:'Dr. Herrera', box:'Box 2', type:'Presencial', status:'confirmed', phone:'+57 310 455 7821', email:'carlos@gmail.com', notes:'Diabético, revisar glicemia' },
  { id:3, patientId:3, patient:'Sofía Martínez', doc:'43.876.521', day:1, hour:9, minute:0, duration:45, procedure:'Ortodoncia ajuste', doctor:'Dra. Suárez', box:'Box 3', type:'Presencial', status:'confirmed', phone:'+57 300 111 2222', email:'sofia@gmail.com', notes:'' },
  { id:4, patientId:4, patient:'Roberto Díaz', doc:'79.654.320', day:1, hour:14, minute:0, duration:120, procedure:'Endodoncia #16', doctor:'Dr. Herrera', box:'Box 1', type:'Presencial', status:'pending', phone:'+57 315 555 6677', email:'roberto@gmail.com', notes:'Bruxismo severo' },
  { id:5, patientId:5, patient:'Ana Pérez', doc:'31.456.789', day:2, hour:8, minute:30, duration:30, procedure:'Control post-op', doctor:'Dr. Herrera', box:'Box 2', type:'Presencial', status:'confirmed', phone:'+57 311 444 5566', email:'ana@gmail.com', notes:'' },
  { id:6, patientId:6, patient:'Luis Mendoza', doc:'12.345.678', day:2, hour:10, minute:0, duration:60, procedure:'Restauración #14', doctor:'Dr. Mejía', box:'Box 3', type:'Presencial', status:'pending', phone:'+57 320 777 8899', email:'luis@gmail.com', notes:'' },
  { id:7, patientId:3, patient:'Sofía Martínez', doc:'43.876.521', day:3, hour:11, minute:0, duration:30, procedure:'Control ortodoncia', doctor:'Dra. Suárez', box:'Box 3', type:'Virtual', status:'confirmed', phone:'+57 300 111 2222', email:'sofia@gmail.com', notes:'' },
  { id:8, patientId:7, patient:'Valentina Cruz', doc:'55.321.654', day:3, hour:15, minute:0, duration:90, procedure:'Implante — fase 1', doctor:'Dr. Mejía', box:'Box 1', type:'Presencial', status:'confirmed', phone:'+57 312 000 1234', email:'vale@gmail.com', notes:'Sin anticoagulantes 5 días antes' },
  { id:9, patientId:8, patient:'Jorge Salazar', doc:'88.123.456', day:4, hour:9, minute:30, duration:60, procedure:'Urgencia dental', doctor:'Dr. Herrera', box:'Box 2', type:'Presencial', status:'confirmed', phone:'+57 316 888 9900', email:'jorge@gmail.com', notes:'Dolor agudo' },
  { id:10, patientId:1, patient:'María González', doc:'52.453.121', day:4, hour:16, minute:0, duration:60, procedure:'Limpieza — seguimiento', doctor:'Dr. Herrera', box:'Box 1', type:'Presencial', status:'pending', phone:'+57 320 455 1234', email:'maria@gmail.com', notes:'' },
]

const DOCTORS = ['Dr. Andrés Herrera', 'Dra. Laura Suárez', 'Dr. Carlos Mejía']
const BOXES = ['Box 1', 'Box 2', 'Box 3', 'Box 4']
const PROCS = ['Limpieza ultrasónica','Extracción','Ortodoncia ajuste','Control ortodoncia','Endodoncia','Implante — fase 1','Restauración','Control post-op','Urgencia dental','Evaluación inicial']
const DAYS_SHORT = ['Lun','Mar','Mié','Jue','Vie']
const DAYS_LONG  = ['Lunes','Martes','Miércoles','Jueves','Viernes']
const WEEK_DATES = [24,25,26,27,28] // Aug 2026

function Icon({ d, className='w-4 h-4' }: { d: string; className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={d}/></svg>
}

// ── Modal + Nueva Cita ────────────────────────────────────────────────────────
function ModalNuevaCita({ cita, onSave, onClose }: { cita?: Partial<Cita>; onSave: (c: Omit<Cita,'id'>) => void; onClose: () => void }) {
  const [form, setForm] = useState<Omit<Cita,'id'>>({
    patientId: 0, patient: cita?.patient??'', doc: '', day: cita?.day??0,
    hour: cita?.hour??9, minute: 0, duration: 60, procedure: PROCS[0],
    doctor: DOCTORS[0], box: BOXES[0], type: 'Presencial', status: 'pending',
    phone:'', email:'', notes: '',
    ...cita,
  })

  const minutes = [0,15,30,45]
  const durations = [30,45,60,75,90,105,120]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>+ Nueva cita</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5"/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Patient */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Paciente</label>
            <input value={form.patient} onChange={e=>setForm(f=>({...f,patient:e.target.value}))} placeholder="Nombre del paciente..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Documento</label>
              <input value={form.doc} onChange={e=>setForm(f=>({...f,doc:e.target.value}))} placeholder="N° ID..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Teléfono</label>
              <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+57..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
            </div>
          </div>

          {/* Day + Time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Día</label>
              <select value={form.day} onChange={e=>setForm(f=>({...f,day:+e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                {DAYS_LONG.map((d,i)=><option key={i} value={i}>{d} {WEEK_DATES[i]}/08</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Hora</label>
              <select value={form.hour} onChange={e=>setForm(f=>({...f,hour:+e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                {Array.from({length:HOUR_END-HOUR_START},(_,i)=><option key={i} value={HOUR_START+i}>{String(HOUR_START+i).padStart(2,'0')}:00</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Minuto</label>
              <select value={form.minute} onChange={e=>setForm(f=>({...f,minute:+e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                {minutes.map(m=><option key={m} value={m}>{String(m).padStart(2,'0')}</option>)}
              </select>
            </div>
          </div>

          {/* Duration + type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Duración</label>
              <select value={form.duration} onChange={e=>setForm(f=>({...f,duration:+e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                {durations.map(d=><option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Modalidad</label>
              <div className="flex gap-2">
                {(['Presencial','Virtual'] as const).map(t=>(
                  <button key={t} onClick={()=>setForm(f=>({...f,type:t}))}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${form.type===t?'border-cyan-500 bg-cyan-50 text-cyan-700':'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Procedure + Doctor + Box */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Procedimiento</label>
            <select value={form.procedure} onChange={e=>setForm(f=>({...f,procedure:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
              {PROCS.map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Doctor</label>
              <select value={form.doctor} onChange={e=>setForm(f=>({...f,doctor:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                {DOCTORS.map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Box asignado</label>
              <select value={form.box} onChange={e=>setForm(f=>({...f,box:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                {BOXES.map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Notas (opcional)</label>
            <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/50" placeholder="Observaciones previas, indicaciones especiales..."/>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button onClick={()=>onSave(form)} className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500">Agendar cita</button>
        </div>
      </div>
    </div>
  )
}

// ── Panel lateral del paciente ────────────────────────────────────────────────
function PatientPanel({ cita, onClose, onEdit, onConfirm }: { cita: Cita; onClose: () => void; onEdit: () => void; onConfirm: (id: number) => void }) {
  const color = procColor(cita.procedure)
  const [confirming, setConfirming] = useState(false)

  function handleConfirm() {
    setConfirming(true)
    setTimeout(() => { onConfirm(cita.id); setConfirming(false) }, 700)
  }

  const statusMeta: Record<Cita['status'], { label: string; cls: string }> = {
    confirmed:  { label: 'Confirmada',  cls: 'bg-emerald-100 text-emerald-700' },
    pending:    { label: 'Pendiente',   cls: 'bg-amber-100 text-amber-700' },
    completed:  { label: 'Completada',  cls: 'bg-slate-100 text-slate-600' },
    cancelled:  { label: 'Cancelada',   cls: 'bg-rose-100 text-rose-600' },
  }

  return (
    <div className="w-72 shrink-0 flex flex-col bg-white border-l border-slate-100 shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100" style={{backgroundColor: color+'18'}}>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm truncate" style={{fontFamily:'Outfit'}}>{cita.patient}</p>
          <p className="text-xs text-slate-500">{cita.doc}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-2">
          <Icon d="M6 18L18 6M6 6l12 12" className="w-4 h-4"/>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="rounded-xl p-3" style={{backgroundColor: color+'12', borderLeft:`3px solid ${color}`}}>
          <p className="font-semibold text-sm" style={{color}}>{cita.procedure}</p>
          <p className="text-xs text-slate-500 mt-0.5">{DAYS_LONG[cita.day]} {WEEK_DATES[cita.day]}/08 · {String(cita.hour).padStart(2,'0')}:{String(cita.minute).padStart(2,'0')}</p>
          <p className="text-xs text-slate-400">{cita.duration} min · {cita.box}</p>
        </div>

        {[
          ['Doctor', cita.doctor],
          ['Modalidad', cita.type],
          ['Teléfono', cita.phone],
          ['Email', cita.email],
        ].filter(([,v])=>v).map(([l,v])=>(
          <div key={l} className="flex justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
            <span className="text-slate-500 text-xs">{l}</span>
            <span className="font-medium text-slate-700 text-xs text-right max-w-[150px] truncate">{v}</span>
          </div>
        ))}

        <div className="flex justify-between text-sm py-1.5">
          <span className="text-slate-500 text-xs">Estado</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusMeta[cita.status].cls}`}>{statusMeta[cita.status].label}</span>
        </div>

        {cita.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-700 mb-1">⚠ Notas</p>
            <p className="text-xs text-amber-800">{cita.notes}</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 space-y-2">
        {/* Confirmar — only when pending */}
        {cita.status === 'pending' && (
          <button onClick={handleConfirm} disabled={confirming}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{background:'linear-gradient(135deg,#1E8C82,#0B3D3A)'}}>
            {confirming ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
            ) : (
              <Icon d="M5 13l4 4L19 7" className="w-4 h-4"/>
            )}
            {confirming ? 'Confirmando...' : 'Confirmar cita'}
          </button>
        )}
        {cita.status === 'confirmed' && (
          <div className="w-full py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-1.5">
            <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-3.5 h-3.5"/>
            Cita confirmada
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onEdit} className="flex-1 py-2 text-xs font-semibold text-cyan-600 border border-cyan-200 rounded-xl hover:bg-cyan-50 transition-colors">Editar cita</button>
          <button className="flex-1 py-2 text-xs font-semibold text-white rounded-xl transition-colors" style={{backgroundColor:'#1E8C82'}}>Ver HC</button>
        </div>
      </div>
    </div>
  )
}

// ── Weekly calendar ───────────────────────────────────────────────────────────
function WeekView({ citas, onCitaClick, onSlotClick }: { citas: Cita[]; onCitaClick: (c: Cita) => void; onSlotClick: (day: number, hour: number) => void }) {
  const hours = Array.from({length: TOTAL_H}, (_,i) => HOUR_START + i)
  const CELL_H = 48 // px per hour

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-w-[700px]">
        {/* Header */}
        <div className="grid sticky top-0 z-10 bg-white border-b border-slate-200" style={{gridTemplateColumns:'48px repeat(5, 1fr)'}}>
          <div className="px-2 py-3"/>
          {DAYS_SHORT.map((d,i)=>(
            <div key={i} className="px-2 py-3 text-center border-l border-slate-100">
              <p className="text-xs text-slate-500">{d}</p>
              <p className="font-bold text-slate-800">{WEEK_DATES[i]}</p>
              <p className="text-[10px] text-slate-400">ago</p>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="relative grid" style={{gridTemplateColumns:'48px repeat(5, 1fr)'}}>
          {/* Time labels */}
          <div>
            {hours.map(h=>(
              <div key={h} className="flex items-start justify-end pr-2 text-[10px] text-slate-400 font-medium" style={{height:CELL_H}}>
                {String(h).padStart(2,'0')}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS_SHORT.map((_,dayIdx)=>(
            <div key={dayIdx} className="relative border-l border-slate-100" style={{height: TOTAL_H * CELL_H}}>
              {/* Hour rows */}
              {hours.map(h=>(
                <div key={h} onClick={()=>onSlotClick(dayIdx,h)} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors cursor-pointer" style={{height:CELL_H}}/>
              ))}
              {/* Appointments */}
              {citas.filter(c=>c.day===dayIdx).map(c=>{
                const topPct  = ((c.hour - HOUR_START) + c.minute / 60) / TOTAL_H * 100
                const heightPx = (c.duration / 60) * CELL_H
                const color = procColor(c.procedure)
                return (
                  <button key={c.id} onClick={e=>{e.stopPropagation();onCitaClick(c)}}
                    className="absolute left-1 right-1 rounded-lg overflow-hidden text-left shadow-sm hover:shadow-md transition-all group"
                    style={{ top:`${topPct}%`, height: Math.max(heightPx-4,22), backgroundColor: color+'20', borderLeft:`3px solid ${color}` }}>
                    <div className="px-1.5 py-1">
                      <p className="text-[10px] font-bold leading-tight truncate" style={{color}}>{c.procedure}</p>
                      <p className="text-[9px] text-slate-500 truncate">{c.patient}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Day view ─────────────────────────────────────────────────────────────────
function DayView({ dayIdx, citas, onCitaClick, onSlotClick }: { dayIdx: number; citas: Cita[]; onCitaClick: (c: Cita) => void; onSlotClick: (day: number, hour: number) => void }) {
  const hours = Array.from({length: TOTAL_H}, (_,i) => HOUR_START + i)
  const CELL_H = 64
  const dayCitas = citas.filter(c=>c.day===dayIdx)

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-w-0">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3">
          <p className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>{DAYS_LONG[dayIdx]}, {WEEK_DATES[dayIdx]} de agosto 2026</p>
          <p className="text-xs text-slate-400">{dayCitas.length} cita{dayCitas.length!==1?'s':''}</p>
        </div>
        <div className="relative grid" style={{gridTemplateColumns:'56px 1fr', minHeight: TOTAL_H * CELL_H}}>
          <div>
            {hours.map(h=>(
              <div key={h} className="flex items-start justify-end pr-2 pt-1 text-[10px] text-slate-400 font-medium" style={{height:CELL_H}}>
                {String(h).padStart(2,'0')}:00
              </div>
            ))}
          </div>
          <div className="relative border-l border-slate-100" style={{height: TOTAL_H * CELL_H}}>
            {hours.map(h=>(
              <div key={h} onClick={()=>onSlotClick(dayIdx,h)} className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer" style={{height:CELL_H}}/>
            ))}
            {dayCitas.map(c=>{
              const top = ((c.hour - HOUR_START) + c.minute / 60) / TOTAL_H * 100
              const h   = (c.duration / 60) * CELL_H
              const col = procColor(c.procedure)
              return (
                <button key={c.id} onClick={e=>{e.stopPropagation();onCitaClick(c)}}
                  className="absolute left-2 right-2 rounded-xl overflow-hidden text-left shadow-sm hover:shadow-md transition-all"
                  style={{ top:`${top}%`, height: Math.max(h-4,28), backgroundColor:col+'18', borderLeft:`4px solid ${col}` }}>
                  <div className="px-3 py-2">
                    <p className="text-xs font-bold" style={{color:col}}>{c.procedure}</p>
                    <p className="text-xs text-slate-600">{c.patient}</p>
                    <p className="text-[10px] text-slate-400">{String(c.hour).padStart(2,'0')}:{String(c.minute).padStart(2,'0')} · {c.duration}min · {c.doctor} · {c.box}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AgendaUpdated() {
  const [citas, setCitas] = useState(CITAS)
  const [view, setView] = useState<'week'|'day'>('week')
  const [dayIdx, setDayIdx] = useState(0)
  const [selCita, setSelCita] = useState<Cita|null>(null)
  const [showModal, setShowModal] = useState(false)
  const [prefill, setPrefill] = useState<Partial<Cita>>({})
  const [filterDoc, setFilterDoc] = useState('')

  const filtered = filterDoc ? citas.filter(c=>c.doctor===filterDoc) : citas

  function addCita(data: Omit<Cita,'id'>) {
    setCitas(cs=>[...cs,{...data,id:Date.now()}])
    setShowModal(false)
  }

  function confirmCita(id: number) {
    setCitas(cs => cs.map(c => c.id === id ? {...c, status:'confirmed'} : c))
    setSelCita(sc => sc && sc.id === id ? {...sc, status:'confirmed'} : sc)
  }

  function handleSlotClick(day: number, hour: number) {
    setPrefill({day, hour})
    setShowModal(true)
  }

  return (
    <div className="flex h-full bg-white">
      {showModal && <ModalNuevaCita cita={prefill} onSave={addCita} onClose={()=>setShowModal(false)}/>}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 shrink-0">
          {/* View toggle */}
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {(['week','day'] as const).map(v=>(
              <button key={v} onClick={()=>setView(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view===v?'bg-white text-slate-800 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
                {v==='week'?'Semana':'Día'}
              </button>
            ))}
          </div>

          {view==='day'&&(
            <div className="flex items-center gap-1">
              <button onClick={()=>setDayIdx(d=>Math.max(0,d-1))} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50">
                <Icon d="M15 19l-7-7 7-7" className="w-3.5 h-3.5 text-slate-500"/>
              </button>
              <span className="text-sm font-semibold text-slate-700 min-w-[100px] text-center">{DAYS_LONG[dayIdx]} {WEEK_DATES[dayIdx]}</span>
              <button onClick={()=>setDayIdx(d=>Math.min(4,d+1))} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50">
                <Icon d="M9 5l7 7-7 7" className="w-3.5 h-3.5 text-slate-500"/>
              </button>
            </div>
          )}

          <div className="flex-1"/>

          {/* Doctor filter */}
          <select value={filterDoc} onChange={e=>setFilterDoc(e.target.value)} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 text-slate-600">
            <option value="">Todos los doctores</option>
            {DOCTORS.map(d=><option key={d}>{d}</option>)}
          </select>

          {/* Legend */}
          <div className="flex items-center gap-2">
            {Object.entries(PROC_COLORS).slice(0,4).map(([k,v])=>(
              <div key={k} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor:v}}/>
                <span className="text-[10px] text-slate-500">{k}</span>
              </div>
            ))}
          </div>

          <button onClick={()=>{setPrefill({});setShowModal(true)}}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-xl transition-colors" style={{backgroundColor:'#1E8C82'}}>
            <Icon d="M12 4v16m8-8H4" className="w-3.5 h-3.5"/>
            Nueva cita
          </button>
        </div>

        {/* Calendar */}
        {view==='week'
          ? <WeekView citas={filtered} onCitaClick={setSelCita} onSlotClick={handleSlotClick}/>
          : <DayView dayIdx={dayIdx} citas={filtered} onCitaClick={setSelCita} onSlotClick={handleSlotClick}/>
        }
      </div>

      {/* Patient side panel */}
      {selCita && (
        <PatientPanel
          cita={selCita}
          onClose={()=>setSelCita(null)}
          onEdit={()=>{setPrefill(selCita);setSelCita(null);setShowModal(true)}}
          onConfirm={confirmCita}
        />
      )}
    </div>
  )
}
