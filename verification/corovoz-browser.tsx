// Isolated browser harness. Uses synthetic records and audio, never the real backend/microphone.
import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '../src/contexts/AuthContext'
import { CoroVozProvider, useCoroVoz } from '../src/contexts/CoroVozContext'
import AIAssistant from '../src/components/features/AIAssistant'
import useCoroVozSpeech from '../src/hooks/useCoroVozSpeech'
import syntheticVoiceUrl from './corovoz-synthetic.wav?url'
import shortVoiceUrl from './corovoz-short.wav?url'
import '../src/index.css'

const nativeFetch = window.fetch.bind(window)
const requests: unknown[] = []
let transcript = 'Consulta de prueba'
let realTranscription = false
let shortAudio = false
let tracks: MediaStreamTrack[] = []
let syntheticContext: AudioContext | null = null
let emitAudio: (() => void) | null = null
let queuedTexts: string[] = []
let queuedAudioTimer: ReturnType<typeof setTimeout> | undefined
localStorage.setItem('coronyx_jwt_token', 'synthetic-browser-test')
window.fetch = async (input, init) => {
  const url = String(input)
  const json = (data: unknown) => Promise.resolve(new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }))
  if (url.endsWith('/auth/me')) return json({ id: '7', usuarioId: '7', usuarioClinicaId: '9', clinicaId: '8', rol: 'ODONTOLOGO', nombres: 'Prueba', apellidos: 'Local', nombreCompleto: 'Prueba Local', correo: 'demo@example.test' })
  if (url.endsWith('/corovoz/status')) return json({ version: 4, speechReady: true })
  if (url.endsWith('/corovoz/transcribir')) {
    requests.push({ transcription: true, realTranscription })
    if (realTranscription) return nativeFetch('/fixture-transcribe', { ...init, method: 'POST' })
    const heard = transcript
    if (queuedTexts.length) queuedAudioTimer = setTimeout(() => { transcript = queuedTexts.shift()!; emitAudio?.() }, 2000)
    return json({ text: heard })
  }
  if (url.endsWith('/corovoz/odontograma/interpretar')) {
    const body = JSON.parse(String(init?.body))
    requests.push(body)
    return nativeFetch('/fixture-dental', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, role: 'ODONTOLOGO' }) })
  }
  if (url.endsWith('/corovoz/odontograma/editar')) {
    const body = JSON.parse(String(init?.body)); requests.push(body)
    return nativeFetch('/fixture-edit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, role: 'ODONTOLOGO' }) })
  }
  if (url.endsWith('/corovoz/general')) {
    const body = JSON.parse(String(init?.body))
    requests.push(body)
    const base = { route: '', targetLabel: '', understood: true, patients: [], suggestions: [], patientId: null, patientName: null }
    if (body.text.includes('alergia') && !body.patientConfirmed) return json({ ...base, intent: 'PACIENTE_ELEGIR', answer: '¿Buscas a Sofía Castillo? Conservé tu pregunta sobre alergias.', patients: [{ id: '2', name: 'Sofía Castillo', documentHint: 'Documento termina en 1234' }] })
    if (body.text.includes('alergia') && body.patientConfirmed) return json({ ...base, intent: 'PACIENTE_DATOS', answer: 'Sofía Castillo. Alergias registradas: penicilina (dato sintético).', patientId: '2', patientName: 'Sofía Castillo' })
    return json({ ...base, intent: 'TELEODONTOLOGIA', answer: 'Ayuda de teleodontología (respuesta de prueba).' })
  }
  if (url.includes('/api/')) throw new Error('El harness no permite consultar datos reales')
  return nativeFetch(input, init)
}

Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async () => {
  syntheticContext = new AudioContext({ sampleRate: 16000 })
  const data = await nativeFetch(shortAudio ? shortVoiceUrl : syntheticVoiceUrl).then(r => r.arrayBuffer())
  const voice = await syntheticContext.decodeAudioData(data)
  const samples = voice.length + 16000 * 8
  const buffer = syntheticContext.createBuffer(1, samples, 16000)
  const output = buffer.getChannelData(0)
  output.set(voice.getChannelData(0))
  let seed = 12345
  for (let i = 0; i < samples; i++) {
    seed = (seed * 16807) % 2147483647
    output[i] += (seed / 2147483647 - 0.5) * 0.035
  }
  const destination = syntheticContext.createMediaStreamDestination()
  await syntheticContext.resume()
  const context = syntheticContext
  emitAudio = () => {
    if (context.state === 'closed') return
    const source = context.createBufferSource()
    source.buffer = buffer
    source.connect(destination)
    source.start(context.currentTime + 0.2)
  }
  emitAudio()
  tracks = destination.stream.getTracks()
  return destination.stream
} })

