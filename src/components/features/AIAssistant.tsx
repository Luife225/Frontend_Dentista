import { useEffect, useRef, useState, type FormEvent } from 'react'
import CoroVozIcon from './CoroVozIcon'
import CoroVozMascot from './CoroVozMascot'
import { resolveMascotState } from '../../utils/coroVozMascot'
import './CoroVozAssistant.css'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCoroVoz } from '../../contexts/CoroVozContext'
import useCoroVozSpeech from '../../hooks/useCoroVozSpeech'
import { appointmentRequestPatient, mergeAppointmentReply } from '../../utils/coroVozAppointment'
import { askCoroVoz, interpretDentalCommand, reviseDentalCommand, type CoroVozAnswer, type DentalProposal } from '../../services/coroVozService'
import { dentalField, dentalFieldAction, describeDentalDraft, dentalDraftFragment, FIELD_LABELS, type DentalDialog, type DentalDraft, type DentalField } from '../../utils/coroVozDentalDialog'
import { normalizeCoroVoz, mergeDentalDictation, stripSendCommand, isCoroVozControl, dentalVoiceControl, coroVozChoiceIndex, resolvePatientReply, isPatientConfirmation, isDentalRecordQuestion, type PatientQuestion } from '../../utils/coroVozConversation'

type Mode = 'general' | 'odontograma' | null
interface Pending { finding: DentalProposal; targetKey: string }
const LABELS: Record<string, string> = { SANO: 'Sano', CARIES: 'Caries', RESTAURADO: 'Restauración', CORONA: 'Corona', EXTRAIDO: 'Extraído', ENDODONCIA: 'Endodoncia', IMPLANTE: 'Implante', FRACTURA: 'Fractura' }
const ROUTES: Record<string, string[]> = {
  ODONTOLOGO: ['/app/dashboard', '/app/agenda', '/app/pacientes', '/app/notificaciones', '/app/caja', '/app/teleodontologia'],
  RECEPCIONISTA: ['/app/dashboard', '/app/agenda', '/app/pacientes', '/app/notificaciones', '/app/inventario'],
  ADMIN_CLINICA: ['/app/dashboard', '/app/agenda', '/app/pacientes', '/app/inventario', '/app/caja', '/app/consultorio'],
}

