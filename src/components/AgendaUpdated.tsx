import { useState } from 'react'

// Agenda updated per feedback #1:
// Clicking a cita shows patient history panel. New patient → explicit empty state.

const HOURS = Array.from({ length: 11 }, (_, i) => i + 7)
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const FULL_DAYS = ['Lunes 4 Ago', 'Martes 5 Ago', 'Miércoles 6 Ago', 'Jueves 7 Ago', 'Viernes 8 Ago', 'Sábado 9 Ago']
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
  limpieza: 'Limpieza / Profilaxis',
  extraccion: 'Extracción dental',
  ortodoncia: 'Control ortodoncia',
  corona: 'Corona / Prótesis',
  blanqueamiento: 'Blanqueamiento',
  endodoncia: 'Endodoncia',
  control: 'Control general',
  primera: 'Primera consulta / Valoración',
}

const INITIAL_APPOINTMENTS = [
  { id: 1, day: 0, startH: 8, startM: 30, duration: 45, patient: 'María González', patientId: 2, type: 'limpieza', room: 1, isNew: false, dr: 'Dra. Suárez', notes: 'Limpieza semestral de rutina' },
  { id: 2, day: 0, startH: 9, startM: 15, duration: 60, patient: 'Carlos Rivas', patientId: 1, type: 'extraccion', room: 1, isNew: false, dr: 'Dr. Herrera', notes: 'Extracción molar #38' },
  { id: 3, day: 0, startH: 10, startM: 30, duration: 90, patient: 'Sofía Mendez', patientId: 3, type: 'corona', room: 1, isNew: false, dr: 'Dr. Herrera', notes: 'Toma de impresión definitiva' },
  { id: 4, day: 0, startH: 12, startM: 0, duration: 75, patient: 'Andrés Torres', patientId: 99, type: 'primera', room: 2, isNew: true, dr: 'Dra. Suárez', notes: 'Paciente nuevo por dolor en premolar' },
  { id: 5, day: 0, startH: 14, startM: 0, duration: 30, patient: 'Lucía Reyes', patientId: 5, type: 'ortodoncia', room: 1, isNew: false, dr: 'Dr. Herrera', notes: 'Ajuste de brackets superior' },
  { id: 6, day: 0, startH: 16, startM: 30, duration: 60, patient: 'Valentina Cruz', patientId: 6, type: 'limpieza', room: 1, isNew: false, dr: 'Dra. Suárez', notes: 'Limpieza ultrasónica' },
  { id: 7, day: 1, startH: 9, startM: 0, duration: 90, patient: 'Roberto Patiño', patientId: 7, type: 'endodoncia', room: 1, isNew: false, dr: 'Dr. Herrera', notes: 'Segunda sesión conductos' },
  { id: 8, day: 2, startH: 10, startM: 0, duration: 45, patient: 'Ana López', patientId: 98, type: 'primera', room: 1, isNew: true, dr: 'Dra. Suárez', notes: 'Primera valoración estética' },
]

const PATIENT_OPTIONS = [
  { id: 1, name: 'Carlos Rivas', isNew: false },
  { id: 2, name: 'María González', isNew: false },
  { id: 3, name: 'Sofía Mendez', isNew: false },
  { id: 5, name: 'Lucía Reyes', isNew: false },
  { id: 6, name: 'Valentina Cruz', isNew: false },
  { id: 7, name: 'Roberto Patiño', isNew: false },
  { id: 99, name: 'Andrés Torres', isNew: true },
]

const patientHistories: Record<number, { lastVisit: string, records: { date: string, motivo: string, proc: string }[] }> = {
  1: { lastVisit: '2026-08-01', records: [
    { date: '2026-08-01', motivo: 'Dolor posterior inferior', proc: 'Exploración + Flúor' },
    { date: '2026-05-22', motivo: 'Control periódico', proc: 'Limpieza ultrasónica' },
  ]},
  2: { lastVisit: '2026-07-14', records: [
    { date: '2026-07-14', motivo: 'Control ortodoncia', proc: 'Activación brackets' },
    { date: '2026-05-10', motivo: 'Control mensual', proc: 'Ajuste elásticos' },
  ]},
  3: { lastVisit: '2026-06-20', records: [
    { date: '2026-06-20', motivo: 'Corona provisional', proc: 'Preparación para corona definitiva' },
  ]},
}

interface SelectedAppt {
  id: number
  patient: string
  patientId: number
  type: string
  isNew: boolean
  day: number
  startH: number
  duration: number
  room: number
  dr?: string
  notes?: string
}

