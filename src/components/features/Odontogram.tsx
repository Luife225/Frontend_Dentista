import { useState, useEffect, useCallback } from 'react'
import {
  getCurrentOdontogram,
  getOdontogramHistory,
  saveOdontogramDraft,
  confirmOdontogramVersion,
  createCorrectionVersion,
  type OdontogramaVersionDto,
  type HallazgoDto,
} from '../../services/odontogramService'
import { useAuth } from '../../contexts/AuthContext'

export type FaceCode = 'OCLUSAL' | 'VESTIBULAR' | 'LINGUAL' | 'MESIAL' | 'DISTAL' | 'GENERAL'

export interface ToothConditionInfo {
  label: string
  color: string
  dotColor: string
}

export const CONDITIONS_MAP: Record<string, ToothConditionInfo> = {
  SANO:        { label: 'Sano',            color: '#ffffff', dotColor: '#10b981' },
  CARIES:      { label: 'Caries',          color: '#fca5a5', dotColor: '#ef4444' },
  RESTAURADO:  { label: 'Restauración',    color: '#bfdbfe', dotColor: '#3b82f6' },
  CORONA:      { label: 'Corona',          color: '#fde68a', dotColor: '#f59e0b' },
  EXTRAIDO:    { label: 'Extraído',        color: '#e2e8f0', dotColor: '#94a3b8' },
  ENDODONCIA:  { label: 'Endodoncia',      color: '#ddd6fe', dotColor: '#8b5cf6' },
  IMPLANTE:    { label: 'Implante',        color: '#a7f3d0', dotColor: '#059669' },
  FRACTURA:    { label: 'Fractura',        color: '#fed7aa', dotColor: '#f97316' },
}

const UPPER_ARCH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_ARCH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

interface OdontogramProps {
  patientId: string
  patientName?: string
  readOnly?: boolean
}

