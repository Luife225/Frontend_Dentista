import { useState, useEffect } from 'react'
import { fetchPatientsFromApi, createPatientInApi, BackendPatientDto } from '../services/patientService'

interface PatientItem {
  id: string | number
  name: string
  age: number
  phone: string
  email: string | null
  lastVisit: string
  nextVisit: string | null
  tags: string[]
  status: 'active' | 'inactive'
  doc?: string
  isRealDb?: boolean
}

const INITIAL_PATIENTS: PatientItem[] = [
  { id: 1, name: 'María González', age: 34, phone: '310 234 5678', email: 'maria.g@gmail.com', lastVisit: '2026-07-14', nextVisit: '2026-08-10', tags: ['ortodoncia', 'hipertensión'], status: 'active' },
  { id: 2, name: 'Carlos Rivas', age: 52, phone: '315 987 6543', email: 'c.rivas@hotmail.com', lastVisit: '2026-08-01', nextVisit: '2026-08-08', tags: ['diabético', 'cirugía'], status: 'active' },
  { id: 3, name: 'Sofía Mendez', age: 28, phone: '300 112 2334', email: 'sofiamendez@gmail.com', lastVisit: '2026-06-20', nextVisit: '2026-08-10', tags: ['embarazada'], status: 'active' },
  { id: 4, name: 'Andrés Torres', age: 41, phone: '320 445 6677', email: 'atorres@empresa.co', lastVisit: '2026-07-30', nextVisit: null, tags: [], status: 'active' },
  { id: 5, name: 'Lucía Reyes', age: 16, phone: '312 333 4455', email: null, lastVisit: '2026-07-22', nextVisit: '2026-08-14', tags: ['ortodoncia', 'menor'], status: 'active' },
  { id: 6, name: 'Javier Molina', age: 67, phone: '318 667 8890', email: 'jmolina@gmail.com', lastVisit: '2026-05-11', nextVisit: '2026-08-08', tags: ['anticoagulante', 'mayor'], status: 'active' },
  { id: 7, name: 'Valentina Cruz', age: 23, phone: '301 556 9900', email: 'vcruz@uni.edu.co', lastVisit: '2026-07-18', nextVisit: '2026-08-16', tags: [], status: 'inactive' },
  { id: 8, name: 'Roberto Patiño', age: 45, phone: '317 223 4411', email: 'rpati@yahoo.com', lastVisit: '2025-12-05', nextVisit: null, tags: ['alérgico penicilina'], status: 'inactive' },
]

const tagColors: Record<string, string> = {
  'ortodoncia': 'bg-violet-100 text-violet-700',
  'hipertensión': 'bg-rose-100 text-rose-700',
  'diabético': 'bg-amber-100 text-amber-700',
  'cirugía': 'bg-orange-100 text-orange-700',
  'embarazada': 'bg-pink-100 text-pink-700',
  'anticoagulante': 'bg-red-100 text-red-700',
  'menor': 'bg-sky-100 text-sky-700',
  'mayor': 'bg-slate-100 text-slate-600',
  'alérgico penicilina': 'bg-red-100 text-red-700',
}

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
    maxDob: `${y - 5}-${m}-${d}`,
    minDob: `${y - 100}-${m}-${d}`,
  }
}

