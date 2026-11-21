import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import type { CoroVozAgendaContext, CoroVozAppointmentDraft, DentalProposal } from '../services/coroVozService'
import { updateAppointmentSession } from '../utils/coroVozAppointment'
import type { PatientQuestion } from '../utils/coroVozConversation'
import type { DentalDialog, DentalDraft } from '../utils/coroVozDentalDialog'

interface GeneralMemory {
  patientId: string | null
  patientName: string
  question: PatientQuestion | null
  appointment: string
  turns: { question: string; answer: string }[]
  agendaContext?: CoroVozAgendaContext | null
}

export interface DentalMemory {
  targetKey: string
  piece: number | null
  fragment: string
  pending: { finding: DentalProposal; targetKey: string } | null
  options: { value: string; label: string }[]
  lastPrompt: string
  input: string
  message: string
  dialog?: DentalDialog | null
  draft?: DentalDraft | null
}

export interface OdontogramTarget {
  key: string
  patientId?: string
  patientName: string
  selectedPiece: number | null
  editable: boolean
  describe: (proposal: DentalProposal) => string
  query?: (text: string) => string | null
  select: (piece: number) => boolean
  apply: (proposal: DentalProposal) => boolean
  save: () => Promise<boolean>
}

interface CoroVozContextValue {
  target: OdontogramTarget | null
  register: (target: OdontogramTarget) => () => void
  memory: RefObject<GeneralMemory>
  dentalMemory: RefObject<DentalMemory | null>
  patient: { id: string; name: string } | null
  registerPatient: (patient: { id: string; name: string }) => () => void
  appointmentDraft: CoroVozAppointmentDraft | null
  appointmentRevision: RefObject<number>
  applyAppointment: (draft: unknown, expectedRevision: number) => boolean
  editAppointment: (patch: Partial<CoroVozAppointmentDraft>) => void
  closeAppointment: () => void
}

const CoroVozContext = createContext<CoroVozContextValue | null>(null)

export function CoroVozProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<OdontogramTarget | null>(null)
  const currentRef = useRef<OdontogramTarget | null>(null)
  // In-memory only: survives closing the panel; destroyed with the authenticated layout.
  const memory = useRef<GeneralMemory>({ patientId: null, patientName: '', question: null, appointment: '', turns: [] })
  const dentalMemory = useRef<DentalMemory | null>(null)
  const [patient, setPatient] = useState<{ id: string; name: string } | null>(null)
  const registerPatient = useCallback((next: { id: string; name: string }) => {
    setPatient(next)
    return () => setPatient(current => current === next ? null : current)
  }, [])
  const [appointmentDraft, setAppointmentDraft] = useState<CoroVozAppointmentDraft | null>(null)
  const appointmentRef = useRef<CoroVozAppointmentDraft | null>(null)
  const appointmentRevision = useRef(0)
  const applyAppointment = useCallback((value: unknown, expectedRevision: number) => {
    const current = { draft: appointmentRef.current, revision: appointmentRevision.current }
    const next = updateAppointmentSession(current, { type: 'response', value, expectedRevision })
    if (next === current) return false
    appointmentRevision.current = next.revision
    appointmentRef.current = next.draft
    setAppointmentDraft(appointmentRef.current)
    return true
  }, [])
  const editAppointment = useCallback((patch: Partial<CoroVozAppointmentDraft>) => {
    const next = updateAppointmentSession({ draft: appointmentRef.current, revision: appointmentRevision.current }, { type: 'edit', patch })
    appointmentRevision.current = next.revision
    appointmentRef.current = next.draft
    setAppointmentDraft(appointmentRef.current)
  }, [])
  const closeAppointment = useCallback(() => {
    // Invalidates even a response already in flight, preventing a cancelled form reopening.
    const next = updateAppointmentSession({ draft: appointmentRef.current, revision: appointmentRevision.current }, { type: 'close' })
    appointmentRevision.current = next.revision
    appointmentRef.current = next.draft
    setAppointmentDraft(null)
  }, [])
  const register = useCallback((next: OdontogramTarget) => {
    currentRef.current = next
    setTarget(next)
    return () => {
      if (currentRef.current === next) {
        currentRef.current = null
        setTarget(null)
      }
    }
  }, [])
  const value = useMemo(() => ({ target, register, memory, dentalMemory, patient, registerPatient,
    appointmentDraft, appointmentRevision, applyAppointment, editAppointment, closeAppointment }),
  [target, register, patient, registerPatient, appointmentDraft, applyAppointment, editAppointment, closeAppointment])
  return <CoroVozContext.Provider value={value}>{children}</CoroVozContext.Provider>
}

export function useCoroVoz() {
  const context = useContext(CoroVozContext)
  if (!context) throw new Error('CoroVoz requiere su proveedor')
  return context
}

// El odontograma también puede renderizarse fuera del panel con CoroVoz.
export function useOptionalCoroVoz() { return useContext(CoroVozContext) }
