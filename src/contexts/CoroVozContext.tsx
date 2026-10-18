import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import type { DentalProposal } from '../services/coroVozService'

export interface OdontogramTarget {
  key: string
  patientName: string
  editable: boolean
  describe: (proposal: DentalProposal) => string
  apply: (proposal: DentalProposal) => boolean
  save: () => Promise<boolean>
}

interface CoroVozContextValue {
  target: OdontogramTarget | null
  register: (target: OdontogramTarget) => () => void
}

const CoroVozContext = createContext<CoroVozContextValue | null>(null)

export function CoroVozProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<OdontogramTarget | null>(null)
  const currentRef = useRef<OdontogramTarget | null>(null)
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
  const value = useMemo(() => ({ target, register }), [target, register])
  return <CoroVozContext.Provider value={value}>{children}</CoroVozContext.Provider>
}

export function useCoroVoz() {
  const context = useContext(CoroVozContext)
  if (!context) throw new Error('CoroVoz requiere su proveedor')
  return context
}

// El odontograma también puede renderizarse fuera del panel con CoroVoz.
export function useOptionalCoroVoz() { return useContext(CoroVozContext) }
