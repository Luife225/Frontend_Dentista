import { apiClient } from './apiClient'

export interface CoroVozAnswer {
  intent: string
  answer: string
  route: string
  targetLabel: string
  understood: boolean
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
}

export function askCoroVoz(text: string, signal?: AbortSignal) {
  return apiClient<CoroVozAnswer>('/corovoz/general', { method: 'POST', body: JSON.stringify({ text }), signal })
}

export function interpretDentalCommand(text: string, signal?: AbortSignal) {
  return apiClient<DentalInterpretation>('/corovoz/odontograma/interpretar', { method: 'POST', body: JSON.stringify({ text }), signal })
}
