import { useState } from 'react'
import Odontogram from './Odontogram'

// Unified Patient Profile — combines Patients + Historia Clínica + Odontograma + Radiografías
// (Feedback items 2, 3, 4)

type Tab = 'resumen' | 'historial' | 'odontograma' | 'radiografias' | 'documentos'

const patients = [
  { id: 1, name: 'Carlos Rivas', age: 52, phone: '315 987 6543', email: 'c.rivas@hotmail.com',
    isNew: false, tags: ['diabético', 'anticoagulante'],
    lastVisit: '2026-08-01', nextVisit: '2026-08-08',
    vitals: { pa:'120/80', fc:'78', peso:'82kg' },
    medHistory: { meds:'Warfarina 5mg/día · Metformina 850mg', allergies:'Sin alergias conocidas', conditions:'Diabetes Mellitus tipo 2', blood:'O+' },
  },
  { id: 2, name: 'María González', age: 34, phone: '310 234 5678', email: 'maria.g@gmail.com',
    isNew: false, tags: ['ortodoncia'],
    lastVisit: '2026-07-14', nextVisit: '2026-08-10',
    vitals: { pa:'115/75', fc:'72', peso:'61kg' },
    medHistory: { meds:'Ninguno', allergies:'Sin alergias conocidas', conditions:'Ninguna', blood:'A+' },
  },
  { id: 3, name: 'Sofía Mendez', age: 28, phone: '300 112 2334', email: 'sofiamendez@gmail.com',
    isNew: false, tags: ['embarazada'],
    lastVisit: '2026-06-20', nextVisit: '2026-08-10',
    vitals: { pa:'110/70', fc:'80', peso:'68kg' },
    medHistory: { meds:'Ácido fólico 1mg', allergies:'Penicilina — reacción cutánea', conditions:'Embarazo 18 semanas', blood:'B+' },
  },
  { id: 4, name: 'Nuevo Paciente', age: 0, phone: '', email: '',
    isNew: true, tags: [],
    lastVisit: '', nextVisit: '2026-08-08',
    vitals: { pa:'—', fc:'—', peso:'—' },
    medHistory: { meds:'—', allergies:'—', conditions:'—', blood:'—' },
  },
]

const clinicalRecords = [
  { id:1, patientId:1, date:'2026-08-01', motivo:'Dolor zona posterior inferior',
    diagnostico:'Caries profunda #14 · Sensibilidad #36', procedimiento:'Exploración + Rx · Flúor 2% NaF',
    plan:'Restauración #14 · Control Rx #36', indicaciones:'No fríos/calientes 2h', dr:'Dr. Herrera', duration:45 },
  { id:2, patientId:1, date:'2026-05-22', motivo:'Control periódico',
    diagnostico:'Placa bacteriana moderada', procedimiento:'Limpieza ultrasónica + pulido',
    plan:'Control 6 meses', indicaciones:'Hilo dental diario', dr:'Dra. Suárez', duration:60 },
  { id:3, patientId:2, date:'2026-07-14', motivo:'Control ortodoncia',
    diagnostico:'Progreso adecuado', procedimiento:'Activación brackets · Cambio elásticos',
    plan:'Control mensual', indicaciones:'Evitar alimentos duros', dr:'Dr. Herrera', duration:30 },
]

const XRAYS = [
  { id:1, patientId:1, type:'Periapical', tooth:'#14', date:'2026-08-01', status:'reviewed', finding:'Lesión apical pequeña. Seguimiento.' },
  { id:2, patientId:1, type:'Periapical', tooth:'#36', date:'2026-08-01', status:'reviewed', finding:'Conductos bien obturados.' },
  { id:3, patientId:2, type:'Panorámica', tooth:'General', date:'2026-07-14', status:'reviewed', finding:'Sin hallazgos significativos.' },
]

const tagColors: Record<string, string> = {
  'ortodoncia': 'bg-violet-100 text-violet-700', 'diabético': 'bg-amber-100 text-amber-700',
  'anticoagulante': 'bg-red-100 text-red-700', 'embarazada': 'bg-pink-100 text-pink-700',
}

// Timeline events synthesized from records
function buildTimeline(patientId: number) {
  const recs = clinicalRecords.filter(r => r.patientId === patientId)
  const xrs = XRAYS.filter(x => x.patientId === patientId)
  const events = [
    ...recs.map(r => ({ date: r.date, type: 'consulta' as const, label: r.motivo, sub: r.procedimiento, dr: r.dr })),
    ...xrs.map(x => ({ date: x.date, type: 'imagen' as const, label: `Rx ${x.type} ${x.tooth}`, sub: x.finding, dr: '' })),
  ]
  return events.sort((a, b) => b.date.localeCompare(a.date))
}

