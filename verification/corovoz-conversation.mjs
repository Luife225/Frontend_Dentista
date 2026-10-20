import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/utils/coroVozConversation.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText
const { normalizeCoroVoz, mergeDentalDictation, stripSendCommand, isCoroVozControl } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

assert.equal(normalizeCoroVoz('¡Coro Voz, correcto!'), 'corovoz correcto')
assert.equal(mergeDentalDictation('pieza 14', 'corona'), 'pieza 14 corona')
assert.equal(mergeDentalDictation('caries oclusal', 'pieza treinta y seis'), 'caries oclusal pieza treinta y seis')
assert.equal(mergeDentalDictation('pieza 14', 'corona en pieza quince'), 'corona en pieza quince')
assert.equal(mergeDentalDictation('caries', 'corona en pieza catorce'), 'corona en pieza catorce')
assert.equal(stripSendCommand('Corona en pieza catorce. CoroVoz enviar.'), 'Corona en pieza catorce.')
assert.equal(stripSendCommand('Coro voz correcto'), 'Coro voz correcto')
assert.equal(stripSendCommand('Caries en pieza 36. Nota: listo.'), 'Caries en pieza 36. Nota: listo.')
for (const command of ['Coro voz correcto.', 'Prender CoroVoz', 'CoroVoz terminado', 'activar corovoz', 'CoroVoz editar']) assert.ok(isCoroVozControl(command))
assert.equal(isCoroVozControl('¿Qué hace CoroVoz?'), false)
console.log('Conversación correcta: fragmentos, correcciones, números dictados y comandos de control.')
