import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
const source = await readFile(new URL('../src/utils/coroVozAppointment.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { readCoroVozAppointment, mergeAppointmentReply } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
const draft = { date: '2026-10-28', time: '15:30', patientId: '12', reason: 'Control', modality: 'PRESENCIAL' }
assert.deepEqual(readCoroVozAppointment(draft), draft)
for (const patch of [{ date: '2026-02-30' }, { time: '24:00' }, { patientId: '-1' }, { reason: 'a'.repeat(501) }, { modality: 'INVALID' }]) {
  assert.equal(readCoroVozAppointment({ ...draft, ...patch }), null)
}
assert.equal(readCoroVozAppointment(null), null)
const merged = mergeAppointmentReply('Agenda una cita para Carlos Gamboa mañana a las tres', 'a las 15:00')
assert.equal((merged.match(/a las/g) || []).length, 1)
assert.ok(merged.includes('Carlos Gamboa'))
console.log('Citas: borrador validado y aclaración de hora conserva paciente y fecha.')