export default function Odontogram({ patientId, patientName, readOnly: propReadOnly = false }: OdontogramProps) {
  const { role } = useAuth()
  const isOdontologo = role === 'ODONTOLOGO'

  const [version, setVersion] = useState<OdontogramaVersionDto | null>(null)
  const [history, setHistory] = useState<OdontogramaVersionDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Local draft findings: map "pieceId:face" -> { condition, note }
  const [findingsMap, setFindingsMap] = useState<Map<string, { condition: string; note?: string }>>(new Map())
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [selectedFace, setSelectedFace] = useState<FaceCode | null>(null)
  const [activeCondition, setActiveCondition] = useState<string>('CARIES')
  const [toothNote, setToothNote] = useState<string>('')
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  const isConfirmed = version?.estado === 'CONFIRMADO'
  const isReadOnly = propReadOnly || !isOdontologo || isConfirmed

  const showToast = (msg: string, isErr = false) => {
    if (isErr) {
      setErrorMessage(msg)
      setTimeout(() => setErrorMessage(null), 5000)
    } else {
      setSuccessMessage(msg)
      setTimeout(() => setSuccessMessage(null), 4000)
    }
  }

  // Carga scoped estrictamente a patientId (sin estado global compartido)
  const loadOdontogram = useCallback(async () => {
    if (!patientId) return
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [current, hist] = await Promise.all([
        getCurrentOdontogram(patientId),
        getOdontogramHistory(patientId),
      ])
      setVersion(current)
      setHistory(hist)

      // Poblar mapa de hallazgos
      const map = new Map<string, { condition: string; note?: string }>()
      if (current.hallazgos) {
        for (const h of current.hallazgos) {
          const key = `${h.codigoPiezaDental}:${h.codigoSuperficieCara.toUpperCase()}`
          map.set(key, { condition: h.codigoCondicion.toUpperCase(), note: h.notaObservacion })
        }
      }
      setFindingsMap(map)
      setSelectedTooth(null)
      setSelectedFace(null)
      setToothNote('')
    } catch (err: any) {
      console.error('Error al cargar odontograma:', err)
      setErrorMessage(err.message || 'Error al cargar odontograma del paciente')
    } finally {
      setIsLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    loadOdontogram()
  }, [loadOdontogram])

  // Obtener condición de una cara
  const getConditionForFace = (piece: number, face: FaceCode): string => {
    const generalKey = `${piece}:GENERAL`
    if (findingsMap.has(generalKey)) {
      return findingsMap.get(generalKey)!.condition
    }
    const faceKey = `${piece}:${face}`
    return findingsMap.get(faceKey)?.condition || 'SANO'
  }

  // Manejar clic en cara de diente
  const handleFaceClick = (piece: number, face: FaceCode) => {
    if (isReadOnly) {
      setSelectedTooth(piece)
      setSelectedFace(face)
      const key = `${piece}:${face}`
      setToothNote(findingsMap.get(key)?.note || '')
      return
    }

    setSelectedTooth(piece)
    setSelectedFace(face)

    setFindingsMap(prev => {
      const next = new Map(prev)
      const key = `${piece}:${face}`
      if (activeCondition === 'SANO') {
        next.delete(key)
      } else {
        next.set(key, { condition: activeCondition, note: toothNote || undefined })
      }
      return next
    })
  }

  // Aplicar condición general al diente completo
  const handleApplyGeneral = () => {
    if (!selectedTooth || isReadOnly) return
    setFindingsMap(prev => {
      const next = new Map(prev)
      // Eliminar caras específicas
      for (const f of ['OCLUSAL', 'VESTIBULAR', 'LINGUAL', 'MESIAL', 'DISTAL']) {
        next.delete(`${selectedTooth}:${f}`)
      }
      const generalKey = `${selectedTooth}:GENERAL`
      if (activeCondition === 'SANO') {
        next.delete(generalKey)
      } else {
        next.set(generalKey, { condition: activeCondition, note: toothNote || undefined })
      }
      return next
    })
  }

  // Limpiar diente
  const handleClearTooth = () => {
    if (!selectedTooth || isReadOnly) return
    setFindingsMap(prev => {
      const next = new Map(prev)
      for (const f of ['OCLUSAL', 'VESTIBULAR', 'LINGUAL', 'MESIAL', 'DISTAL', 'GENERAL']) {
        next.delete(`${selectedTooth}:${f}`)
      }
      return next
    })
    setToothNote('')
  }

  // Guardar borrador en el servidor
  const handleSaveDraft = async () => {
    if (!version || isReadOnly) return
    setIsSaving(true)
    try {
      const hallazgosPayload: HallazgoDto[] = []
      findingsMap.forEach((val, key) => {
        const [pieceStr, face] = key.split(':')
        hallazgosPayload.push({
          codigoPiezaDental: parseInt(pieceStr, 10),
          codigoSuperficieCara: face,
          codigoCondicion: val.condition,
          notaObservacion: val.note,
        })
      })

      const updated = await saveOdontogramDraft(patientId, { hallazgos: hallazgosPayload })
      setVersion(updated)
      showToast('✓ Borrador de odontograma guardado correctamente')
    } catch (err: any) {
      showToast(err.message || 'Error al guardar borrador', true)
    } finally {
      setIsSaving(false)
    }
  }

  // Confirmar versión (inmutable)
  const handleConfirmVersion = async () => {
    if (!version?.id || isReadOnly) return
    if (!window.confirm(`¿Confirmar definitivamente la Versión ${version.numeroVersion}? Una vez confirmada, esta versión será INMUTABLE y no podrá modificarse directamente.`)) {
      return
    }

    setIsSaving(true)
    try {
      // Guardar primero cualquier cambio pendiente
      const hallazgosPayload: HallazgoDto[] = []
      findingsMap.forEach((val, key) => {
        const [pieceStr, face] = key.split(':')
        hallazgosPayload.push({
          codigoPiezaDental: parseInt(pieceStr, 10),
          codigoSuperficieCara: face,
          codigoCondicion: val.condition,
          notaObservacion: val.note,
        })
      })
      await saveOdontogramDraft(patientId, { hallazgos: hallazgosPayload })

      const confirmed = await confirmOdontogramVersion(version.id)
      setVersion(confirmed)
      await loadOdontogram()
      showToast(`✓ Versión ${confirmed.numeroVersion} confirmada con éxito. Registro inmutable cerrado.`)
    } catch (err: any) {
      showToast(err.message || 'Error al confirmar versión', true)
    } finally {
      setIsSaving(false)
    }
  }

  // Crear nueva versión correctiva o de evolución
  const handleCreateNewVersion = async () => {
    if (!version?.id) return
    if (!window.confirm(`¿Crear una nueva versión a partir de la Versión ${version.numeroVersion}? Se iniciará un nuevo borrador (v${version.numeroVersion + 1}) copiando el estado actual.`)) {
      return
    }

    setIsSaving(true)
    try {
      const hallazgosPayload: HallazgoDto[] = []
      findingsMap.forEach((val, key) => {
        const [pieceStr, face] = key.split(':')
        hallazgosPayload.push({
          codigoPiezaDental: parseInt(pieceStr, 10),
          codigoSuperficieCara: face,
          codigoCondicion: val.condition,
          notaObservacion: val.note,
        })
      })

      const newVer = await createCorrectionVersion(version.id, { hallazgos: hallazgosPayload })
      setVersion(newVer)
      await loadOdontogram()
      showToast(`✓ Nueva versión ${newVer.numeroVersion} en borrador creada con éxito.`)
    } catch (err: any) {
      showToast(err.message || 'Error al generar nueva versión', true)
    } finally {
      setIsSaving(false)
    }
  }

  // Componente SVG individual para cada pieza dental
  const ToothItem = ({ piece }: { piece: number }) => {
    const isSelected = selectedTooth === piece
    const isExtracted = getConditionForFace(piece, 'GENERAL') === 'EXTRAIDO'
    const generalCond = getConditionForFace(piece, 'GENERAL')

    const facesSVG: Record<FaceCode, string> = {
      OCLUSAL:   'M10,10 L18,10 L18,18 L10,18 Z',
      VESTIBULAR:'M10,10 L18,10 L16,4 L12,4 Z',
      LINGUAL:   'M10,18 L18,18 L16,24 L12,24 Z',
      MESIAL:    'M10,10 L10,18 L4,16 L4,12 Z',
      DISTAL:    'M18,10 L18,18 L24,16 L24,12 Z',
      GENERAL:   '',
    }

    return (
      <div className="flex flex-col items-center gap-0.5 select-none">
        <span className="text-[10px] text-slate-400 font-mono font-medium">{piece}</span>
        <div
          onClick={() => setSelectedTooth(piece)}
          className={`relative p-0.5 rounded transition-transform cursor-pointer ${
            isSelected ? 'scale-115 ring-2 ring-cyan-500 ring-offset-1 z-10' : 'hover:scale-105'
          }`}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" className="drop-shadow-xs">
            {isExtracted ? (
              <g>
                <circle cx="14" cy="14" r="12" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
                <line x1="8" y1="8" x2="20" y2="20" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                <line x1="20" y1="8" x2="8" y2="20" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              </g>
            ) : generalCond !== 'SANO' && generalCond !== 'EXTRAIDO' ? (
              <circle
                cx="14"
                cy="14"
                r="12"
                fill={CONDITIONS_MAP[generalCond]?.color || '#ffffff'}
                stroke={isSelected ? '#06b6d4' : '#64748b'}
                strokeWidth={isSelected ? 2 : 1}
              />
            ) : (
              <g stroke="#94a3b8" strokeWidth="0.8">
                {(['OCLUSAL', 'VESTIBULAR', 'LINGUAL', 'MESIAL', 'DISTAL'] as FaceCode[]).map(face => {
                  const cond = getConditionForFace(piece, face)
                  const color = CONDITIONS_MAP[cond]?.color || '#ffffff'
                  const isFaceSelected = isSelected && selectedFace === face
                  return (
                    <path
                      key={face}
                      d={facesSVG[face]}
                      fill={color}
                      stroke={isFaceSelected ? '#06b6d4' : '#94a3b8'}
                      strokeWidth={isFaceSelected ? 1.8 : 0.8}
                      className="transition-colors hover:opacity-80"
                      onClick={e => {
                        e.stopPropagation()
                        handleFaceClick(piece, face)
                      }}
                    />
                  )
                })}
              </g>
            )}
          </svg>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3">
        <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-medium">Cargando versión de odontograma del paciente...</p>
      </div>
    )
  }

  return (
    <div className="p-5 space-y-5">
      {/* Toast notifications */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="font-bold">✕</button>
        </div>
      )}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-800 text-base" style={{ fontFamily: 'Outfit' }}>
                Odontograma 2D {patientName ? `— ${patientName}` : ''}
              </h2>
              {version && (
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    version.estado === 'CONFIRMADO'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}
                >
                  v{version.numeroVersion} {version.estado}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {version?.estado === 'CONFIRMADO'
                ? `Versión confirmada e inmutable · Firmado por: ${version.firmadoPorNombre || 'Odontólogo'}`
                : 'Modo edición (Borrador activo). Guarda o confirma para cerrar la versión.'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {history.length > 1 && (
            <button
              onClick={() => setShowHistoryModal(true)}
              className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Historial ({history.length} vers.)
            </button>
          )}

          {isOdontologo && !isConfirmed && (
            <>
              <button
                disabled={isSaving}
                onClick={handleSaveDraft}
                className="px-4 py-2 text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Guardando...' : 'Guardar borrador'}
              </button>
              <button
                disabled={isSaving}
                onClick={handleConfirmVersion}
                className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                Confirmar versión
              </button>
            </>
          )}

          {isOdontologo && isConfirmed && (
            <button
              disabled={isSaving}
              onClick={handleCreateNewVersion}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              + Nueva versión evolución
            </button>
          )}
        </div>
      </div>

      {/* Conditions Palette */}
      {!isReadOnly && (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Seleccionar condición para aplicar:
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CONDITIONS_MAP).map(([key, info]) => {
              const isActive = activeCondition === key
              return (
                <button
                  key={key}
                  onClick={() => setActiveCondition(key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    isActive
                      ? 'border-cyan-500 bg-cyan-50/80 text-cyan-900 ring-2 ring-cyan-400/30'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-md border border-slate-300 shrink-0"
                    style={{ backgroundColor: info.color }}
                  />
                  <span>{info.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Main 2D Arch Container */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6 shadow-xs">
        {/* Maxilar Superior */}
        <div>
          <p className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-widest mb-3">
            Maxilar Superior (Piezas 18–28)
          </p>
          <div className="flex justify-center items-center gap-1 sm:gap-2 flex-wrap">
            {UPPER_ARCH.map(piece => (
              <ToothItem key={piece} piece={piece} />
            ))}
          </div>
        </div>

        {/* Línea Divisoria Oclusal */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-dashed border-slate-200" />
          <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            Plano Oclusal
          </span>
          <div className="flex-grow border-t border-dashed border-slate-200" />
        </div>

        {/* Mandíbula Inferior */}
        <div>
          <div className="flex justify-center items-center gap-1 sm:gap-2 flex-wrap">
            {LOWER_ARCH.map(piece => (
              <ToothItem key={piece} piece={piece} />
            ))}
          </div>
          <p className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-widest mt-3">
            Mandíbula Inferior (Piezas 48–38)
          </p>
        </div>
      </div>

      {/* Tooth Details Panel */}
      {selectedTooth && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center font-mono">
              #{selectedTooth}
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">
                Pieza dental #{selectedTooth}
                {selectedFace ? ` · Cara ${selectedFace}` : ' · Diente completo'}
              </p>
              <p className="text-xs text-slate-400">
                Condición actual:{' '}
                <span className="font-semibold text-slate-700">
                  {CONDITIONS_MAP[getConditionForFace(selectedTooth, selectedFace || 'GENERAL')]?.label || 'Sano'}
                </span>
              </p>
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleApplyGeneral}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                title="Aplica la condición seleccionada a todo el diente"
              >
                Aplicar a todo el diente
              </button>
              <button
                onClick={handleClearTooth}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Limpiar diente
              </button>
            </div>
          )}
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base" style={{ fontFamily: 'Outfit' }}>
                Historial de Versiones de Odontograma
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {history.map(h => (
                <div key={h.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">Versión {h.numeroVersion}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          h.estado === 'CONFIRMADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {h.estado}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {h.fechaConfirmacion
                        ? `Confirmado: ${new Date(h.fechaConfirmacion).toLocaleString('es-PE')}`
                        : `Creado: ${h.fechaCreacion ? new Date(h.fechaCreacion).toLocaleString('es-PE') : 'Reciente'}`}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {h.hallazgos?.length || 0} hallazgo(s)
                  </span>
                </div>
              ))}
            </div>
            <div className="text-right pt-2 border-t">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
