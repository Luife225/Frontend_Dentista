/** Keep word endings but omit the long pause used only to decide when to stop. */
export function prepareCoroVozAudio(chunks: Float32Array[], silenceSamples: number): Float32Array[] {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0)
  let remaining = Math.max(0, length - Math.max(0, silenceSamples - 16000 * 0.4))
  const result: Float32Array[] = []
  let peak = 0
  for (const chunk of chunks) {
    const copy = chunk.slice(0, remaining)
    for (const sample of copy) peak = Math.max(peak, Math.abs(sample))
    result.push(copy)
    remaining -= copy.length
    if (!remaining) break
  }
  // Bounded gain helps quiet microphones. Called only after the local speech detector accepts voice.
  const gain = peak > 0.001 ? Math.min(4, 0.75 / peak) : 1
  if (gain > 1) for (const chunk of result) for (let i = 0; i < chunk.length; i++) chunk[i] *= gain
  return result
}

/** WAV PCM16 mono a 16 kHz, contrato explícito compartido con el backend. */
export function encodeCoroVozWav(chunks: Float32Array[], sampleRate: number): Blob {
  if (!Number.isFinite(sampleRate) || sampleRate < 16000) throw new Error('La frecuencia del micrófono no es compatible')
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0)
  const source = new Float32Array(length)
  let offset = 0
  for (const chunk of chunks) { source.set(chunk, offset); offset += chunk.length }
  const ratio = sampleRate / 16000
  const count = Math.floor(length / ratio)
  const buffer = new ArrayBuffer(44 + count * 2)
  const view = new DataView(buffer)
  const word = (at: number, text: string) => { for (let i = 0; i < text.length; i++) view.setUint8(at + i, text.charCodeAt(i)) }
  word(0, 'RIFF'); view.setUint32(4, 36 + count * 2, true); word(8, 'WAVE')
  word(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true)
  view.setUint16(22, 1, true); view.setUint32(24, 16000, true); view.setUint32(28, 32000, true)
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); word(36, 'data'); view.setUint32(40, count * 2, true)
  for (let i = 0; i < count; i++) {
    const start = Math.floor(i * ratio), end = Math.min(length, Math.floor((i + 1) * ratio))
    let sum = 0
    for (let j = start; j < end; j++) sum += source[j]
    const value = Math.max(-1, Math.min(1, sum / Math.max(1, end - start)))
    view.setInt16(44 + i * 2, Math.round(value * (value < 0 ? 32768 : 32767)), true)
  }
  return new Blob([buffer], { type: 'audio/wav' })
}
