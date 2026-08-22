import { useState } from 'react'

// Agenda updated per feedback #1:
// Clicking a cita shows patient history panel. New patient → explicit empty state.

const HOURS = Array.from({ length: 11 }, (_, i) => i + 7)
const DAYS = ['Lun','Mar','Mié','Jue','Vie','Sáb']
const FULL_DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const CELL_HEIGHT = 60

const COLORS: Record<string, string> = {
  limpieza:       'bg-sky-100 border-sky-300 text-sky-800',
  extraccion:     'bg-rose-100 border-rose-300 text-rose-800',
  ortodoncia:     'bg-violet-100 border-violet-300 text-violet-800',
  corona:         'bg-amber-100 border-amber-300 text-amber-800',
  blanqueamiento: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  endodoncia:     'bg-orange-100 border-orange-300 text-orange-800',
  control:        'bg-slate-100 border-slate-300 text-slate-700',
  primera:        'bg-cyan-50 border-cyan-300 text-cyan-800',
}

const PROC_LABELS: Record<string, string> = {
  limpieza:'Limpieza', extraccion:'Extracción', ortodoncia:'Ortodoncia',
  corona:'Corona', blanqueamiento:'Blanqueamiento', endodoncia:'Endodoncia',
  control:'Control', primera:'Primera consulta',
}

const appointments = [
  { id:1, day:0, startH:8, startM:30, duration:45, patient:'María González', patientId:2, type:'limpieza', room:1, isNew:false },
  { id:2, day:0, startH:9, startM:15, duration:60, patient:'Carlos Rivas', patientId:1, type:'extraccion', room:1, isNew:false },
  { id:3, day:0, startH:10, startM:30, duration:90, patient:'Sofía Mendez', patientId:3, type:'corona', room:1, isNew:false },
  { id:4, day:0, startH:12, startM:0, duration:75, patient:'Andrés Torres', patientId:99, type:'primera', room:2, isNew:true },
  { id:5, day:0, startH:14, startM:0, duration:30, patient:'Lucía Reyes', patientId:5, type:'ortodoncia', room:1, isNew:false },
  { id:6, day:0, startH:16, startM:30, duration:60, patient:'Valentina Cruz', patientId:6, type:'limpieza', room:1, isNew:false },
  { id:7, day:1, startH:9, startM:0, duration:90, patient:'Roberto Patiño', patientId:7, type:'endodoncia', room:1, isNew:false },
  { id:8, day:2, startH:10, startM:0, duration:45, patient:'Ana López', patientId:98, type:'primera', room:1, isNew:true },
]

const patientHistories: Record<number, { lastVisit:string, records:{ date:string, motivo:string, proc:string }[] }> = {
  1: { lastVisit:'2026-08-01', records:[
    { date:'2026-08-01', motivo:'Dolor posterior inferior', proc:'Exploración + Flúor' },
    { date:'2026-05-22', motivo:'Control periódico', proc:'Limpieza ultrasónica' },
  ]},
  2: { lastVisit:'2026-07-14', records:[
    { date:'2026-07-14', motivo:'Control ortodoncia', proc:'Activación brackets' },
    { date:'2026-05-10', motivo:'Control mensual', proc:'Ajuste elásticos' },
  ]},
  3: { lastVisit:'2026-06-20', records:[
    { date:'2026-06-20', motivo:'Corona provisional', proc:'Preparación para corona definitiva' },
  ]},
}

interface SelectedAppt { id:number, patient:string, patientId:number, type:string, isNew:boolean, day:number, startH:number, duration:number, room:number }

