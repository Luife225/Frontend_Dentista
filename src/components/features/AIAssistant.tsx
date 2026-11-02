import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCoroVoz } from '../../contexts/CoroVozContext'
import useCoroVozSpeech from '../../hooks/useCoroVozSpeech'
import { mergeAppointmentReply } from '../../utils/coroVozAppointment'
import { askCoroVoz, interpretDentalCommand, reviseDentalCommand, type CoroVozAnswer, type DentalProposal } from '../../services/coroVozService'
import { dentalField, dentalFieldAction, describeDentalDraft, dentalDraftFragment, FIELD_LABELS, type DentalDialog, type DentalDraft, type DentalField } from '../../utils/coroVozDentalDialog'
import { normalizeCoroVoz, mergeDentalDictation, stripSendCommand, isCoroVozControl, dentalVoiceControl, coroVozChoiceIndex, resolvePatientReply, isPatientConfirmation, type PatientQuestion } from '../../utils/coroVozConversation'

type Mode = 'general' | 'odontograma' | null
interface Pending { finding: DentalProposal; targetKey: string }
const LABELS: Record<string, string> = { SANO: 'Sano', CARIES: 'Caries', RESTAURADO: 'Restauración', CORONA: 'Corona', EXTRAIDO: 'Extraído', ENDODONCIA: 'Endodoncia', IMPLANTE: 'Implante', FRACTURA: 'Fractura' }
const ROUTES: Record<string, string[]> = {
  ODONTOLOGO: ['/app/dashboard', '/app/agenda', '/app/pacientes', '/app/notificaciones', '/app/caja', '/app/teleodontologia'],
  RECEPCIONISTA: ['/app/dashboard', '/app/agenda', '/app/pacientes', '/app/notificaciones', '/app/inventario'],
}