interface Props {
  initialPatientId?: number
  onBack?: () => void
  readOnly?: boolean // for Recepcionista (no clinical data)
}

export default function PacientePerfil({ initialPatientId = 1, onBack, readOnly = false }: Props) {
  const [selectedId, setSelectedId] = useState(initialPatientId)
  const [tab, setTab] = useState<Tab>('resumen')
  const [search, setSearch] = useState('')
  const [aiMode, setAiMode] = useState<null | 'historia' | 'odontograma'>(null)
  const [showNewRecord, setShowNewRecord] = useState(false)

  const patient = patients.find(p => p.id === selectedId) || patients[0]
  const timeline = buildTimeline(patient.id)
  const patientXrays = XRAYS.filter(x => x.patientId === patient.id)
  const patientRecords = clinicalRecords.filter(r => r.patientId === patient.id)

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  )

  const TABS: { id: Tab; label: string; hidden?: boolean }[] = [
    { id:'resumen',      label:'Resumen' },
    { id:'historial',    label:'Historia clínica', hidden: readOnly },
    { id:'odontograma',  label:'Odontograma',      hidden: readOnly },
    { id:'radiografias', label:'Radiografías',      hidden: readOnly },
    { id:'documentos',   label:'Documentos' },
  ]

  return (
    <div className="flex h-full fade-in">
      {/* Patient list sidebar */}
      <div className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col h-full">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800 text-sm" style={{fontFamily:'Outfit'}}>Pacientes</h2>
            <button className="text-xs px-2.5 py-1 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">+ Nuevo</button>
          </div>
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              placeholder="Buscar..." />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredPatients.map(p => (
            <button key={p.id} onClick={() => { setSelectedId(p.id); setTab('resumen') }}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${selectedId === p.id ? 'bg-cyan-50 border border-cyan-200' : 'hover:bg-slate-50'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${p.isNew ? 'bg-slate-400' : 'bg-gradient-to-br from-cyan-400 to-cyan-600'}`}>
                  {p.isNew ? '?' : p.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                  <p className="text-xs text-slate-400 truncate">{p.isNew ? 'Primera consulta' : `${p.age} años`}</p>
                </div>
                {p.isNew && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-medium">Nuevo</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main profile area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Patient header */}
        <div className="bg-white border-b border-slate-100 px-6 py-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${patient.isNew ? 'bg-slate-300' : 'bg-gradient-to-br from-cyan-400 to-cyan-600'}`} style={{fontFamily:'Outfit'}}>
                {patient.isNew ? '?' : patient.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>{patient.name}</h2>
                  {patient.isNew && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Primera visita</span>}
                </div>
                {!patient.isNew && (
                  <p className="text-sm text-slate-400">{patient.age} años · {patient.phone} · {patient.email}</p>
                )}
                <div className="flex gap-1 mt-1">
                  {patient.tags.map(t => (
                    <span key={t} className={`text-xs px-1.5 py-0.5 rounded font-medium ${tagColors[t] || 'bg-slate-100 text-slate-600'}`}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {/* AI mode switcher — clarifies where transcription goes */}
              {!readOnly && (
                <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1">
                  <span className="text-xs text-slate-400 px-1">IA a:</span>
                  <button onClick={() => setAiMode(aiMode === 'historia' ? null : 'historia')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${aiMode === 'historia' ? 'bg-rose-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                    Historia
                  </button>
                  <button onClick={() => setAiMode(aiMode === 'odontograma' ? null : 'odontograma')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${aiMode === 'odontograma' ? 'bg-amber-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                    Odontograma
                  </button>
                </div>
              )}
              <button className="px-3 py-1.5 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Nueva cita</button>
            </div>
          </div>

          {/* AI destination indicator */}
          {aiMode && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium mb-2 ${aiMode === 'historia' ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
              <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
              Dictado activo — transcripción irá a: <strong>{aiMode === 'historia' ? 'Historia Clínica' : 'Odontograma'}</strong>
              <button onClick={() => setAiMode(null)} className="ml-auto underline">Detener</button>
            </div>
          )}

          {/* Tabs — hidden clinical tabs for Recepcionista */}
          <div className="flex gap-1">
            {TABS.filter(t => !t.hidden).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t.id ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {/* RESUMEN TAB */}
          {tab === 'resumen' && (
            <div className="p-6 space-y-5">
              {patient.isNew ? (
                /* New patient empty state */
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2" style={{fontFamily:'Outfit'}}>Primera consulta</h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                    Este paciente no tiene historial clínico aún. Completa el registro y crea la primera historia clínica.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button className="px-5 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 transition-colors">
                      Completar registro del paciente
                    </button>
                    <button onClick={() => setTab('historial')} className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                      Crear primera historia clínica
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Vitals */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      ['Presión arterial', patient.vitals.pa, 'mmHg'],
                      ['Frec. cardíaca', patient.vitals.fc, 'bpm'],
                      ['Peso', patient.vitals.peso, ''],
                    ].map(([l,v,u]) => (
                      <div key={l} className="bg-white rounded-xl border border-slate-100 p-4">
                        <p className="text-xs text-slate-400">{l}</p>
                        <p className="text-xl font-bold text-slate-800 mt-1" style={{fontFamily:'Outfit'}}>{v}</p>
                        <p className="text-xs text-slate-400">{u}</p>
                      </div>
                    ))}
                  </div>

                  {/* Medical history */}
                  <div className="bg-white rounded-xl border border-slate-100 p-5 grid grid-cols-2 gap-4">
                    {[
                      ['Medicamentos', patient.medHistory.meds],
                      ['Alergias', patient.medHistory.allergies],
                      ['Enfermedades sistémicas', patient.medHistory.conditions],
                      ['Grupo sanguíneo', patient.medHistory.blood],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
                        <p className={`text-sm font-medium ${val.includes('Warfarina') || val.includes('Penicilina') ? 'text-red-600' : 'text-slate-700'}`}>{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Timeline — "historial vivo" innovation */}
                  <div className="bg-white rounded-xl border border-slate-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Línea de tiempo clínica</h3>
                      <span className="text-xs text-slate-400">{timeline.length} eventos</span>
                    </div>
                    {timeline.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-6">Sin eventos registrados</p>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-100"></div>
                        <div className="space-y-4">
                          {timeline.map((ev, i) => (
                            <div key={i} className="flex gap-4 items-start pl-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${ev.type === 'consulta' ? 'bg-cyan-100 text-cyan-600' : 'bg-violet-100 text-violet-600'}`}>
                                <span className="text-sm">{ev.type === 'consulta' ? '📋' : '🔬'}</span>
                              </div>
                              <div className="flex-1 pb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-slate-400">{ev.date}</span>
                                  {ev.dr && <span className="text-xs text-slate-400">{ev.dr}</span>}
                                </div>
                                <p className="text-sm font-medium text-slate-800 mt-0.5">{ev.label}</p>
                                <p className="text-xs text-slate-500">{ev.sub}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* HISTORIA CLÍNICA TAB */}
          {tab === 'historial' && !readOnly && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Historia clínica</h3>
                <button onClick={() => setShowNewRecord(true)}
                  className="px-3 py-1.5 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 transition-colors">
                  + Nueva consulta
                </button>
              </div>

              {patient.isNew || patientRecords.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                  <p className="text-3xl mb-3">📋</p>
                  <h4 className="font-semibold text-slate-700 mb-1" style={{fontFamily:'Outfit'}}>Sin consultas previas</h4>
                  <p className="text-sm text-slate-400 mb-5">Este es el primer registro clínico del paciente</p>
                  <button onClick={() => setShowNewRecord(true)} className="px-5 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500">
                    Crear primera historia clínica
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {patientRecords.map(r => (
                    <div key={r.id} className="bg-white rounded-xl border border-slate-100 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-xs font-mono text-slate-400">{r.date}</span>
                          <h4 className="font-semibold text-slate-800 mt-0.5">{r.motivo}</h4>
                          <p className="text-xs text-slate-400">{r.dr} · {r.duration} min</p>
                        </div>
                        <button className="text-xs text-cyan-600 hover:underline">Editar</button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {[
                          ['🔬 Diagnóstico', r.diagnostico],
                          ['⚙ Procedimiento', r.procedimiento],
                          ['📋 Plan', r.plan],
                          ['📝 Indicaciones', r.indicaciones],
                        ].map(([label, val]) => (
                          <div key={label}>
                            <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
                            <p className="text-slate-700">{val}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* New record form */}
              {showNewRecord && (
                <div className="bg-white rounded-xl border border-cyan-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Nueva consulta — {new Date().toLocaleDateString('es-CO')}</h4>
                    <button onClick={() => setShowNewRecord(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {['PA (mmHg)', 'FC (bpm)', 'Peso (kg)'].map(l => (
                      <div key={l}>
                        <label className="text-xs text-slate-400 block mb-1">{l}</label>
                        <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" />
                      </div>
                    ))}
                  </div>
                  {['Motivo de consulta', 'Diagnóstico', 'Procedimiento realizado', 'Plan de tratamiento', 'Indicaciones'].map(l => (
                    <div key={l} className="mb-3">
                      <label className="text-xs text-slate-400 font-medium block mb-1">{l}</label>
                      <textarea rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/50" />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button onClick={() => setShowNewRecord(false)} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
                    <button onClick={() => setShowNewRecord(false)} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-500">Guardar</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ODONTOGRAMA TAB — embedded */}
          {tab === 'odontograma' && !readOnly && (
            <div className="p-2">
              {patient.isNew ? (
                <div className="p-10 text-center">
                  <p className="text-3xl mb-3">🦷</p>
                  <h4 className="font-semibold text-slate-700 mb-1" style={{fontFamily:'Outfit'}}>Odontograma no disponible</h4>
                  <p className="text-sm text-slate-400">Completa el registro del paciente antes de iniciar el odontograma</p>
                </div>
              ) : (
                <Odontogram />
              )}
            </div>
          )}

          {/* RADIOGRAFÍAS TAB — embedded */}
          {tab === 'radiografias' && !readOnly && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Radiografías</h3>
                <div className="flex gap-2">
                  <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">ML análisis · Fase 2</span>
                  <button className="px-3 py-1.5 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">+ Cargar imagen</button>
                </div>
              </div>

              {patient.isNew || patientXrays.length === 0 ? (
                <div className="bg-slate-900 rounded-2xl p-10 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <p className="text-white/60 font-medium" style={{fontFamily:'Outfit'}}>Sin radiografías</p>
                  <p className="text-white/30 text-sm mt-1 mb-5">Arrastra un archivo DICOM, JPG o PNG aquí</p>
                  <button className="px-5 py-2.5 bg-white/10 text-white/60 rounded-xl text-sm hover:bg-white/20 transition-colors">
                    Seleccionar archivo
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {patientXrays.map(xr => (
                    <div key={xr.id} className="bg-slate-900 rounded-xl p-4 flex items-center gap-4">
                      <div className="w-20 h-16 bg-slate-800 rounded-lg border border-white/10 flex items-center justify-center shrink-0">
                        <span className="text-xs text-white/20 font-mono">RX</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-white">{xr.type} — {xr.tooth}</p>
                          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Revisada</span>
                        </div>
                        <p className="text-xs text-white/50 font-mono">{xr.date}</p>
                        <p className="text-xs text-white/60 mt-1">{xr.finding}</p>
                      </div>
                      <button className="px-3 py-1.5 bg-white/10 text-white/60 text-xs rounded-lg hover:bg-white/20 transition-colors">Ver</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DOCUMENTOS TAB */}
          {tab === 'documentos' && (
            <div className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4" style={{fontFamily:'Outfit'}}>Documentos</h3>
              {patient.isNew ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-3xl mb-2">📂</p>
                  <p className="text-sm">Sin documentos</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {['Consentimiento informado — 2026-05-22', 'Radiografía panorámica — 2026-07-14'].map((doc, i) => (
                    <div key={i} className="flex items-center justify-between bg-white rounded-xl border border-slate-100 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                        <span className="text-sm text-slate-700">{doc}</span>
                      </div>
                      <button className="text-xs text-cyan-600 hover:underline">Descargar</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Restricted access for Recepcionista on clinical tabs */}
          {readOnly && (tab === 'historial' || tab === 'odontograma' || tab === 'radiografias') && (
            <div className="p-10 text-center">
              <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </div>
              <h4 className="font-semibold text-slate-800 mb-1" style={{fontFamily:'Outfit'}}>Acceso restringido</h4>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Esta sección contiene datos clínicos sensibles. Solo el odontólogo tratante puede acceder.
              </p>
              <p className="text-xs text-slate-400 mt-3">Rol actual: Recepcionista — permiso: solo datos de contacto y citas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
