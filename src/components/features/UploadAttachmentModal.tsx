import { useAuth } from "../../contexts/AuthContext"

import React, { useState, useRef } from "react"

import {
  AttachmentDto,
  uploadAttachment,
  formatFileSize,
} from "../../services/attachmentService"

interface UploadAttachmentModalProps {
  patientId: string

  patientName: string

  defaultTipo?: string

  onClose: () => void

  onSuccess: (created: AttachmentDto) => void
}

const TIPOS_ARCHIVO = [
  {
    value: "RADIOGRAFIA",
    label: "Radiografía (Panorámica / Periapical / Bitewing)",
  },

  { value: "FOTOGRAFIA", label: "Fotografía Clínica (Intraoral / Extraoral)" },

  { value: "CONSENTIMIENTO", label: "Consentimiento Informado Firmado" },

  { value: "LABORATORIO", label: "Informe de Laboratorio / Modelo Dental" },

  { value: "DOCUMENTO", label: "Documento Administrativo / Ficha" },

  { value: "INFORME", label: "Informe Clínico / Epicrisis" },

  { value: "RECETA", label: "Receta Médica / Prescripción" },

  { value: "OTRO", label: "Otro Archivo" },
]

export default function UploadAttachmentModal({
  patientId,

  patientName,

  defaultTipo = "RADIOGRAFIA",

  onClose,

  onSuccess,
}: UploadAttachmentModalProps) {
  const { role } = useAuth()

  const administrative = role === "ADMIN_CLINICA" || role === "RECEPCIONISTA"

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [tipoArchivo, setTipoArchivo] = useState<string>(
    administrative ? "DOCUMENTO" : defaultTipo,
  )

  const [regionAnatomica, setRegionAnatomica] = useState<string>("")

  const [esVisiblePaciente, setEsVisiblePaciente] = useState<boolean>(false)

  const [isUploading, setIsUploading] = useState<boolean>(false)

  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)

    const file = e.target.files?.[0]

    if (!file) return

    if (file.size <= 0) {
      setError(
        "El archivo seleccionado está vacío (0 bytes). Seleccione un archivo válido.",
      )

      return
    }

    if (file.size > 25 * 1024 * 1024) {
      setError("El archivo supera el tamaño máximo permitido de 25 MB.")

      return
    }

    setSelectedFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      setError("Por favor seleccione un archivo para cargar.")

      return
    }

    setIsUploading(true)

    setError(null)

    try {
      const created = await uploadAttachment({
        file: selectedFile,

        pacienteId: patientId,

        tipoArchivo,

        regionAnatomica: regionAnatomica.trim() || undefined,

        esVisiblePaciente,
      })

      onSuccess(created)

      onClose()
    } catch (err: any) {
      setError(
        err.message || "Error al subir el archivo al almacenamiento durable.",
      )
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div>
            <h2
              className="font-bold text-slate-800 text-base"
              style={{ fontFamily: "Outfit" }}
            >
              Subir Archivo o Radiografía
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Expediente:{" "}
              <span className="font-semibold text-slate-700">
                {patientName}
              </span>{" "}
              (#{patientId})
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
              <svg
                className="w-4 h-4 shrink-0 text-rose-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* File input / Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Archivo Binario (Imagen o PDF) *
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isUploading}
              accept="image/*,.pdf"
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                selectedFile
                  ? "border-cyan-400 bg-cyan-50/50"
                  : "border-slate-200 hover:border-cyan-400 hover:bg-slate-50"
              }`}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                    {selectedFile.type.startsWith("image/") ? "IMG" : "PDF"}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {formatFileSize(selectedFile.size)} ·{" "}
                      {selectedFile.type || "Tipo detectado"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-slate-500">
                  <svg
                    className="w-8 h-8 mx-auto text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-xs font-semibold text-slate-700">
                    Haga clic para seleccionar o arrastre un archivo
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Imágenes (PNG, JPG, WebP) o documentos PDF (máx. 25 MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tipo de Archivo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tipo de Documento / Imagen *
            </label>
            <select
              value={tipoArchivo}
              onChange={(e) => setTipoArchivo(e.target.value)}
              disabled={isUploading}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all cursor-pointer"
            >
              {TIPOS_ARCHIVO.filter(
                (t) => !administrative || t.value === "DOCUMENTO",
              ).map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Región Anatómica (para radiografías y fotos) */}
          {(tipoArchivo === "RADIOGRAFIA" || tipoArchivo === "FOTOGRAFIA") && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Región Anatómica / Referencia (Opcional)
              </label>
              <input
                type="text"
                value={regionAnatomica}
                onChange={(e) => setRegionAnatomica(e.target.value)}
                disabled={isUploading}
                placeholder="Ej. Panorámica total, Molar 38 inferior, Bitewing premolares..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
              />
            </div>
          )}

          {/* Visibilidad para el paciente */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 flex items-center justify-between">
            <div className="pr-3">
              <p className="text-xs font-semibold text-slate-800">
                Publicar en Portal del Paciente
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Si está marcado, el paciente podrá ver y descargar este archivo
                desde su sesión.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={esVisiblePaciente}
                onChange={(e) => setEsVisiblePaciente(e.target.checked)}
                disabled={isUploading}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando de forma durable...</span>
                </>
              ) : (
                <span>Subir Archivo</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
