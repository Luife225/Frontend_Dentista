import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCoroVoz } from '../../contexts/CoroVozContext'
import useCoroVozSpeech from '../../hooks/useCoroVozSpeech'
import { askCoroVoz, interpretDentalCommand, type CoroVozAnswer, type DentalProposal } from '../../services/coroVozService'
import { normalizeCoroVoz, mergeDentalDictation, stripSendCommand, isCoroVozControl } from '../../utils/coroVozConversation'

type Mode = 'general' | 'odontograma' | null
interface Pending { finding: DentalProposal; targetKey: string }
const LABELS: Record<string, string> = { CARIES: 'Caries', RESTAURADO: 'Restauración', CORONA: 'Corona', EXTRAIDO: 'Extraído', ENDODONCIA: 'Endodoncia', IMPLANTE: 'Implante', FRACTURA: 'Fractura' }
const ROUTES: Record<string, string[]> = {
  ODONTOLOGO: ['/app/dashboard', '/app/agenda', '/app/pacientes', '/app/notificaciones', '/app/caja', '/app/teleodontologia'],
  RECEPCIONISTA: ['/app/dashboard', '/app/agenda', '/app/pacientes', '/app/notificaciones', '/app/inventario'],
}

export default function AIAssistant({ onClose }: { onClose?: () => void }) {
  const { role } = useAuth()
  const navigate = useNavigate()
  const { target } = useCoroVoz()
  const targetRef = useRef(target)
  targetRef.current = target
  const [mode, setMode] = useState<Mode>(null)
  const [input, setInput] = useState('')
  const [lastPrompt, setLastPrompt] = useState('')
  const [message, setMessage] = useState('')
  const [answer, setAnswer] = useState<CoroVozAnswer | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const pendingRef = useRef<Pending | null>(null)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [readAloud, setReadAloud] = useState(true)
  const [dentalFragment, setDentalFragment] = useState('')
  const fragmentRef = useRef('')
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null)
  const [selectedPatientName, setSelectedPatientName] = useState('')
  const requestRef = useRef<AbortController | null>(null)
  const generationRef = useRef(0)
  const speech = useCoroVozSpeech(handleVoice)

  function clearFragment() { fragmentRef.current = ''; setDentalFragment('') }
  function handleVoice(text: string, reviewOnly: boolean) {
    if (reviewOnly) {
      setInput(previous => `${previous} ${text}`.trim())
      setMessage('Se alcanzaron 25 segundos de dictado. Dejé el texto para revisión; puedes completarlo y enviarlo.')
      return
    }
    const control = isCoroVozControl(text)
    const next = control ? text : stripSendCommand(text)
    void handleInput(control || !input.trim() ? next : mode === 'odontograma' ? mergeDentalDictation(input, next) : `${input} ${next}`)
  }

  function clearPending() { pendingRef.current = null; setPending(null) }
  function respond(text: string) {
    setMessage(text)
    if (readAloud) speech.speak(text)
  }

  function cancelRequest() {
    generationRef.current++
    requestRef.current?.abort()
    busyRef.current = false
    setBusy(false)
  }

  useEffect(() => () => { requestRef.current?.abort(); generationRef.current++ }, [])

  useEffect(() => {
    if (mode !== 'odontograma') return
    cancelRequest()
    clearPending()
    clearFragment()
    speech.stop()
    setInput('')
    setLastPrompt('')
    setMessage('Revisa el paciente y el odontograma abiertos antes de dictar.')
    // Al cambiar de paciente, versión o pestaña se descarta cualquier propuesta anterior.
  }, [target?.key, mode, speech.stop])

  function changeMode(next: Mode) {
    cancelRequest()
    speech.stop()
    clearPending()
    clearFragment()
    setSelectedPatient(null)
    setAnswer(null)
    setInput('')
    setLastPrompt('')
    setMessage('')
    setMode(next)
  }

  function confirmProposal() {
    const proposal = pendingRef.current
    const current = targetRef.current
    if (!proposal || !current || !current.editable || proposal.targetKey !== current.key) {
      respond('Abre un odontograma editable y dicta nuevamente el hallazgo.')
      clearPending()
      return
    }
    clearPending()
    if (current.apply(proposal.finding)) {
      respond('Agregado al borrador en pantalla. Puedes dictar otra pieza. Al terminar, usa Guardar borrador para conservar los cambios.')
    } else respond('No se pudo aplicar la propuesta. Revisa el odontograma y vuelve a intentarlo.')
  }

  async function saveDraft() {
    const current = targetRef.current
    if (busyRef.current || pendingRef.current || !current?.editable) return
    busyRef.current = true
    setBusy(true)
    speech.pause(true)
    const generation = ++generationRef.current
    try {
      const saved = await current.save()
      if (generation === generationRef.current && current.key === targetRef.current?.key) respond(saved ? 'Borrador guardado. La confirmación definitiva de la versión se realiza desde el odontograma.' : 'No se pudo guardar. Revisa el mensaje del odontograma e intenta de nuevo.')
    } finally {
      if (generation === generationRef.current) {
        busyRef.current = false
        setBusy(false)
        speech.pause(false)
      }
    }
  }

  async function handleInput(rawText: string, patientId = selectedPatient) {
    let text = rawText.trim()
    if (!text || busyRef.current) return
    const command = normalizeCoroVoz(text)
    if (['corovoz terminado', 'terminado', 'apagar corovoz', 'corovoz detener', 'detener'].includes(command)) {
      speech.stop()
      clearPending()
      clearFragment()
      setMessage(mode === 'odontograma' ? 'Escucha detenida. Revisa los cambios y pulsa Guardar borrador en el odontograma.' : 'Escucha detenida. Puedes continuar escribiendo.')
      return
    }
    if (['prender corovoz', 'activar corovoz', 'corovoz iniciar', 'iniciar'].includes(command)) {
      respond('CoroVoz listo. Di tu pregunta o un hallazgo según el modo seleccionado.')
      return
    }
    if (mode === 'odontograma') {
      if (['corovoz correcto', 'correcto', 'confirmar', 'corovoz confirmar'].includes(command)) { confirmProposal(); return }
      if (['corovoz edita', 'corovoz editar', 'edita', 'editar'].includes(command)) {
        clearPending()
        clearFragment()
        setInput(lastPrompt)
        respond('Dicta de nuevo el hallazgo completo o corrige el texto y envíalo.')
        return
      }
      if (['corovoz elimina', 'corovoz eliminar', 'corovoz cancelar', 'elimina', 'eliminar', 'cancelar'].includes(command)) {
        clearPending()
        clearFragment()
        respond('Propuesta descartada. Los hallazgos ya existentes siguen en el borrador.')
        return
      }
      if (!targetRef.current?.editable) { respond('Abre Pacientes, selecciona al paciente y entra en un odontograma editable.'); return }
      if (pendingRef.current) { respond('Primero confirma, edita o elimina la propuesta pendiente.'); return }
      if (fragmentRef.current) text = mergeDentalDictation(fragmentRef.current, text)
    }
    if (!mode) return
    if (text.length > 600) { setMessage('La consulta supera 600 caracteres. Revisa el texto y envía una tarea por vez.'); return }
    setInput('')
    setLastPrompt(text)
    setAnswer(null)
    setMessage('')
    busyRef.current = true
    setBusy(true)
    speech.pause(true)
    const generation = ++generationRef.current
    const controller = new AbortController()
    requestRef.current = controller
    const targetKey = targetRef.current?.key
    try {
      if (mode === 'general') {
        const result = await askCoroVoz(text, controller.signal, patientId)
        if (generation !== generationRef.current) return
        setAnswer(result)
        if (result.patientId) { setSelectedPatient(result.patientId); setSelectedPatientName(result.patientName || '') }
        else if (result.intent === 'PACIENTE_ELEGIR') setSelectedPatient(null)
        if (readAloud) speech.speak(result.answer)
      } else {
        const result = await interpretDentalCommand(text, controller.signal)
        if (generation !== generationRef.current || targetKey !== targetRef.current?.key) return
        if (result.incomplete) {
          fragmentRef.current = result.fragment
          setDentalFragment(result.fragment)
          respond(result.message)
        } else if (!result.understood || !result.proposal || !targetKey) respond(result.message)
        else {
          clearFragment()
          const next = { finding: result.proposal, targetKey }
          pendingRef.current = next
          setPending(next)
          const p = result.proposal
          respond(`Pieza ${p.piece}, ${LABELS[p.condition] || p.condition}, cara ${p.surface.toLowerCase()}${p.note ? `. Observación: ${p.note}` : ''}. ¿Correcto? Confirma, edita o descarta.`)
        }
      }
    } catch (error) {
      if (generation === generationRef.current) respond(error instanceof Error ? error.message : 'No se pudo consultar CoroVoz.')
    } finally {
      if (generation === generationRef.current) {
        busyRef.current = false
        setBusy(false)
        speech.pause(false)
      }
    }
  }

  function submit(event: FormEvent) { event.preventDefault(); void handleInput(input) }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-3 sm:p-6 pointer-events-none">
      <section aria-label="CoroVoz" className="pointer-events-auto w-full max-w-[440px] rounded-2xl shadow-2xl overflow-hidden flex flex-col bg-white border border-slate-200" style={{ maxHeight: 'calc(100dvh - 48px)' }}>
        <header className="flex items-center gap-3 px-5 py-4 bg-[#0B3D3A] text-white shrink-0">
          {mode && <button onClick={() => changeMode(null)} aria-label="Elegir modo" className="p-2 rounded-lg hover:bg-white/10">←</button>}
          <div className="flex-1"><h2 className="font-bold" style={{ fontFamily: 'Outfit' }}>CoroVoz</h2><p className="text-xs text-white/70">{mode === 'general' ? 'Ayuda para usar Coronyx' : mode === 'odontograma' ? 'Dictado de odontograma' : 'Elige cómo quieres trabajar'}</p></div>
          <button onClick={() => { speech.stop(); onClose?.() }} aria-label="Cerrar CoroVoz" className="p-2 rounded-lg hover:bg-white/10">✕</button>
        </header>

        <div className="p-5 space-y-4 overflow-y-auto min-h-0">
          {!mode ? (
            <>
              <p className="text-sm text-slate-600">{role === 'ODONTOLOGO' ? 'Escribe o habla para consultar instrucciones y trabajar con tu odontograma.' : 'Escribe o habla para consultar cómo usar Coronyx.'}</p>
              <button onClick={() => changeMode('general')} className="w-full text-left p-4 rounded-xl border border-cyan-200 bg-cyan-50 hover:bg-cyan-100"><strong className="block text-cyan-900">General</strong><span className="text-sm text-cyan-800">Ayuda con citas, pacientes y otras tareas del sistema.</span></button>
              {role === 'ODONTOLOGO' && <button onClick={() => changeMode('odontograma')} className="w-full text-left p-4 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100"><strong className="block text-violet-900">Odontograma</strong><span className="text-sm text-violet-800">Revisa y agrega hallazgos al borrador del paciente.</span></button>}
            </>
          ) : (
            <>
              {mode === 'odontograma' && <div className={`p-3 rounded-xl text-sm border ${target?.editable ? 'bg-violet-50 border-violet-200 text-violet-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                <strong className="block">{target ? target.patientName : 'Selecciona un paciente'}</strong>
                <p className="mt-1">{target?.editable ? 'Los cambios se agregan al borrador en pantalla. Usa Guardar borrador para conservarlos.' : target ? 'Este odontograma está cargando, guardándose o no es editable. Revisa el estado de la versión.' : 'Abre Pacientes y entra en la pestaña Odontograma del paciente.'}</p>
                {!target && <button onClick={() => navigate('/app/pacientes')} className="mt-2 underline font-semibold">Ir a Pacientes</button>}
                {target && <button onClick={() => void saveDraft()} disabled={!target.editable || busy || Boolean(pending)} className="mt-3 rounded-lg border border-violet-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40">Guardar borrador</button>}
              </div>}

              <div className="flex items-center justify-between gap-2">
                <button onClick={speech.enabled ? speech.stop : speech.start} disabled={!speech.supported || speech.starting || busy || (mode === 'odontograma' && !target?.editable)} className={`rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-40 ${speech.enabled ? 'bg-rose-100 text-rose-800' : 'bg-cyan-700 text-white'}`}>
                  {speech.starting ? 'Activando micrófono…' : speech.enabled ? '■ Detener escucha' : '🎙 Iniciar escucha'}
                </button>
                <label className="text-xs text-slate-600 flex items-center gap-1.5"><input type="checkbox" checked={readAloud} onChange={e => { setReadAloud(e.target.checked); if (!e.target.checked) speech.interrupt() }} />Leer respuestas</label>
              </div>
              <label className="flex items-center justify-between gap-2 text-xs text-slate-600">Enviar dictado
                <select aria-label="Envío del dictado" value={speech.sendMode} onChange={e => speech.setSendMode(e.target.value as 'manual' | 'pause')} className="rounded-lg border border-slate-300 p-2">
                  <option value="manual">Cuando pulse Terminé</option><option value="pause">Tras 3,5 segundos de pausa</option>
                </select>
              </label>
              {speech.speaking && <button onClick={speech.interrupt} className="rounded-lg border border-cyan-300 px-3 py-2 text-sm font-semibold text-cyan-800">Interrumpir respuesta</button>}
              <p className="text-xs text-slate-500">{speech.starting ? 'Permite el acceso al micrófono cuando Brave lo solicite.' : speech.transcribing ? 'Reconociendo tu voz en el backend local…' : speech.listening ? speech.sendMode === 'manual' ? 'Micrófono activo. Habla a tu ritmo y pulsa Terminé: enviar. Puedes hacer pausas.' : 'Micrófono activo. Envía tras 3,5 segundos de silencio. Puedes terminar con «CoroVoz enviar».' : speech.enabled ? 'Escucha pausada mientras CoroVoz procesa o habla.' : speech.supported ? 'Reconocimiento local, sin API de pago. Pulsa Iniciar escucha para permitir el micrófono.' : 'Abre el sistema por localhost o HTTPS para habilitar el micrófono.'}</p>
              {speech.enabled && <div className="flex items-center gap-3">
                <div role="meter" aria-label="Nivel del micrófono" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(speech.level * 100)} className="h-2 flex-1 rounded-full bg-slate-200 overflow-hidden"><div className="h-full bg-emerald-500 transition-[width]" style={{ width: `${Math.round(speech.level * 100)}%` }} /></div>
                <button onClick={() => void speech.finish()} disabled={busy || speech.transcribing || speech.speaking} className="text-xs font-semibold text-cyan-800 underline disabled:opacity-40">Terminé: enviar</button>
              </div>}
              {speech.interim && <p className="rounded-lg bg-slate-50 p-2 text-sm text-slate-500 italic">{speech.interim}</p>}
              {speech.error && <p role="alert" className="text-sm text-rose-700">{speech.error}</p>}

              {!lastPrompt && !pending && <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500">Ejemplos</p>
                {(mode === 'general' ? ['¿Qué es Coronyx?', '¿Cómo veo usuarios inactivos?', '¿Cómo agendo una cita?', 'Próxima cita del paciente [nombre o DNI]'] : ['Corona en pieza catorce', 'Caries en diente treinta y seis cara oclusal']).map(example => <button key={example} onClick={() => setInput(example)} className="block text-left text-xs text-cyan-800 hover:underline">{example}</button>)}
              </div>}
              {lastPrompt && <p className="text-sm text-slate-500"><span className="font-semibold">Tu consulta: </span>{lastPrompt}</p>}
              {busy && <p role="status" className="text-sm text-cyan-700">Procesando…</p>}
              {message && <p role="status" className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{message}</p>}
              {answer && <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 space-y-3"><p role="status" className="text-sm text-slate-800 leading-relaxed">{answer.answer}</p>{answer.route && ROUTES[role || '']?.includes(answer.route) && <button onClick={() => { speech.stop(); navigate(answer.route) }} className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white">{answer.targetLabel}</button>}</div>}
              {answer?.patients?.length ? <div className="space-y-2" aria-label="Coincidencias de pacientes">{answer.patients.map(patient => <button key={patient.id} onClick={() => void handleInput(lastPrompt, patient.id)} disabled={busy} className="block w-full rounded-xl border border-cyan-200 p-3 text-left text-sm disabled:opacity-40"><strong className="block">{patient.name}</strong><span className="text-xs text-slate-500">{patient.documentHint}</span></button>)}</div> : null}
              {mode === 'general' && selectedPatient && <div className="text-xs text-slate-500"><strong>Paciente de la consulta: {selectedPatientName}.</strong> Puedes continuar con «¿Y su teléfono?» o indicar otro paciente. <button onClick={() => { setSelectedPatient(null); setSelectedPatientName(''); setAnswer(null) }} className="underline text-cyan-800">Olvidar paciente</button></div>}
              {dentalFragment && <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm"><strong>Dictado en curso: </strong>{dentalFragment}<p className="mt-1 text-xs">Añade los datos que faltan; todavía no hay una propuesta para guardar.</p><button onClick={clearFragment} className="mt-2 text-xs underline">Borrar dictado en curso</button></div>}
              {pending && <div className="rounded-xl border-2 border-violet-300 bg-violet-50 p-4 space-y-3">
                <h3 className="font-semibold text-violet-900">Propuesta para {target?.patientName}</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm"><dt>Pieza</dt><dd className="font-bold">{pending.finding.piece}</dd><dt>Condición</dt><dd>{LABELS[pending.finding.condition]}</dd><dt>Cara</dt><dd>{pending.finding.surface.toLowerCase()}</dd></dl>
                {pending.finding.note && <p className="text-sm">Observación: {pending.finding.note}</p>}
                <p className="text-xs text-violet-800">{target?.describe(pending.finding)}</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={confirmProposal} disabled={!target?.editable} className="rounded-lg bg-violet-700 text-white px-3 py-2 text-sm disabled:opacity-40">Correcto: agregar</button>
                  <button onClick={() => void handleInput('corovoz edita')} className="rounded-lg bg-white border border-violet-200 px-3 py-2 text-sm">Editar</button>
                  <button onClick={() => void handleInput('corovoz elimina')} className="rounded-lg bg-white border border-rose-200 text-rose-700 px-3 py-2 text-sm">Eliminar propuesta</button>
                </div>
              </div>}
              <form onSubmit={submit} className="space-y-2">
                <label htmlFor="corovoz-text" className="text-xs font-semibold text-slate-600">{mode === 'general' ? 'Tu pregunta' : 'Hallazgo o comando'}</label>
                <textarea id="corovoz-text" value={input} onChange={e => setInput(e.target.value)} maxLength={600} rows={3} placeholder={mode === 'general' ? '¿Cómo registro un paciente?' : 'Caries en pieza 14 cara oclusal. Observación: control.'} className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                <button type="submit" disabled={busy || !input.trim()} className="w-full rounded-xl bg-[#0B3D3A] text-white py-2.5 text-sm font-semibold disabled:opacity-40">{busy ? 'Procesando…' : 'Enviar'}</button>
              </form>
              {mode === 'odontograma' && <div className="text-xs text-slate-500 space-y-1"><p>Una pieza y condición por vez. «Pieza catorce» se convierte en 14; puedes completar después «corona». Caras: oclusal, vestibular, lingual, mesial, distal o general.</p><p>Comandos: CoroVoz correcto · CoroVoz edita · CoroVoz elimina · CoroVoz terminado. En modo manual, pulsa Terminé: enviar después de decir el comando.</p><p>Si omites la cara se propone general. Revisa y confirma antes de agregar; guarda el borrador para conservarlo.</p></div>}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
