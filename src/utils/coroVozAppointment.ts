import type { CoroVozAppointmentDraft } from '../services/coroVozService'

/** Router state is input, so validate it before opening a form. It never submits the form. */
export function readCoroVozAppointment(value: unknown): CoroVozAppointmentDraft | null {
  if (!value || typeof value !== 'object') return null
  const draft = value as Record<string, unknown>
  if (typeof draft.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(draft.date)
      || typeof draft.time !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.time)) return null
  const date = new Date(`${draft.date}T12:00:00Z`)
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== draft.date) return null
  if (draft.patientId != null && (typeof draft.patientId !== 'string' || !/^[1-9]\d{0,17}$/.test(draft.patientId))) return null
  if (typeof draft.reason !== 'string' || draft.reason.length > 500 || !['PRESENCIAL', 'VIRTUAL'].includes(String(draft.modality))) return null
  return { date: draft.date, time: draft.time, patientId: draft.patientId as string | null,
    reason: draft.reason, modality: draft.modality as CoroVozAppointmentDraft['modality'] }
}

export function mergeAppointmentReply(previous: string, next: string): string {
  // A clarified time replaces the ambiguous one instead of creating two competing times.
  const clock = /\ba las?\s+(?:\d{1,2}|una?|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)(?::\d{2}|\s+y\s+(?:media|cuarto|\d{1,2}))?\s*(?:[ap]\.?\s*m\.?|de la (?:mañana|tarde|noche))?/gi
  return `${/\ba las?\b/i.test(next) ? previous.replace(clock, '') : previous}. ${next}`.trim()
}
