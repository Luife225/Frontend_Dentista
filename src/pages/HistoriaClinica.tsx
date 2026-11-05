import { useState, useEffect, useMemo, useRef } from "react"

import {
  getEncountersByPatient,
  getEncounterById,
  createDraftEncounter,
  updateDraftEncounter,
  confirmEncounterVersion,
  createCorrectionVersion,
  isDecimalId,
} from "../services/clinicalEncounterService"

import {
  fetchPatientsFromApi,
  type BackendPatientDto,
} from "../services/patientService"

import { useAuth } from "../contexts/AuthContext"

import type {
  ClinicalEncounterDto,
  ClinicalVersionDto,
  SignosVitales,
  CreateClinicalEncounterPayload,
  UpdateClinicalDraftPayload,
  CreateCorrectionVersionPayload,
} from "../types/clinicalEncounter"

function Icon({ d, className = "w-4 h-4" }: { d: string ;className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d={d} />
    </svg>
  )
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—"

  try {
    const d = new Date(iso)

    if (isNaN(d.getTime())) return iso

    return d.toLocaleDateString("es-PE", {
      day: "numeric",

      month: "short",

      year: "numeric",
    })
  } catch {
    return iso
  }
}

function fmtDateTime(iso?: string | null) {
  if (!iso) return "—"

  try {
    const d = new Date(iso)

    if (isNaN(d.getTime())) return iso

    return d.toLocaleString("es-PE", {
      day: "numeric",

      month: "short",

      year: "numeric",

      hour: "2-digit",

      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

interface FormState {
  motivoConsulta: string

  examenClinico: string

  diagnostico: string

  procedimientos: string

  planTratamiento: string

  recetasPrescripciones: string

  indicaciones: string

  evolucion: string

  proximaCitaSugerida: string

  vitals: {
    systolic: string

    diastolic: string

    pulse: string

    temp: string

    weight: string

    height: string

    spo2: string
  }
}

const INITIAL_FORM: FormState = {
  motivoConsulta: "",

  examenClinico: "",

  diagnostico: "",

  procedimientos: "",

  planTratamiento: "",

  recetasPrescripciones: "",

  indicaciones: "",

  evolucion: "",

  proximaCitaSugerida: "",

  vitals: {
    systolic: "",

    diastolic: "",

    pulse: "",

    temp: "",

    weight: "",

    height: "",

    spo2: "",
  },
}

function parseVitals(jsonStr?: string): SignosVitales {
  if (!jsonStr) return {}

  try {
    return JSON.parse(jsonStr)
  } catch {
    return {}
  }
}

function serializeVitals(vitals: FormState["vitals"]): string {
  const obj: SignosVitales = {
    systolic: vitals.systolic ? parseFloat(vitals.systolic) : undefined,

    diastolic: vitals.diastolic ? parseFloat(vitals.diastolic) : undefined,

    pulse: vitals.pulse ? parseFloat(vitals.pulse) : undefined,

    temp: vitals.temp ? parseFloat(vitals.temp) : undefined,

    weight: vitals.weight ? parseFloat(vitals.weight) : undefined,

    height: vitals.height ? parseFloat(vitals.height) : undefined,

    spo2: vitals.spo2 ? parseFloat(vitals.spo2) : undefined,
  }

  return JSON.stringify(obj)
}

function versionToForm(v?: ClinicalVersionDto): FormState {
  if (!v) return INITIAL_FORM

  const vit = parseVitals(v.signosVitales)

  return {
    motivoConsulta: v.motivoConsulta || "",

    examenClinico: v.examenClinico || "",

    diagnostico: v.diagnostico || "",

    procedimientos: v.procedimientos || "",

    planTratamiento: v.planTratamiento || "",

    recetasPrescripciones: v.recetasPrescripciones || "",

    indicaciones: v.indicaciones || "",

    evolucion: v.evolucion || "",

    proximaCitaSugerida: v.proximaCitaSugerida || "",

    vitals: {
      systolic: vit.systolic != null ? String(vit.systolic) : "",

      diastolic: vit.diastolic != null ? String(vit.diastolic) : "",

      pulse: vit.pulse != null ? String(vit.pulse) : "",

      temp: vit.temp != null ? String(vit.temp) : "",

      weight: vit.weight != null ? String(vit.weight) : "",

      height: vit.height != null ? String(vit.height) : "",

      spo2: vit.spo2 != null ? String(vit.spo2) : "",
    },
  }
}

// ── Modal de Atención / Borrador ──────────────────────────────────────────────

function ModalEncounterForm({
  isEditing,

  externalError,

  patientName,

  initialData,

  citaId,

  encounterId,

  revision,

  onAutoSaved,

  onSaveDraft,

  onConfirmDirect,

  onClose,

  isSubmitting,
}: {
  isEditing: boolean

  externalError?: string | null

  patientName: string

  initialData?: FormState

  citaId?: string

  encounterId?: string

  revision?: string

  onAutoSaved?: (encounter: ClinicalEncounterDto) => void

  onSaveDraft: (data: FormState) => Promise<void>

  onConfirmDirect: (data: FormState) => Promise<void>

  onClose: () => void

  isSubmitting: boolean
}) {
  const [form, setForm] = useState<FormState>(initialData || INITIAL_FORM)

  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const lastSaved = useRef(JSON.stringify(initialData || INITIAL_FORM))

  const [autoSaving, setAutoSaving] = useState(false)

  const failedFingerprint = useRef("")

  const [autoStatus, setAutoStatus] = useState("")

  const fingerprint = JSON.stringify(form)

  useEffect(() => {
    if (
      !encounterId ||
      isSubmitting ||
      autoSaving ||
      fingerprint === lastSaved.current ||
      fingerprint === failedFingerprint.current
    )
      return

    const timer = setTimeout(async () => {
      setAutoSaving(true)
      setAutoStatus("Guardando borrador…")

      try {
        const { vitals, ...fields } = form

        const updated = await updateDraftEncounter(encounterId, {
          ...fields,
          signosVitales: serializeVitals(vitals),
          revision,
        })

        onAutoSaved?.(updated)

        lastSaved.current = fingerprint

        setAutoStatus("Borrador guardado")
      } catch (err: any) {
        failedFingerprint.current = fingerprint

        setAutoStatus(
          "No se pudo guardar automáticamente. Usa Guardar borrador para reintentar.",
        )

        setErrorMsg(err.message || "Error al guardar el borrador")
      } finally {
        setAutoSaving(false)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [encounterId, fingerprint, isSubmitting, autoSaving])

  useEffect(() => {
    const protect = (e: BeforeUnloadEvent) => {
      if (fingerprint !== lastSaved.current) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", protect)

    return () => window.removeEventListener("beforeunload", protect)
  }, [fingerprint])

  const close = () => {
    if (
      fingerprint !== lastSaved.current &&
      !window.confirm("Hay cambios sin guardar. ¿Deseas cerrar el formulario?")
    )
      return

    onClose()
  }

  const setF =
    (k: keyof Omit<FormState, "vitals">) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }))

      setErrorMsg(null)
    }

  const setVit =
    (k: keyof FormState["vitals"]) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, vitals: { ...f.vitals, [k]: e.target.value } }))

      setErrorMsg(null)
    }

  const handleValidate = () => {
    if (!form.diagnostico.trim() && !form.motivoConsulta.trim()) {
      setErrorMsg(
        "Debe registrar al menos el motivo de consulta o el diagnóstico",
      )

      return false
    }

    return true
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2
                className="font-bold text-slate-800 text-base"
                style={{ fontFamily: "Outfit" }}
              >
                {isEditing
                  ? "Editar borrador de atención clínica"
                  : "Nueva atención clínica"}
              </h2>
              {citaId && (
                <span className="text-[10px] font-mono bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-full font-bold">
                  Cita #{citaId}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Paciente: {patientName}
            </p>
          </div>
          <button
            onClick={close}
            disabled={isSubmitting || autoSaving}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {(errorMsg || externalError) && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <span>⚠</span>
              <span>{errorMsg || externalError}</span>
            </div>
          )}

          {/* Motivo & Próxima Cita */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Motivo de consulta *
              </label>
              <input
                value={form.motivoConsulta}
                onChange={setF("motivoConsulta")}
                placeholder="Ej. Dolor agudo en molar inferior, molestia al masticar..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Próxima cita sugerida
              </label>
              <input
                type="date"
                value={form.proximaCitaSugerida}
                onChange={setF("proximaCitaSugerida")}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>
          </div>

          {/* Signos Vitales */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <p
              className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2.5"
              style={{ fontFamily: "Outfit" }}
            >
              Signos vitales
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {[
                ["Sistólica", "systolic", "mmHg"],

                ["Diastólica", "diastolic", "mmHg"],

                ["Pulso", "pulse", "lpm"],

                ["Temp", "temp", "°C"],

                ["Peso", "weight", "kg"],

                ["Talla", "height", "cm"],

                ["SpO₂", "spo2", "%"],
              ].map(([lbl, key, unit]) => (
                <div key={key}>
                  <label className="text-[10px] text-slate-400 block mb-0.5">
                    {lbl}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={form.vitals[(key as keyof FormState["vitals"])]}
                      onChange={setVit(key as keyof FormState["vitals"])}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    />
                    <span className="absolute right-1.5 top-2 text-[9px] text-slate-400 pointer-events-none">
                      {unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnóstico */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Diagnóstico Estomatológico (CIE-10 / Diagnóstico Dental) *
            </label>
            <input
              value={form.diagnostico}
              onChange={setF("diagnostico")}
              placeholder="Ej. K02.1 Caries de la dentina en pieza 36, Pulpitis irreversible..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 font-medium text-slate-800"
            />
          </div>

          {/* Examen Clínico */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Examen Clínico Estomatológico (Intraoral / Extraoral)
            </label>
            <textarea
              value={form.examenClinico}
              onChange={setF("examenClinico")}
              rows={2}
              placeholder="Hallazgos clínicos, percusión, movilidad, estado periodontal, mucosa..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>

          {/* Procedimientos */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Procedimientos Realizados y Tratamiento Dental
            </label>
            <textarea
              value={form.procedimientos}
              onChange={setF("procedimientos")}
              rows={2}
              placeholder="Apertura cavitaria, grabado ácido, colocación de resina, curetaje..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>

          {/* Plan de Tratamiento */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Plan de Tratamiento Odontológico
            </label>
            <textarea
              value={form.planTratamiento}
              onChange={setF("planTratamiento")}
              rows={2}
              placeholder="Fases posteriores, controles, profilaxis periódica..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>

          {/* Recetas & Indicaciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Prescripción Farmacológica (Receta Médica)
              </label>
              <textarea
                value={form.recetasPrescripciones}
                onChange={setF("recetasPrescripciones")}
                rows={2}
                placeholder="Fármacos, posología y duración del tratamiento..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Recomendaciones y Cuidados Post-Operatorios
              </label>
              <textarea
                value={form.indicaciones}
                onChange={setF("indicaciones")}
                rows={2}
                placeholder="Cuidados post-operatorios, dieta, higiene bucal..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
          </div>

          {/* Evolución */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Anamnesis y Evolución del Paciente
            </label>
            <textarea
              value={form.evolucion}
              onChange={setF("evolucion")}
              rows={2}
              placeholder="Respuesta del paciente, tolerancia a anestesia, motivo de consulta referido..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>
        </div>

        {/* Footer con dos acciones distintas: Guardar borrador vs Confirmar y firmar */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <p className="text-[11px] text-slate-400">
            {autoStatus || "Al confirmar, la versión queda inmutable."}
          </p>
          <div className="flex gap-2">
            <button
              onClick={close}
              disabled={isSubmitting || autoSaving}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (handleValidate()) onSaveDraft(form)
              }}
              disabled={isSubmitting || autoSaving}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Icon
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                className="w-3.5 h-3.5"
              />
              Guardar Borrador
            </button>
            <button
              onClick={() => {
                if (!form.motivoConsulta.trim() || !form.diagnostico.trim())
                  setErrorMsg(
                    "Complete motivo de consulta y diagnóstico antes de firmar",
                  )
                else onConfirmDirect(form)
              }}
              disabled={isSubmitting || autoSaving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Icon
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                className="w-3.5 h-3.5"
              />
              Confirmar y Firmar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Modal de Corrección (D06 - Nueva Versión Inmutable) ────────────────────────

function ModalCorrectionForm({
  encounter,

  onSaveCorrection,

  onClose,

  isSubmitting,
}: {
  encounter: ClinicalEncounterDto

  onSaveCorrection: (payload: CreateCorrectionVersionPayload) => Promise<void>

  onClose: () => void

  isSubmitting: boolean
}) {
  const previousVersion = encounter.versionActual

  const [form, setForm] = useState<FormState>(versionToForm(previousVersion))

  const [confirmarInmediatamente, setConfirmarInmediatamente] = useState(true)

  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const setF =
    (k: keyof Omit<FormState, "vitals">) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }))

      setErrorMsg(null)
    }

  const handleValidate = () => {
    if (!form.diagnostico.trim() && !form.motivoConsulta.trim()) {
      setErrorMsg(
        "Debe registrar al menos el motivo de consulta o el diagnóstico",
      )

      return false
    }

    return true
  }

  const handleSubmit = () => {
    if (!handleValidate()) return

    const payload: CreateCorrectionVersionPayload = {
      motivoConsulta: form.motivoConsulta,

      examenClinico: form.examenClinico,

      diagnostico: form.diagnostico,

      procedimientos: form.procedimientos,

      planTratamiento: form.planTratamiento,

      recetasPrescripciones: form.recetasPrescripciones,

      indicaciones: form.indicaciones,

      evolucion: form.evolucion,

      proximaCitaSugerida: form.proximaCitaSugerida || undefined,

      signosVitales: serializeVitals(form.vitals),

      confirmarInmediatamente,
    }

    onSaveCorrection(payload)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2
              className="font-bold text-slate-800 text-base"
              style={{ fontFamily: "Outfit" }}
            >
              Crear Versión de Corrección (v
              {(previousVersion?.numeroVersion || 1) + 1})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              La versión v{previousVersion?.numeroVersion || 1} original se
              conservará inmutable en el historial de auditoría.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="p-3 bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs rounded-xl flex items-center gap-2">
            <span>ℹ</span>
            <span>
              Está redactando una enmienda oficial sobre la atención #
              {encounter.id}. Los cambios quedarán trazados con su autor y
              fecha.
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <span>⚠</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Diagnóstico Estomatológico Corregido *
            </label>
            <input
              value={form.diagnostico}
              onChange={setF("diagnostico")}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Procedimientos Realizados Corregidos / Complementarios
            </label>
            <textarea
              value={form.procedimientos}
              onChange={setF("procedimientos")}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Evolución Clínica y Justificación de la Nueva Versión
            </label>
            <textarea
              value={form.evolucion}
              onChange={setF("evolucion")}
              rows={2}
              placeholder="Describa el motivo o precisión clínica de esta nueva versión..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Prescripción Farmacológica Actualizada
              </label>
              <textarea
                value={form.recetasPrescripciones}
                onChange={setF("recetasPrescripciones")}
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Recomendaciones y Cuidados Actualizados
              </label>
              <textarea
                value={form.indicaciones}
                onChange={setF("indicaciones")}
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="confirmImmediate"
              checked={confirmarInmediatamente}
              onChange={(e) => setConfirmarInmediatamente(e.target.checked)}
              className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <label
              htmlFor="confirmImmediate"
              className="text-xs text-slate-700 font-medium cursor-pointer"
            >
              Confirmar y firmar digitalmente esta nueva versión de inmediato
            </label>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0 bg-slate-50/50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Icon
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              className="w-3.5 h-3.5"
            />
            Registrar Versión {(previousVersion?.numeroVersion || 1) + 1}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal de Impresión / Vista Previa ─────────────────────────────────────────

function ModalImprimir({
  encounter,

  version,

  patientName,

  patientDoc,

  onClose,
}: {
  encounter: ClinicalEncounterDto

  version?: ClinicalVersionDto

  patientName: string

  patientDoc?: string

  onClose: () => void
}) {
  const v = version || encounter.versionActual

  const vitals = parseVitals(v?.signosVitales)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2
            className="font-bold text-slate-800 text-sm"
            style={{ fontFamily: "Outfit" }}
          >
            Vista previa de impresión oficial · Versión v{v?.numeroVersion || 1}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-500 cursor-pointer"
            >
              <Icon
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                className="w-3.5 h-3.5"
              />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4 text-xs">
          <div className="text-center border-b-2 border-slate-800 pb-3">
            <p
              className="font-black text-lg tracking-widest text-teal-900"
              style={{ fontFamily: "Outfit" }}
            >
              CORONYX · SISTEMA DENTAL
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Historia Clínica Odontológica Oficial · Atención #{encounter.id}{" "}
              (v{v?.numeroVersion || 1})
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
            <div>
              <span className="text-slate-400">Paciente:</span>{" "}
              <strong className="text-slate-800">{patientName}</strong>
            </div>
            <div>
              <span className="text-slate-400">Documento:</span>{" "}
              <strong className="text-slate-800">
                {patientDoc || encounter.pacienteNumeroDocumento || "—"}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Fecha de Registro:</span>{" "}
              <strong className="text-slate-800">
                {fmtDateTime(v?.fechaRegistro)}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Estado:</span>{" "}
              <strong
                className={
                  v?.estaConfirmado ? "text-emerald-700" : "text-amber-700"
                }
              >
                {v?.estaConfirmado ? "CONFIRMADO" : "BORRADOR"}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Odontólogo Autor:</span>{" "}
              <strong className="text-slate-800">
                {encounter.odontologoNombreCompleto}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Firmado Por:</span>{" "}
              <strong className="text-slate-800">
                {v?.firmadoPorNombre || "Pendiente de firma"}
              </strong>
            </div>
          </div>

          {vitals && Object.keys(vitals).length > 0 && (
            <div className="border border-slate-100 rounded-xl p-3">
              <p className="font-bold text-slate-700 text-[10px] uppercase tracking-wider mb-1.5">
                Signos Vitales
              </p>
              <div className="grid grid-cols-4 gap-2 text-slate-600">
                {vitals.systolic && (
                  <div>
                    P.A.: {vitals.systolic}/{vitals.diastolic} mmHg
                  </div>
                )}
                {vitals.pulse && <div>Pulso: {vitals.pulse} lpm</div>}
                {vitals.temp && <div>Temp: {vitals.temp} °C</div>}
                {vitals.spo2 && <div>SpO₂: {vitals.spo2} %</div>}
              </div>
            </div>
          )}

          {[
            ["Motivo de Consulta y Anamnesis", v?.motivoConsulta],

            ["Examen Clínico Estomatológico", v?.examenClinico],

            ["Diagnóstico Estomatológico (CIE-10)", v?.diagnostico],

            [
              "Procedimientos Realizados y Tratamiento Dental",
              v?.procedimientos,
            ],

            ["Plan de Tratamiento Odontológico", v?.planTratamiento],

            [
              "Prescripción Farmacológica (Receta Médica)",
              v?.recetasPrescripciones,
            ],

            ["Recomendaciones y Cuidados Post-Operatorios", v?.indicaciones],

            ["Anamnesis y Evolución del Paciente", v?.evolucion],
          ]
            .filter(([, val]) => val)
            .map(([label, val]) => (
              <div key={label} className="border-b border-slate-100 pb-2">
                <p className="font-bold text-slate-600 uppercase text-[10px] tracking-wider mb-0.5">
                  {label}
                </p>
                <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                  {val}
                </p>
              </div>
            ))}

          <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-400">
            <div>
              <div className="h-10 border-b border-slate-300 mb-1" />
              <p>
                Firma y sello de Dr(a).{" "}
                {v?.firmadoPorNombre || encounter.odontologoNombreCompleto}
              </p>
            </div>
            <div>
              <div className="h-10 border-b border-slate-300 mb-1" />
              <p>Firma del paciente / tutor</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Componente Principal: HistoriaClinica ─────────────────────────────────────

export default function HistoriaClinica({
  initialPatientId,

  patientName: propPatientName,

  patientDoc: propPatientDoc,

  initialCitaId,

  autoOpenNew,
}: {
  initialPatientId?: string

  patientName?: string

  patientDoc?: string

  initialCitaId?: string

  autoOpenNew?: boolean
}) {
  const { role } = useAuth()

  const isOdontologo = role === "ODONTOLOGO"

  // Lista de pacientes para selector (si no se proveyó uno por props)

  const [patientList, setPatientList] = useState<BackendPatientDto[]>([])

  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialPatientId || "",
  )

  // Atenciones clínicas reales desde F05-A

  const [encounters, setEncounters] = useState<ClinicalEncounterDto[]>([])

  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(
    null,
  )

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null,
  )

  // Si viene con autoOpenNew o una cita específica, abrir el formulario de atención automáticamente

  useEffect(() => {
    if (autoOpenNew && isOdontologo) {
      setModal("new")
    }
  }, [autoOpenNew, isOdontologo])

  // Estados de interfaz y modales

  const [loading, setLoading] = useState(false)

  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [modal, setModal] =
    useState<"new" | "edit" | "correct" | "print" | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Cargar lista de pacientes si no viene initialPatientId

  useEffect(() => {
    if (!initialPatientId) {
      fetchPatientsFromApi()

        .then((pts) => {
          setPatientList(pts)

          if (pts.length > 0 && !selectedPatientId) {
            setSelectedPatientId(String(pts[0].id))
          }
        })

        .catch((err) => {
          console.warn("Error cargando lista de pacientes:", err)
        })
    } else {
      setSelectedPatientId(initialPatientId)
    }
  }, [initialPatientId])

  // Cargar atenciones clínicas del paciente seleccionado

  const loadEncounters = async (patientId: string) => {
    if (!isDecimalId(patientId)) return

    setLoading(true)

    setErrorMsg(null)

    try {
      const list = await getEncountersByPatient(patientId)

      setEncounters(list)

      if (list.length > 0) {
        // Si viene un initialCitaId, priorizar el encuentro que corresponde a esa cita

        const byCita = initialCitaId
          ? list.find((e) => String(e.citaId) === String(initialCitaId))
          : undefined

        const existing = list.find((e) => e.id === selectedEncounterId)

        const active = byCita || existing || list[0]

        setSelectedEncounterId(active.id)

        setSelectedVersionId(active.versionActual?.id || null)

        if (byCita && byCita.estado === "BORRADOR" && autoOpenNew) {
          setModal("edit")
        } else if (byCita && autoOpenNew) {
          setModal(null)
        }
      } else {
        setSelectedEncounterId(null)

        setSelectedVersionId(null)
      }
    } catch (err: any) {
      if (err?.status === 403) {
        setErrorMsg(
          "Acceso restringido: Solo odontólogos autorizados pueden acceder a la historia clínica.",
        )
      } else {
        setErrorMsg(
          err?.message ||
            "Error al cargar las atenciones clínicas del paciente.",
        )
      }

      setEncounters([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedPatientId && isOdontologo) {
      loadEncounters(selectedPatientId)
    }
  }, [selectedPatientId, isOdontologo, initialCitaId, autoOpenNew])

  // Encuentro clínico activo seleccionado

  const activeEncounter = useMemo(() => {
    return (
      encounters.find((e) => e.id === selectedEncounterId) ||
      encounters[0] ||
      null
    )
  }, [encounters, selectedEncounterId])

  // Versión específica seleccionada dentro del encuentro activo (para auditoría)

  const activeVersion = useMemo(() => {
    if (!activeEncounter) return undefined

    if (selectedVersionId) {
      const found = activeEncounter.versiones.find(
        (v) => v.id === selectedVersionId,
      )

      if (found) return found
    }

    return activeEncounter.versionActual
  }, [activeEncounter, selectedVersionId])

  // Nombre y documento del paciente actual

  const currentPatientName = useMemo(() => {
    if (propPatientName) return propPatientName

    const p = patientList.find((pt) => String(pt.id) === selectedPatientId)

    if (p) return `${p.nombres} ${p.apellidos}`

    return activeEncounter?.pacienteNombreCompleto || "Paciente"
  }, [propPatientName, patientList, selectedPatientId, activeEncounter])

  const currentPatientDoc = useMemo(() => {
    if (propPatientDoc) return propPatientDoc

    const p = patientList.find((pt) => String(pt.id) === selectedPatientId)

    return p?.numeroDocumento || activeEncounter?.pacienteNumeroDocumento || ""
  }, [propPatientDoc, patientList, selectedPatientId, activeEncounter])

  const newCitaId =
    autoOpenNew &&
    initialCitaId &&
    selectedPatientId === initialPatientId &&
    !encounters.some((e) => e.citaId === initialCitaId)
      ? initialCitaId
      : undefined

  // ── Handlers de Negocio F05-A ───────────────────────────────────────────────

  // 1. Crear nuevo borrador

  const handleCreateDraft = async (form: FormState) => {
    setIsSubmitting(true)

    setErrorMsg(null)

    try {
      const payload: CreateClinicalEncounterPayload = {
        pacienteId: selectedPatientId,

        citaId: newCitaId,

        motivoConsulta: form.motivoConsulta,

        examenClinico: form.examenClinico,

        diagnostico: form.diagnostico,

        procedimientos: form.procedimientos,

        planTratamiento: form.planTratamiento,

        recetasPrescripciones: form.recetasPrescripciones,

        indicaciones: form.indicaciones,

        evolucion: form.evolucion,

        proximaCitaSugerida: form.proximaCitaSugerida || undefined,

        signosVitales: serializeVitals(form.vitals),
      }

      const created = await createDraftEncounter(payload)

      await loadEncounters(selectedPatientId)

      setSelectedEncounterId(created.id)

      setSelectedVersionId(created.versionActual?.id || null)

      setModal(null)
    } catch (err: any) {
      setErrorMsg(err.message || "Error al guardar el borrador de atención")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 2. Crear y confirmar directamente en 1 paso

  const handleCreateAndConfirm = async (form: FormState) => {
    setIsSubmitting(true)

    setErrorMsg(null)

    try {
      const payload: CreateClinicalEncounterPayload = {
        pacienteId: selectedPatientId,

        citaId: newCitaId,

        motivoConsulta: form.motivoConsulta,

        examenClinico: form.examenClinico,

        diagnostico: form.diagnostico,

        procedimientos: form.procedimientos,

        planTratamiento: form.planTratamiento,

        recetasPrescripciones: form.recetasPrescripciones,

        indicaciones: form.indicaciones,

        evolucion: form.evolucion,

        proximaCitaSugerida: form.proximaCitaSugerida || undefined,

        signosVitales: serializeVitals(form.vitals),
      }

      const created = await createDraftEncounter(payload)

      const confirmed = await confirmEncounterVersion(created.id, {
        versionId: created.versionActual?.id,
        revision: created.versionActual?.revision,
      })

      await loadEncounters(selectedPatientId)

      setSelectedEncounterId(confirmed.id)

      setSelectedVersionId(confirmed.versionActual?.id || null)

      setModal(null)
    } catch (err: any) {
      setErrorMsg(err.message || "Error al registrar y confirmar la atención")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 3. Modificar borrador existente

  const handleUpdateDraft = async (form: FormState, confirm = false) => {
    if (!activeEncounter) return

    setIsSubmitting(true)

    setErrorMsg(null)

    try {
      const payload: UpdateClinicalDraftPayload = {
        revision: activeEncounter.versionActual?.revision,

        motivoConsulta: form.motivoConsulta,

        examenClinico: form.examenClinico,

        diagnostico: form.diagnostico,

        procedimientos: form.procedimientos,

        planTratamiento: form.planTratamiento,

        recetasPrescripciones: form.recetasPrescripciones,

        indicaciones: form.indicaciones,

        evolucion: form.evolucion,

        proximaCitaSugerida: form.proximaCitaSugerida || undefined,

        signosVitales: serializeVitals(form.vitals),
      }

      const updated = await updateDraftEncounter(activeEncounter.id, payload)

      if (confirm)
        await confirmEncounterVersion(updated.id, {
          versionId: updated.versionActual?.id,
          revision: updated.versionActual?.revision,
        })

      await loadEncounters(selectedPatientId)

      setSelectedEncounterId(updated.id)

      setModal(null)
    } catch (err: any) {
      setErrorMsg(err.message || "Error al actualizar el borrador")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 4. Confirmar versión exacta de un encuentro activo

  const handleConfirmActiveEncounter = async () => {
    if (!activeEncounter) return

    setIsSubmitting(true)

    setErrorMsg(null)

    try {
      const targetVersion = activeEncounter.versionActual

      const confirmed = await confirmEncounterVersion(activeEncounter.id, {
        versionId: targetVersion?.id,

        revision: targetVersion?.revision,

        numeroVersion: targetVersion?.numeroVersion,
      })

      await loadEncounters(selectedPatientId)

      setSelectedEncounterId(confirmed.id)

      setSelectedVersionId(confirmed.versionActual?.id || null)
    } catch (err: any) {
      setErrorMsg(err.message || "Error al confirmar y firmar la atención")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 5. Registrar versión de corrección (D06)

  const handleSaveCorrection = async (
    payload: CreateCorrectionVersionPayload,
  ) => {
    if (!activeEncounter) return

    setIsSubmitting(true)

    setErrorMsg(null)

    try {
      const corrected = await createCorrectionVersion(
        activeEncounter.id,
        payload,
      )

      await loadEncounters(selectedPatientId)

      setSelectedEncounterId(corrected.id)

      setSelectedVersionId(corrected.versionActual?.id || null)

      setModal(null)
    } catch (err: any) {
      setErrorMsg(err.message || "Error al registrar la versión de corrección")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Seguridad: si el usuario no es odontólogo, mostrar advertencia de rol

  if (!isOdontologo) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 h-full">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-xs">
          <span className="text-3xl">🔒</span>
          <p
            className="font-bold text-slate-800 text-sm mt-3"
            style={{ fontFamily: "Outfit" }}
          >
            Acceso Restringido a Historia Clínica
          </p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            La historia clínica técnica y las atenciones odontológicas están
            reservadas exclusivamente para odontólogos autorizados de la
            clínica.
          </p>
        </div>
      </div>
    )
  }

  const activeVitals = parseVitals(activeVersion?.signosVitales)

  return (
    <div className="flex flex-col xl:flex-row h-full min-h-0 w-full overflow-hidden bg-slate-50">
      {/* Modales */}
      {modal === "new" && (
        <ModalEncounterForm
          isEditing={false}
          externalError={errorMsg}
          patientName={currentPatientName}
          citaId={newCitaId}
          onSaveDraft={handleCreateDraft}
          onConfirmDirect={handleCreateAndConfirm}
          onClose={() => setModal(null)}
          isSubmitting={isSubmitting}
        />
      )}

      {modal === "edit" && activeEncounter && (
        <ModalEncounterForm
          isEditing={true}
          externalError={errorMsg}
          encounterId={activeEncounter.id}
          revision={activeEncounter.versionActual?.revision}
          onAutoSaved={(updated) =>
            setEncounters((es) =>
              es.map((e) => (e.id === updated.id ? updated : e)),
            )
          }
          key={activeEncounter.id}
          patientName={currentPatientName}
          citaId={
            activeEncounter.citaId
              ? String(activeEncounter.citaId)
              : initialCitaId
          }
          initialData={versionToForm(activeEncounter.versionActual)}
          onSaveDraft={handleUpdateDraft}
          onConfirmDirect={(form) => handleUpdateDraft(form, true)}
          onClose={() => {
            setModal(null)
            void loadEncounters(selectedPatientId)
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {modal === "correct" && activeEncounter && (
        <ModalCorrectionForm
          encounter={activeEncounter}
          onSaveCorrection={handleSaveCorrection}
          onClose={() => setModal(null)}
          isSubmitting={isSubmitting}
        />
      )}

      {modal === "print" && activeEncounter && (
        <ModalImprimir
          encounter={activeEncounter}
          version={activeVersion}
          patientName={currentPatientName}
          patientDoc={currentPatientDoc}
          onClose={() => setModal(null)}
        />
      )}

      {/* Barra Lateral Izquierda: Selector de Paciente (opcional) y Lista de Atenciones */}
      <div className="w-full xl:w-64 max-h-40 xl:max-h-none shrink-0 flex flex-col border-r border-slate-200 bg-white xl:h-full min-h-0">
        {/* Selector de paciente si no vino prefijado por props */}
        {!initialPatientId && patientList.length > 0 && (
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Seleccionar Paciente
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            >
              {patientList.map((pt) => (
                <option key={pt.id} value={String(pt.id)}>
                  {pt.nombres} {pt.apellidos} ({pt.numeroDocumento || "DNI"})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Encabezado de la lista */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p
              className="text-xs font-bold text-slate-800 uppercase tracking-wider"
              style={{ fontFamily: "Outfit" }}
            >
              Atenciones Clínicas
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {encounters.length} registro{encounters.length !== 1 ? "s" : ""}{" "}
              encontrado{encounters.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setModal("new")}
            className="w-7 h-7 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center justify-center transition-colors shadow-xs cursor-pointer"
            title="Nueva atención clínica"
          >
            <Icon d="M12 4v16m8-8H4" className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lista de encuentros */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400">
              <span className="inline-block animate-spin mr-1.5">⏳</span>{" "}
              Cargando historial...
            </div>
          ) : encounters.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Icon
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                className="w-8 h-8 mx-auto mb-2 text-slate-300"
              />
              <p className="text-xs text-slate-400 mb-2">
                Sin atenciones registradas
              </p>
              <button
                onClick={() => setModal("new")}
                className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold cursor-pointer"
              >
                + Registrar primera atención
              </button>
            </div>
          ) : (
            encounters.map((e) => {
              const isActive = activeEncounter?.id === e.id

              const isConfirmado = e.estado === "CONFIRMADO"

              return (
                <button
                  key={e.id}
                  onClick={() => {
                    setSelectedEncounterId(e.id)

                    setSelectedVersionId(e.versionActual?.id || null)
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 transition-all cursor-pointer ${
                    isActive
                      ? "bg-cyan-50/80 border-l-2 border-l-cyan-600"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-slate-700">
                      {fmtDate(e.fechaCreacion)}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        isConfirmado
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isConfirmado ? "✓ Confirmado" : "Borrador"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 font-medium line-clamp-1">
                    {e.versionActual?.motivoConsulta ||
                      e.versionActual?.diagnostico ||
                      "Atención odontológica"}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span className="truncate max-w-[120px]">
                      {e.odontologoNombreCompleto}
                    </span>
                    <span className="font-mono text-cyan-700 bg-cyan-100/50 px-1 rounded">
                      v{e.totalVersiones}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Panel Principal: Detalle de la Atención Activa */}
      <div className="flex-1 min-h-0 flex flex-col min-w-0 overflow-hidden">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-center justify-between px-5">
            <span>⚠ {errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-700"
            >
              ✕
            </button>
          </div>
        )}

        {activeEncounter ? (
          <>
            {/* Header del Encuentro Activo */}
            <div className="bg-white border-b border-slate-200 px-5 py-4 flex flex-wrap items-start gap-3 justify-between shrink-0 shadow-2xs">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    className="font-bold text-slate-800 text-base truncate"
                    style={{ fontFamily: "Outfit" }}
                  >
                    {activeVersion?.motivoConsulta ||
                      activeVersion?.diagnostico ||
                      "Atención Clínica"}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeEncounter.estado === "CONFIRMADO"
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {activeEncounter.estado === "CONFIRMADO"
                      ? "✓ CONFIRMADO"
                      : "BORRADOR PENDIENTE"}
                  </span>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                    Versión {activeVersion?.numeroVersion || 1} de{" "}
                    {activeEncounter.totalVersiones}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Atención #{activeEncounter.id} · Creado el{" "}
                  {fmtDateTime(activeEncounter.fechaCreacion)} por{" "}
                  {activeEncounter.odontologoNombreCompleto}
                  {activeVersion?.firmadoPorNombre && (
                    <span className="text-emerald-700 font-medium ml-1">
                      · Firmado por {activeVersion.firmadoPorNombre} (
                      {fmtDateTime(activeVersion.fechaConfirmacion)})
                    </span>
                  )}
                </p>
              </div>

              {/* Botones de Acción */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {activeEncounter.estado === "BORRADOR" ? (
                  <>
                    <button
                      onClick={() => setModal("edit")}
                      className="px-3.5 py-1.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Icon
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        className="w-3.5 h-3.5 text-cyan-600"
                      />
                      Editar borrador
                    </button>
                    <button
                      onClick={handleConfirmActiveEncounter}
                      disabled={isSubmitting}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Icon
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        className="w-3.5 h-3.5"
                      />
                      Confirmar y firmar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setModal("correct")}
                      className="px-3.5 py-1.5 border border-cyan-200 text-cyan-700 bg-cyan-50/70 hover:bg-cyan-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Icon
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        className="w-3.5 h-3.5 text-cyan-600"
                      />
                      Corregir / Nueva versión
                    </button>
                    <button
                      onClick={() => setModal("print")}
                      className="px-3.5 py-1.5 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Icon
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                        className="w-3.5 h-3.5 text-slate-500"
                      />
                      Imprimir
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Selector de versiones históricas si hay más de 1 versión */}
            {activeEncounter.versiones.length > 1 && (
              <div className="bg-white border-b border-slate-100 px-6 py-2 flex items-center gap-2 overflow-x-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
                  Historial de auditoría:
                </span>
                {activeEncounter.versiones.map((v) => {
                  const isSel = activeVersion?.id === v.id

                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVersionId(v.id)}
                      className={`px-3 py-1 text-xs rounded-xl font-semibold transition-all cursor-pointer shrink-0 ${
                        isSel
                          ? "bg-cyan-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      v{v.numeroVersion} {v.estaConfirmado ? "✓" : "(Borrador)"}
                      {v.versionAnteriorId ? ` ↰ v${v.numeroVersion - 1}` : ""}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Cuerpo del contenido clínico */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Signos Vitales */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  [
                    "P.A.",
                    activeVitals.systolic
                      ? `${activeVitals.systolic}/${activeVitals.diastolic}`
                      : "—",
                    "mmHg",
                    true,
                  ],

                  [
                    "Pulso",
                    activeVitals.pulse ? `${activeVitals.pulse}` : "—",
                    "lpm",
                    true,
                  ],

                  [
                    "Temp",
                    activeVitals.temp ? `${activeVitals.temp}` : "—",
                    "°C",
                    true,
                  ],

                  [
                    "Peso",
                    activeVitals.weight ? `${activeVitals.weight}` : "—",
                    "kg",
                    true,
                  ],

                  [
                    "Talla",
                    activeVitals.height ? `${activeVitals.height}` : "—",
                    "cm",
                    true,
                  ],

                  [
                    "SpO₂",
                    activeVitals.spo2 ? `${activeVitals.spo2}` : "—",
                    "%",
                    true,
                  ],
                ].map(([label, val, unit]) => (
                  <div
                    key={label as string}
                    className="bg-white border border-slate-100 rounded-2xl p-3 text-center shadow-2xs"
                  >
                    <p className="text-[10px] font-semibold text-slate-400 mb-0.5">
                      {label as string}
                    </p>
                    <p
                      className="font-bold text-sm text-slate-800"
                      style={{ fontFamily: "Outfit" }}
                    >
                      {val as string}
                    </p>
                    <p className="text-[9px] text-slate-400">
                      {unit as string}
                    </p>
                  </div>
                ))}
              </div>

              {/* Secciones Clínicas Principales */}
              {[
                {
                  title: "Motivo de Consulta y Anamnesis",
                  content: activeVersion?.motivoConsulta,
                  color: "#0B3D3A",
                },

                {
                  title: "Diagnóstico Estomatológico (CIE-10)",
                  content: activeVersion?.diagnostico,
                  color: "#DC2626",
                },

                {
                  title: "Examen Clínico Estomatológico",
                  content: activeVersion?.examenClinico,
                  color: "#7C3AED",
                },

                {
                  title: "Procedimientos Realizados y Tratamiento Dental",
                  content: activeVersion?.procedimientos,
                  color: "#1E8C82",
                },

                {
                  title: "Plan de Tratamiento Odontológico",
                  content: activeVersion?.planTratamiento,
                  color: "#D97706",
                },

                {
                  title: "Prescripción Farmacológica (Receta Médica)",
                  content: activeVersion?.recetasPrescripciones,
                  color: "#0369A1",
                },

                {
                  title: "Recomendaciones y Cuidados Post-Operatorios",
                  content: activeVersion?.indicaciones,
                  color: "#2563EB",
                },

                {
                  title: "Anamnesis y Evolución del Paciente",
                  content: activeVersion?.evolucion,
                  color: "#475569",
                },
              ]
                .filter((item) => item.content)
                .map((item) => (
                  <div
                    key={item.title}
                    className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs"
                  >
                    <p
                      className="text-xs font-bold uppercase tracking-wider mb-2"
                      style={{ color: item.color, fontFamily: "Outfit" }}
                    >
                      {item.title}
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                      {item.content}
                    </p>
                  </div>
                ))}

              {/* Próxima Cita Sugerida */}
              {activeVersion?.proximaCitaSugerida && (
                <div className="flex items-center gap-3 bg-cyan-50 rounded-2xl p-4 border border-cyan-100">
                  <Icon
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    className="w-4 h-4 text-cyan-600 shrink-0"
                  />
                  <p className="text-sm text-cyan-800">
                    <span className="font-semibold">
                      Próxima cita de control sugerida:
                    </span>{" "}
                    {fmtDate(activeVersion.proximaCitaSugerida)}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 p-8">
            <div className="text-center">
              <Icon
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                className="w-10 h-10 mx-auto mb-3 opacity-30"
              />
              <p className="text-sm font-medium">
                Seleccione o registre una atención clínica
              </p>
              <button
                onClick={() => setModal("new")}
                className="mt-3 px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-500 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Icon d="M12 4v16m8-8H4" className="w-3.5 h-3.5" />
                Registrar Atención Clínica
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
