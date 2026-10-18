import { useCallback, useEffect, useRef, useState } from 'react'

interface RecognitionResult { isFinal: boolean; [index: number]: { transcript: string } }
interface Recognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: { error: string }) => void) | null
  onresult: ((event: { resultIndex: number; results: ArrayLike<RecognitionResult> }) => void) | null
}
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }

export default function useCoroVozSpeech(onText: (text: string) => void) {
  const [supported, setSupported] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState('')
  const callbackRef = useRef(onText)
  callbackRef.current = onText
  const recognitionRef = useRef<Recognition | null>(null)
  const enabledRef = useRef(false)
  const runningRef = useRef(false)
  const pausedRef = useRef(false)
  const speakingRef = useRef(false)
  const utteranceRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const resume = useCallback(() => {
    clearTimeout(timerRef.current)
    if (!enabledRef.current || runningRef.current || pausedRef.current || speakingRef.current) return
    timerRef.current = setTimeout(() => {
      if (!enabledRef.current || runningRef.current || pausedRef.current || speakingRef.current) return
      try { recognitionRef.current?.start() } catch { /* Ya iniciada por el navegador. */ }
    }, 300)
  }, [])

  const stop = useCallback(() => {
    enabledRef.current = false
    speakingRef.current = false
    pausedRef.current = false
    utteranceRef.current++
    clearTimeout(timerRef.current)
    recognitionRef.current?.abort()
    window.speechSynthesis?.cancel()
    setEnabled(false)
    setListening(false)
    setInterim('')
  }, [])

  useEffect(() => {
    const speechWindow = window as SpeechWindow
    const Constructor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    setSupported(Boolean(Constructor))
    if (!Constructor) return
    const recognition = new Constructor()
    recognitionRef.current = recognition
    recognition.lang = 'es-PE'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onstart = () => { runningRef.current = true; setListening(true) }
    recognition.onend = () => { runningRef.current = false; setListening(false); resume() }
    recognition.onresult = event => {
      let final = '', partial = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) final += `${result[0].transcript} `
        else partial += result[0].transcript
      }
      setInterim(partial)
      if (final.trim() && !pausedRef.current && !speakingRef.current) callbackRef.current(final.trim())
    }
    recognition.onerror = event => {
      if (event.error === 'aborted' || event.error === 'no-speech') return
      const messages: Record<string, string> = {
        'not-allowed': 'Permite el micrófono en el navegador o continúa escribiendo.',
        'audio-capture': 'No se encontró un micrófono disponible.',
        'network': 'El reconocimiento de voz no pudo conectarse. Puedes seguir escribiendo.',
        'language-not-supported': 'El navegador no admite este idioma de voz. Puedes seguir escribiendo.',
      }
      stop()
      setError(messages[event.error] || 'El reconocimiento de voz se detuvo. Puedes seguir escribiendo.')
    }
    return () => {
      enabledRef.current = false
      utteranceRef.current++
      clearTimeout(timerRef.current)
      recognition.onend = null
      recognition.onerror = null
      recognition.onresult = null
      recognition.onstart = null
      recognition.abort()
      window.speechSynthesis?.cancel()
      recognitionRef.current = null
      runningRef.current = false
    }
  }, [resume, stop])

  const start = useCallback(() => {
    if (!recognitionRef.current) return
    setError('')
    enabledRef.current = true
    pausedRef.current = false
    setEnabled(true)
    try { recognitionRef.current.start() } catch { resume() }
  }, [resume])

  const pause = useCallback((value: boolean) => {
    pausedRef.current = value
    if (value) recognitionRef.current?.stop()
    else resume()
  }, [resume])

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return
    const generation = ++utteranceRef.current
    speakingRef.current = true
    recognitionRef.current?.stop()
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-PE'
    utterance.rate = 1
    const finish = () => {
      if (utteranceRef.current !== generation) return
      speakingRef.current = false
      resume()
    }
    utterance.onend = finish
    utterance.onerror = finish
    window.speechSynthesis.speak(utterance)
  }, [resume])

  return { supported, enabled, listening, interim, error, start, stop, pause, speak }
}
