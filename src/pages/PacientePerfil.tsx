import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import HistoriaClinica from './HistoriaClinica'
import {
  fetchPatientsFromApi,
  fetchPatientById,
  createPatientInApi,
  updatePatientInApi,
  archivePatientInApi,
  linkPatientUserAccount,
  type BackendPatientDto,
} from '../services/patientService'
import { fetchClinicUsers, type ClinicUserDto } from '../services/clinicUserService'
import { useAuth } from '../contexts/AuthContext'
import {
  getAttachmentsByPatient,
  publishAttachment,
  revokeAttachment,
  downloadAttachmentBlob,
  formatFileSize,
  type AttachmentDto,
} from '../services/attachmentService'
import AttachmentViewerModal from '../components/features/AttachmentViewerModal'
import UploadAttachmentModal from '../components/features/UploadAttachmentModal'
import Odontogram from '../components/features/Odontogram'

type Tab = 'resumen' | 'historia' | 'odontograma' | 'radiografias' | 'documentos'

function Icon({ d, className = 'w-4 h-4' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d={d} />
    </svg>
  )
}

// ── Patient Data Interface ───────────────────────────────────────────────────
export interface Patient {
  id: string // ID decimal string persistido devuelto por la API
  usuarioId?: string | null // ID decimal string de la cuenta de usuario vinculada (si existe)
  name: string
  nombres: string
  apellidos: string
  tipoDocumento: string
  doc: string
  dob: string
  phone: string
  email: string
  blood: string
  eps: string
  allergy: string
  antecedentes: string
  medicamentos?: string
  city: string
  status: 'active' | 'inactive' | 'archived'
  nextAppt: string
  lastVisit: string
  balance: number
  clinicaId?: string
  fechaCreacion?: string
  fechaActualizacion?: string
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso.includes('T') ? iso : iso + 'T00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateTime(iso?: string) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return iso
  }
}

function calcAge(dob?: string) {
  if (!dob) return 0
  const birth = new Date(dob.includes('T') ? dob : dob + 'T00:00').getTime()
  if (isNaN(birth)) return 0
  const age = Math.floor((Date.now() - birth) / 31557600000)
  return age >= 0 ? age : 0
}

function fmt(n: number) {
  return n ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n) : '$0'
}

// ── Document and Select Constants ─────────────────────────────────────────────
const DOC_CONFIG: Record<string, { maxLen: number; label: string; placeholder: string; helper: string; isNumeric: boolean }> = {
  DNI: { maxLen: 8, label: 'DNI (Perú - 8 dígitos)', placeholder: 'Ej: 71234567', helper: 'Exactamente 8 dígitos numéricos', isNumeric: true },
  CE: { maxLen: 12, label: 'Carné de Extranjería (CE)', placeholder: 'Ej: 001234567', helper: 'Entre 9 y 12 caracteres alfanuméricos', isNumeric: false },
  PASAPORTE: { maxLen: 12, label: 'Pasaporte', placeholder: 'Ej: A12345678', helper: 'Entre 6 y 12 caracteres alfanuméricos', isNumeric: false },
  CC: { maxLen: 10, label: 'Cédula de Ciudadanía (CC)', placeholder: 'Ej: 1020304050', helper: 'Entre 6 y 10 dígitos numéricos', isNumeric: true },
}

