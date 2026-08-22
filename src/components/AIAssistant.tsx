import { useState, useEffect, useRef } from 'react'

type Phase = 'idle' | 'listening' | 'processing' | 'review' | 'saved'

const DEMO_TRANSCRIPT = [
  { text: 'Paciente presenta caries en cara oclusal del diente catorce.', delay: 800 },
  { text: ' También se observa sensibilidad en el diente treinta y seis con tratamiento previo de endodoncia.', delay: 2200 },
  { text: ' Se recomienda radiografía periapical y aplicación de flúor profesional.', delay: 4000 },
]

const DRAFT = {
  motivo: 'Control periódico y dolor en zona posterior inferior',
  hallazgos: [
    { diente: '14', cara: 'Oclusal', hallazgo: 'Caries activa — profundidad moderada', color: 'rose' },
    { diente: '36', cara: 'General', hallazgo: 'Sensibilidad post-endodoncia, posible microfractura', color: 'amber' },
  ],
  plan: 'Radiografía periapical #14 y #36. Aplicación de flúor profesional 2% NaF. Control en 4 semanas.',
  indicaciones: 'No consumir alimentos calientes/fríos por 2 horas. Cepillado suave zona posterior.',
}

export default function AIAssistant({ onClose }: { onClose?: () => void }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [transcript, setTranscript] = useState('')
  const [displayedWords, setDisplayedWords] = useState(0)
  const [editedDraft, setEditedDraft] = useState({ ...DRAFT, plan: DRAFT.plan, indicaciones: DRAFT.indicaciones })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (phase === 'listening') {
      setTranscript('')
      setDisplayedWords(0)
      // Simulate live transcription
      DEMO_TRANSCRIPT.forEach(({ text, delay }) => {
        setTimeout(() => {
          setTranscript(prev => prev + text)
        }, delay)
      })
      // Move to processing after transcript done
      setTimeout(() => setPhase('processing'), 5800)
    }
    if (phase === 'processing') {
      setTimeout(() => setPhase('review'), 1800)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [phase])

  function startListening() { setPhase('listening') }
  function stopListening() { setPhase('processing') }
  function save() { setPhase('saved'); setTimeout(() => setPhase('idle'), 2000) }
  function reject() { setPhase('idle'); setTranscript('') }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none">
      <div className={`pointer-events-auto w-[440px] rounded-2xl shadow-2xl overflow-hidden slide-up ${
        phase === 'idle' ? 'bg-white border border-slate-200' : 'bg-slate-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 ${phase !== 'idle' ? 'border-b border-white/10' : 'border-b border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${
              phase === 'listening' ? 'bg-rose-500' : phase === 'processing' ? 'bg-amber-500' : phase === 'saved' ? 'bg-emerald-500' : 'bg-slate-700'
            }`}>
              {phase === 'listening' && (
                <>
                  <div className="absolute w-full h-full rounded-full bg-rose-500 pulse-ring opacity-60"></div>
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z"/></svg>
                </>
              )}
              {phase === 'processing' && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {(phase === 'idle' || phase === 'review' || phase === 'saved') && (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z"/></svg>
              )}
            </div>
            <div>
              <p className={`text-sm font-semibold ${phase !== 'idle' ? 'text-white' : 'text-slate-800'}`} style={{fontFamily:'Outfit'}}>
                {phase === 'idle' ? 'Asistente de IA' :
                 phase === 'listening' ? 'Escuchando...' :
                 phase === 'processing' ? 'Procesando dictado...' :
                 phase === 'review' ? 'Revisa el borrador' :
                 '¡Guardado!'}
              </p>
              <p className={`text-xs ${phase !== 'idle' ? 'text-white/50' : 'text-slate-400'}`}>
                {phase === 'idle' ? 'Listo para dictar' :
                 phase === 'listening' ? 'Habla con claridad cerca del micrófono' :
                 phase === 'processing' ? 'La IA está estructurando la nota' :
                 phase === 'review' ? 'Aprueba o edita antes de guardar' : 'Nota clínica guardada'}
              </p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${phase !== 'idle' ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        {/* Idle state */}
        {phase === 'idle' && (
          <div className="p-5 text-center">
            <p className="text-sm text-slate-500 mb-4">Activa el modo dictado para registrar hallazgos clínicos por voz. La IA estructurará la nota automáticamente.</p>
            <button onClick={startListening}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2" style={{fontFamily:'Outfit'}}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z"/></svg>
              Iniciar dictado
            </button>
            <p className="text-xs text-slate-400 mt-3">Atajo: <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">Ctrl+Shift+V</kbd></p>
          </div>
        )}

        {/* Listening state */}
        {phase === 'listening' && (
          <div className="p-5 space-y-4">
            {/* Waveform visualizer */}
            <div className="flex items-end justify-center gap-0.5 h-12">
              {Array.from({length:20}).map((_,i) => (
                <div key={i} className={`w-1 bg-rose-400 rounded-full wave-bar`}
                  style={{ height: `${20 + Math.random() * 60}%`, animationDelay: `${i * 0.05}s` }} />
              ))}
            </div>

            {/* Live transcript */}
            <div className="bg-white/10 rounded-xl p-4 min-h-[80px]">
              <p className="text-xs text-white/50 mb-2 uppercase tracking-wider" style={{fontFamily:'Outfit'}}>Transcripción en vivo</p>
              <p className="text-sm text-white leading-relaxed">
                {transcript}
                {transcript && <span className="cursor-blink text-rose-400 ml-0.5">|</span>}
              </p>
            </div>

            <button onClick={stopListening}
              className="w-full py-2.5 bg-rose-500/20 border border-rose-400/40 text-rose-300 rounded-xl font-medium hover:bg-rose-500/30 transition-colors flex items-center justify-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
              Detener
            </button>
          </div>
        )}

        {/* Processing */}
        {phase === 'processing' && (
          <div className="p-5">
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <p className="text-xs text-white/40 mb-2 uppercase tracking-wider" style={{fontFamily:'Outfit'}}>Lo que dijiste</p>
              <p className="text-sm text-white/70 leading-relaxed">{transcript}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
              <div>
                <p className="text-sm text-white font-medium">Interpretando hallazgos clínicos...</p>
                <p className="text-xs text-white/50">Identificando dientes, condiciones y plan de tratamiento</p>
              </div>
            </div>
          </div>
        )}

        {/* Review */}
        {phase === 'review' && (
          <div className="p-5 space-y-4">
            <div className="space-y-3">
              {/* Comparison: what AI heard vs what it structured */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-white/40 mb-1.5 uppercase tracking-wider" style={{fontFamily:'Outfit'}}>Dictado</p>
                  <p className="text-xs text-white/70 leading-relaxed">{transcript.slice(0, 100)}...</p>
                </div>
                <div className="bg-cyan-500/10 rounded-lg p-3 border border-cyan-500/20">
                  <p className="text-xs text-cyan-400 mb-1.5 uppercase tracking-wider" style={{fontFamily:'Outfit'}}>IA interpretó</p>
                  <p className="text-xs text-cyan-200 leading-relaxed">2 hallazgos · Plan de tratamiento · 2 indicaciones</p>
                </div>
              </div>

              {/* Hallazgos */}
              <div className="bg-white/5 rounded-xl p-4 space-y-2">
                <p className="text-xs text-white/50 uppercase tracking-wider mb-2" style={{fontFamily:'Outfit'}}>Hallazgos detectados</p>
                {editedDraft.hallazgos.map((h, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2 rounded-lg bg-${h.color}-500/10 border border-${h.color}-400/20`}>
                    <span className={`text-xs font-mono px-1.5 py-0.5 bg-${h.color}-400/20 text-${h.color}-300 rounded`}>#{h.diente}</span>
                    <div className="flex-1">
                      <p className="text-xs text-white/80">{h.cara}</p>
                      <p className={`text-xs text-${h.color}-300`}>{h.hallazgo}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Plan */}
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-white/50 uppercase tracking-wider mb-2" style={{fontFamily:'Outfit'}}>Plan de tratamiento</p>
                <textarea
                  value={editedDraft.plan}
                  onChange={e => setEditedDraft(d => ({...d, plan: e.target.value}))}
                  className="w-full bg-transparent text-sm text-white leading-relaxed resize-none focus:outline-none"
                  rows={2}
                />
              </div>

              {/* Indicaciones */}
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-white/50 uppercase tracking-wider mb-2" style={{fontFamily:'Outfit'}}>Indicaciones al paciente</p>
                <textarea
                  value={editedDraft.indicaciones}
                  onChange={e => setEditedDraft(d => ({...d, indicaciones: e.target.value}))}
                  className="w-full bg-transparent text-sm text-white leading-relaxed resize-none focus:outline-none"
                  rows={2}
                />
              </div>
            </div>

            {/* Actions — quick, 2 clicks max */}
            <div className="flex gap-2 pt-1">
              <button onClick={reject}
                className="flex-1 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm font-medium hover:bg-white/20 transition-colors">
                Descartar
              </button>
              <button onClick={save}
                className="flex-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-400 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                Guardar nota
              </button>
            </div>
          </div>
        )}

        {/* Saved */}
        {phase === 'saved' && (
          <div className="p-5 text-center">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
            </div>
            <p className="text-white font-semibold" style={{fontFamily:'Outfit'}}>Nota guardada</p>
            <p className="text-white/50 text-sm mt-1">Historia clínica actualizada · 08:47</p>
          </div>
        )}
      </div>
    </div>
  )
}
