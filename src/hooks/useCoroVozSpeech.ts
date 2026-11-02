import { useCallback, useEffect, useRef, useState } from 'react'
import type { MicVAD } from '@ricky0123/vad-web'
import ortModuleUrl from 'onnxruntime-web/ort-wasm-simd-threaded.mjs?url'
import ortBinaryUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url'
import { getCoroVozStatus, transcribeCoroVoz } from '../services/coroVozService'
import { encodeCoroVozWav, prepareCoroVozAudio } from '../utils/coroVozAudio'
import { emptySpeechActivity, pauseReached, shouldStopConversationIdle, speechDetectionMode, updateSpeechActivity } from '../utils/coroVozActivity'

const emptyCapture = () => ({ chunks: [] as Float32Array[], samples: 0, activity: emptySpeechActivity() })

/** Captura estándar getUserMedia; el backend transcribe localmente, también en Brave. */
export default function useCoroVozSpeech(onText: (text: string, reviewOnly: boolean) => void, awaitingReply = false) {
  const awaitingReplyRef = useRef(awaitingReply)
  awaitingReplyRef.current = awaitingReply
  const [supported, setSupported] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [listening, setListening] = useState(false)
  const [starting, setStarting] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [level, setLevel] = useState(0)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [sendMode, setSendMode] = useState<'manual' | 'pause'>('manual')
  const sendModeRef = useRef(sendMode)
  sendModeRef.current = sendMode
  const callbackRef = useRef(onText)
  callbackRef.current = onText
  const streamRef = useRef<MediaStream | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const vadRef = useRef<MicVAD | null>(null)
  const captureRef = useRef(emptyCapture())
  const activeRef = useRef(false)
  const startingRef = useRef(false)
  const pausedRef = useRef(false)
  const speakingRef = useRef(false)
  const processingRef = useRef(false)
  const resumeAtRef = useRef(0)
  const generationRef = useRef(0)
  const utteranceRef = useRef(0)
  const requestRef = useRef<AbortController | null>(null)

  const releaseMicrophone = useCallback(() => {
    const vad = vadRef.current
    vadRef.current = null
    streamRef.current?.getTracks().forEach(track => { track.onended = null; track.stop() })
    streamRef.current = null
    const context = contextRef.current
    contextRef.current = null
    void (async () => {
      await vad?.destroy().catch(() => {})
      if (context?.state !== 'closed') await context?.close().catch(() => {})
    })()
    setEnabled(false); setListening(false); setLevel(0)
  }, [])

  const stop = useCallback(() => {
    generationRef.current++
    utteranceRef.current++
    activeRef.current = false
    startingRef.current = false
    pausedRef.current = false
    speakingRef.current = false
    setSpeaking(false)
    processingRef.current = false
    requestRef.current?.abort()
    requestRef.current = null
    releaseMicrophone()
    captureRef.current = emptyCapture()
    window.speechSynthesis?.cancel()
    setEnabled(false); setListening(false); setStarting(false); setTranscribing(false); setLevel(0); setInterim('')
  }, [releaseMicrophone])

  const sendCapture = useCallback(async (reviewOnly = false) => {
    if (!activeRef.current || pausedRef.current || speakingRef.current || processingRef.current) return
    const capture = captureRef.current
    const rate = 16000 // Silero frames are resampled to 16 kHz by MicVAD.
    if (!capture.activity.voiced || capture.samples < rate * 0.2) { setError('No detecté voz en la grabación. Comprueba el micrófono y vuelve a intentarlo.'); return }
    captureRef.current = emptyCapture()
    processingRef.current = true
    if (reviewOnly || sendModeRef.current === 'manual') {
      activeRef.current = false
      releaseMicrophone()
    }
    setTranscribing(true); setListening(false); setInterim('Transcribiendo…'); setError('')
    const controller = new AbortController()
    requestRef.current = controller
    const generation = generationRef.current
    try {
      const result = await transcribeCoroVoz(encodeCoroVozWav(prepareCoroVozAudio(capture.chunks, capture.activity.silenceSamples), rate), controller.signal)
      if (controller.signal.aborted || generation !== generationRef.current) return
      requestRef.current = null
      if (result.text.trim()) callbackRef.current(result.text.trim(), reviewOnly)
      else setError('Se recibió audio pero no se entendieron palabras. Acércate al micrófono y vuelve a hablar.')
    } catch (cause) {
      if (!controller.signal.aborted && generation === generationRef.current) {
        const message = cause instanceof Error ? cause.message : 'No se pudo transcribir la voz.'
        setError(message)
      }
    } finally {
      if (generation === generationRef.current) {
        requestRef.current = null
        processingRef.current = false
        resumeAtRef.current = performance.now() + 350
        setTranscribing(false); setInterim('')
        setListening(activeRef.current && !pausedRef.current && !speakingRef.current)
      }
    }
  }, [releaseMicrophone])

  const start = useCallback(async () => {
    if (activeRef.current || startingRef.current || processingRef.current) return
    if (!window.isSecureContext || typeof navigator.mediaDevices?.getUserMedia !== 'function' || typeof window.AudioContext !== 'function') {
      setError('El micrófono requiere una conexión segura y permiso de acceso.'); return
    }
    const generation = ++generationRef.current
    startingRef.current = true
    setStarting(true); setError(''); setNotice('')
    try {
      const status = await getCoroVozStatus()
      if (status.version < 4) throw new Error('El servicio de voz necesita actualizarse. Contacta al administrador.')
      if (!status.speechReady) throw new Error('El reconocimiento de voz no está disponible. Contacta al administrador.')
      if (generation !== generationRef.current) return
      const context = new AudioContext({ sampleRate: 16000 })
      contextRef.current = context
      const { MicVAD } = await import('@ricky0123/vad-web')
      if (generation !== generationRef.current) return
      const vad = await MicVAD.new({
        model: 'v5', audioContext: context, startOnLoad: false,
        baseAssetPath: `${import.meta.env.BASE_URL}corovoz-vad/`,
        // Vite owns these URLs in dev and production. Importing a module from public fails in dev.
        ortConfig: ort => {
          ort.env.wasm.wasmPaths = {
            mjs: new URL(ortModuleUrl, window.location.href).href,
            wasm: new URL(ortBinaryUrl, window.location.href).href,
          }
          ort.env.wasm.numThreads = 1
          ort.env.logLevel = 'error'
        },
        // Load the model before opening the microphone so its loading time cannot swallow the first words.
        getStream: async () => {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
          if (generation !== generationRef.current) {
            stream.getTracks().forEach(track => track.stop())
            throw new Error('Escucha cancelada')
          }
          streamRef.current = stream
          return stream
        },
        resumeStream: async stream => stream,
        pauseStream: async () => {},
        onSpeechStart: () => {}, onSpeechRealStart: () => {}, onSpeechEnd: () => {}, onVADMisfire: () => {},
        onFrameProcessed: (probabilities, chunk) => {
        if (generation !== generationRef.current) return
        let energy = 0
        for (const sample of chunk) energy += sample * sample
        const rms = Math.sqrt(energy / chunk.length)
        setLevel(Math.min(1, rms * 12))
        if (!activeRef.current || pausedRef.current || speakingRef.current || processingRef.current || performance.now() < resumeAtRef.current) {
          captureRef.current = emptyCapture(); return
        }
        setListening(true)
        const capture = captureRef.current
        capture.chunks.push(chunk.slice())
        capture.samples += chunk.length
        capture.activity = updateSpeechActivity(capture.activity, probabilities.isSpeech, chunk.length, speechDetectionMode(sendModeRef.current, awaitingReplyRef.current))
        if (shouldStopConversationIdle(capture.activity, 16000, sendModeRef.current, awaitingReplyRef.current)) {
          stop(); setNotice('Micrófono apagado tras 15 segundos sin voz. Pulsa Iniciar escucha para continuar.'); return
        }
        if (!capture.activity.voiced) {
          while (capture.samples > 16000 * 1.2 && capture.chunks.length > 1) capture.samples -= capture.chunks.shift()!.length
        } else if (capture.samples > 16000 * 25) {
          // El límite guarda el texto para revisión; no ejecuta una frase cortada.
          void sendCapture(true)
        } else if (pauseReached(capture.activity, 16000)) {
          void sendCapture(sendModeRef.current === 'manual')
        }
      } })
      if (generation !== generationRef.current) { await vad.destroy(); return }
      vadRef.current = vad
      await context.resume()
      if (generation !== generationRef.current) return
      activeRef.current = true
      pausedRef.current = false
      captureRef.current = emptyCapture()
      await vad.start()
      if (generation !== generationRef.current) return
      setEnabled(true); setListening(true)
      streamRef.current?.getAudioTracks().forEach(track => { track.onended = () => { stop(); setError('El micrófono se desconectó. Vuelve a iniciar la escucha.') } })
    } catch (cause) {
      if (generation !== generationRef.current) return
      const messages: Record<string, string> = {
        NotAllowedError: 'No tengo permiso para usar el micrófono. Habilítalo en tu navegador e inténtalo de nuevo.',
        NotFoundError: 'No se encontró un micrófono disponible.',
        NotReadableError: 'No se puede abrir el micrófono. Revisa si otra aplicación lo está usando.',
      }
      stop()
      setError(cause instanceof Error ? messages[cause.name] || cause.message : 'No se pudo abrir el micrófono.')
    } finally {
      startingRef.current = false
      setStarting(false)
    }
  }, [sendCapture, stop])

  const pause = useCallback((value: boolean) => {
    pausedRef.current = value
    captureRef.current = emptyCapture()
    if (value) requestRef.current?.abort()
    resumeAtRef.current = performance.now() + 350
    setListening(activeRef.current && !value && !speakingRef.current && !processingRef.current)
  }, [])

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return
    const generation = ++utteranceRef.current
    speakingRef.current = true
    setSpeaking(true)
    captureRef.current = emptyCapture()
    setListening(false)
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const spanish = window.speechSynthesis.getVoices().find(voice => voice.lang.startsWith('es'))
    if (spanish) utterance.voice = spanish
    utterance.lang = spanish?.lang || 'es-ES'
    const finish = () => {
      if (generation !== utteranceRef.current) return
      speakingRef.current = false
      setSpeaking(false)
      resumeAtRef.current = performance.now() + 350
      setListening(activeRef.current && !pausedRef.current && !processingRef.current)
    }
    utterance.onend = finish; utterance.onerror = finish
    window.speechSynthesis.speak(utterance)
  }, [])

  const interrupt = useCallback(() => {
    utteranceRef.current++
    window.speechSynthesis?.cancel()
    speakingRef.current = false
    setSpeaking(false)
    captureRef.current = emptyCapture()
    resumeAtRef.current = performance.now() + 150
    setListening(activeRef.current && !pausedRef.current && !processingRef.current)
  }, [])

  useEffect(() => {
    setSupported(window.isSecureContext && typeof navigator.mediaDevices?.getUserMedia === 'function' && typeof window.AudioContext === 'function')
    return stop
  }, [stop])

  return { supported, enabled, listening, starting, transcribing, speaking, sendMode, setSendMode, interrupt, notice,
    level, interim, error, start, stop, pause, speak, finish: () => sendCapture(false) }
}
