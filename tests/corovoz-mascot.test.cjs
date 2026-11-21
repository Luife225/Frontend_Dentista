const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const vm = require('node:vm')
const { createHash } = require('node:crypto')

const file = path.join(__dirname, '../src/utils/coroVozMascot.ts')
const moduleState = { exports: {} }
vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: moduleState.exports })
const { resolveMascotState, MASCOT_ASSETS } = moduleState.exports
const idle = { expanded: true, speaking: false, processing: false, listening: false, error: false, awaitingAnswer: false, success: false }

test('mascota: muestra las ocho situaciones sin inventar actividad', () => {
  assert.equal(resolveMascotState(idle), 'idle')
  for (const [field, state] of [['speaking', 'speaking'], ['processing', 'thinking'], ['listening', 'listening'], ['error', 'error'], ['awaitingAnswer', 'choosing'], ['success', 'success']]) {
    assert.equal(resolveMascotState({ ...idle, [field]: true }), state)
  }
  assert.equal(resolveMascotState({ ...idle, expanded: false }), 'minimized')
})

test('mascota: hablar y grabar prevalecen sobre confirmaciones y preguntas pendientes', () => {
  assert.equal(resolveMascotState({ ...idle, speaking: true, processing: true, error: true }), 'speaking')
  assert.equal(resolveMascotState({ ...idle, listening: true, awaitingAnswer: true, success: true }), 'listening')
  assert.equal(resolveMascotState({ ...idle, processing: true, awaitingAnswer: true }), 'thinking')
  assert.equal(resolveMascotState({ ...idle, awaitingAnswer: true, success: true }), 'choosing')
  assert.equal(resolveMascotState({ ...idle, error: true, success: true }), 'error')
  assert.equal(resolveMascotState({ ...idle, expanded: false, speaking: true, processing: true }), 'minimized')
})

test('mascota: ocho recursos independientes y presupuesto de descarga ligero', () => {
  const files = Object.values(MASCOT_ASSETS)
  assert.equal(new Set(files).size, 8)
  const total = files.reduce((sum, name) => sum + fs.statSync(path.join(__dirname, '../public/images/coronix-states', name)).size, 0)
  assert.ok(total < 512 * 1024, `Los ocho estados pesan ${total} bytes; presupuesto total 512 KiB`)
})

test('mascota: cada expresión tiene contenido distinto, transparencia y tamaño uniforme', () => {
  const fingerprints = new Set()
  for (const name of Object.values(MASCOT_ASSETS)) {
    const bytes = fs.readFileSync(path.join(__dirname, '../public/images/coronix-states', name))
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', `${name}: contenedor inválido`)
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', `${name}: debe ser WebP`)
    assert.equal(bytes.toString('ascii', 12, 16), 'VP8X', `${name}: falta cabecera de transparencia`)
    assert.ok(bytes[20] & 0x10, `${name}: se perdió el canal alfa`)
    assert.equal(bytes.readUIntLE(24, 3) + 1, 320, `${name}: ancho inconsistente`)
    assert.equal(bytes.readUIntLE(27, 3) + 1, 320, `${name}: alto inconsistente`)
    fingerprints.add(createHash('sha256').update(bytes).digest('hex'))
  }
  assert.equal(fingerprints.size, 8, 'Cada expresión debe usar un recurso distinto; no reutilizar la hoja completa')
})
