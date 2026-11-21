import { createRoot, type Root } from 'react-dom/client'
import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../src/contexts/AuthContext'
import { CoroVozProvider } from '../src/contexts/CoroVozContext'
import AIAssistant from '../src/components/features/AIAssistant'
import { advancePlayback, deferred, device, emitFrame, installDevice, resetDevice } from './voice-test-device'

const report = document.querySelector<HTMLPreElement>('#results')!
const question = 'Ahora dime qué alergias tiene'
const firstReply = 'El paciente tiene una cita programada para el viernes. '.repeat(10)
const secondReply = 'La segunda consulta llegó correctamente.'
const uploads: { user: boolean; assistant: boolean }[] = []
const questions: string[] = []
let root: Root | undefined
let interval: number

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
async function until(test: () => boolean, description: string, timeout = 5000) {
  const start = performance.now()
  while (!test()) {
    if (performance.now() - start > timeout) throw new Error(`${description} (interfaz: ${status()})`)
    await delay(16)
  }
}
function button(selector: string) {
  const element = document.querySelector<HTMLButtonElement>(selector)
  check(element, `Falta ${selector}`)
  return element
}
const mic = () => button('.corovoz-mic')
const status = () => document.querySelector('.corovoz-status')?.textContent || ''
const listening = () => /te escucho|puedes hablar/i.test(status())

function installApi() {
  const nativeFetch = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input), location.href)
    const path = url.pathname
    if (path.endsWith('/auth/me')) return Response.json({ id: '7', usuarioId: '7', usuarioClinicaId: '9', clinicaId: '8', rol: 'ODONTOLOGO', nombres: 'Prueba', apellidos: 'Local' })
    if (path.endsWith('/corovoz/status')) return Response.json({ version: 4, speechReady: true })
    if (path.endsWith('/corovoz/transcribir')) {
      check(init?.body instanceof Blob, 'Se esperaba el WAV generado a partir de los frames')
      const pcm = new DataView(await init.body.arrayBuffer())
      const markers = { user: false, assistant: false }
      for (let at = 44; at < pcm.byteLength; at += 2) {
        const sample = pcm.getInt16(at, true)
        markers.assistant ||= sample < -100
        markers.user ||= sample > 100
      }
      uploads.push(markers)
      return Response.json({ text: markers.assistant ? 'Audio anterior de COROVOZ' : markers.user ? question : '' })
    }
    if (path.endsWith('/corovoz/general')) {
      const text = JSON.parse(String(init?.body)).text
      questions.push(text)
      return Response.json({ intent: 'AYUDA', understood: true, answer: text === question ? secondReply : firstReply, patients: [], suggestions: [], route: '' })
    }
    if (url.origin !== location.origin || path.includes('/api/')) throw new Error(`Solicitud no prevista en esta prueba: ${path}`)
    return nativeFetch(input, init)
  }
}

function TestAssistant() {
  const [expanded, setExpanded] = useState(true)
  return <AIAssistant expanded={expanded} onClose={() => setExpanded(false)} onOpen={() => setExpanded(true)} />
}

async function mount() {
  resetDevice()
  questions.length = uploads.length = 0
  root = createRoot(document.getElementById('root')!)
  root.render(<MemoryRouter><AuthProvider><CoroVozProvider><TestAssistant /></CoroVozProvider></AuthProvider></MemoryRouter>)
  await until(() => Boolean(document.querySelector('.corovoz-mic')) && !mic().disabled, 'Micrófono disponible')
  button('[aria-label="Leer respuestas"]').click()
  const cue = Array.from(document.querySelectorAll('label')).find(label => label.textContent?.includes('Sonido al activar'))?.querySelector('input')
  check(cue?.checked, 'Ajuste de señal de inicio disponible')
  cue.click()
  interval = window.setInterval(() => emitFrame(), 32)
}