export default function AIAssistant({ onClose }: { onClose?: () => void }) {
  const { role } = useAuth()
  const navigate = useNavigate()
  const { target, memory, dentalMemory } = useCoroVoz()
  const targetRef = useRef(target)
  targetRef.current = target
  const [mode, setMode] = useState<Mode>(null)
  const [input, setInput] = useState('')
  const [lastPrompt, setLastPrompt] = useState('')
  const [message, setMessage] = useState('')
  const [answer, setAnswer] = useState<CoroVozAnswer | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const pendingRef = useRef<Pending | null>(null)
  const [workingDraft, setWorkingDraftState] = useState<DentalDraft | null>(null)
  const draftRef = useRef<DentalDraft | null>(null)
  function setWorkingDraft(value: DentalDraft | null) { draftRef.current = value; setWorkingDraftState(value) }
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [readAloud, setReadAloud] = useState(true)
  const [dentalFragment, setDentalFragment] = useState('')
  const fragmentRef = useRef('')
  const [dentalKey, setDentalKey] = useState('')
  const [dentalPiece, setDentalPiece] = useState<number | null>(null)
  const [dentalOptions, setDentalOptions] = useState<{ value: string; label: string }[]>([])
  const [dialog, setDialogState] = useState<DentalDialog | null>(null)
  const dialogRef = useRef<DentalDialog | null>(null)
  function setDialog(value: DentalDialog | null) { dialogRef.current = value; setDialogState(value) }
  const [selectedPatient, setSelectedPatient] = useState<string | null>(memory.current.patientId)
  const [selectedPatientName, setSelectedPatientName] = useState(memory.current.patientName)
  const [patientQuestion, setPatientQuestion] = useState<PatientQuestion | null>(memory.current.question)
  const [appointmentQuestion, setAppointmentQuestion] = useState(memory.current.appointment)
  const [conversation, setConversation] = useState(memory.current.turns)
  const requestRef = useRef<AbortController | null>(null)
  const generationRef = useRef(0)
  const proposalForm = dialog?.draft || pending?.finding || workingDraft
  const awaitingDentalReply = mode === 'odontograma' && Boolean(proposalForm || dentalFragment)
  const speech = useCoroVozSpeech(handleVoice, awaitingDentalReply)

  useEffect(() => {
    memory.current = { patientId: selectedPatient, patientName: selectedPatientName, question: patientQuestion,
      appointment: appointmentQuestion, turns: conversation }
  }, [memory, selectedPatient, selectedPatientName, patientQuestion, appointmentQuestion, conversation])

  function clearFragment() { fragmentRef.current = ''; setDentalFragment(''); setDentalOptions([]) }
  function handleVoice(text: string, reviewOnly: boolean) {
    const control = isCoroVozControl(text) || mode === 'odontograma' && (!!dentalFieldAction(text) || !!dialogRef.current)
    if (reviewOnly) {
      setInput(previous => `${previous} ${text}`.trim())
      setMessage('Dictado detenido y micrófono apagado. Revisa el texto, complétalo si hace falta y pulsa Enviar.')
      return
    }
    const next = control ? text : stripSendCommand(text)
    if (mode === 'general' && answer?.suggestions?.length && coroVozChoiceIndex(next, answer.suggestions.length) != null) {
      void handleInput(next)
      return
    }
    void handleInput(control || !input.trim() ? next : mode === 'odontograma' ? mergeDentalDictation(input, next) : `${input} ${next}`)
  }

  function clearPending() { pendingRef.current = null; setPending(null); setWorkingDraft(null) }
  function respond(text: string) {
    setMessage(text)
    if (readAloud) speech.speak(text)
  }

  function repeatDictation() {
    const finding = dialogRef.current?.draft || pendingRef.current?.finding || draftRef.current
    const text = finding ? describeDentalDraft(finding) : fragmentRef.current ? `Propuesta incompleta: ${fragmentRef.current}. Faltan datos antes de confirmar.` : 'No hay una propuesta pendiente para repetir.'
    setMessage(text)
    speech.speak(text)
  }

  function choosePart(action: 'edit' | 'remove', field?: DentalField | 'all') {
    setInput('')
    const draft = dialogRef.current?.draft || pendingRef.current?.finding || draftRef.current
    if (action === 'remove' && field === 'all') {
      clearPending(); clearFragment(); setDialog(null); setInput('')
      respond('Propuesta completa descartada. Puedes dictar un nuevo hallazgo.'); return
    }
    if (!draft) { respond('Primero dicta un hallazgo para poder editar o eliminar sus partes.'); return }
    if (!field || field === 'all') {
      setDialog({ action, draft })
      respond(action === 'edit' ? '¿Qué parte quieres editar: diente, condición, observación o cara?' : '¿Qué quieres eliminar: diente, condición, observación, cara o todo?')
      return
    }
    if (action === 'edit') {
      setDialog({ action, field, draft }); setInput(''); setDentalOptions([])
      respond(`Di solo ${field === 'note' ? 'la nueva observación' : field === 'condition' ? 'la nueva condición' : field === 'surface' ? 'la nueva cara' : 'el nuevo número de diente'}. Conservaré los demás datos de la propuesta.`)
      return
    }
    const next: DentalDraft = { ...draft, [field]: field === 'note' ? '' : field === 'surface' ? 'GENERAL' : null }
    if (!next.piece || !next.condition) {
      clearPending(); fragmentRef.current = dentalDraftFragment(next); setDentalFragment(fragmentRef.current)
      setWorkingDraft(next); setDialog(null); setDentalOptions([])
      respond(`Se eliminó ${FIELD_LABELS[field]} de la propuesta. Puedes seguir completando sus campos; pieza y condición son necesarias para confirmar.`)
    } else {
      const updated = { finding: next as DentalProposal, targetKey: targetRef.current!.key }
      pendingRef.current = updated; setPending(updated); setDialog(null)
      respond(`${field === 'note' ? 'Observación eliminada.' : 'Cara eliminada; se propone el diente completo, cara general.'} ${describeDentalDraft(next)} Confirma, edita o elimina.`)
    }
  }

  async function replacePart(text: string, current: DentalDialog) {
    if (!current.field || !targetRef.current?.editable) return
    const controller = new AbortController(); requestRef.current = controller
    const generation = ++generationRef.current, targetKey = targetRef.current.key
    busyRef.current = true; setBusy(true); speech.pause(true); setInput('')
    try {
      const choice = coroVozChoiceIndex(text, dentalOptions.length)
      const result = await reviseDentalCommand(choice == null ? text : dentalOptions[choice].value, current.field, current.draft, controller.signal)
      if (generation !== generationRef.current || targetKey !== targetRef.current?.key) return
      if (result.incomplete && result.draft) {
        clearPending(); setWorkingDraft(result.draft); setDialog(null)
        fragmentRef.current = result.fragment; setDentalFragment(result.fragment); setDentalOptions(result.suggestions || [])
        respond(`${describeDentalDraft(result.draft)} Puedes seguir completando condición, observación o cara.`); return
      }
      if (!result.understood || !result.proposal) { setDentalOptions(result.suggestions || []); respond(result.message); return }
      const next = { finding: result.proposal, targetKey }
      pendingRef.current = next; setPending(next); setWorkingDraft(null); setDialog(null); clearFragment()
      setDentalPiece(next.finding.piece); targetRef.current?.select(next.finding.piece)
      respond(`${describeDentalDraft(next.finding)} Confirma, edita o elimina.`)
    } catch (error) {
      if (generation === generationRef.current) respond(error instanceof Error ? error.message : 'No se pudo editar la propuesta.')
    } finally {
      if (generation === generationRef.current) { busyRef.current = false; setBusy(false); requestRef.current = null; speech.pause(false) }
    }
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
    speech.stop()
    const saved = dentalMemory.current?.targetKey === target?.key ? dentalMemory.current : null
    setDentalKey(target?.key || '')
    pendingRef.current = saved?.pending || null; setPending(pendingRef.current)
    setWorkingDraft(saved?.draft || null)
    fragmentRef.current = saved?.fragment || ''; setDentalFragment(fragmentRef.current)
    setDentalPiece(saved?.piece ?? target?.selectedPiece ?? null)
    setDentalOptions(saved?.options || [])
    setDialog(saved?.dialog || null)
    setInput(saved?.input || '')
    setLastPrompt(saved?.lastPrompt || '')
    setMessage(saved?.message || 'Revisa el paciente y el odontograma abiertos antes de dictar.')
    // Different patients/versions never inherit proposals or dictation.
    if (!saved) dentalMemory.current = null
  }, [target?.key, mode, speech.stop, dentalMemory])

  useEffect(() => {
    if (mode === 'odontograma' && dentalKey && dentalKey === target?.key) {
      dentalMemory.current = { targetKey: dentalKey, piece: dentalPiece, fragment: dentalFragment, pending,
        options: dentalOptions, lastPrompt, input, message, dialog, draft: workingDraft }
    }
  }, [mode, dentalKey, target?.key, dentalPiece, dentalFragment, pending, dentalOptions, lastPrompt, input, message, dialog, workingDraft, dentalMemory])

  function changeMode(next: Mode) {
    cancelRequest()
    speech.stop()
    clearPending()
    setDialog(null)
    clearFragment()
    setAnswer(null)
    setInput('')
    setLastPrompt('')
    setMessage('')
    setMode(next)
  }

  async function confirmProposal() {
    if (busyRef.current) return
    if (dialogRef.current) { respond('Termina de elegir o corregir la parte pendiente antes de confirmar. Puedes decir «repetir propuesta».'); return }
    const proposal = pendingRef.current
    const current = targetRef.current
    if (!proposal) { respond(draftRef.current ? 'La propuesta está incompleta o necesita aclaración. Completa la pieza y la condición antes de confirmar.' : 'No hay una propuesta pendiente para confirmar. Dicta primero el hallazgo.'); return }
    if (!proposal || !current || !current.editable || proposal.targetKey !== current.key) {
      respond('Abre un odontograma editable y dicta nuevamente el hallazgo.')
      clearPending()
      return
    }
    if (!current.apply(proposal.finding)) { respond('No se pudo aplicar la propuesta. Revisa el odontograma y vuelve a intentarlo.'); return }
    clearPending()
    // In automatic voice mode, confirmation completes the action through persistence.
    if (speech.sendMode === 'pause') await saveDraft()
    else respond('Cambio aplicado al borrador en pantalla. Pulsa Guardar borrador para conservar los cambios.')
  }

  async function saveDraft() {
    const current = targetRef.current
    if (busyRef.current || pendingRef.current || draftRef.current || dialogRef.current || !current?.editable) return
    busyRef.current = true
    setBusy(true)
    speech.pause(true)
    const generation = ++generationRef.current
    try {
      const saved = await current.save()
      if (generation === generationRef.current && current.key === targetRef.current?.key) respond(saved ? 'Hallazgo guardado en el borrador del odontograma. Puedes dictar otra pieza.' : 'El cambio está en pantalla, pero no se pudo guardar. Di «guardar borrador» para reintentarlo.')
    } finally {
      if (generation === generationRef.current) {
        busyRef.current = false
        setBusy(false)
        speech.pause(false)
      }
    }
  }

  async function handleInput(rawText: string, patientId = selectedPatient, selectedIntent?: string, patientConfirmed = false) {
    let text = rawText.trim()
    if (!text || busyRef.current) return
    if (mode === 'general' && appointmentQuestion && !selectedIntent && !patientConfirmed
        && /^(?:a las?|el |para el |hoy\b|manana\b|pasado manana\b|lunes\b|martes\b|miercoles\b|jueves\b|viernes\b|sabado\b|domingo\b|\d)/.test(normalizeCoroVoz(text))) {
      text = mergeAppointmentReply(appointmentQuestion, text)
    }
    const isHelpChoice = answer?.suggestions?.length && coroVozChoiceIndex(text, answer.suggestions.length) != null
    if (mode === 'general' && patientQuestion && !patientConfirmed && !selectedIntent && !isHelpChoice) {
      const choice = resolvePatientReply(text, patientQuestion)
      if (choice) {
        patientId = choice.id
        patientConfirmed = true
        text = patientQuestion.question
      } else if (/^(?:y )?(?:el|ella|esa persona|ese paciente|esa paciente) (?:tiene|presenta|cuenta|es|esta)\b/.test(normalizeCoroVoz(text)) && patientQuestion.choices.length > 1) {
        respond('Todavía hay varias coincidencias. Elige el nombre o el número de la opción para saber a quién te refieres.')
        return
      } else if (isPatientConfirmation(text)) {
        respond(patientQuestion.choices.length > 1 ? 'Hay varias coincidencias. Dime el nombre completo o el número de la opción.' : 'Indica el nombre o documento del paciente para retomar la pregunta pendiente.')
        return
      } else if (!patientQuestion.choices.length && /^[a-záéíóúñü\s]{3,80}$/i.test(text)
          && !/\b(como|donde|que|cuando|tele|agenda|dashboard|cita|paciente|alergia|radiografia)\b/.test(normalizeCoroVoz(text))) {
        text = `${patientQuestion.question}. Paciente ${text}`
      }
    }
    if (mode === 'general' && !selectedIntent && answer?.suggestions?.length) {
      const choice = coroVozChoiceIndex(text, answer.suggestions.length)
      if (choice != null) {
        selectedIntent = answer.suggestions[choice].intent
        text = lastPrompt
      }
    }
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
      const voiceCommand = dentalVoiceControl(text)
      if (voiceCommand || dentalFieldAction(text)) setInput('')
      if (voiceCommand === 'repeat') { repeatDictation(); return }
      if (voiceCommand === 'confirm') { confirmProposal(); return }
      const fieldAction = dentalFieldAction(text)
      if ((fieldAction || voiceCommand === 'edit' || voiceCommand === 'discard' || dialogRef.current) && !targetRef.current?.editable) { respond('Abre un odontograma editable para modificar la propuesta.'); return }
      if (fieldAction) { choosePart(fieldAction.action, fieldAction.field); return }
      if (voiceCommand === 'edit') {
        choosePart('edit'); return
      }
      if (voiceCommand === 'discard') {
        choosePart('remove'); return
      }
      if (voiceCommand === 'save' && dialogRef.current) { respond('Completa la edición de la propuesta antes de guardar el borrador.'); return }
      if (dialogRef.current) {
        const current = dialogRef.current
        if (!current.field) {
          const choices = ['piece', 'condition', 'note', 'surface', ...(current.action === 'remove' ? ['all'] : [])] as const
          const index = coroVozChoiceIndex(text, choices.length)
          const field = dentalField(text) || (index == null ? null : choices[index])
          if (!field) { respond('Di diente, condición, observación o cara' + (current.action === 'remove' ? ', o todo.' : '.')); return }
          choosePart(current.action, field as DentalField | 'all'); return
        }
        await replacePart(text, current); return
      }
      if (voiceCommand === 'save') {
        if (pendingRef.current) { respond('Primero confirma, edita o borra la propuesta pendiente.'); return }
        if (!targetRef.current?.editable) { respond('Abre un odontograma editable antes de guardar el borrador.'); return }
        void saveDraft(); return
      }
      if (!targetRef.current?.editable) { respond('Abre Pacientes, selecciona al paciente y entra en un odontograma editable.'); return }
      const choice = coroVozChoiceIndex(text, dentalOptions.length)
      if (choice != null) text = dentalOptions[choice].value
      const previous = pendingRef.current ? dentalDraftFragment(pendingRef.current.finding) : fragmentRef.current
      if (previous && !/^no (?:no )?era\b/.test(command)) text = mergeDentalDictation(previous, text)
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
        const result = await askCoroVoz(text, controller.signal, patientId, selectedIntent, patientConfirmed)
        if (generation !== generationRef.current) return
        setAnswer(result)
        if (result.intent === 'CITA_ACLARAR') setAppointmentQuestion(text)
        else if (result.intent === 'CITA_BORRADOR' || result.intent === 'PACIENTE_ELEGIR') setAppointmentQuestion('')
        setConversation(previous => [...previous, { question: text, answer: result.answer }].slice(-8))
        if (result.patientId) { setSelectedPatient(result.patientId); setSelectedPatientName(result.patientName || ''); setPatientQuestion(null) }
        else if (result.intent === 'PACIENTE_ELEGIR') {
          setSelectedPatient(null)
          setSelectedPatientName('')
          setPatientQuestion({ question: text, choices: result.patients || [] })
        }
        if (readAloud) speech.speak(result.answer)
      } else {
        const result = await interpretDentalCommand(text, controller.signal, targetRef.current?.selectedPiece ?? dentalPiece)
        if (generation !== generationRef.current || targetKey !== targetRef.current?.key) return
        if (result.contextPiece != null) {
          setDentalPiece(result.contextPiece)
          targetRef.current?.select(result.contextPiece)
        }
        setDentalOptions(result.suggestions || [])
        if (result.selectedPiece != null) {
          clearFragment()
          if (pendingRef.current && result.correctedFrom !== pendingRef.current.finding.piece) {
            respond('La pieza que quieres corregir no coincide con la propuesta pendiente. Revisa la pieza y dicta la corrección de nuevo.')
          } else if (!targetRef.current?.select(result.selectedPiece)) respond('No pude seleccionar esa pieza en el odontograma abierto.')
          else if (pendingRef.current) {
            setDentalPiece(result.selectedPiece)
            const corrected = { ...pendingRef.current, finding: { ...pendingRef.current.finding, piece: result.selectedPiece } }
            pendingRef.current = corrected
            setPending(corrected)
            respond(`Corregí la propuesta a la pieza ${result.selectedPiece}. Revisa la condición y la cara antes de confirmar.`)
          } else {
            setDentalPiece(result.selectedPiece)
            const draft = result.draft || (draftRef.current && result.correctedFrom === draftRef.current.piece ? { ...draftRef.current, piece: result.selectedPiece } : null)
            if (draft) { setWorkingDraft(draft); fragmentRef.current = dentalDraftFragment(draft); setDentalFragment(fragmentRef.current) }
            respond(result.message)
          }
        } else if (result.incomplete) {
          clearPending(); setWorkingDraft(result.draft || null)
          fragmentRef.current = result.fragment
          setDentalFragment(result.fragment)
          respond(result.message)
        } else if (!result.understood || !result.proposal || !targetKey) { fragmentRef.current = ''; setDentalFragment(''); respond(result.message) }
        else {
          clearFragment()
          const next = { finding: result.proposal, targetKey }
          setWorkingDraft(null)
          pendingRef.current = next
          setPending(next)
          const p = result.proposal
          respond(`Pieza ${p.piece}, ${LABELS[p.condition] || p.condition}, cara ${p.surface.toLowerCase()}${p.note ? `. Observación: ${p.note}` : ''}. Di «confirmar», «editar», «eliminar propuesta» o «repetir propuesta».`)
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
          <div className="flex-1"><h2 className="font-bold" style={{ fontFamily: 'Outfit' }}>CoroVoz</h2><p className="text-xs text-white/70">{mode === 'general' ? 'Consultas y ayuda de Coronyx' : mode === 'odontograma' ? 'Dictado de odontograma' : 'Elige cómo quieres trabajar'}</p></div>
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
                <p className="mt-1">{target?.editable ? speech.sendMode === 'pause' ? 'Al decir «confirmar», el hallazgo se aplica y se guarda en el borrador del odontograma.' : 'Los cambios se agregan al borrador en pantalla. Usa Guardar borrador para conservarlos.' : target ? 'Este odontograma está cargando, guardándose o no es editable. Revisa el estado de la versión.' : 'Abre Pacientes y entra en la pestaña Odontograma del paciente.'}</p>
                {!target && <button onClick={() => navigate('/app/pacientes')} className="mt-2 underline font-semibold">Ir a Pacientes</button>}
                {target && <button onClick={() => void saveDraft()} disabled={!target.editable || busy || Boolean(proposalForm)} className="mt-3 rounded-lg border border-violet-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40">Guardar borrador</button>}
              </div>}

              <div className="flex items-center justify-between gap-2">
                <button onClick={speech.enabled ? speech.stop : speech.start} disabled={!speech.supported || speech.starting || busy || (mode === 'odontograma' && !target?.editable)} className={`rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-40 ${speech.enabled ? 'bg-rose-100 text-rose-800' : 'bg-cyan-700 text-white'}`}>
                  {speech.starting ? 'Activando micrófono…' : speech.enabled ? '■ Detener escucha' : '🎙 Iniciar escucha'}
                </button>
                <label className="text-xs text-slate-600 flex items-center gap-1.5"><input type="checkbox" checked={readAloud} onChange={e => { setReadAloud(e.target.checked); if (!e.target.checked) speech.interrupt() }} />Leer respuestas</label>
              </div>
              <label className="flex items-center justify-between gap-2 text-xs text-slate-600">Enviar dictado
                <select aria-label="Envío del dictado" value={speech.sendMode} onChange={e => speech.setSendMode(e.target.value as 'manual' | 'pause')} className="rounded-lg border border-slate-300 p-2">
                  <option value="manual">Revisar y pulsar Enviar</option><option value="pause">Al pausar 3,5 segundos</option>
                </select>
              </label>
              {speech.speaking && <button onClick={speech.interrupt} className="rounded-lg border border-cyan-300 px-3 py-2 text-sm font-semibold text-cyan-800">Interrumpir respuesta</button>}
              <p className="text-xs text-slate-500">{speech.starting ? 'Preparando detección local de voz…' : speech.transcribing ? 'Transcribiendo tu mensaje…' : speech.speaking ? 'CoroVoz está respondiendo.' : speech.listening ? speech.sendMode === 'manual' ? 'Al pasar 3,5 segundos sin voz, apagaré el micrófono y dejaré el texto para revisión.' : 'Enviaré tu mensaje después de 3,5 segundos sin voz. El ruido de fondo no cuenta como habla detectada.' : speech.enabled ? 'CoroVoz está preparando la respuesta…' : speech.supported ? 'El micrófono está apagado. Inicia la escucha para hablar.' : 'Abre Coronyx desde una conexión segura para usar el micrófono.'}</p>
              {speech.notice && <p role="status" className="text-xs text-slate-600">{speech.notice}</p>}
              {speech.enabled && speech.sendMode === 'pause' && awaitingDentalReply && <p role="status" className="text-xs font-semibold text-emerald-700">Continuamos por voz. Espera a que termine mi respuesta y di tu orden; no necesitas pulsar Enviar ni volver a iniciar la escucha.</p>}
              {speech.enabled && <div className="flex items-center gap-3">
                <div role="meter" aria-label="Nivel del micrófono" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(speech.level * 100)} className="h-2 flex-1 rounded-full bg-slate-200 overflow-hidden"><div className="h-full bg-emerald-500 transition-[width]" style={{ width: `${Math.round(speech.level * 100)}%` }} /></div>
                {speech.sendMode === 'manual' && <button onClick={() => void speech.finish()} disabled={busy || speech.transcribing || speech.speaking} className="text-xs font-semibold text-cyan-800 underline disabled:opacity-40">Terminé: enviar</button>}
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
              {answer && <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 space-y-3"><p role="status" className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">{answer.answer}</p>{answer.route && ROUTES[role || '']?.includes(answer.route) && <button onClick={() => { speech.stop(); navigate(answer.route, answer.appointmentDraft ? { state: { coroVozAppointment: answer.appointmentDraft } } : undefined); if (answer.appointmentDraft) onClose?.() }} className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white">{answer.targetLabel}</button>}</div>}
              {mode === 'general' && appointmentQuestion && <div className="text-xs text-slate-600">Cita pendiente: {appointmentQuestion} <button onClick={() => setAppointmentQuestion('')} className="underline">Descartar</button></div>}
              {answer?.suggestions?.length ? <div className="space-y-2" aria-label="Opciones para aclarar la pregunta">{answer.suggestions.map((option, index) => <button key={option.intent} onClick={() => void handleInput(lastPrompt, selectedPatient, option.intent)} disabled={busy} className="block w-full rounded-xl border border-cyan-200 bg-white p-3 text-left text-sm hover:bg-cyan-50 disabled:opacity-40"><span className="font-semibold text-cyan-900">{index + 1}. {option.label}</span></button>)}</div> : null}
              {mode === 'general' && patientQuestion && <div className="space-y-2" aria-label="Coincidencias de pacientes"><p className="text-xs text-slate-600">Consulta pendiente: {patientQuestion.question}</p>{patientQuestion.choices.map((patient, index) => <button key={patient.id} onClick={() => void handleInput(patientQuestion.question, patient.id, undefined, true)} disabled={busy} className="block w-full rounded-xl border border-cyan-200 p-3 text-left text-sm disabled:opacity-40"><strong className="block">{index + 1}. {patient.name}</strong><span className="text-xs text-slate-500">{patient.documentHint}</span></button>)}<button onClick={() => setPatientQuestion(null)} className="text-xs underline">Descartar consulta pendiente</button></div>}
              {mode === 'general' && selectedPatient && <div className="text-xs text-slate-500"><strong>Paciente de la consulta: {selectedPatientName}.</strong> Puedes continuar con «¿Y sus alergias?» o indicar otro paciente. <button onClick={() => { setSelectedPatient(null); setSelectedPatientName(''); setPatientQuestion(null); setAnswer(null); setConversation([]) }} className="underline text-cyan-800">Olvidar paciente y conversación</button></div>}
              {mode === 'general' && conversation.length > 1 && <details className="text-xs text-slate-600"><summary className="cursor-pointer">Conversación reciente ({conversation.length})</summary><div className="mt-2 space-y-3">{conversation.slice(0, -1).map((turn, index) => <div key={index}><p className="font-semibold">{turn.question}</p><p className="whitespace-pre-line">{turn.answer}</p></div>)}</div></details>}
              {mode === 'odontograma' && dentalPiece && <p className="text-xs text-violet-800">Pieza de esta conversación: <strong>{dentalPiece}</strong>. Puedes continuar sin repetir el número.</p>}
              {mode === 'odontograma' && (proposalForm || dentalFragment) && <button type="button" onClick={repeatDictation} disabled={busy} className="text-sm text-violet-800 underline disabled:opacity-40">Repetir propuesta</button>}
              {mode === 'odontograma' && dialog && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm space-y-2" aria-label="Edición de la propuesta">
                <strong>{dialog.field ? `Di solo el nuevo valor de ${FIELD_LABELS[dialog.field]}.` : dialog.action === 'edit' ? '¿Qué parte quieres editar?' : '¿Qué parte quieres eliminar?'}</strong>
                {!dialog.field && <div className="flex flex-wrap gap-2">{(Object.keys(FIELD_LABELS) as DentalField[]).map(field => <button key={field} disabled={busy} onClick={() => choosePart(dialog.action, field)} className="rounded-lg border bg-white p-2">{FIELD_LABELS[field]}</button>)}{dialog.action === 'remove' && <button disabled={busy} onClick={() => choosePart('remove', 'all')} className="rounded-lg border bg-white p-2">Todo</button>}</div>}
              </div>}
              {proposalForm && <div aria-label="Formulario de la propuesta" className="rounded-xl border-2 border-violet-300 bg-violet-50 p-4 space-y-3">
                <h3 className="font-semibold text-violet-900">Propuesta para {target?.patientName}</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm"><dt>Pieza / diente</dt><dd className="font-bold">{proposalForm.piece || 'Pendiente'}</dd><dt>Condición</dt><dd>{proposalForm.condition ? LABELS[proposalForm.condition] : 'Pendiente'}</dd><dt>Observación</dt><dd>{proposalForm.note || 'Sin observación (opcional)'}</dd><dt>Cara</dt><dd>{proposalForm.surface === 'GENERAL' ? 'General (diente completo)' : proposalForm.surface.toLowerCase()}</dd></dl>
                {!pending && <p className="text-xs text-violet-800">Propuesta en construcción. Puedes añadir los campos en el orden que prefieras. Completa o aclara pieza y condición para confirmar.</p>}
                {dentalOptions.length > 0 && <div aria-label="Opciones del odontograma" className="grid grid-cols-2 gap-2">{dentalOptions.map((option, index) => <button key={option.value} disabled={busy} onClick={() => void handleInput(option.value)} className="rounded-lg border border-violet-200 p-2 text-left text-sm hover:bg-violet-50 disabled:opacity-40">{index + 1}. {option.label}</button>)}</div>}
                {pending && !dialog && <p className="text-xs text-violet-800">{target?.describe(pending.finding)}</p>}
                <div className="flex flex-wrap gap-2">
                  <button onClick={confirmProposal} disabled={!pending || !target?.editable || !!dialog || busy} className="rounded-lg bg-violet-700 text-white px-3 py-2 text-sm disabled:opacity-40">Correcto: agregar</button>
                  <button onClick={() => void handleInput('corovoz edita')} className="rounded-lg bg-white border border-violet-200 px-3 py-2 text-sm">Editar</button>
                  <button onClick={() => void handleInput('corovoz elimina')} className="rounded-lg bg-white border border-rose-200 text-rose-700 px-3 py-2 text-sm">Eliminar propuesta</button>
                </div>
              </div>}
              <form onSubmit={submit} className="space-y-2">
                <label htmlFor="corovoz-text" className="text-xs font-semibold text-slate-600">{mode === 'general' ? 'Tu pregunta' : 'Hallazgo o comando'}</label>
                <textarea id="corovoz-text" value={input} onChange={e => setInput(e.target.value)} maxLength={600} rows={3} placeholder={mode === 'general' ? '¿Cómo registro un paciente?' : 'Caries en pieza 14 cara oclusal. Observación: control.'} className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                <button type="submit" disabled={busy || !input.trim()} className="w-full rounded-xl bg-[#0B3D3A] text-white py-2.5 text-sm font-semibold disabled:opacity-40">{busy ? 'Procesando…' : 'Enviar'}</button>
              </form>
              {mode === 'odontograma' && <div className="text-xs text-slate-500 space-y-1"><p>Una pieza y condición por vez. Puedes añadir una cara y decir «observación» u «observaciones» para dictar la nota.</p><p>Al pausar 3,5 segundos puedes continuar por voz: «repetir propuesta», «confirmar», «editar diente», «editar condición», «editar observación», «eliminar» o «eliminar todo». «Editar» y «eliminar» te preguntan qué parte. Espera a que termine la respuesta para continuar. En modo manual revisa el texto y pulsa Enviar.</p><p>«Confirmar» agrega el hallazgo al borrador en pantalla. «Guardar borrador» conserva los cambios. Eliminar afecta la propuesta pendiente. La conversación se conserva al cerrar el panel en el mismo paciente y versión.</p></div>}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
