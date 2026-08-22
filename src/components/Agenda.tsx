import { useState } from 'react'

const HOURS = Array.from({ length: 11 }, (_, i) => i + 7) // 7am to 5pm
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const FULL_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const COLORS = {
  limpieza: 'bg-sky-100 border-sky-300 text-sky-800',
  extraccion: 'bg-rose-100 border-rose-300 text-rose-800',
  ortodoncia: 'bg-violet-100 border-violet-300 text-violet-800',
  corona: 'bg-amber-100 border-amber-300 text-amber-800',
  blanqueamiento: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  endodoncia: 'bg-orange-100 border-orange-300 text-orange-800',
  control: 'bg-slate-100 border-slate-300 text-slate-700',
}

type ApptType = keyof typeof COLORS

const appointments: Array<{
  id: number, day: number, startH: number, startM: number, duration: number,
  patient: string, type: ApptType, room: number
}> = [
  { id:1, day:0, startH:8, startM:30, duration:45, patient:'María González', type:'limpieza', room:1 },
  { id:2, day:0, startH:9, startM:15, duration:60, patient:'Carlos Rivas', type:'extraccion', room:1 },
  { id:3, day:0, startH:10, startM:30, duration:90, patient:'Sofía Mendez', type:'corona', room:1 },
  { id:4, day:0, startH:12, startM:0, duration:75, patient:'Andrés Torres', type:'blanqueamiento', room:2 },
  { id:5, day:0, startH:14, startM:0, duration:30, patient:'Lucía Reyes', type:'ortodoncia', room:1 },
  { id:6, day:0, startH:15, startM:0, duration:40, patient:'Javier Molina', type:'control', room:2 },
  { id:7, day:0, startH:16, startM:30, duration:60, patient:'Valentina Cruz', type:'limpieza', room:1 },
  { id:8, day:1, startH:8, startM:0, duration:90, patient:'Roberto Patiño', type:'endodoncia', room:1 },
  { id:9, day:1, startH:10, startM:30, duration:30, patient:'Ana López', type:'control', room:2 },
  { id:10, day:1, startH:13, startM:0, duration:60, patient:'David Sánchez', type:'blanqueamiento', room:1 },
  { id:11, day:2, startH:9, startM:0, duration:120, patient:'Isabel Morales', type:'ortodoncia', room:1 },
  { id:12, day:2, startH:11, startM:0, duration:45, patient:'Fernando Díaz', type:'limpieza', room:2 },
  { id:13, day:3, startH:8, startM:30, duration:60, patient:'Patricia Villa', type:'corona', room:1 },
  { id:14, day:3, startH:15, startM:0, duration:30, patient:'Miguel Ríos', type:'control', room:1 },
  { id:15, day:4, startH:10, startM:0, duration:90, patient:'Claudia Herrera', type:'extraccion', room:2 },
]

const PROC_LABELS: Record<ApptType, string> = {
  limpieza: 'Limpieza', extraccion: 'Extracción', ortodoncia: 'Ortodoncia',
  corona: 'Corona', blanqueamiento: 'Blanqueamiento', endodoncia: 'Endodoncia', control: 'Control',
}

const CELL_HEIGHT = 60 // px per hour

