import { useState } from 'react'

const records = [
  {
    id: 1, date: '2026-08-01', patient: 'Carlos Rivas', motivo: 'Dolor agudo zona posterior inferior',
    diagnostico: 'Caries profunda #14 · Sensibilidad post-endodoncia #36',
    procedimiento: 'Exploración clínica + radiografía periapical · Aplicación flúor 2% NaF',
    plan: 'Restauración compuesta #14 · Control radiográfico #36 en 4 semanas',
    indicaciones: 'No alimentos calientes/fríos 2h. Analgésico de rescate si dolor >6/10.',
    dr: 'Dr. Herrera', duration: 45, status: 'complete',
    vitals: { pa:'120/80', fc:'78', peso:'82kg' },
  },
  {
    id: 2, date: '2026-05-22', patient: 'Carlos Rivas', motivo: 'Control periódico',
    diagnostico: 'Sin caries activas. Placa bacteriana moderada zona interproximal.',
    procedimiento: 'Limpieza ultrasónica + pulido coronas · Instrucción de higiene oral',
    plan: 'Control en 6 meses. Hilo dental diario.',
    indicaciones: 'Cepillado técnica Bass modificada. Colutorios con clorhexidina al 0.12% por 10 días.',
    dr: 'Dra. Suárez', duration: 60, status: 'complete',
    vitals: { pa:'125/82', fc:'74', peso:'81kg' },
  },
]

export default function HistoriaClinica() {
  const [selected, setSelected] = useState(records[0])
  const [tab, setTab] = useState<'records'|'new'>('records')
  const [dictating, setDictating] = useState(false)

  return (
    <div className="flex h-full fade-in">
      {/* Records list */}
      <div className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800 text-sm" style={{fontFamily:'Outfit'}}>Historia clínica</h2>
            <button onClick={() => setTab('new')} className="text-xs px-2.5 py-1 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
              + Nueva
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-xs font-bold shrink-0">CR</div>
            <div>
              <p className="font-medium text-slate-700 text-xs">Carlos Rivas</p>
              <p className="text-slate-400 text-xs">52 años · #2</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {records.map(r => (
            <div key={r.id}
              onClick={() => { setSelected(r); setTab('records') }}
              className={`px-3 py-3 rounded-lg cursor-pointer transition-colors ${selected.id === r.id ? 'bg-cyan-50 border border-cyan-200' : 'hover:bg-slate-50'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">{r.date}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${r.status === 'complete' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {r.status === 'complete' ? 'Completa' : 'Borrador'}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700 mt-1 leading-tight">{r.motivo.slice(0,45)}{r.motivo.length > 45 ? '…' : ''}</p>
              <p className="text-xs text-slate-400 mt-0.5">{r.dr} · {r.duration} min</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detail / New form */}
      {tab === 'records' ? (
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono text-slate-400">{selected.date}</p>
                <h2 className="text-lg font-semibold text-slate-900 mt-0.5" style={{fontFamily:'Outfit'}}>{selected.motivo}</h2>
                <p className="text-sm text-slate-500">{selected.dr} · {selected.duration} min</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Imprimir</button>
                <button className="px-3 py-1.5 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">Editar</button>
              </div>
            </div>

            {/* Vitals */}
            <div className="grid grid-cols-3 gap-3">
              {[
                ['Presión arterial', selected.vitals.pa, 'mmHg'],
                ['Frecuencia cardíaca', selected.vitals.fc, 'bpm'],
                ['Peso', selected.vitals.peso, ''],
              ].map(([label, val, unit]) => (
                <div key={label} className="bg-white rounded-xl border border-slate-100 p-4">
                  <p className="text-xs text-slate-400" style={{fontFamily:'Outfit'}}>{label}</p>
                  <p className="text-xl font-bold text-slate-800 mt-1" style={{fontFamily:'Outfit'}}>{val}</p>
                  <p className="text-xs text-slate-400">{unit}</p>
                </div>
              ))}
            </div>

            {/* Clinical sections */}
            {[
              { label: 'Diagnóstico', icon: '🔬', content: selected.diagnostico, color: 'amber' },
              { label: 'Procedimiento realizado', icon: '⚙', content: selected.procedimiento, color: 'blue' },
              { label: 'Plan de tratamiento', icon: '📋', content: selected.plan, color: 'cyan' },
              { label: 'Indicaciones al paciente', icon: '📝', content: selected.indicaciones, color: 'emerald' },
            ].map(({ label, icon, content, color }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span>{icon}</span>
                  <p className={`text-sm font-semibold text-${color === 'amber' ? 'amber-700' : color === 'blue' ? 'blue-700' : color === 'cyan' ? 'cyan-700' : 'emerald-700'}`} style={{fontFamily:'Outfit'}}>{label}</p>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{content}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* New record form */
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Nueva consulta</h2>
              <button
                onClick={() => setDictating(!dictating)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  dictating ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}>
                {dictating ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    Escuchando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/></svg>
                    Dictar con IA
                  </>
                )}
              </button>
            </div>

            {/* Vitals row */}
            <div className="grid grid-cols-3 gap-3">
              {['Presión arterial', 'Frec. cardíaca (bpm)', 'Peso (kg)'].map(label => (
                <div key={label}>
                  <label className="text-xs text-slate-500 font-medium block mb-1">{label}</label>
                  <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" />
                </div>
              ))}
            </div>

            {[
              { label: 'Motivo de consulta', placeholder: 'Describe el motivo principal de la visita...', rows: 2 },
              { label: 'Diagnóstico', placeholder: 'Hallazgos clínicos y diagnóstico presuntivo...', rows: 3 },
              { label: 'Procedimiento realizado', placeholder: 'Detalla cada procedimiento realizado durante la consulta...', rows: 3 },
              { label: 'Plan de tratamiento', placeholder: 'Próximos pasos, remisiones, controles...', rows: 2 },
              { label: 'Indicaciones al paciente', placeholder: 'Instrucciones post-procedimiento...', rows: 2 },
            ].map(({ label, placeholder, rows }) => (
              <div key={label}>
                <label className="text-xs text-slate-500 font-semibold block mb-1.5" style={{fontFamily:'Outfit'}}>{label}</label>
                <textarea
                  rows={rows}
                  placeholder={placeholder}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all ${
                    dictating ? 'border-rose-300 bg-rose-50 placeholder-rose-300' : 'border-slate-200 bg-white'
                  }`}
                />
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <button onClick={() => setTab('records')} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button className="flex-2 px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-500 transition-colors">
                Guardar consulta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
