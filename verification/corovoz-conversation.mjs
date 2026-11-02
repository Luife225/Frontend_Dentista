import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/utils/coroVozConversation.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText
const { normalizeCoroVoz, mergeDentalDictation, stripSendCommand, isCoroVozControl, dentalVoiceControl, coroVozChoiceIndex, resolvePatientReply } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

assert.equal(normalizeCoroVoz('¡Coro Voz, correcto!'), 'corovoz correcto')
assert.equal(mergeDentalDictation('pieza 14', 'corona'), 'pieza 14 corona')
assert.equal(mergeDentalDictation('caries oclusal', 'pieza treinta y seis'), 'caries oclusal pieza treinta y seis')
assert.equal(mergeDentalDictation('pieza 14', 'corona en pieza quince'), 'corona en pieza quince')
assert.equal(mergeDentalDictation('caries', 'corona en pieza catorce'), 'corona en pieza catorce')
assert.equal(stripSendCommand('Corona en pieza catorce. CoroVoz enviar.'), 'Corona en pieza catorce.')
assert.equal(stripSendCommand('Coro voz correcto'), 'Coro voz correcto')
assert.equal(stripSendCommand('Caries en pieza 36. Nota: listo.'), 'Caries en pieza 36. Nota: listo.')
for (const command of ['Coro voz correcto.', 'Prender CoroVoz', 'CoroVoz terminado', 'activar corovoz', 'CoroVoz editar', 'Confirmar', 'Borrar', 'CoroVoz guardar borrador']) assert.ok(isCoroVozControl(command))
assert.equal(mergeDentalDictation('diente 36', 'está sano'), 'diente 36 está sano')
assert.equal(isCoroVozControl('¿Qué hace CoroVoz?'), false)
assert.equal(coroVozChoiceIndex('La primera', 3), 0)
assert.equal(coroVozChoiceIndex('opción dos', 3), 1)
assert.equal(coroVozChoiceIndex('tercera', 2), null)
assert.equal(coroVozChoiceIndex('quiero una cita', 3), null)
const pending = { question: '¿Castillo tiene alergias registradas?', choices: [
  { id: '1', name: 'Sofía Castillo', documentHint: 'Documento termina en 1234' },
  { id: '2', name: 'Ana Castillo', documentHint: 'Documento termina en 5678' },
] }
assert.equal(resolvePatientReply('sí', pending), null)
assert.equal(resolvePatientReply('la segunda', pending)?.id, '2')
assert.equal(resolvePatientReply('Sofía', pending)?.id, '1')
assert.equal(resolvePatientReply('Sí, Sofía Castillo', pending)?.id, '1')
assert.equal(resolvePatientReply('Castillo', pending), null)
assert.equal(resolvePatientReply('¿Cómo abro la agenda?', pending), null)
assert.equal(resolvePatientReply('sí', { ...pending, choices: [pending.choices[0]] })?.id, '1')
assert.equal(coroVozChoiceIndex('la sexta', 6), 5)
assert.equal(pending.question, '¿Castillo tiene alergias registradas?')
assert.equal(resolvePatientReply('ella', pending), null)
assert.equal(resolvePatientReply('sí ella', { ...pending, choices: [pending.choices[0]] })?.id, '1')
assert.equal(mergeDentalDictation('pieza 18 cara oclusal. Observación: control en 2 semanas', 'restauración'), 'pieza 18 cara oclusal restauración. Observación: control en 2 semanas')
assert.equal(mergeDentalDictation('pieza 18 caries cara oclusal', 'restauración'), 'pieza 18 cara oclusal restauración')
assert.equal(mergeDentalDictation('pieza 18 caries cara oclusal', 'cara distal'), 'pieza 18 caries cara distal')
assert.equal(mergeDentalDictation('pieza 18 caries. Observación: antigua', 'observación nueva'), 'pieza 18 caries. Observación: nueva')
assert.equal(mergeDentalDictation('pieza 18 caries. Observación: control en 2 semanas', 'pieza 26 fracturada'), 'pieza 26 fracturada')
assert.equal(coroVozChoiceIndex('la octava', 8), 7)
for (const [text, expected] of [['confirmar', 'confirm'], ['Corovoz edita por favor', 'edit'], ['eliminar la propuesta', 'discard'], ['repite lo que dije', 'repeat'], ['guarda el borrador', 'save']]) {
  assert.equal(dentalVoiceControl(text), expected)
  assert.equal(isCoroVozControl(text), true)
}
for (const text of ['no confirmar', 'quizás eliminar', 'observación: confirmar después', 'editar y confirmar', 'caries en el diente']) assert.equal(dentalVoiceControl(text), null)
console.log('Conversación correcta: fragmentos, correcciones, números dictados y comandos de control.')

const dialogSource = await readFile(new URL('../src/utils/coroVozDentalDialog.ts', import.meta.url), 'utf8')
const dialogCompiled = ts.transpileModule(dialogSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText
  .replace("'./coroVozConversation'", `'data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}'`)
const { dentalField, dentalFieldAction, describeDentalDraft } = await import(`data:text/javascript;base64,${Buffer.from(dialogCompiled).toString('base64')}`)
for (const [text, action, field] of [['editar diente', 'edit', 'piece'], ['editar la condición', 'edit', 'condition'], ['editar observaciones', 'edit', 'note'], ['eliminar todo', 'remove', 'all'], ['borrar la observación', 'remove', 'note']]) {
  assert.deepEqual(dentalFieldAction(text), { action, field })
}
for (const text of ['no editar diente', 'observación: eliminar todo', 'editar diente y condición']) assert.equal(dentalFieldAction(text), null)
assert.equal(dentalField('la pieza'), 'piece')
assert.equal(dentalField('las observaciones'), 'note')
const repeated = describeDentalDraft({ piece: 15, condition: 'CORONA', surface: 'MESIAL', note: 'diente caído' })
assert.equal(repeated, 'Propuesta de hallazgo: pieza 15, Corona, cara mesial. Observación: diente caído')
assert.match(describeDentalDraft({ piece: null, condition: null, surface: 'GENERAL', note: '' }), /diente pendiente, condición pendiente/)
let progressive = mergeDentalDictation('pieza 15', 'cara mesial')
progressive = mergeDentalDictation(progressive, 'observaciones: control en 2 semanas')
progressive = mergeDentalDictation(progressive, 'corona')
assert.equal(progressive, 'pieza 15 cara mesial corona. Observación: control en 2 semanas')
assert.equal(mergeDentalDictation(progressive, 'observaciones: diente caído'), 'pieza 15 cara mesial corona. Observación: diente caído')
