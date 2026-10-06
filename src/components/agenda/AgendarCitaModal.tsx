import { useState, useEffect, useMemo } from 'react'
import { fetchPatientsFromApi, BackendPatientDto } from '../../services/patientService'
import { fetchUsersFromApi, UserItem } from '../../services/authService'
import { createAppointment } from '../../services/appointmentService'
import { Appointment, CreateAppointmentPayload } from '../../types/appointment'
import {
  CONSULTORIOS,
  getMinDateString,
  getMaxDateString,
  getAvailableSlots,
  calculateEndTime,
  validateAppointmentSchedule,
  CONFLICT_MESSAGE,
} from '../../utils/appointmentRules'

interface AgendarCitaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (cita: Appointment) => void
  initialDate?: string
  initialTime?: string
  initialDoctorId?: string
}

const MOTIVOS_FRECUENTES = [
  'Limpieza dental profiláctica',
  'Evaluación inicial / Diagnóstico',
  'Ajuste de ortodoncia',
  'Dolor agudo / Urgencia',
  'Extracción dental',
  'Tratamiento de endodoncia',
  'Control postoperatorio',
]

export default function AgendarCitaModal({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  initialTime,
  initialDoctorId,
}: AgendarCitaModalProps) {
  const minDate = useMemo(() => getMinDateString(), [])
  const maxDate = useMemo(() => getMaxDateString(), [])

  // Inicializar fecha garantizando que no sea pasada
  const [fecha, setFecha] = useState(() => {
    if (initialDate && initialDate >= getMinDateString()) {
      return initialDate
    }
    return getMinDateString()
  })

  // Obtener slots dinámicos según el día seleccionado
  const slotData = useMemo(() => getAvailableSlots(fecha), [fecha])
  const { slots, isSunday, isSaturday, allPassed, closingTime } = slotData

  // Hora de inicio y fin
  const [horaInicio, setHoraInicio] = useState(() => {
    if (initialTime) return initialTime
    const firstValid = slots.find(s => !s.isPast)
    return firstValid ? firstValid.time : '08:00'
  })

  const [horaFin, setHoraFin] = useState(() => calculateEndTime(horaInicio, 45) || '08:45')

  // Form State
  const [pacienteId, setPacienteId] = useState('')
  const [odontologoId, setOdontologoId] = useState(initialDoctorId || '')
  const [consultorio, setConsultorio] = useState<string>(CONSULTORIOS[0])
  const [modalidad, setModalidad] = useState<'PRESENCIAL' | 'VIRTUAL'>('PRESENCIAL')
  const [motivo, setMotivo] = useState('')

  // Data Loading State
  const [patients, setPatients] = useState<BackendPatientDto[]>([])
  const [doctors, setDoctors] = useState<UserItem[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Feedback State
  const [conflictError, setConflictError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [patientSearch, setPatientSearch] = useState('')

  // Sincronizar fecha y hora inicial si se proporcionan al abrir
  useEffect(() => {
    if (initialDate) {
      const validDate = initialDate < getMinDateString() ? getMinDateString() : initialDate
      setFecha(validDate)
    }
  }, [initialDate])

  // Ajustar hora inicio cuando cambia la fecha o se recalculan los slots
  useEffect(() => {
    if (isSunday) {
      setHoraInicio('')
      setHoraFin('')
      return
    }

    // Si la hora actual ya no es válida o ya pasó en el día de hoy, elegir el primer slot disponible
    const currentSlot = slots.find(s => s.time === horaInicio)
    if (!currentSlot || currentSlot.isPast) {
      const firstValid = slots.find(s => !s.isPast)
      if (firstValid) {
        setHoraInicio(firstValid.time)
        setHoraFin(calculateEndTime(firstValid.time, 45))
      } else {
        setHoraInicio('')
        setHoraFin('')
      }
    } else {
      setHoraFin(calculateEndTime(horaInicio, 45))
    }
  }, [fecha, slots, isSunday])

  // Cargar pacientes y doctores al abrir
  useEffect(() => {
    if (!isOpen) return
    let active = true

    async function loadData() {
      setLoadingData(true)
      setConflictError(null)
      setApiError(null)

      try {
        const [patientsData, usersData] = await Promise.all([
          fetchPatientsFromApi().catch(() => []),
          fetchUsersFromApi().catch(() => []),
        ])

        if (!active) return

        setPatients(patientsData || [])
        if (patientsData && patientsData.length > 0 && !pacienteId) {
          setPacienteId(String(patientsData[0].id))
        }

        // Filtrar usuarios con rol ODONTOLOGO
        const odontologos = usersData.filter(u => u.rol === 'ODONTOLOGO')
        setDoctors(odontologos)

        // Asignar doctor por defecto
        if (odontologos.length > 0) {
          const selectedDoc = initialDoctorId
            ? odontologos.find(d => (d.usuarioClinicaId || d.id) === initialDoctorId)
            : odontologos[0]

          const docVal = selectedDoc
            ? (selectedDoc.usuarioClinicaId || selectedDoc.id)
            : (odontologos[0].usuarioClinicaId || odontologos[0].id)

          setOdontologoId(docVal)
        }
      } catch (err: any) {
        if (!active) return
        setApiError(err.message || 'No se pudieron cargar los datos de pacientes y odontólogos')
      } finally {
        if (active) setLoadingData(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [isOpen, initialDoctorId])

  // Manejo de cambio de hora de inicio
  const handleHoraInicioChange = (nuevaHora: string) => {
    setHoraInicio(nuevaHora)
    setConflictError(null)
    setApiError(null)
    const finCalculado = calculateEndTime(nuevaHora, 45)
    setHoraFin(finCalculado)
  }

  // Filtrado de pacientes para búsqueda rápida
  const filteredPatients = patients.filter(p => {
    if (!patientSearch.trim()) return true
    const term = patientSearch.toLowerCase()
    const fullName = `${p.nombres} ${p.apellidos || ''}`.toLowerCase()
    const doc = (p.numeroDocumento || '').toLowerCase()
    return fullName.includes(term) || doc.includes(term)
  })

  // Submit Handler con manejo estricto de 400 y 409
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setConflictError(null)
    setApiError(null)

    if (!pacienteId) {
      setApiError('Por favor selecciona un paciente.')
      return
    }

    if (!odontologoId) {
      setApiError('Por favor selecciona un odontólogo responsable.')
      return
    }

    // Validar reglas estrictas de fecha y horario
    const scheduleValidation = validateAppointmentSchedule(fecha, horaInicio, horaFin)
    if (!scheduleValidation.valid) {
      setApiError(scheduleValidation.error || 'Horario inválido.')
      return
    }

    // Construcción de timestamps ISO directos esperados por el Backend (ej: 2026-10-10T08:00:00Z)
    // Se evita toISOString() para no agregar +5 horas por la zona horaria UTC-5 del navegador
    const inicioIso = `${fecha}T${horaInicio}:00Z`
    const finIso = `${fecha}T${horaFin}:00Z`

    const payload: CreateAppointmentPayload = {
      pacienteId,
      odontologoId,
      inicioEn: inicioIso,
      finEn: finIso,
      modalidad,
      motivo: motivo.trim() || 'Consulta general',
      consultorio,
    }

    setIsSubmitting(true)
    try {
      const created = await createAppointment(payload)
      onSuccess(created)
      onClose()
    } catch (err: any) {
      console.error('Error al agendar cita en Backend:', err)
      const status = err.status || err.response?.status
      const backendMessage = err.response?.data?.message || err.message

      // Regla 5: Error 409 Conflict (cruce de horario de doctor o sillón ocupado)
      if (status === 409 || backendMessage?.toLowerCase().includes('conflicto')) {
        setConflictError(CONFLICT_MESSAGE)
      }
      // Regla 5: Error 400 Bad Request (horario fuera de turno o domingo) -> mensaje exacto del backend
      else if (status === 400) {
        setApiError(backendMessage || 'Datos de cita inválidos según las reglas de la clínica.')
      } else {
        setApiError(backendMessage || 'Error inesperado al registrar la cita.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-700 flex items-center justify-center font-bold text-sm">
              📅
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base" style={{ fontFamily: 'Outfit' }}>
                + Agendar Nueva Cita
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Validación de horarios, turnos y sillones sincronizada con PostgreSQL
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} id="agendar-cita-form" className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Regla 5: Alerta 409 Conflict */}
          {conflictError && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3.5 flex items-start gap-3 text-rose-900 animate-in fade-in duration-200 shadow-sm shadow-rose-100">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 text-rose-600 font-bold text-base">
                ✕
              </div>
              <div className="flex-1 text-xs">
                <p className="font-bold text-rose-950 text-sm">Cruce de Horario Detectado</p>
                <p className="mt-1 font-semibold text-rose-800">{conflictError}</p>
                <p className="text-[11px] text-rose-600 mt-1">
                  Por favor selecciona otra franja horaria, cambia de odontólogo o elige otro sillón disponible.
                </p>
              </div>
            </div>
          )}

          {/* Regla 5: Alerta 400 Bad Request (mensaje exacto de Backend) */}
          {apiError && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900 animate-in fade-in duration-150">
              <span className="font-bold text-amber-600 text-sm">⚠</span>
              <div className="flex-1">
                <p className="font-bold text-amber-950">Validación de Cita</p>
                <p className="mt-0.5 text-amber-800">{apiError}</p>
              </div>
            </div>
          )}

          {/* 1. Selector de Paciente */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Paciente <span className="text-rose-500">*</span>
              </label>
              {patients.length > 4 && (
                <input
                  type="text"
                  placeholder="Buscar por nombre o DNI..."
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  className="text-[11px] px-2 py-0.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              )}
            </div>

            {loadingData ? (
              <div className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-400 bg-slate-50 flex items-center gap-2">
                <span className="animate-spin w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full" />
                Cargando pacientes desde PostgreSQL...
              </div>
            ) : patients.length === 0 ? (
              <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                No hay pacientes registrados en el sistema. Puedes registrarlos en el módulo de Pacientes.
              </div>
            ) : (
              <select
                required
                value={pacienteId}
                onChange={e => {
                  setPacienteId(e.target.value)
                  setConflictError(null)
                  setApiError(null)
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 font-medium cursor-pointer"
              >
                <option value="" disabled>Seleccione un paciente...</option>
                {filteredPatients.map(p => (
                  <option key={p.id} value={String(p.id)}>
                    {p.nombres} {p.apellidos || ''} — Doc: {p.numeroDocumento || 'S/D'} ({p.telefono || 'Sin teléfono'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. Selector de Odontólogo */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Odontólogo Responsable <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={odontologoId}
              onChange={e => {
                setOdontologoId(e.target.value)
                setConflictError(null)
                setApiError(null)
              }}
              className={`w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 transition-colors cursor-pointer ${
                conflictError
                  ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-400/40 text-rose-900'
                  : 'border-slate-200 focus:ring-teal-500/40 text-slate-800'
              }`}
            >
              <option value="" disabled>Seleccione un odontólogo...</option>
              {doctors.map(d => {
                const docId = d.usuarioClinicaId || d.id
                return (
                  <option key={docId} value={docId}>
                    Dr(a). {d.nombres} {d.apellidos} ({d.correo})
                  </option>
                )
              })}
            </select>
          </div>

          {/* Regla 1, 2 y 3: Selector de Fecha, Slots Dinámicos y Cálculo Automático de Fin */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>🕒</span> Programación de Horario
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                {isSunday
                  ? '🚫 Cerrado domingos'
                  : isSaturday
                  ? 'Sábado: 08:00 a 13:00'
                  : 'Lunes a Viernes: 08:00 a 18:00'}
              </span>
            </div>

            {/* Fecha (Regla 1: min=hoy, max=hoy+90, advertencia domingo) */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Fecha de la Cita <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                min={minDate}
                max={maxDate}
                value={fecha}
                onChange={e => {
                  setFecha(e.target.value)
                  setConflictError(null)
                  setApiError(null)
                }}
                className={`w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 ${
                  isSunday
                    ? 'border-amber-400 bg-amber-50/30 focus:ring-amber-400 text-amber-900'
                    : conflictError
                    ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-400/40'
                    : 'border-slate-200 focus:ring-teal-500/40'
                }`}
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Fechas permitidas: Desde hoy ({minDate}) hasta +90 días ({maxDate}).
              </p>
            </div>

            {/* Advertencia Visual de Domingo (Regla 1) */}
            {isSunday && (
              <div className="bg-amber-100/80 border-2 border-amber-300 rounded-xl p-3 flex items-start gap-2.5 text-amber-900 animate-in fade-in duration-150">
                <span className="text-amber-700 font-bold text-base">⚠️</span>
                <div className="text-xs">
                  <p className="font-bold">La clínica permanece cerrada los domingos.</p>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Por favor selecciona un día de Lunes a Sábado para poder agendar turnos de atención.
                  </p>
                </div>
              </div>
            )}

            {/* Notificación si hoy ya no quedan turnos */}
            {allPassed && !isSunday && (
              <div className="bg-slate-100 border border-slate-300 rounded-xl p-3 flex items-start gap-2 text-xs text-slate-700">
                <span className="text-slate-500 font-bold">ℹ</span>
                <div>
                  <p className="font-bold">Todos los turnos de hoy han concluido.</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Por favor selecciona una fecha posterior para reservar tu cita.
                  </p>
                </div>
              </div>
            )}

            {/* Horas Inicio y Fin (Reglas 2 y 3) */}
            {!isSunday && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Hora Inicio (Selector Dinámico de Franjas) */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Hora de Inicio <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    disabled={slots.length === 0 || allPassed}
                    value={horaInicio}
                    onChange={e => handleHoraInicioChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 font-medium cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {slots.length === 0 ? (
                      <option value="">Sin horarios disponibles</option>
                    ) : (
                      slots.map(s => (
                        <option key={s.time} value={s.time} disabled={s.isPast}>
                          {s.label} {s.isPast ? '— (Hora ya transcurrida)' : `(Fin: ${s.endTime})`}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Franjas de 15 min ({isSaturday ? '08:00 a 12:15' : '08:00 a 17:15'}).
                  </p>
                </div>

                {/* Hora Fin (Cálculo Automático +45 min y validación con cierre) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Hora de Fin <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-md">
                      +45 min duración
                    </span>
                  </div>
                  <input
                    type="time"
                    readOnly
                    value={horaFin}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-700 font-semibold focus:outline-none cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Hora máxima de cierre permitida: <strong className="text-slate-700">{closingTime}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Regla 4: Selector de Sillón / Consultorio y Modalidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Consultorio (Exactamente Sillón 1, Sillón 2, Box Quirúrgico) */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Sillón / Consultorio <span className="text-rose-500">*</span>
              </label>
              <select
                value={consultorio}
                onChange={e => {
                  setConsultorio(e.target.value)
                  setConflictError(null)
                  setApiError(null)
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 font-medium cursor-pointer"
              >
                {CONSULTORIOS.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Validado contra cruces de sillón en el Backend
              </p>
            </div>

            {/* Modalidad Radio Buttons */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Modalidad de Atención
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <label
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    modalidad === 'PRESENCIAL'
                      ? 'border-teal-600 bg-teal-50/60 text-teal-800 font-semibold shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="modalidad"
                    value="PRESENCIAL"
                    checked={modalidad === 'PRESENCIAL'}
                    onChange={() => setModalidad('PRESENCIAL')}
                    className="hidden"
                  />
                  <span>🏥 Presencial</span>
                </label>

                <label
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    modalidad === 'VIRTUAL'
                      ? 'border-teal-600 bg-teal-50/60 text-teal-800 font-semibold shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="modalidad"
                    value="VIRTUAL"
                    checked={modalidad === 'VIRTUAL'}
                    onChange={() => setModalidad('VIRTUAL')}
                    className="hidden"
                  />
                  <span>💻 Virtual</span>
                </label>
              </div>
            </div>
          </div>

          {/* 5. Motivo de Consulta */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Motivo de Consulta
            </label>
            <input
              type="text"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ej: Limpieza dental, dolor en molar, ajuste de ortodoncia..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 mb-2"
            />
            {/* Quick Pills */}
            <div className="flex flex-wrap gap-1.5">
              {MOTIVOS_FRECUENTES.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMotivo(m)}
                  className={`text-[11px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                    motivo === m
                      ? 'bg-teal-100 border-teal-300 text-teal-800 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            {isSunday ? (
              <span className="text-amber-700 font-semibold">Domingo no disponible</span>
            ) : (
              <span>
                Cita de <strong>45 min</strong> en <strong>{consultorio}</strong>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-white disabled:opacity-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="agendar-cita-form"
              disabled={isSubmitting || loadingData || isSunday || allPassed || !horaInicio}
              className="px-5 py-2 text-white rounded-xl text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              style={{ backgroundColor: '#1E8C82' }}
            >
              {isSubmitting && (
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {isSubmitting ? 'Verificando con PostgreSQL...' : 'Agendar Cita'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
