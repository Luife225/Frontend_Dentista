import { useState } from 'react'
import HistoriaClinica from './HistoriaClinica'
import { useAuth } from '../contexts/AuthContext'

type Tab = 'resumen'|'historia'|'odontograma'|'radiografias'|'documentos'

function Icon({ d, className='w-4 h-4' }: { d: string; className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={d}/></svg>
}

// ── Patient data ──────────────────────────────────────────────────────────────
interface Patient {
  id: number; name: string; doc: string; dob: string; phone: string; email: string
  blood: string; eps: string; allergy: string; antecedentes: string; city: string
  status: 'active'|'inactive'; nextAppt: string; lastVisit: string; balance: number
}

const PATIENTS: Patient[] = [
  { id:1, name:'María González', doc:'52.453.121', dob:'1990-07-15', phone:'+57 320 455 1234', email:'maria@gmail.com', blood:'A+', eps:'Sura EPS', allergy:'Penicilina', antecedentes:'HTA leve. Sin cirugías previas.', city:'Bogotá', status:'active', nextAppt:'2026-09-17', lastVisit:'2026-08-20', balance:0 },
  { id:2, name:'Carlos Rivas', doc:'1.015.672.340', dob:'1988-04-12', phone:'+57 310 455 7821', email:'carlos@gmail.com', blood:'O+', eps:'Colsanitas', allergy:'Ninguna', antecedentes:'Diabetes tipo 2 controlada.', city:'Bogotá', status:'active', nextAppt:'2026-08-28', lastVisit:'2026-08-23', balance:380000 },
  { id:3, name:'Sofía Martínez', doc:'43.876.521', dob:'2002-11-30', phone:'+57 300 111 2222', email:'sofia@gmail.com', blood:'B+', eps:'Compensar', allergy:'Latex', antecedentes:'Ortodoncia activa desde 2024.', city:'Medellín', status:'active', nextAppt:'2026-09-15', lastVisit:'2026-08-15', balance:0 },
  { id:4, name:'Roberto Díaz', doc:'79.654.320', dob:'1975-03-08', phone:'+57 315 555 6677', email:'roberto@gmail.com', blood:'AB-', eps:'Sanitas', allergy:'Ninguna', antecedentes:'Fumador. Bruxismo nocturno.', city:'Cali', status:'active', nextAppt:'2026-08-28', lastVisit:'2026-08-10', balance:180000 },
  { id:5, name:'Ana Pérez', doc:'31.456.789', dob:'1995-06-22', phone:'+57 311 444 5566', email:'ana@gmail.com', blood:'A-', eps:'Nueva EPS', allergy:'Ibuprofeno', antecedentes:'Sin antecedentes relevantes.', city:'Bogotá', status:'active', nextAppt:'2026-09-02', lastVisit:'2026-08-24', balance:0 },
  { id:6, name:'Luis Mendoza', doc:'12.345.678', dob:'1980-12-15', phone:'+57 320 777 8899', email:'luis@gmail.com', blood:'O-', eps:'Sura EPS', allergy:'Ninguna', antecedentes:'Hipertensión controlada.', city:'Barranquilla', status:'inactive', nextAppt:'', lastVisit:'2026-04-10', balance:0 },
  { id:7, name:'Valentina Cruz', doc:'55.321.654', dob:'1992-09-03', phone:'+57 312 000 1234', email:'vale@gmail.com', blood:'B-', eps:'Coomeva', allergy:'Ninguna', antecedentes:'Sin antecedentes relevantes.', city:'Bogotá', status:'active', nextAppt:'2026-08-28', lastVisit:'2026-08-01', balance:750000 },
  { id:8, name:'Jorge Salazar', doc:'88.123.456', dob:'1968-02-17', phone:'+57 316 888 9900', email:'jorge@gmail.com', blood:'AB+', eps:'Sanitas', allergy:'Sulfonamidas', antecedentes:'DM2, HTA. Anticoagulado con warfarina.', city:'Bogotá', status:'active', nextAppt:'2026-08-28', lastVisit:'2026-08-24', balance:0 },
]

function fmtDate(iso: string) { return iso ? new Date(iso+'T00:00').toLocaleDateString('es-CO',{day:'numeric',month:'short',year:'numeric'}) : '—' }
function calcAge(dob: string) { return Math.floor((Date.now()-new Date(dob+'T00:00').getTime())/31557600000) }
function fmt(n: number) { return n ? new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n) : '$0' }