export default function Agenda() {
  const [view, setView] = useState<'week'|'day'>('week')
  const [selectedDay, setSelectedDay] = useState(0)
  const [dragging, setDragging] = useState<number | null>(null)
  const [newApptDay, setNewApptDay] = useState<{day:number,hour:number}|null>(null)

  const visibleAppts = view === 'week' ? appointments : appointments.filter(a => a.day === selectedDay)

  function getStyle(a: typeof appointments[0], dayIndex: number) {
    const top = (a.startH - 7) * CELL_HEIGHT + (a.startM / 60) * CELL_HEIGHT
    const height = (a.duration / 60) * CELL_HEIGHT - 2
    const left = view === 'week' ? `${(dayIndex / 6) * 100}%` : '0%'
    const width = view === 'week' ? `${(1 / 6) * 100 - 1}%` : '98%'
    return { top, height, left, width, position:'absolute' as const }
  }

  return (
    <div className="flex flex-col h-full fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Agenda</h1>
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <button className="p-1 hover:bg-slate-100 rounded">‹</button>
            <span className="font-medium text-slate-700 px-2">4–9 Ago 2026</span>
            <button className="p-1 hover:bg-slate-100 rounded">›</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="flex gap-2 mr-3">
            {(Object.entries(PROC_LABELS) as [ApptType, string][]).slice(0,4).map(([k, v]) => (
              <span key={k} className={`text-xs px-2 py-0.5 rounded border ${COLORS[k]}`}>{v}</span>
            ))}
          </div>
          <div className="flex border border-slate-200 rounded-lg overflow-hidden text-sm">
            {(['week','day'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 font-medium transition-colors ${view === v ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                {v === 'week' ? 'Semana' : 'Día'}
              </button>
            ))}
          </div>
          <button className="px-3 py-1.5 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 transition-colors">
            + Nueva cita
          </button>
        </div>
      </div>

      {/* Day headers (week view) */}
      {view === 'week' && (
        <div className="flex bg-white border-b border-slate-100">
          <div className="w-14 shrink-0" />
          {DAYS.map((d, i) => (
            <div key={i} className="flex-1 text-center py-3 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => { setSelectedDay(i); setView('day') }}>
              <p className="text-xs text-slate-400">{d}</p>
              <p className={`text-lg font-semibold mt-0.5 ${i === 0 ? 'text-cyan-600' : 'text-slate-700'}`} style={{fontFamily:'Outfit'}}>{4 + i}</p>
              <p className="text-xs text-slate-400">{appointments.filter(a => a.day === i).length} citas</p>
            </div>
          ))}
        </div>
      )}

      {/* Day view header */}
      {view === 'day' && (
        <div className="flex items-center gap-3 bg-white border-b border-slate-100 px-6 py-3">
          <button onClick={() => setView('week')} className="text-sm text-slate-400 hover:text-slate-600">← Semana</button>
          <div className="flex gap-2">
            {DAYS.map((d, i) => (
              <button key={i} onClick={() => setSelectedDay(i)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedDay === i ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                {d} {4+i}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="flex min-h-full">
          {/* Time labels */}
          <div className="w-14 shrink-0 bg-white border-r border-slate-100">
            {HOURS.map(h => (
              <div key={h} className="border-b border-slate-100" style={{height: CELL_HEIGHT}}>
                <span className="text-xs text-slate-400 font-mono pl-2 -translate-y-2 block">{h}:00</span>
              </div>
            ))}
          </div>

          {/* Appointment area */}
          <div className="flex-1 relative">
            {/* Background grid */}
            {HOURS.map(h => (
              <div key={h} className="border-b border-slate-100" style={{height: CELL_HEIGHT}} />
            ))}

            {/* Drop target overlay (click to add) */}
            {HOURS.map(h => (
              <div key={h}
                className="absolute inset-x-0 hover:bg-cyan-50/40 transition-colors group cursor-cell"
                style={{ top: (h - 7) * CELL_HEIGHT, height: CELL_HEIGHT }}
                onClick={() => setNewApptDay({ day: selectedDay, hour: h })}
              >
                <span className="absolute left-2 top-1 text-xs text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity">+ {h}:00</span>
              </div>
            ))}

            {/* Appointments */}
            {(view === 'week' ? appointments : visibleAppts).map(a => (
              <div
                key={a.id}
                style={getStyle(a, view === 'week' ? a.day : 0)}
                className={`${COLORS[a.type]} border rounded-lg px-2 py-1 overflow-hidden cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${dragging === a.id ? 'opacity-70 shadow-lg ring-2 ring-cyan-400' : ''}`}
                onMouseDown={() => setDragging(a.id)}
                onMouseUp={() => setDragging(null)}
              >
                <p className="text-xs font-semibold truncate">{a.patient}</p>
                {(a.duration / 60) * CELL_HEIGHT > 30 && (
                  <p className="text-xs opacity-70 truncate">{PROC_LABELS[a.type]}</p>
                )}
                {(a.duration / 60) * CELL_HEIGHT > 45 && (
                  <p className="text-xs opacity-60 font-mono">{a.startH}:{String(a.startM).padStart(2,'0')} · {a.duration}min · Box {a.room}</p>
                )}
              </div>
            ))}

            {/* Current time indicator */}
            <div className="absolute inset-x-0 pointer-events-none z-10"
              style={{ top: ((new Date().getHours() - 7) * CELL_HEIGHT) + (new Date().getMinutes() / 60 * CELL_HEIGHT) }}>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></div>
                <div className="flex-1 h-px bg-rose-400"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New appointment modal */}
      {newApptDay && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setNewApptDay(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-96 slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{fontFamily:'Outfit'}}>
              Nueva cita — {FULL_DAYS[newApptDay.day]} {newApptDay.hour}:00
            </h3>
            <div className="space-y-3">
              <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" placeholder="Buscar paciente..." />
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                <option>Seleccionar procedimiento...</option>
                {Object.entries(PROC_LABELS).map(([k,v]) => <option key={k}>{v}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="time" defaultValue={`${newApptDay.hour}:00`} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" />
                <select className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                  <option>30 min</option><option>45 min</option><option>60 min</option><option>90 min</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setNewApptDay(null)} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={() => setNewApptDay(null)} className="flex-1 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors">Agendar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
