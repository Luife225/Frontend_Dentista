import { apiClient, ApiError } from './apiClient'

export interface CoroVozAppointmentDraft {
  date: string
  time: string
  patientId: string | null
  reason: string
  modality: 'PRESENCIAL' | 'VIRTUAL'
}

export interface CoroVozAnswer {
  intent: string
  answer: string
  route: string
  targetLabel: string
  understood: boolean
  patients: { id: string; name: string; documentHint: string }[]
  patientId: string | null
  patientName: string | null
  suggestions: { intent: string; label: string }[]
  appointmentDraft?: CoroVozAppointmentDraft | null
}

export interface DentalProposal {
  piece: number
  surface: 'GENERAL' | 'OCLUSAL' | 'VESTIBULAR' | 'LINGUAL' | 'MESIAL' | 'DISTAL'
  condition: 'SANO' | 'CARIES' | 'RESTAURADO' | 'CORONA' | 'EXTRAIDO' | 'ENDODONCIA' | 'IMPLANTE' | 'FRACTURA'
  note: string
}

export interface DentalInterpretation {
  draft?: (Omit<DentalProposal, 'piece' | 'condition'> & { piece: number | null; condition: DentalProposal['condition'] | null }) | null
  understood: boolean
  message: string
  proposal: DentalProposal | null
  incomplete: boolean
  fragment: string
  selectedPiece: number | null
  correctedFrom: number | null
  contextPiece: number | null
  suggestions: { value: string; label: string }[]
}

export function askCoroVoz(text: string, signal?: AbortSignal, patientId?: string | null, selectedIntent?: string, patientConfirmed = false) {
  return corovozRequest<CoroVozAnswer>('/general', { method: 'POST', body: JSON.stringify({ text, patientId, selectedIntent, patientConfirmed }), signal })
}

export function interpretDentalCommand(text: string, signal?: AbortSignal, contextPiece?: number | null) {
  return corovozRequest<DentalInterpretation>('/odontograma/interpretar', { method: 'POST', body: JSON.stringify({ text, contextPiece }), signal })
}

export function reviseDentalCommand(text: string, field: string, draft: unknown, signal?: AbortSignal) {
  return corovozRequest<DentalInterpretation>('/odontograma/editar', { method: 'POST', body: JSON.stringify({ text, field, draft }), signal })
}

export function getCoroVozStatus() {
  return corovozRequest<{ version: number; speechReady: boolean }>('/status')
}

export function transcribeCoroVoz(wav: Blob, signal?: AbortSignal) {
  return corovozRequest<{ text: string }>('/transcribir', { method: 'POST', headers: { 'Content-Type': 'audio/wav' }, body: wav, signal })
}

async function corovozRequest<T>(path: string, options?: RequestInit): Promise<T> {
  try { return await apiClient<T>(`/corovoz${path}`, options) }
  catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 0) throw new Error('No pude conectar con CoroVoz. Revisa tu conexión e inténtalo de nuevo.')
      if (error.status === 404) throw new Error('CoroVoz no está disponible en este momento. Contacta al administrador.')
      if (error.status === 403) throw new Error('No tienes permiso para usar esta función de CoroVoz.')
      if (error.status === 429) throw new Error('CoroVoz está ocupado. Inténtalo de nuevo en un momento.')
      if (error.status >= 500) throw new Error('CoroVoz no pudo completar la solicitud. Inténtalo de nuevo más tarde.')
    }
    throw error
  }
}