export default function AIAssistant({ onClose, onOpen, expanded = true }: { onClose?: () => void; onOpen?: () => void; expanded?: boolean }) {
  const { role } = useAuth()
  const navigate = useNavigate()
  const { target, memory, dentalMemory, patient, appointmentDraft, appointmentRevision, applyAppointment, closeAppointment } = useCoroVoz()
  const targetRef = useRef(target)
  targetRef.current = target
  const [mode, setMode] = useState<Mode>('general')
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
  const [readAloud, setReadAloud] = useState(false)
  const readAloudRef = useRef(false)
  const [activationSound, setActivationSound] = useState(true)
  const [selectedOption, setSelectedOption] = useState('')
  const [responseError, setResponseError] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [acknowledgedSpeechError, setAcknowledgedSpeechError] = useState('')
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
  const [agendaContext, setAgendaContext] = useState(memory.current.agendaContext)
  const requestRef = useRef<AbortController | null>(null)
  const generationRef = useRef(0)
  const proposalForm = dialog?.draft || pending?.finding || workingDraft
  const awaitingDentalReply = mode === 'odontograma' && Boolean(proposalForm || dentalFragment)
  const speech = useCoroVozSpeech(handleVoice, awaitingDentalReply, { activationSound: readAloud && activationSound })
  const visibleSpeechError = speech.error === acknowledgedSpeechError ? '' : speech.error

  useEffect(() => { if (!speech.error) setAcknowledgedSpeechError('') }, [speech.error])

  useEffect(() => {
    memory.current = { patientId: selectedPatient, patientName: selectedPatientName, question: patientQuestion,
      appointment: appointmentQuestion, turns: conversation, agendaContext }
  }, [memory, selectedPatient, selectedPatientName, patientQuestion, appointmentQuestion, conversation, agendaContext])

  useEffect(() => {
    cancelRequest()
    speech.stop()
    setSelectedPatient(patient?.id || null)
    setSelectedPatientName(patient?.name || '')
    setPatientQuestion(null)
    setAnswer(null)
    setAgendaContext(null)
  }, [patient?.id, speech.stop])

  useEffect(() => {
    if (role === 'ODONTOLOGO' && target?.key) changeMode('odontograma')
    else if (mode === 'odontograma') changeMode('general')
  }, [target?.key, role])

  function clearVisualFeedback() { setResponseError(false); setSuccessMessage(''); setAcknowledgedSpeechError(speech.error) }
  function markSuccess(label: string) { setResponseError(false); setSuccessMessage(label) }
  function markFailure() { setSuccessMessage(''); setResponseError(true) }

  // Feedback lasts briefly after speech finishes, including when automatic listening
  // takes priority. An old confirmation must never reappear after stopping the mic.
  useEffect(() => {
    if (!successMessage || speech.speaking) return
    const timer = window.setTimeout(() => setSuccessMessage(''), 2200)
    return () => window.clearTimeout(timer)
  }, [successMessage, speech.speaking])

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
    if (readAloudRef.current) speech.speak(text)
  }

  function repeatDictation() {
    clearVisualFeedback()
    const finding = dialogRef.current?.draft || pendingRef.current?.finding || draftRef.current
    const text = finding ? describeDentalDraft(finding) : fragmentRef.current ? `Propuesta incompleta: ${fragmentRef.current}. Faltan datos antes de confirmar.` : 'No hay una propuesta pendiente para repetir.'
    setMessage(text)
    speech.speak(text)
  }

  function choosePart(action: 'edit' | 'remove', field?: DentalField | 'all') {
    clearVisualFeedback()
    setInput('')
    const draft = dialogRef.current?.draft || pendingRef.current?.finding || draftRef.current
    if (action === 'remove' && field === 'all') {
      clearPending(); clearFragment(); setDialog(null); setInput('')
      markSuccess('Propuesta descartada')
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
    clearVisualFeedback()
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
      if (!result.understood || !result.proposal) { setDentalOptions(result.suggestions || []); if (!result.suggestions?.length) markFailure(); respond(result.message); return }
      const next = { finding: result.proposal, targetKey }
      pendingRef.current = next; setPending(next); setWorkingDraft(null); setDialog(null); clearFragment()
      setDentalPiece(next.finding.piece); targetRef.current?.select(next.finding.piece)
      respond(`${describeDentalDraft(next.finding)} Confirma, edita o elimina.`)
    } catch (error) {
      if (generation === generationRef.current) { setResponseError(true); respond(error instanceof Error ? error.message : 'No se pudo editar la propuesta.') }
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
    clearVisualFeedback()
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
    if (next === mode) return
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
    setSelectedOption('')
    clearVisualFeedback()
  }

  async function confirmProposal() {
    if (busyRef.current) return
    clearVisualFeedback()
    if (dialogRef.current) { respond('Termina de elegir o corregir la parte pendiente antes de confirmar. Puedes decir «repetir propuesta».'); return }
    const proposal = pendingRef.current
    const current = targetRef.current
    if (!proposal) { respond(draftRef.current ? 'La propuesta está incompleta o necesita aclaración. Completa la pieza y la condición antes de confirmar.' : 'No hay una propuesta pendiente para confirmar. Dicta primero el hallazgo.'); return }
    if (!proposal || !current || !current.editable || proposal.targetKey !== current.key) {
      respond('Abre un odontograma editable y dicta nuevamente el hallazgo.')
      clearPending()
      return
    }
    if (!current.apply(proposal.finding)) { markFailure(); respond('No se pudo aplicar la propuesta. Revisa el odontograma y vuelve a intentarlo.'); return }
    clearPending()
    // In automatic voice mode, confirmation completes the action through persistence.
    if (speech.sendMode === 'pause') await saveDraft()
    else { markSuccess('Hallazgo aplicado al borrador'); respond('Cambio aplicado al borrador en pantalla. Pulsa Guardar borrador para conservar los cambios.') }
  }

  async function saveDraft() {
    const current = targetRef.current
    if (busyRef.current || pendingRef.current || draftRef.current || dialogRef.current || !current?.editable) return
    clearVisualFeedback()
    busyRef.current = true
    setBusy(true)
    speech.pause(true)
    const generation = ++generationRef.current
    try {
      const saved = await current.save()
      if (generation === generationRef.current && current.key === targetRef.current?.key) {
        if (saved) markSuccess('Borrador guardado')
        else markFailure()
        respond(saved ? 'Hallazgo guardado en el borrador del odontograma. Puedes dictar otra pieza.' : 'El cambio está en pantalla, pero no se pudo guardar. Di «guardar borrador» para reintentarlo.')
      }
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
    const recordQuery = mode === 'odontograma' && role === 'ODONTOLOGO' && Boolean(targetRef.current?.patientId) && isDentalRecordQuestion(text)
    const requestMode = recordQuery ? 'general' : mode
    if (recordQuery) { patientId = targetRef.current!.patientId!; changeMode('general') }
    clearVisualFeedback()
    if (requestMode === 'general' && appointmentDraft && /^(?:cancelar|descartar|cerrar)(?: el| la)? (?:borrador|formulario|cita en preparacion)\b/.test(normalizeCoroVoz(text))) {
      closeAppointment(); setAppointmentQuestion(''); setAnswer(null)
      respond('Borrador descartado. No se guardó ninguna cita.'); return
    }
    if (requestMode === 'general' && !appointmentDraft && appointmentQuestion && !selectedIntent && !patientConfirmed
        && /^(?:a las?|el |para el |hoy\b|manana\b|pasado manana\b|lunes\b|martes\b|miercoles\b|jueves\b|viernes\b|sabado\b|domingo\b|\d)/.test(normalizeCoroVoz(text))) {
      text = mergeAppointmentReply(appointmentQuestion, text)
    }
    const isHelpChoice = answer?.suggestions?.length && coroVozChoiceIndex(text, answer.suggestions.length) != null
    if (requestMode === 'general' && patientQuestion && !patientConfirmed && !selectedIntent && !isHelpChoice) {
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
    if (requestMode === 'general' && !selectedIntent && answer?.suggestions?.length) {
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
      setMessage(requestMode === 'odontograma' ? 'Escucha detenida. Revisa los cambios y pulsa Guardar borrador en el odontograma.' : 'Escucha detenida. Puedes continuar escribiendo.')
      return
    }
    if (['prender corovoz', 'activar corovoz', 'corovoz iniciar', 'iniciar'].includes(command)) {
      respond('CoroVoz listo. Di tu pregunta o un hallazgo según el modo seleccionado.')
      return
    }
    if (requestMode === 'odontograma') {
      const registered = role === 'ODONTOLOGO' ? targetRef.current?.query?.(text) : null
      if (registered) { setLastPrompt(text); setInput(''); respond(registered); return }
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
    if (!requestMode) return
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
    const revision = appointmentRevision.current
    try {
      if (requestMode === 'general') {
        const result = await askCoroVoz(text, controller.signal, recordQuery ? patientId : appointmentRequestPatient(appointmentDraft, patientId, patientConfirmed), selectedIntent, patientConfirmed, appointmentDraft, agendaContext)
        if (generation !== generationRef.current) return
        if (result.appointmentDraft && !applyAppointment(result.appointmentDraft, revision)) {
          respond('El formulario cambió mientras procesaba tu solicitud. Conservé tus cambios; vuelve a indicar la corrección que necesitas.')
          return
        }
        setAnswer(result)
        if (result.agendaContext) setAgendaContext(result.agendaContext)
        const needsReply = result.intent === 'CITA_ACLARAR' || result.intent === 'PACIENTE_ELEGIR' || Boolean(result.suggestions?.length || result.patients?.length)
        if (result.understood && !needsReply) markSuccess('Consulta completada')
        else if (!result.understood && !needsReply) markFailure()
        if (result.intent === 'CITA_ACLARAR') setAppointmentQuestion(text)
        else if (result.intent === 'CITA_BORRADOR' || result.intent === 'PACIENTE_ELEGIR') setAppointmentQuestion('')
        setConversation(previous => [...previous, { question: text, answer: result.answer }].slice(-8))
        if (result.patientId) { setSelectedPatient(result.patientId); setSelectedPatientName(result.patientName || ''); setPatientQuestion(null) }
        else if (result.intent === 'PACIENTE_ELEGIR') {
          setSelectedPatient(null)
          setSelectedPatientName('')
          setPatientQuestion({ question: text, choices: result.patients || [] })
        }
        if (readAloudRef.current) speech.speak(result.answer)
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
            markFailure()
            respond('La pieza que quieres corregir no coincide con la propuesta pendiente. Revisa la pieza y dicta la corrección de nuevo.')
          } else if (!targetRef.current?.select(result.selectedPiece)) { markFailure(); respond('No pude seleccionar esa pieza en el odontograma abierto.') }
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
        } else if (!result.understood || !result.proposal || !targetKey) { fragmentRef.current = ''; setDentalFragment(''); if (!result.suggestions?.length) markFailure(); respond(result.message) }
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
      if (generation === generationRef.current) { setResponseError(true); respond(error instanceof Error ? error.message : 'No se pudo consultar CoroVoz.') }
    } finally {
      if (generation === generationRef.current) {
        busyRef.current = false
        setBusy(false)
        speech.pause(false)
      }
    }
  }

  function submit(event: FormEvent) { event.preventDefault(); setSelectedOption(''); void handleInput(input) }

  const awaitingAnswer = mode === 'general'
    ? Boolean(patientQuestion || appointmentQuestion || answer?.suggestions?.length || answer?.intent === 'CITA_ACLARAR')
    : mode === 'odontograma' && Boolean(dentalOptions.length || dialog || proposalForm || dentalFragment)
  const state = resolveMascotState({ expanded, speaking: speech.speaking,
    processing: speech.starting || speech.transcribing || busy, listening: speech.listening,
    error: Boolean(visibleSpeechError || responseError), awaitingAnswer, success: Boolean(successMessage) })
  const status = { idle: 'Aquí para ayudarte', listening: 'Te escucho · puedes hablar', thinking: speech.phase === 'INTERRUPTING' ? 'Deteniendo la voz' : speech.starting ? 'Preparando micrófono' : speech.transcribing ? 'Transcribiendo' : 'Pensando', speaking: 'Hablando contigo', choosing: 'Elige o responde por voz', success: successMessage, error: 'Necesito tu atención', minimized: 'Abrir CoroVoz' }[state]
  const micLabel = speech.speaking ? 'Interrumpir y hablar' : speech.listening ? 'Detener escucha' : speech.starting ? status : 'Iniciar escucha'
  const reply = speech.speaking ? speech.spokenText : message || answer?.answer
  function choose(label: string, action: () => void) { setSelectedOption(label); action() }
  function minimize() { clearVisualFeedback(); cancelRequest(); speech.stop(); onClose?.() }
  // Closing always stops microphone capture and invalidates pending responses.
  useEffect(() => { if (!expanded) { clearVisualFeedback(); cancelRequest(); speech.stop() } }, [expanded, speech.stop])

  return (
    <aside aria-label="CoroVoz" className={`corovoz-dock ${expanded ? 'is-expanded' : 'is-minimized'}`} data-state={state} onKeyDown={event => { if (event.key === 'Escape') minimize() }}>
      {expanded && <section className="corovoz-bubble" aria-label="Conversación con CoroVoz">
        <header className="corovoz-heading">
          <span className="corovoz-brandmark"><CoroVozIcon name="chat" /></span>
          <div><h2>COROVOZ <span>IA</span></h2><p>{role === 'ODONTOLOGO' ? 'Asistencia clínica' : role === 'ADMIN_CLINICA' ? 'Gestión de la clínica' : 'Agenda y atención al paciente'}</p></div>
          <button type="button" className="corovoz-icon" title="Minimizar y apagar micrófono" aria-label="Minimizar CoroVoz" onClick={minimize}><CoroVozIcon name="minimize" /></button>
        </header>
        <nav className="corovoz-modes" aria-label="Modo del asistente">
          <button type="button" aria-pressed={mode === 'general'} onClick={() => changeMode('general')}><CoroVozIcon name="chat" />General</button>
          {role === 'ODONTOLOGO' && <button type="button" aria-pressed={mode === 'odontograma'} onClick={() => changeMode('odontograma')}><CoroVozIcon name="tooth" />Odontograma</button>}
        </nav>
        <div className="corovoz-scroll">
          {!mode ? <div className="corovoz-welcome"><span className="corovoz-eyebrow">HOLA, SOY CORONIX</span><h3>¿En qué te ayudo hoy?</h3><p>Elige General para consultar citas y pacientes{role === 'ODONTOLOGO' ? ', u Odontograma para dictar tus hallazgos.' : '.'}</p><span className="corovoz-hint">Puedes hablar o escribir. Tú eliges.</span></div> : <>
            {mode === 'odontograma' && <div className={`corovoz-context ${!target?.editable ? 'is-warning' : ''}`}>
              <div><span className="corovoz-eyebrow">ODONTOGRAMA ABIERTO</span><strong>{target?.patientName || 'Selecciona un paciente'}</strong></div>
              {target ? <button className="corovoz-link" onClick={() => void saveDraft()} disabled={!target.editable || busy || Boolean(proposalForm)}>Guardar borrador</button> : <button className="corovoz-link" onClick={() => navigate('/app/pacientes')}>Ir a Pacientes</button>}
              <p>{target?.editable ? speech.sendMode === 'pause' ? 'Confirmar aplica y guarda el hallazgo en el borrador.' : 'Confirma el hallazgo y guarda el borrador para conservarlo.' : target ? 'Versión en consulta, cargando o guardándose. Espera o abre una versión editable.' : 'Abre la ficha del paciente y su odontograma.'}</p>
            </div>}
            {lastPrompt && <div className="corovoz-user-message"><span>TÚ</span><p>{lastPrompt}</p></div>}
            {reply && <div className="corovoz-response" role="status" aria-live="polite" aria-atomic="true"><p>{reply}</p></div>}
            {busy && <div role="status" className="corovoz-processing"><span className="corovoz-dots"><i /><i /><i /></span>Preparando tu respuesta</div>}
            {visibleSpeechError && <p role="alert" className="corovoz-error">{visibleSpeechError}</p>}
            {speech.notice && <p role="status" className="corovoz-hint">{speech.notice}</p>}
            {speech.interim && <p className="corovoz-interim">{speech.interim}</p>}
            {answer?.route && !answer.appointmentDraft && ROUTES[role || '']?.includes(answer.route) && <button className="corovoz-primary" onClick={() => {
              speech.stop()
              const { appointmentId, selectedDate } = answer.agendaContext || {}
              if (answer.route === '/app/agenda' && appointmentId && selectedDate) {
                navigate(answer.route, { state: { coroVozAppointmentTarget: { id: appointmentId, date: selectedDate } } })
              } else {
                navigate(answer.route)
              }
            }}>{answer.targetLabel} <span aria-hidden="true">↗</span></button>}
            {appointmentDraft && mode === 'general' && <div className="corovoz-detail"><strong>Formulario de cita abierto</strong><p>Completa los campos por voz o directamente en el formulario. Revisa y pulsa Agendar Cita para guardar.</p><button className="corovoz-link" onClick={() => { closeAppointment(); setAppointmentQuestion(''); setAnswer(null) }}>Descartar borrador</button></div>}
            {answer?.suggestions?.length ? <div className="corovoz-choices" aria-label="Opciones para aclarar la pregunta">{answer.suggestions.map((option, index) => <button key={option.intent} disabled={busy} aria-pressed={selectedOption === option.label} onClick={() => choose(option.label, () => void handleInput(lastPrompt, selectedPatient, option.intent))}><span>{index + 1}</span>{option.label}</button>)}</div> : null}
            {mode === 'general' && patientQuestion && <div className="corovoz-detail"><p className="corovoz-hint">Consulta pendiente: {patientQuestion.question}</p><div className="corovoz-choices" aria-label="Coincidencias de pacientes">{patientQuestion.choices.map((patient, index) => <button key={patient.id} disabled={busy} aria-pressed={selectedOption === patient.name} onClick={() => choose(patient.name, () => void handleInput(patientQuestion.question, patient.id, undefined, true))}><span>{index + 1}</span><div>{patient.name}<small>{patient.documentHint}</small></div></button>)}</div><button className="corovoz-link" onClick={() => setPatientQuestion(null)}>Descartar consulta pendiente</button></div>}
            {mode === 'general' && appointmentQuestion && <div className="corovoz-detail"><p>Cita pendiente: {appointmentQuestion}</p><button className="corovoz-link" onClick={() => setAppointmentQuestion('')}>Descartar</button></div>}
            {mode === 'general' && selectedPatient && <div className="corovoz-detail"><strong>{selectedPatientName}</strong><p>Puedes preguntar por su siguiente cita o indicar otro paciente.</p><button className="corovoz-link" onClick={() => { setSelectedPatient(null); setSelectedPatientName(''); setPatientQuestion(null); setAnswer(null); setConversation([]); setAgendaContext(null) }}>Olvidar paciente y conversación</button></div>}
            {mode === 'general' && conversation.length > 1 && <details className="corovoz-detail"><summary>Conversación reciente ({conversation.length})</summary>{conversation.slice(0, -1).map((turn, index) => <div className="corovoz-history" key={index}><strong>{turn.question}</strong><p>{turn.answer}</p></div>)}</details>}
            {mode === 'odontograma' && dentalPiece && <p className="corovoz-hint">Pieza <strong>{dentalPiece}</strong> · puedes continuar sin repetir el número.</p>}
            {mode === 'odontograma' && dialog && <div className="corovoz-detail" aria-label="Edición de la propuesta">
              <strong>{dialog.field ? `Nuevo valor de ${FIELD_LABELS[dialog.field]}` : dialog.action === 'edit' ? '¿Qué parte quieres editar?' : '¿Qué parte quieres eliminar?'}</strong>
              {!dialog.field && <div className="corovoz-choices">{(Object.keys(FIELD_LABELS) as DentalField[]).map(field => <button key={field} disabled={busy} onClick={() => choose(FIELD_LABELS[field], () => choosePart(dialog.action, field))}>{FIELD_LABELS[field]}</button>)}{dialog.action === 'remove' && <button disabled={busy} onClick={() => choose('Todo', () => choosePart('remove', 'all'))}>Todo</button>}</div>}
              {dialog.field === 'surface' && !dentalOptions.length && <div className="corovoz-choices" aria-label="Superficies dentales">{['Mesial', 'Distal', 'Oclusal', 'Vestibular', 'Lingual', 'General'].map(surface => <button key={surface} disabled={busy} onClick={() => choose(surface, () => void handleInput(surface))}>{surface}</button>)}</div>}
            </div>}
            {mode === 'odontograma' && dentalOptions.length > 0 && <div aria-label="Opciones del odontograma" className="corovoz-choices">{dentalOptions.map((option, index) => <button key={option.value} disabled={busy} aria-pressed={selectedOption === option.label} onClick={() => choose(option.label, () => void handleInput(option.value))}><span>{index + 1}</span>{option.label}</button>)}</div>}
            {selectedOption && <div className="corovoz-selection" role="status"><CoroVozIcon name="check" />Elegiste: {selectedOption}</div>}
            {proposalForm && <div aria-label="Formulario de la propuesta" className="corovoz-proposal">
              <div className="corovoz-proposal-title"><CoroVozIcon name="tooth" /><strong>Revisa tu hallazgo</strong><span>{pending ? 'Por confirmar' : 'En curso'}</span></div>
              <dl><dt>Pieza / diente</dt><dd>{proposalForm.piece || 'Pendiente'}</dd><dt>Condición</dt><dd>{proposalForm.condition ? LABELS[proposalForm.condition] : 'Pendiente'}</dd><dt>Observación</dt><dd>{proposalForm.note || 'Sin observación (opcional)'}</dd><dt>Cara</dt><dd>{proposalForm.surface === 'GENERAL' ? 'General (diente completo)' : proposalForm.surface.toLowerCase()}</dd></dl>
              {!pending && <p className="corovoz-hint">Completa o aclara pieza y condición para confirmar. Puedes añadir los campos en cualquier orden.</p>}
              {pending && !dialog && <p className="corovoz-hint">{target?.describe(pending.finding)}</p>}
              <div className="corovoz-proposal-actions"><button className="corovoz-primary" onClick={confirmProposal} disabled={!pending || !target?.editable || !!dialog || busy}><CoroVozIcon name="check" />Correcto: agregar</button><button className="corovoz-link" disabled={busy} onClick={() => void handleInput('corovoz edita')}>Editar</button><button className="corovoz-link is-danger" disabled={busy} onClick={() => void handleInput('corovoz elimina')}>Eliminar propuesta</button></div>
            </div>}
            {mode === 'odontograma' && (proposalForm || dentalFragment) && <button className="corovoz-link" onClick={repeatDictation} disabled={busy}>Repetir propuesta</button>}
            {!lastPrompt && !pending && <div className="corovoz-examples"><span className="corovoz-eyebrow">PRUEBA CON UNA IDEA</span>{(mode === 'general' ? ['¿Qué es Coronyx?', '¿Cómo veo usuarios inactivos?', '¿Cómo agendo una cita?', 'Próxima cita del paciente [nombre o DNI]'] : ['Corona en pieza catorce', 'Caries en diente treinta y seis cara oclusal']).map(example => <button key={example} onClick={() => setInput(example)}>{example}<span aria-hidden="true">↗</span></button>)}</div>}
          </>}
        </div>
        {mode && <div className="corovoz-composer-area">
          <form onSubmit={submit} className="corovoz-composer">
            <label htmlFor="corovoz-text" className="sr-only">{mode === 'general' ? 'Tu pregunta' : 'Hallazgo o comando'}</label>
            <textarea id="corovoz-text" value={input} onChange={e => setInput(e.target.value)} maxLength={600} rows={2} placeholder={mode === 'general' ? 'Escribe tu pregunta…' : 'Dicta o escribe un hallazgo…'} />
            <button type="submit" className="corovoz-icon corovoz-send" title="Enviar mensaje" aria-label="Enviar" disabled={busy || !input.trim()}><CoroVozIcon name="send" /></button>
          </form>
          <details className="corovoz-settings">
            <summary><CoroVozIcon name="settings" /><span>{speech.sendMode === 'manual' ? 'Envío manual' : 'Automático · 3,5 s'}</span><span className="corovoz-settings-label">Ajustes</span></summary>
            <div className="corovoz-settings-body">
              <label>Enviar dictado<select aria-label="Envío del dictado" value={speech.sendMode} onChange={e => speech.setSendMode(e.target.value as 'manual' | 'pause')}><option value="manual">Revisar y pulsar Enviar</option><option value="pause">Al pausar 3,5 segundos</option></select></label>
              <label><input type="checkbox" checked={activationSound} onChange={e => setActivationSound(e.target.checked)} />Sonido al activar el micrófono</label>
              <p>La señal sonora se silencia al desactivar la voz. En modo manual, la pausa deja el dictado listo para revisar.</p>
              {mode === 'odontograma' && <p>Una pieza y condición por vez. Puedes decir «observación», «repetir propuesta», «confirmar», «editar diente», «editar condición», «editar observación», «editar cara», «eliminar» o «eliminar todo». Eliminar afecta solo la propuesta. «Guardar borrador» conserva los cambios.</p>}
            </div>
          </details>
        </div>}
      </section>}
      <div className="corovoz-companion">
        {expanded && mode && <div className="corovoz-controls">
          <div className="corovoz-status" role="status"><span className="corovoz-status-dot" />{status}</div>
          <div className="corovoz-toolbar" role="group" aria-label="Controles de voz">
            <button type="button" className={`corovoz-icon corovoz-mic ${speech.listening ? 'is-active' : ''}`} onClick={() => { clearVisualFeedback(); if (speech.listening) speech.stop(); else void speech.start() }} disabled={!speech.supported || speech.phase === 'PREPARING_MIC' || speech.transcribing || busy || (mode === 'odontograma' && !target?.editable)} title={micLabel} aria-label={micLabel} aria-pressed={speech.listening}><CoroVozIcon name={speech.listening ? 'stop' : 'mic'} /></button>
            <button type="button" className="corovoz-icon" onClick={() => { readAloudRef.current = !readAloud; setReadAloud(!readAloud); if (readAloud) speech.interrupt() }} title={readAloud ? 'Desactivar voz' : 'Activar voz'} aria-label="Leer respuestas" aria-pressed={readAloud}><CoroVozIcon name={readAloud ? 'volume' : 'mute'} /></button>
            {speech.speaking && <button type="button" className="corovoz-icon" onClick={speech.interrupt} title="Interrumpir respuesta" aria-label="Interrumpir respuesta"><CoroVozIcon name="pause" /></button>}
            {speech.enabled && speech.sendMode === 'manual' && <button type="button" className="corovoz-icon" onClick={() => void speech.finish()} disabled={busy || !speech.listening} title="Terminé: enviar dictado" aria-label="Terminé: enviar"><CoroVozIcon name="send" /></button>}
          </div>
          {speech.listening && <div role="meter" aria-label="Nivel del micrófono" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(speech.level * 100)} className="corovoz-meter"><span style={{ width: `${Math.round(speech.level * 100)}%` }} /></div>}
          {!speech.supported && <p className="corovoz-hint">Usa HTTPS o localhost para hablar.</p>}
          {speech.enabled && speech.sendMode === 'pause' && awaitingDentalReply && <p className="corovoz-hint">Seguimos por voz al terminar la respuesta.</p>}
        </div>}
        <button type="button" className="corovoz-mascot" onClick={expanded ? minimize : onOpen} aria-label={expanded ? 'Minimizar CoroVoz' : 'Abrir CoroVoz'} aria-expanded={expanded} title={expanded ? 'Minimizar CoroVoz' : 'Habla con Coronix'}>
          <CoroVozMascot state={state} />
          {!expanded && <span className="corovoz-launch-label">CoroVoz</span>}
        </button>
      </div>
    </aside>
  )
}
