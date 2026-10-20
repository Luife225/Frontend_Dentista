import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/utils/coroVozAudio.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText
const { encodeCoroVozWav } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

// Señal conocida a 44.1/48 kHz: comprueba que el backend recibe duración, tono y amplitud válidos.
for (const rate of [16000, 44100, 48000]) {
  const samples = Float32Array.from({ length: rate / 2 }, (_, i) => Math.sin(2 * Math.PI * 1000 * i / rate) * 0.5)
  const blob = encodeCoroVozWav([samples.slice(0, 5000), samples.slice(5000)], rate)
  const bytes = await blob.arrayBuffer()
  const wav = new DataView(bytes)
  assert.equal(new TextDecoder().decode(bytes.slice(0, 4)), 'RIFF')
  assert.equal(wav.getUint32(24, true), 16000)
  assert.equal(wav.getUint16(22, true), 1)
  assert.equal(wav.getUint16(34, true), 16)
  assert.equal(bytes.byteLength, 16044)
  let crossings = 0, energy = 0, previous = 0
  for (let i = 44; i < bytes.byteLength; i += 2) {
    const value = wav.getInt16(i, true) / 32768
    if (value > 0 && previous <= 0) crossings++
    previous = value
    energy += value * value
  }
  assert.ok(Math.abs(crossings - 500) <= 2, `Frecuencia alterada al convertir ${rate} Hz`)
  assert.ok(Math.sqrt(energy / 8000) > 0.3, `Amplitud insuficiente desde ${rate} Hz`)
}
assert.throws(() => encodeCoroVozWav([], 0))
console.log('Audio correcto: PCM16 mono a 16 kHz, duración, tono y amplitud verificados en tres frecuencias de entrada.')
