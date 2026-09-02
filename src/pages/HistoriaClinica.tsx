import { useState } from 'react'

interface Vital { systolic: number; diastolic: number; pulse: number; temp: number; weight: number; height: number; spo2: number }
export interface Consulta {
  id: number; date: string; doctor: string; motivo: string; vitals: Vital
  examen: string; diagnostico: string; procedimientos: string; plan: string; indicaciones: string; proxima: string
}
export interface HCPaciente {
  id: number; name: string; doc: string; dob: string; blood: string; allergy: string; antecedentes: string; consultas: Consulta[]
}

const MOCK_HC: HCPaciente[] = [
  { id:1, name:'María González', doc:'52.453.121', dob:'1990-07-15', blood:'A+', allergy:'Penicilina', antecedentes:'HTA leve, controlada. Sin cirugías previas.',
    consultas:[
      { id:101, date:'2026-08-20', doctor:'Dr. Andrés Herrera', motivo:'Dolor molar inferior derecho',
        vitals:{ systolic:118, diastolic:76, pulse:72, temp:36.5, weight:62, height:162, spo2:98 },
        examen:'Molar #47 con movilidad grado 2. Sangrado al sondaje. Bolsa periodontal 5mm.',
        diagnostico:'Periodontitis crónica localizada #47 — K05.3',
        procedimientos:'Raspado y alisado radicular cuadrante IV. Irrigación CHX 0.12%.',
        plan:'Control 4 semanas. Considerar extracción si no hay mejoría.',
        indicaciones:'Clorhexidina 0.12% enjuague 2x/día × 14 días. Ibuprofeno 400mg SOS.',
        proxima:'2026-09-17' },
      { id:102, date:'2026-06-10', doctor:'Dr. Andrés Herrera', motivo:'Revisión de rutina',
        vitals:{ systolic:115, diastolic:74, pulse:68, temp:36.3, weight:61, height:162, spo2:99 },
        examen:'Sin hallazgos agudos. Cálculo subgingival en sector anterior inferior.',
        diagnostico:'Gingivitis crónica generalizada — K05.1',
        procedimientos:'Profilaxis ultrasónica completa. Fluorización.',
        plan:'Control anual.', indicaciones:'Técnica de Bass modificada. Hilo interdental 1x/día.', proxima:'2027-06-10' },
    ]},
  { id:2, name:'Carlos Rivas', doc:'1.015.672.340', dob:'1988-04-12', blood:'O+', allergy:'Ninguna conocida', antecedentes:'Diabetes tipo 2 controlada con metformina.',
    consultas:[
      { id:201, date:'2026-08-23', doctor:'Dr. Andrés Herrera', motivo:'Evaluación prequirúrgica extracción #38',
        vitals:{ systolic:124, diastolic:80, pulse:76, temp:36.4, weight:78, height:175, spo2:97 },
        examen:'#38 semierupcionado, angulación mesial. Espacio insuficiente. Folículo visible en Rx.',
        diagnostico:'Tercer molar inferior izquierdo retenido — K01.1',
        procedimientos:'Evaluación clínica y radiográfica. Firma de consentimiento informado.',
        plan:'Cirugía ambulatoria — 28 Ago 2026.',
        indicaciones:'Ayuno 4 h antes. No anticoagulantes. Presentarse con acompañante.',
        proxima:'2026-08-28' },
    ]},
  { id:3, name:'Sofía Martínez', doc:'43.876.521', dob:'2002-11-30', blood:'B+', allergy:'Latex', antecedentes:'Sin antecedentes relevantes. Brackets desde 2024.',
    consultas:[
      { id:301, date:'2026-08-15', doctor:'Dra. Laura Suárez', motivo:'Ajuste mensual de ortodoncia',
        vitals:{ systolic:110, diastolic:70, pulse:65, temp:36.2, weight:55, height:165, spo2:99 },
        examen:'Buena higiene periodontal. Leve inflamación gingival sector anterior. Arco 0.019×0.025 SS.',
        diagnostico:'Ortodoncia fase activa — Z46.4',
        procedimientos:'Cambio arco inferior 0.019×0.025. Activación resortes. Fotografías de progreso.',
        plan:'Próximo ajuste 15 Sep. Evaluar uso de elásticos clase II.',
        indicaciones:'Cepillar después de cada comida. Cera dental si hay irritación. Citas cada 30 días.', proxima:'2026-09-15' },
    ]},
  { id:4, name:'Roberto Díaz', doc:'79.654.320', dob:'1975-03-08', blood:'AB-', allergy:'Ninguna', antecedentes:'Fumador 10 cigarrillos/día. Bruxismo nocturno.',
    consultas:[
      { id:401, date:'2026-08-10', doctor:'Dr. Andrés Herrera', motivo:'Dolor agudo #16',
        vitals:{ systolic:135, diastolic:88, pulse:84, temp:36.8, weight:82, height:178, spo2:97 },
        examen:'#16 con caries profunda, exposición pulpar probable. Prueba al frío: + 10s. Percusión: ++.',
        diagnostico:'Pulpitis irreversible sintomática #16 — K04.0',
        procedimientos:'Apertura cameral de urgencia. Cavidad temporal con eugenol.',
        plan:'Tratamiento de conductos en 2 sesiones. Placa oclusal para bruxismo.',
        indicaciones:'Amoxicilina 500mg c/8h × 7 días. Ibuprofeno 600mg c/8h × 5 días. Dieta blanda.',
        proxima:'2026-08-17' },
    ]},
]

