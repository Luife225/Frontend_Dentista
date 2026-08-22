import { useState } from 'react'

const appointments = [
  { time: '08:30', patient: 'María González', procedure: 'Limpieza + profilaxis', duration: 45, status: 'confirmed', room: 1 },
  { time: '09:15', patient: 'Carlos Rivas', procedure: 'Extracción #38', duration: 60, status: 'confirmed', room: 1 },
  { time: '10:30', patient: 'Sofía Mendez', procedure: 'Corona provisional', duration: 90, status: 'pending', room: 1 },
  { time: '12:00', patient: 'Andrés Torres', procedure: 'Blanqueamiento', duration: 75, status: 'confirmed', room: 2 },
  { time: '14:00', patient: 'Lucía Reyes', procedure: 'Ortodoncia control', duration: 30, status: 'confirmed', room: 1 },
  { time: '15:00', patient: 'Javier Molina', procedure: 'Radiografía + diagnóstico', duration: 40, status: 'unconfirmed', room: 2 },
  { time: '16:30', patient: 'Valentina Cruz', procedure: 'Resina composit #14', duration: 60, status: 'confirmed', room: 1 },
]

const alerts = [
  { type: 'warning', message: '3 pacientes sin confirmar para hoy', action: 'Enviar recordatorio' },
  { type: 'info', message: 'Stock de guantes nitrilo bajo (12 cajas)', action: 'Ver inventario' },
  { type: 'success', message: '2 pagos recibidos esta mañana — $450.000', action: 'Ver caja' },
]

const stats = [
  { label: 'Citas hoy', value: '7', sub: '5 confirmadas', color: 'teal' },
  { label: 'Pacientes nuevos', value: '2', sub: 'Este mes: 14', color: 'emerald' },
  { label: 'Ingresos hoy', value: '$680.000', sub: 'Meta: $900.000', color: 'amber' },
  { label: 'Próxima cita', value: '09:15', sub: 'Carlos Rivas · 32 min', color: 'navy' },
]

const now = new Date()
const currentHour = now.getHours()
const currentMin = now.getMinutes()

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export default function Dashboard() {
  const [currentTime] = useState(`${String(currentHour).padStart(2,'0')}:${String(currentMin).padStart(2,'0')}`)
  const nowMin = timeToMinutes(currentTime)

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 font-medium tracking-wide uppercase" style={{fontFamily:'Outfit'}}>
            {new Date().toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 mt-0.5" style={{fontFamily:'Outfit'}}>
            Buenos días, Dr. Herrera
          </h1>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium">
            Nueva cita
          </button>
          <button className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors">
            Nuevo paciente
          </button>
        </div>
      </div>

      {/* Alerts strip */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm ${
              a.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-800' :
              a.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' :
              'bg-sky-50 border border-sky-200 text-sky-800'
            }`}>
              <div className="flex items-center gap-2">
                <span>{a.type === 'warning' ? '⚠' : a.type === 'success' ? '✓' : 'ℹ'}</span>
                <span>{a.message}</span>
              </div>
              <button className="font-medium underline underline-offset-2 hover:no-underline">{a.action}</button>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider" style={{fontFamily:'Outfit'}}>{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${
              s.color === 'teal' ? 'text-cyan-600' :
              s.color === 'emerald' ? 'text-emerald-600' :
              s.color === 'amber' ? 'text-amber-600' : 'text-slate-900'
            }`} style={{fontFamily:'Outfit'}}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Timeline + Quick actions */}
      <div className="grid grid-cols-3 gap-5">
        {/* Today's timeline */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Agenda de hoy</h2>
            <span className="text-xs text-slate-400 font-mono">{currentTime} hs</span>
          </div>
          <div className="divide-y divide-slate-50">
            {appointments.map((apt, i) => {
              const aptMin = timeToMinutes(apt.time)
              const isPast = aptMin + apt.duration < nowMin
              const isActive = aptMin <= nowMin && aptMin + apt.duration > nowMin
              return (
                <div key={i} className={`flex items-center gap-4 px-5 py-3 transition-colors hover:bg-slate-50 ${isPast ? 'opacity-45' : ''} ${isActive ? 'bg-cyan-50' : ''}`}>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0 shadow-sm shadow-cyan-400"></div>
                  )}
                  <span className={`text-sm font-mono shrink-0 w-12 ${isActive ? 'text-cyan-700 font-medium' : 'text-slate-400'}`}>{apt.time}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{apt.patient}</p>
                    <p className="text-xs text-slate-400 truncate">{apt.procedure} · {apt.duration} min</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-400">Box {apt.room}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                      apt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {apt.status === 'confirmed' ? 'Confirmada' : apt.status === 'pending' ? 'En espera' : 'Sin confirmar'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Next patient */}
          <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-xl p-5 text-white shadow-sm">
            <p className="text-xs font-medium opacity-70 uppercase tracking-wider" style={{fontFamily:'Outfit'}}>Próxima cita</p>
            <p className="text-2xl font-bold mt-1" style={{fontFamily:'Outfit'}}>09:15</p>
            <p className="font-semibold mt-1">Carlos Rivas</p>
            <p className="text-sm opacity-80 mt-0.5">Extracción #38 · 60 min</p>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 bg-white/20 hover:bg-white/30 transition-colors text-white text-xs font-medium py-1.5 rounded-lg">
                Ver ficha
              </button>
              <button className="flex-1 bg-white/20 hover:bg-white/30 transition-colors text-white text-xs font-medium py-1.5 rounded-lg">
                Llamar
              </button>
            </div>
          </div>

          {/* Unconfirmed */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-slate-800 mb-3" style={{fontFamily:'Outfit'}}>Sin confirmar (3)</p>
            {appointments.filter(a => a.status === 'unconfirmed').concat(appointments.filter(a => a.status === 'pending')).slice(0,3).map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-700">{a.patient}</p>
                  <p className="text-xs text-slate-400">{a.time} · {a.procedure.slice(0,20)}</p>
                </div>
                <button className="text-xs text-cyan-600 font-medium hover:underline">Recordar</button>
              </div>
            ))}
          </div>

          {/* Quick stats donut replacement */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-slate-800 mb-3" style={{fontFamily:'Outfit'}}>Estado de citas</p>
            {[
              { label:'Confirmadas', val: 5, total: 7, color:'bg-emerald-400' },
              { label:'Pendientes', val: 1, total: 7, color:'bg-amber-400' },
              { label:'Sin confirmar', val: 1, total: 7, color:'bg-slate-200' },
            ].map((row,i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{row.label}</span>
                  <span className="font-mono">{row.val}/{row.total}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${row.color} rounded-full`} style={{width: `${(row.val/row.total)*100}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