// ── Modal: Nuevo paciente ─────────────────────────────────────────────────────
const BLANK_P = () => ({ name:'', doc:'', dob:'', phone:'', email:'', blood:'O+', eps:'', allergy:'', antecedentes:'', city:'' })
function ModalNuevoPaciente({ onSave, onClose }: { onSave: (p: typeof BLANK_P extends () => infer R ? R : never) => void; onClose: () => void }) {
  const [form, setForm] = useState(BLANK_P())
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => setForm(f=>({...f,[k]:e.target.value}))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>+ Nuevo paciente</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5"/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Nombre completo *</label>
              <input value={form.name} onChange={set('name')} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" placeholder="Nombre y apellidos"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">N° Documento *</label>
              <input value={form.doc} onChange={set('doc')} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" placeholder="CC / CE / Pasaporte"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Fecha de nacimiento</label>
              <input type="date" value={form.dob} onChange={set('dob')} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Teléfono</label>
              <input value={form.phone} onChange={set('phone')} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" placeholder="+57..."/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Email</label>
              <input value={form.email} onChange={set('email')} type="email" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" placeholder="correo@..."/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">EPS / Seguro</label>
              <input value={form.eps} onChange={set('eps')} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Tipo de sangre</label>
              <select value={form.blood} onChange={set('blood')} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Ciudad</label>
              <input value={form.city} onChange={set('city')} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Alergias conocidas</label>
              <input value={form.allergy} onChange={set('allergy')} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" placeholder="Ej: Penicilina, Latex, Ibuprofeno..."/>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Antecedentes médicos</label>
              <textarea value={form.antecedentes} onChange={set('antecedentes')} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/50" placeholder="Condiciones preexistentes, medicamentos actuales..."/>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button onClick={()=>onSave(form)} className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500">Registrar paciente</button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: Agendar cita ───────────────────────────────────────────────────────
function ModalAgendarCita({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const [form, setForm] = useState({ date:'', time:'09:00', procedure:'Revisión general', doctor:'Dr. Andrés Herrera', box:'Box 1', notes:'' })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>Agendar cita</h2>
            <p className="text-xs text-slate-400">{patient.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5"/></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Fecha</label>
              <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Hora</label>
              <input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Procedimiento</label>
            <select value={form.procedure} onChange={e=>setForm(f=>({...f,procedure:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
              {['Revisión general','Limpieza','Extracción','Ortodoncia ajuste','Endodoncia','Control','Urgencia'].map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Doctor</label>
              <select value={form.doctor} onChange={e=>setForm(f=>({...f,doctor:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                {['Dr. Andrés Herrera','Dra. Laura Suárez','Dr. Carlos Mejía'].map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Box</label>
              <select value={form.box} onChange={e=>setForm(f=>({...f,box:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                {['Box 1','Box 2','Box 3','Box 4'].map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Notas</label>
            <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button onClick={onClose} className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500">Agendar</button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: Visor radiografías ─────────────────────────────────────────────────
function ModalRadiografia({ onClose }: { onClose: () => void }) {
  const [findings, setFindings] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>Visor de radiografías</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Simulated X-ray */}
          <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center" style={{height:280}}>
            <div className="text-center text-white/20 p-8">
              <svg className="w-24 h-24 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 100 100">
                <rect x="10" y="20" width="80" height="60" rx="4" stroke="white" strokeWidth="2" fill="none"/>
                {/* Simplified panoramic representation */}
                {[15,22,29,36,43,57,64,71,78,85].map(x=>(
                  <rect key={x} x={x} y="30" width="5" height={20+Math.sin(x)*5} rx="1" fill="white" opacity="0.6"/>
                ))}
                <text x="50" y="95" textAnchor="middle" fill="white" fontSize="8" opacity="0.5">Rx Panorámica — Carlos Rivas — 23/08/2026</text>
              </svg>
              <p className="text-sm">Radiografía panorámica</p>
              <p className="text-xs opacity-60 mt-1">DICOM viewer — modo demo</p>
            </div>
          </div>
          {/* ML Findings */}
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
                <Icon d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" className="w-3.5 h-3.5 text-violet-600"/>
              </div>
              <p className="text-xs font-bold text-violet-700">Hallazgos de IA · CORONYX RadScan</p>
              <span className="text-[10px] bg-violet-200 text-violet-700 px-2 py-0.5 rounded-full font-medium ml-auto">Confianza 94%</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-violet-800">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0"/>
                <span><strong>#38:</strong> Tercer molar retenido, angulación mesial ~65°. Rizólisis del #37 descartada.</span>
              </div>
              <div className="flex items-center gap-2 text-violet-800">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0"/>
                <span><strong>Seno maxilar:</strong> Velamiento parcial seno derecho — correlación clínica recomendada.</span>
              </div>
              <div className="flex items-center gap-2 text-violet-800">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"/>
                <span>Resto de la dentición sin alteraciones periapicales evidentes.</span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Informe del radiólogo</label>
            <textarea value={findings} onChange={e=>setFindings(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              placeholder="Añadir informe o notas..."/>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cerrar</button>
          <button onClick={onClose} className="px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-500">Guardar informe</button>
        </div>
      </div>
    </div>
  )
}

// ── Odontogram component (simplified interactive) ─────────────────────────────
const TOOTH_STATES: Record<string,{color:string;label:string}> = {
  healthy:   { color:'#FFFFFF', label:'Sano' },
  caries:    { color:'#FCA5A5', label:'Caries' },
  restored:  { color:'#93C5FD', label:'Restaurado' },
  extracted: { color:'#6B7280', label:'Extraído' },
  crown:     { color:'#FCD34D', label:'Corona' },
  root:      { color:'#A78BFA', label:'Tratamiento'},
}
const UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28]
const LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]

function OdontogramTab() {
  const [states, setStates] = useState<Record<number,string>>({ 38:'root', 16:'caries', 14:'restored' })
  const [selTooth, setSelTooth] = useState<number|null>(null)
  const STATE_KEYS = Object.keys(TOOTH_STATES)

  function Tooth({ n }: { n: number }) {
    const s = states[n] ?? 'healthy'
    const info = TOOTH_STATES[s]
    const isSelected = selTooth === n
    return (
      <button onClick={()=>setSelTooth(n===selTooth?null:n)}
        className={`flex flex-col items-center gap-0.5 p-0.5 rounded transition-all ${isSelected?'ring-2 ring-cyan-500 ring-offset-1':''}`} title={`${n} — ${info.label}`}>
        <span className="text-[9px] text-slate-400">{n}</span>
        <div className="w-5 h-6 rounded border border-slate-300 flex items-center justify-center shadow-sm" style={{backgroundColor: info.color}}>
          {s === 'extracted' && <span className="text-white text-[10px] font-bold">✕</span>}
          {s === 'root' && <span className="text-purple-700 text-[9px] font-bold">RC</span>}
        </div>
      </button>
    )
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>Odontograma digital</p>
        {selTooth && (
          <div className="flex items-center gap-2 bg-cyan-50 border border-cyan-200 rounded-xl px-3 py-2">
            <span className="text-xs font-semibold text-cyan-700">Pieza #{selTooth}</span>
            <div className="flex gap-1">
              {STATE_KEYS.map(s=>(
                <button key={s} onClick={()=>setStates(st=>({...st,[selTooth!]:s}))}
                  className={`w-4 h-4 rounded border transition-all ${states[selTooth!]===s?'border-cyan-500 scale-110':' border-slate-300'}`}
                  style={{backgroundColor:TOOTH_STATES[s].color}} title={TOOTH_STATES[s].label}/>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] text-slate-400 text-center mb-2 font-semibold uppercase tracking-widest">Maxilar superior</p>
            <div className="flex justify-center gap-0.5 flex-wrap">
              {UPPER.map(n=><Tooth key={n} n={n}/>)}
            </div>
          </div>
          <div className="border-t-2 border-b-2 border-dashed border-slate-200 my-2 py-1 text-center">
            <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-widest">Plano oclusal</span>
          </div>
          <div>
            <div className="flex justify-center gap-0.5 flex-wrap">
              {LOWER.map(n=><Tooth key={n} n={n}/>)}
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2 font-semibold uppercase tracking-widest">Mandíbula inferior</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(TOOTH_STATES).map(([k,v])=>(
          <div key={k} className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border border-slate-300" style={{backgroundColor:v.color}}/>
            <span className="text-xs text-slate-500">{v.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Radiografías tab ──────────────────────────────────────────────────────────
function RadiografiaItem({ name, date, onView }: { name: string; date: string; onView: () => void }) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-sm transition-all">
      <div className="w-14 h-14 rounded-xl bg-slate-900 flex items-center justify-center text-white/30 shrink-0">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="12" cy="12" r="4"/>
          <line x1="3" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="21" y2="12"/>
          <line x1="12" y1="3" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="21"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700 truncate">{name}</p>
        <p className="text-xs text-slate-400 mt-0.5">{date}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onView} className="px-3 py-1.5 text-xs font-semibold text-violet-600 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors">
          Ver con IA
        </button>
        <button className="px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-3.5 h-3.5"/>
        </button>
      </div>
    </div>
  )
}

// ── Patient tabs ──────────────────────────────────────────────────────────────
function PatientDetail({ patient }: { patient: Patient }) {
  const { role } = useAuth()
  const readOnly = role === 'RECEPCIONISTA'
  const [tab, setTab] = useState<Tab>('resumen')
  const [modal, setModal] = useState<'cita'|'rx'|null>(null)
  const allTabs: {id:Tab;label:string}[] = [
    {id:'resumen',label:'Resumen'}, {id:'historia',label:'Historia clínica'},
    {id:'odontograma',label:'Odontograma'}, {id:'radiografias',label:'Radiografías'}, {id:'documentos',label:'Documentos'},
  ]
  // Recepcionista only sees Resumen and Documentos
  const tabs = role === 'RECEPCIONISTA'
    ? allTabs.filter(t => t.id === 'resumen' || t.id === 'documentos')
    : allTabs

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {modal==='cita'&&<ModalAgendarCita patient={patient} onClose={()=>setModal(null)}/>}
      {modal==='rx'&&<ModalRadiografia onClose={()=>setModal(null)}/>}

      {/* Patient header */}
      <div className="bg-white border-b border-slate-100 px-5 py-4 flex items-center gap-4 shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
          {patient.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-800 text-base" style={{fontFamily:'Outfit'}}>{patient.name}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${patient.status==='active'?'bg-emerald-100 text-emerald-600':'bg-slate-100 text-slate-400'}`}>
              {patient.status==='active'?'Activo':'Inactivo'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{patient.doc} · {calcAge(patient.dob)} años · {patient.city}</p>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <button onClick={()=>setModal('cita')} className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors">
              <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-3.5 h-3.5"/>
              Agendar cita
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100 px-5 flex gap-1 shrink-0">
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${tab===t.id?'border-cyan-500 text-cyan-700':'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {tab==='resumen' && (
          <div className="h-full overflow-y-auto p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                {l:'Próxima cita', v:fmtDate(patient.nextAppt)||'Sin agendar', c:'#1E8C82', bg:'bg-cyan-50'},
                {l:'Última visita', v:fmtDate(patient.lastVisit), c:'#7C3AED', bg:'bg-violet-50'},
                {l:'Saldo pendiente', v:patient.balance?fmt(patient.balance):'Al día', c:patient.balance?'#D97706':'#059669', bg:patient.balance?'bg-amber-50':'bg-emerald-50'},
              ].map(s=>(
                <div key={s.l} className={`${s.bg} rounded-2xl p-4`}>
                  <p className="text-xs text-slate-500">{s.l}</p>
                  <p className="font-bold text-sm mt-1" style={{color:s.c,fontFamily:'Outfit'}}>{s.v}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4" style={{fontFamily:'Outfit'}}>Datos personales</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[['Fecha nac.',fmtDate(patient.dob)],['Edad',`${calcAge(patient.dob)} años`],['Teléfono',patient.phone],['Email',patient.email],['Grupo sanguíneo',patient.blood],['EPS / Seguro',patient.eps]].map(([l,v])=>(
                  <div key={l}><span className="text-slate-400 text-xs">{l}</span><p className="font-medium text-slate-700 text-sm">{v}</p></div>
                ))}
              </div>
            </div>
            {patient.allergy && patient.allergy !== 'Ninguna' && (
              <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4">
                <span className="text-lg">⚠</span>
                <div><p className="text-xs font-bold text-rose-700">Alergia registrada</p><p className="text-sm text-rose-700 mt-0.5">{patient.allergy}</p></div>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2" style={{fontFamily:'Outfit'}}>Antecedentes médicos</p>
              <p className="text-sm text-slate-700">{patient.antecedentes || 'Sin antecedentes registrados.'}</p>
            </div>
          </div>
        )}
        {tab==='historia' && <HistoriaClinica initialPatientId={patient.id}/>}
        {tab==='odontograma' && <OdontogramTab/>}
        {tab==='radiografias' && (
          <div className="h-full overflow-y-auto p-5 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>Imágenes diagnósticas</p>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-xl" style={{backgroundColor:'#1E8C82'}}>
                <Icon d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-3.5 h-3.5"/>
                Subir imagen
              </button>
            </div>
            {['Rx Panorámica — Ene 2026','Rx Periapical #38 — Ago 2026','Rx Bitewing cuad. III-IV — Jun 2025'].map(n=>(
              <RadiografiaItem key={n} name={n} date="23/08/2026" onView={()=>setModal('rx')}/>
            ))}
          </div>
        )}
        {tab==='documentos' && (
          <div className="h-full overflow-y-auto p-5 space-y-3">
            <p className="font-bold text-slate-800 mb-2" style={{fontFamily:'Outfit'}}>Documentos del paciente</p>
            {['Consentimiento informado — Ortodoncia','Presupuesto ortodoncia v2','Consentimiento — Extracción #38','Presupuesto extracción + cuotas'].map(d=>(
              <div key={d} className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 px-4 py-3 hover:shadow-sm transition-all">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-xs font-bold text-rose-600 shrink-0">PDF</div>
                <p className="flex-1 text-sm font-medium text-slate-700">{d}</p>
                <button className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-1">
                  <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-3.5 h-3.5"/>
                  Descargar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PacientePerfil() {
  const { role } = useAuth()
  const readOnly = role === 'RECEPCIONISTA'
  const [patients, setPatients] = useState(PATIENTS)
  const [selId, setSelId] = useState(PATIENTS[0].id)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all'|'active'|'inactive'>('all')
  const [showNewModal, setShowNewModal] = useState(false)

  const visible = patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.doc.includes(search)
    const matchFilter = filter==='all' || p.status===filter
    return matchSearch && matchFilter
  })

  const sel = patients.find(p=>p.id===selId)!

  function addPatient(data: { name:string; doc:string; dob:string; phone:string; email:string; blood:string; eps:string; allergy:string; antecedentes:string; city:string }) {
    const np: Patient = {
      id: Date.now(), name:data.name||'Nuevo paciente', doc:data.doc, dob:data.dob, phone:data.phone,
      email:data.email, blood:data.blood as Patient['blood'], eps:data.eps, allergy:data.allergy||'Ninguna',
      antecedentes:data.antecedentes, city:data.city, status:'active', nextAppt:'', lastVisit:'', balance:0,
    }
    setPatients(ps=>[np,...ps])
    setSelId(np.id)
    setShowNewModal(false)
  }

  return (
    <div className="flex h-full">
      {showNewModal && <ModalNuevoPaciente onSave={addPatient} onClose={()=>setShowNewModal(false)}/>}

      {/* Patient sidebar */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-slate-200 bg-white">
        <div className="p-3 border-b border-slate-100 space-y-2">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar paciente..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
          </div>
          <div className="flex gap-1">
            {([['all','Todos'],['active','Activos'],['inactive','Inactivos']] as const).map(([v,l])=>(
              <button key={v} onClick={()=>setFilter(v)}
                className={`flex-1 py-1 text-[10px] font-semibold rounded-lg transition-all ${filter===v?'bg-cyan-600 text-white':'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {!readOnly && (
          <button onClick={()=>setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 text-xs font-semibold text-cyan-600 hover:bg-cyan-50 transition-colors">
            <Icon d="M12 4v16m8-8H4" className="w-3.5 h-3.5"/>
            + Nuevo paciente
          </button>
        )}

        <div className="flex-1 overflow-y-auto">
          {visible.map(p=>(
            <button key={p.id} onClick={()=>setSelId(p.id)}
              className={`w-full text-left px-4 py-3 border-b border-slate-50 transition-all flex items-center gap-2.5 ${selId===p.id?'bg-cyan-50 border-l-2 border-l-cyan-500':'hover:bg-slate-50'}`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {p.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${selId===p.id?'text-cyan-700':'text-slate-700'}`}>{p.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{calcAge(p.dob)} años · {p.city}</p>
              </div>
              {p.balance>0 && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0"/>}
            </button>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-slate-100">
          <p className="text-[10px] text-slate-400">{visible.length} de {patients.length} pacientes</p>
        </div>
      </aside>

      {/* Patient detail */}
      <PatientDetail patient={sel}/>
    </div>
  )
}
