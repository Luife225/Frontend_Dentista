import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/utils/coroVozDental.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2022 } }).outputText
const { applyDentalFinding } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
const proposal = (piece, surface, condition) => ({ piece, surface, condition, note: '' })

const original = new Map([['36:GENERAL', { condition: 'CARIES' }], ['14:GENERAL', { condition: 'CORONA' }]])
const healthyFace = applyDentalFinding(original, proposal(36, 'OCLUSAL', 'SANO'))
assert.equal(original.get('36:GENERAL').condition, 'CARIES')
assert.equal(healthyFace.has('36:GENERAL'), false)
assert.equal(healthyFace.has('36:OCLUSAL'), false)
for (const face of ['VESTIBULAR', 'LINGUAL', 'MESIAL', 'DISTAL']) assert.equal(healthyFace.get(`36:${face}`).condition, 'CARIES')
assert.equal(healthyFace.get('14:GENERAL').condition, 'CORONA')

const restoredFace = applyDentalFinding(original, proposal(36, 'MESIAL', 'RESTAURADO'))
assert.equal(restoredFace.get('36:MESIAL').condition, 'RESTAURADO')
assert.equal(restoredFace.get('36:OCLUSAL').condition, 'CARIES')

const healthyTooth = applyDentalFinding(restoredFace, proposal(36, 'GENERAL', 'SANO'))
assert.equal([...healthyTooth.keys()].some(key => key.startsWith('36:')), false)
assert.equal(healthyTooth.get('14:GENERAL').condition, 'CORONA')

console.log('Odontograma correcto: sano limpia la cara o pieza indicada sin borrar otras caras ni piezas.')
