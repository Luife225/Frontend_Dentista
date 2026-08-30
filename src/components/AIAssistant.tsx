import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'asking' | 'listening' | 'confirming' | 'summary' | 'saved'
type FieldStatus = 'pending' | 'active' | 'completed' | 'skipped'

interface FormField {
  id: string
  label: string
  question: string
  icon: string
  status: FieldStatus
  value: string
}

// ─── Clinical form fields ─────────────────────────────────────────────────────

const FORM_FIELDS: Omit<FormField, 'status' | 'value'>[] = [
  { id: 'motivo',        label: 'Motivo de consulta', question: '¿Cuál es el motivo de consulta del paciente?',  icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { id: 'diagnostico',   label: 'Diagnóstico',        question: '¿Qué has diagnosticado?',                       icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { id: 'hallazgos',     label: 'Hallazgos',          question: '¿Qué hallazgos clínicos encontraste?',          icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
  { id: 'tratamiento',   label: 'Tratamiento',        question: '¿Qué tratamiento recomiendas?',                 icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  { id: 'indicaciones',  label: 'Indicaciones',       question: '¿Qué indicaciones le das al paciente?',         icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { id: 'observaciones', label: 'Observaciones',      question: '¿Alguna observación adicional?',                icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
]

// ─── Demo transcriptions per field ────────────────────────────────────────────

const DEMO_RESPONSES: Record<string, { fragments: string[]; delays: number[] }> = {
  motivo:        { fragments: ['Control periódico', ' y dolor en zona', ' posterior inferior.'],                                   delays: [600, 1400, 2400] },
  diagnostico:   { fragments: ['Caries activa en diente catorce,', ' cara oclusal,', ' profundidad moderada.'],                   delays: [700, 1600, 2600] },
  hallazgos:     { fragments: ['Sensibilidad en diente treinta y seis', ' con tratamiento previo de endodoncia,', ' posible microfractura radicular.'], delays: [800, 1800, 2800] },
  tratamiento:   { fragments: ['Radiografía periapical', ' para dientes catorce y treinta y seis.', ' Aplicación de flúor profesional dos por ciento.'], delays: [700, 1700, 2900] },
  indicaciones:  { fragments: ['No consumir alimentos', ' calientes o fríos por dos horas.', ' Cepillado suave en zona posterior.'], delays: [600, 1500, 2500] },
  observaciones: { fragments: ['Control en cuatro semanas.', ' Paciente colaborador,', ' pronóstico favorable.'],                  delays: [700, 1600, 2500] },
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AIAssistant({ onClose }: { onClose?: () => void }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [fields, setFields] = useState<FormField[]>(() =>
    FORM_FIELDS.map(f => ({ ...f, status: 'pending' as FieldStatus, value: '' }))
  )
  const [currentIdx, setCurrentIdx] = useState(0)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [animKey, setAnimKey] = useState(0)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => { timeoutsRef.current.forEach(t => clearTimeout(t)) }
  }, [])

  // ─── Field helpers ─────────────────────────────────────────────────────────

  const updateField = useCallback((idx: number, updates: Partial<FormField>) => {
    setFields(prev => prev.map((f, i) => i === idx ? { ...f, ...updates } : f))
  }, [])

  const completedCount = fields.filter(f => f.status === 'completed').length
  const totalFields = fields.length

  // ─── Phase transitions ─────────────────────────────────────────────────────

  function startForm() {
    setFields(FORM_FIELDS.map(f => ({ ...f, status: 'pending' as FieldStatus, value: '' })))
    setCurrentIdx(0)
    setAnimKey(k => k + 1)
    setPhase('asking')
    // Mark first field as active
    setFields(prev => prev.map((f, i) => i === 0 ? { ...f, status: 'active' } : f))
  }

  function startListening() {
    setLiveTranscript('')
    setPhase('listening')

    // Simulate live transcription for current field
    const fieldId = fields[currentIdx].id
    const demo = DEMO_RESPONSES[fieldId]
    if (!demo) return

    timeoutsRef.current.forEach(t => clearTimeout(t))
    timeoutsRef.current = []

    demo.fragments.forEach((frag, i) => {
      const t = setTimeout(() => {
        setLiveTranscript(prev => prev + frag)
      }, demo.delays[i])
      timeoutsRef.current.push(t)
    })

    // Auto-stop after last fragment + 800ms buffer
    const lastDelay = demo.delays[demo.delays.length - 1]
    const t = setTimeout(() => {
      stopListening()
    }, lastDelay + 800)
    timeoutsRef.current.push(t)
  }

  function stopListening() {
    timeoutsRef.current.forEach(t => clearTimeout(t))
    timeoutsRef.current = []
    setPhase('confirming')
  }

  function confirmField() {
    updateField(currentIdx, { value: liveTranscript, status: 'completed' })
    advanceToNext()
  }

  function redictateField() {
    setLiveTranscript('')
    setPhase('asking')
  }

  function skipField() {
    updateField(currentIdx, { status: 'skipped' })
    advanceToNext()
  }

  function advanceToNext() {
    const nextIdx = currentIdx + 1
    if (nextIdx >= totalFields) {
      setPhase('summary')
    } else {
      setCurrentIdx(nextIdx)
      setAnimKey(k => k + 1)
      setPhase('asking')
      updateField(nextIdx, { status: 'active' })
    }
  }

  function goToPrevious() {
    if (currentIdx <= 0) return
    const prevIdx = currentIdx - 1
    setCurrentIdx(prevIdx)
    setAnimKey(k => k + 1)
    setPhase('asking')
    updateField(prevIdx, { status: 'active' })
  }

  function goToStep(idx: number) {
    if (phase === 'listening') return // Don't navigate while listening
    setCurrentIdx(idx)
    setAnimKey(k => k + 1)
    updateField(idx, { status: 'active' })
    setPhase('asking')
  }

  function goToSummary() {
    // Mark remaining pending fields as skipped
    setFields(prev => prev.map(f => f.status === 'pending' || f.status === 'active' ? { ...f, status: 'skipped' } : f))
    setPhase('summary')
  }

  function redictateFromSummary(idx: number) {
    setCurrentIdx(idx)
    setAnimKey(k => k + 1)
    updateField(idx, { status: 'active' })
    setPhase('asking')
  }

  function saveAll() {
    setPhase('saved')
    setTimeout(() => setPhase('idle'), 2200)
  }

  function discardAll() {
    setPhase('idle')
    setFields(FORM_FIELDS.map(f => ({ ...f, status: 'pending' as FieldStatus, value: '' })))
    setCurrentIdx(0)
    setLiveTranscript('')
  }

  // ─── Render helpers ────────────────────────────────────────────────────────

  const currentField = fields[currentIdx]

  function FieldIcon({ d, className = '' }: { d: string; className?: string }) {
    return (
      <svg className={`w-4 h-4 shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    )
  }

  // ─── Stepper ───────────────────────────────────────────────────────────────

  function Stepper() {
    return (
      <div className="px-5 py-3 border-b border-white/8">
        {/* Progress text */}
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-xs text-white/50" style={{ fontFamily: 'Outfit' }}>
            {phase === 'summary' ? 'Resumen del formulario' : `Pregunta ${currentIdx + 1} de ${totalFields}`}
          </p>
          <p className="text-xs text-white/40">
            {completedCount} de {totalFields} completados
          </p>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1">
          {fields.map((field, i) => {
            const isActive = i === currentIdx && phase !== 'summary'
            const isCompleted = field.status === 'completed'
            const isSkipped = field.status === 'skipped'
            const isClickable = phase !== 'listening'

            return (
              <div key={field.id} className="flex items-center flex-1">
                {/* Step dot */}
                <button
                  onClick={() => isClickable && goToStep(i)}
                  disabled={!isClickable}
                  title={field.label}
                  className={`relative w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                      : isActive
                      ? 'bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-400/50 step-pulse'
                      : isSkipped
                      ? 'bg-amber-500/15 text-amber-400/60 ring-1 ring-amber-500/20'
                      : 'bg-white/5 text-white/25 ring-1 ring-white/10'
                  } ${isClickable ? 'cursor-pointer hover:ring-white/30' : 'cursor-default'}`}
                >
                  {isCompleted ? (
                    <svg className="w-3.5 h-3.5 step-complete" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isSkipped ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeWidth={2} d="M5 12h14" />
                    </svg>
                  ) : (
                    <span className="text-[10px] font-bold">{i + 1}</span>
                  )}
                </button>

                {/* Connector line */}
                {i < totalFields - 1 && (
                  <div className={`flex-1 h-0.5 mx-0.5 rounded-full transition-all duration-500 ${
                    isCompleted ? 'bg-emerald-500/40' : 'bg-white/8'
                  }`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Current field label */}
        {phase !== 'summary' && (
          <p className="text-xs text-cyan-400/70 mt-2 font-medium" style={{ fontFamily: 'Outfit' }}>
            {currentField?.label}
          </p>
        )}
      </div>
    )
  }

  // ─── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none">
      <div className={`pointer-events-auto w-[440px] rounded-2xl shadow-2xl overflow-hidden slide-up flex flex-col ${
        phase === 'idle' ? 'bg-white border border-slate-200' : 'bg-slate-900'
      }`} style={{ maxHeight: 'calc(100vh - 48px)' }}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className={`flex items-center justify-between px-5 py-4 shrink-0 ${
          phase !== 'idle' ? 'border-b border-white/10' : 'border-b border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${
              phase === 'listening' ? 'bg-rose-500' :
              phase === 'confirming' ? 'bg-cyan-600' :
              phase === 'saved' ? 'bg-emerald-500' :
              phase === 'summary' ? 'bg-cyan-600' :
              phase === 'asking' ? 'bg-slate-700' :
              'bg-slate-700'
            }`}>
              {phase === 'listening' && (
                <>
                  <div className="absolute w-full h-full rounded-full bg-rose-500 pulse-ring opacity-60"></div>
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z"/></svg>
                </>
              )}
              {(phase === 'idle' || phase === 'asking') && (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z"/></svg>
              )}
              {phase === 'confirming' && (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              )}
              {phase === 'summary' && (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              )}
              {phase === 'saved' && (
                <svg className="w-4 h-4 text-white step-complete" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
              )}
            </div>
            <div>
              <p className={`text-sm font-semibold ${phase !== 'idle' ? 'text-white' : 'text-slate-800'}`} style={{ fontFamily: 'Outfit' }}>
                {phase === 'idle' ? 'Asistente de Voz' :
                 phase === 'asking' ? 'Formulario Guiado' :
                 phase === 'listening' ? 'Escuchando...' :
                 phase === 'confirming' ? 'Confirma la respuesta' :
                 phase === 'summary' ? 'Resumen clínico' :
                 '¡Nota guardada!'}
              </p>
              <p className={`text-xs ${phase !== 'idle' ? 'text-white/50' : 'text-slate-400'}`}>
                {phase === 'idle' ? 'Formulario guiado por voz' :
                 phase === 'asking' ? `${currentField?.label}` :
                 phase === 'listening' ? 'Habla con claridad cerca del micrófono' :
                 phase === 'confirming' ? '¿La transcripción es correcta?' :
                 phase === 'summary' ? 'Revisa y edita antes de guardar' :
                 'Historia clínica actualizada'}
              </p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${
              phase !== 'idle' ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        {/* ── Stepper (visible in all active phases) ───────────────────────── */}
        {phase !== 'idle' && phase !== 'saved' && <Stepper />}

        {/* ── Scrollable body ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* ── IDLE ─────────────────────────────────────────────────────────── */}
          {phase === 'idle' && (
            <div className="p-5">
              <div className="text-center mb-5">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z"/></svg>
                </div>
                <p className="text-sm text-slate-600 font-medium mb-1" style={{ fontFamily: 'Outfit' }}>Formulario guiado por voz</p>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                  La IA te hará preguntas una por una para estructurar la nota clínica. Dicta cada campo por voz y revisa al final.
                </p>
              </div>

              {/* Field preview */}
              <div className="space-y-1.5 mb-5">
                {FORM_FIELDS.map((f, i) => (
                  <div key={f.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <FieldIcon d={f.icon} className="text-slate-400" />
                    <span className="text-xs text-slate-600 font-medium">{f.label}</span>
                  </div>
                ))}
              </div>

              <button onClick={startForm}
                className="w-full py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2" style={{ fontFamily: 'Outfit' }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z"/></svg>
                Iniciar formulario por voz
              </button>
              <p className="text-xs text-slate-400 mt-3 text-center">Atajo: <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">Ctrl+Shift+V</kbd></p>
            </div>
          )}

          {/* ── ASKING ───────────────────────────────────────────────────────── */}
          {phase === 'asking' && currentField && (
            <div className="p-5 question-enter" key={`ask-${animKey}`}>
              {/* Question card */}
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 mb-4 field-glow">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <FieldIcon d={currentField.icon} className="text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-cyan-400/60 uppercase tracking-wider mb-1" style={{ fontFamily: 'Outfit' }}>
                      {currentField.label}
                    </p>
                    <p className="text-white text-sm font-medium leading-relaxed">
                      {currentField.question}
                    </p>
                  </div>
                </div>
              </div>

              {/* Previous answer preview (if editing) */}
              {currentField.value && (
                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <p className="text-xs text-white/40 mb-1">Respuesta anterior:</p>
                  <p className="text-sm text-white/60 italic">{currentField.value}</p>
                </div>
              )}

              {/* Action: start recording */}
              <button onClick={startListening}
                className="w-full py-3 bg-rose-500/15 border border-rose-400/30 text-rose-300 rounded-xl font-semibold hover:bg-rose-500/25 transition-all flex items-center justify-center gap-2.5 text-sm group">
                <div className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z"/></svg>
                </div>
                Dictar respuesta
              </button>

              {/* Navigation */}
              <div className="flex items-center gap-2 mt-3">
                <button onClick={goToPrevious} disabled={currentIdx === 0}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    currentIdx === 0 ? 'text-white/15 cursor-not-allowed' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                  Anterior
                </button>
                <button onClick={skipField}
                  className="flex-1 py-2 rounded-lg text-xs font-medium text-amber-400/60 hover:text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center justify-center gap-1.5">
                  Saltar
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
                </button>
                <button onClick={goToSummary}
                  className="flex-1 py-2 rounded-lg text-xs font-medium text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                  Ir a resumen
                </button>
              </div>
            </div>
          )}

          {/* ── LISTENING ────────────────────────────────────────────────────── */}
          {phase === 'listening' && currentField && (
            <div className="p-5 space-y-4">
              {/* Active field label */}
              <div className="flex items-center gap-2 text-cyan-400/70">
                <FieldIcon d={currentField.icon} className="text-cyan-400/50" />
                <p className="text-xs font-medium uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>{currentField.label}</p>
              </div>

              {/* Waveform visualizer */}
              <div className="flex items-end justify-center gap-0.5 h-10">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="w-0.5 bg-rose-400 rounded-full wave-bar"
                    style={{ height: `${20 + Math.random() * 60}%`, animationDelay: `${i * 0.04}s` }} />
                ))}
              </div>

              {/* Live transcript */}
              <div className="bg-white/8 rounded-xl p-4 min-h-[72px] border border-white/5">
                <p className="text-xs text-white/40 mb-2 uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>Transcripción en vivo</p>
                <p className="text-sm text-white leading-relaxed">
                  {liveTranscript || <span className="text-white/20 italic">Esperando audio...</span>}
                  {liveTranscript && <span className="cursor-blink text-rose-400 ml-0.5">|</span>}
                </p>
              </div>

              <button onClick={stopListening}
                className="w-full py-2.5 bg-rose-500/20 border border-rose-400/30 text-rose-300 rounded-xl font-medium hover:bg-rose-500/30 transition-colors flex items-center justify-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
                Detener
              </button>
            </div>
          )}

          {/* ── CONFIRMING ───────────────────────────────────────────────────── */}
          {phase === 'confirming' && currentField && (
            <div className="p-5 space-y-4 question-enter" key={`confirm-${animKey}`}>
              {/* Field label */}
              <div className="flex items-center gap-2 text-cyan-400/70">
                <FieldIcon d={currentField.icon} className="text-cyan-400/50" />
                <p className="text-xs font-medium uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>{currentField.label}</p>
              </div>

              {/* Transcription result */}
              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  <p className="text-xs text-emerald-400 uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>Transcripción</p>
                </div>
                <p className="text-sm text-white leading-relaxed">{liveTranscript}</p>
              </div>

              {/* Confirm / Re-dictate */}
              <div className="flex gap-2">
                <button onClick={redictateField}
                  className="flex-1 py-2.5 bg-white/8 text-white/60 rounded-xl text-sm font-medium hover:bg-white/15 hover:text-white transition-colors flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z"/></svg>
                  Repetir
                </button>
                <button onClick={confirmField}
                  className="flex-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  Confirmar y seguir
                </button>
              </div>

              {/* Skip option */}
              <button onClick={skipField}
                className="w-full py-2 text-xs text-white/30 hover:text-white/50 transition-colors">
                Saltar este campo
              </button>
            </div>
          )}

          {/* ── SUMMARY ──────────────────────────────────────────────────────── */}
          {phase === 'summary' && (
            <div className="p-5 space-y-3">
              {/* Progress bar */}
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${(completedCount / totalFields) * 100}%` }} />
                </div>
                <span className="text-xs text-white/40 shrink-0">{completedCount}/{totalFields}</span>
              </div>

              {/* Editable fields */}
              {fields.map((field, i) => (
                <div key={field.id}
                  className={`rounded-xl border transition-all ${
                    field.status === 'completed'
                      ? 'bg-white/5 border-emerald-500/15'
                      : field.status === 'skipped'
                      ? 'bg-white/3 border-amber-500/15'
                      : 'bg-white/3 border-white/5'
                  }`}
                >
                  {/* Field header */}
                  <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-white/5">
                    {field.status === 'completed' ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    ) : field.status === 'skipped' ? (
                      <div className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-amber-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeWidth={2} d="M5 12h14"/>
                        </svg>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <span className="text-[9px] text-white/30 font-bold">{i + 1}</span>
                      </div>
                    )}
                    <FieldIcon d={field.icon} className={
                      field.status === 'completed' ? 'text-emerald-400/60' :
                      field.status === 'skipped' ? 'text-amber-400/40' : 'text-white/20'
                    } />
                    <span className={`text-xs font-medium flex-1 ${
                      field.status === 'completed' ? 'text-white/70' :
                      field.status === 'skipped' ? 'text-amber-400/50' : 'text-white/30'
                    }`} style={{ fontFamily: 'Outfit' }}>{field.label}</span>

                    {/* Re-dictate button */}
                    <button onClick={() => redictateFromSummary(i)}
                      className="p-1 rounded-md text-white/20 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors" title="Re-dictar">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z"/></svg>
                    </button>
                  </div>

                  {/* Editable textarea */}
                  <div className="px-3.5 py-2.5">
                    <textarea
                      value={field.value}
                      onChange={e => updateField(i, { value: e.target.value, status: e.target.value ? 'completed' : 'skipped' })}
                      placeholder={field.status === 'skipped' ? 'Campo omitido — escribe aquí para completarlo' : 'Sin contenido'}
                      className={`w-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none placeholder:italic ${
                        field.value ? 'text-white/80' : 'text-white/20'
                      } placeholder:text-white/15`}
                      rows={field.value ? Math.max(1, Math.ceil(field.value.length / 50)) : 1}
                    />
                  </div>
                </div>
              ))}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button onClick={discardAll}
                  className="flex-1 py-2.5 bg-white/8 text-white/60 rounded-xl text-sm font-medium hover:bg-white/15 hover:text-white transition-colors">
                  Descartar
                </button>
                <button onClick={saveAll}
                  className="flex-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  Guardar nota clínica
                </button>
              </div>
            </div>
          )}

          {/* ── SAVED ────────────────────────────────────────────────────────── */}
          {phase === 'saved' && (
            <div className="p-5 text-center">
              <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-white step-complete" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
              </div>
              <p className="text-white font-semibold text-base" style={{ fontFamily: 'Outfit' }}>Nota clínica guardada</p>
              <p className="text-white/50 text-sm mt-1">{completedCount} campos completados · Historia clínica actualizada</p>
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