export default function Patients() {
  const [patients, setPatients] = useState<PatientItem[]>(INITIAL_PATIENTS)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<PatientItem | null>(null)
  const [filter, setFilter] = useState<'all'|'active'|'inactive'>('all')
  const [showModal, setShowModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [dbConnected, setDbConnected] = useState<boolean | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Form inputs
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    tipoDocumento: 'DNI' as 'DNI' | 'CE' | 'PASAPORTE' | 'CC',
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)

  const { minDob, maxDob } = getDobLimits()
  const currentDocRule = DOC_CONFIG[form.tipoDocumento] || DOC_CONFIG.DNI

  const handleTipoDocChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextType = e.target.value as 'DNI' | 'CE' | 'PASAPORTE' | 'CC'
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

  useEffect(() => {
    let isMounted = true
    async function loadPatients() {
      try {
        const dbData = await fetchPatientsFromApi()
        if (!isMounted) return
        setDbConnected(true)
        if (dbData && dbData.length > 0) {
          const mapped: PatientItem[] = dbData.map(d => ({
            id: d.id || `db-${d.numeroDocumento}`,
            name: `${d.nombres} ${d.apellidos || ''}`.trim(),
            age: d.fechaNacimiento ? Math.floor((Date.now() - new Date(d.fechaNacimiento).getTime()) / 31557600000) : 30,
            phone: d.telefono || 'Sin teléfono',
            email: d.correo || null,
            lastVisit: d.fechaCreacion ? d.fechaCreacion.substring(0, 10) : '2026-09-26',
            nextVisit: null,
            tags: d.alergias && d.alergias !== 'Ninguna' ? [d.alergias] : [],
            status: (d.estado === 'INACTIVO' ? 'inactive' : 'active') as 'active' | 'inactive',
            doc: d.numeroDocumento,
            isRealDb: true,
          }))

          setPatients(prev => {
            const existingIds = new Set(mapped.map(m => m.id))
            const remaining = prev.filter(p => !existingIds.has(p.id))
            return [...mapped, ...remaining]
          })
        }
      } catch (err) {
        if (!isMounted) return
        setDbConnected(false)
      }
    }
    loadPatients()
    return () => { isMounted = false }
  }, [])

  const filtered = patients.filter(p =>
    (filter === 'all' || p.status === filter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) ||
     p.phone.includes(search) ||
     p.tags.some(t => t.includes(search.toLowerCase())))
  )

  async function handleRegister(e: React.FormEvent) {
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
          errors.fechaNacimiento = 'El paciente debe tener al menos 5 años de edad cumplidos.'
        } else if (age > 100) {
          errors.fechaNacimiento = 'El paciente no puede exceder los 100 años de edad.'
        }
      }
    }

    if (form.telefono && form.telefono.trim()) {
      if (!/^[+]?[0-9\s\-]{8,25}$/.test(form.telefono.trim())) {
        errors.telefono = 'Formato de teléfono no válido (ej: +51 987654321)'
      }
    }

    if (form.correo && form.correo.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) {
        errors.correo = 'Formato de correo no válido'
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setIsSaving(true)
    try {
      const created = await createPatientInApi({
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        tipoDocumento: form.tipoDocumento,
        numeroDocumento: form.numeroDocumento.trim(),
        fechaNacimiento: form.fechaNacimiento,
        telefono: form.telefono.trim() || undefined,
        correo: form.correo.trim() || undefined,
        ciudad: form.ciudad,
        tipoSangre: form.tipoSangre,
        tipo_sangre: form.tipoSangre,
        seguro: form.seguro,
        alergias: form.alergias.trim() || 'Ninguna',
        antecedentesMedicos: form.antecedentesMedicos.trim() || undefined,
        estado: 'ACTIVO',
      })

      const newItem: PatientItem = {
        id: created.id || Date.now(),
        name: `${created.nombres} ${created.apellidos || ''}`.trim(),
        age: created.fechaNacimiento ? Math.floor((Date.now() - new Date(created.fechaNacimiento).getTime()) / 31557600000) : 30,
        phone: created.telefono || 'Sin teléfono',
        email: created.correo || null,
        lastVisit: new Date().toISOString().substring(0, 10),
        nextVisit: null,
        tags: created.alergias && created.alergias !== 'Ninguna' ? [created.alergias] : [],
        status: 'active',
        doc: created.numeroDocumento,
        isRealDb: true,
      }

      setPatients(prev => [newItem, ...prev])
      setSelected(newItem)
      setShowModal(false)
      setForm({
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
      setToastMessage(`✓ Paciente guardado en PostgreSQL (ID: ${String(created.id).substring(0, 8)}...)`)
      setTimeout(() => setToastMessage(null), 4000)
    } catch (err: any) {
      console.error(err)
      const backendErrors = err.errors || err.response?.data?.errors
      const msg = err.message || err.response?.data?.message || 'Error al registrar paciente (HTTP 400)'
      if (backendErrors && typeof backendErrors === 'object' && Object.keys(backendErrors).length > 0) {
        setFieldErrors(backendErrors)
      }
      setApiError(msg)
      setToastMessage(`⚠ ${msg}`)
      setTimeout(() => setToastMessage(null), 6000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex h-full fade-in relative">
      {/* Toast */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs flex items-center gap-2 border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div>
                <h2 className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>+ Nuevo Paciente</h2>
                <p className="text-xs text-emerald-600 font-medium">Sincronizado con Spring Boot / PostgreSQL</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleRegister} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* API 400 Error banner */}
              {apiError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-700">
                  <span className="text-rose-500 font-bold">⚠</span>
                  <div>
                    <p className="font-semibold text-rose-800">Error HTTP 400 del Backend</p>
                    <p className="mt-0.5">{apiError}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* 1. Nombres */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Nombres <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    value={form.nombres}
                    onChange={e => {
                      setForm(f => ({ ...f, nombres: e.target.value }))
                      setFieldErrors(fe => ({ ...fe, nombres: '' }))
                    }}
                    className={`w-full px-3 py-2 border rounded-xl text-sm ${
                      fieldErrors.nombres ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                    placeholder="Ej: Juan Carlos"
                  />
                  {fieldErrors.nombres && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">⚠ {fieldErrors.nombres}</p>
                  )}
                </div>

                {/* 2. Apellidos */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Apellidos <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    value={form.apellidos}
                    onChange={e => {
                      setForm(f => ({ ...f, apellidos: e.target.value }))
                      setFieldErrors(fe => ({ ...fe, apellidos: '' }))
                    }}
                    className={`w-full px-3 py-2 border rounded-xl text-sm ${
                      fieldErrors.apellidos ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                    placeholder="Ej: Pérez Morales"
                  />
                  {fieldErrors.apellidos && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">⚠ {fieldErrors.apellidos}</p>
                  )}
                </div>

                {/* 3. Tipo de Documento */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Tipo de documento <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.tipoDocumento}
                    onChange={handleTipoDocChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
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
                    <label className="text-xs font-semibold text-slate-600">
                      N° Documento <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {form.numeroDocumento.length}/{currentDocRule.maxLen}
                    </span>
                  </div>
                  <input
                    required
                    value={form.numeroDocumento}
                    onChange={handleNumeroDocChange}
                    onKeyDown={handleDocKeyDown}
                    maxLength={currentDocRule.maxLen}
                    className={`w-full px-3 py-2 border rounded-xl text-sm ${
                      fieldErrors.numeroDocumento ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                    placeholder={currentDocRule.placeholder}
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">{currentDocRule.helper}</p>
                  {fieldErrors.numeroDocumento && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">⚠ {fieldErrors.numeroDocumento}</p>
                  )}
                </div>

                {/* 5. Fecha de Nacimiento */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Fecha de nacimiento <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={minDob}
                    max={maxDob}
                    value={form.fechaNacimiento}
                    onChange={e => {
                      setForm(f => ({ ...f, fechaNacimiento: e.target.value }))
                      setFieldErrors(fe => ({ ...fe, fechaNacimiento: '' }))
                    }}
                    className={`w-full px-3 py-2 border rounded-xl text-sm ${
                      fieldErrors.fechaNacimiento ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Rango permitido: 5 a 100 años</p>
                  {fieldErrors.fechaNacimiento && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">⚠ {fieldErrors.fechaNacimiento}</p>
                  )}
                </div>

                {/* 6. Teléfono */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Teléfono</label>
                  <input
                    value={form.telefono}
                    onChange={e => {
                      setForm(f => ({ ...f, telefono: e.target.value }))
                      setFieldErrors(fe => ({ ...fe, telefono: '' }))
                    }}
                    className={`w-full px-3 py-2 border rounded-xl text-sm ${
                      fieldErrors.telefono ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                    placeholder="Ej: +51 987654321"
                  />
                  {fieldErrors.telefono && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">⚠ {fieldErrors.telefono}</p>
                  )}
                </div>

                {/* 7. Correo */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    value={form.correo}
                    onChange={e => {
                      setForm(f => ({ ...f, correo: e.target.value }))
                      setFieldErrors(fe => ({ ...fe, correo: '' }))
                    }}
                    className={`w-full px-3 py-2 border rounded-xl text-sm ${
                      fieldErrors.correo ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                    placeholder="paciente@correo.com"
                  />
                  {fieldErrors.correo && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">⚠ {fieldErrors.correo}</p>
                  )}
                </div>

                {/* 8. Ciudad */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Ciudad</label>
                  <select
                    value={form.ciudad}
                    onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                  >
                    {CITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* 9. Tipo de Sangre */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Tipo de sangre</label>
                  <select
                    value={form.tipoSangre}
                    onChange={e => setForm(f => ({ ...f, tipoSangre: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white font-mono"
                  >
                    {BLOOD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                {/* 10. Seguro de Salud */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Seguro de salud</label>
                  <select
                    value={form.seguro}
                    onChange={e => setForm(f => ({ ...f, seguro: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                  >
                    {INSURANCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* 11. Alergias */}
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Alergias</label>
                  <input
                    value={form.alergias}
                    onChange={e => setForm(f => ({ ...f, alergias: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    placeholder="Ninguna o alergia conocida"
                  />
                </div>

                {/* 12. Antecedentes médicos */}
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Antecedentes médicos</label>
                  <textarea
                    rows={2}
                    value={form.antecedentesMedicos}
                    onChange={e => setForm(f => ({ ...f, antecedentesMedicos: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none"
                    placeholder="Condiciones médicas..."
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  disabled={isSaving}
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : 'Registrar en PostgreSQL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      <div className={`${selected ? 'w-1/2' : 'w-full'} flex flex-col h-full transition-all duration-200`}>
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Pacientes</h1>
              {dbConnected && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  PostgreSQL 🐘
                </span>
              )}
            </div>
            <button onClick={() => setShowModal(true)} className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors">
              + Nuevo paciente
            </button>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50 bg-white"
                placeholder="Buscar por nombre, teléfono o etiqueta..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex border border-slate-200 rounded-lg overflow-hidden text-sm">
              {(['all','active','inactive'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-2 font-medium transition-colors ${filter === f ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                  {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-2 pb-6">
          {filtered.map(p => (
            <div key={p.id}
              onClick={() => setSelected(selected?.id === p.id ? null : p)}
              className={`bg-white rounded-xl border transition-all cursor-pointer hover:shadow-sm ${selected?.id === p.id ? 'border-cyan-400 shadow-sm' : 'border-slate-100'}`}>
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white font-semibold text-sm shrink-0 relative" style={{fontFamily:'Outfit'}}>
                  {p.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                  {p.isRealDb && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border border-white rounded-full" title="PostgreSQL"/>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-800 text-sm">{p.name}</p>
                    {p.isRealDb && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.2 rounded">BD</span>
                    )}
                    <span className="text-xs text-slate-400">{p.age} años</span>
                    {p.status === 'inactive' && <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Inactivo</span>}
                  </div>
                  <p className="text-xs text-slate-400">{p.phone} {p.email ? `· ${p.email}` : ''}</p>
                  {p.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {p.tags.map(t => (
                        <span key={t} className={`text-xs px-1.5 py-0.5 rounded font-medium ${tagColors[t] || 'bg-slate-100 text-slate-600'}`}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400">Última visita</p>
                  <p className="text-xs font-mono text-slate-600">{p.lastVisit}</p>
                  {p.nextVisit && (
                    <>
                      <p className="text-xs text-slate-400 mt-1">Próxima</p>
                      <p className="text-xs font-mono text-cyan-600 font-medium">{p.nextVisit}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <p className="text-4xl mb-3">🦷</p>
              <p className="font-medium">Sin resultados</p>
              <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-1/2 border-l border-slate-200 bg-white flex flex-col h-full overflow-y-auto slide-up">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-xl font-bold" style={{fontFamily:'Outfit'}}>
                  {selected.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>{selected.name}</h2>
                  <p className="text-sm text-slate-500">{selected.age} años · {selected.phone}</p>
                  <div className="flex gap-1 mt-1">
                    {selected.tags.map(t => (
                      <span key={t} className={`text-xs px-1.5 py-0.5 rounded font-medium ${tagColors[t] || 'bg-slate-100 text-slate-600'}`}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 py-2 text-sm font-medium bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">Historia clínica</button>
              <button className="flex-1 py-2 text-sm font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">Nueva cita</button>
              <button className="flex-1 py-2 text-sm font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">Odontograma</button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Medical history summary */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3" style={{fontFamily:'Outfit'}}>Antecedentes médicos</h3>
              <div className="space-y-2">
                {[
                  ['Medicamentos actuales', selected.tags.includes('anticoagulante') ? 'Warfarina 5mg/día' : selected.tags.includes('diabético') ? 'Metformina 850mg' : 'Ninguno'],
                  ['Alergias', selected.tags.includes('alérgico penicilina') ? 'Penicilina — reacción severa' : 'Sin alergias conocidas'],
                  ['Enfermedades sistémicas', selected.tags.includes('hipertensión') ? 'Hipertensión arterial' : selected.tags.includes('diabético') ? 'Diabetes Mellitus tipo 2' : 'Ninguna'],
                  ['Grupo sanguíneo', 'O+'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-sm py-2 border-b border-slate-50">
                    <span className="text-slate-500">{label}</span>
                    <span className={`font-medium ${val.includes('severa') || val.includes('Warfarina') ? 'text-red-600' : 'text-slate-700'}`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visit history */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3" style={{fontFamily:'Outfit'}}>Historial de visitas</h3>
              <div className="space-y-2">
                {[
                  { date: selected.lastVisit, proc: 'Control periódico', dr: 'Dr. Herrera', amount: '$85.000' },
                  { date: '2026-05-22', proc: 'Resina composit #12', dr: 'Dr. Herrera', amount: '$180.000' },
                  { date: '2026-02-14', proc: 'Limpieza ultrasónica', dr: 'Dra. Suárez', amount: '$95.000' },
                ].map((v, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-400 w-24">{v.date}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{v.proc}</p>
                        <p className="text-xs text-slate-400">{v.dr}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-600">{v.amount}</span>
                      <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