function fmtDate(iso: string) { return new Date(iso+'T00:00').toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'}) }
function calcAge(dob: string) { return Math.floor((Date.now()-new Date(dob+'T00:00').getTime())/31557600000) }
function Icon({ d, className='w-4 h-4' }: { d: string; className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={d}/></svg>
}

const BLANK = (): Omit<Consulta,'id'> => ({ date:new Date().toISOString().slice(0,10), doctor:'Dr. Andrés Herrera', motivo:'', vitals:{systolic:120,diastolic:80,pulse:70,temp:36.5,weight:65,height:165,spo2:98}, examen:'', diagnostico:'', procedimientos:'', plan:'', indicaciones:'', proxima:'' })

function ModalConsulta({ consulta, patientName, onSave, onClose }: { consulta?: Consulta; patientName: string; onSave: (c: Omit<Consulta,'id'>) => void; onClose: () => void }) {
  const [form, setForm] = useState<Omit<Consulta,'id'>>(consulta ? {...consulta} : BLANK())
  const [dictating, setDictating] = useState<string|null>(null)

  function setV(k: keyof Vital, v: string) { setForm(f=>({...f,vitals:{...f.vitals,[k]:parseFloat(v)||0}})) }
  function dictate(key: string) {
    setDictating(key)
    setTimeout(()=>{ setForm(f=>({...f,[key]:(f[key as keyof typeof f] as string||'')+(f[key as keyof typeof f]?'\n':'')+'IA: Sin hallazgos patológicos adicionales. Plan de tratamiento sin cambios.'})); setDictating(null) }, 1800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>{consulta?'Editar consulta':'Nueva consulta'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Paciente: {patientName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5"/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {[['Fecha','date','date'],['Doctor','doctor','select'],['Próxima cita','proxima','date']].map(([l,k,t])=>(
              <div key={k}>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">{l}</label>
                {t==='select'
                  ? <select value={form[k as keyof typeof form] as string} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                      {['Dr. Andrés Herrera','Dra. Laura Suárez','Dr. Carlos Mejía'].map(d=><option key={d}>{d}</option>)}
                    </select>
                  : <input type={t} value={form[k as keyof typeof form] as string} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
                }
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Motivo de consulta</label>
            <input value={form.motivo} onChange={e=>setForm(f=>({...f,motivo:e.target.value}))} placeholder="Motivo principal..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3" style={{fontFamily:'Outfit'}}>Signos vitales</p>
            <div className="grid grid-cols-4 gap-3 bg-slate-50 rounded-2xl p-4">
              {([['Sistólica (mmHg)','systolic'],['Diastólica (mmHg)','diastolic'],['Pulso (lpm)','pulse'],['Temp (°C)','temp'],['Peso (kg)','weight'],['Talla (cm)','height'],['SpO₂ (%)','spo2']] as [string,keyof Vital][]).map(([l,k])=>(
                <div key={k}>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">{l}</label>
                  <input type="number" value={form.vitals[k]} onChange={e=>setV(k,e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
                </div>
              ))}
            </div>
          </div>

          {(['examen','diagnostico','procedimientos','plan','indicaciones'] as const).map(key=>(
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-500 capitalize">{key.replace('diagnostico','Diagnóstico (CIE-10)').replace('procedimientos','Procedimientos realizados').replace('indicaciones','Indicaciones al paciente').replace('examen','Examen clínico').replace('plan','Plan de tratamiento')}</label>
                <button onClick={()=>dictate(key)} className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-all ${dictating===key?'bg-rose-100 text-rose-600':'bg-cyan-50 text-cyan-600 hover:bg-cyan-100'}`}>
                  {dictating===key?<><span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"/>Dictando...</>:<><Icon d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" className="w-3 h-3"/>Dictar con IA</>}
                </button>
              </div>
              <textarea value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button onClick={()=>onSave(form)} className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500">
            {consulta?'Guardar cambios':'Registrar consulta'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalImprimir({ consulta, patient, onClose }: { consulta: Consulta; patient: HCPaciente; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>Vista previa de impresión</h2>
          <div className="flex gap-2">
            <button onClick={()=>window.print()} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500">
              <Icon d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" className="w-4 h-4"/>
              Imprimir
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2"><Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5"/></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
          <div className="text-center border-b-2 border-slate-800 pb-4">
            <p className="font-black text-xl tracking-widest" style={{fontFamily:'Outfit',color:'#0B3D3A'}}>CORONYX · SISTEMA DENTAL</p>
            <p className="text-xs text-slate-500 mt-1">Historia Clínica Odontológica</p>
          </div>
          <div className="grid grid-cols-2 gap-3 border border-slate-200 rounded-xl p-4 text-sm">
            {[['Paciente',patient.name],['Documento',patient.doc],['Fecha de nacimiento',fmtDate(patient.dob)],['Edad',`${calcAge(patient.dob)} años`],['Grupo sanguíneo',patient.blood],['Alergias',patient.allergy]].map(([l,v])=>(
              <div key={l} className="flex gap-2"><span className="text-slate-500">{l}:</span><span className="font-semibold text-slate-800">{v}</span></div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
            <span>Fecha: <strong className="text-slate-700">{fmtDate(consulta.date)}</strong></span>
            <span>Doctor: <strong className="text-slate-700">{consulta.doctor}</strong></span>
          </div>
          {[['Motivo',consulta.motivo],['Examen clínico',consulta.examen],['Diagnóstico',consulta.diagnostico],['Procedimientos',consulta.procedimientos],['Plan de tratamiento',consulta.plan],['Indicaciones',consulta.indicaciones]].filter(([,v])=>v).map(([l,v])=>(
            <div key={l}><p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">{l}</p><p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{v}</p></div>
          ))}
          <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-400">
            <div><div className="h-12 border-b border-slate-300 mb-1"/><p>Firma y sello del profesional</p></div>
            <div><div className="h-12 border-b border-slate-300 mb-1"/><p>Firma del paciente</p></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HistoriaClinica({ initialPatientId }: { initialPatientId?: number }) {
  const [patients, setPatients] = useState(MOCK_HC)
  const [selId, setSelId] = useState(initialPatientId ?? MOCK_HC[0].id)
  const [search, setSearch] = useState('')
  const [selConsultaId, setSelConsultaId] = useState<number|null>(null)
  const [modal, setModal] = useState<'new'|'edit'|'print'|null>(null)
  const [editTarget, setEditTarget] = useState<Consulta|undefined>()
  const [printTarget, setPrintTarget] = useState<Consulta|null>(null)

  const patient = patients.find(p=>p.id===selId)!
  const filtered = patients.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()))
  const activeC = selConsultaId ? patient.consultas.find(c=>c.id===selConsultaId) ?? patient.consultas[0] : patient.consultas[0]

  function save(data: Omit<Consulta,'id'>) {
    setPatients(ps=>ps.map(p=>{
      if(p.id!==selId) return p
      if(editTarget) return {...p,consultas:p.consultas.map(c=>c.id===editTarget.id?{...data,id:editTarget.id}:c)}
      return {...p,consultas:[{...data,id:Date.now()},...p.consultas]}
    }))
    setModal(null); setEditTarget(undefined)
  }

  return (
    <div className="flex h-full">
      {(modal==='new'||modal==='edit')&&<ModalConsulta consulta={editTarget} patientName={patient.name} onSave={save} onClose={()=>{setModal(null);setEditTarget(undefined)}}/>}
      {modal==='print'&&printTarget&&<ModalImprimir consulta={printTarget} patient={patient} onClose={()=>{setModal(null);setPrintTarget(null)}}/>}

      {/* Patient list */}
      <aside className="w-52 shrink-0 flex flex-col border-r border-slate-200 bg-white">
        <div className="p-2.5 border-b border-slate-100">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(p=>(
            <button key={p.id} onClick={()=>{setSelId(p.id);setSelConsultaId(null)}}
              className={`w-full text-left px-3 py-2.5 border-b border-slate-50 transition-all flex items-center gap-2 ${selId===p.id?'bg-cyan-50 border-l-2 border-l-cyan-500':'hover:bg-slate-50'}`}>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {p.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-semibold truncate ${selId===p.id?'text-cyan-700':'text-slate-700'}`}>{p.name}</p>
                <p className="text-[10px] text-slate-400">{p.consultas.length} consulta{p.consultas.length!==1?'s':''}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Consulta list */}
      <div className="w-52 shrink-0 flex flex-col border-r border-slate-200 bg-white">
        <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-700">Consultas</p>
          <button onClick={()=>setModal('new')} className="w-6 h-6 bg-cyan-600 text-white rounded-lg flex items-center justify-center hover:bg-cyan-500 transition-colors">
            <Icon d="M12 4v16m8-8H4" className="w-3.5 h-3.5"/>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {patient.consultas.map(c=>(
            <button key={c.id} onClick={()=>setSelConsultaId(c.id)}
              className={`w-full text-left px-3 py-2.5 border-b border-slate-50 transition-all ${activeC?.id===c.id?'bg-cyan-50 border-l-2 border-l-cyan-500':'hover:bg-slate-50'}`}>
              <p className={`text-xs font-semibold ${activeC?.id===c.id?'text-cyan-700':'text-slate-700'}`}>{fmtDate(c.date)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{c.motivo}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        {activeC ? (
          <>
            <div className="bg-white border-b border-slate-100 px-5 py-3.5 flex items-center justify-between shrink-0">
              <div>
                <p className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>{activeC.motivo}</p>
                <p className="text-xs text-slate-400">{fmtDate(activeC.date)} · {activeC.doctor}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>{setPrintTarget(activeC);setModal('print')}} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50">
                  <Icon d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" className="w-3.5 h-3.5"/>Imprimir
                </button>
                <button onClick={()=>{setEditTarget(activeC);setModal('edit')}} className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-xs font-semibold hover:bg-cyan-500">
                  <Icon d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-3.5 h-3.5"/>Editar
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-7 gap-2">
                {([
                  ['P.A.',`${activeC.vitals.systolic}/${activeC.vitals.diastolic}`,'mmHg',activeC.vitals.systolic<130],
                  ['Pulso',`${activeC.vitals.pulse}`,'lpm',activeC.vitals.pulse<100],
                  ['Temp',`${activeC.vitals.temp}`,'°C',activeC.vitals.temp<37.5],
                  ['Peso',`${activeC.vitals.weight}`,'kg',true],
                  ['Talla',`${activeC.vitals.height}`,'cm',true],
                  ['SpO₂',`${activeC.vitals.spo2}`,'%',activeC.vitals.spo2>=95],
                ] as [string,string,string,boolean][]).map(([l,v,u,ok])=>(
                  <div key={l} className={`rounded-xl p-3 text-center ${ok?'bg-emerald-50':'bg-rose-50'}`}>
                    <p className="text-[10px] font-semibold text-slate-400 mb-1">{l}</p>
                    <p className={`font-bold text-sm ${ok?'text-emerald-700':'text-rose-600'}`}>{v}</p>
                    <p className="text-[9px] text-slate-400">{u}</p>
                  </div>
                ))}
              </div>
              {([['Examen clínico',activeC.examen,'#7C3AED'],['Diagnóstico',activeC.diagnostico,'#DC2626'],['Procedimientos realizados',activeC.procedimientos,'#1E8C82'],['Plan de tratamiento',activeC.plan,'#D97706'],['Indicaciones al paciente',activeC.indicaciones,'#0369A1']] as [string,string,string][]).filter(([,v])=>v).map(([l,v,c])=>(
                <div key={l} className="bg-white rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:c,fontFamily:'Outfit'}}>{l}</p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{v}</p>
                </div>
              ))}
              {activeC.proxima&&(
                <div className="flex items-center gap-3 bg-cyan-50 rounded-2xl p-4 border border-cyan-100">
                  <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-4 h-4 text-cyan-600"/>
                  <p className="text-sm text-cyan-700"><span className="font-semibold">Próxima cita:</span> {fmtDate(activeC.proxima)}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="w-10 h-10 mx-auto mb-3 opacity-30"/>
              <p className="text-sm">Sin consultas registradas</p>
              <button onClick={()=>setModal('new')} className="mt-2 text-xs text-cyan-600 hover:text-cyan-700 font-semibold">+ Registrar primera consulta</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