async function ask(text: string) {
  const field = document.querySelector<HTMLTextAreaElement>('#corovoz-text')!
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(field, text)
  field.dispatchEvent(new Event('input', { bubbles: true }))
  await until(() => !button('[aria-label="Enviar"]').disabled, 'Enviar pregunta escrita')
  button('[aria-label="Enviar"]').click()
}

async function startReply() {
  await ask('Consulta sintética')
  await until(() => device.utterances.length === 1 && /hablando/i.test(status()), 'Primera respuesta hablada')
  return device.utterances[0]
}

function requestMic() {
  const cancels = device.cancels
  mic().click()
  check(device.cancels > cancels, 'La primera pulsación debe cancelar la síntesis de inmediato')
}
async function freshQuestion() {
  device.source = 'user'
  await delay(390)
  button('[aria-label="Terminé: enviar"]').click()
  await until(() => device.utterances.length === 2, 'Se recibió una nueva respuesta hablada')
  check(uploads.length === 1 && uploads[0].user && !uploads[0].assistant, 'El WAV debe contener solo la señal del usuario')
  check(questions.length === 2 && questions[1] === question && device.utterances[1].text === secondReply, 'Se interpretó la segunda pregunta')
}
type Scenario = 'inicio con cola' | 'mitad con eco' | 'final con evento tardío'
async function interrupt(position: Scenario) {
  const original = await startReply()
  // Preserve even a handler that the browser already queued before cancellation.
  const lateEnd = original.onend?.bind(original)
  const lateError = original.onerror?.bind(original)
  if (position === 'inicio con cola') { device.speaking = false; device.pending = true }
  const offset = position === 'inicio con cola' ? 0 : position === 'mitad con eco' ? Math.floor(firstReply.length / 2) : firstReply.length - 2
  check(advancePlayback(offset) === offset && device.remainingText.length > 0, 'Hay texto pendiente en el punto de interrupción')
  device.source = position === 'mitad con eco' ? 'assistant' : 'quiet'
  requestMic()
  check(advancePlayback(firstReply.length) === 0, 'La cola de la respuesta interrumpida debe quedar vacía')
  mic().click()
  mic().click()
  lateEnd?.({ utterance: original } as SpeechSynthesisEvent)
  await delay(240)
  check(!listening() && !device.permissionRequests.length, 'Una cola u operación nativa activa debe impedir el acceso al micrófono')
  device.speaking = device.pending = false
  await until(() => device.frames.length > 0, 'VAD preparado después de detener la salida')
  if (position === 'mitad con eco') {
    await delay(260)
    check(!listening() && !uploads.length, 'El eco residual impide anunciar la escucha y subir audio')
    device.source = 'quiet'
  }
  await until(listening, 'El micrófono acepta voz después del silencio')
  check(device.permissionRequests.length === 1, 'Las pulsaciones repetidas deben producir una sola captura')
  const audio = device.permissionRequests[0].audio as MediaTrackConstraints
  check(audio.echoCancellation && audio.noiseSuppression && audio.autoGainControl, 'Protecciones complementarias solicitadas al dispositivo')
  await freshQuestion()
  lateEnd?.({ utterance: original } as SpeechSynthesisEvent)
  lateError?.({ utterance: original } as SpeechSynthesisErrorEvent)
  await delay(180)
  check(/hablando/i.test(status()) && device.utterances.length === 2, 'Los eventos antiguos no afectan a la nueva respuesta')
  check(device.tracks.every(track => track.readyState === 'ended'), 'El modo manual libera las pistas antes de transcribir')
}

async function slowStart() {
  device.modelGate = deferred()
  device.permissionGate = deferred()
  mic().click()
  await delay(120)
  check(!listening() && !device.permissionRequests.length, 'El VAD pendiente mantiene la interfaz en preparación')
  mic().click()
  device.modelGate.resolve()
  await until(() => device.permissionRequests.length === 1, 'Solicitud de permiso después del modelo')
  await delay(100)
  check(!listening(), 'La espera del permiso mantiene la interfaz en preparación')
  device.permissionGate.resolve()
  await until(listening, 'Escucha tras abrir el micrófono')
  mic().click()
  await until(() => !listening() && device.tracks.every(track => track.readyState === 'ended'), 'Pistas cerradas al detener')
}