export default function AgendaUpdated() {
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS)
  const [view, setView] = useState<'week' | 'day'>('week')
  const [selectedDay, setSelectedDay] = useState(0)
  const [selected, setSelected] = useState<SelectedAppt | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)

  // Form state for new appointment
  const [formPatient, setFormPatient] = useState('Carlos Rivas')
  const [customPatientName, setCustomPatientName] = useState('')
  const [isNewPatientCheck, setIsNewPatientCheck] = useState(false)
  const [formDay, setFormDay] = useState(0)
  const [formHour, setFormHour] = useState(9)
  const [formMinute, setFormMinute] = useState(0)
  const [formDuration, setFormDuration] = useState(45)
  const [formType, setFormType] = useState('control')
  const [formDr, setFormDr] = useState('Dr. Herrera')
  const [formRoom, setFormRoom] = useState(1)
  const [formNotes, setFormNotes] = useState('')
  const [toastMsg, setToastMsg] = useState('')

  function getStyle(a: typeof appointments[0]) {
    const top = (a.startH - 7) * CELL_HEIGHT + (a.startM / 60) * CELL_HEIGHT
    const height = (a.duration / 60) * CELL_HEIGHT - 2
    if (view === 'week') {
      return { top, height, left: `${(a.day / 6) * 100}%`, width: `${(1 / 6) * 100 - 1}%`, position: 'absolute' as const }
    }
    return { top, height, left: '0%', width: '98%', position: 'absolute' as const }
  }

  function handleOpenCreate(dayIdx = 0, hour = 9) {
    setFormDay(dayIdx)
    setFormHour(hour)
    setFormMinute(0)
    setShowNewModal(true)
  }

  function handleSaveNewAppointment() {
    const finalPatientName = isNewPatientCheck ? (customPatientName || 'Paciente Nuevo') : formPatient
    const matchedPatient = PATIENT_OPTIONS.find(p => p.name === finalPatientName)
    const pId = matchedPatient ? matchedPatient.id : Date.now()

    const newAppt = {
      id: Date.now(),
      day: Number(formDay),
      startH: Number(formHour),
      startM: Number(formMinute),
      duration: Number(formDuration),
      patient: finalPatientName,
      patientId: pId,
      type: formType,
      room: Number(formRoom),
      isNew: isNewPatientCheck,
      dr: formDr,
      notes: formNotes,
    }

    setAppointments(prev => [...prev, newAppt])
    setShowNewModal(false)
    setCustomPatientName('')
    setIsNewPatientCheck(false)
    setFormNotes('')
    setToastMsg(`Cita agendada para ${finalPatientName} el ${FULL_DAYS[formDay]} a las ${formHour}:${String(formMinute).padStart(2, '0')}`)
    setTimeout(() => setToastMsg(''), 4000)
  }

  const visibleAppts = view === 'week' ? appointments : appointments.filter(a => a.day === selectedDay)
  const history = selected && !selected.isNew ? patientHistories[selected.patientId] : null

  return (
    <div className="flex h-full fade-in relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-teal-500/40 fade-in">
          <span className="text-emerald-400 font-bold text-lg">✓</span>
          <div>
            <p className="font-semibold text-xs text-white" style={{ fontFamily: 'Outfit' }}>Cita confirmada</p>
            <p className="text-xs text-slate-300">{toastMsg}</p>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className={`${selected ? 'flex-1' : 'w-full'} flex flex-col transition-all duration-200 min-w-0`}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-900" style={{ fontFamily: 'Outfit' }}>Agenda Clínica</h1>
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700">‹</button>
              <span className="font-medium text-slate-700 px-2 text-xs sm:text-sm">4–9 Ago 2026</span>
              <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700">›</button>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex border border-slate-200 rounded-lg overflow-hidden text-sm">
              {(['week', 'day'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1.5 font-medium transition-colors text-xs sm:text-sm ${view === v ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                  {v === 'week' ? 'Semana' : 'Día'}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleOpenCreate(view === 'day' ? selectedDay : 0, 9)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-cyan-700 transition-colors shadow-sm">
              <span>+</span> Nueva cita
            </button>
          </div>
        </div>

        {view === 'week' && (
          <div className="flex bg-white border-b border-slate-100">
            <div className="w-14 shrink-0" />
            {DAYS.map((d, i) => (
              <div key={i} className="flex-1 text-center py-2.5 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => { setSelectedDay(i); setView('day') }}>
                <p className="text-xs text-slate-400 font-medium">{d}</p>
                <p className={`text-base font-bold mt-0.5 ${i === 0 ? 'text-cyan-600' : 'text-slate-700'}`} style={{ fontFamily: 'Outfit' }}>{4 + i}</p>
                <p className="text-[10px] text-slate-400">{appointments.filter(a => a.day === i).length} citas</p>
              </div>
            ))}
          </div>
        )}

        {view === 'day' && (
          <div className="flex items-center gap-2 bg-white border-b border-slate-100 px-5 py-2">
            <button onClick={() => setView('week')} className="text-xs text-slate-400 hover:text-slate-600 font-medium">← Ver semana</button>
            <span className="text-slate-300">|</span>
            {DAYS.map((d, i) => (
              <button key={i} onClick={() => setSelectedDay(i)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${selectedDay === i ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                {d} {4 + i}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-slate-50">
          <div className="flex min-h-full">
            <div className="w-14 shrink-0 bg-white border-r border-slate-100">
              {HOURS.map(h => (
                <div key={h} className="border-b border-slate-100" style={{ height: CELL_HEIGHT }}>
                  <span className="text-xs text-slate-400 font-mono pl-2 -translate-y-2 block">{h}:00</span>
                </div>
              ))}
            </div>
            <div className="flex-1 relative">
              {HOURS.map(h => (
                <div key={h} className="border-b border-slate-100 hover:bg-cyan-50/40 transition-colors cursor-cell group"
                  style={{ height: CELL_HEIGHT }}
                  onClick={() => handleOpenCreate(view === 'day' ? selectedDay : 0, h)}>
                  <span className="absolute left-2 top-1 text-xs text-cyan-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    + Agendar a las {h}:00
                  </span>
                </div>
              ))}

              {visibleAppts.map(a => (
                <div key={a.id}
                  style={getStyle(a)}
                  onClick={e => { e.stopPropagation(); setSelected(a as any) }}
                  className={`${COLORS[a.type] || 'bg-slate-100 border-slate-300 text-slate-800'} border rounded-lg px-2 py-1 overflow-hidden cursor-pointer transition-shadow hover:shadow-md ${selected?.id === a.id ? 'ring-2 ring-cyan-500 shadow-md' : ''} ${a.isNew ? 'border-dashed' : ''}`}>
                  <p className="text-xs font-semibold truncate">{a.patient}</p>
                  {(a.duration / 60) * CELL_HEIGHT > 30 && (
                    <p className="text-[11px] opacity-80 truncate">{PROC_LABELS[a.type] || a.type}</p>
                  )}
                  {a.isNew && <span className="text-[9px] font-bold text-cyan-800 bg-cyan-100/80 px-1 py-0.2 rounded">★ NUEVO</span>}
                </div>
              ))}

              <div className="absolute inset-x-0 pointer-events-none z-10"
                style={{ top: ((new Date().getHours() - 7) * CELL_HEIGHT) + (new Date().getMinutes() / 60 * CELL_HEIGHT) }}>
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
              <p className="text-xs text-slate-400 font-medium">{FULL_DAYS[selected.day]} · {selected.startH}:00 · {selected.duration} min</p>
              <p className="font-semibold text-slate-900 mt-0.5" style={{ fontFamily: 'Outfit' }}>{selected.patient}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${COLORS[selected.type] || 'bg-slate-100 text-slate-700'} font-medium`}>
                {PROC_LABELS[selected.type] || selected.type}
              </span>
            </div>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1">×</button>
          </div>

          {selected.notes && (
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs text-slate-600">
              <span className="font-semibold text-slate-500">Nota:</span> {selected.notes}
            </div>
          )}

          {/* New patient empty state — feedback #1 */}
          {selected.isNew ? (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
              </div>
              <h4 className="font-semibold text-slate-800 mb-1" style={{ fontFamily: 'Outfit' }}>Paciente nuevo</h4>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                <strong className="text-slate-700">{selected.patient}</strong> asiste por primera vez a CORONYX. No tiene antecedentes clínicos registrados.
              </p>
              <div className="w-full space-y-2">
                <button
                  onClick={() => {
                    setToastMsg(`Ficha de registro abierta para ${selected.patient}`)
                    setTimeout(() => setToastMsg(''), 3000)
                  }}
                  className="w-full py-2.5 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-500 transition-colors">
                  Registrar datos del paciente
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-4">Podrás crear la historia clínica al finalizar la consulta</p>
            </div>
          ) : (
            /* Existing patient history */
            <div className="flex-1 p-4 space-y-4">
              {history ? (
                <>
                  <div className="bg-slate-50 rounded-xl p-3 text-xs">
                    <p className="text-slate-400 mb-1 font-medium">Última visita registrada</p>
                    <p className="font-semibold text-slate-700 text-sm">{history.lastVisit}</p>
                  </div>

                  {/* Mini timeline */}
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" style={{ fontFamily: 'Outfit' }}>Historial previo</p>
                    <div className="relative">
                      <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-100"></div>
                      <div className="space-y-3">
                        {history.records.map((r, i) => (
                          <div key={i} className="flex gap-3 items-start pl-1">
                            <div className="w-5 h-5 bg-cyan-100 rounded-full flex items-center justify-center shrink-0 z-10">
                              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                            </div>
                            <div>
                              <p className="text-[11px] font-mono text-slate-400">{r.date}</p>
                              <p className="text-xs font-semibold text-slate-700">{r.motivo}</p>
                              <p className="text-[11px] text-slate-500">{r.proc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => {
                        setToastMsg(`Abriendo expediente de ${selected.patient}`)
                        setTimeout(() => setToastMsg(''), 3000)
                      }}
                      className="w-full py-2.5 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-500 transition-colors">
                      Ver historia clínica completa
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">Sin historial adicional</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Programar Nueva Cita (Detallado) ── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden fade-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>
                  Agendar nueva cita
                </h2>
                <p className="text-xs text-slate-400">Selecciona paciente, día, hora y procedimiento</p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center text-xl leading-none transition-colors">
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4 flex-1">
              {/* Paciente selection / toggle nuevo */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-600">Paciente</label>
                  <label className="flex items-center gap-1.5 text-xs text-cyan-700 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={isNewPatientCheck}
                      onChange={e => setIsNewPatientCheck(e.target.checked)}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    ¿Es paciente nuevo?
                  </label>
                </div>

                {isNewPatientCheck ? (
                  <input
                    type="text"
                    value={customPatientName}
                    onChange={e => setCustomPatientName(e.target.value)}
                    placeholder="Escribe el nombre completo del paciente nuevo..."
                    className="w-full px-3 py-2.5 border border-cyan-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-cyan-50/20"
                  />
                ) : (
                  <select
                    value={formPatient}
                    onChange={e => setFormPatient(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-white">
                    {PATIENT_OPTIONS.map(p => (
                      <option key={p.id} value={p.name}>{p.name} {p.isNew ? '(Nuevo)' : ''}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Día y Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Día de la semana</label>
                  <select
                    value={formDay}
                    onChange={e => setFormDay(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-white">
                    {FULL_DAYS.map((d, i) => (
                      <option key={i} value={i}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Hora</label>
                    <select
                      value={formHour}
                      onChange={e => setFormHour(Number(e.target.value))}
                      className="w-full px-2 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-white">
                      {HOURS.map(h => (
                        <option key={h} value={h}>{h}:00</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Minuto</label>
                    <select
                      value={formMinute}
                      onChange={e => setFormMinute(Number(e.target.value))}
                      className="w-full px-2 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-white">
                      <option value={0}>:00</option>
                      <option value={15}>:15</option>
                      <option value={30}>:30</option>
                      <option value={45}>:45</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Procedimiento y Duración */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Procedimiento / Motivo</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-white">
                    {Object.entries(PROC_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Duración estimada</label>
                  <select
                    value={formDuration}
                    onChange={e => setFormDuration(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-white">
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos (1h)</option>
                    <option value={90}>90 minutos (1.5h)</option>
                    <option value={120}>120 minutos (2h)</option>
                  </select>
                </div>
              </div>

              {/* Odontólogo y Box */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Odontólogo asignado</label>
                  <select
                    value={formDr}
                    onChange={e => setFormDr(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-white">
                    <option value="Dr. Herrera">Dr. Carlos Herrera</option>
                    <option value="Dra. Suárez">Dra. Marcela Suárez</option>
                    <option value="Dr. Morales">Dr. Carlos Morales</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Box / Consultorio</label>
                  <select
                    value={formRoom}
                    onChange={e => setFormRoom(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-white">
                    <option value={1}>Box 1 (General + Rx)</option>
                    <option value={2}>Box 2 (Estética / Limpieza)</option>
                    <option value={3}>Box 3 (Ortodoncia)</option>
                  </select>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Notas adicionales o requerimientos</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Ej: Requiere anestesia especial, radiografía previa, paciente alérgico..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowNewModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-100 transition-colors font-medium">
                Cancelar
              </button>
              <button
                onClick={handleSaveNewAppointment}
                className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
                Confirmar y Agendar Cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
