import { useState, useEffect } from 'react'
import {
  AttachmentDto,
  downloadAttachmentBlob,
  formatFileSize,
  publishAttachment,
  revokeAttachment
} from '../../services/attachmentService'

interface AttachmentViewerModalProps {
  attachment: AttachmentDto
  onClose: () => void
  onVisibilityChange?: (updated: AttachmentDto) => void
  isDentistOrAdmin?: boolean
}

export default function AttachmentViewerModal({
  attachment,
  onClose,
  onVisibilityChange,
  isDentistOrAdmin = false,
}: AttachmentViewerModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isToggling, setIsToggling] = useState<boolean>(false)
  const [currentAttachment, setCurrentAttachment] = useState<AttachmentDto>(attachment)

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
      setCurrentAttachment(updated)
      if (onVisibilityChange) {
        onVisibilityChange(updated)
      }
    } catch (err: any) {
      alert(`Error al cambiar visibilidad: ${err.message}`)
    } finally {
      setIsToggling(false)
    }
  }

  const isImage = currentAttachment.tipoMime.startsWith('image/')
  const isPdf = currentAttachment.tipoMime === 'application/pdf'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
              isImage ? 'bg-cyan-100 text-cyan-700' : isPdf ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {isImage ? 'IMG' : isPdf ? 'PDF' : 'DOC'}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 text-sm truncate" style={{ fontFamily: 'Outfit' }}>
                {currentAttachment.nombreOriginal}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                <span className="font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-md">
                  {currentAttachment.tipoArchivo}
                </span>
                <span>·</span>
                <span>{formatFileSize(currentAttachment.pesoBytes)}</span>
                {currentAttachment.regionAnatomica && (
                  <>
                    <span>·</span>
                    <span className="text-slate-600 font-medium truncate">
                      {currentAttachment.regionAnatomica}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Status badge */}
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                currentAttachment.esVisiblePaciente
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${currentAttachment.esVisiblePaciente ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {currentAttachment.esVisiblePaciente ? 'Visible para Paciente' : 'Privado (Clínica)'}
            </span>

            {/* Toggle Visibility for Clinical Staff */}
            {isDentistOrAdmin && (
              <button
                onClick={handleToggleVisibility}
                disabled={isToggling}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  currentAttachment.esVisiblePaciente
                    ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                } disabled:opacity-50`}
              >
                {isToggling ? 'Actualizando...' : currentAttachment.esVisiblePaciente ? 'Revocar Acceso' : 'Compartir con Paciente'}
              </button>
            )}

            {/* Download button */}
            <button
              onClick={handleDownload}
              disabled={!blobUrl || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar
            </button>

            {/* Close button */}
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

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-900/95 min-h-[420px]">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-slate-300">
              <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Cargando binario desde almacenamiento durable...</p>
            </div>
          )}

          {error && (
            <div className="bg-rose-900/40 border border-rose-500/50 rounded-2xl p-6 text-center max-w-md">
              <svg className="w-10 h-10 text-rose-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-bold text-rose-200">No se pudo visualizar el archivo</p>
              <p className="text-xs text-rose-300/80 mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <>
              {isImage && (
                <div className="relative max-w-full max-h-full flex items-center justify-center">
                  <img
                    src={blobUrl}
                    alt={currentAttachment.nombreOriginal}
                    className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-xl"
                  />
                </div>
              )}

              {isPdf && (
                <div className="w-full h-[70vh] rounded-xl overflow-hidden bg-white">
                  <iframe
                    src={blobUrl}
                    className="w-full h-full border-0"
                    title={currentAttachment.nombreOriginal}
                  />
                </div>
              )}

              {!isImage && !isPdf && (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center text-slate-300 max-w-sm">
                  <svg className="w-12 h-12 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm font-semibold text-slate-200">{currentAttachment.nombreOriginal}</p>
                  <p className="text-xs text-slate-400 mt-1">{currentAttachment.tipoMime} · {formatFileSize(currentAttachment.pesoBytes)}</p>
                  <button
                    onClick={handleDownload}
                    className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all"
                  >
                    Descargar archivo completo
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
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
          <div className="font-mono text-[11px] text-slate-400">
            ID #{currentAttachment.id}
          </div>
        </div>
      </div>
    </div>
  )
}
