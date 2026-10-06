import { useState, useEffect } from 'react'
import HistoriaClinica from './HistoriaClinica'
import { 
  fetchPatientsFromApi, 
  fetchPatientById,
  createPatientInApi, 
  updatePatientInApi,
  archivePatientInApi,
  BackendPatientDto 
} from '../services/patientService'
import { useAuth } from '../contexts/AuthContext'

type Tab = 'resumen'|'historia'|'odontograma'|'radiografias'|'documentos'

function Icon({ d, className='w-4 h-4' }: { d: string; className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={d}/></svg>
}

// ── Patient data ──────────────────────────────────────────────────────────────
interface Patient {
  id: number | string
  name: string
  nombres?: string
  apellidos?: string
  tipoDocumento?: string
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
  isRealDb?: boolean
  clinicaId?: string
  fechaCreacion?: string
  fechaActualizacion?: string
}

const PATIENTS: Patient[] = [
  { id:1, name:'María González', doc:'52.453.121', dob:'1990-07-15', phone:'+57 320 455 1234', email:'maria@gmail.com', blood:'A+', eps:'Sura EPS', allergy:'Penicilina', antecedentes:'HTA leve. Sin cirugías previas.', city:'Bogotá', status:'active', nextAppt:'2026-09-17', lastVisit:'2026-08-20', balance:0 },
  { id:2, name:'Carlos Rivas', doc:'1.015.672.340', dob:'1988-04-12', phone:'+57 310 455 7821', email:'carlos@gmail.com', blood:'O+', eps:'Colsanitas', allergy:'Ninguna', antecedentes:'Diabetes tipo 2 controlada.', city:'Bogotá', status:'active', nextAppt:'2026-08-28', lastVisit:'2026-08-23', balance:380000 },
  { id:3, name:'Sofía Martínez', doc:'43.876.521', dob:'2002-11-30', phone:'+57 300 111 2222', email:'sofia@gmail.com', blood:'B+', eps:'Compensar', allergy:'Latex', antecedentes:'Ortodoncia activa desde 2024.', city:'Medellín', status:'active', nextAppt:'2026-09-15', lastVisit:'2026-08-15', balance:0 },
  { id:4, name:'Roberto Díaz', doc:'79.654.320', dob:'1975-03-08', phone:'+57 315 555 6677', email:'roberto@gmail.com', blood:'AB-', eps:'Sanitas', allergy:'Ninguna', antecedentes:'Fumador. Bruxismo nocturno.', city:'Cali', status:'active', nextAppt:'2026-08-28', lastVisit:'2026-08-10', balance:180000 },
  { id:5, name:'Ana Pérez', doc:'31.456.789', dob:'1995-06-22', phone:'+57 311 444 5566', email:'ana@gmail.com', blood:'A-', eps:'Nueva EPS', allergy:'Ibuprofeno', antecedentes:'Sin antecedentes relevantes.', city:'Bogotá', status:'active', nextAppt:'2026-09-02', lastVisit:'2026-08-24', balance:0 },
  { id:6, name:'Luis Mendoza', doc:'12.345.678', dob:'1980-12-15', phone:'+57 320 777 8899', email:'luis@gmail.com', blood:'O-', eps:'Sura EPS', allergy:'Ninguna', antecedentes:'Hipertensión controlada.', city:'Barranquilla', status:'inactive', nextAppt:'', lastVisit:'2026-04-10', balance:0 },
  { id:7, name:'Valentina Cruz', doc:'55.321.654', dob:'1992-09-03', phone:'+57 312 000 1234', email:'vale@gmail.com', blood:'B-', eps:'Coomeva', allergy:'Ninguna', antecedentes:'Sin antecedentes relevantes.', city:'Bogotá', status:'active', nextAppt:'2026-08-28', lastVisit:'2026-08-01', balance:750000 },
  { id:8, name:'Jorge Salazar', doc:'88.123.456', dob:'1968-02-17', phone:'+57 316 888 9900', email:'jorge@gmail.com', blood:'AB+', eps:'Sanitas', allergy:'Sulfonamidas', antecedentes:'DM2, HTA. Anticoagulado con warfarina.', city:'Bogotá', status:'active', nextAppt:'2026-08-28', lastVisit:'2026-08-24', balance:0 },
]

function fmtDate(iso: string) { return iso ? new Date(iso.includes('T') ? iso : iso+'T00:00').toLocaleDateString('es-PE',{day:'numeric',month:'short',year:'numeric'}) : '—' }
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
      second: '2-digit'
    })
  } catch {
    return iso
  }
}
function calcAge(dob: string) { return dob ? Math.floor((Date.now()-new Date(dob.includes('T') ? dob : dob+'T00:00').getTime())/31557600000) : 0 }
function fmt(n: number) { return n ? new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n) : '$0' }

// ── Modal: Nuevo paciente ─────────────────────────────────────────────────────
export interface NewPatientFormData {
  nombres: string;
  apellidos: string;
  tipoDocumento: 'DNI' | 'CE' | 'PASAPORTE' | 'CC';
  numeroDocumento: string;
  fechaNacimiento: string;
  telefono: string;
  correo: string;
  tipoSangre: string;
  seguro: string;
  ciudad: string;
  alergias: string;
  antecedentesMedicos: string;
}

const BLANK_P = (): NewPatientFormData => ({
  nombres: '',
  apellidos: '',
  tipoDocumento: 'DNI',
  numeroDocumento: '',
  fechaNacimiento: '',
  telefono: '',
  correo: '',
  tipoSangre: 'POR DETERMINAR',
  seguro: 'PARTICULAR',
  ciudad: 'Lima',
  alergias: '',
  antecedentesMedicos: '',
})

const DOC_CONFIG: Record<string, { maxLen: number; label: string; placeholder: string; helper: string; isNumeric: boolean }> = {
  DNI: { maxLen: 8, label: 'DNI (Perú - 8 dígitos)', placeholder: 'Ej: 71234567', helper: 'Exactamente 8 dígitos numéricos', isNumeric: true },
  CE: { maxLen: 12, label: 'Carné de Extranjería (CE)', placeholder: 'Ej: 001234567', helper: 'Entre 9 y 12 caracteres alfanuméricos', isNumeric: false },
  PASAPORTE: { maxLen: 12, label: 'Pasaporte', placeholder: 'Ej: A12345678', helper: 'Entre 6 y 12 caracteres alfanuméricos', isNumeric: false },
  CC: { maxLen: 10, label: 'Cédula de Ciudadanía (CC)', placeholder: 'Ej: 1020304050', helper: 'Entre 6 y 10 dígitos numéricos', isNumeric: true },
}

