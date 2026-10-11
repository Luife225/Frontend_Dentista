import {
  Appointment,
  CreateAppointmentPayload,
  PatientAppointmentRequestPayload,
  SolicitudReprogramacion,
  CreateSolicitudPayload,
  ResolveSolicitudPayload,
} from '../types/appointment'

import { getAuthHeaders, triggerUnauthorized, API_BASE_URL } from './apiClient'
import { UserItem } from './authService'

export class AppointmentApiError extends Error {
  status: number
  errors?: Record<string, string>
  response?: {
    status: number
    data: {
      message: string
      errors?: Record<string, string>
    }
  }

  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message)
    this.name = 'AppointmentApiError'
    this.status = status
    this.errors = errors
    this.response = {
      status,
      data: {
        message,
        errors,
      },
    }
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    triggerUnauthorized()
  }
  if (!res.ok) {
    let message = `Error ${res.status}: ${res.statusText}`
    let errors: Record<string, string> | undefined = undefined
    try {
      const errData = await res.json()
      message = errData.message || message
      if (errData.errors && typeof errData.errors === 'object') {
        errors = errData.errors
      }
    } catch {
      // fallback
    }
    throw new AppointmentApiError(res.status, message, errors)
  }
  return res.json()
}

const DECIMAL_ID_REGEX = /^[1-9]\d*$/

function isDecimalId(id?: string | null): boolean {
  return typeof id === 'string' && DECIMAL_ID_REGEX.test(id)
}

function validateAppointmentContract(cita: Appointment): Appointment {
  if (!cita || !cita.id || !isDecimalId(cita.id)) {
    throw new AppointmentApiError(500, `Contrato de API inválido: la cita recibida no posee un ID decimal string válido (${cita?.id})`)
  }
  if (!cita.pacienteId || !isDecimalId(cita.pacienteId)) {
    throw new AppointmentApiError(500, `Contrato de API inválido: la cita (${cita.id}) no posee un pacienteId decimal string válido (${cita.pacienteId})`)
  }
  if (!cita.odontologoId || !isDecimalId(cita.odontologoId)) {
    throw new AppointmentApiError(500, `Contrato de API inválido: la cita (${cita.id}) no posee un odontologoId decimal string válido (${cita.odontologoId})`)
  }
  return cita
}

/**
 * GET /api/v1/citas
 * Listar citas por rango de fechas (desde, hasta) y opcionalmente clinicaId
 */
export async function getAppointments(desde?: string, hasta?: string, clinicaId?: string): Promise<Appointment[]> {
  const params = new URLSearchParams()
  if (desde) params.append('desde', desde)
  if (hasta) params.append('hasta', hasta)
  if (clinicaId) {
    if (!isDecimalId(clinicaId)) {
      throw new AppointmentApiError(400, `Contrato inválido: clinicaId (${clinicaId}) debe ser decimal string`)
    }
    params.append('clinicaId', clinicaId)
  }

  const url = `${API_BASE_URL}/citas${params.toString() ? `?${params.toString()}` : ''}`
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const list = await handleResponse<Appointment[]>(response)
  return list.map(validateAppointmentContract)
}

/**
 * GET /api/v1/citas/odontologo/{odontologoId}
 * Agenda de un doctor específico (usuarioClinicaId) filtrada por rango opcional
 */
export async function getAppointmentsByDoctor(
  odontologoId: string,
  desde?: string,
  hasta?: string
): Promise<Appointment[]> {
  if (!isDecimalId(odontologoId)) {
    throw new AppointmentApiError(400, `Contrato inválido: odontologoId (${odontologoId}) debe ser decimal string`)
  }

  const params = new URLSearchParams()
  if (desde) params.append('desde', desde)
  if (hasta) params.append('hasta', hasta)

  const url = `${API_BASE_URL}/citas/odontologo/${encodeURIComponent(odontologoId)}${
    params.toString() ? `?${params.toString()}` : ''
  }`
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const list = await handleResponse<Appointment[]>(response)
  return list.map(validateAppointmentContract)
}

/**
 * GET /api/v1/citas/paciente/{pacienteId}
 * Historial de citas de un paciente
 */
