import { apiClient, API_BASE_URL, getAuthHeaders, ApiError } from './apiClient'

export interface AttachmentDto {
  id: string
  clinicaId: string
  pacienteId: string
  subidoPorUsuarioId: string
  subidoPorNombre?: string | null
  citaId?: string | null
  tipoArchivo: string
  ambito?: string | null
  claveAlmacenamiento: string
  nombreOriginal: string
  tipoMime: string
  pesoBytes: number
  regionAnatomica?: string | null
  esVisiblePaciente: boolean
  fechaCreacion: string
  downloadUrl: string
  iaEstadoRevision?: string | null
  iaNombreModelo?: string | null
  iaVersionModelo?: string | null
  iaRevisadoPorId?: string | null
  iaRevisadoPorNombre?: string | null
  iaHallazgos?: any | null
}

export interface MlBboxPixels {
  xMin: number
  yMin: number
  xMax: number
  yMax: number
}

export interface MlFindingItem {
  findingId: string
  finding_id?: string
  classId: number
  class_id?: number
  className: string
  class_name?: string
  originalClassId: number
  original_class_id?: number
  originalClassName: string
  original_class_name?: string
  score: number
  bboxPixels: MlBboxPixels
  bbox_pixels?: MlBboxPixels
  originalBboxPixels: MlBboxPixels
  original_bbox_pixels?: MlBboxPixels
  reviewStatus: 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | 'CORREGIDO' | string
  review_status?: string
  clinicalNote?: string | null
  clinical_note?: string | null
  reviewedByUsuarioClinicaId?: string | null
  reviewed_by_usuario_clinica_id?: string | null
  reviewedByNombre?: string | null
  reviewed_by_nombre?: string | null
  reviewedAtUtc?: string | null
  reviewed_at_utc?: string | null
}

export interface MlReviewPayload {
  findingId?: string
  decision?: 'ACEPTADO' | 'RECHAZADO' | 'CORREGIDO' | string
  correctedClassName?: 'caries' | 'caries_profunda' | string
  correctedBboxPixels?: MlBboxPixels
  clinicalNote?: string
  reviews?: Array<{
    findingId: string
    decision: string
    correctedClassName?: string
    correctedBboxPixels?: MlBboxPixels
    clinicalNote?: string
  }>
  overallDecision?: 'ACEPTADO' | 'RECHAZADO' | 'CORREGIDO' | string
  overallClinicalNote?: string
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
 * Fase I/J: Ejecuta el análisis asistido de caries con el modelo ML (YOLOv8n)
 */
export async function analyzeAttachmentMl(id: string, threshold: number = 0.25): Promise<AttachmentDto> {
  return apiClient<AttachmentDto>(`/attachments/${id}/analyze-ml?threshold=${encodeURIComponent(threshold)}`, {
    method: 'POST',
  })
}

/**
 * Fase I/J: Registra la revisión odontológica (ACEPTADO, RECHAZADO, CORREGIDO)
 */
export async function reviewAttachmentMl(id: string, payload: MlReviewPayload): Promise<AttachmentDto> {
  return apiClient<AttachmentDto>(`/attachments/${id}/review-ml`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
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
