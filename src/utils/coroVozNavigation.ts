import type { Role } from '../contexts/AuthContext'
import { canOpenModuleRoute, permittedPatientTab, type PatientTab } from '../routes/moduleAccess'
import type { CoroVozAnswer } from '../services/coroVozService'

const tabByIntent: Record<string, PatientTab> = {
  ODONTOGRAMA: 'odontograma',
  ODONTOGRAMA_GUARDAR: 'odontograma',
  ODONTOGRAMA_CARAS: 'odontograma',
  HISTORIA: 'historia',
  HISTORIA_VERSION: 'historia',
  RADIOGRAFIAS: 'radiografias',
  DOCUMENTOS: 'documentos',
  DOCUMENTO_VISIBILIDAD: 'documentos',
}

export function coroVozDestination(role: Role | null, answer: CoroVozAnswer | null, selectedPatient: string | null) {
  if (!answer || answer.appointmentDraft || !canOpenModuleRoute(role, answer.route)) return null
  if (answer.route !== '/app/pacientes') return answer.route

  const tab = tabByIntent[answer.intent]
  if (tab && !permittedPatientTab(role, tab)) return null
  const patientId = answer.patientId || (tab ? selectedPatient : null)
  if (!patientId || !/^[1-9]\d*$/.test(patientId)) return answer.route
  const params = new URLSearchParams({ pacienteId: patientId, tab: tab || 'resumen' })
  return `${answer.route}?${params}`
}