async function deniedPermission() {
  device.deny = true
  mic().click()
  await until(() => /permiso/i.test(document.querySelector('[role="alert"]')?.textContent || ''), 'Error de permiso visible')
  check(!listening() && !device.tracks.length && !uploads.length, 'Un fallo no habilita la captura')
  device.deny = false
  mic().click()
  await until(listening, 'Se puede reintentar tras conceder permiso')
}

async function stuckOutput() {
  await startReply()
  requestMic()
  await until(() => Boolean(document.querySelector('[role="alert"]')), 'Error de salida de voz persistente')
  check(!listening() && !device.permissionRequests.length, 'La salida sin confirmar debe fallar sin abrir el micro')
}

async function continuousCapture() {
  const select = document.querySelector<HTMLSelectElement>('[aria-label="Envío del dictado"]')!
  select.value = 'pause'
  select.dispatchEvent(new Event('change', { bubbles: true }))
  mic().click()
  await until(listening, 'La conversación continua está escuchando')
  await startReply()
  check(!listening() && device.tracks.every(track => !track.enabled || track.readyState === 'ended'), 'El micrófono continuo queda silenciado durante la salida')
  device.source = 'assistant'
  requestMic()
  await delay(160)
  check(!listening(), 'La sesión continua también verifica la salida nativa')
  device.speaking = device.pending = false
  await delay(220)
  check(!listening() && !uploads.length, 'La sesión reutilizada descarta la cola acústica')
  device.source = 'quiet'
  await until(listening, 'Se reanuda tras el silencio')
  device.source = 'user'
  for (let i = 0; i < 16; i++) emitFrame()
  device.source = 'quiet'
  for (let i = 0; i < 115; i++) emitFrame()
  await until(() => device.utterances.length === 2, 'La pausa envía la segunda consulta')
  check(uploads.length === 1 && uploads[0].user && !uploads[0].assistant, 'La captura continua solo envía audio del usuario')
}

async function pendingAfterEnd() {
  const original = await startReply()
  device.speaking = false
  device.pending = true
  original.onend?.call(original, { utterance: original } as SpeechSynthesisEvent)
  await delay(80)
  requestMic()
  await delay(120)
  check(!device.permissionRequests.length && !listening(), 'Una cola que sobrevive a onend debe impedir la escucha')
  device.pending = false
  await until(listening, 'La escucha se abre tras vaciar la cola')
}

async function replaceReply(takeMicrophone: boolean) {
  const original = await startReply()
  const lateEnd = original.onend?.bind(original)
  await ask(question)
  await until(() => document.querySelector('.corovoz-response')?.textContent === secondReply, 'Nueva respuesta escrita disponible')
  check(device.cancels > 0 && device.utterances.map(utterance => utterance.text).join('') === firstReply, 'Se detiene la primera salida antes de reproducir la segunda')
  if (takeMicrophone) mic().click()
  device.speaking = false
  if (takeMicrophone) await until(listening, 'El micrófono descarta la lectura pendiente y recibe el turno')
  else await until(() => device.utterances.length === 2, 'Se inicia la lectura pendiente al acabar la salida anterior')
  lateEnd?.({ utterance: original } as SpeechSynthesisEvent)
  await delay(120)
  if (takeMicrophone) check(device.utterances.length === 1 && listening(), 'La lectura pendiente no puede reaparecer durante la escucha')
  else check(device.utterances.length === 2 && device.utterances[1].text === secondReply && /hablando/i.test(status()), 'Solo se reprodujo la nueva respuesta')
}

