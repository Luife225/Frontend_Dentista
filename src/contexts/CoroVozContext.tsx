import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import type { DentalProposal } from '../services/coroVozService'
import type { PatientQuestion } from '../utils/coroVozConversation'
import type { DentalDialog, DentalDraft } from '../utils/coroVozDentalDialog'

interface GeneralMemory {
  patientId: string | null
  patientName: string
  question: PatientQuestion | null
  appointment: string
  turns: { question: string; answer: string }[]
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
  patientName: string
  selectedPiece: number | null
  editable: boolean
  describe: (proposal: DentalProposal) => string
  select: (piece: number) => boolean
  apply: (proposal: DentalProposal) => boolean
  save: () => Promise<boolean>
}

interface CoroVozContextValue {
  target: OdontogramTarget | null
  register: (target: OdontogramTarget) => () => void
  memory: RefObject<GeneralMemory>
  dentalMemory: RefObject<DentalMemory | null>
}

const CoroVozContext = createContext<CoroVozContextValue | null>(null)

export function CoroVozProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<OdontogramTarget | null>(null)
  const currentRef = useRef<OdontogramTarget | null>(null)
  // In-memory only: survives closing the panel; destroyed with the authenticated layout.
  const memory = useRef<GeneralMemory>({ patientId: null, patientName: '', question: null, appointment: '', turns: [] })
  const dentalMemory = useRef<DentalMemory | null>(null)
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
  const value = useMemo(() => ({ target, register, memory, dentalMemory }), [target, register])
  return <CoroVozContext.Provider value={value}>{children}</CoroVozContext.Provider>
}

export function useCoroVoz() {
  const context = useContext(CoroVozContext)
  if (!context) throw new Error('CoroVoz requiere su proveedor')
  return context
}

// El odontograma también puede renderizarse fuera del panel con CoroVoz.
export function useOptionalCoroVoz() { return useContext(CoroVozContext) }