export async function getAppointmentsByPatient(pacienteId: string): Promise<Appointment[]> {
  if (!isDecimalId(pacienteId)) {
    throw new AppointmentApiError(400, `Contrato inválido: pacienteId (${pacienteId}) debe ser decimal string`)
  }

  const url = `${API_BASE_URL}/citas/paciente/${encodeURIComponent(pacienteId)}`
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const list = await handleResponse<Appointment[]>(response)
  return list.map(validateAppointmentContract)
}

/**
 * GET /api/v1/citas/{id}
 * Ficha completa de una cita
 */
export async function getAppointmentById(id: string): Promise<Appointment> {
  if (!isDecimalId(id)) {
    throw new AppointmentApiError(400, `Contrato inválido: id de cita (${id}) debe ser decimal string`)
  }

  const url = `${API_BASE_URL}/citas/${encodeURIComponent(id)}`
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const cita = await handleResponse<Appointment>(response)
  return validateAppointmentContract(cita)
}

/**
 * POST /api/v1/citas
 * Agendar nueva cita (Devuelve 409 Conflict si el doctor ya tiene otra cita en ese horario)
 */
export async function createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
  if (!isDecimalId(payload.pacienteId)) {
    throw new AppointmentApiError(400, `Contrato inválido: pacienteId (${payload.pacienteId}) debe ser decimal string`)
  }
  if (!isDecimalId(payload.odontologoId)) {
    throw new AppointmentApiError(400, `Contrato inválido: odontologoId (${payload.odontologoId}) debe ser decimal string`)
  }
  if (payload.clinicaId && !isDecimalId(payload.clinicaId)) {
    throw new AppointmentApiError(400, `Contrato inválido: clinicaId (${payload.clinicaId}) debe ser decimal string`)
  }
  if (payload.creadoPorId && !isDecimalId(payload.creadoPorId)) {
    throw new AppointmentApiError(400, `Contrato inválido: creadoPorId (${payload.creadoPorId}) debe ser decimal string`)
  }

  const response = await fetch(`${API_BASE_URL}/citas`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })

  const created = await handleResponse<Appointment>(response)
  return validateAppointmentContract(created)
}

/**
 * PATCH /api/v1/citas/{id}/estado
 * Cambiar estado ('PROGRAMADA' | 'CONFIRMADA' | 'EN_ATENCION' | 'FINALIZADA' | 'CANCELADA')
 */
export async function updateStatus(
  id: string,
  estado: string,
  motivoCancelacion?: string
): Promise<Appointment> {
  if (!isDecimalId(id)) {
    throw new AppointmentApiError(400, `Contrato inválido: id de cita (${id}) debe ser decimal string`)
  }

  const response = await fetch(`${API_BASE_URL}/citas/${encodeURIComponent(id)}/estado`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      estado,
      motivoCancelacion: motivoCancelacion || undefined,
    }),
  })

  const updated = await handleResponse<Appointment>(response)
  return validateAppointmentContract(updated)
}

/**
 * PATCH /api/v1/citas/{id}/asistencia
 * Marcar asistencia ('ASISTIO' | 'NO_SHOW')
 */
export async function markAttendance(
  id: string,
  estadoAsistencia: 'ASISTIO' | 'NO_SHOW'
): Promise<Appointment> {
  if (!isDecimalId(id)) {
    throw new AppointmentApiError(400, `Contrato inválido: id de cita (${id}) debe ser decimal string`)
  }

  const response = await fetch(`${API_BASE_URL}/citas/${encodeURIComponent(id)}/asistencia`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      estadoAsistencia,
    }),
  })

  const updated = await handleResponse<Appointment>(response)
  return validateAppointmentContract(updated)
}

/**
 * PUT /api/v1/citas/{id}/reprogramar?nuevoInicio={iso}&nuevoFin={iso}
 * Reprogramar horario de una cita
 */
export async function reschedule(
  id: string,
  nuevoInicio: string,
  nuevoFin: string
): Promise<Appointment> {
  if (!isDecimalId(id)) {
    throw new AppointmentApiError(400, `Contrato inválido: id de cita (${id}) debe ser decimal string`)
  }

  const params = new URLSearchParams({
    nuevoInicio,
    nuevoFin,
  })

  const url = `${API_BASE_URL}/citas/${encodeURIComponent(id)}/reprogramar?${params.toString()}`
  const response = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(),
  })

  const updated = await handleResponse<Appointment>(response)
  return validateAppointmentContract(updated)
}

/**
 * GET /api/v1/me/citas
 * Citas del paciente autenticado (sin exponer pacienteId al cliente)
 */
