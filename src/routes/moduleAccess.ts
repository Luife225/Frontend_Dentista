import type { Role } from '../contexts/AuthContext'

export type ModuleId = 'dashboard' | 'agenda' | 'pacientes' | 'teleodontologia' | 'notificaciones' | 'inventario' | 'caja' | 'consultorio'

const staff: Role[] = ['ODONTOLOGO', 'RECEPCIONISTA', 'ADMIN_CLINICA']

export const MODULE_ROLES: Record<ModuleId, Role[]> = {
  dashboard: staff,
  agenda: staff,
  pacientes: staff,
  caja: staff,
  teleodontologia: ['ODONTOLOGO'],
  notificaciones: ['ODONTOLOGO', 'RECEPCIONISTA'],
  inventario: ['RECEPCIONISTA', 'ADMIN_CLINICA'],
  consultorio: ['ADMIN_CLINICA'],
}

export function canOpenModuleRoute(role: Role | null, route: string): boolean {
  return role !== null && Object.entries(MODULE_ROLES).some(
    ([module, roles]) => route === `/app/${module}` && roles.includes(role),
  )
}

export type PatientTab = 'resumen' | 'historia' | 'odontograma' | 'radiografias' | 'documentos'

export function permittedPatientTab(role: Role | null, tab: string | null): PatientTab | undefined {
  if (!role || !MODULE_ROLES.pacientes.includes(role)) return undefined
  if (tab === 'resumen' || tab === 'documentos') return tab
  if (role === 'ODONTOLOGO' && (tab === 'odontograma' || tab === 'historia' || tab === 'radiografias')) return tab
}
