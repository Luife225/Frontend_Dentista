import useAppointmentSlots from "../../hooks/useAppointmentSlots"

import { useState, useEffect, useMemo } from "react"

import {
  fetchPatientsFromApi,
  BackendPatientDto,
} from "../../services/patientService"

import { fetchUsersFromApi, UserItem } from "../../services/authService"

import { useAuth } from "../../contexts/AuthContext"

import {
  createAppointment,
  fetchClinicOdontologos,
} from "../../services/appointmentService"

import { Appointment, CreateAppointmentPayload } from "../../types/appointment"

import {
  CONSULTORIOS,
  getMinDateString,
  getMaxDateString,
  getAvailableSlots,
  calculateEndTime,
  validateAppointmentSchedule,
  CONFLICT_MESSAGE,
  toLimaIsoString,
} from "../../utils/appointmentRules"

import { createOfficialGoogleMeet } from "../../services/googleMeetService"

interface AgendarCitaModalProps {
  isOpen: boolean

  onClose: () => void

  onSuccess: (cita: Appointment) => void

  onConflict?: () => void

  initialDate?: string

  initialTime?: string

  initialPatientId?: string

  initialDoctorId?: string
}

const MOTIVOS_FRECUENTES = [
  "Limpieza dental profiláctica",

  "Evaluación inicial / Diagnóstico",

  "Ajuste de ortodoncia",

  "Dolor agudo / Urgencia",

  "Extracción dental",

  "Tratamiento de endodoncia",

  "Control postoperatorio",
]

