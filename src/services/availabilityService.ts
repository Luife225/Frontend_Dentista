import { API_BASE_URL, getAuthHeaders } from './apiClient'

export interface HorarioAtencionDto {
  id?: string
  clinicaId?: string
  odontologoId?: string | null
  diaSemana: number // 1: Lunes .. 7: Domingo
  horaApertura: string // '08:00'
  horaCierre: string // '18:00'
  activo?: boolean
  duracionTurnoMinutos?: number
}

export interface AusenciaDto {
  id?: string
  clinicaId?: string
  odontologoId: string
  odontologoNombre?: string
  inicioEn: string // ISO OffsetDateTime
  finEn: string
  motivo?: string
  tipo?: string
}

export interface SlotDto {
  horaInicio: string
  horaFin: string
  disponible: boolean
  motivoNoDisponible?: string | null
}

/**
 * Consulta horarios base de la clínica.
 */
export async function getClinicSchedule(clinicaId?: string): Promise<HorarioAtencionDto[]> {
  const url = clinicaId
    ? `${API_BASE_URL}/disponibilidad/horarios?clinicaId=${clinicaId}`
    : `${API_BASE_URL}/disponibilidad/horarios`
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error al obtener horarios (${response.status}): ${errorText || response.statusText}`)
  }
  return response.json()
}

/**
 * Actualiza la configuración de horarios de la clínica.
 */
export async function updateClinicSchedule(horarios: HorarioAtencionDto[], clinicaId?: string): Promise<HorarioAtencionDto[]> {
  const url = clinicaId
    ? `${API_BASE_URL}/disponibilidad/horarios?clinicaId=${clinicaId}`
    : `${API_BASE_URL}/disponibilidad/horarios`
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(horarios),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error al actualizar horarios (${response.status}): ${errorText || response.statusText}`)
  }
  return response.json()
}

/**
 * Consulta slots libres reales basados en horario, citas y ausencias en BD.
 */
export async function fetchAvailableSlots(odontologoId: string, fecha: string): Promise<SlotDto[]> {
  const response = await fetch(`${API_BASE_URL}/disponibilidad/slots?odontologoId=${odontologoId}&fecha=${fecha}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error al consultar slots disponibles (${response.status}): ${errorText || response.statusText}`)
  }
  return response.json()
}

/**
 * Consulta ausencias de un odontólogo.
 */
export async function getDoctorAbsences(odontologoId: string): Promise<AusenciaDto[]> {
  const response = await fetch(`${API_BASE_URL}/disponibilidad/ausencias?odontologoId=${odontologoId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error al obtener ausencias (${response.status}): ${errorText || response.statusText}`)
  }
  return response.json()
}

/**
 * Registra una ausencia de odontólogo.
 */
export async function createDoctorAbsence(odontologoId: string, dto: { inicioEn: string; finEn: string; motivo?: string; tipo?: string }): Promise<AusenciaDto> {
  const response = await fetch(`${API_BASE_URL}/disponibilidad/ausencias?odontologoId=${odontologoId}`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dto),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error al registrar ausencia (${response.status}): ${errorText || response.statusText}`)
  }
  return response.json()
}

/**
 * Elimina una ausencia.
 */
export async function deleteDoctorAbsence(ausenciaId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/disponibilidad/ausencias/${ausenciaId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error al eliminar ausencia (${response.status}): ${errorText || response.statusText}`)
  }
}