async function residualTimeout() {
  await startReply()
  requestMic()
  device.source = 'assistant'
  device.speaking = false
  await until(() => device.frames.length > 0, 'El detector recibe la señal residual')
  await until(() => Boolean(document.querySelector('[role="alert"]')), 'Aviso cuando no hay silencio')
  check(!listening() && !uploads.length && device.tracks.every(track => track.readyState === 'ended'), 'Cierre de la captura con ruido persistente')
}

async function cueTail(deliverEnded: boolean) {
  document.querySelector<HTMLInputElement>('.corovoz-settings-body input[type=checkbox]')!.click()
  mic().click()
  await until(() => !!device.finishCue, 'La señal de activación ha empezado')
  device.source = 'assistant'
  await delay(160)
  check(!listening() && device.tracks.every(track => !track.enabled), 'Captura silenciada mientras suena el aviso')
  if (deliverEnded) device.finishCue!()
  await until(() => device.tracks.every(track => track.enabled), 'La señal terminó y el detector comprueba el silencio')
  await delay(200)
  check(!listening(), 'No debe abrirse la escucha durante el eco del aviso')
  device.source = 'quiet'
  await until(listening, 'Escucha después del aviso y su cola acústica')
}

async function supersededPermission() {
  const latePermission = deferred()
  device.permissionGate = latePermission
  mic().click()
  await until(() => device.permissionRequests.length === 1, 'Primer diálogo de permiso abierto')
  button('[aria-label="Minimizar CoroVoz"]').click()
  await until(() => !!document.querySelector('[aria-label="Abrir CoroVoz"]'), 'Panel minimizado')
  device.permissionGate = null
  button('[aria-label="Abrir CoroVoz"]').click()
  await until(() => !!document.querySelector('.corovoz-mic'), 'Panel reabierto')
  mic().click()
  await until(listening, 'La segunda captura está activa')
  latePermission.resolve()
  await until(() => device.tracks.length === 2 && device.tracks[1].readyState === 'ended', 'La pista tardía se cierra')
  check(listening() && device.tracks[0].readyState === 'live' && device.frames.length === 1, 'El permiso anterior no modifica la sesión actual')
}

const scenarios: [string, () => Promise<void>][] = [
  ...(['inicio con cola', 'mitad con eco', 'final con evento tardío'] as Scenario[]).map((name): [string, () => Promise<void>] => [name, () => interrupt(name)]),
  ['modelo y permiso lentos', slowStart],
  ['denegación y reintento', deniedPermission],
  ['motor de salida bloqueado', stuckOutput],
  ['interrupción con sesión continua', continuousCapture],
  ['cola nativa que persiste después de onend', pendingAfterEnd],
  ['lectura siguiente con salida anterior pendiente', () => replaceReply(false)],
  ['micrófono antes de reproducir una lectura pendiente', () => replaceReply(true)],
  ['residuo acústico sin pausa', residualTimeout],
  ['aviso sonoro y eco antes de escuchar', () => cueTail(true)],
  ['recuperación si el aviso sonoro pierde onended', () => cueTail(false)],
  ['permiso antiguo tras cerrar y reabrir el panel', supersededPermission],
]

async function run() {
  check(location.port === '5189' && ['127.0.0.1', 'localhost'].includes(location.hostname), 'Usa la configuración local vite.voice-turns.config.ts en el puerto 5189.')
  installDevice()
  installApi()
  localStorage.setItem('coronyx_jwt_token', 'sesion-sintetica')
  const results: string[] = []
  let failures = 0
  for (const [name, scenario] of scenarios) {
    try {
      await mount()
      await scenario()
      results.push(`OK: ${name}`)
    } catch (error) {
      failures++
      results.push(`ERROR: ${name}: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      clearInterval(interval)
      root?.unmount()
      device.modelGate?.resolve()
      device.permissionGate?.resolve()
      await delay(0)
    }
    report.textContent = results.join('\n')
  }
  report.dataset.result = failures ? 'failed' : 'passed'
}
void run().catch(error => { report.textContent = String(error); report.dataset.result = 'failed' })