const BLOOD_TYPES = ['POR DETERMINAR', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
const INSURANCE_OPTIONS = ['PARTICULAR', 'EsSalud', 'SIS', 'Rímac EPS', 'Pacífico EPS', 'Mapfre EPS', 'Sanitas EPS', 'Otro']
const CITY_OPTIONS = ['Trujillo']

function getTodayIsoDate() {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ── Form Data ─────────────────────────────────────────────────────────────────
export interface PatientFormData {
  nombres: string
  apellidos: string
  tipoDocumento: 'DNI' | 'CE' | 'PASAPORTE' | 'CC'
  numeroDocumento: string
  fechaNacimiento: string
  telefono: string
  correo: string
  ciudad: string
  seguro: string
  tipoSangre: string
  alergias: string
  antecedentesMedicos: string
  usuarioId?: string
}

const BLANK_FORM = (): PatientFormData => ({
  nombres: '',
  apellidos: '',
  tipoDocumento: 'DNI',
  numeroDocumento: '',
  fechaNacimiento: '',
  telefono: '',
  correo: '',
  ciudad: 'Trujillo',
  seguro: 'PARTICULAR',
  tipoSangre: 'POR DETERMINAR',
  alergias: '',
  antecedentesMedicos: '',
  usuarioId: '',
})

// ── Modal: Nuevo Paciente (Adaptado por Rol) ──────────────────────────────────
function ModalNuevoPaciente({
  onSave,
  onClose,
  isSaving,
}: {
  onSave: (p: PatientFormData) => Promise<void> | void
  onClose: () => void
  isSaving?: boolean
}) {
  const { role } = useAuth()
  const isOdontologo = role === 'ODONTOLOGO'
  const [form, setForm] = useState<PatientFormData>(BLANK_FORM())
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)

  const maxDob = getTodayIsoDate()
  const currentDocRule = DOC_CONFIG[form.tipoDocumento] || DOC_CONFIG.DNI

  const handleTipoDocChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextType = e.target.value as PatientFormData['tipoDocumento']
    const nextRule = DOC_CONFIG[nextType] || DOC_CONFIG.DNI
    let sanitized = form.numeroDocumento
    if (nextRule.isNumeric) {
      sanitized = sanitized.replace(/\D/g, '')
    } else {
      sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, '')
    }
    sanitized = sanitized.slice(0, nextRule.maxLen)
    setForm(f => ({ ...f, tipoDocumento: nextType, numeroDocumento: sanitized }))
    setFieldErrors(fe => ({ ...fe, tipoDocumento: '', numeroDocumento: '' }))
    setApiError(null)
  }

  const handleNumeroDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value
    if (currentDocRule.isNumeric) {
      raw = raw.replace(/\D/g, '')
    } else {
      raw = raw.replace(/[^a-zA-Z0-9]/g, '')
    }
    raw = raw.slice(0, currentDocRule.maxLen)
    setForm(f => ({ ...f, numeroDocumento: raw }))
    setFieldErrors(fe => ({ ...fe, numeroDocumento: '' }))
    setApiError(null)
  }

  const setField = (field: keyof PatientFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setFieldErrors(fe => ({ ...fe, [field]: '' }))
    setApiError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setApiError(null)

    const errors: Record<string, string> = {}
    if (!form.nombres.trim()) {
      errors.nombres = 'Los nombres son obligatorios'
    } else if (form.nombres.trim().length < 2 || form.nombres.trim().length > 100) {
      errors.nombres = 'Los nombres deben tener entre 2 y 100 caracteres'
    }

    if (!form.apellidos.trim()) {
      errors.apellidos = 'Los apellidos son obligatorios'
    } else if (form.apellidos.trim().length < 2 || form.apellidos.trim().length > 100) {
      errors.apellidos = 'Los apellidos deben tener entre 2 y 100 caracteres'
    }

    if (!form.numeroDocumento.trim()) {
      errors.numeroDocumento = 'El número de documento es obligatorio'
    } else {
      const doc = form.numeroDocumento.trim()
      switch (form.tipoDocumento) {
        case 'DNI':
          if (!/^\d{8}$/.test(doc)) errors.numeroDocumento = 'El DNI debe contener exactamente 8 dígitos numéricos.'
          break
        case 'CE':
          if (!/^[a-zA-Z0-9]{9,12}$/.test(doc)) errors.numeroDocumento = 'El Carné de Extranjería (CE) debe contener entre 9 y 12 caracteres alfanuméricos.'
          break
        case 'PASAPORTE':
          if (!/^[a-zA-Z0-9]{6,12}$/.test(doc)) errors.numeroDocumento = 'El Pasaporte debe contener entre 6 y 12 caracteres alfanuméricos.'
          break
        case 'CC':
          if (!/^\d{6,10}$/.test(doc)) errors.numeroDocumento = 'La Cédula de Ciudadanía (CC) debe contener entre 6 y 10 dígitos numéricos.'
          break
      }
    }

    if (!form.fechaNacimiento) {
      errors.fechaNacimiento = 'La fecha de nacimiento es obligatoria'
    } else {
      const dobDate = new Date(form.fechaNacimiento + 'T00:00')
      const today = new Date()
      if (dobDate > today) {
        errors.fechaNacimiento = 'La fecha de nacimiento no puede ser futura.'
      }
    }

    if (form.telefono && form.telefono.trim()) {
      if (!/^[+]?[0-9\s\-]{8,25}$/.test(form.telefono.trim())) {
        errors.telefono = 'El formato del número de teléfono o celular no es válido (ej: +51 987654321).'
      }
    }

    if (form.correo && form.correo.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) {
        errors.correo = 'El formato de correo electrónico no es válido'
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    try {
      await onSave(form)
    } catch (err: any) {
      const backendErrors = err.errors || err.response?.data?.errors
      const msg = err.message || err.response?.data?.message || 'Error al registrar paciente'
      if (backendErrors && typeof backendErrors === 'object' && Object.keys(backendErrors).length > 0) {
        setFieldErrors(backendErrors)
      }
      setApiError(msg)
    }
  }

  const inputCls = 'w-full px-3 py-2 border rounded-xl text-sm transition-colors'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div>
            <h2 className="font-bold text-slate-800 text-lg" style={{ fontFamily: 'Outfit' }}>
              {isOdontologo ? '+ Nuevo Paciente (Ficha Clínica)' : '+ Nuevo Paciente (Ficha Administrativa)'}
            </h2>
            <p className="text-[11px] text-cyan-700 font-medium flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse"></span>
              {isOdontologo ? 'Incluye antecedentes clínicos y odontológicos' : 'Datos demográficos y de contacto exclusivamente'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
          </button>
        </div>

        {apiError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
            <span className="text-rose-500 font-bold">⚠</span>
            <div>
              <p className="font-semibold">Error al registrar paciente:</p>
              <p className="mt-0.5">{apiError}</p>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form id="new-patient-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Nombres *</label>
              <input
                value={form.nombres}
                onChange={setField('nombres')}
                className={`${inputCls} ${fieldErrors.nombres ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-2 focus:ring-cyan-400/50'}`}
                placeholder="Ej: Juan Carlos"
                required
              />
              {fieldErrors.nombres && <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.nombres}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Apellidos *</label>
              <input
                value={form.apellidos}
                onChange={setField('apellidos')}
                className={`${inputCls} ${fieldErrors.apellidos ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-2 focus:ring-cyan-400/50'}`}
                placeholder="Ej: Rodríguez Pérez"
                required
              />
              {fieldErrors.apellidos && <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.apellidos}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tipo de documento *</label>
              <select
                value={form.tipoDocumento}
                onChange={handleTipoDocChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              >
                <option value="DNI">DNI (Perú)</option>
                <option value="CE">Carné de Extranjería (CE)</option>
                <option value="PASAPORTE">Pasaporte</option>
                <option value="CC">Cédula de Ciudadanía (CC)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Número de documento *</label>
              <input
                value={form.numeroDocumento}
                onChange={handleNumeroDocChange}
                maxLength={currentDocRule.maxLen}
                className={`${inputCls} font-mono ${fieldErrors.numeroDocumento ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-2 focus:ring-cyan-400/50'}`}
                placeholder={currentDocRule.placeholder}
                required
              />
              {fieldErrors.numeroDocumento && <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.numeroDocumento}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Fecha de nacimiento *</label>
              <input
                type="date"
                max={maxDob}
                value={form.fechaNacimiento}
                onChange={setField('fechaNacimiento')}
                className={`${inputCls} ${fieldErrors.fechaNacimiento ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-2 focus:ring-cyan-400/50'}`}
                required
              />
              {fieldErrors.fechaNacimiento && <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.fechaNacimiento}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Teléfono / Celular</label>
              <input
                value={form.telefono}
                onChange={setField('telefono')}
                className={`${inputCls} ${fieldErrors.telefono ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-2 focus:ring-cyan-400/50'}`}
                placeholder="+51 987 654 321"
              />
              {fieldErrors.telefono && <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.telefono}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Correo electrónico</label>
              <input
                type="email"
                value={form.correo}
                onChange={setField('correo')}
                className={`${inputCls} ${fieldErrors.correo ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-2 focus:ring-cyan-400/50'}`}
                placeholder="paciente@correo.com"
              />
              {fieldErrors.correo && <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.correo}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Ciudad</label>
              <select
                value={form.ciudad}
                onChange={setField('ciudad')}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              >
                {CITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Seguro de salud</label>
              <select
                value={form.seguro}
                onChange={setField('seguro')}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              >
                {INSURANCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Campos clínicos exclusivos para Odontólogo */}
            {isOdontologo ? (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Grupo sanguíneo</label>
                  <select
                    value={form.tipoSangre}
                    onChange={setField('tipoSangre')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  >
                    {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Alergias conocidas</label>
                  <input
                    value={form.alergias}
                    onChange={setField('alergias')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    placeholder="Ej: Penicilina, Látex, Ibuprofeno (o Ninguna)..."
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Antecedentes médicos</label>
                  <textarea
                    value={form.antecedentesMedicos}
                    onChange={setField('antecedentesMedicos')}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    placeholder="Condiciones preexistentes, cirugías, tratamientos crónicos..."
                  />
                </div>
              </>
            ) : (
              <div className="col-span-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>🔒</span> Campos clínicos reservados para odontología
                </p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Por política de seguridad institucional, los antecedentes clínicos, alergias y prescripciones son registrados y actualizados únicamente por el odontólogo tratante.
                </p>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end shrink-0 bg-slate-50/70">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="new-patient-form"
            disabled={isSaving}
            className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-cyan-600/20 cursor-pointer"
          >
            {isSaving && <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" className="w-3.5 h-3.5 animate-spin" />}
            {isSaving ? 'Guardando...' : 'Registrar paciente'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: Actualizar Paciente (Adaptado por Rol) ─────────────────────────────
function ModalActualizarPaciente({
  patient,
  onSave,
  onClose,
}: {
  patient: Patient
  onSave: (id: string, updates: Partial<BackendPatientDto>) => Promise<void>
  onClose: () => void
}) {
  const { role } = useAuth()
  const isOdontologo = role === 'ODONTOLOGO'

  const [form, setForm] = useState({
    nombres: patient.nombres,
    apellidos: patient.apellidos,
    telefono: patient.phone === 'Sin teléfono' ? '' : patient.phone,
    correo: patient.email,
    dob: patient.dob,
    ciudad: patient.city,
    eps: patient.eps,
    blood: patient.blood,
    allergy: patient.allergy === 'Ninguna' ? '' : patient.allergy,
    antecedentes: patient.antecedentes === 'Sin antecedentes registrados.' ? '' : patient.antecedentes,
    medicamentos: patient.medicamentos === 'Ninguno' ? '' : (patient.medicamentos || ''),
    estado: patient.status === 'archived' ? 'ARCHIVADO' : patient.status === 'inactive' ? 'INACTIVO' : 'ACTIVO',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombres.trim()) {
      setErrorMsg('El nombre es obligatorio')
      return
    }
    setIsSaving(true)
    setErrorMsg(null)
    try {
      const payload: Partial<BackendPatientDto> = {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        telefono: form.telefono.trim(),
        correo: form.correo.trim(),
        fechaNacimiento: form.dob || undefined,
        ciudad: form.ciudad,
        seguro: form.eps,
        estado: form.estado,
      }

      // Solo si es odontólogo se envían campos clínicos
      if (isOdontologo) {
        payload.tipoSangre = form.blood
        payload.alergias = form.allergy.trim() || 'Ninguna'
        payload.antecedentesMedicos = form.antecedentes.trim() || 'Sin antecedentes relevantes'
        payload.medicamentos = form.medicamentos.trim() || undefined
      }

      await onSave(patient.id, payload)
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar paciente')
    } finally {
      setIsSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div>
            <h2 className="font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>
              {isOdontologo ? 'Actualizar Ficha de Paciente (Clínica)' : 'Actualizar Ficha de Paciente (Administrativa)'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Actualización de datos generales del paciente</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Nombres *</label>
              <input required value={form.nombres} onChange={set('nombres')} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Apellidos *</label>
              <input required value={form.apellidos} onChange={set('apellidos')} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Teléfono</label>
              <input value={form.telefono} onChange={set('telefono')} className={inputCls} placeholder="+51..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Correo Electrónico</label>
              <input type="email" value={form.correo} onChange={set('correo')} className={inputCls} placeholder="correo@..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Fecha de Nacimiento</label>
              <input type="date" max={getTodayIsoDate()} value={form.dob} onChange={set('dob')} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Ciudad</label>
              <select value={form.ciudad} onChange={set('ciudad')} className={`${inputCls} bg-white`}>
                {Array.from(new Set(['Trujillo', form.ciudad].filter(Boolean))).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Seguro</label>
              <select value={form.eps} onChange={set('eps')} className={`${inputCls} bg-white`}>
                {INSURANCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Estado</label>
              <select value={form.estado} onChange={set('estado')} className={`${inputCls} bg-white`}>
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
                <option value="ARCHIVADO">ARCHIVADO</option>
              </select>
            </div>

            {/* Campos clínicos para Odontólogo */}
            {isOdontologo ? (
              <>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Grupo Sanguíneo</label>
                  <select value={form.blood} onChange={set('blood')} className={`${inputCls} bg-white`}>
                    {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Alergias</label>
                  <input value={form.allergy} onChange={set('allergy')} placeholder="Ej: Penicilina, Ninguna..." className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Antecedentes Médicos</label>
                  <textarea value={form.antecedentes} onChange={set('antecedentes')} rows={2} className={`${inputCls} resize-none`} placeholder="Condiciones preexistentes..." />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Medicamentos Actuales</label>
                  <input value={form.medicamentos} onChange={set('medicamentos')} placeholder="Ej: Paracetamol..." className={inputCls} />
                </div>
              </>
            ) : (
              <div className="col-span-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>🔒</span> Campos clínicos reservados para odontología
                </p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Los datos clínicos no se modifican desde la ficha administrativa.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
            <button type="button" disabled={isSaving} onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving} className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-cyan-600/20 cursor-pointer">
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal: Vincular Cuenta de Usuario (PATCH /link-user) ──────────────────────
function ModalVincularCuenta({
  patient,
  onClose,
  onLinked,
}: {
  patient: Patient
  onClose: () => void
  onLinked: (patient: Patient) => void
}) {
  const { role } = useAuth()
  const [usuarioIdInput, setUsuarioIdInput] = useState(patient.usuarioId || '')
  const [clinicUsers, setClinicUsers] = useState<ClinicUserDto[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    // Si el usuario es ADMIN_CLINICA, podemos consultar las cuentas con rol PACIENTE para facilitar la selección
    if (role === 'ADMIN_CLINICA') {
      fetchClinicUsers()
        .then(users => {
          setClinicUsers(users.filter(u => u.rol === 'PACIENTE' && u.estado === 'ACTIVO'
            && (!u.pacienteId || u.pacienteId === patient.id)))
        })
        .catch(err => setErrorMsg(err.message || 'No se pudieron cargar las cuentas disponibles'))
    }
  }, [role])

  async function handleLink(targetId: string | null) {
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const updated = await linkPatientUserAccount(patient.id, targetId)
      onLinked({
        ...patient,
        usuarioId: updated.usuarioId || null,
        fechaActualizacion: updated.fechaActualizacion || new Date().toISOString(),
      })
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al vincular cuenta')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-base" style={{ fontFamily: 'Outfit' }}>
              Vinculación de Cuenta de Usuario
            </h3>
            <p className="text-xs text-slate-400">Paciente: {patient.name} (ID: #{patient.id})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            {errorMsg}
          </div>
        )}

        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 text-xs text-cyan-800 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <span>🔗</span> Vinculación de Cuenta de Usuario
          </p>
          <p className="text-[11px] leading-relaxed text-cyan-700">
            Permite que el paciente pueda acceder a su portal personal utilizando sus credenciales institucionales.
          </p>
        </div>

        {/* Estado actual */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Estado de vinculación</span>
            <span className="font-semibold text-slate-700">
              {patient.usuarioId ? `Vinculado a Usuario ID #${patient.usuarioId}` : 'Sin cuenta vinculada'}
            </span>
          </div>
          {patient.usuarioId && (
            <button
              disabled={isSubmitting}
              onClick={() => handleLink(null)}
              className="text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100 cursor-pointer"
            >
              Desvincular
            </button>
          )}
        </div>

        {/* Selector de cuenta para Admin si hay disponibles */}
        {clinicUsers.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Cuentas con rol PACIENTE registradas</label>
            <select
              value={usuarioIdInput}
              onChange={e => setUsuarioIdInput(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            >
              <option value="">Seleccionar cuenta...</option>
              {clinicUsers.map(u => (
                <option key={u.id} value={u.usuarioId}>
                  {u.nombreCompleto || `${u.nombres} ${u.apellidos}`} ({u.correo}) — Usuario #{u.usuarioId}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Ingreso manual de ID decimal de usuario */}
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Código de Usuario</label>
          <input
            value={usuarioIdInput}
            onChange={e => setUsuarioIdInput(e.target.value.replace(/\D/g, ''))}
            placeholder="Ej: 4"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Usa una cuenta PACIENTE activa de esta clínica. Si pertenece a otro expediente, desvincúlala primero.
          </p>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSubmitting || !usuarioIdInput.trim() || usuarioIdInput.trim() === patient.usuarioId}
            onClick={() => handleLink(usuarioIdInput.trim())}
            className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-500 disabled:opacity-50 cursor-pointer shadow-sm shadow-cyan-600/20"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Vinculación'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: Detalle de paciente ────────────────────────────────────────────────
function ModalDetallePaciente({
  patient,
  onClose,
  onReload,
}: {
  patient: Patient
  onClose: () => void
  onReload: (id: string) => Promise<void>
}) {
  const { role } = useAuth()
  const [isReloading, setIsReloading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleReload() {
    setIsReloading(true)
    try {
      await onReload(patient.id)
    } finally {
      setIsReloading(false)
    }
  }

  function copyId() {
    navigator.clipboard.writeText(patient.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-cyan-600/20">
              {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-800 text-base" style={{ fontFamily: 'Outfit' }}>Ficha del Paciente</h2>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  Activo
                </span>
              </div>
              <p className="text-xs text-slate-500">Expediente general del paciente</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Código de Expediente</span>
              <code className="text-xs font-mono text-cyan-700 font-semibold truncate block">#{patient.id}</code>
            </div>
            <button
              onClick={copyId}
              className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors shrink-0 shadow-sm"
            >
              {copied ? '✓ Copiado' : 'Copiar ID'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl border border-slate-100 bg-white">
              <span className="text-slate-400 text-xs block">Nombres y Apellidos</span>
              <p className="font-semibold text-slate-800 mt-0.5">{patient.name}</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-100 bg-white">
              <span className="text-slate-400 text-xs block">Documento de Identidad</span>
              <p className="font-semibold text-slate-800 mt-0.5">{patient.tipoDocumento || 'DNI'}: {patient.doc}</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-100 bg-white">
              <span className="text-slate-400 text-xs block">Teléfono</span>
              <p className="font-semibold text-slate-800 mt-0.5">{patient.phone || 'Sin teléfono'}</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-100 bg-white">
              <span className="text-slate-400 text-xs block">Correo Electrónico</span>
              <p className="font-semibold text-slate-800 mt-0.5 truncate">{patient.email || 'Sin correo'}</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-100 bg-white">
              <span className="text-slate-400 text-xs block">Fecha Nacimiento (Edad)</span>
              <p className="font-semibold text-slate-800 mt-0.5">{fmtDate(patient.dob)} ({calcAge(patient.dob)} años)</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-100 bg-white">
              <span className="text-slate-400 text-xs block">Estado de Registro</span>
              <span className={`inline-block mt-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                patient.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                patient.status === 'archived' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {patient.status === 'active' ? 'ACTIVO' : patient.status === 'archived' ? 'ARCHIVADO' : 'INACTIVO'}
              </span>
            </div>
            <div className="p-3 rounded-xl border border-slate-100 bg-white">
              <span className="text-slate-400 text-xs block">Cuenta Usuario Vinculada</span>
              <p className="font-semibold text-slate-800 mt-0.5 font-mono text-xs">
                {patient.usuarioId ? `Usuario #${patient.usuarioId}` : 'Sin vincular'}
              </p>
            </div>
            <div className="p-3 rounded-xl border border-slate-100 bg-white">
              <span className="text-slate-400 text-xs block">Seguro de Salud</span>
              <p className="font-semibold text-slate-800 mt-0.5">{patient.eps || 'PARTICULAR'}</p>
            </div>
          </div>

          {/* Control G02 */}
          {role === 'ADMIN_CLINICA' || role === 'RECEPCIONISTA' ? (
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>🔒</span> Datos Clínicos (Excluidos de Ficha Administrativa)
                </span>
                <span className="text-[10px] font-semibold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full">
                  Perfil Administrativo
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Por política institucional y separación de privilegios, los antecedentes médicos, alergias y prescripciones se reservan exclusivamente a los odontólogos tratantes.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-3 rounded-xl border border-slate-100 bg-white">
                <span className="text-slate-400 text-xs block">Alergias Conocidas</span>
                <p className={`text-sm mt-0.5 font-medium ${patient.allergy && patient.allergy !== 'Ninguna' ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                  {patient.allergy || 'Ninguna'}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-white">
                <span className="text-slate-400 text-xs block">Antecedentes Médicos</span>
                <p className="text-sm mt-0.5 text-slate-700">{patient.antecedentes || 'Sin antecedentes registrados.'}</p>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-white">
                <span className="text-slate-400 text-xs block">Medicamentos Actuales</span>
                <p className="text-sm mt-0.5 text-slate-700">{patient.medicamentos || 'Ninguno registrado'}</p>
              </div>
            </div>
          )}

          {/* Audit Trail */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Trazabilidad y Auditoría</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block text-[11px]">Fecha Creación:</span>
                <span className="font-mono text-slate-700 font-medium">{fmtDateTime(patient.fechaCreacion)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Última Actualización:</span>
                <span className="font-mono text-slate-700 font-medium">{fmtDateTime(patient.fechaActualizacion)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={handleReload}
            disabled={isReloading}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-white disabled:opacity-50 transition-colors shadow-sm"
          >
            <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" className={`w-3.5 h-3.5 text-cyan-600 ${isReloading ? 'animate-spin' : ''}`} />
            {isReloading ? 'Actualizando datos...' : 'Actualizar ficha'}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: Archivar paciente (Baja lógica) ────────────────────────────────────
function ModalArchivarPaciente({
  patient,
  onConfirm,
  onClose,
}: {
  patient: Patient
  onConfirm: (id: string) => Promise<void>
  onClose: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleArchive() {
    setIsSubmitting(true)
    try {
      await onConfirm(patient.id)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-6 h-6" />
        </div>
        <div className="text-center">
          <h3 className="font-bold text-slate-800 text-lg" style={{ fontFamily: 'Outfit' }}>¿Archivar paciente?</h3>
          <p className="text-xs text-slate-500 mt-1.5">
            Estás a punto de dar de baja a <strong className="text-slate-800">{patient.name}</strong>.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <span>🛡️</span> Archivo de expediente
          </p>
          <p className="text-[11px] leading-relaxed text-amber-700">
            El expediente del paciente pasará a estado <strong>ARCHIVADO</strong> y no se mostrará en la agenda activa ni en búsquedas regulares.
          </p>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button disabled={isSubmitting} onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
          <button disabled={isSubmitting} onClick={handleArchive} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-500 disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-rose-600/20 cursor-pointer">
            {isSubmitting ? 'Archivando...' : 'Sí, archivar paciente'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modales adicionales (Citas, Rx, Odontograma) ──────────────────────────────
function ModalAgendarCita({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const [form, setForm] = useState({ date: '', time: '09:00', procedure: 'Revisión general', doctor: 'Dr. Andrés Herrera', box: 'Box 1', notes: '' })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>Agendar cita</h2>
            <p className="text-xs text-slate-400">{patient.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Fecha</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Hora</label>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Procedimiento</label>
            <select value={form.procedure} onChange={e => setForm(f => ({ ...f, procedure: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
              {['Revisión general', 'Limpieza', 'Extracción', 'Ortodoncia ajuste', 'Endodoncia', 'Control', 'Urgencia'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button onClick={onClose} className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500">Agendar</button>
        </div>
      </div>
    </div>
  )
}

function PacienteArchivosTab({ patient, mode }: { patient: Patient; mode: 'radiografias' | 'documentos' }) {
  const [attachments, setAttachments] = useState<AttachmentDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewerAttachment, setViewerAttachment] = useState<AttachmentDto | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const loadFiles = async () => {
    if (!patient?.id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getAttachmentsByPatient(patient.id)
      setAttachments(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar los archivos del paciente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [patient?.id])

  const handleToggleVisibility = async (att: AttachmentDto) => {
    setActionLoadingId(att.id)
    try {
      const updated = att.esVisiblePaciente
        ? await revokeAttachment(att.id)
        : await publishAttachment(att.id)
      setAttachments(prev => prev.map(item => item.id === updated.id ? updated : item))
    } catch (err: any) {
      alert(`Error al cambiar visibilidad: ${err.message}`)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDirectDownload = async (att: AttachmentDto) => {
    try {
      const { blob, filename } = await downloadAttachmentBlob(att.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || att.nombreOriginal
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(`Error al descargar: ${err.message}`)
    }
  }

  const isRxMode = mode === 'radiografias'
  const filtered = attachments.filter(a => {
    if (isRxMode) {
      return a.tipoArchivo === 'RADIOGRAFIA' || a.tipoArchivo === 'FOTOGRAFIA'
    } else {
      return a.tipoArchivo !== 'RADIOGRAFIA' && a.tipoArchivo !== 'FOTOGRAFIA'
    }
  })

  return (
    <div className="h-full overflow-y-auto p-5 space-y-4">
      {/* Modals */}
      {showUploadModal && (
        <UploadAttachmentModal
          patientId={patient.id}
          patientName={patient.name}
          defaultTipo={isRxMode ? 'RADIOGRAFIA' : 'DOCUMENTO'}
          onClose={() => setShowUploadModal(false)}
          onSuccess={(created) => {
            setAttachments(prev => [created, ...prev])
          }}
        />
      )}

      {viewerAttachment && (
        <AttachmentViewerModal
          attachment={viewerAttachment}
          isDentistOrAdmin={true}
          onClose={() => setViewerAttachment(null)}
          onVisibilityChange={(updated) => {
            setAttachments(prev => prev.map(a => a.id === updated.id ? updated : a))
            setViewerAttachment(updated)
          }}
        />
      )}

      {/* Header bar */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div>
          <h2 className="font-bold text-slate-800 text-base" style={{ fontFamily: 'Outfit' }}>
            {isRxMode ? 'Radiografías e Imágenes Diagnósticas' : 'Documentos y Consentimientos'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isRxMode
              ? 'Archivos radiográficos duraderos con control de visibilidad para el paciente'
              : 'Consentimientos informados, recetas y presupuestos almacenados de forma durable'}
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Icon d="M12 4v16m8-8H4" className="w-4 h-4" />
          {isRxMode ? 'Subir Radiografía' : 'Subir Documento'}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 space-y-2">
          <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium">Sincronizando archivos con el almacenamiento durable...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center text-rose-700 space-y-2">
          <p className="text-sm font-semibold">{error}</p>
          <button
            onClick={loadFiles}
            className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center text-2xl">
            {isRxMode ? '🦷' : '📄'}
          </div>
          <div>
            <p className="font-bold text-slate-700 text-sm" style={{ fontFamily: 'Outfit' }}>
              {isRxMode ? 'No hay radiografías registradas' : 'No hay documentos registrados'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {isRxMode
                ? 'Suba radiografías panorámicas o periapicales para este paciente. El almacenamiento es seguro y durable.'
                : 'Suba consentimientos informados o recetas para este paciente.'}
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-cyan-200 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Icon d="M12 4v16m8-8H4" className="w-3.5 h-3.5" />
            {isRxMode ? 'Subir primera radiografía' : 'Subir primer documento'}
          </button>
        </div>
      )}

      {/* List / Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className={isRxMode ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
          {filtered.map(att => {
            const isImg = att.tipoMime.startsWith('image/')
            const isPdf = att.tipoMime === 'application/pdf'
            const isToggling = actionLoadingId === att.id

            if (isRxMode) {
              return (
                <div
                  key={att.id}
                  className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div>
                    {/* Visual Card Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                        {att.tipoArchivo}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          att.esVisiblePaciente
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {att.esVisiblePaciente ? '✓ Compartido' : 'Privado'}
                      </span>
                    </div>

                    {/* Preview Thumbnail Box */}
                    <div
                      onClick={() => setViewerAttachment(att)}
                      className="w-full h-36 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer relative group-hover:ring-2 group-hover:ring-cyan-500/50 transition-all"
                    >
                      <div className="text-center p-3 text-white/50 space-y-1">
                        <Icon d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-8 h-8 mx-auto text-cyan-400/80" />
                        <p className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">{att.nombreOriginal}</p>
                        <p className="text-[10px] text-cyan-300 font-medium">Hacer clic para abrir visor</p>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="mt-2.5">
                      <p className="font-bold text-xs text-slate-800 truncate" title={att.nombreOriginal}>
                        {att.nombreOriginal}
                      </p>
                      {att.regionAnatomica && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          📍 {att.regionAnatomica}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {formatFileSize(att.pesoBytes)} · {new Date(att.fechaCreacion).toLocaleDateString('es-PE')}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => handleToggleVisibility(att)}
                      disabled={isToggling}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        att.esVisiblePaciente
                          ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {isToggling ? '...' : att.esVisiblePaciente ? 'Revocar' : 'Compartir'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewerAttachment(att)}
                        className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-semibold rounded-lg text-[11px] transition-colors cursor-pointer"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => handleDirectDownload(att)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Descargar archivo"
                      >
                        <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            } else {
              return (
                <div
                  key={att.id}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 px-4 py-3 hover:shadow-xs transition-all"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    isPdf ? 'bg-rose-100 text-rose-600' : isImg ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isPdf ? 'PDF' : isImg ? 'IMG' : 'DOC'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-800 truncate">{att.nombreOriginal}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {att.tipoArchivo}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      {formatFileSize(att.pesoBytes)} · {new Date(att.fechaCreacion).toLocaleDateString('es-PE')}
                      {att.subidoPorNombre && ` · Subido por ${att.subidoPorNombre}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleVisibility(att)}
                      disabled={isToggling}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        att.esVisiblePaciente
                          ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {isToggling ? '...' : att.esVisiblePaciente ? 'Revocar' : 'Compartir'}
                    </button>

                    <button
                      onClick={() => setViewerAttachment(att)}
                      className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Ver
                    </button>

                    <button
                      onClick={() => handleDirectDownload(att)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Descargar archivo"
                    >
                      <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            }
          })}
        </div>
      )}
    </div>
  )
}

// ── Ficha Detallada de Paciente ────────────────────────────────────────────────
function PatientDetail({
  patient,
  onUpdate,
  onArchive,
  onReload,
  onLinked,
  initialTab,
  initialCitaId,
  autoAtender,
}: {
  patient: Patient
  onUpdate: (id: string, updates: Partial<BackendPatientDto>) => Promise<void>
  onArchive: (id: string) => Promise<void>
  onReload: (id: string) => Promise<void>
  onLinked: (patient: Patient) => void
  initialTab?: Tab
  initialCitaId?: string
  autoAtender?: boolean
}) {
  const { role } = useAuth()
  const isOdontologo = role === 'ODONTOLOGO'
  const isAdministrative = role === 'ADMIN_CLINICA' || role === 'RECEPCIONISTA'
  const [tab, setTab] = useState<Tab>(initialTab || 'resumen')
  const [modal, setModal] = useState<'cita' | 'detalle' | 'editar' | 'archivar' | 'vincular' | null>(null)

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab)
    }
  }, [initialTab])

  const allTabs: { id: Tab; label: string }[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'historia', label: 'Historia clínica' },
    { id: 'odontograma', label: 'Odontograma' },
    { id: 'radiografias', label: 'Radiografías' },
    { id: 'documentos', label: 'Documentos' },
  ]

  // Separación por permisos: personal administrativo solo accede a tabs administrativas (Resumen, Documentos)
  const tabs = isOdontologo ? allTabs : allTabs.filter(t => t.id === 'resumen' || t.id === 'documentos')

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {modal === 'cita' && <ModalAgendarCita patient={patient} onClose={() => setModal(null)} />}
      {modal === 'detalle' && <ModalDetallePaciente patient={patient} onClose={() => setModal(null)} onReload={onReload} />}
      {modal === 'editar' && <ModalActualizarPaciente patient={patient} onClose={() => setModal(null)} onSave={onUpdate} />}
      {modal === 'archivar' && <ModalArchivarPaciente patient={patient} onClose={() => setModal(null)} onConfirm={onArchive} />}
      {modal === 'vincular' && <ModalVincularCuenta patient={patient} onClose={() => setModal(null)} onLinked={onLinked} />}

      {/* Header del Paciente */}
      <div className="bg-white border-b border-slate-100 px-5 py-4 flex items-center gap-4 shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
          {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-800 text-base" style={{ fontFamily: 'Outfit' }}>{patient.name}</p>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                patient.status === 'active'
                  ? 'bg-emerald-100 text-emerald-600'
                  : patient.status === 'archived'
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {patient.status === 'active' ? 'Activo' : patient.status === 'archived' ? 'Archivado' : 'Inactivo'}
            </span>
            {patient.usuarioId && (
              <span className="text-[10px] font-mono bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-full">
                Cuenta #{patient.usuarioId}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {patient.tipoDocumento || 'DNI'}: {patient.doc} · {calcAge(patient.dob)} años · {patient.city}
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2">
          {/* Vincular cuenta de usuario (exclusivo para administración) */}
          {isAdministrative && (
            <button
              onClick={() => setModal('vincular')}
              title="Vincular explícitamente cuenta de usuario"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-cyan-200 text-cyan-700 bg-cyan-50/50 rounded-xl text-xs font-semibold hover:bg-cyan-100 transition-colors shadow-sm cursor-pointer"
            >
              <Icon d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" className="w-3.5 h-3.5" />
              {patient.usuarioId ? 'Cuenta Vinculada' : 'Vincular Cuenta'}
            </button>
          )}

          <button
            onClick={() => setModal('detalle')}
            title="Consultar ficha completa y auditoría"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 bg-white rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            <Icon d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" className="w-3.5 h-3.5 text-cyan-600" />
            Detalle
          </button>

          <button
            onClick={() => setModal('editar')}
            title="Actualizar datos del paciente"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-cyan-200 text-cyan-700 bg-cyan-50/70 rounded-xl text-xs font-semibold hover:bg-cyan-100/70 transition-colors shadow-sm cursor-pointer"
          >
            <Icon d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-3.5 h-3.5 text-cyan-600" />
            Editar
          </button>

          <button
            onClick={() => setModal('archivar')}
            title="Archivar expediente del paciente"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 text-rose-700 bg-rose-50/70 rounded-xl text-xs font-semibold hover:bg-rose-100/70 transition-colors shadow-sm cursor-pointer"
          >
            <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-3.5 h-3.5 text-rose-600" />
            Archivar
          </button>

          <button
            onClick={() => setModal('cita')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-500 transition-colors shadow-sm cursor-pointer"
          >
            <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-3.5 h-3.5" />
            Agendar cita
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100 px-5 flex gap-1 shrink-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              tab === t.id ? 'border-cyan-500 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido de la pestaña */}
      <div className="flex-1 overflow-hidden">
        {tab === 'resumen' && (
          <div className="h-full overflow-y-auto p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { l: 'Próxima cita', v: fmtDate(patient.nextAppt) || 'Sin agendar', c: '#1E8C82', bg: 'bg-cyan-50' },
                { l: 'Última visita', v: fmtDate(patient.lastVisit), c: '#7C3AED', bg: 'bg-violet-50' },
                { l: 'Saldo pendiente', v: patient.balance ? fmt(patient.balance) : 'Al día', c: patient.balance ? '#D97706' : '#059669', bg: patient.balance ? 'bg-amber-50' : 'bg-emerald-50' },
              ].map(s => (
                <div key={s.l} className={`${s.bg} rounded-2xl p-4`}>
                  <p className="text-xs text-slate-500">{s.l}</p>
                  <p className="font-bold text-sm mt-1" style={{ color: s.c, fontFamily: 'Outfit' }}>{s.v}</p>
                </div>
              ))}
            </div>

            {/* Datos Personales y Administrativos */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4" style={{ fontFamily: 'Outfit' }}>
                Datos personales y administrativos
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Fecha nac.', fmtDate(patient.dob)],
                  ['Edad', `${calcAge(patient.dob)} años`],
                  ['Teléfono', patient.phone],
                  ['Email', patient.email || 'Sin correo'],
                  ['EPS / Seguro', patient.eps],
                  ['Ciudad', patient.city],
                  ['Cuenta Usuario', patient.usuarioId ? `ID #${patient.usuarioId}` : 'Sin cuenta vinculada'],
                ].map(([l, v]) => (
                  <div key={l}>
                    <span className="text-slate-400 text-xs">{l}</span>
                    <p className="font-medium text-slate-700 text-sm">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sección Clínica exclusiva para Odontólogo */}
            {isOdontologo ? (
              <>
                {patient.allergy && patient.allergy !== 'Ninguna' && (
                  <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4">
                    <span className="text-lg">⚠</span>
                    <div>
                      <p className="text-xs font-bold text-rose-700">Alergia registrada</p>
                      <p className="text-sm text-rose-700 mt-0.5">{patient.allergy}</p>
                    </div>
                  </div>
                )}
                <div className="bg-white rounded-2xl border border-slate-100 p-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2" style={{ fontFamily: 'Outfit' }}>
                    Antecedentes médicos
                  </p>
                  <p className="text-sm text-slate-700">{patient.antecedentes || 'Sin antecedentes registrados.'}</p>
                </div>
              </>
            ) : (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>🔒</span> Ficha Administrativa Protegida
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Los registros de historial clínico, alergias y prescripciones están reservados exclusivamente para el odontólogo autorizado.
                </p>
              </div>
            )}
          </div>
        )}

        {tab === 'historia' && (
          isOdontologo ? (
            <HistoriaClinica
              initialPatientId={patient.id}
              patientName={patient.name}
              patientDoc={patient.doc}
              initialCitaId={initialCitaId}
              autoOpenNew={autoAtender}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 h-full">
              <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-xs">
                <span className="text-3xl">🔒</span>
                <p className="font-bold text-slate-800 text-sm mt-3" style={{ fontFamily: 'Outfit' }}>
                  Historia Clínica Técnica Restringida
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Los registros de atenciones clínicas y diagnósticos odontológicos están reservados exclusivamente para odontólogos autorizados de la clínica.
                </p>
              </div>
            </div>
          )
        )}
        {tab === 'odontograma' && isOdontologo && (
          <Odontogram patientId={patient.id} patientName={`${patient.nombres} ${patient.apellidos}`} />
        )}
        {tab === 'radiografias' && isOdontologo && (
          <PacienteArchivosTab patient={patient} mode="radiografias" />
        )}

        {tab === 'documentos' && (
          <PacienteArchivosTab patient={patient} mode="documentos" />
        )}
      </div>
    </div>
  )
}

// ── Main: PacientePerfil (Ruta Activa /app/pacientes) ──────────────────────────
export default function PacientePerfil() {
  const { role } = useAuth()
  const isAdministrative = role === 'ADMIN_CLINICA' || role === 'RECEPCIONISTA'
  const isOdontologo = role === 'ODONTOLOGO'

  const [searchParams] = useSearchParams()
  const urlPatientId = searchParams.get('pacienteId')
  const urlCitaId = searchParams.get('citaId')
  const urlTab = searchParams.get('tab') as Tab | null
  const urlAtender = searchParams.get('atender') === 'true'

  const [patients, setPatients] = useState<Patient[]>([])
  const [selId, setSelId] = useState<string>(urlPatientId || '')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showNewModal, setShowNewModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  async function loadPatients() {
    setIsLoading(true)
    setFetchError(null)
    try {
      const dbData = await fetchPatientsFromApi()
      if (dbData && dbData.length > 0) {
        const mapped: Patient[] = dbData.map(d => {
          if (!d.id) {
            throw new Error(`Contrato de API inválido: paciente (${d.numeroDocumento || 'S/D'}) sin ID decimal string`)
          }
          return {
            id: d.id,
            usuarioId: d.usuarioId || null,
            name: `${d.nombres} ${d.apellidos || ''}`.trim(),
            nombres: d.nombres,
            apellidos: d.apellidos,
            tipoDocumento: d.tipoDocumento || 'DNI',
            doc: d.numeroDocumento || 'S/D',
            dob: d.fechaNacimiento || '1995-01-01',
            phone: d.telefono || 'Sin teléfono',
            email: d.correo || '',
            blood: d.tipoSangre || d.tipo_sangre || 'POR DETERMINAR',
            eps: d.seguro || 'PARTICULAR',
            allergy: d.alergias || 'Ninguna',
            antecedentes: d.antecedentesMedicos || 'Sin antecedentes registrados.',
            medicamentos: d.medicamentos || 'Ninguno registrado',
            city: d.ciudad || 'Lima',
            status: (d.estado === 'INACTIVO' ? 'inactive' : d.estado === 'ARCHIVADO' ? 'archived' : 'active') as 'active' | 'inactive' | 'archived',
            nextAppt: '',
            lastVisit: d.fechaCreacion ? d.fechaCreacion.substring(0, 10) : '2026-09-26',
            balance: 0,
            clinicaId: d.clinicaId,
            fechaCreacion: d.fechaCreacion,
            fechaActualizacion: d.fechaActualizacion,
          }
        })

        setPatients(mapped)
        if (urlPatientId && mapped.some(p => p.id === urlPatientId)) {
          setSelId(urlPatientId)
        } else if (!selId || !mapped.some(p => p.id === selId)) {
          setSelId(mapped[0].id)
        }
      } else {
        setPatients([])
        setSelId('')
      }
    } catch (err: any) {
      console.error('Error al consultar /api/v1/patients:', err)
      setFetchError(err.message || 'Error al cargar la lista de pacientes')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPatients()
  }, [])

  const visible = patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.doc.includes(search)
    const matchFilter =
      filter === 'all'
        ? true
        : filter === 'active'
        ? p.status === 'active'
        : p.status === 'inactive' || p.status === 'archived'
    return matchSearch && matchFilter
  })

  const sel = patients.find(p => p.id === selId) || patients[0]

  async function addPatient(data: PatientFormData) {
    setIsSaving(true)
    try {
      const payload: Partial<BackendPatientDto> = {
        nombres: data.nombres.trim(),
        apellidos: data.apellidos.trim(),
        tipoDocumento: data.tipoDocumento,
        numeroDocumento: data.numeroDocumento.trim(),
        fechaNacimiento: data.fechaNacimiento || undefined,
        telefono: data.telefono?.trim() || undefined,
        correo: data.correo?.trim() || undefined,
        ciudad: data.ciudad,
        seguro: data.seguro,
        estado: 'ACTIVO',
      }

      if (data.usuarioId?.trim()) {
        payload.usuarioId = data.usuarioId.trim()
      }

      if (isOdontologo) {
        payload.tipoSangre = data.tipoSangre
        payload.alergias = data.alergias?.trim() || 'Ninguna'
        payload.antecedentesMedicos = data.antecedentesMedicos?.trim() || undefined
      }

      const created = await createPatientInApi(payload)

      if (!created.id) {
        throw new Error('Contrato de API inválido: el paciente creado no contiene ID devuelto por la API')
      }

      const np: Patient = {
        id: created.id,
        usuarioId: created.usuarioId || null,
        name: `${created.nombres} ${created.apellidos || ''}`.trim(),
        nombres: created.nombres,
        apellidos: created.apellidos,
        tipoDocumento: created.tipoDocumento || data.tipoDocumento,
        doc: created.numeroDocumento || data.numeroDocumento,
        dob: created.fechaNacimiento || data.fechaNacimiento,
        phone: created.telefono || data.telefono || 'Sin teléfono',
        email: created.correo || data.correo || '',
        blood: created.tipoSangre || data.tipoSangre || 'POR DETERMINAR',
        eps: created.seguro || data.seguro || 'PARTICULAR',
        allergy: created.alergias || data.alergias || 'Ninguna',
        antecedentes: created.antecedentesMedicos || data.antecedentesMedicos || '',
        medicamentos: created.medicamentos || 'Ninguno registrado',
        city: created.ciudad || data.ciudad || 'Lima',
        status: 'active',
        nextAppt: '',
        lastVisit: new Date().toISOString().substring(0, 10),
        balance: 0,
        clinicaId: created.clinicaId,
        fechaCreacion: created.fechaCreacion,
        fechaActualizacion: created.fechaActualizacion,
      }

      setPatients(ps => [np, ...ps])
      setSelId(np.id)
      showToast(`✓ Paciente registrado exitosamente (ID: #${created.id})`)
      setShowNewModal(false)
    } catch (err: any) {
      console.error('Error al registrar paciente:', err)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdatePatient(id: string, updates: Partial<BackendPatientDto>) {
    try {
      const updated = await updatePatientInApi(id, updates)
      setPatients(prev =>
        prev.map(p => {
          if (p.id !== id) return p
          return {
            ...p,
            name: `${updated.nombres} ${updated.apellidos || ''}`.trim(),
            nombres: updated.nombres,
            apellidos: updated.apellidos,
            phone: updated.telefono || p.phone,
            email: updated.correo || p.email,
            dob: updated.fechaNacimiento || p.dob,
            allergy: updated.alergias || p.allergy,
            antecedentes: updated.antecedentesMedicos || p.antecedentes,
            medicamentos: updated.medicamentos || p.medicamentos,
            city: updated.ciudad || p.city,
            eps: updated.seguro || p.eps,
            status: (updated.estado === 'INACTIVO' ? 'inactive' : updated.estado === 'ARCHIVADO' ? 'archived' : 'active') as any,
            fechaActualizacion: updated.fechaActualizacion || new Date().toISOString(),
          }
        })
      )
      showToast(`✓ Paciente actualizado exitosamente`)
    } catch (err: any) {
      console.error(err)
      showToast(`⚠ Error al actualizar: ${err.message}`)
      throw err
    }
  }

  async function handleArchivePatient(id: string) {
    try {
      const archived = await archivePatientInApi(id)
      setPatients(prev =>
        prev.map(p => {
          if (p.id !== id) return p
          return {
            ...p,
            status: 'archived',
            fechaActualizacion: archived.fechaActualizacion || new Date().toISOString(),
          }
        })
      )
      showToast(`✓ Paciente archivado exitosamente`)
    } catch (err: any) {
      console.error(err)
      showToast(`⚠ Error al archivar: ${err.message}`)
      throw err
    }
  }

  async function handleReloadPatient(id: string) {
    try {
      const fresh = await fetchPatientById(id)
      setPatients(prev =>
        prev.map(p => {
          if (p.id !== id) return p
          return {
            ...p,
            name: `${fresh.nombres} ${fresh.apellidos || ''}`.trim(),
            nombres: fresh.nombres,
            apellidos: fresh.apellidos,
            usuarioId: fresh.usuarioId || null,
            doc: fresh.numeroDocumento || p.doc,
            phone: fresh.telefono || p.phone,
            email: fresh.correo || p.email,
            dob: fresh.fechaNacimiento || p.dob,
            allergy: fresh.alergias || 'Ninguna',
            antecedentes: fresh.antecedentesMedicos || 'Sin antecedentes registrados.',
            medicamentos: fresh.medicamentos || 'Ninguno registrado',
            status: (fresh.estado === 'INACTIVO' ? 'inactive' : fresh.estado === 'ARCHIVADO' ? 'archived' : 'active') as any,
            fechaCreacion: fresh.fechaCreacion,
            fechaActualizacion: fresh.fechaActualizacion,
            clinicaId: fresh.clinicaId,
          }
        })
      )
      showToast(`✓ Ficha actualizada exitosamente`)
    } catch (err: any) {
      console.error(err)
      showToast(`⚠ Error al recargar: ${err.message}`)
      throw err
    }
  }

  function handlePatientLinked(updated: Patient) {
    setPatients(prev => prev.map(p => p.id === updated.id ? updated : p))
    showToast(
      updated.usuarioId
        ? `✓ Cuenta de usuario #${updated.usuarioId} vinculada al paciente #${updated.id}`
        : `✓ Cuenta de usuario desvinculada del paciente #${updated.id}`
    )
  }

  return (
    <div className="flex h-full relative">
      {/* Toast notification */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs flex items-center gap-2 border border-slate-700 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {showNewModal && <ModalNuevoPaciente onSave={addPatient} onClose={() => setShowNewModal(false)} isSaving={isSaving} />}

      {/* Sidebar de Pacientes */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-slate-200 bg-white">
        {/* Status header */}
        <div className="px-3 pt-2.5 pb-1 flex items-center justify-between border-b border-slate-50">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Pacientes</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            En línea
          </span>
        </div>

        {/* Buscador y Filtros */}
        <div className="p-3 border-b border-slate-100 space-y-2">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o documento..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            />
          </div>
          <div className="flex gap-1">
            {([['all', 'Todos'], ['active', 'Activos'], ['inactive', 'Inactivos']] as const).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`flex-1 py-1 text-[10px] font-semibold rounded-lg transition-all cursor-pointer ${
                  filter === v ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Botón de nuevo paciente */}
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 text-xs font-semibold text-cyan-600 hover:bg-cyan-50 transition-colors cursor-pointer"
        >
          <Icon d="M12 4v16m8-8H4" className="w-3.5 h-3.5" />
          + Nuevo paciente
        </button>

        {/* Lista de pacientes / Loading / Error / Empty */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 text-center space-y-2">
              <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" className="w-5 h-5 text-cyan-600 animate-spin mx-auto" />
              <p className="text-[11px] text-slate-400">Cargando pacientes...</p>
            </div>
          ) : fetchError ? (
            <div className="p-4 text-center space-y-2">
              <p className="text-xs text-rose-600 font-semibold">Error al cargar pacientes</p>
              <button
                onClick={loadPatients}
                className="px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-500"
              >
                Reintentar
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="p-6 text-center space-y-1">
              <p className="text-xs font-semibold text-slate-600">No hay pacientes</p>
              <p className="text-[11px] text-slate-400">No se encontraron registros coincidentes.</p>
            </div>
          ) : (
            visible.map(p => (
              <button
                key={p.id}
                onClick={() => setSelId(p.id)}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 transition-all flex items-center gap-2.5 cursor-pointer ${
                  selId === p.id ? 'bg-cyan-50 border-l-2 border-l-cyan-500' : 'hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-700 flex items-center justify-center text-white text-xs font-bold shrink-0 relative">
                  {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full" title="En línea"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className={`text-xs font-semibold truncate ${selId === p.id ? 'text-cyan-700' : 'text-slate-700'}`}>{p.name}</p>
                    {p.status === 'archived' && (
                      <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1 rounded shrink-0">Archivado</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    {p.doc} · {calcAge(p.dob)} años · {p.city}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-slate-100">
          <p className="text-[10px] text-slate-400">
            {visible.length} de {patients.length} pacientes · {isOdontologo ? 'Ficha clínica' : 'Ficha administrativa'}
          </p>
        </div>
      </aside>

      {/* Detalle del paciente seleccionado */}
      {sel ? (
        <PatientDetail
          patient={sel}
          onUpdate={handleUpdatePatient}
          onArchive={handleArchivePatient}
          onReload={handleReloadPatient}
          onLinked={handlePatientLinked}
          initialTab={urlTab || undefined}
          initialCitaId={urlCitaId || undefined}
          autoAtender={urlAtender}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400">
          <div>
            <Icon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">Ningún paciente seleccionado</p>
            <p className="text-xs text-slate-400 mt-1">Selecciona un paciente del menú lateral o registra uno nuevo.</p>
          </div>
        </div>
      )}
    </div>
  )
}
