import { API_BASE_URL, getAuthHeaders } from './apiClient'

export interface HallazgoDto {
  id?: string
  codigoPiezaDental: number
  codigoSuperficieCara: string
  codigoCondicion: string
  notaObservacion?: string
}

export interface OdontogramaVersionDto {
  id?: string
  pacienteId: string
  numeroVersion: number
  estado: 'BORRADOR' | 'CONFIRMADO'
  fechaCreacion?: string
  fechaConfirmacion?: string
  firmadoPorId?: string
  firmadoPorNombre?: string
  hallazgos: HallazgoDto[]
}

export interface SaveDraftDto {
  hallazgos: HallazgoDto[]
  observacionGeneral?: string
}

export interface ConfirmDto {
  observacionConfirmacion?: string
}

/**
 * Consulta la versión vigente del paciente (borrador si existe, o última confirmada).
 */
export async function getCurrentOdontogram(pacienteId: string): Promise<OdontogramaVersionDto> {
  const response = await fetch(`${API_BASE_URL}/odontograma/paciente/${pacienteId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error al obtener odontograma (${response.status}): ${errorText || response.statusText}`)
  }
  return response.json()
}

/**
 * Consulta el historial de versiones del paciente.
 */
export async function getOdontogramHistory(pacienteId: string): Promise<OdontogramaVersionDto[]> {
  const response = await fetch(`${API_BASE_URL}/odontograma/paciente/${pacienteId}/historial`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error al obtener historial de odontograma: ${errorText || response.statusText}`)
  }
  return response.json()
}

/**
 * Guarda o actualiza el borrador activo del odontograma.
 */
export async function saveOdontogramDraft(pacienteId: string, payload: SaveDraftDto): Promise<OdontogramaVersionDto> {
  const response = await fetch(`${API_BASE_URL}/odontograma/paciente/${pacienteId}/borrador`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error al guardar borrador de odontograma: ${errorText || response.statusText}`)
  }
  return response.json()
}

/**
 * Confirma la versión activa haciéndola inmutable.
 */
export async function confirmOdontogramVersion(versionId: string, payload: ConfirmDto = {}): Promise<OdontogramaVersionDto> {
  const response = await fetch(`${API_BASE_URL}/odontograma/versiones/${versionId}/confirmar`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error al confirmar versión de odontograma: ${errorText || response.statusText}`)
  }
  return response.json()
}

/**
 * Genera una nueva versión correctiva a partir de la versión confirmada.
 */
export async function createCorrectionVersion(versionId: string, payload: SaveDraftDto): Promise<OdontogramaVersionDto> {
  const response = await fetch(`${API_BASE_URL}/odontograma/versiones/${versionId}/nueva-version`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error al crear nueva versión de odontograma: ${errorText || response.statusText}`)
  }
  return response.json()
}