export default function AgendaUpdated() {
  const [view, setView] = useState<'week'|'day'>('week')
  const [selectedDay, setSelectedDay] = useState(0)
  const [selected, setSelected] = useState<SelectedAppt | null>(null)
  const [newApptModal, setNewApptModal] = useState<{day:number,hour:number}|null>(null)

  function getStyle(a: typeof appointments[0]) {
    const top = (a.startH - 7) * CELL_HEIGHT + (a.startM / 60) * CELL_HEIGHT
    const height = (a.duration / 60) * CELL_HEIGHT - 2
    if (view === 'week') {
      return { top, height, left:`${(a.day / 6) * 100}%`, width:`${(1/6)*100-1}%`, position:'absolute' as const }
    }
    return { top, height, left:'0%', width:'98%', position:'absolute' as const }
  }

  const visibleAppts = view === 'week' ? appointments : appointments.filter(a => a.day === selectedDay)
  const history = selected && !selected.isNew ? patientHistories[selected.patientId] : null

  return (
    <div className="flex h-full fade-in">
      {/* Calendar */}
      <div className={`${selected ? 'flex-1' : 'w-full'} flex flex-col transition-all duration-200 min-w-0`}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Agenda</h1>
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <button className="p-1 hover:bg-slate-100 rounded">‹</button>
              <span className="font-medium text-slate-700 px-2">4–9 Ago 2026</span>
              <button className="p-1 hover:bg-slate-100 rounded">›</button>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex border border-slate-200 rounded-lg overflow-hidden text-sm">
              {(['week','day'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1.5 font-medium transition-colors ${view === v ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                  {v === 'week' ? 'Semana' : 'Día'}
                </button>
              ))}
            </div>
            <button className="px-3 py-1.5 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 transition-colors">+ Nueva cita</button>
          </div>
        </div>

        {view === 'week' && (
          <div className="flex bg-white border-b border-slate-100">
            <div className="w-14 shrink-0" />
            {DAYS.map((d, i) => (
              <div key={i} className="flex-1 text-center py-3 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => { setSelectedDay(i); setView('day') }}>
                <p className="text-xs text-slate-400">{d}</p>
                <p className={`text-lg font-semibold mt-0.5 ${i===0?'text-cyan-600':'text-slate-700'}`} style={{fontFamily:'Outfit'}}>{4+i}</p>
                <p className="text-xs text-slate-400">{appointments.filter(a=>a.day===i).length} citas</p>
              </div>
            ))}
          </div>
        )}

        {view === 'day' && (
          <div className="flex items-center gap-2 bg-white border-b border-slate-100 px-5 py-2">
            <button onClick={() => setView('week')} className="text-sm text-slate-400 hover:text-slate-600">← Semana</button>
            {DAYS.map((d,i) => (
              <button key={i} onClick={() => setSelectedDay(i)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedDay===i?'bg-slate-800 text-white':'text-slate-500 hover:bg-slate-100'}`}>
                {d} {4+i}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-slate-50">
          <div className="flex min-h-full">
            <div className="w-14 shrink-0 bg-white border-r border-slate-100">
              {HOURS.map(h => (
                <div key={h} className="border-b border-slate-100" style={{height:CELL_HEIGHT}}>
                  <span className="text-xs text-slate-400 font-mono pl-2 -translate-y-2 block">{h}:00</span>
                </div>
              ))}
            </div>
            <div className="flex-1 relative">
              {HOURS.map(h => (
                <div key={h} className="border-b border-slate-100 hover:bg-cyan-50/30 transition-colors cursor-cell group"
                  style={{height:CELL_HEIGHT}}
                  onClick={() => setNewApptModal({ day: view==='day'?selectedDay:0, hour:h })}>
                  <span className="absolute left-2 top-1 text-xs text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity">+ {h}:00</span>
                </div>
              ))}

              {visibleAppts.map(a => (
                <div key={a.id}
                  style={getStyle(a)}
                  onClick={e => { e.stopPropagation(); setSelected(a) }}
                  className={`${COLORS[a.type]} border rounded-lg px-2 py-1 overflow-hidden cursor-pointer transition-shadow hover:shadow-md ${selected?.id===a.id?'ring-2 ring-cyan-400 shadow-md':''} ${a.isNew?'border-dashed':''}`}>
                  <p className="text-xs font-semibold truncate">{a.patient}</p>
                  {(a.duration/60)*CELL_HEIGHT > 30 && (
                    <p className="text-xs opacity-70 truncate">{PROC_LABELS[a.type]}</p>
                  )}
                  {a.isNew && <span className="text-[9px] font-bold opacity-80">★ NUEVO</span>}
                </div>
              ))}

              <div className="absolute inset-x-0 pointer-events-none z-10"
                style={{top:((new Date().getHours()-7)*CELL_HEIGHT)+(new Date().getMinutes()/60*CELL_HEIGHT)}}>
                <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></div><div className="flex-1 h-px bg-rose-400"></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patient history side panel — feedback #1 */}
      {selected && (
        <div className="w-80 shrink-0 border-l border-slate-200 bg-white flex flex-col h-full overflow-y-auto slide-up">
          <div className="p-4 border-b border-slate-100 flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">{FULL_DAYS[selected.day]} · {selected.startH}:00 · {selected.duration}min</p>
              <p className="font-semibold text-slate-900 mt-0.5" style={{fontFamily:'Outfit'}}>{selected.patient}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${COLORS[selected.type]} font-medium`}>{PROC_LABELS[selected.type]}</span>
            </div>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1">×</button>
          </div>

          {/* New patient empty state — feedback #1 */}
          {selected.isNew ? (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
              </div>
              <h4 className="font-semibold text-slate-800 mb-1" style={{fontFamily:'Outfit'}}>Paciente nuevo</h4>
              <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                <strong className="text-slate-600">{selected.patient}</strong> asiste por primera vez. No tiene historial clínico previo.
              </p>
              <div className="w-full space-y-2">
                <button className="w-full py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 transition-colors">
                  Registrar como nuevo paciente
                </button>
                <button className="w-full py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                  Ver perfil (sin historial)
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-4">Podrás crear la historia clínica al finalizar esta consulta</p>
            </div>
          ) : (
            /* Existing patient history */
            <div className="flex-1 p-4 space-y-4">
              {history ? (
                <>
                  <div className="bg-slate-50 rounded-xl p-3 text-sm">
                    <p className="text-xs text-slate-400 mb-1 font-medium">Última visita</p>
                    <p className="font-semibold text-slate-700">{history.lastVisit}</p>
                  </div>

                  {/* Mini timeline */}
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Historial clínico</p>
                    <div className="relative">
                      <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-100"></div>
                      <div className="space-y-3">
                        {history.records.map((r, i) => (
                          <div key={i} className="flex gap-3 items-start pl-1">
                            <div className="w-5 h-5 bg-cyan-100 rounded-full flex items-center justify-center shrink-0 z-10">
                              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                            </div>
                            <div>
                              <p className="text-xs font-mono text-slate-400">{r.date}</p>
                              <p className="text-sm font-medium text-slate-700">{r.motivo}</p>
                              <p className="text-xs text-slate-400">{r.proc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button className="w-full py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 transition-colors">
                    Abrir perfil completo
                  </button>
                  <button className="w-full py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                    Nueva historia clínica
                  </button>
                </>
              ) : (
                <p className="text-sm text-slate-400 text-center py-6">Sin historial disponible</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* New appt modal */}
      {newApptModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setNewApptModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-96 slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{fontFamily:'Outfit'}}>
              Nueva cita — {FULL_DAYS[newApptModal.day]} {newApptModal.hour}:00
            </h3>
            <div className="space-y-3">
              <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" placeholder="Buscar paciente..." />
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                <option>Seleccionar procedimiento...</option>
                {Object.entries(PROC_LABELS).map(([k,v]) => <option key={k}>{v}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="time" defaultValue={`${newApptModal.hour}:00`} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" />
                <select className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                  <option>30 min</option><option>45 min</option><option>60 min</option><option>90 min</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setNewApptModal(null)} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={() => setNewApptModal(null)} className="flex-1 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors">Agendar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
