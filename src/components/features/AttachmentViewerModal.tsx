import { useState, useEffect, useRef } from 'react'
import {
  AttachmentDto,
  MlFindingItem,
  downloadAttachmentBlob,
  formatFileSize,
  publishAttachment,
  revokeAttachment,
  analyzeAttachmentMl,
  reviewAttachmentMl,
} from '../../services/attachmentService'

interface AttachmentViewerModalProps {
  attachment: AttachmentDto
  onClose: () => void
  onVisibilityChange?: (updated: AttachmentDto) => void
  onAttachmentUpdated?: (updated: AttachmentDto) => void
  isDentistOrAdmin?: boolean
}

export default function AttachmentViewerModal({
  attachment,
  onClose,
  onVisibilityChange,
  onAttachmentUpdated,
  isDentistOrAdmin = false,
}: AttachmentViewerModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isToggling, setIsToggling] = useState<boolean>(false)
  const [currentAttachment, setCurrentAttachment] = useState<AttachmentDto>(attachment)

  // Estados de IA y revisión
  const [isAnalyzingMl, setIsAnalyzingMl] = useState<boolean>(false)
  const [isReviewingMl, setIsReviewingMl] = useState<boolean>(false)
  const [mlError, setMlError] = useState<string | null>(null)
  const [showMlBoxes, setShowMlBoxes] = useState<boolean>(true)
  const [showMlPanel, setShowMlPanel] = useState<boolean>(true)
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null)
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null)
  const [editClassName, setEditClassName] = useState<'caries' | 'caries_profunda'>('caries')
  const [editClinicalNote, setEditClinicalNote] = useState<string>('')
  const [imageNaturalDims, setImageNaturalDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 })

  const imageRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    let activeUrl: string | null = null
    let isCancelled = false

    async function loadBinary() {
      setLoading(true)
      setError(null)
      try {
        const { blob } = await downloadAttachmentBlob(attachment.id)
        if (!isCancelled) {
          activeUrl = URL.createObjectURL(blob)
          setBlobUrl(activeUrl)
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'No se pudo cargar el archivo binario del servidor.')
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadBinary()

    return () => {
      isCancelled = true
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl)
      }
    }
  }, [attachment.id])

  const notifyUpdate = (updated: AttachmentDto) => {
    setCurrentAttachment(updated)
    if (onAttachmentUpdated) {
      onAttachmentUpdated(updated)
    }
    if (onVisibilityChange) {
      onVisibilityChange(updated)
    }
  }

  const handleDownload = () => {
    if (!blobUrl) return
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = currentAttachment.nombreOriginal || `archivo_${currentAttachment.id}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleToggleVisibility = async () => {
    setIsToggling(true)
    try {
      const updated = currentAttachment.esVisiblePaciente
        ? await revokeAttachment(currentAttachment.id)
        : await publishAttachment(currentAttachment.id)
      notifyUpdate(updated)
    } catch (err: any) {
      alert(`Error al cambiar visibilidad: ${err.message}`)
    } finally {
      setIsToggling(false)
    }
  }

  // Ejecución de análisis ML
  const handleRunMl = async (threshold: number = 0.25) => {
    setIsAnalyzingMl(true)
    setMlError(null)
    try {
      const updated = await analyzeAttachmentMl(currentAttachment.id, threshold)
      notifyUpdate(updated)
      setShowMlBoxes(true)
      setShowMlPanel(true)
    } catch (err: any) {
      setMlError(err.message || 'Error al ejecutar análisis de IA.')
    } finally {
      setIsAnalyzingMl(false)
    }
  }

  // Revisión odontológica de un hallazgo
  const handleReviewDecision = async (
    findingId: string,
    decision: 'ACEPTADO' | 'RECHAZADO' | 'CORREGIDO',
    extras?: { correctedClassName?: string; clinicalNote?: string }
  ) => {
    setIsReviewingMl(true)
    setMlError(null)
    try {
      const updated = await reviewAttachmentMl(currentAttachment.id, {
        findingId,
        decision,
        ...extras,
      })
      notifyUpdate(updated)
      setEditingFindingId(null)
    } catch (err: any) {
      setMlError(err.message || 'Error al guardar la revisión.')
    } finally {
      setIsReviewingMl(false)
    }
  }

  // Aceptar todos los hallazgos que siguen pendientes
  const handleBulkAccept = async () => {
    setIsReviewingMl(true)
    setMlError(null)
    try {
      const updated = await reviewAttachmentMl(currentAttachment.id, {
        overallDecision: 'ACEPTADO',
        overallClinicalNote: 'Hallazgos validados de conformidad por odontólogo tratante.',
      })
      notifyUpdate(updated)
    } catch (err: any) {
      setMlError(err.message || 'Error al aceptar hallazgos.')
    } finally {
      setIsReviewingMl(false)
    }
  }

  const isImage = currentAttachment.tipoMime.startsWith('image/')
  const isPdf = currentAttachment.tipoMime === 'application/pdf'
  const isRadiografia = currentAttachment.tipoArchivo === 'RADIOGRAFIA' || isImage

  const hasMlAnalysis = Boolean(currentAttachment.iaHallazgos && currentAttachment.iaNombreModelo)
  const findings: MlFindingItem[] = currentAttachment.iaHallazgos?.findings || []
  const originalOutput = currentAttachment.iaHallazgos?.originalModelOutput || []
  const timing = currentAttachment.iaHallazgos?.timing_ms || {}

  // Contadores
  const pendingCount = findings.filter(
    (f) => (f.reviewStatus || f.review_status) === 'PENDIENTE'
  ).length
  const acceptedCount = findings.filter(
    (f) => (f.reviewStatus || f.review_status) === 'ACEPTADO'
  ).length
  const correctedCount = findings.filter(
    (f) => (f.reviewStatus || f.review_status) === 'CORREGIDO'
  ).length
  const rejectedCount = findings.filter(
    (f) => (f.reviewStatus || f.review_status) === 'RECHAZADO'
  ).length

  // Dimensiones base de la imagen para calcular los porcentajes de las cajas
  const baseWidth = currentAttachment.iaHallazgos?.image?.width || imageNaturalDims.width || 1
  const baseHeight = currentAttachment.iaHallazgos?.image?.height || imageNaturalDims.height || 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                isImage
                  ? 'bg-cyan-100 text-cyan-700'
                  : isPdf
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {isImage ? 'IMG' : isPdf ? 'PDF' : 'DOC'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-sm truncate" style={{ fontFamily: 'Outfit' }}>
                  {currentAttachment.nombreOriginal}
                </h3>
                {hasMlAnalysis && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      currentAttachment.iaEstadoRevision === 'CORREGIDO'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : currentAttachment.iaEstadoRevision === 'ACEPTADO'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : currentAttachment.iaEstadoRevision === 'RECHAZADO'
                        ? 'bg-slate-100 text-slate-600 border-slate-300'
                        : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                    }`}
                  >
                    🤖 IA: {currentAttachment.iaEstadoRevision} ({findings.length})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                <span className="font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 px-1.5 py-0.2 rounded">
                  {currentAttachment.tipoArchivo}
                </span>
                <span>·</span>
                <span>{formatFileSize(currentAttachment.pesoBytes)}</span>
                {currentAttachment.regionAnatomica && (
                  <>
                    <span>·</span>
                    <span className="text-slate-600 font-medium truncate">{currentAttachment.regionAnatomica}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Botón de análisis IA si es odontólogo y es imagen */}
            {isDentistOrAdmin && isImage && (
              <>
                {!hasMlAnalysis ? (
                  <button
                    onClick={() => handleRunMl(0.25)}
                    disabled={isAnalyzingMl || loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isAnalyzingMl ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analizando en GPU...
                      </>
                    ) : (
                      <>
                        <span>🤖</span>
                        Analizar con IA (YOLOv8n)
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                    <button
                      onClick={() => setShowMlBoxes(!showMlBoxes)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                        showMlBoxes
                          ? 'bg-white text-cyan-700 font-bold shadow-xs'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                      title="Activar u ocultar cajas delimitadoras de la IA"
                    >
                      {showMlBoxes ? '👁️ Cajas Visibles' : '🚫 Ocultar Cajas'}
                    </button>
                    <button
                      onClick={() => setShowMlPanel(!showMlPanel)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                        showMlPanel
                          ? 'bg-white text-blue-700 font-bold shadow-xs'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                      title="Abrir o cerrar panel lateral de revisión"
                    >
                      📋 Panel ({findings.length})
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Toggle Visibilidad paciente */}
            {isDentistOrAdmin && (
              <button
                onClick={handleToggleVisibility}
                disabled={isToggling}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  currentAttachment.esVisiblePaciente
                    ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                } disabled:opacity-50`}
              >
                {isToggling ? '...' : currentAttachment.esVisiblePaciente ? 'Revocar' : 'Compartir'}
              </button>
            )}

            {/* Descargar */}
            <button
              onClick={handleDownload}
              disabled={!blobUrl || loading}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Descargar archivo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>

            {/* Cerrar */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Cerrar visor"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Notificación de error de IA si ocurre */}
        {mlError && (
          <div className="bg-rose-50 border-b border-rose-200 px-5 py-2 flex items-center justify-between text-xs text-rose-700">
            <span>⚠️ {mlError}</span>
            <button onClick={() => setMlError(null)} className="font-bold underline cursor-pointer">
              Cerrar
            </button>
          </div>
        )}

        {/* Modal Body: Split entre imagen y panel de revisión IA */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-950 min-h-[500px]">
          {/* Lado izquierdo: Visor de Imagen / PDF con Overlays */}
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center relative select-none">
            {loading && (
              <div className="flex flex-col items-center gap-3 text-slate-300">
                <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-medium">Cargando archivo desde almacenamiento durable...</p>
              </div>
            )}

            {error && (
              <div className="bg-rose-900/40 border border-rose-500/50 rounded-2xl p-6 text-center max-w-md">
                <p className="text-sm font-bold text-rose-200">No se pudo visualizar el archivo</p>
                <p className="text-xs text-rose-300/80 mt-1">{error}</p>
              </div>
            )}

            {!loading && !error && blobUrl && isImage && (
              <div className="relative inline-block max-w-full max-h-[75vh]">
                {/* Imagen base */}
                <img
                  ref={imageRef}
                  src={blobUrl}
                  alt={currentAttachment.nombreOriginal}
                  className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl block"
                  onLoad={(e) => {
                    setImageNaturalDims({
                      width: e.currentTarget.naturalWidth,
                      height: e.currentTarget.naturalHeight,
                    })
                  }}
                />

                {/* Cajas delimitadoras de IA superpuestas */}
                {hasMlAnalysis && showMlBoxes && findings.map((f, idx) => {
                  const fId = f.findingId || f.finding_id || `hallazgo-${idx + 1}`
                  const b = f.bboxPixels || f.bbox_pixels
                  if (!b) return null

                  const leftPct = (b.xMin / baseWidth) * 100
                  const topPct = (b.yMin / baseHeight) * 100
                  const widthPct = ((b.xMax - b.xMin) / baseWidth) * 100
                  const heightPct = ((b.yMax - b.yMin) / baseHeight) * 100

                  const className = f.className || f.class_name || 'caries'
                  const isProfunda = className === 'caries_profunda'
                  const isSelected = selectedFindingId === fId
                  const status = f.reviewStatus || f.review_status || 'PENDIENTE'

                  // Color según clase y estado
                  const isRejected = status === 'RECHAZADO'
                  const borderColor = isRejected
                    ? 'border-slate-500/60 bg-slate-500/10'
                    : isProfunda
                    ? 'border-red-500 bg-red-500/20'
                    : 'border-amber-400 bg-amber-400/20'

                  const labelBg = isRejected
                    ? 'bg-slate-700 text-slate-300'
                    : isProfunda
                    ? 'bg-red-600 text-white'
                    : 'bg-amber-500 text-slate-900 font-bold'

                  return (
                    <div
                      key={fId}
                      onClick={() => {
                        setSelectedFindingId(fId)
                        setShowMlPanel(true)
                      }}
                      style={{
                        left: `${Math.max(0, leftPct)}%`,
                        top: `${Math.max(0, topPct)}%`,
                        width: `${Math.min(100 - leftPct, widthPct)}%`,
                        height: `${Math.min(100 - topPct, heightPct)}%`,
                      }}
                      className={`absolute border-2 transition-all cursor-pointer rounded-xs ${borderColor} ${
                        isSelected ? 'ring-3 ring-cyan-400 ring-offset-1 z-20 scale-[1.01]' : 'z-10 hover:border-cyan-300'
                      } ${isRejected ? 'opacity-40' : 'opacity-90'}`}
                      title={`${fId}: ${className} (${((f.score || 0) * 100).toFixed(1)}%) - Estado: ${status}`}
                    >
                      {/* Tag con clase y confianza */}
                      <span
                        className={`absolute -top-5 left-0 text-[10px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none ${labelBg}`}
                      >
                        {isProfunda ? '■ Caries Prof.' : '■ Caries'} {((f.score || 0) * 100).toFixed(0)}%
                        {status !== 'PENDIENTE' && ` (${status})`}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {!loading && !error && blobUrl && isPdf && (
              <div className="w-full h-[75vh] rounded-xl overflow-hidden bg-white">
                <iframe src={blobUrl} className="w-full h-full border-0" title={currentAttachment.nombreOriginal} />
              </div>
            )}
          </div>

          {/* Lado derecho: Panel lateral de revisión clínica asistida por IA */}
          {hasMlAnalysis && showMlPanel && isDentistOrAdmin && (
            <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col shrink-0 text-slate-200 overflow-hidden">
              {/* Header del Panel */}
              <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-cyan-400 flex items-center gap-1.5" style={{ fontFamily: 'Outfit' }}>
                    <span>🧠</span>
                    Detección Asistida de Caries (YOLOv8n)
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>{currentAttachment.iaNombreModelo}</span>
                    <span>·</span>
                    <span className="text-emerald-400">GPU: {timing.inference_ms || 11} ms</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowMlPanel(false)}
                  className="text-slate-400 hover:text-white p-1 rounded cursor-pointer lg:hidden"
                >
                  ✕
                </button>
              </div>

              {/* Disclaimer clínico */}
              <div className="px-3.5 py-2 bg-amber-500/10 border-b border-amber-500/20 text-[11px] text-amber-200/90 leading-tight">
                ⚠️ <span className="font-semibold">Apoyo clínico:</span> Las sugerencias no alteran automáticamente el
                odontograma ni el historial. Requieren validación del profesional.
              </div>

              {/* Barra de progreso de revisión */}
              <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex gap-2 text-[11px]">
                  <span className="text-amber-400">Pend: {pendingCount}</span>
                  <span className="text-emerald-400">Acep: {acceptedCount}</span>
                  {correctedCount > 0 && <span className="text-purple-400">Corr: {correctedCount}</span>}
                  {rejectedCount > 0 && <span className="text-slate-400">Rech: {rejectedCount}</span>}
                </div>
                {pendingCount > 0 && (
                  <button
                    onClick={handleBulkAccept}
                    disabled={isReviewingMl}
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {isReviewingMl ? '...' : '✓ Aceptar todos'}
                  </button>
                )}
              </div>

              {/* Lista scrollable de hallazgos */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {findings.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    No se detectaron hallazgos por encima del umbral en esta radiografía.
                  </div>
                ) : (
                  findings.map((f, idx) => {
                    const fId = f.findingId || f.finding_id || `hallazgo-${idx + 1}`
                    const className = f.className || f.class_name || 'caries'
                    const isProfunda = className === 'caries_profunda'
                    const status = f.reviewStatus || f.review_status || 'PENDIENTE'
                    const isSelected = selectedFindingId === fId
                    const isEditing = editingFindingId === fId

                    return (
                      <div
                        key={fId}
                        onClick={() => setSelectedFindingId(fId)}
                        className={`rounded-xl border p-2.5 transition-all text-xs ${
                          isSelected
                            ? 'bg-slate-800/90 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/40'
                            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Cabecera del hallazgo */}
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-slate-400">{fId}</span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isProfunda ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}
                            >
                              {isProfunda ? 'Caries Profunda' : 'Caries'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {((f.score || 0) * 100).toFixed(1)}%
                            </span>
                          </div>

                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              status === 'ACEPTADO'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : status === 'CORREGIDO'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : status === 'RECHAZADO'
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                            }`}
                          >
                            {status}
                          </span>
                        </div>

                        {/* Coordenadas o Nota clínica */}
                        <div className="text-[10px] text-slate-400 mb-2">
                          {f.clinicalNote || f.clinical_note ? (
                            <p className="italic text-slate-300 bg-slate-900/60 p-1 rounded border border-slate-800">
                              Nota: {f.clinicalNote || f.clinical_note}
                            </p>
                          ) : (
                            <span>
                              Caja px: [{Math.round(f.bboxPixels?.xMin || 0)}, {Math.round(f.bboxPixels?.yMin || 0)},{' '}
                              {Math.round(f.bboxPixels?.xMax || 0)}, {Math.round(f.bboxPixels?.yMax || 0)}]
                            </span>
                          )}
                        </div>

                        {/* Formulario de corrección expandible */}
                        {isEditing ? (
                          <div className="bg-slate-900 p-2 rounded-lg border border-slate-700 space-y-2 mt-2">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Clasificación clínica:</label>
                              <select
                                value={editClassName}
                                onChange={(e) => setEditClassName(e.target.value as any)}
                                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-1 text-xs"
                              >
                                <option value="caries">Caries</option>
                                <option value="caries_profunda">Caries Profunda</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Nota del odontólogo:</label>
                              <input
                                type="text"
                                value={editClinicalNote}
                                onChange={(e) => setEditClinicalNote(e.target.value)}
                                placeholder="Ej: Compromiso pulpar confirmado..."
                                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-1 text-xs"
                              />
                            </div>
                            <div className="flex justify-end gap-1.5 pt-1">
                              <button
                                onClick={() => setEditingFindingId(null)}
                                className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-white"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() =>
                                  handleReviewDecision(fId, 'CORREGIDO', {
                                    correctedClassName: editClassName,
                                    clinicalNote: editClinicalNote,
                                  })
                                }
                                disabled={isReviewingMl}
                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-bold"
                              >
                                Guardar Corrección
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Botones de acción del odontólogo */
                          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
                            <button
                              onClick={() => handleReviewDecision(fId, 'ACEPTADO')}
                              disabled={isReviewingMl}
                              className={`flex-1 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                status === 'ACEPTADO'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900'
                              } disabled:opacity-50`}
                            >
                              ✓ Aceptar
                            </button>
                            <button
                              onClick={() => handleReviewDecision(fId, 'RECHAZADO')}
                              disabled={isReviewingMl}
                              className={`flex-1 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                status === 'RECHAZADO'
                                  ? 'bg-slate-700 text-white'
                                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                              } disabled:opacity-50`}
                            >
                              ✕ Rechazar
                            </button>
                            <button
                              onClick={() => {
                                setEditingFindingId(fId)
                                setEditClassName(isProfunda ? 'caries_profunda' : 'caries')
                                setEditClinicalNote(f.clinicalNote || f.clinical_note || '')
                              }}
                              disabled={isReviewingMl}
                              className={`px-2 py-1 rounded text-[10px] font-medium cursor-pointer transition-all ${
                                status === 'CORREGIDO'
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-slate-900 text-purple-300 border border-purple-900/60 hover:bg-purple-950'
                              } disabled:opacity-50`}
                            >
                              ✎ Corregir
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer del Panel: Auditoría */}
              {currentAttachment.iaRevisadoPorNombre && (
                <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Revisado por:</span>
                  <span className="font-semibold text-slate-200 truncate">{currentAttachment.iaRevisadoPorNombre}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            <span>Subido el: </span>
            <span className="font-medium text-slate-700">
              {new Date(currentAttachment.fechaCreacion).toLocaleString('es-PE')}
            </span>
            {currentAttachment.subidoPorNombre && (
              <>
                <span className="mx-1.5">por</span>
                <span className="font-semibold text-slate-700">{currentAttachment.subidoPorNombre}</span>
              </>
            )}
          </div>
          <div className="font-mono text-[11px] text-slate-400 flex items-center gap-2">
            {hasMlAnalysis && (
              <span className="text-cyan-700 font-sans font-semibold">
                Original IA preservado intacto ({originalOutput.length} hallazgos)
              </span>
            )}
            <span>·</span>
            <span>ID #{currentAttachment.id}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
