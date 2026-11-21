import { useCallback, useEffect, useRef, useState } from 'react'
import type { MicVAD } from '@ricky0123/vad-web'
import ortModuleUrl from 'onnxruntime-web/ort-wasm-simd-threaded.mjs?url'
import ortBinaryUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url'
import { getCoroVozStatus, transcribeCoroVoz } from '../services/coroVozService'
import { encodeCoroVozWav, prepareCoroVozAudio } from '../utils/coroVozAudio'
import { emptySpeechActivity, pauseReached, shouldStopConversationIdle, speechDetectionMode, updateSpeechActivity } from '../utils/coroVozActivity'

const RATE = 16000 // Silero delivers mono frames resampled to 16 kHz.
const QUIET_MS = 96 // Three 32 ms Silero frames.
const emptyCapture = () => ({ chunks: [] as Float32Array[], samples: 0, activity: emptySpeechActivity() })

type VoicePhase = 'IDLE' | 'SPEAKING' | 'INTERRUPTING' | 'PREPARING_MIC' | 'LISTENING' | 'PROCESSING' | 'ERROR'
interface SpeechFeedbackOptions { activationSound?: boolean }
interface Microphone {
  controller: AbortController
  context?: AudioContext
  stream?: MediaStream
  vad?: MicVAD
  ready: boolean
  needsQuiet: boolean
  quietSamples: number
  unmutedAt: number
  quietTimer?: number
  cancelCue?: () => void
}
interface Output {
  utterance?: SpeechSynthesisUtterance
  draining?: Promise<void>
  cancelled?: boolean
}

function mute(mic: Microphone | null) {
  if (!mic) return
  mic.stream?.getAudioTracks().forEach(track => { track.enabled = false })
  window.clearTimeout(mic.quietTimer)
  mic.quietTimer = undefined
  mic.quietSamples = 0
}

/** A cancelled utterance need not dispatch 'end'. Observe both native queue flags. */
async function waitForOutput(synth: SpeechSynthesis, current: () => boolean) {
  const start = performance.now()
  let silentSince: number | undefined
  while (current()) {
    const now = performance.now()
    if (synth.speaking || synth.pending) silentSince = undefined
    else if (silentSince === undefined) silentSince = now
    else if (now - silentSince >= 64) return
    if (now - start >= 2000) throw new Error('El navegador sigue indicando que hay audio en reproducción. Vuelve a iniciar la escucha.')
    await new Promise<void>(resolve => window.setTimeout(resolve, 20))
  }
}

/** Silence the optional chime before any microphone frame can enter the dictation. */
function activationCue(context: AudioContext, finish: () => void): (() => void) | undefined {
  if (context.state !== 'running') return
  try {
    const tone = context.createOscillator()
    const volume = context.createGain()
    const now = context.currentTime
    tone.type = 'sine'
    tone.frequency.setValueAtTime(740, now)
    tone.frequency.exponentialRampToValueAtTime(980, now + 0.1)
    volume.gain.setValueAtTime(0, now)
    volume.gain.linearRampToValueAtTime(0.025, now + 0.015)
    volume.gain.linearRampToValueAtTime(0, now + 0.12)
    tone.connect(volume)
    volume.connect(context.destination)
    const cleanup = () => { window.clearTimeout(timer); tone.onended = null; tone.disconnect(); volume.disconnect() }
    const end = () => { cleanup(); finish() }
    // Disconnect even if the device is suspended before dispatching 'ended'.
    const timer = window.setTimeout(end, 500)
    tone.onended = end
    tone.start(now)
    tone.stop(now + 0.12)
    return cleanup
  } catch {
    return
  }
}

