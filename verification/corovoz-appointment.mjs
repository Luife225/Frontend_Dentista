import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
const source = await readFile(new URL('../src/utils/coroVozAppointment.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { readCoroVozAppointment, mergeAppointmentReply, updateAppointmentSession, appointmentRequestPatient } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
const draft = { date: '2026-10-28', time: '15:30', patientId: '12', reason: 'Control', modality: 'PRESENCIAL' }
assert.deepEqual(readCoroVozAppointment(draft), draft)
for (const patch of [{ date: '2026-02-30' }, { time: '24:00' }, { patientId: '-1' }, { reason: 'a'.repeat(501) }, { modality: 'INVALID' }]) {
  assert.equal(readCoroVozAppointment({ ...draft, ...patch }), null)
}
assert.equal(readCoroVozAppointment(null), null)
assert.equal(readCoroVozAppointment([]), null)
const merged = mergeAppointmentReply('Agenda una cita para Carlos Gamboa mañana a las tres', 'a las 15:00')
assert.equal((merged.match(/a las/g) || []).length, 1)
assert.ok(merged.includes('Carlos Gamboa'))

// Exercise the same transition used by the live provider, with response ordering resembling network races.
let session = { draft: null, revision: 0 }
const empty = { date: null, time: null, patientId: null, dentistId: null, reason: null, modality: null }
assert.equal(appointmentRequestPatient(empty, '21', true), '21', 'An explicit patient choice completes the previously ambiguous draft')
assert.equal(appointmentRequestPatient(draft, '21', true), '21', 'A newly confirmed candidate supersedes an older draft patient')
assert.equal(appointmentRequestPatient(empty, '21', false), null, 'A deliberately blank form must not inherit a different conversational patient')
assert.equal(appointmentRequestPatient(null, '21', false), '21', 'The selected screen patient supplies context when no form is open')
session = updateAppointmentSession(session, { type: 'response', value: empty, expectedRevision: 0 })
assert.deepEqual(session.draft, empty, 'An empty request opens a blank form without guessing any field')
const afterOpen = session
assert.equal(updateAppointmentSession(session, { type: 'response', value: draft, expectedRevision: 0 }), afterOpen, 'A duplicate reply is consumed only once')

session = updateAppointmentSession(session, { type: 'response', value: { ...draft, dentistId: '9', updatedFields: ['date', 'time', 'patientId', 'dentistId', 'reason', 'modality'] }, expectedRevision: session.revision })
assert.equal(session.draft.patientId, '12')
const pendingRevision = session.revision
session = updateAppointmentSession(session, { type: 'edit', patch: { time: '16:00', reason: 'Texto revisado manualmente' } })
const manuallyEdited = session
session = updateAppointmentSession(session, { type: 'response', value: { ...draft, updatedFields: ['time', 'reason'] }, expectedRevision: pendingRevision })
assert.equal(session, manuallyEdited, 'A late response cannot overwrite a manual correction')
assert.equal(session.draft.time, '16:00')

session = updateAppointmentSession(session, { type: 'response', value: { ...draft, time: '11:00', updatedFields: ['time'] }, expectedRevision: session.revision })
assert.equal(session.draft.time, '11:00', 'A new explicit correction updates time')
assert.equal(session.draft.reason, 'Texto revisado manualmente', 'Unchanged fields retain manual edits')
assert.equal(session.draft.patientId, '12')
assert.equal(session.draft.dentistId, '9')
session = updateAppointmentSession(session, { type: 'edit', patch: { patientId: null } })
assert.equal(session.draft.patientId, null, 'Clearing a field is preserved for subsequent dialogue')

const beforeCancelRevision = session.revision
session = updateAppointmentSession(session, { type: 'close' })
const cancelled = session
session = updateAppointmentSession(session, { type: 'response', value: draft, expectedRevision: beforeCancelRevision })
assert.equal(session, cancelled, 'A cancelled draft cannot be reopened by a delayed reply')
assert.equal(session.draft, null)
session = updateAppointmentSession(session, { type: 'response', value: { ...draft, date: '2026-02-30' }, expectedRevision: session.revision })
assert.equal(session, cancelled, 'Malformed server data never opens a form')
session = updateAppointmentSession(session, { type: 'response', value: draft, expectedRevision: session.revision })
assert.ok(session.draft, 'A new user request can prepare a draft after cancellation')
// The session has no persistence dependency; preparation can only produce local draft state.
assert.deepEqual(Object.keys(session).sort(), ['draft', 'revision'])
console.log('Citas: campos parciales, correcciones, edición manual, respuestas repetidas/tardías, cancelación y validación aprobadas.')
