import { apiClient, API_BASE_URL, getAuthHeaders, ApiError } from './apiClient'

export interface AttachmentDto {
  id: string
  clinicaId: string
  pacienteId: string
  subidoPorUsuarioId: string
  subidoPorNombre?: string | null
  citaId?: string | null
  tipoArchivo: string
  claveAlmacenamiento: string
  nombreOriginal: string
  tipoMime: string
  pesoBytes: number
  regionAnatomica?: string | null
  esVisiblePaciente: boolean
  fechaCreacion: string
  downloadUrl: string
  iaEstadoRevision?: string | null
}

export interface UploadAttachmentPayload {
  file: File
  pacienteId: string
  tipoArchivo?: string
  regionAnatomica?: string
  citaId?: string
  esVisiblePaciente?: boolean
}

/**
 * Consulta la lista de archivos de un paciente específico (Personal clínico / Paciente verificado)
 */
export async function getAttachmentsByPatient(patientId: string): Promise<AttachmentDto[]> {
  if (!patientId) return []
  return apiClient<AttachmentDto[]>(`/attachments/patient/${patientId}`)
}

/**
 * Consulta la lista de archivos compartidos del paciente autenticado (Portal Paciente)
 */
export async function getMyAttachments(): Promise<AttachmentDto[]> {
  return apiClient<AttachmentDto[]>('/attachments/me')
}

/**
 * Carga un archivo binario al almacenamiento durable con compensación de metadatos
 */
export async function uploadAttachment(payload: UploadAttachmentPayload): Promise<AttachmentDto> {
  const formData = new FormData()
  formData.append('file', payload.file)
  formData.append('pacienteId', payload.pacienteId)
  if (payload.tipoArchivo) {
    formData.append('tipoArchivo', payload.tipoArchivo)
  }
  if (payload.regionAnatomica) {
    formData.append('regionAnatomica', payload.regionAnatomica)
  }
  if (payload.citaId) {
    formData.append('citaId', payload.citaId)
  }
  if (payload.esVisiblePaciente !== undefined) {
    formData.append('esVisiblePaciente', String(payload.esVisiblePaciente))
  }

  return apiClient<AttachmentDto>('/attachments/upload', {
    method: 'POST',
    body: formData,
  })
}

/**
 * Modifica la visibilidad de un archivo clínico para el paciente (compartir o revocar)
 */
export async function updateAttachmentVisibility(id: string, esVisiblePaciente: boolean): Promise<AttachmentDto> {
  return apiClient<AttachmentDto>(`/attachments/${id}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ esVisiblePaciente }),
  })
}

/**
 * Atajo directo para publicar un archivo
 */
export async function publishAttachment(id: string): Promise<AttachmentDto> {
  return apiClient<AttachmentDto>(`/attachments/${id}/publicar`, {
    method: 'POST',
  })
}

/**
 * Atajo directo para revocar el acceso del paciente a un archivo
 */
export async function revokeAttachment(id: string): Promise<AttachmentDto> {
  return apiClient<AttachmentDto>(`/attachments/${id}/revocar`, {
    method: 'POST',
  })
}

/**
 * Descarga el binario a través del proxy autenticado y retorna un Blob listo para previsualización o guardado
 */
export async function downloadAttachmentBlob(id: string): Promise<{ blob: Blob; filename: string; contentType: string }> {
  const url = `${API_BASE_URL}/attachments/${id}/download`
  const headers = getAuthHeaders()

  const response = await fetch(url, { headers })
  if (!response.ok) {
    let msg = `Error al descargar el archivo (${response.status})`
    try {
      const err = await response.json()
      msg = err.message || msg
    } catch {
      // Ignorar fallo de parseo
    }
    throw new ApiError(response.status, msg)
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream'
  const disposition = response.headers.get('content-disposition') || ''
  let filename = `archivo_${id}`
  const match = disposition.match(/filename="?([^";]+)"?/)
  if (match && match[1]) {
    filename = match[1].trim()
  }

  const blob = await response.blob()
  return { blob, filename, contentType }
}

/**
 * Formatea el peso en bytes a una representación legible
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