export async function getMyAppointments(): Promise<Appointment[]> {
  const url = `${API_BASE_URL}/me/citas`
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  const list = await handleResponse<Appointment[]>(response)
  return list.map(validateAppointmentContract)
}

/**
 * POST /api/v1/me/citas
 * Agendamiento directo del paciente (sin pacienteId en body)
 */
export async function createMyAppointment(payload: PatientAppointmentRequestPayload): Promise<Appointment> {
  if (!isDecimalId(payload.odontologoId)) {
    throw new AppointmentApiError(400, `Contrato inválido: odontologoId (${payload.odontologoId}) debe ser decimal string`)
  }

  const response = await fetch(`${API_BASE_URL}/me/citas`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })

  const created = await handleResponse<Appointment>(response)
  return validateAppointmentContract(created)
}

/**
 * POST /api/v1/citas/{id}/solicitar-reprogramacion
 * Paciente o staff solicita reprogramación formal persistida
 */
export async function requestReschedule(
  citaId: string,
  payload: CreateSolicitudPayload
): Promise<SolicitudReprogramacion> {
  if (!isDecimalId(citaId)) {
    throw new AppointmentApiError(400, `Contrato inválido: citaId (${citaId}) debe ser decimal string`)
  }

  const response = await fetch(`${API_BASE_URL}/citas/${encodeURIComponent(citaId)}/solicitar-reprogramacion`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })

  return handleResponse<SolicitudReprogramacion>(response)
}

/**
 * GET /api/v1/me/solicitudes-reprogramacion
 * Solicitudes de reprogramación del paciente autenticado
 */
export async function getMyRescheduleRequests(): Promise<SolicitudReprogramacion[]> {
  const url = `${API_BASE_URL}/me/solicitudes-reprogramacion`
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse<SolicitudReprogramacion[]>(response)
}

/**
 * GET /api/v1/citas/solicitudes-reprogramacion
 * Bandeja de solicitudes de la clínica para personal autorizado
 */
export async function getClinicRescheduleRequests(
  estado?: string,
  clinicaId?: string
): Promise<SolicitudReprogramacion[]> {
  const params = new URLSearchParams()
  if (estado) params.append('estado', estado)
  if (clinicaId) params.append('clinicaId', clinicaId)

  const url = `${API_BASE_URL}/citas/solicitudes-reprogramacion${params.toString() ? `?${params.toString()}` : ''}`
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  return handleResponse<SolicitudReprogramacion[]>(response)
}

/**
 * PATCH /api/v1/citas/solicitudes-reprogramacion/{id}/resolver
 * Resolver solicitud atómicamente (APROBADA | RECHAZADA)
 */
export async function resolveRescheduleRequest(
  solicitudId: string,
  payload: ResolveSolicitudPayload
): Promise<SolicitudReprogramacion> {
  if (!isDecimalId(solicitudId)) {
    throw new AppointmentApiError(400, `Contrato inválido: solicitudId (${solicitudId}) debe ser decimal string`)
  }

  const response = await fetch(
    `${API_BASE_URL}/citas/solicitudes-reprogramacion/${encodeURIComponent(solicitudId)}/resolver`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  )

  return handleResponse<SolicitudReprogramacion>(response)
}

/**
 * PATCH /api/v1/citas/solicitudes-reprogramacion/{id}/cancelar
 * Cancelar solicitud de reprogramación pendiente
 */
export async function cancelRescheduleRequest(solicitudId: string): Promise<SolicitudReprogramacion> {
  if (!isDecimalId(solicitudId)) {
    throw new AppointmentApiError(400, `Contrato inválido: solicitudId (${solicitudId}) debe ser decimal string`)
  }

  const response = await fetch(
    `${API_BASE_URL}/citas/solicitudes-reprogramacion/${encodeURIComponent(solicitudId)}/cancelar`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
    }
  )

  return handleResponse<SolicitudReprogramacion>(response)
}

/**
 * GET /api/v1/citas/odontologos
 * Catálogo asistencial de odontólogos activos de la clínica (permitido para Recepcionista, Odontólogo, Paciente y Admin)
 */
export async function fetchClinicOdontologos(): Promise<UserItem[]> {
  const response = await fetch(`${API_BASE_URL}/citas/odontologos`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  return handleResponse<UserItem[]>(response)
}
