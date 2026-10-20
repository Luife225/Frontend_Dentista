import { apiClient, ApiError } from './apiClient'

export interface CoroVozAnswer {
  intent: string
  answer: string
  route: string
  targetLabel: string
  understood: boolean
  patients: { id: string; name: string; documentHint: string }[]
  patientId: string | null
  patientName: string | null
}

export interface DentalProposal {
  piece: number
  surface: 'GENERAL' | 'OCLUSAL' | 'VESTIBULAR' | 'LINGUAL' | 'MESIAL' | 'DISTAL'
  condition: 'CARIES' | 'RESTAURADO' | 'CORONA' | 'EXTRAIDO' | 'ENDODONCIA' | 'IMPLANTE' | 'FRACTURA'
  note: string
}

export interface DentalInterpretation {
  understood: boolean
  message: string
  proposal: DentalProposal | null
  incomplete: boolean
  fragment: string
}

export function askCoroVoz(text: string, signal?: AbortSignal, patientId?: string | null) {
  return corovozRequest<CoroVozAnswer>('/general', { method: 'POST', body: JSON.stringify({ text, patientId }), signal })
}

export function interpretDentalCommand(text: string, signal?: AbortSignal) {
  return corovozRequest<DentalInterpretation>('/odontograma/interpretar', { method: 'POST', body: JSON.stringify({ text }), signal })
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
    if (error instanceof ApiError && error.status === 404) throw new Error('El backend activo todavía no tiene CoroVoz. Reinicia el backend de feature/AlanAguilera y vuelve a intentar.')
    throw error
  }
}