const BLOOD_TYPES = ['POR DETERMINAR', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
const INSURANCE_OPTIONS = ['PARTICULAR', 'EsSalud', 'SIS', 'Rímac EPS', 'Pacífico EPS', 'Mapfre EPS', 'Sanitas EPS', 'Otro']
const CITY_OPTIONS = ['Lima', 'Callao', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura', 'Cusco', 'Otra']

function getDobLimits() {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return {
    maxDob: `${y - 5}-${m}-${d}`,   // Fecha de hoy menos 5 años (máximo cumpleaños, edad mínima 5)
    minDob: `${y - 100}-${m}-${d}`, // Fecha de hoy menos 100 años (mínimo cumpleaños, edad máxima 100)
  }
}

function ModalNuevoPaciente({
  onSave,
  onClose,
  isSaving,
}: {
  onSave: (p: NewPatientFormData) => Promise<void> | void;
  onClose: () => void;
  isSaving?: boolean;
}) {
  const [form, setForm] = useState<NewPatientFormData>(BLANK_P())
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)

  const { minDob, maxDob } = getDobLimits()
  const currentDocRule = DOC_CONFIG[form.tipoDocumento] || DOC_CONFIG.DNI

  // Manejo de cambio de tipo de documento
  const handleTipoDocChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextType = e.target.value as NewPatientFormData['tipoDocumento']
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

  // Manejo dinámico de número de documento según tipo activo
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

  // Prevención de teclas inválidas en teclado
  const handleDocKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(e.key)) {
      return
    }
    if (e.ctrlKey || e.metaKey) return

    if (currentDocRule.isNumeric && !/^\d$/.test(e.key)) {
      e.preventDefault()
    } else if (!currentDocRule.isNumeric && !/^[a-zA-Z0-9]$/.test(e.key)) {
      e.preventDefault()
    }
  }

  const setField = (field: keyof NewPatientFormData) => (
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

    // Pre-validaciones cliente sincronizadas con reglas del Backend
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
          if (!/^\d{8}$/.test(doc)) {
            errors.numeroDocumento = 'El DNI debe contener exactamente 8 dígitos numéricos.'
          }
          break
        case 'CE':
          if (!/^[a-zA-Z0-9]{9,12}$/.test(doc)) {
            errors.numeroDocumento = 'El Carné de Extranjería (CE) debe contener entre 9 y 12 caracteres alfanuméricos.'
          }
          break
        case 'PASAPORTE':
          if (!/^[a-zA-Z0-9]{6,12}$/.test(doc)) {
            errors.numeroDocumento = 'El Pasaporte debe contener entre 6 y 12 caracteres alfanuméricos.'
          }
          break
        case 'CC':
          if (!/^\d{6,10}$/.test(doc)) {
            errors.numeroDocumento = 'La Cédula de Ciudadanía (CC) debe contener entre 6 y 10 dígitos numéricos.'
          }
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
      } else {
        const age = Math.floor((Date.now() - dobDate.getTime()) / 31557600000)
        if (age < 5) {
          errors.fechaNacimiento = 'El paciente debe tener al menos 5 años de edad cumplidos para ser registrado en la clínica.'
        } else if (age > 100) {
          errors.fechaNacimiento = 'La fecha de nacimiento ingresada no es válida (el paciente no puede exceder los 100 años de edad).'
        }
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
      const msg = err.message || err.response?.data?.message || 'Error al registrar paciente (HTTP 400)'
      if (backendErrors && typeof backendErrors === 'object' && Object.keys(backendErrors).length > 0) {
        setFieldErrors(backendErrors)
      }
      setApiError(msg)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div>
            <h2 className="font-bold text-slate-800 text-lg" style={{ fontFamily: 'Outfit' }}>+ Nuevo paciente</h2>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Sincronizado con Spring Boot / PostgreSQL en vivo
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form id="new-patient-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Banner de error general API 400 */}
          {apiError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in duration-200">
              <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="font-semibold text-rose-800">Error del Servidor (HTTP 400)</p>
                <p className="mt-0.5">{apiError}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* 1. Nombres */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nombres <span className="text-rose-500">*</span>
              </label>
              <input
                value={form.nombres}
                onChange={setField('nombres')}
                className={`w-full px-3 py-2 border rounded-xl text-sm transition-colors ${
                  fieldErrors.nombres ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/40' : 'border-slate-200 focus:ring-2 focus:ring-cyan-400/50'
                }`}
                placeholder="Ej: Juan Carlos"
                required
              />
              {fieldErrors.nombres && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <span>⚠</span> {fieldErrors.nombres}
                </p>
              )}
            </div>

            {/* 2. Apellidos */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Apellidos <span className="text-rose-500">*</span>
              </label>
              <input
                value={form.apellidos}
                onChange={setField('apellidos')}
                className={`w-full px-3 py-2 border rounded-xl text-sm transition-colors ${
                  fieldErrors.apellidos ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/40' : 'border-slate-200 focus:ring-2 focus:ring-cyan-400/50'
                }`}
                placeholder="Ej: Pérez Morales"
                required
              />
              {fieldErrors.apellidos && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <span>⚠</span> {fieldErrors.apellidos}
                </p>
              )}
            </div>

            {/* 3. Tipo de Documento */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tipo de documento <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.tipoDocumento}
                onChange={handleTipoDocChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 font-medium text-slate-700"
              >
                <option value="DNI">DNI (Perú - 8 dígitos)</option>
                <option value="CE">CE (Carné de Extranjería)</option>
                <option value="PASAPORTE">PASAPORTE (Pasaporte)</option>
                <option value="CC">CC (Cédula de Ciudadanía)</option>
              </select>
            </div>

            {/* 4. Número de Documento */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  N° Documento <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {form.numeroDocumento.length}/{currentDocRule.maxLen}
                </span>
              </div>
              <input
                value={form.numeroDocumento}
                onChange={handleNumeroDocChange}
                onKeyDown={handleDocKeyDown}
                maxLength={currentDocRule.maxLen}
                className={`w-full px-3 py-2 border rounded-xl text-sm transition-colors ${
                  fieldErrors.numeroDocumento ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/40' : 'border-slate-200 focus:ring-2 focus:ring-cyan-400/50'
                }`}
                placeholder={currentDocRule.placeholder}
                required
              />
              <p className="text-[10px] text-slate-400 mt-0.5">{currentDocRule.helper}</p>
              {fieldErrors.numeroDocumento && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <span>⚠</span> {fieldErrors.numeroDocumento}
                </p>
              )}
            </div>

            {/* 5. Fecha de Nacimiento (Rango 5 a 100 años) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Fecha de nacimiento <span className="text-rose-500">*</span>
                </label>
                {form.fechaNacimiento && (
                  <span className="text-[10px] font-semibold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                    {calcAge(form.fechaNacimiento)} años
                  </span>
                )}
              </div>
              <input
                type="date"
                min={minDob}
                max={maxDob}
                value={form.fechaNacimiento}
                onChange={setField('fechaNacimiento')}
                className={`w-full px-3 py-2 border rounded-xl text-sm transition-colors ${
                  fieldErrors.fechaNacimiento ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/40' : 'border-slate-200 focus:ring-2 focus:ring-cyan-400/50'
                }`}
                required
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Rango de edad permitido: 5 a 100 años</p>
              {fieldErrors.fechaNacimiento && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <span>⚠</span> {fieldErrors.fechaNacimiento}
                </p>
              )}
            </div>

            {/* 6. Teléfono */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Teléfono / Celular</label>
              <input
                value={form.telefono}
                onChange={setField('telefono')}
                className={`w-full px-3 py-2 border rounded-xl text-sm transition-colors ${
                  fieldErrors.telefono ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/40' : 'border-slate-200 focus:ring-2 focus:ring-cyan-400/50'
                }`}
                placeholder="Ej: +51 987654321"
              />
              {fieldErrors.telefono && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <span>⚠</span> {fieldErrors.telefono}
                </p>
              )}
            </div>

            {/* 7. Correo Electrónico */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Correo electrónico</label>
              <input
                type="email"
                value={form.correo}
                onChange={setField('correo')}
                className={`w-full px-3 py-2 border rounded-xl text-sm transition-colors ${
                  fieldErrors.correo ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/40' : 'border-slate-200 focus:ring-2 focus:ring-cyan-400/50'
                }`}
                placeholder="correo@ejemplo.com"
              />
              {fieldErrors.correo && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <span>⚠</span> {fieldErrors.correo}
                </p>
              )}
            </div>

            {/* 8. Ciudad */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Ciudad</label>
              <select
                value={form.ciudad}
                onChange={setField('ciudad')}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 text-slate-700"
              >
                {CITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* 9. Tipo de Sangre */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tipo de sangre</label>
              <select
                value={form.tipoSangre}
                onChange={setField('tipoSangre')}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 font-mono text-slate-700"
              >
                {BLOOD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* 10. Seguro de Salud */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Seguro de salud</label>
              <select
                value={form.seguro}
                onChange={setField('seguro')}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 text-slate-700"
              >
                {INSURANCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* 11. Alergias conocidas */}
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">Alergias conocidas</label>
              <input
                value={form.alergias}
                onChange={setField('alergias')}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                placeholder="Ej: Penicilina, Látex, Ibuprofeno (o Ninguna)..."
              />
            </div>

            {/* 12. Antecedentes médicos */}
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
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end shrink-0 bg-slate-50/50">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="new-patient-form"
            disabled={isSaving}
            className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-cyan-600/20 transition-all cursor-pointer"
          >
            {isSaving && (
              <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSaving ? 'Guardando en PostgreSQL...' : 'Registrar paciente'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: Agendar cita ───────────────────────────────────────────────────────
function ModalAgendarCita({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const [form, setForm] = useState({ date:'', time:'09:00', procedure:'Revisión general', doctor:'Dr. Andrés Herrera', box:'Box 1', notes:'' })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>Agendar cita</h2>
            <p className="text-xs text-slate-400">{patient.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5"/></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Fecha</label>
              <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Hora</label>
              <input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Procedimiento</label>
            <select value={form.procedure} onChange={e=>setForm(f=>({...f,procedure:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
              {['Revisión general','Limpieza','Extracción','Ortodoncia ajuste','Endodoncia','Control','Urgencia'].map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Doctor</label>
              <select value={form.doctor} onChange={e=>setForm(f=>({...f,doctor:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                {['Dr. Andrés Herrera','Dra. Laura Suárez','Dr. Carlos Mejía'].map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Box</label>
              <select value={form.box} onChange={e=>setForm(f=>({...f,box:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                {['Box 1','Box 2','Box 3','Box 4'].map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Notas</label>
            <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
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

// ── Modal: Detalle de paciente (PostgreSQL GET /{id}) ─────────────────────────
function ModalDetallePaciente({
  patient,
  onClose,
  onReload,
}: {
  patient: Patient;
  onClose: () => void;
  onReload: (id: string | number) => Promise<void>;
}) {
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
    navigator.clipboard.writeText(String(patient.id))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-cyan-600/20">
              {patient.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-800 text-base" style={{fontFamily:'Outfit'}}>Ficha Completa del Paciente</h2>
                {patient.isRealDb ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    🐘 PostgreSQL Live
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    Local
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Operación: GET /api/v1/patients/{`{id}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5"/>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* UUID Badge */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">UUID de Identificación Técnica</span>
              <code className="text-xs font-mono text-cyan-700 font-semibold truncate block">{String(patient.id)}</code>
            </div>
            <button
              onClick={copyId}
              className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors shrink-0 shadow-sm"
            >
              {copied ? '✓ Copiado' : 'Copiar UUID'}
            </button>
          </div>

          {/* Personal Data */}
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
                {patient.status === 'active' ? 'ACTIVO' : patient.status === 'archived' ? 'ARCHIVADO (Baja lógica)' : 'INACTIVO'}
              </span>
            </div>
            <div className="p-3 rounded-xl border border-slate-100 bg-white">
              <span className="text-slate-400 text-xs block">Tipo de Sangre</span>
              <p className="font-semibold text-slate-800 mt-0.5 font-mono">{patient.blood || 'POR DETERMINAR'}</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-100 bg-white">
              <span className="text-slate-400 text-xs block">Seguro de Salud</span>
              <p className="font-semibold text-slate-800 mt-0.5">{patient.eps || 'PARTICULAR'}</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-100 bg-white col-span-2 sm:col-span-1">
              <span className="text-slate-400 text-xs block">Ciudad</span>
              <p className="font-semibold text-slate-800 mt-0.5">{patient.city || 'Lima'}</p>
            </div>
          </div>

          {/* Clinical info */}
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

          {/* Audit Trail */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Trazabilidad y Auditoría (Spring Data JPA)</h4>
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

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={handleReload}
            disabled={isReloading}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-white disabled:opacity-50 transition-colors shadow-sm"
          >
            <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" className={`w-3.5 h-3.5 text-cyan-600 ${isReloading ? 'animate-spin' : ''}`}/>
            {isReloading ? 'Consultando GET /api/v1/patients/{id}...' : 'Refrescar desde PostgreSQL'}
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

// ── Modal: Actualizar paciente (PUT /{id}) ───────────────────────────────────
function ModalActualizarPaciente({
  patient,
  onSave,
  onClose,
}: {
  patient: Patient;
  onSave: (id: string | number, updates: Partial<BackendPatientDto>) => Promise<void>;
  onClose: () => void;
}) {
  const parts = patient.name.trim().split(' ')
  const defaultNombres = patient.nombres || (parts.length > 1 ? parts.slice(0, parts.length - 1).join(' ') : patient.name)
  const defaultApellidos = patient.apellidos || (parts.length > 1 ? parts[parts.length - 1] : '')

  const [form, setForm] = useState({
    nombres: defaultNombres,
    apellidos: defaultApellidos,
    telefono: patient.phone === 'Sin teléfono' ? '' : patient.phone,
    correo: patient.email,
    dob: patient.dob,
    eps: patient.eps,
    blood: patient.blood,
    allergy: patient.allergy === 'Ninguna' ? '' : patient.allergy,
    antecedentes: patient.antecedentes === 'Sin antecedentes registrados.' ? '' : patient.antecedentes,
    medicamentos: patient.medicamentos === 'Ninguno' ? '' : (patient.medicamentos || ''),
    estado: patient.status === 'archived' ? 'ARCHIVADO' : patient.status === 'inactive' ? 'INACTIVO' : 'ACTIVO',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => setForm(f=>({...f,[k]:e.target.value}))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombres.trim()) {
      setErrorMsg('El nombre es obligatorio')
      return
    }
    setIsSaving(true)
    setErrorMsg(null)
    try {
      await onSave(patient.id, {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        telefono: form.telefono.trim(),
        correo: form.correo.trim(),
        fechaNacimiento: form.dob || undefined,
        alergias: form.allergy.trim() || 'Ninguna',
        antecedentesMedicos: form.antecedentes.trim() || 'Sin antecedentes relevantes',
        medicamentos: form.medicamentos.trim() || undefined,
        estado: form.estado,
      })
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar paciente')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h2 className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>Actualizar Ficha de Paciente</h2>
            <p className="text-[11px] text-cyan-700 font-medium flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse"></span>
              Operación: PUT /api/v1/patients/{String(patient.id).substring(0, 8)}...
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5"/></button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Nombres *</label>
              <input required value={form.nombres} onChange={set('nombres')} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Apellidos</label>
              <input value={form.apellidos} onChange={set('apellidos')} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Teléfono</label>
              <input value={form.telefono} onChange={set('telefono')} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" placeholder="+51..."/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Correo Electrónico</label>
              <input type="email" value={form.correo} onChange={set('correo')} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" placeholder="correo@..."/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Fecha de Nacimiento</label>
              <input type="date" value={form.dob} onChange={set('dob')} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Estado</label>
              <select value={form.estado} onChange={set('estado')} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
                <option value="ARCHIVADO">ARCHIVADO</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Alergias</label>
              <input value={form.allergy} onChange={set('allergy')} placeholder="Ej: Penicilina, Mariscos, Ninguna..." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Antecedentes Médicos</label>
              <textarea value={form.antecedentes} onChange={set('antecedentes')} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/50" placeholder="Condiciones preexistentes..."/>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Medicamentos Actuales</label>
              <input value={form.medicamentos} onChange={set('medicamentos')} placeholder="Ej: Paracetamol 500mg..." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
            <button type="button" disabled={isSaving} onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={isSaving} className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-cyan-600/20">
              {isSaving ? 'Guardando en PostgreSQL...' : 'Guardar cambios (PUT)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal: Archivar paciente (PATCH /{id}/archive) ───────────────────────────
function ModalArchivarPaciente({
  patient,
  onConfirm,
  onClose,
}: {
  patient: Patient;
  onConfirm: (id: string | number) => Promise<void>;
  onClose: () => void;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-6 h-6"/>
        </div>
        <div className="text-center">
          <h3 className="font-bold text-slate-800 text-lg" style={{fontFamily:'Outfit'}}>¿Archivar paciente?</h3>
          <p className="text-xs text-slate-500 mt-1.5">
            Estás a punto de dar de baja a <strong className="text-slate-800">{patient.name}</strong>.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <span>🛡️</span> Borrado lógico garantizado
          </p>
          <p className="text-[11px] leading-relaxed text-amber-700">
            Se ejecutará <code>PATCH /api/v1/patients/{`{id}`}/archive</code> cambiando el estado a <strong>ARCHIVADO</strong> en PostgreSQL. La historia clínica y odontograma se conservan para trazabilidad médico-legal.
          </p>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button disabled={isSubmitting} onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button disabled={isSubmitting} onClick={handleArchive} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-500 disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-rose-600/20">
            {isSubmitting ? 'Archivando...' : 'Sí, archivar paciente'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: Visor radiografías ─────────────────────────────────────────────────
function ModalRadiografia({ onClose }: { onClose: () => void }) {
  const [findings, setFindings] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>Visor de radiografías</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Simulated X-ray */}
          <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center" style={{height:280}}>
            <div className="text-center text-white/20 p-8">
              <svg className="w-24 h-24 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 100 100">
                <rect x="10" y="20" width="80" height="60" rx="4" stroke="white" strokeWidth="2" fill="none"/>
                {/* Simplified panoramic representation */}
                {[15,22,29,36,43,57,64,71,78,85].map(x=>(
                  <rect key={x} x={x} y="30" width="5" height={20+Math.sin(x)*5} rx="1" fill="white" opacity="0.6"/>
                ))}
                <text x="50" y="95" textAnchor="middle" fill="white" fontSize="8" opacity="0.5">Rx Panorámica — Carlos Rivas — 23/08/2026</text>
              </svg>
              <p className="text-sm">Radiografía panorámica</p>
              <p className="text-xs opacity-60 mt-1">DICOM viewer — modo demo</p>
            </div>
          </div>
          {/* ML Findings */}
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
                <Icon d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" className="w-3.5 h-3.5 text-violet-600"/>
              </div>
              <p className="text-xs font-bold text-violet-700">Hallazgos de IA · CORONYX RadScan</p>
              <span className="text-[10px] bg-violet-200 text-violet-700 px-2 py-0.5 rounded-full font-medium ml-auto">Confianza 94%</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-violet-800">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0"/>
                <span><strong>#38:</strong> Tercer molar retenido, angulación mesial ~65°. Rizólisis del #37 descartada.</span>
              </div>
              <div className="flex items-center gap-2 text-violet-800">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0"/>
                <span><strong>Seno maxilar:</strong> Velamiento parcial seno derecho — correlación clínica recomendada.</span>
              </div>
              <div className="flex items-center gap-2 text-violet-800">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"/>
                <span>Resto de la dentición sin alteraciones periapicales evidentes.</span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Informe del radiólogo</label>
            <textarea value={findings} onChange={e=>setFindings(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              placeholder="Añadir informe o notas..."/>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cerrar</button>
          <button onClick={onClose} className="px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-500">Guardar informe</button>
        </div>
      </div>
    </div>
  )
}

// ── Odontogram component (simplified interactive) ─────────────────────────────
const TOOTH_STATES: Record<string,{color:string;label:string}> = {
  healthy:   { color:'#FFFFFF', label:'Sano' },
  caries:    { color:'#FCA5A5', label:'Caries' },
  restored:  { color:'#93C5FD', label:'Restaurado' },
  extracted: { color:'#6B7280', label:'Extraído' },
  crown:     { color:'#FCD34D', label:'Corona' },
  root:      { color:'#A78BFA', label:'Tratamiento'},
}
const UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28]
const LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]

function OdontogramTab() {
  const [states, setStates] = useState<Record<number,string>>({ 38:'root', 16:'caries', 14:'restored' })
  const [selTooth, setSelTooth] = useState<number|null>(null)
  const STATE_KEYS = Object.keys(TOOTH_STATES)

  function Tooth({ n }: { n: number }) {
    const s = states[n] ?? 'healthy'
    const info = TOOTH_STATES[s]
    const isSelected = selTooth === n
    return (
      <button onClick={()=>setSelTooth(n===selTooth?null:n)}
        className={`flex flex-col items-center gap-0.5 p-0.5 rounded transition-all ${isSelected?'ring-2 ring-cyan-500 ring-offset-1':''}`} title={`${n} — ${info.label}`}>
        <span className="text-[9px] text-slate-400">{n}</span>
        <div className="w-5 h-6 rounded border border-slate-300 flex items-center justify-center shadow-sm" style={{backgroundColor: info.color}}>
          {s === 'extracted' && <span className="text-white text-[10px] font-bold">✕</span>}
          {s === 'root' && <span className="text-purple-700 text-[9px] font-bold">RC</span>}
        </div>
      </button>
    )
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>Odontograma digital</p>
        {selTooth && (
          <div className="flex items-center gap-2 bg-cyan-50 border border-cyan-200 rounded-xl px-3 py-2">
            <span className="text-xs font-semibold text-cyan-700">Pieza #{selTooth}</span>
            <div className="flex gap-1">
              {STATE_KEYS.map(s=>(
                <button key={s} onClick={()=>setStates(st=>({...st,[selTooth!]:s}))}
                  className={`w-4 h-4 rounded border transition-all ${states[selTooth!]===s?'border-cyan-500 scale-110':' border-slate-300'}`}
                  style={{backgroundColor:TOOTH_STATES[s].color}} title={TOOTH_STATES[s].label}/>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] text-slate-400 text-center mb-2 font-semibold uppercase tracking-widest">Maxilar superior</p>
            <div className="flex justify-center gap-0.5 flex-wrap">
              {UPPER.map(n=><Tooth key={n} n={n}/>)}
            </div>
          </div>
          <div className="border-t-2 border-b-2 border-dashed border-slate-200 my-2 py-1 text-center">
            <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-widest">Plano oclusal</span>
          </div>
          <div>
            <div className="flex justify-center gap-0.5 flex-wrap">
              {LOWER.map(n=><Tooth key={n} n={n}/>)}
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2 font-semibold uppercase tracking-widest">Mandíbula inferior</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(TOOTH_STATES).map(([k,v])=>(
          <div key={k} className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border border-slate-300" style={{backgroundColor:v.color}}/>
            <span className="text-xs text-slate-500">{v.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Radiografías tab ──────────────────────────────────────────────────────────
function RadiografiaItem({ name, date, onView }: { name: string; date: string; onView: () => void }) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-sm transition-all">
      <div className="w-14 h-14 rounded-xl bg-slate-900 flex items-center justify-center text-white/30 shrink-0">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="12" cy="12" r="4"/>
          <line x1="3" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="21" y2="12"/>
          <line x1="12" y1="3" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="21"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700 truncate">{name}</p>
        <p className="text-xs text-slate-400 mt-0.5">{date}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onView} className="px-3 py-1.5 text-xs font-semibold text-violet-600 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors">
          Ver con IA
        </button>
        <button className="px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-3.5 h-3.5"/>
        </button>
      </div>
    </div>
  )
}

// ── Patient tabs ──────────────────────────────────────────────────────────────
function PatientDetail({ 
  patient, 
  readOnly: propReadOnly,
  onUpdate,
  onArchive,
  onReload,
}: { 
  patient: Patient; 
  readOnly?: boolean;
  onUpdate: (id: string | number, updates: Partial<BackendPatientDto>) => Promise<void>;
  onArchive: (id: string | number) => Promise<void>;
  onReload: (id: string | number) => Promise<void>;
}) {
  const { role } = useAuth()
  const readOnly = propReadOnly ?? (role === 'RECEPCIONISTA')
  const [tab, setTab] = useState<Tab>('resumen')
  const [modal, setModal] = useState<'cita'|'rx'|'detalle'|'editar'|'archivar'|null>(null)
  const allTabs: {id:Tab;label:string}[] = [
    {id:'resumen',label:'Resumen'}, {id:'historia',label:'Historia clínica'},
    {id:'odontograma',label:'Odontograma'}, {id:'radiografias',label:'Radiografías'}, {id:'documentos',label:'Documentos'},
  ]
  // Recepcionista only sees Resumen and Documentos
  const tabs = role === 'RECEPCIONISTA'
    ? allTabs.filter(t => t.id === 'resumen' || t.id === 'documentos')
    : allTabs

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {modal==='cita'&&<ModalAgendarCita patient={patient} onClose={()=>setModal(null)}/>}
      {modal==='rx'&&<ModalRadiografia onClose={()=>setModal(null)}/>}
      {modal==='detalle'&&<ModalDetallePaciente patient={patient} onClose={()=>setModal(null)} onReload={onReload}/>}
      {modal==='editar'&&<ModalActualizarPaciente patient={patient} onClose={()=>setModal(null)} onSave={onUpdate}/>}
      {modal==='archivar'&&<ModalArchivarPaciente patient={patient} onClose={()=>setModal(null)} onConfirm={onArchive}/>}

      {/* Patient header */}
      <div className="bg-white border-b border-slate-100 px-5 py-4 flex items-center gap-4 shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
          {patient.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-800 text-base" style={{fontFamily:'Outfit'}}>{patient.name}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              patient.status==='active' ? 'bg-emerald-100 text-emerald-600' :
              patient.status==='archived' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'
            }`}>
              {patient.status==='active' ? 'Activo' : patient.status==='archived' ? 'Archivado' : 'Inactivo'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{patient.doc} · {calcAge(patient.dob)} años · {patient.city}</p>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={()=>setModal('detalle')}
              title="Consultar ficha completa y auditoría (GET /api/v1/patients/{id})"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 bg-white rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Icon d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" className="w-3.5 h-3.5 text-cyan-600"/>
              Ver detalle
            </button>
            <button
              onClick={()=>setModal('editar')}
              title="Actualizar datos del paciente (PUT /api/v1/patients/{id})"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-cyan-200 text-cyan-700 bg-cyan-50/70 rounded-xl text-xs font-semibold hover:bg-cyan-100/70 transition-colors shadow-sm"
            >
              <Icon d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-3.5 h-3.5 text-cyan-600"/>
              Actualizar
            </button>
            <button
              onClick={()=>setModal('archivar')}
              title="Baja lógica del paciente (PATCH /api/v1/patients/{id}/archive)"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 text-rose-700 bg-rose-50/70 rounded-xl text-xs font-semibold hover:bg-rose-100/70 transition-colors shadow-sm"
            >
              <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-3.5 h-3.5 text-rose-600"/>
              Archivar
            </button>
            <button
              onClick={()=>setModal('cita')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-500 transition-colors shadow-sm"
            >
              <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-3.5 h-3.5"/>
              Agendar cita
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100 px-5 flex gap-1 shrink-0">
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${tab===t.id?'border-cyan-500 text-cyan-700':'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {tab==='resumen' && (
          <div className="h-full overflow-y-auto p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                {l:'Próxima cita', v:fmtDate(patient.nextAppt)||'Sin agendar', c:'#1E8C82', bg:'bg-cyan-50'},
                {l:'Última visita', v:fmtDate(patient.lastVisit), c:'#7C3AED', bg:'bg-violet-50'},
                {l:'Saldo pendiente', v:patient.balance?fmt(patient.balance):'Al día', c:patient.balance?'#D97706':'#059669', bg:patient.balance?'bg-amber-50':'bg-emerald-50'},
              ].map(s=>(
                <div key={s.l} className={`${s.bg} rounded-2xl p-4`}>
                  <p className="text-xs text-slate-500">{s.l}</p>
                  <p className="font-bold text-sm mt-1" style={{color:s.c,fontFamily:'Outfit'}}>{s.v}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4" style={{fontFamily:'Outfit'}}>Datos personales</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[['Fecha nac.',fmtDate(patient.dob)],['Edad',`${calcAge(patient.dob)} años`],['Teléfono',patient.phone],['Email',patient.email],['Grupo sanguíneo',patient.blood],['EPS / Seguro',patient.eps]].map(([l,v])=>(
                  <div key={l}><span className="text-slate-400 text-xs">{l}</span><p className="font-medium text-slate-700 text-sm">{v}</p></div>
                ))}
              </div>
            </div>
            {patient.allergy && patient.allergy !== 'Ninguna' && (
              <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4">
                <span className="text-lg">⚠</span>
                <div><p className="text-xs font-bold text-rose-700">Alergia registrada</p><p className="text-sm text-rose-700 mt-0.5">{patient.allergy}</p></div>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2" style={{fontFamily:'Outfit'}}>Antecedentes médicos</p>
              <p className="text-sm text-slate-700">{patient.antecedentes || 'Sin antecedentes registrados.'}</p>
            </div>
          </div>
        )}
        {tab==='historia' && <HistoriaClinica initialPatientId={patient.id}/>}
        {tab==='odontograma' && <OdontogramTab/>}
        {tab==='radiografias' && (
          <div className="h-full overflow-y-auto p-5 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>Imágenes diagnósticas</p>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-xl" style={{backgroundColor:'#1E8C82'}}>
                <Icon d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-3.5 h-3.5"/>
                Subir imagen
              </button>
            </div>
            {['Rx Panorámica — Ene 2026','Rx Periapical #38 — Ago 2026','Rx Bitewing cuad. III-IV — Jun 2025'].map(n=>(
              <RadiografiaItem key={n} name={n} date="23/08/2026" onView={()=>setModal('rx')}/>
            ))}
          </div>
        )}
        {tab==='documentos' && (
          <div className="h-full overflow-y-auto p-5 space-y-3">
            <p className="font-bold text-slate-800 mb-2" style={{fontFamily:'Outfit'}}>Documentos del paciente</p>
            {['Consentimiento informado — Ortodoncia','Presupuesto ortodoncia v2','Consentimiento — Extracción #38','Presupuesto extracción + cuotas'].map(d=>(
              <div key={d} className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 px-4 py-3 hover:shadow-sm transition-all">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-xs font-bold text-rose-600 shrink-0">PDF</div>
                <p className="flex-1 text-sm font-medium text-slate-700">{d}</p>
                <button className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-1">
                  <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-3.5 h-3.5"/>
                  Descargar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PacientePerfil({ readOnly: propReadOnly }: { readOnly?: boolean } = {}) {
  const { role } = useAuth()
  const readOnly = propReadOnly ?? (role === 'RECEPCIONISTA')
  const [patients, setPatients] = useState<Patient[]>([])
  const [selId, setSelId] = useState<number | string>('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all'|'active'|'inactive'>('all')
  const [showNewModal, setShowNewModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [dbConnected, setDbConnected] = useState<boolean | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function loadDbPatients() {
      try {
        const dbData = await fetchPatientsFromApi()
        if (!isMounted) return
        setDbConnected(true)
        if (dbData && dbData.length > 0) {
          const mapped: Patient[] = dbData.map(d => ({
            id: d.id || `db-${d.numeroDocumento}`,
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
            status: (d.estado === 'INACTIVO' ? 'inactive' : d.estado === 'ARCHIVADO' ? 'archived' : 'active') as 'active'|'inactive'|'archived',
            nextAppt: '',
            lastVisit: d.fechaCreacion ? d.fechaCreacion.substring(0, 10) : '2026-09-26',
            balance: 0,
            isRealDb: true,
            clinicaId: d.clinicaId,
            fechaCreacion: d.fechaCreacion,
            fechaActualizacion: d.fechaActualizacion,
          }))

          setPatients(mapped)
          setSelId(mapped[0].id)
        } else {
          setPatients([])
        }
      } catch (err) {
        if (!isMounted) return
        console.warn('Backend PostgreSQL no accesible o desconectado:', err)
        setDbConnected(false)
      }
    }
    loadDbPatients()
    return () => { isMounted = false }
  }, [])

  const visible = patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.doc.includes(search)
    const matchFilter = filter==='all' 
      ? true 
      : filter==='active' 
        ? p.status==='active' 
        : (p.status==='inactive' || p.status==='archived')
    return matchSearch && matchFilter
  })

  const sel = patients.find(p=>p.id===selId) || patients[0]

  async function addPatient(data: NewPatientFormData) {
    setIsSaving(true)
    try {
      const created = await createPatientInApi({
        nombres: data.nombres.trim(),
        apellidos: data.apellidos.trim(),
        tipoDocumento: data.tipoDocumento,
        numeroDocumento: data.numeroDocumento.trim(),
        fechaNacimiento: data.fechaNacimiento || undefined,
        telefono: data.telefono?.trim() || undefined,
        correo: data.correo?.trim() || undefined,
        ciudad: data.ciudad,
        tipoSangre: data.tipoSangre,
        tipo_sangre: data.tipoSangre,
        seguro: data.seguro,
        alergias: data.alergias?.trim() || 'Ninguna',
        antecedentesMedicos: data.antecedentesMedicos?.trim() || undefined,
        estado: 'ACTIVO',
      })

      const np: Patient = {
        id: created.id || Date.now(),
        name: `${created.nombres} ${created.apellidos || ''}`.trim(),
        nombres: created.nombres,
        apellidos: created.apellidos,
        tipoDocumento: created.tipoDocumento || data.tipoDocumento,
        doc: created.numeroDocumento || data.numeroDocumento,
        dob: created.fechaNacimiento || data.fechaNacimiento,
        phone: created.telefono || data.telefono || 'Sin teléfono',
        email: created.correo || data.correo || '',
        blood: (created.tipoSangre || data.tipoSangre) as Patient['blood'],
        eps: created.seguro || data.seguro || 'PARTICULAR',
        allergy: created.alergias || data.alergias || 'Ninguna',
        antecedentes: created.antecedentesMedicos || data.antecedentesMedicos || '',
        medicamentos: created.medicamentos || 'Ninguno registrado',
        city: created.ciudad || data.ciudad || 'Lima',
        status: 'active',
        nextAppt: '',
        lastVisit: new Date().toISOString().substring(0, 10),
        balance: 0,
        isRealDb: true,
        clinicaId: created.clinicaId,
        fechaCreacion: created.fechaCreacion,
        fechaActualizacion: created.fechaActualizacion,
      }

      setPatients(ps => [np, ...ps])
      setSelId(np.id)
      setDbConnected(true)
      setToastMessage(`✓ Paciente registrado en PostgreSQL (ID: ${String(created.id).substring(0, 8)}...)`)
      setTimeout(() => setToastMessage(null), 4000)
      setShowNewModal(false)
    } catch (err: any) {
      console.error('Error al persistir en backend:', err)
      // Si el backend arrojó error de validación (HTTP 400 o con errors mapeados), relanzar para que el modal muestre los campos en rojo y no se cierre
      if (err.status === 400 || err.response?.status === 400 || err.errors) {
        const errorMsg = err.message || err.response?.data?.message || 'Error de validación en los campos'
        setToastMessage(`⚠ HTTP 400: ${errorMsg}`)
        setTimeout(() => setToastMessage(null), 6000)
        throw err
      }

      // Si es otro error (ej. sin conexión a la base de datos), guardar como respaldo local
      const np: Patient = {
        id: Date.now(),
        name: `${data.nombres} ${data.apellidos}`.trim(),
        nombres: data.nombres,
        apellidos: data.apellidos,
        tipoDocumento: data.tipoDocumento,
        doc: data.numeroDocumento,
        dob: data.fechaNacimiento,
        phone: data.telefono || 'Sin teléfono',
        email: data.correo || '',
        blood: data.tipoSangre as Patient['blood'],
        eps: data.seguro || 'PARTICULAR',
        allergy: data.alergias || 'Ninguna',
        antecedentes: data.antecedentesMedicos || '',
        city: data.ciudad || 'Lima',
        status: 'active',
        nextAppt: '',
        lastVisit: '',
        balance: 0,
      }
      setPatients(ps => [np, ...ps])
      setSelId(np.id)
      setShowNewModal(false)
      setToastMessage(`⚠ Guardado localmente (Backend offline: ${err.message || 'Sin conexión'})`)
      setTimeout(() => setToastMessage(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdatePatient(id: string | number, updates: Partial<BackendPatientDto>) {
    try {
      const isUuid = typeof id === 'string' && id.includes('-')
      if (isUuid) {
        const updated = await updatePatientInApi(String(id), updates)
        setPatients(prev => prev.map(p => {
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
            status: (updated.estado === 'INACTIVO' ? 'inactive' : updated.estado === 'ARCHIVADO' ? 'archived' : 'active') as any,
            fechaActualizacion: updated.fechaActualizacion || new Date().toISOString(),
          }
        }))
        setToastMessage(`✓ Paciente actualizado exitosamente en PostgreSQL (PUT)`)
      } else {
        setPatients(prev => prev.map(p => {
          if (p.id !== id) return p
          return {
            ...p,
            name: `${updates.nombres || ''} ${updates.apellidos || ''}`.trim() || p.name,
            phone: updates.telefono || p.phone,
            email: updates.correo || p.email,
            dob: updates.fechaNacimiento || p.dob,
            allergy: updates.alergias || p.allergy,
            antecedentes: updates.antecedentesMedicos || p.antecedentes,
            medicamentos: updates.medicamentos || p.medicamentos,
            fechaActualizacion: new Date().toISOString(),
          }
        }))
        setToastMessage(`✓ Paciente actualizado localmente`)
      }
      setTimeout(() => setToastMessage(null), 4000)
    } catch (err: any) {
      console.error(err)
      setToastMessage(`Error al actualizar: ${err.message}`)
      setTimeout(() => setToastMessage(null), 5000)
      throw err
    }
  }

  async function handleArchivePatient(id: string | number) {
    try {
      const isUuid = typeof id === 'string' && id.includes('-')
      if (isUuid) {
        const archived = await archivePatientInApi(String(id))
        setPatients(prev => prev.map(p => {
          if (p.id !== id) return p
          return {
            ...p,
            status: 'archived',
            fechaActualizacion: archived.fechaActualizacion || new Date().toISOString(),
          }
        }))
        setToastMessage(`✓ Paciente archivado en PostgreSQL (Baja lógica: ARCHIVADO)`)
      } else {
        setPatients(prev => prev.map(p => p.id === id ? { ...p, status: 'archived' } : p))
        setToastMessage(`✓ Paciente archivado`)
      }
      setTimeout(() => setToastMessage(null), 4000)
    } catch (err: any) {
      console.error(err)
      setToastMessage(`Error al archivar: ${err.message}`)
      setTimeout(() => setToastMessage(null), 5000)
      throw err
    }
  }

  async function handleReloadPatient(id: string | number) {
    try {
      const isUuid = typeof id === 'string' && id.includes('-')
      if (isUuid) {
        const fresh = await fetchPatientById(String(id))
        setPatients(prev => prev.map(p => {
          if (p.id !== id) return p
          return {
            ...p,
            name: `${fresh.nombres} ${fresh.apellidos || ''}`.trim(),
            nombres: fresh.nombres,
            apellidos: fresh.apellidos,
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
        }))
        setToastMessage(`✓ Datos frescos recargados desde PostgreSQL (GET /${String(id).substring(0, 8)}...)`)
      } else {
        setToastMessage(`✓ Datos del paciente verificados`)
      }
      setTimeout(() => setToastMessage(null), 3000)
    } catch (err: any) {
      console.error(err)
      setToastMessage(`Error al consultar detalle: ${err.message}`)
      setTimeout(() => setToastMessage(null), 4000)
      throw err
    }
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

      {showNewModal && <ModalNuevoPaciente onSave={addPatient} onClose={()=>setShowNewModal(false)} isSaving={isSaving}/>}

      {/* Patient sidebar */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-slate-200 bg-white">
        {/* Status header */}
        <div className="px-3 pt-2.5 pb-1 flex items-center justify-between border-b border-slate-50">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Base de Datos</span>
          {dbConnected === true ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              PostgreSQL Conectado
            </span>
          ) : dbConnected === false ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Modo Local
            </span>
          ) : (
            <span className="text-[10px] text-slate-400">Conectando...</span>
          )}
        </div>

        <div className="p-3 border-b border-slate-100 space-y-2">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar paciente..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
          </div>
          <div className="flex gap-1">
            {([['all','Todos'],['active','Activos'],['inactive','Inactivos']] as const).map(([v,l])=>(
              <button key={v} onClick={()=>setFilter(v)}
                className={`flex-1 py-1 text-[10px] font-semibold rounded-lg transition-all ${filter===v?'bg-cyan-600 text-white':'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {!readOnly && (
          <button onClick={()=>setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 text-xs font-semibold text-cyan-600 hover:bg-cyan-50 transition-colors">
            <Icon d="M12 4v16m8-8H4" className="w-3.5 h-3.5"/>
            + Nuevo paciente
          </button>
        )}

        <div className="flex-1 overflow-y-auto">
          {visible.map(p=>(
            <button key={p.id} onClick={()=>setSelId(p.id)}
              className={`w-full text-left px-4 py-3 border-b border-slate-50 transition-all flex items-center gap-2.5 ${selId===p.id?'bg-cyan-50 border-l-2 border-l-cyan-500':'hover:bg-slate-50'}`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-700 flex items-center justify-center text-white text-xs font-bold shrink-0 relative">
                {p.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                {p.isRealDb && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full" title="Guardado en PostgreSQL"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className={`text-xs font-semibold truncate ${selId===p.id?'text-cyan-700':'text-slate-700'}`}>{p.name}</p>
                  {p.isRealDb && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1 rounded shrink-0">DB</span>
                  )}
                  {p.status === 'archived' && (
                    <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1 rounded shrink-0">Archivado</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate">{calcAge(p.dob)} años · {p.city}</p>
              </div>
              {p.balance>0 && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0"/>}
            </button>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-slate-100">
          <p className="text-[10px] text-slate-400">{visible.length} de {patients.length} pacientes</p>
        </div>
      </aside>

      {/* Patient detail */}
      {sel && (
        <PatientDetail 
          patient={sel} 
          readOnly={readOnly}
          onUpdate={handleUpdatePatient}
          onArchive={handleArchivePatient}
          onReload={handleReloadPatient}
        />
      )}
    </div>
  )
}
