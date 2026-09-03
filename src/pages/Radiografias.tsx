import { useState } from 'react'

const xrays = [
  { id:1, patient:'Carlos Rivas', type:'Periapical', tooth:'#14', date:'2026-08-01', dr:'Dr. Herrera', notes:'Lesión apical pequeña. Control en 6 meses.', status:'reviewed' },
  { id:2, patient:'Carlos Rivas', type:'Periapical', tooth:'#36', date:'2026-08-01', dr:'Dr. Herrera', notes:'Conductos obturados. Aparente éxito endodóntico.', status:'reviewed' },
  { id:3, patient:'María González', type:'Panorámica', tooth:'General', date:'2026-07-14', dr:'Dr. Herrera', notes:'Sin hallazgos significativos. Nivel óseo conservado.', status:'reviewed' },
  { id:4, patient:'Sofía Mendez', type:'Bitewing', tooth:'#24-#26', date:'2026-08-10', dr:'Dr. Herrera', notes:'Pendiente de diagnóstico.', status:'pending' },
]

export default function Radiografias() {
  const [selected, setSelected] = useState(xrays[0])
  const [dragging, setDragging] = useState(false)

  return (
    <div className="flex h-full fade-in">
      {/* List */}
      <div className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 text-sm" style={{fontFamily:'Outfit'}}>Radiografías</h2>
          <button className="text-xs px-2.5 py-1 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
            + Cargar
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {xrays.map(x => (
            <div key={x.id}
              onClick={() => setSelected(x)}
              className={`px-3 py-3 rounded-lg cursor-pointer transition-colors ${selected.id === x.id ? 'bg-cyan-50 border border-cyan-200' : 'hover:bg-slate-50'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">{x.type}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${x.status === 'reviewed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {x.status === 'reviewed' ? 'Revisada' : 'Pendiente'}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-800 mt-1">{x.patient}</p>
              <p className="text-xs text-slate-400">{x.tooth} · {x.date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 bg-slate-900 flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div>
            <p className="text-white font-semibold text-sm" style={{fontFamily:'Outfit'}}>{selected.patient} — {selected.type} {selected.tooth}</p>
            <p className="text-white/40 text-xs">{selected.date} · {selected.dr}</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">Contraste</button>
            <button className="px-3 py-1.5 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">Invertir</button>
            <button className="px-3 py-1.5 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">🔍 Zoom</button>
            <button className="px-3 py-1.5 text-sm bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition-colors">Imprimir</button>
          </div>
        </div>

        {/* Image area */}
        <div className="flex-1 flex items-center justify-center p-8 relative">
          {selected.status === 'pending' && !dragging ? (
            <div
              className={`w-full max-w-xl border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center py-20 cursor-pointer transition-colors hover:border-cyan-400/60 hover:bg-white/5`}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={() => setDragging(false)}
            >
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <p className="text-white/60 font-medium text-sm" style={{fontFamily:'Outfit'}}>Arrastra la imagen aquí</p>
              <p className="text-white/30 text-xs mt-1">O haz click para buscar archivo · DICOM, JPG, PNG</p>
              <p className="text-white/20 text-xs mt-4">Módulo IA de análisis disponible en Fase 2</p>
            </div>
          ) : (
            /* Simulated X-ray view */
            <div className="relative w-full max-w-2xl">
              <div className="bg-slate-800 rounded-xl overflow-hidden border border-white/10">
                {/* Fake x-ray */}
                <div className="relative h-64 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                  <div className="absolute inset-0 opacity-30"
                    style={{backgroundImage:'radial-gradient(ellipse 120px 80px at 40% 50%, rgba(255,255,255,0.15) 0%, transparent 70%), radial-gradient(ellipse 60px 40px at 65% 45%, rgba(255,255,255,0.1) 0%, transparent 70%)'}}>
                  </div>
                  <p className="text-white/20 text-sm" style={{fontFamily:'Outfit'}}>Radiografía · {selected.type} {selected.tooth}</p>
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <span className="text-xs text-white/30 font-mono">R</span>
                    <div className="w-px h-4 bg-white/20"></div>
                    <span className="text-xs text-white/30 font-mono">L</span>
                  </div>
                  {/* IA placeholder overlay */}
                  <div className="absolute top-3 right-3">
                    <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full border border-amber-400/20">
                      IA análisis · Fase 2
                    </span>
                  </div>
                </div>
                {/* Toolbar */}
                <div className="flex items-center gap-3 px-4 py-3 border-t border-white/10">
                  <input type="range" min={0} max={100} defaultValue={50} className="flex-1 accent-cyan-500" />
                  <span className="text-xs text-white/40 font-mono">Brillo</span>
                  <input type="range" min={0} max={100} defaultValue={50} className="w-24 accent-cyan-500" />
                  <span className="text-xs text-white/40 font-mono">Contraste</span>
                </div>
              </div>
              {/* Notes */}
              <div className="mt-4 bg-white/5 rounded-xl p-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2" style={{fontFamily:'Outfit'}}>Observaciones</p>
                <p className="text-sm text-white/70 leading-relaxed">{selected.notes}</p>
                <button className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">+ Agregar nota</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