export default function useCoroVozSpeech(onText: (text: string, reviewOnly: boolean) => void, awaitingReply = false, feedback: SpeechFeedbackOptions = {}) {
  const [phase, setPhase] = useState<VoicePhase>('IDLE')
  const phaseRef = useRef<VoicePhase>('IDLE')
  const enter = useCallback((next: VoicePhase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])
  const [supported, setSupported] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [level, setLevel] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [spokenText, setSpokenText] = useState('')
  const [sendMode, setSendMode] = useState<'manual' | 'pause'>('manual')
  const options = useRef({ onText, awaitingReply, feedback, sendMode })
  options.current = { onText, awaitingReply, feedback, sendMode }

  const micRef = useRef<Microphone | null>(null)
  const outputRef = useRef<Output | null>(null)
  const queuedOutput = useRef<(() => void) | null>(null)
  const recentOutputUntil = useRef(-Infinity)
  const requestRef = useRef<AbortController | null>(null)
  const pausedRef = useRef(false)
  const captureRef = useRef(emptyCapture())

  const releaseMicrophone = useCallback(() => {
    const mic = micRef.current
    micRef.current = null
    if (mic) {
      mic.controller.abort()
      mute(mic)
      mic.cancelCue?.()
      mic.stream?.getTracks().forEach(track => { track.onended = null; track.stop() })
      // A start() still settling destroys its own VAD in its finally block.
      if (mic.ready) void mic.vad?.destroy().catch(() => {})
      if (mic.context && mic.context.state !== 'closed') void mic.context.close().catch(() => {})
    }
    captureRef.current = emptyCapture()
    setEnabled(false)
    setLevel(0)
  }, [])

  const stop = useCallback(() => {
    const output = outputRef.current
    queuedOutput.current = null
    outputRef.current = null
    if (output) {
      if (output.utterance) output.utterance.onend = output.utterance.onerror = null
      window.speechSynthesis?.cancel()
      recentOutputUntil.current = performance.now() + 750
    }
    requestRef.current?.abort()
    requestRef.current = null
    pausedRef.current = false
    releaseMicrophone()
    setTranscribing(false)
    setSpokenText('')
    enter('IDLE')
  }, [enter, releaseMicrophone])

  const fail = useCallback((message: string) => {
    stop()
    setError(message)
    enter('ERROR')
  }, [enter, stop])

  // Sole transition to LISTENING. Every caller, including natural TTS completion and
  // automatic conversation, must satisfy the same output, request and microphone gates.
  const resumeInput = useCallback(() => {
    if (outputRef.current) return
    const mic = micRef.current
    if (pausedRef.current || requestRef.current) {
      mute(mic)
      enter('PROCESSING')
    } else if (!mic) {
      enter('IDLE')
    } else if (!mic.ready || mic.cancelCue) {
      enter('PREPARING_MIC')
    } else {
      mic.stream?.getAudioTracks().forEach(track => { track.enabled = true })
      if (mic.needsQuiet) {
        enter('PREPARING_MIC')
        if (mic.quietTimer === undefined) {
          mic.unmutedAt = performance.now()
          mic.quietTimer = window.setTimeout(() => {
            if (mic === micRef.current && mic.needsQuiet) fail('Aún se oye sonido en el micrófono. Espera un momento y vuelve a iniciar la escucha.')
          }, 3000)
        }
      } else {
        enter('LISTENING')
      }
    }
  }, [enter, fail])

  const drainOutput = useCallback((cancel: boolean) => {
    const synth = window.speechSynthesis
    if (!synth) return
    const output = outputRef.current ?? {}
    if (output.draining) {
      if (cancel && !output.cancelled) { output.cancelled = true; synth.cancel() }
      return output.draining
    }
    outputRef.current = output
    if (output.utterance) output.utterance.onend = output.utterance.onerror = null
    mute(micRef.current)
    if (micRef.current) micRef.current.needsQuiet = true
    captureRef.current = emptyCapture()
    enter('INTERRUPTING')
    setSpokenText('')
    if (cancel) { output.cancelled = true; synth.cancel() }
    output.draining = waitForOutput(synth, () => outputRef.current === output).then(() => {
      if (outputRef.current !== output) return
      recentOutputUntil.current = performance.now() + 750
      outputRef.current = null
      const next = queuedOutput.current
      queuedOutput.current = null
      if (next) next()
      else resumeInput()
    }).catch((cause: Error) => { if (outputRef.current === output) fail(cause.message) })
    return output.draining
  }, [enter, fail, resumeInput])

  const sendCapture = useCallback(async (reviewOnly = false) => {
    if (phaseRef.current !== 'LISTENING') return
    const capture = captureRef.current
    if (!capture.activity.voiced || capture.samples < RATE * 0.2) {
      setError('No detecté voz en la grabación. Comprueba el micrófono y vuelve a intentarlo.')
      return
    }
    captureRef.current = emptyCapture()
    const controller = new AbortController()
    requestRef.current = controller
    if (reviewOnly || options.current.sendMode === 'manual') releaseMicrophone()
    resumeInput()
    setTranscribing(true)
    setError('')
    try {
      const wav = encodeCoroVozWav(prepareCoroVozAudio(capture.chunks, capture.activity.silenceSamples), RATE)
      const result = await transcribeCoroVoz(wav, controller.signal)
      if (requestRef.current !== controller) return
      if (!result.text.trim()) {
        fail('Se recibió audio pero no se entendieron palabras. Acércate al micrófono y vuelve a hablar.')
        return
      }
      // The callback may synchronously submit a question, stop the mic or start speaking.
      requestRef.current = null
      setTranscribing(false)
      options.current.onText(result.text.trim(), reviewOnly)
      resumeInput()
    } catch (cause) {
      if (requestRef.current === controller) fail(cause instanceof Error ? cause.message : 'No se pudo transcribir la voz.')
    }
  }, [fail, releaseMicrophone, resumeInput])

  const start = useCallback(async () => {
    const synth = window.speechSynthesis
    const hasOutput = Boolean(outputRef.current || synth?.speaking || synth?.pending)
    const existing = micRef.current
    if ((existing && !hasOutput) || requestRef.current || pausedRef.current) return
    queuedOutput.current = null
    const draining = hasOutput ? drainOutput(true) : undefined // synchronous cancel in the click handler
    if (existing) return draining
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.AudioContext) {
      fail('El micrófono requiere una conexión segura y permiso de acceso.')
      return
    }
    const mic: Microphone = { controller: new AbortController(), ready: false,
      needsQuiet: hasOutput || performance.now() < recentOutputUntil.current, quietSamples: 0, unmutedAt: 0 }
    micRef.current = mic
    const signal = mic.controller.signal
    setError('')
    setNotice('')
    resumeInput()
    try {
      if (draining) await draining
      if (signal.aborted) return
      const status = await getCoroVozStatus(signal)
      if (signal.aborted) return
      if (status.version < 4) throw new Error('El servicio de voz necesita actualizarse. Contacta al administrador.')
      if (!status.speechReady) throw new Error('El reconocimiento de voz no está disponible. Contacta al administrador.')
      const context = new AudioContext({ sampleRate: RATE })
      mic.context = context
      const { MicVAD } = await import('@ricky0123/vad-web')
      if (signal.aborted) return
      const vad = await MicVAD.new({
        model: 'v5', audioContext: context, startOnLoad: false,
        baseAssetPath: `${import.meta.env.BASE_URL}corovoz-vad/`,
        ortConfig: ort => {
          ort.env.wasm.wasmPaths = {
            mjs: new URL(ortModuleUrl, window.location.href).href,
            wasm: new URL(ortBinaryUrl, window.location.href).href,
          }
          ort.env.wasm.numThreads = 1
          ort.env.logLevel = 'error'
        },
        getStream: async () => {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: {
            channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true,
          } })
          if (signal.aborted) {
            stream.getTracks().forEach(track => track.stop())
            throw new Error('Escucha cancelada')
          }
          mic.stream = stream
          mute(mic)
          stream.getAudioTracks().forEach(track => {
            track.onended = () => {
              if (!signal.aborted) fail('El micrófono se desconectó. Vuelve a iniciar la escucha.')
            }
          })
          return stream
        },
        resumeStream: async stream => stream,
        pauseStream: async () => {},
        onFrameProcessed: (probabilities, chunk) => {
          if (signal.aborted || !mic.ready || outputRef.current || pausedRef.current || requestRef.current || mic.cancelCue) return
          let energy = 0
          for (const sample of chunk) energy += sample * sample
          const rms = Math.sqrt(energy / chunk.length)
          if (mic.needsQuiet) {
            const quiet = probabilities.isSpeech < 0.35 && rms <= 0.04
            mic.quietSamples = quiet ? mic.quietSamples + chunk.length : 0
            if (mic.quietTimer !== undefined && mic.quietSamples >= RATE * QUIET_MS / 1000 && performance.now() - mic.unmutedAt >= QUIET_MS) {
              window.clearTimeout(mic.quietTimer)
              mic.quietTimer = undefined
              mic.needsQuiet = false
              resumeInput()
            }
            return // All tail frames, including the last quiet frame, are discarded.
          }
          if (phaseRef.current !== 'LISTENING') return
          setLevel(Math.min(1, rms * 12))
          const capture = captureRef.current
          capture.chunks.push(chunk.slice())
          capture.samples += chunk.length
          const { sendMode: mode, awaitingReply: awaiting } = options.current
          capture.activity = updateSpeechActivity(capture.activity, probabilities.isSpeech, chunk.length, speechDetectionMode(mode, awaiting))
          if (shouldStopConversationIdle(capture.activity, RATE, mode, awaiting)) {
            stop()
            setNotice('Micrófono apagado tras 15 segundos sin voz. Pulsa Iniciar escucha para continuar.')
          } else if (!capture.activity.voiced) {
            while (capture.samples > RATE * 1.2 && capture.chunks.length > 1) capture.samples -= capture.chunks.shift()!.length
          } else if (capture.samples > RATE * 25) {
            void sendCapture(true)
          } else if (pauseReached(capture.activity, RATE)) {
            void sendCapture(mode === 'manual')
          }
        },
      })
      mic.vad = vad
      if (signal.aborted) return
      await context.resume()
      if (signal.aborted) return
      await vad.start()
      if (signal.aborted) return
      mic.ready = true
      setEnabled(true)
      // Barge-in stays silent. A normal activation cue finishes before arming input.
      if (!mic.needsQuiet && !outputRef.current && !pausedRef.current && options.current.feedback.activationSound) {
        mic.cancelCue = activationCue(context, () => {
          if (signal.aborted) return
          mic.cancelCue = undefined
          resumeInput()
        })
        if (mic.cancelCue) mic.needsQuiet = true
      }
      resumeInput()
    } catch (cause) {
      if (signal.aborted) return
      const messages: Record<string, string> = {
        NotAllowedError: 'No tengo permiso para usar el micrófono. Habilítalo en tu navegador e inténtalo de nuevo.',
        NotFoundError: 'No se encontró un micrófono disponible.',
        NotReadableError: 'No se puede abrir el micrófono. Revisa si otra aplicación lo está usando.',
      }
      fail(cause instanceof Error ? messages[cause.name] || cause.message : 'No se pudo abrir el micrófono.')
    } finally {
      if (signal.aborted && !mic.ready) await mic.vad?.destroy().catch(() => {})
    }
  }, [drainOutput, fail, resumeInput, sendCapture, stop])

  const interrupt = useCallback(() => {
    queuedOutput.current = null
    if (outputRef.current) void drainOutput(true)
  }, [drainOutput])

  const pause = useCallback((value: boolean) => {
    pausedRef.current = value
    captureRef.current = emptyCapture()
    if (value) {
      requestRef.current?.abort()
      requestRef.current = null
      setTranscribing(false)
      interrupt()
    }
    resumeInput()
  }, [interrupt, resumeInput])

  const speak = useCallback((text: string) => {
    const synth = window.speechSynthesis
    if (!synth || !text.trim() || requestRef.current) return
    const mic = micRef.current
    // The microphone gesture owns the turn until it is ready. An old read-aloud
    // callback cannot preempt that gesture while the OS or detector is settling.
    if ((phaseRef.current === 'INTERRUPTING' || phaseRef.current === 'PREPARING_MIC') && mic && !pausedRef.current) return
    mute(mic)
    if (mic) {
      mic.cancelCue?.()
      mic.cancelCue = undefined
      mic.needsQuiet = true
    }
    captureRef.current = emptyCapture()
    const play = () => {
      const utterance = new SpeechSynthesisUtterance(text)
      const output = { utterance }
      outputRef.current = output
      const spanish = synth.getVoices().find(voice => voice.lang.startsWith('es'))
      if (spanish) utterance.voice = spanish
      utterance.lang = spanish?.lang || 'es-ES'
      const finish = () => { if (outputRef.current === output) void drainOutput(false) }
      utterance.onend = finish
      utterance.onerror = finish
      enter('SPEAKING')
      setLevel(0)
      setSpokenText(text)
      try { synth.speak(utterance) }
      catch { fail('El navegador no pudo reproducir la respuesta de voz.') }
    }
    if (outputRef.current || synth.speaking || synth.pending) {
      queuedOutput.current = play
      void drainOutput(true)
    } else play()
  }, [drainOutput, enter, fail])

  useEffect(() => {
    setSupported(window.isSecureContext && typeof navigator.mediaDevices?.getUserMedia === 'function' && typeof window.AudioContext === 'function')
    return stop
  }, [stop])

  return { phase, supported, enabled, listening: phase === 'LISTENING', starting: phase === 'PREPARING_MIC' || phase === 'INTERRUPTING',
    speaking: phase === 'SPEAKING', transcribing, spokenText, sendMode, setSendMode, interrupt, notice, level,
    interim: transcribing ? 'Transcribiendo…' : '', error, start, stop, pause, speak, finish: () => sendCapture(false) }
}
