import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type AIMode = null | 'general' | 'odontograma'

// General mode phases
type GeneralPhase = 'idle' | 'listening' | 'processing' | 'response'

// Odontograma mode phases
type OdontoPhase = 'idle' | 'asking-pieza' | 'listening-pieza' | 'confirming-pieza' | 'asking-condicion' | 'listening-condicion' | 'confirming-condicion' | 'asking-obs' | 'listening-obs' | 'confirming-obs' | 'asking-more' | 'summary' | 'saved'

interface OdontoPieza {
  numero: string
  condicion: string
  condicionColor: string
  observacion: string
}

// ─── Tooth condition map ──────────────────────────────────────────────────────

const CONDICIONES: Record<string, { label: string; color: string; bgClass: string }> = {
  caries:       { label: 'Caries',        color: '#FCA5A5', bgClass: 'bg-rose-100 text-rose-700 border-rose-200' },
  restaurado:   { label: 'Restaurado',    color: '#93C5FD', bgClass: 'bg-blue-100 text-blue-700 border-blue-200' },
  extraido:     { label: 'Extraído',      color: '#6B7280', bgClass: 'bg-slate-200 text-slate-700 border-slate-300' },
  corona:       { label: 'Corona',        color: '#FCD34D', bgClass: 'bg-amber-100 text-amber-700 border-amber-200' },
  tratamiento:  { label: 'Tratamiento',   color: '#A78BFA', bgClass: 'bg-violet-100 text-violet-700 border-violet-200' },
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const GENERAL_DEMO = {
  question: '¿Cómo registro una extracción en el odontograma?',
  fragments: [
    'Para registrar una extracción en el odontograma, sigue estos pasos:',
    '\n\n**1.** Ve a la sección de **Pacientes** y selecciona el paciente.',
    '\n**2.** Abre la pestaña **Odontograma** en su perfil.',
    '\n**3.** Haz clic en la pieza dental que fue extraída.',
    '\n**4.** En el panel de estado, selecciona el color gris etiquetado como **"Extraído"**.',
    '\n**5.** La pieza se marcará con una ✕ indicando la extracción.',
    '\n\nTambién puedes usar el modo **Odontograma por voz** del asistente para dictarlo directamente.',
  ],
  delays: [400, 900, 1400, 1900, 2400, 2900, 3400],
  targetView: 'odontograma',
  targetLabel: 'Ir al Odontograma',
}

const ODONTO_DEMO_PIEZAS: { numero: string; condicion: string; obs: string }[] = [
  { numero: '14', condicion: 'caries', obs: 'Cara oclusal, profundidad moderada.' },
  { numero: '36', condicion: 'tratamiento', obs: 'Endodoncia previa, control necesario.' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SvgIcon({ d, className = 'w-4 h-4' }: { d: string; className?: string }) {
  return (
    <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

function MicIcon({ className = 'w-4 h-4', fill = false }: { className?: string; fill?: boolean }) {
  return fill
    ? <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z"/></svg>
    : <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z M19 10v2a7 7 0 01-14 0v-2 M12 19v4m-4 0h8"/></svg>
}

// ─── Waveform ─────────────────────────────────────────────────────────────────

function Waveform() {
  return (
    <div className="flex items-end justify-center gap-0.5 h-8">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="w-0.5 bg-rose-400 rounded-full wave-bar"
          style={{ height: `${20 + Math.random() * 60}%`, animationDelay: `${i * 0.04}s` }} />
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIAssistant({ onClose }: { onClose?: () => void }) {
  const [mode, setMode] = useState<AIMode>(null)

  // ─── General mode state ──────────────────────────────────────────────────
  const [gPhase, setGPhase] = useState<GeneralPhase>('idle')
  const [gTranscript, setGTranscript] = useState('')
  const [gResponse, setGResponse] = useState('')
  const [gTyping, setGTyping] = useState(false)

  // ─── Odontograma mode state ──────────────────────────────────────────────
  const [oPhase, setOPhase] = useState<OdontoPhase>('idle')
  const [oPiezas, setOPiezas] = useState<OdontoPieza[]>([])
  const [oCurrentPieza, setOCurrentPieza] = useState('')
  const [oCurrentCondicion, setOCurrentCondicion] = useState('')
  const [oCurrentObs, setOCurrentObs] = useState('')
  const [oLiveText, setOLiveText] = useState('')
  const [oDemoIdx, setODemoIdx] = useState(0)

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => { timeoutsRef.current.forEach(t => clearTimeout(t)) }
  }, [])

  function clearTimeouts() {
    timeoutsRef.current.forEach(t => clearTimeout(t))
    timeoutsRef.current = []
  }

  // ─── Mode selection ──────────────────────────────────────────────────────

  function selectMode(m: AIMode) {
    setMode(m)
    if (m === 'general') { setGPhase('idle'); setGTranscript(''); setGResponse('') }
    if (m === 'odontograma') { setOPhase('idle'); setOPiezas([]); setODemoIdx(0) }
  }

  function backToModeSelect() {
    clearTimeouts()
    setMode(null)
    setGPhase('idle'); setGTranscript(''); setGResponse('')
    setOPhase('idle'); setOPiezas([]); setODemoIdx(0)
    setOCurrentPieza(''); setOCurrentCondicion(''); setOCurrentObs('')
    setOLiveText('')
  }

  // ─── GENERAL MODE ────────────────────────────────────────────────────────

  function gStartListening() {
    setGTranscript('')
    setGPhase('listening')
    clearTimeouts()
    // Simulate transcription of the demo question
    const words = GENERAL_DEMO.question.split(' ')
    words.forEach((w, i) => {
      const t = setTimeout(() => {
        setGTranscript(prev => prev + (prev ? ' ' : '') + w)
      }, 300 + i * 200)
      timeoutsRef.current.push(t)
    })
    const t = setTimeout(() => { setGPhase('processing') }, 300 + words.length * 200 + 500)
    timeoutsRef.current.push(t)
  }

  function gStopListening() {
    clearTimeouts()
    setGPhase('processing')
  }

  useEffect(() => {
    if (gPhase === 'processing') {
      setGResponse('')
      setGTyping(true)
      const t = setTimeout(() => {
        setGPhase('response')
        // Type out response fragments
        GENERAL_DEMO.fragments.forEach((frag, i) => {
          const tt = setTimeout(() => {
            setGResponse(prev => prev + frag)
            if (i === GENERAL_DEMO.fragments.length - 1) setGTyping(false)
          }, GENERAL_DEMO.delays[i])
          timeoutsRef.current.push(tt)
        })
      }, 1200)
      timeoutsRef.current.push(t)
    }
  }, [gPhase])

  // ─── ODONTOGRAMA MODE ───────────────────────────────────────────────────

  function oStartForm() {
    setOPiezas([])
    setODemoIdx(0)
    setOCurrentPieza(''); setOCurrentCondicion(''); setOCurrentObs('')
    setOPhase('asking-pieza')
  }

  function oListenForField(field: 'pieza' | 'condicion' | 'obs') {
    setOLiveText('')
    clearTimeouts()

    const demo = ODONTO_DEMO_PIEZAS[oDemoIdx] || ODONTO_DEMO_PIEZAS[0]
    let text = ''
    let nextPhase: OdontoPhase = 'confirming-pieza'

    if (field === 'pieza') {
      text = demo.numero
      nextPhase = 'confirming-pieza'
      setOPhase('listening-pieza')
    } else if (field === 'condicion') {
      text = CONDICIONES[demo.condicion]?.label || demo.condicion
      nextPhase = 'confirming-condicion'
      setOPhase('listening-condicion')
    } else {
      text = demo.obs
      nextPhase = 'confirming-obs'
      setOPhase('listening-obs')
    }

    // Simulate typing
    const words = text.split(' ')
    words.forEach((w, i) => {
      const t = setTimeout(() => {
        setOLiveText(prev => prev + (prev ? ' ' : '') + w)
      }, 400 + i * 250)
      timeoutsRef.current.push(t)
    })
    const t = setTimeout(() => { setOPhase(nextPhase) }, 400 + words.length * 250 + 600)
    timeoutsRef.current.push(t)
  }

  function oStopListening() {
    clearTimeouts()
    if (oPhase === 'listening-pieza') setOPhase('confirming-pieza')
    else if (oPhase === 'listening-condicion') setOPhase('confirming-condicion')
    else if (oPhase === 'listening-obs') setOPhase('confirming-obs')
  }

  function oConfirmPieza() {
    setOCurrentPieza(oLiveText)
    setOLiveText('')
    setOPhase('asking-condicion')
  }

  function oConfirmCondicion() {
    const matchedKey = Object.keys(CONDICIONES).find(k =>
      CONDICIONES[k].label.toLowerCase() === oLiveText.toLowerCase()
    ) || 'caries'
    setOCurrentCondicion(matchedKey)
    setOLiveText('')
    setOPhase('asking-obs')
  }

  function oConfirmObs() {
    setOCurrentObs(oLiveText)
    setOLiveText('')
    // Save the piece
    const condInfo = CONDICIONES[oCurrentCondicion] || CONDICIONES.caries
    setOPiezas(prev => [...prev, {
      numero: oCurrentPieza,
      condicion: oCurrentCondicion,
      condicionColor: condInfo.color,
      observacion: oLiveText,
    }])
    setOPhase('asking-more')
  }

  function oSkipObs() {
    const condInfo = CONDICIONES[oCurrentCondicion] || CONDICIONES.caries
    setOPiezas(prev => [...prev, {
      numero: oCurrentPieza,
      condicion: oCurrentCondicion,
      condicionColor: condInfo.color,
      observacion: '',
    }])
    setOLiveText('')
    setOPhase('asking-more')
  }

  function oAddAnother() {
    setODemoIdx(i => i + 1)
    setOCurrentPieza(''); setOCurrentCondicion(''); setOCurrentObs('')
    setOLiveText('')
    setOPhase('asking-pieza')
  }

  function oGoToSummary() {
    setOPhase('summary')
  }

  function oRemovePieza(idx: number) {
    setOPiezas(prev => prev.filter((_, i) => i !== idx))
  }

  function oSave() {
    setOPhase('saved')
    setTimeout(() => backToModeSelect(), 2200)
  }

  // ─── Shared header ──────────────────────────────────────────────────────

  function getHeaderInfo() {
    if (!mode) return { title: 'Asistente IA', subtitle: 'Selecciona un modo', icon: 'idle', color: 'bg-slate-700' }
    if (mode === 'general') {
      if (gPhase === 'idle') return { title: 'Modo General', subtitle: 'Pregunta lo que necesites', icon: 'idle', color: 'bg-cyan-700' }
      if (gPhase === 'listening') return { title: 'Escuchando...', subtitle: 'Di tu pregunta con claridad', icon: 'listening', color: 'bg-rose-500' }
      if (gPhase === 'processing') return { title: 'Procesando...', subtitle: 'La IA está preparando la respuesta', icon: 'processing', color: 'bg-amber-500' }
      return { title: 'Respuesta', subtitle: 'Aquí tienes la explicación', icon: 'response', color: 'bg-cyan-600' }
    }
    // odontograma
    if (oPhase === 'idle') return { title: 'Modo Odontograma', subtitle: 'Registra hallazgos por voz', icon: 'idle', color: 'bg-violet-600' }
    if (oPhase.startsWith('listening')) return { title: 'Escuchando...', subtitle: 'Habla con claridad', icon: 'listening', color: 'bg-rose-500' }
    if (oPhase.startsWith('confirming')) return { title: 'Confirma', subtitle: '¿Es correcto?', icon: 'confirm', color: 'bg-cyan-600' }
    if (oPhase === 'summary') return { title: 'Resumen', subtitle: `${oPiezas.length} pieza${oPiezas.length !== 1 ? 's' : ''} registrada${oPiezas.length !== 1 ? 's' : ''}`, icon: 'summary', color: 'bg-violet-600' }
    if (oPhase === 'saved') return { title: '¡Guardado!', subtitle: 'Odontograma actualizado', icon: 'saved', color: 'bg-emerald-500' }
    return { title: 'Odontograma', subtitle: 'Dictado guiado', icon: 'idle', color: 'bg-violet-600' }
  }

  const header = getHeaderInfo()

  // Current odontogram step indicator
  function oGetStepLabel(): string {
    if (oPhase.includes('pieza')) return 'Paso 1 de 3: Pieza dental'
    if (oPhase.includes('condicion')) return 'Paso 2 de 3: Condición'
    if (oPhase.includes('obs')) return 'Paso 3 de 3: Observación'
    if (oPhase === 'asking-more') return 'Pieza completada'
    return ''
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none">
      <div className={`pointer-events-auto w-[440px] rounded-2xl shadow-2xl overflow-hidden slide-up flex flex-col ${
        !mode ? 'bg-white border border-slate-200' : 'bg-slate-900'
      }`} style={{ maxHeight: 'calc(100vh - 48px)' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className={`flex items-center justify-between px-5 py-4 shrink-0 ${
          !mode ? 'border-b border-slate-100' : 'border-b border-white/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${header.color}`}>
              {header.icon === 'listening' && (
                <>
                  <div className="absolute w-full h-full rounded-full bg-rose-500 pulse-ring opacity-60" />
                  <MicIcon className="w-4 h-4 text-white" fill />
                </>
              )}
              {header.icon === 'processing' && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {header.icon === 'idle' && <MicIcon className="w-4 h-4 text-white" fill />}
              {header.icon === 'confirm' && (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              )}
              {header.icon === 'response' && (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              )}
              {header.icon === 'summary' && (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              )}
              {header.icon === 'saved' && (
                <svg className="w-4 h-4 text-white step-complete" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
              )}
            </div>
            <div>
              <p className={`text-sm font-semibold ${!mode ? 'text-slate-800' : 'text-white'}`} style={{ fontFamily: 'Outfit' }}>{header.title}</p>
              <p className={`text-xs ${!mode ? 'text-slate-400' : 'text-white/50'}`}>{header.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {mode && (
              <button onClick={backToModeSelect} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors" title="Cambiar modo">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              </button>
            )}
            {onClose && (
              <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${
                !mode ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            )}
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* ━━ MODE SELECTOR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {!mode && (
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-500 text-center mb-2">¿Qué necesitas hacer?</p>

              {/* General card */}
              <button onClick={() => selectMode('general')}
                className="w-full text-left bg-gradient-to-br from-cyan-50 to-white border border-cyan-200 rounded-2xl p-4 hover:shadow-md hover:border-cyan-300 transition-all group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center shrink-0 group-hover:bg-cyan-200 transition-colors">
                    <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>General</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Pregunta sobre procedimientos, registro de datos, o navegación del sistema. La IA te explica paso a paso.</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-cyan-400 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </div>
              </button>

              {/* Odontograma card */}
              <button onClick={() => selectMode('odontograma')}
                className="w-full text-left bg-gradient-to-br from-violet-50 to-white border border-violet-200 rounded-2xl p-4 hover:shadow-md hover:border-violet-300 transition-all group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 group-hover:bg-violet-200 transition-colors">
                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4c-2.5 0-4.5 2-4.5 4.8L8 14.8c.1.9.7 1.4 1.6 1.4s1-.8 2-.8 1.5.8 2.4.8c.9 0 1.5-.5 1.6-1.4l.4-6c0-2.8-2-4.8-4.5-4.8z"/>
                      <polyline points="8,5 9.2,2 12,4.5 14.8,2 16,5" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>Odontograma</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Dicta hallazgos pieza por pieza. La IA te pregunta número, condición y observación para cada diente.</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-violet-400 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </div>
              </button>

              <p className="text-[10px] text-slate-300 text-center pt-1">Atajo: <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono">Ctrl+Shift+V</kbd></p>
            </div>
          )}

          {/* ━━ GENERAL MODE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

          {mode === 'general' && gPhase === 'idle' && (
            <div className="p-5 space-y-4">
              <div className="bg-cyan-500/8 border border-cyan-500/20 rounded-xl p-4 text-center">
                <svg className="w-8 h-8 mx-auto mb-2 text-cyan-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                <p className="text-sm text-white font-medium mb-1">¿En qué te puedo ayudar?</p>
                <p className="text-xs text-white/40">Pregunta sobre cualquier procedimiento o funcionalidad del sistema</p>
              </div>

              <button onClick={gStartListening}
                className="w-full py-3 bg-rose-500/15 border border-rose-400/30 text-rose-300 rounded-xl font-semibold hover:bg-rose-500/25 transition-all flex items-center justify-center gap-2.5 text-sm group">
                <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MicIcon className="w-4 h-4 text-white" fill />
                </div>
                Preguntar por voz
              </button>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] text-white/25">Ejemplos</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="space-y-1.5">
                {[
                  '¿Cómo registro una extracción?',
                  '¿Cómo agendo una cita de urgencia?',
                  '¿Cómo agrego una alergia al paciente?',
                ].map(q => (
                  <button key={q} onClick={gStartListening}
                    className="w-full text-left px-3 py-2 rounded-lg bg-white/5 text-white/50 text-xs hover:bg-white/10 hover:text-white/70 transition-all">
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'general' && gPhase === 'listening' && (
            <div className="p-5 space-y-4">
              <Waveform />
              <div className="bg-white/8 rounded-xl p-4 min-h-[60px] border border-white/5">
                <p className="text-xs text-white/40 mb-2 uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>Tu pregunta</p>
                <p className="text-sm text-white leading-relaxed">
                  {gTranscript || <span className="text-white/20 italic">Esperando audio...</span>}
                  {gTranscript && <span className="cursor-blink text-rose-400 ml-0.5">|</span>}
                </p>
              </div>
              <button onClick={gStopListening}
                className="w-full py-2.5 bg-rose-500/20 border border-rose-400/30 text-rose-300 rounded-xl font-medium hover:bg-rose-500/30 transition-colors flex items-center justify-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
                Detener
              </button>
            </div>
          )}

          {mode === 'general' && gPhase === 'processing' && (
            <div className="p-5">
              <div className="bg-white/5 rounded-xl p-3 mb-4">
                <p className="text-xs text-white/40 mb-1">Tu pregunta:</p>
                <p className="text-sm text-white/60 italic">"{gTranscript || GENERAL_DEMO.question}"</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0" />
                <p className="text-sm text-white/70">Buscando respuesta...</p>
              </div>
            </div>
          )}

          {mode === 'general' && gPhase === 'response' && (
            <div className="p-5 space-y-4">
              {/* Question echo */}
              <div className="bg-white/5 rounded-lg px-3 py-2">
                <p className="text-xs text-white/40">Tu pregunta:</p>
                <p className="text-xs text-white/60 italic mt-0.5">"{gTranscript || GENERAL_DEMO.question}"</p>
              </div>

              {/* AI Response */}
              <div className="bg-cyan-500/8 border border-cyan-500/15 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md bg-cyan-500/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  </div>
                  <p className="text-xs text-cyan-400 font-semibold" style={{ fontFamily: 'Outfit' }}>CORONYX IA</p>
                  {gTyping && <span className="cursor-blink text-cyan-400 text-xs">●</span>}
                </div>
                <div className="text-sm text-white/80 leading-relaxed whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: gResponse.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }}
                />
              </div>

              {/* Action button: Go to view */}
              {!gTyping && (
                <div className="space-y-2 question-enter">
                  <button onClick={backToModeSelect}
                    className="w-full py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 transition-colors flex items-center justify-center gap-2">
                    <SvgIcon d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" className="w-4 h-4" />
                    {GENERAL_DEMO.targetLabel}
                  </button>
                  <button onClick={gStartListening}
                    className="w-full py-2 text-xs text-white/40 hover:text-white/60 transition-colors">
                    Hacer otra pregunta
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ━━ ODONTOGRAMA MODE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

          {mode === 'odontograma' && oPhase === 'idle' && (
            <div className="p-5 space-y-4">
              <div className="bg-violet-500/8 border border-violet-500/20 rounded-xl p-4 text-center">
                <svg className="w-10 h-10 mx-auto mb-2 text-violet-400/50" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4c-2.5 0-4.5 2-4.5 4.8L8 14.8c.1.9.7 1.4 1.6 1.4s1-.8 2-.8 1.5.8 2.4.8c.9 0 1.5-.5 1.6-1.4l.4-6c0-2.8-2-4.8-4.5-4.8z"/>
                  <polyline points="8,5 9.2,2 12,4.5 14.8,2 16,5" strokeLinejoin="round"/>
                </svg>
                <p className="text-sm text-white font-medium mb-1" style={{ fontFamily: 'Outfit' }}>Odontograma por voz</p>
                <p className="text-xs text-white/40 leading-relaxed max-w-[280px] mx-auto">La IA te preguntará pieza por pieza: número, condición y observación. Puedes registrar múltiples piezas.</p>
              </div>

              {/* Preview of the 3 steps */}
              <div className="space-y-1.5">
                {[
                  { step: '1', label: '¿Qué pieza?', desc: 'Número del diente (ej. 14, 36)', icon: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14' },
                  { step: '2', label: '¿Qué condición?', desc: 'Caries, restaurado, extraído, corona...', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { step: '3', label: '¿Observación?', desc: 'Detalles adicionales (opcional)', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
                ].map(s => (
                  <div key={s.step} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
                    <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-bold flex items-center justify-center shrink-0">{s.step}</span>
                    <SvgIcon d={s.icon} className="w-3.5 h-3.5 text-violet-400/50" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 font-medium">{s.label}</p>
                      <p className="text-[10px] text-white/30">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={oStartForm}
                className="w-full py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-500 transition-colors flex items-center justify-center gap-2 text-sm" style={{ fontFamily: 'Outfit' }}>
                <MicIcon className="w-5 h-5 text-white" fill />
                Iniciar registro por voz
              </button>
            </div>
          )}

          {/* Odontograma step indicator */}
          {mode === 'odontograma' && !['idle', 'summary', 'saved'].includes(oPhase) && (
            <div className="px-5 py-2.5 border-b border-white/5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-violet-400/70" style={{ fontFamily: 'Outfit' }}>{oGetStepLabel()}</p>
                {oPiezas.length > 0 && (
                  <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                    {oPiezas.length} pieza{oPiezas.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map(step => {
                  const stepNames = ['pieza', 'condicion', 'obs']
                  const currentStep = oPhase.includes('pieza') ? 0 : oPhase.includes('condicion') ? 1 : 2
                  const isComplete = step - 1 < currentStep
                  const isActive = step - 1 === currentStep
                  return (
                    <div key={step} className={`flex-1 h-1 rounded-full transition-all ${
                      isComplete ? 'bg-violet-500' : isActive ? 'bg-violet-400/50' : 'bg-white/8'
                    }`} />
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Asking pieza ─────────────────────────────────────────────── */}
          {mode === 'odontograma' && oPhase === 'asking-pieza' && (
            <div className="p-5 space-y-4 question-enter">
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 field-glow" style={{ '--tw-border-opacity': 1, borderColor: 'rgba(139,92,246,0.3)' } as any}>
                <p className="text-xs text-violet-400/60 uppercase tracking-wider mb-1" style={{ fontFamily: 'Outfit' }}>Pieza dental</p>
                <p className="text-white text-sm font-medium">¿Qué pieza vas a registrar?</p>
                <p className="text-white/30 text-xs mt-1">Di el número del diente (ej. "catorce", "treinta y seis")</p>
              </div>
              <button onClick={() => oListenForField('pieza')}
                className="w-full py-3 bg-rose-500/15 border border-rose-400/30 text-rose-300 rounded-xl font-semibold hover:bg-rose-500/25 transition-all flex items-center justify-center gap-2.5 text-sm group">
                <div className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MicIcon className="w-3.5 h-3.5 text-white" fill />
                </div>
                Dictar pieza
              </button>
              {oPiezas.length > 0 && (
                <button onClick={oGoToSummary} className="w-full py-2 text-xs text-white/30 hover:text-white/50 transition-colors">
                  Ir al resumen ({oPiezas.length} pieza{oPiezas.length !== 1 ? 's' : ''})
                </button>
              )}
            </div>
          )}

          {/* ── Listening (all odonto fields) ────────────────────────────── */}
          {mode === 'odontograma' && oPhase.startsWith('listening') && (
            <div className="p-5 space-y-4">
              <Waveform />
              <div className="bg-white/8 rounded-xl p-4 min-h-[50px] border border-white/5">
                <p className="text-xs text-white/40 mb-2 uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>Transcripción</p>
                <p className="text-sm text-white leading-relaxed">
                  {oLiveText || <span className="text-white/20 italic">Esperando audio...</span>}
                  {oLiveText && <span className="cursor-blink text-rose-400 ml-0.5">|</span>}
                </p>
              </div>
              <button onClick={oStopListening}
                className="w-full py-2.5 bg-rose-500/20 border border-rose-400/30 text-rose-300 rounded-xl font-medium hover:bg-rose-500/30 transition-colors flex items-center justify-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
                Detener
              </button>
            </div>
          )}

          {/* ── Confirming pieza ──────────────────────────────────────────── */}
          {mode === 'odontograma' && oPhase === 'confirming-pieza' && (
            <div className="p-5 space-y-4 question-enter">
              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4 text-center">
                <p className="text-xs text-emerald-400 mb-2" style={{ fontFamily: 'Outfit' }}>PIEZA DETECTADA</p>
                <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>#{oLiveText}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setOLiveText(''); setOPhase('asking-pieza') }}
                  className="flex-1 py-2.5 bg-white/8 text-white/60 rounded-xl text-sm font-medium hover:bg-white/15 transition-colors flex items-center justify-center gap-2">
                  <MicIcon className="w-4 h-4" fill /> Repetir
                </button>
                <button onClick={oConfirmPieza}
                  className="flex-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  Confirmar
                </button>
              </div>
            </div>
          )}

          {/* ── Asking condición ─────────────────────────────────────────── */}
          {mode === 'odontograma' && oPhase === 'asking-condicion' && (
            <div className="p-5 space-y-4 question-enter">
              <div className="bg-white/5 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="text-xs text-violet-400 font-semibold">Pieza #{oCurrentPieza}</span>
              </div>
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                <p className="text-xs text-violet-400/60 uppercase tracking-wider mb-1" style={{ fontFamily: 'Outfit' }}>Condición</p>
                <p className="text-white text-sm font-medium">¿Qué condición tiene la pieza #{oCurrentPieza}?</p>
              </div>
              {/* Condition chips */}
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(CONDICIONES).map(([key, info]) => (
                  <button key={key} onClick={() => { setOCurrentCondicion(key); setOPhase('asking-obs') }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:scale-105 ${info.bgClass}`}>
                    {info.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] text-white/20">o dictar</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <button onClick={() => oListenForField('condicion')}
                className="w-full py-2.5 bg-rose-500/15 border border-rose-400/30 text-rose-300 rounded-xl font-medium hover:bg-rose-500/25 transition-all flex items-center justify-center gap-2 text-sm">
                <MicIcon className="w-4 h-4 text-rose-300" fill />
                Dictar condición
              </button>
            </div>
          )}

          {/* ── Confirming condición ──────────────────────────────────────── */}
          {mode === 'odontograma' && oPhase === 'confirming-condicion' && (
            <div className="p-5 space-y-4 question-enter">
              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4 text-center">
                <p className="text-xs text-emerald-400 mb-2" style={{ fontFamily: 'Outfit' }}>CONDICIÓN DETECTADA</p>
                <p className="text-lg font-bold text-white">{oLiveText}</p>
                <p className="text-xs text-white/30 mt-1">Pieza #{oCurrentPieza}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setOLiveText(''); setOPhase('asking-condicion') }}
                  className="flex-1 py-2.5 bg-white/8 text-white/60 rounded-xl text-sm font-medium hover:bg-white/15 transition-colors">
                  Cambiar
                </button>
                <button onClick={oConfirmCondicion}
                  className="flex-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  Confirmar
                </button>
              </div>
            </div>
          )}

          {/* ── Asking observación ───────────────────────────────────────── */}
          {mode === 'odontograma' && oPhase === 'asking-obs' && (
            <div className="p-5 space-y-4 question-enter">
              <div className="bg-white/5 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="text-xs text-violet-400 font-semibold">Pieza #{oCurrentPieza}</span>
                <span className="text-[10px] text-white/20">·</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${CONDICIONES[oCurrentCondicion]?.bgClass || 'bg-white/10 text-white/50 border-white/20'}`}>
                  {CONDICIONES[oCurrentCondicion]?.label || oCurrentCondicion}
                </span>
              </div>
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                <p className="text-xs text-violet-400/60 uppercase tracking-wider mb-1" style={{ fontFamily: 'Outfit' }}>Observación</p>
                <p className="text-white text-sm font-medium">¿Alguna observación adicional para la pieza #{oCurrentPieza}?</p>
              </div>
              <button onClick={() => oListenForField('obs')}
                className="w-full py-2.5 bg-rose-500/15 border border-rose-400/30 text-rose-300 rounded-xl font-medium hover:bg-rose-500/25 transition-all flex items-center justify-center gap-2 text-sm">
                <MicIcon className="w-4 h-4 text-rose-300" fill />
                Dictar observación
              </button>
              <button onClick={oSkipObs}
                className="w-full py-2 text-xs text-amber-400/50 hover:text-amber-400 transition-colors">
                Saltar (sin observación)
              </button>
            </div>
          )}

          {/* ── Confirming observación ────────────────────────────────────── */}
          {mode === 'odontograma' && oPhase === 'confirming-obs' && (
            <div className="p-5 space-y-4 question-enter">
              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-xs text-emerald-400 mb-2" style={{ fontFamily: 'Outfit' }}>OBSERVACIÓN</p>
                <p className="text-sm text-white">{oLiveText}</p>
                <p className="text-xs text-white/30 mt-2">Pieza #{oCurrentPieza} · {CONDICIONES[oCurrentCondicion]?.label}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setOLiveText(''); setOPhase('asking-obs') }}
                  className="flex-1 py-2.5 bg-white/8 text-white/60 rounded-xl text-sm font-medium hover:bg-white/15 transition-colors">
                  Repetir
                </button>
                <button onClick={oConfirmObs}
                  className="flex-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  Confirmar
                </button>
              </div>
            </div>
          )}

          {/* ── Asking: more pieces? ─────────────────────────────────────── */}
          {mode === 'odontograma' && oPhase === 'asking-more' && (
            <div className="p-5 space-y-4 question-enter">
              {/* Just registered piece */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-emerald-400 step-complete" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <p className="text-xs text-emerald-400 font-semibold" style={{ fontFamily: 'Outfit' }}>Pieza registrada</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>#{oPiezas[oPiezas.length - 1]?.numero}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded border ${CONDICIONES[oPiezas[oPiezas.length - 1]?.condicion]?.bgClass || ''}`}>
                    {CONDICIONES[oPiezas[oPiezas.length - 1]?.condicion]?.label}
                  </span>
                </div>
                {oPiezas[oPiezas.length - 1]?.observacion && (
                  <p className="text-xs text-white/50 mt-1">{oPiezas[oPiezas.length - 1]?.observacion}</p>
                )}
              </div>

              <p className="text-sm text-white text-center font-medium">¿Quieres registrar otra pieza?</p>

              <div className="flex gap-2">
                <button onClick={oGoToSummary}
                  className="flex-1 py-2.5 bg-white/8 text-white/60 rounded-xl text-sm font-medium hover:bg-white/15 transition-colors">
                  No, ir al resumen
                </button>
                <button onClick={oAddAnother}
                  className="flex-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-500 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                  Sí, otra pieza
                </button>
              </div>
            </div>
          )}

          {/* ── Summary ──────────────────────────────────────────────────── */}
          {mode === 'odontograma' && oPhase === 'summary' && (
            <div className="p-5 space-y-3">
              {/* Progress */}
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full transition-all"
                    style={{ width: oPiezas.length > 0 ? '100%' : '0%' }} />
                </div>
                <span className="text-xs text-white/40 shrink-0">{oPiezas.length} pieza{oPiezas.length !== 1 ? 's' : ''}</span>
              </div>

              {oPiezas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-white/30">No hay piezas registradas</p>
                  <button onClick={oAddAnother} className="mt-2 text-xs text-violet-400 hover:text-violet-300 font-semibold">
                    + Agregar pieza
                  </button>
                </div>
              ) : (
                oPiezas.map((pieza, i) => {
                  const condInfo = CONDICIONES[pieza.condicion]
                  return (
                    <div key={i} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: condInfo?.color || '#6B7280' }}>
                          <span className="text-xs font-bold text-white">{pieza.numero}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">Pieza #{pieza.numero}</span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${condInfo?.bgClass || 'bg-white/10 text-white/50 border-white/20'}`}>
                              {condInfo?.label || pieza.condicion}
                            </span>
                          </div>
                          {pieza.observacion && (
                            <p className="text-xs text-white/40 mt-0.5 truncate">{pieza.observacion}</p>
                          )}
                        </div>
                        <button onClick={() => oRemovePieza(i)}
                          className="p-1 rounded text-white/15 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Eliminar">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                    </div>
                  )
                })
              )}

              {/* Add more */}
              <button onClick={oAddAnother}
                className="w-full py-2 rounded-xl border border-dashed border-white/10 text-xs text-white/30 hover:text-violet-400 hover:border-violet-400/30 transition-all flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                Agregar otra pieza
              </button>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button onClick={backToModeSelect}
                  className="flex-1 py-2.5 bg-white/8 text-white/60 rounded-xl text-sm font-medium hover:bg-white/15 transition-colors">
                  Descartar
                </button>
                <button onClick={oSave} disabled={oPiezas.length === 0}
                  className={`flex-2 px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    oPiezas.length === 0 ? 'bg-emerald-500/30 text-white/40 cursor-not-allowed' : 'bg-emerald-500 text-white hover:bg-emerald-400'
                  }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  Guardar en odontograma
                </button>
              </div>
            </div>
          )}

          {/* ── Saved ────────────────────────────────────────────────────── */}
          {mode === 'odontograma' && oPhase === 'saved' && (
            <div className="p-5 text-center">
              <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-white step-complete" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
              </div>
              <p className="text-white font-semibold text-base" style={{ fontFamily: 'Outfit' }}>Odontograma actualizado</p>
              <p className="text-white/50 text-sm mt-1">{oPiezas.length} pieza{oPiezas.length !== 1 ? 's' : ''} registrada{oPiezas.length !== 1 ? 's' : ''}</p>
              <div className="flex items-center justify-center gap-1.5 mt-3 text-white/30 text-xs">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
