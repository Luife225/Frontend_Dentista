import type { DentalProposal } from '../services/coroVozService'
import { normalizeCoroVoz } from './coroVozConversation'

export type DentalField = 'piece' | 'condition' | 'note' | 'surface'
export type DentalDraft = Omit<DentalProposal, 'piece' | 'condition'> & {
  piece: number | null; condition: DentalProposal['condition'] | null
}
export interface DentalDialog {
  action: 'edit' | 'remove'
  field?: DentalField
  draft: DentalDraft
}
export const DENTAL_LABELS = { SANO: 'Sano', CARIES: 'Caries', RESTAURADO: 'Restauración', CORONA: 'Corona', EXTRAIDO: 'Extraído', ENDODONCIA: 'Endodoncia', IMPLANTE: 'Implante', FRACTURA: 'Fractura' }
export const FIELD_LABELS: Record<DentalField, string> = { piece: 'diente', condition: 'condición', note: 'observación', surface: 'cara' }

export function dentalField(text: string): DentalField | 'all' | null {
  const value = normalizeCoroVoz(text).replace(/^(?:el|la|las|los) /, '')
  if (/^(?:diente|pieza)(?: dental)?$/.test(value)) return 'piece'
  if (/^condicion$/.test(value)) return 'condition'
  if (/^(?:observacion|observaciones|nota|notas)$/.test(value)) return 'note'
  if (/^(?:cara|superficie)$/.test(value)) return 'surface'
  if (/^(?:todo|toda la propuesta|propuesta completa|todo el borrador)$/.test(value)) return 'all'
  return null
}

export function dentalFieldAction(text: string) {
  const value = normalizeCoroVoz(text).replace(/^corovoz /, '').replace(/^por favor /, '').replace(/ por favor$/, '')
  const match = value.match(/^(editar|edita|corregir|corrige|eliminar|elimina|borrar|borra|quitar|quita) (.+)$/)
  const field = match && dentalField(match[2])
  return match && field ? { action: /^(editar|edita|corregir|corrige)$/.test(match[1]) ? 'edit' as const : 'remove' as const, field } : null
}

export function describeDentalDraft(draft: DentalDraft) {
  return `Propuesta de hallazgo: ${draft.piece ? `pieza ${draft.piece}` : 'diente pendiente'}, ${draft.condition ? DENTAL_LABELS[draft.condition] : 'condición pendiente'}, cara ${draft.surface.toLowerCase()}. ${draft.note ? `Observación: ${draft.note}` : 'Sin observación.'}`
}

export function dentalDraftFragment(draft: DentalDraft) {
  return [draft.piece ? `pieza ${draft.piece}` : '', draft.condition ? DENTAL_LABELS[draft.condition] : '', `cara ${draft.surface.toLowerCase()}`].filter(Boolean).join(' ') + (draft.note ? `. Observación: ${draft.note}` : '')
}
