import { API_BASE_URL, getAuthHeaders } from './apiClient'

export interface ClinicDto {
  id?: string
  nombre: string
  razonSocial?: string
  zonaHoraria?: string
  estado?: string
  ruc?: string
  telefono?: string
  correo?: string
  ciudad?: string
  direccion?: string
  fechaCreacion?: string
  fechaActualizacion?: string
}

export interface UpdateClinicDto {
  nombre?: string
  razonSocial?: string
  zonaHoraria?: string
  ruc?: string
  telefono?: string
  correo?: string
  ciudad?: string
  direccion?: string
}

/**
 * Consulta los datos reales de la clínica/consultorio activo.
 */
export async function getClinicProfile(): Promise<ClinicDto> {
  const response = await fetch(`${API_BASE_URL}/clinic`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error al cargar datos del consultorio (${response.status}): ${errorText || response.statusText}`)
  }
  return response.json()
}

/**
 * Actualiza los datos editables del consultorio.
 */
export async function updateClinicProfile(dto: UpdateClinicDto): Promise<ClinicDto> {
  const response = await fetch(`${API_BASE_URL}/clinic`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dto),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error al guardar datos del consultorio (${response.status}): ${errorText || response.statusText}`)
  }
  return response.json()
}
