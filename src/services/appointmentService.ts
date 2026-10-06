import { Appointment, CreateAppointmentPayload } from '../types/appointment'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1'

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

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
  const token = typeof window !== 'undefined' ? localStorage.getItem('coronyx_jwt_token') : null
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

async function handleResponse<T>(res: Response): Promise<T> {
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

/**
 * GET /api/v1/citas
 * Listar citas por rango de fechas (desde, hasta) y opcionalmente clinicaId
 */
export async function getAppointments(desde?: string, hasta?: string, clinicaId?: string): Promise<Appointment[]> {
  const params = new URLSearchParams()
  if (desde) params.append('desde', desde)
  if (hasta) params.append('hasta', hasta)
  if (clinicaId) params.append('clinicaId', clinicaId)

  const url = `${API_BASE_URL}/citas${params.toString() ? `?${params.toString()}` : ''}`
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  return handleResponse<Appointment[]>(response)
}

/**
 * GET /api/v1/citas/odontologo/{odontologoId}
 * Agenda de un doctor específico filtrada por rango opcional
 */
export async function getAppointmentsByDoctor(
  odontologoId: string,
  desde?: string,
  hasta?: string
): Promise<Appointment[]> {
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

  return handleResponse<Appointment[]>(response)
}

/**
 * GET /api/v1/citas/paciente/{pacienteId}
 * Historial de citas de un paciente
 */
export async function getAppointmentsByPatient(pacienteId: string): Promise<Appointment[]> {
  const url = `${API_BASE_URL}/citas/paciente/${encodeURIComponent(pacienteId)}`
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  return handleResponse<Appointment[]>(response)
}

/**
 * GET /api/v1/citas/{id}
 * Ficha completa de una cita
 */
export async function getAppointmentById(id: string): Promise<Appointment> {
  const url = `${API_BASE_URL}/citas/${encodeURIComponent(id)}`
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  return handleResponse<Appointment>(response)
}

/**
 * POST /api/v1/citas
 * Agendar nueva cita (Devuelve 409 Conflict si el doctor ya tiene otra cita en ese horario)
 */
export async function createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
  const response = await fetch(`${API_BASE_URL}/citas`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })

  return handleResponse<Appointment>(response)
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
  const response = await fetch(`${API_BASE_URL}/citas/${encodeURIComponent(id)}/estado`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      estado,
      motivoCancelacion: motivoCancelacion || undefined,
    }),
  })

  return handleResponse<Appointment>(response)
}

/**
 * PATCH /api/v1/citas/{id}/asistencia
 * Marcar asistencia ('ASISTIO' | 'NO_SHOW')
 */
export async function markAttendance(
  id: string,
  estadoAsistencia: 'ASISTIO' | 'NO_SHOW'
): Promise<Appointment> {
  const response = await fetch(`${API_BASE_URL}/citas/${encodeURIComponent(id)}/asistencia`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      estadoAsistencia,
    }),
  })

  return handleResponse<Appointment>(response)
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
  const params = new URLSearchParams({
    nuevoInicio,
    nuevoFin,
  })

  const url = `${API_BASE_URL}/citas/${encodeURIComponent(id)}/reprogramar?${params.toString()}`
  const response = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(),
  })

  return handleResponse<Appointment>(response)
}
