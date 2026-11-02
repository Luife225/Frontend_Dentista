import type { DentalProposal } from '../services/coroVozService'

export type DentalFinding = { condition: string; note?: string }

/** Changes the visible draft only; the odontogram saves it after explicit approval. */
export function applyDentalFinding(findings: Map<string, DentalFinding>, proposal: DentalProposal): Map<string, DentalFinding> {
  const next = new Map(findings)
  const generalKey = `${proposal.piece}:GENERAL`
  const faces = ['OCLUSAL', 'VESTIBULAR', 'LINGUAL', 'MESIAL', 'DISTAL']
  if (proposal.surface === 'GENERAL') {
    for (const face of faces) next.delete(`${proposal.piece}:${face}`)
  } else {
    const general = next.get(generalKey)
    if (general) {
      for (const face of faces) {
        if (face !== proposal.surface) next.set(`${proposal.piece}:${face}`, { ...general })
      }
    }
    next.delete(generalKey)
  }
  const key = `${proposal.piece}:${proposal.surface}`
  if (proposal.condition === 'SANO') next.delete(key)
  else next.set(key, { condition: proposal.condition, note: proposal.note || undefined })
  return next
}