export default function AgendarCitaModal({
  isOpen,

  onClose,

  onSuccess,

  onConflict,

  initialDate,

  initialTime,

  initialDoctorId,

  initialPatientId,
}: AgendarCitaModalProps) {
  const { role, user } = useAuth()

  const minDate = useMemo(() => getMinDateString(), [])

  const maxDate = useMemo(() => getMaxDateString(), [])

  // Inicializar fecha garantizando que no sea pasada

  const [fecha, setFecha] = useState(() => {
    if (initialDate && initialDate >= getMinDateString()) {
      return initialDate
    }

    return getMinDateString()
  })

  const [odontologoId, setOdontologoId] = useState(initialDoctorId || "")

  const slotData = useAppointmentSlots(odontologoId, fecha)

  const { slots, isSunday, isSaturday, allPassed, closingTime } = slotData

  // Hora de inicio y fin

  const [horaInicio, setHoraInicio] = useState(() => {
    if (initialTime) return initialTime

    return ""
  })

  const [horaFin, setHoraFin] = useState("")

  // Form State

  const [pacienteId, setPacienteId] = useState(initialPatientId || "")

  const [consultorio, setConsultorio] = useState<string>(CONSULTORIOS[0])

  const [modalidad, setModalidad] = useState<"PRESENCIAL" | "VIRTUAL">(
    "PRESENCIAL",
  )

  const [enlaceTeleconsulta, setEnlaceTeleconsulta] = useState("")

  const [motivo, setMotivo] = useState("")

  const [isGeneratingMeet, setIsGeneratingMeet] = useState(false)

  const [meetSuccessMsg, setMeetSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    setEnlaceTeleconsulta("")

    setMeetSuccessMsg(null)
  }, [fecha, horaInicio, horaFin, odontologoId])

  // Generador oficial con Google Identity Services y Google Calendar API

  const handleGenerarMeetReal = async () => {
    setIsGeneratingMeet(true)

    setApiError(null)

    setMeetSuccessMsg(null)

    try {
      const selectedPatient = patients.find((p) => p.id === pacienteId)

      const selectedDoctor = doctors.find(
        (d) => d.usuarioClinicaId === odontologoId,
      )

      const startIso =
        fecha && horaInicio ? toLimaIsoString(fecha, horaInicio) : undefined

      const endIso =
        fecha && horaFin ? toLimaIsoString(fecha, horaFin) : undefined

      const doctorNombre = selectedDoctor
        ? `${selectedDoctor.nombres} ${selectedDoctor.apellidos}`.trim()
        : "Especialista"

      const result = await createOfficialGoogleMeet({
        summary: `Teleconsulta Coronyx: ${
          selectedPatient
            ? `${selectedPatient.nombres} ${selectedPatient.apellidos}`
            : "Paciente"
        }`,

        description: `Cita virtual odontológica en Coronyx.\nMotivo: ${motivo || "Evaluación general"}\nOdontólogo: ${doctorNombre}`,

        startDateTime: startIso,

        endDateTime: endIso,

        patientName: selectedPatient
          ? `${selectedPatient.nombres} ${selectedPatient.apellidos}`
          : undefined,

        doctorName: doctorNombre,
      })

      setEnlaceTeleconsulta(result.meetUrl)

      setMeetSuccessMsg(
        "Sala creada en Google Calendar. Los cambios posteriores de fecha se gestionan también en tu calendario.",
      )
    } catch (err: any) {
      console.warn("Error al generar sala oficial con Google Meet API:", err)

      setApiError(
        err.message || "No se pudo generar la sala oficial con Google Meet.",
      )
    } finally {
      setIsGeneratingMeet(false)
    }
  }

  // Data Loading State

  const [patients, setPatients] = useState<BackendPatientDto[]>([])

  const [doctors, setDoctors] = useState<UserItem[]>([])

  const [loadingData, setLoadingData] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Feedback State

  const [conflictError, setConflictError] = useState<string | null>(null)

  const [apiError, setApiError] = useState<string | null>(null)

  const [patientSearch, setPatientSearch] = useState("")

  // Sincronizar fecha y hora inicial si se proporcionan al abrir

  useEffect(() => {
    if (initialDate) {
      const validDate =
        initialDate < getMinDateString() ? getMinDateString() : initialDate

      setFecha(validDate)
    }
  }, [initialDate])

  // Ajustar hora inicio cuando cambia la fecha o se recalculan los slots

  useEffect(() => {
    if (isSunday) {
      setHoraInicio("")

      setHoraFin("")

      return
    }

    // Si la hora actual ya no es válida o ya pasó en el día de hoy, elegir el primer slot disponible

    const currentSlot = slots.find((s) => s.time === horaInicio)

    if (!currentSlot || currentSlot.isPast) {
      const firstValid = slots.find((s) => !s.isPast)

      if (firstValid) {
        setHoraInicio(firstValid.time)

        setHoraFin(firstValid.endTime)
      } else {
        setHoraInicio("")

        setHoraFin("")
      }
    } else {
      setHoraFin(currentSlot.endTime)
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
          fetchPatientsFromApi(),

          fetchClinicOdontologos(),
        ])

        if (!active) return

        setPatients(patientsData || [])

        if (patientsData && patientsData.length > 0 && !pacienteId) {
          const firstPatientId = patientsData[0].id

          if (!firstPatientId) {
            throw new Error(
              "Contrato de API inválido: el primer paciente devuelto no posee ID decimal",
            )
          }

          setPacienteId(firstPatientId)
        }

        // Filtrar usuarios con rol ODONTOLOGO que posean membresía activa (usuarioClinicaId)

        let odontologos = usersData.filter((u) => u.rol === "ODONTOLOGO")

        if (
          odontologos.length === 0 &&
          role === "ODONTOLOGO" &&
          user &&
          user.usuarioClinicaId
        ) {
          odontologos = [
            {
              id: user.usuarioId || user.id,

              usuarioClinicaId: user.usuarioClinicaId,

              correo: user.correo,

              nombres: user.nombres,

              apellidos: user.apellidos,

              rol: "ODONTOLOGO",

              estado: "ACTIVO",
            },
          ]
        }

        for (const doc of odontologos) {
          if (!doc.usuarioClinicaId) {
            throw new Error(
              `Contrato de API inválido: el odontólogo ${doc.correo} no posee usuarioClinicaId`,
            )
          }
        }

        setDoctors(odontologos)

        // Asignar doctor por defecto usando estrictamente usuarioClinicaId

        if (odontologos.length > 0) {
          const selectedDoc = initialDoctorId
            ? odontologos.find((d) => d.usuarioClinicaId === initialDoctorId)
            : odontologos[0]

          const docVal =
            selectedDoc?.usuarioClinicaId || odontologos[0].usuarioClinicaId!

          setOdontologoId(docVal)
        }
      } catch (err: any) {
        if (!active) return

        setApiError(
          err.message ||
            "No se pudieron cargar los datos de pacientes y odontólogos",
        )
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

    const finCalculado = slots.find((s) => s.time === nuevaHora)?.endTime || ""

    setHoraFin(finCalculado)
  }

  // Filtrado de pacientes para búsqueda rápida

  const filteredPatients = patients.filter((p) => {
    if (!patientSearch.trim()) return true

    const term = patientSearch.toLowerCase()

    const fullName = `${p.nombres} ${p.apellidos || ""}`.toLowerCase()

    const doc = (p.numeroDocumento || "").toLowerCase()

    return fullName.includes(term) || doc.includes(term)
  })

  // Submit Handler con manejo estricto de 400 y 409

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setConflictError(null)

    setApiError(null)

    if (!pacienteId) {
      setApiError("Por favor selecciona un paciente.")

      return
    }

    if (!odontologoId) {
      setApiError("Por favor selecciona un odontólogo responsable.")

      return
    }

    // Validar reglas estrictas de fecha y horario

    const available = slots.find(
      (s) => s.time === horaInicio && s.endTime === horaFin && !s.isPast,
    )

    const scheduleValidation = {
      valid: Boolean(available) && !slotData.loading && !slotData.error,
      error:
        slotData.error || "Selecciona un horario disponible del profesional.",
    }

    if (!scheduleValidation.valid) {
      setApiError(scheduleValidation.error || "Horario inválido.")

      return
    }

    // Validación específica para teleconsultas

    if (modalidad === "VIRTUAL" && !enlaceTeleconsulta.trim()) {
      setApiError(
        "Por favor genera o ingresa un enlace de Google Meet para la teleconsulta.",
      )

      return
    }

    // Construcción de timestamps ISO con zona horaria oficial Lima (-05:00)

    const inicioIso = toLimaIsoString(fecha, horaInicio)

    const finIso = toLimaIsoString(fecha, horaFin)

    const payload: CreateAppointmentPayload = {
      pacienteId,

      odontologoId,

      inicioEn: inicioIso,

      finEn: finIso,

      modalidad,

      motivo: motivo.trim() || "Consulta general",

      consultorio:
        modalidad === "VIRTUAL" ? "Sala Virtual (Meet)" : consultorio,

      enlaceTeleconsulta:
        modalidad === "VIRTUAL"
          ? enlaceTeleconsulta.trim() || undefined
          : undefined,
    }

    setIsSubmitting(true)

    try {
      const created = await createAppointment(payload)

      onSuccess(created)

      onClose()
    } catch (err: any) {
      console.error("Error al agendar cita en Backend:", err)

      const status = err.status || err.response?.status

      const backendMessage = err.response?.data?.message || err.message

      // Regla 5: Error 409 Conflict (cruce de horario de doctor o sillón ocupado)

      if (
        status === 409 ||
        backendMessage?.toLowerCase().includes("conflicto") ||
        backendMessage?.toLowerCase().includes("solapa")
      ) {
        setConflictError(backendMessage || CONFLICT_MESSAGE)

        if (onConflict) {
          onConflict()
        }
      }
      // Regla 5: Error 400 Bad Request (horario fuera de turno o domingo) -> mensaje exacto del backend
      else if (status === 400) {
        setApiError(
          backendMessage ||
            "Datos de cita inválidos según las reglas de la clínica.",
        )
      } else {
        setApiError(backendMessage || "Error inesperado al registrar la cita.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.7)",
        backdropFilter: "blur(5px)",
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-700 flex items-center justify-center font-bold text-sm">
              📅
            </div>
            <div>
              <h2
                className="font-bold text-slate-800 text-base"
                style={{ fontFamily: "Outfit" }}
              >
                + Agendar Nueva Cita
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Consulta de disponibilidad y reserva de consultorio
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
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
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          id="agendar-cita-form"
          className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
        >
          {/* Regla 5: Alerta 409 Conflict */}
          {conflictError && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3.5 flex items-start gap-3 text-rose-900 animate-in fade-in duration-200 shadow-sm shadow-rose-100">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 text-rose-600 font-bold text-base">
                ✕
              </div>
              <div className="flex-1 text-xs">
                <p className="font-bold text-rose-950 text-sm">
                  Cruce de Horario Detectado
                </p>
                <p className="mt-1 font-semibold text-rose-800">
                  {conflictError}
                </p>
                <p className="text-[11px] text-rose-600 mt-1">
                  Por favor selecciona otra franja horaria, cambia de odontólogo
                  o elige otro sillón disponible.
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
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="text-[11px] px-2 py-0.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              )}
            </div>

            {loadingData ? (
              <div className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-400 bg-slate-50 flex items-center gap-2">
                <span className="animate-spin w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full" />
                Cargando lista de pacientes...
              </div>
            ) : patients.length === 0 ? (
              <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                No hay pacientes registrados en el sistema. Puedes registrarlos
                en el módulo de Pacientes.
              </div>
            ) : (
              <select
                required
                value={pacienteId}
                onChange={(e) => {
                  setPacienteId(e.target.value)

                  setConflictError(null)

                  setApiError(null)
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 font-medium cursor-pointer"
              >
                <option value="" disabled>
                  Seleccione un paciente...
                </option>
                {filteredPatients.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.nombres} {p.apellidos || ""} — Doc:{" "}
                    {p.numeroDocumento || "S/D"} ({p.telefono || "Sin teléfono"}
                    )
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
              onChange={(e) => {
                setOdontologoId(e.target.value)

                setConflictError(null)

                setApiError(null)
              }}
              className={`w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 transition-colors cursor-pointer ${
                conflictError
                  ? "border-rose-400 bg-rose-50/20 focus:ring-rose-400/40 text-rose-900"
                  : "border-slate-200 focus:ring-teal-500/40 text-slate-800"
              }`}
            >
              <option value="" disabled>
                Seleccione un odontólogo...
              </option>
              {doctors.map((d) => {
                const docId = d.usuarioClinicaId!

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
                  ? "Sin turnos para esta fecha"
                  : isSaturday
                    ? "Sábado: 08:00 a 13:00"
                    : "Horario del profesional"}
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
                onChange={(e) => {
                  setFecha(e.target.value)

                  setConflictError(null)

                  setApiError(null)
                }}
                className={`w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 ${
                  isSunday
                    ? "border-amber-400 bg-amber-50/30 focus:ring-amber-400 text-amber-900"
                    : conflictError
                      ? "border-rose-400 bg-rose-50/20 focus:ring-rose-400/40"
                      : "border-slate-200 focus:ring-teal-500/40"
                }`}
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Fechas permitidas: Desde hoy ({minDate}) hasta +90 días (
                {maxDate}).
              </p>
            </div>

            {/* Advertencia Visual de Domingo (Regla 1) */}
            {isSunday && (
              <div className="bg-amber-100/80 border-2 border-amber-300 rounded-xl p-3 flex items-start gap-2.5 text-amber-900 animate-in fade-in duration-150">
                <span className="text-amber-700 font-bold text-base">⚠️</span>
                <div className="text-xs">
                  <p className="font-bold">
                    No hay turnos configurados para esta fecha.
                  </p>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Selecciona otra fecha o consulta con la clínica los horarios
                    de atención.
                  </p>
                </div>
              </div>
            )}

            {/* Notificación si hoy ya no quedan turnos */}
            {allPassed && !isSunday && (
              <div className="bg-slate-100 border border-slate-300 rounded-xl p-3 flex items-start gap-2 text-xs text-slate-700">
                <span className="text-slate-500 font-bold">ℹ</span>
                <div>
                  <p className="font-bold">
                    No quedan turnos disponibles para esta fecha.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Por favor selecciona una fecha posterior para reservar tu
                    cita.
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
                    onChange={(e) => handleHoraInicioChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 font-medium cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {slots.length === 0 ? (
                      <option value="">Sin horarios disponibles</option>
                    ) : (
                      slots.map((s) => (
                        <option key={s.time} value={s.time} disabled={s.isPast}>
                          {s.label}{" "}
                          {s.isPast
                            ? "— (Hora ya transcurrida)"
                            : `(Fin: ${s.endTime})`}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Disponibilidad según horario, citas y ausencias del
                    profesional.
                  </p>
                </div>

                {/* Hora Fin (Cálculo Automático +45 min y validación con cierre) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Hora de Fin <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-md">
                      Duración según turno
                    </span>
                  </div>
                  <input
                    type="time"
                    readOnly
                    value={horaFin}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-700 font-semibold focus:outline-none cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Hora máxima de cierre permitida:{" "}
                    <strong className="text-slate-700">{closingTime}</strong>
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
                onChange={(e) => {
                  setConsultorio(e.target.value)

                  setConflictError(null)

                  setApiError(null)
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 font-medium cursor-pointer"
              >
                {CONSULTORIOS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Sillón clínico asignado para la atención
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
                    modalidad === "PRESENCIAL"
                      ? "border-teal-600 bg-teal-50/60 text-teal-800 font-semibold shadow-xs"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="modalidad"
                    value="PRESENCIAL"
                    checked={modalidad === "PRESENCIAL"}
                    onChange={() => setModalidad("PRESENCIAL")}
                    className="hidden"
                  />
                  <span>🏥 Presencial</span>
                </label>

                <label
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    modalidad === "VIRTUAL"
                      ? "border-sky-600 bg-sky-50 text-sky-800 font-semibold shadow-xs"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="modalidad"
                    value="VIRTUAL"
                    checked={modalidad === "VIRTUAL"}
                    onChange={() => {
                      setModalidad("VIRTUAL")
                    }}
                    className="hidden"
                  />
                  <span>💻 Virtual (Meet)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Bloque de Teleconsulta Google Meet (Visible cuando VIRTUAL) */}
          {modalidad === "VIRTUAL" && (
            <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span
                    className="text-xs font-bold text-sky-900"
                    style={{ fontFamily: "Outfit" }}
                  >
                    Google Meet Oficial · Teleconsulta Odontológica
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    window.open("https://meet.google.com/new", "_blank")
                  }
                  className="text-[11px] text-sky-700 hover:text-sky-900 font-semibold underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                  title="Abrir Google Meet en pestaña nueva para crear una reunión con tu cuenta"
                >
                  Abrir Meet en Gmail ↗
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Enlace de la Videollamada (Google Meet){" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={enlaceTeleconsulta}
                    onChange={(e) => {
                      setEnlaceTeleconsulta(e.target.value)

                      setApiError(null)

                      setMeetSuccessMsg(null)
                    }}
                    placeholder="https://meet.google.com/xxx-yyyy-zzz"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                  <button
                    type="button"
                    disabled={
                      isGeneratingMeet ||
                      !horaInicio ||
                      !horaFin ||
                      slotData.loading
                    }
                    onClick={handleGenerarMeetReal}
                    className="px-3.5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                    title="Vincular con Google Calendar y generar sala Meet oficial"
                  >
                    {isGeneratingMeet ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Creando en Google...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-3.5 h-3.5 text-sky-200"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z" />
                        </svg>
                        <span>⚡ Generar con Google Meet</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Feedback de estado exitoso */}
                {meetSuccessMsg && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold mt-1.5 bg-emerald-50 border border-emerald-200/60 rounded-lg px-2.5 py-1">
                    <span>✓</span>
                    <span>{meetSuccessMsg}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                  <span>
                    El paciente y el odontólogo podrán unirse con 1 solo clic.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 5. Motivo de Consulta */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Motivo de Consulta
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Limpieza dental, dolor en molar, ajuste de ortodoncia..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 mb-2"
            />
            {/* Quick Pills */}
            <div className="flex flex-wrap gap-1.5">
              {MOTIVOS_FRECUENTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMotivo(m)}
                  className={`text-[11px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                    motivo === m
                      ? "bg-teal-100 border-teal-300 text-teal-800 font-semibold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
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
            {slotData.error && (
              <p role="alert" className="text-rose-700 text-sm">
                {slotData.error}
              </p>
            )}
            {isSunday ? (
              <span className="text-amber-700 font-semibold">
                Fecha sin turnos disponibles
              </span>
            ) : (
              <span>
                Cita de{" "}
                <strong>
                  {horaInicio && horaFin
                    ? Number(horaFin.slice(0, 2)) * 60 +
                      Number(horaFin.slice(3)) -
                      Number(horaInicio.slice(0, 2)) * 60 -
                      Number(horaInicio.slice(3))
                    : 0}{" "}
                  min
                </strong>{" "}
                en <strong>{consultorio}</strong>
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
              disabled={
                isSubmitting ||
                loadingData ||
                slotData.loading ||
                !!slotData.error ||
                isSunday ||
                allPassed ||
                !horaInicio
              }
              className="px-5 py-2 text-white rounded-xl text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              style={{ backgroundColor: "#1E8C82" }}
            >
              {isSubmitting && (
                <svg
                  className="animate-spin h-3.5 w-3.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {isSubmitting ? "Guardando cita..." : "Agendar Cita"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
