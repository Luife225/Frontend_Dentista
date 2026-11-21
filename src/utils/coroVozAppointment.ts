import type { CoroVozAppointmentDraft } from '../services/coroVozService'

/** Router state is input, so validate it before opening a form. It never submits the form. */
export function readCoroVozAppointment(value: unknown): CoroVozAppointmentDraft | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const draft = value as Record<string, unknown>
  if (draft.date != null && draft.date !== '') {
    if (typeof draft.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return null
    const date = new Date(`${draft.date}T12:00:00Z`)
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== draft.date) return null
  }
  if (draft.time != null && draft.time !== '' && (typeof draft.time !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.time))) return null
  if (draft.patientId != null && (typeof draft.patientId !== 'string' || !/^[1-9]\d{0,17}$/.test(draft.patientId))) return null
  if (draft.dentistId != null && (typeof draft.dentistId !== 'string' || !/^[1-9]\d{0,17}$/.test(draft.dentistId))) return null
  if (draft.reason != null && (typeof draft.reason !== 'string' || draft.reason.length > 500)) return null
  if (draft.modality != null && !['PRESENCIAL', 'VIRTUAL'].includes(String(draft.modality))) return null
  if (draft.updatedFields != null && (!Array.isArray(draft.updatedFields) || draft.updatedFields.some(field => typeof field !== 'string'))) return null
  for (const field of ['dentistSearch', 'serviceSearch']) {
    if (draft[field] != null && (typeof draft[field] !== 'string' || (draft[field] as string).length > 200)) return null
  }
  return { date: draft.date as string || null, time: draft.time as string || null, patientId: draft.patientId as string || null,
    reason: draft.reason as string ?? null, modality: draft.modality as CoroVozAppointmentDraft['modality'] ?? null,
    ...(draft.dentistId !== undefined ? { dentistId: draft.dentistId as string | null } : {}),
    ...(draft.dentistSearch !== undefined ? { dentistSearch: draft.dentistSearch as string | null } : {}),
    ...(draft.serviceSearch !== undefined ? { serviceSearch: draft.serviceSearch as string | null } : {}),
    ...(Array.isArray(draft.updatedFields) ? { updatedFields: draft.updatedFields as string[] } : {}),
    ...(Array.isArray(draft.missingFields) ? { missingFields: draft.missingFields.filter(field => typeof field === 'string') } : {}) }
}

export const APPOINTMENT_FIELDS = ['date', 'time', 'patientId', 'dentistId', 'reason', 'modality'] as const
export type AppointmentField = typeof APPOINTMENT_FIELDS[number]

/** Explicit candidate selection takes precedence over an incomplete or older form. */
export function appointmentRequestPatient(draft: CoroVozAppointmentDraft | null, patientId: string | null, confirmed: boolean): string | null {
  return confirmed ? patientId : draft ? draft.patientId : patientId
}

/** Only server-declared fields may change an existing draft. No persistence happens here. */
export function mergeAppointmentDraft(current: CoroVozAppointmentDraft | null, next: CoroVozAppointmentDraft): CoroVozAppointmentDraft {
  if (!current) return next
  const merged = { ...current }
  for (const field of APPOINTMENT_FIELDS) {
    if (next.updatedFields?.includes(field)) Object.assign(merged, { [field]: next[field] ?? null })
  }
  return { ...merged, dentistSearch: next.dentistSearch, serviceSearch: next.serviceSearch,
    missingFields: next.missingFields, updatedFields: next.updatedFields }
}

export interface AppointmentSession { draft: CoroVozAppointmentDraft | null; revision: number }
export type AppointmentEvent = { type: 'response'; value: unknown; expectedRevision: number }
  | { type: 'edit'; patch: Partial<CoroVozAppointmentDraft> } | { type: 'close' }

/** Pure session transition. A response is consumed once and cannot outlive an edit or cancellation. */
export function updateAppointmentSession(current: AppointmentSession, event: AppointmentEvent): AppointmentSession {
  if (event.type === 'close') return { draft: null, revision: current.revision + 1 }
  if (event.type === 'edit') {
    if (!current.draft) return current
    const draft = readCoroVozAppointment({ ...current.draft, ...event.patch })
    return draft ? { draft, revision: current.revision + 1 } : current
  }
  if (event.expectedRevision !== current.revision) return current
  const next = readCoroVozAppointment(event.value)
  return next ? { draft: mergeAppointmentDraft(current.draft, next), revision: current.revision + 1 } : current
}

export function mergeAppointmentReply(previous: string, next: string): string {
  // A clarified time replaces the ambiguous one instead of creating two competing times.
  const clock = /\ba las?\s+(?:\d{1,2}|una?|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)(?::\d{2}|\s+y\s+(?:media|cuarto|\d{1,2}))?\s*(?:[ap]\.?\s*m\.?|de la (?:mañana|tarde|noche))?/gi
  return `${/\ba las?\b/i.test(next) ? previous.replace(clock, '') : previous}. ${next}`.trim()
}