function DentalFixture() {
  const { register } = useCoroVoz()
  const [patient, setPatient] = useState('Paciente sintético A')
  const [piece, setPiece] = useState<number | null>(null)
  const [applied, setApplied] = useState<string[]>([])
  const [saved, setSaved] = useState(0)
  useEffect(() => register({
    key: `${patient}:v1`, patientName: patient, selectedPiece: piece, editable: true,
    describe: () => 'Cambio sintético sin escritura en base de datos.',
    select: value => { setPiece(value); return true },
    apply: finding => { setApplied(values => [...values, JSON.stringify(finding)]); return true },
    save: async () => { setSaved(value => value + 1); return true },
  }), [register, patient, piece])
  return <div><p>Pieza seleccionada en fixture: {piece || 'ninguna'}</p>
    <button onClick={() => { setPatient('Paciente sintético B'); setPiece(null) }}>Cambiar paciente de prueba</button>
    <pre aria-label="Hallazgos aplicados">{applied.join('\n')}</pre><p>Guardados del borrador: {saved}</p></div>
}

function Harness() {
  const { role } = useAuth()
  const [show, setShow] = useState(false)
  const [report, setReport] = useState('')
  const speech = useCoroVozSpeech((text, review) => {
    setReport(JSON.stringify({ text, review, tracksStopped: tracks.every(t => t.readyState === 'ended') }))
    void syntheticContext?.close()
  })
  return <CoroVozProvider><main className="p-6 max-w-2xl space-y-4">
    <h1 className="text-xl font-bold">Verificación local de CoroVoz</h1>
    <p>Datos y voz sintéticos. Estado de sesión: {role || 'cargando'}.</p>
    <DentalFixture />
    <label>Transcripción simulada <input aria-label="Transcripción simulada" defaultValue={transcript} onChange={event => { transcript = event.target.value }} /></label>
    <label><input type="checkbox" onChange={event => { realTranscription = event.target.checked }} />Transcribir con Whisper local</label>
    <label><input type="checkbox" onChange={event => { shortAudio = event.target.checked }} />Audio corto: confirmar</label>
    <button className="border p-2" onClick={() => setShow(true)}>Abrir asistente de prueba</button>
    <button className="border p-2" onClick={() => void speech.start()}>Probar pausa con voz y ruido</button>
    <button className="border p-2" onClick={() => emitAudio?.()}>Emitir siguiente frase</button>
    <button className="border p-2" onClick={() => { realTranscription = false; queuedTexts = ['condición', 'caries', 'eliminar', 'observación', 'confirmar']; transcript = 'editar' }}>Preparar secuencia de voz</button>
    <label>Modo de audio <select aria-label="Modo de audio" value={speech.sendMode} onChange={event => speech.setSendMode(event.target.value as 'manual' | 'pause')}><option value="manual">Manual</option><option value="pause">Automático</option></select></label>
    <p>Micrófono: {speech.enabled ? 'activo' : 'apagado'}. {speech.starting ? 'cargando modelo' : ''} {speech.transcribing ? 'transcribiendo' : ''}</p>
    <p role="alert">{speech.error}</p><p>{speech.notice}</p><pre aria-label="Resultado de audio">{report}</pre>
    <button className="border p-2" onClick={() => setReport(JSON.stringify(requests, null, 2))}>Ver solicitudes simuladas</button>
    {show && <AIAssistant onClose={() => setShow(false)} />}
  </main></CoroVozProvider>
}
const root = createRoot(document.getElementById('root')!)
root.render(<BrowserRouter><AuthProvider><Harness /></AuthProvider></BrowserRouter>)
if (import.meta.hot) import.meta.hot.dispose(() => {
  clearTimeout(queuedAudioTimer)
  root.unmount()
  window.fetch = nativeFetch
  void syntheticContext?.close().catch(() => {})
})
