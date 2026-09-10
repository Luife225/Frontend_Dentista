import { useState } from 'react'

type Condition = 'healthy' | 'caries' | 'crown' | 'extraction' | 'restoration' | 'root_canal' | 'implant' | 'fracture'

interface ToothData {
  id: number
  conditions: Partial<Record<'mesial'|'distal'|'occlusal'|'buccal'|'lingual', Condition>>
  general?: Condition
  note?: string
}

const CONDITIONS: Record<Condition, { label: string, color: string, dotColor: string }> = {
  healthy:     { label: 'Sano',           color: '#fff',    dotColor: '#10b981' },
  caries:      { label: 'Caries',         color: '#fca5a5', dotColor: '#ef4444' },
  crown:       { label: 'Corona',         color: '#fde68a', dotColor: '#f59e0b' },
  extraction:  { label: 'Extracción',     color: '#e2e8f0', dotColor: '#94a3b8' },
  restoration: { label: 'Restauración',   color: '#bfdbfe', dotColor: '#3b82f6' },
  root_canal:  { label: 'Endodoncia',     color: '#ddd6fe', dotColor: '#8b5cf6' },
  implant:     { label: 'Implante',       color: '#a7f3d0', dotColor: '#10b981' },
  fracture:    { label: 'Fractura',       color: '#fed7aa', dotColor: '#f97316' },
}

const UPPER = [18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28]
const LOWER = [48,47,46,45,44,43,42,41, 31,32,33,34,35,36,37,38]

const INITIAL_DATA: Record<number, ToothData> = {
  14: { id:14, conditions: { occlusal: 'caries', mesial: 'caries' }, note: 'Caries interproximal detectada 2026-07-14' },
  16: { id:16, general: 'crown', conditions: {}, note: 'Corona colocada 2025-03-10' },
  36: { id:36, general: 'root_canal', conditions: { occlusal: 'restoration' }, note: 'Endodoncia 2024-11-02' },
  38: { id:38, general: 'extraction', conditions: {}, note: 'Extracción programada' },
  46: { id:46, conditions: { occlusal: 'restoration', distal: 'restoration' }, note: 'Resina composit 2026-05-22' },
}

const FACES = ['mesial','distal','occlusal','buccal','lingual'] as const
type Face = typeof FACES[number]

function ToothSVG({ toothId, data, selected, aiHighlight, onClick, onFaceClick }: {
  toothId: number, data?: ToothData, selected: boolean, aiHighlight: boolean
  onClick: () => void, onFaceClick: (face: Face) => void
}) {
  const [hover, setHover] = useState<Face | null>(null)
  const isExtracted = data?.general === 'extraction'

  function getFaceColor(face: Face): string {
    const c = data?.conditions?.[face]
    if (c) return CONDITIONS[c].color
    if (data?.general && data.general !== 'healthy') return CONDITIONS[data.general].color
    return '#fff'
  }

  const stroke = selected ? '#06b6d4' : aiHighlight ? '#f59e0b' : '#94a3b8'
  const strokeW = selected || aiHighlight ? 1.5 : 0.8

  const cx = 14, cy = 14, r = 12

  // Pentagon-like faces: top=buccal, bottom=lingual, left=mesial, right=distal, center=occlusal
  const faces: Record<Face, { d: string }> = {
    occlusal: { d: 'M10,10 L18,10 L18,18 L10,18 Z' },
    buccal:   { d: 'M10,10 L18,10 L16,4 L12,4 Z' },
    lingual:  { d: 'M10,18 L18,18 L16,24 L12,24 Z' },
    mesial:   { d: 'M10,10 L10,18 L4,16 L4,12 Z' },
    distal:   { d: 'M18,10 L18,18 L24,16 L24,12 Z' },
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] text-slate-400 font-mono">{toothId}</span>
      <div
        onClick={onClick}
        onMouseEnter={() => {}}
        className={`relative transition-transform cursor-pointer ${selected ? 'scale-110' : aiHighlight ? 'scale-105' : 'hover:scale-105'}`}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" className="cursor-pointer">
          {isExtracted ? (
            <g>
              <circle cx={cx} cy={cy} r={r} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth={0.8}/>
              <line x1="8" y1="8" x2="20" y2="20" stroke="#94a3b8" strokeWidth={1.5}/>
              <line x1="20" y1="8" x2="8" y2="20" stroke="#94a3b8" strokeWidth={1.5}/>
            </g>
          ) : data?.general && data.general !== 'healthy' && data.general !== 'root_canal' && data.general !== 'restoration' ? (
            <circle cx={cx} cy={cy} r={r} fill={CONDITIONS[data.general].color} stroke={stroke} strokeWidth={strokeW}/>
          ) : (
            <g>
              {(Object.entries(faces) as [Face, {d:string}][]).map(([face, { d }]) => (
                <path
                  key={face}
                  d={d}
                  fill={getFaceColor(face)}
                  stroke={hover === face ? '#06b6d4' : stroke}
                  strokeWidth={hover === face ? 1.5 : strokeW}
                  className="tooth-path"
                  onClick={e => { e.stopPropagation(); onFaceClick(face) }}
                  onMouseEnter={() => setHover(face)}
                  onMouseLeave={() => setHover(null)}
                />
              ))}
              {aiHighlight && (
                <circle cx={cx} cy={cy} r={r+2} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3 2"/>
              )}
              {selected && (
                <circle cx={cx} cy={cy} r={r+2} fill="none" stroke="#06b6d4" strokeWidth={1.5}/>
              )}
            </g>
          )}
        </svg>
        {data && !isExtracted && (
          <div className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full ${
            data.general ? `bg-[${CONDITIONS[data.general]?.dotColor}]` : 'bg-amber-400'
          }`} style={{ backgroundColor: data.general ? CONDITIONS[data.general].dotColor : '#f59e0b' }} />
        )}
      </div>
    </div>
  )
}

export default function Odontogram() {
  const [teeth, setTeeth] = useState<Record<number, ToothData>>(INITIAL_DATA)
  const [selected, setSelected] = useState<number | null>(null)
  const [selectedFace, setSelectedFace] = useState<Face | null>(null)
  const [activeCondition, setActiveCondition] = useState<Condition>('caries')
  const [aiHighlighted] = useState<number[]>([36, 38])
  const [showNote, setShowNote] = useState(false)
  const [note, setNote] = useState('')

  function handleToothClick(id: number) {
    setSelected(selected === id ? null : id)
    setSelectedFace(null)
    const existing = teeth[id]
    setNote(existing?.note || '')
  }

  function handleFaceClick(toothId: number, face: Face) {
    setSelected(toothId)
    setSelectedFace(face)
    setTeeth(prev => ({
      ...prev,
      [toothId]: {
        id: toothId,
        conditions: { ...(prev[toothId]?.conditions || {}), [face]: activeCondition },
        general: prev[toothId]?.general,
        note: prev[toothId]?.note,
      }
    }))
  }

  function applyGeneral() {
    if (!selected) return
    setTeeth(prev => ({
      ...prev,
      [selected]: { id: selected, conditions: {}, general: activeCondition, note: prev[selected]?.note }
    }))
  }

  function clearTooth() {
    if (!selected) return
    const newTeeth = { ...teeth }
    delete newTeeth[selected]
    setTeeth(newTeeth)
  }

  const sel = selected ? teeth[selected] : null

  return (
    <div className="p-6 fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Odontograma</h1>
          <p className="text-sm text-slate-400 mt-0.5">Carlos Rivas · Actualizado 2026-08-01</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Imprimir</button>
          <button className="px-3 py-1.5 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">Guardar cambios</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Odontogram main */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          {/* AI voice highlight notice */}
          {aiHighlighted.length > 0 && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <span className="text-amber-500">🎤</span>
              <span>IA mencionó dientes <strong>{aiHighlighted.join(', ')}</strong> — resaltados en amarillo</span>
            </div>
          )}

          {/* Condition picker */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {(Object.entries(CONDITIONS) as [Condition, typeof CONDITIONS[Condition]][]).map(([c, meta]) => (
              <button key={c}
                onClick={() => setActiveCondition(c)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  activeCondition === c ? 'ring-2 ring-cyan-400 border-cyan-300 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                }`}
                style={{ backgroundColor: meta.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.dotColor }}></span>
                {meta.label}
              </button>
            ))}
          </div>

          {/* Upper teeth */}
          <div className="mb-1">
            <p className="text-xs text-slate-400 mb-2 text-center font-medium" style={{fontFamily:'Outfit'}}>SUPERIOR</p>
            <div className="flex justify-center gap-1">
              {UPPER.map(id => (
                <ToothSVG key={id} toothId={id} data={teeth[id]}
                  selected={selected === id} aiHighlight={aiHighlighted.includes(id)}
                  onClick={() => handleToothClick(id)}
                  onFaceClick={face => handleFaceClick(id, face)}
                />
              ))}
            </div>
          </div>

          {/* Midline */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs text-slate-400 font-medium" style={{fontFamily:'Outfit'}}>LÍNEA MEDIA</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Lower teeth */}
          <div className="mt-1">
            <div className="flex justify-center gap-1">
              {LOWER.map(id => (
                <ToothSVG key={id} toothId={id} data={teeth[id]}
                  selected={selected === id} aiHighlight={aiHighlighted.includes(id)}
                  onClick={() => handleToothClick(id)}
                  onFaceClick={face => handleFaceClick(id, face)}
                />
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center font-medium" style={{fontFamily:'Outfit'}}>INFERIOR</p>
          </div>

          {/* Face guide */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <div className="flex gap-4">
              <span>Caras dentales: click en cada sección del diente</span>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center gap-1"><span className="w-3 h-3 border border-cyan-400 rounded-sm inline-block"></span> Seleccionado</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 border border-amber-400 border-dashed rounded-full inline-block"></span> Mención IA</span>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div className="space-y-4">
          {selected ? (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Diente #{selected}</h3>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
              </div>

              {sel?.general && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg" style={{ backgroundColor: CONDITIONS[sel.general].color }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CONDITIONS[sel.general].dotColor }}></span>
                  <span className="text-sm font-medium text-slate-700">{CONDITIONS[sel.general].label}</span>
                </div>
              )}

              {/* Face conditions */}
              <div className="space-y-1.5 mb-4">
                {FACES.map(face => {
                  const c = sel?.conditions?.[face]
                  return (
                    <div key={face} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                      selectedFace === face ? 'bg-cyan-50 border border-cyan-200' : 'hover:bg-slate-50'
                    }`} onClick={() => handleFaceClick(selected!, face)}>
                      <span className="text-slate-600 capitalize">{face === 'occlusal' ? 'Oclusal' : face === 'buccal' ? 'Vestibular' : face === 'lingual' ? 'Lingual/Palatino' : face === 'mesial' ? 'Mesial' : 'Distal'}</span>
                      {c ? (
                        <span className="flex items-center gap-1 text-xs font-medium">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CONDITIONS[c].dotColor }}></span>
                          {CONDITIONS[c].label}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-2 mb-4">
                <button onClick={applyGeneral} className="flex-1 py-2 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium">
                  Aplicar {CONDITIONS[activeCondition].label}
                </button>
                <button onClick={clearTooth} className="py-2 px-3 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                  Limpiar
                </button>
              </div>

              <button onClick={() => setShowNote(!showNote)} className="w-full text-left text-xs text-slate-400 hover:text-slate-600 transition-colors">
                {showNote ? '▾' : '▸'} {sel?.note ? 'Editar nota' : 'Agregar nota clínica'}
              </button>
              {showNote && (
                <div className="mt-2">
                  <textarea
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 resize-none"
                    rows={3}
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Observación clínica..."
                  />
                  <button className="mt-1.5 w-full py-1.5 text-xs bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
                    Guardar nota
                  </button>
                </div>
              )}

              {sel?.note && !showNote && (
                <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{sel.note}</p>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 text-center">
              <p className="text-3xl mb-2">🦷</p>
              <p className="text-sm text-slate-500 font-medium">Selecciona un diente</p>
              <p className="text-xs text-slate-400 mt-1">Haz click en cualquier diente del odontograma para ver su estado o registrar hallazgos</p>
            </div>
          )}

          {/* Legend */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3" style={{fontFamily:'Outfit'}}>Referencias</p>
            <div className="space-y-1.5">
              {(Object.entries(CONDITIONS) as [Condition, typeof CONDITIONS[Condition]][]).map(([c, meta]) => (
                <div key={c} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-sm border border-slate-200" style={{ backgroundColor: meta.color }}></span>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.dotColor }}></span>
                  <span className="text-slate-600">{meta.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3" style={{fontFamily:'Outfit'}}>Resumen</p>
            {Object.entries(teeth).length === 0 ? (
              <p className="text-xs text-slate-400">Sin hallazgos registrados</p>
            ) : (
              <div className="space-y-1.5">
                {Object.entries(teeth).map(([id, data]) => (
                  <div key={id} className={`flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5 transition-colors ${selected === Number(id) ? 'bg-cyan-50' : ''}`}
                    onClick={() => handleToothClick(Number(id))}>
                    <span className="font-mono text-slate-500">#{id}</span>
                    <span className="text-slate-700">
                      {data.general ? CONDITIONS[data.general].label :
                       Object.values(data.conditions).map(c => c ? CONDITIONS[c].label : '').filter(Boolean).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
