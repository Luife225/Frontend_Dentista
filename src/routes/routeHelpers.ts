import type { Role } from '../contexts/AuthContext'

/**
 * Determina la ruta principal o panel de inicio según el rol del usuario.
 * Sigue la estructura de rutas definida en el sistema Coronyx:
 * - SUPER_ADMIN: /app/super-admin
 * - ADMIN_CLINICA: /app/dashboard
 * - ODONTOLOGO: /app/dashboard
 * - RECEPCIONISTA: /app/dashboard
 * - PACIENTE: /app/patient-portal
 */
export const getDefaultRouteForRole = (rol?: Role | string | null): string => {
  switch (rol) {
    case 'SUPER_ADMIN':
      return '/app/super-admin'
    case 'ADMIN_CLINICA':
      return '/app/dashboard'
    case 'ODONTOLOGO':
      return '/app/dashboard'
    case 'RECEPCIONISTA':
      return '/app/dashboard'
    case 'PACIENTE':
      return '/app/patient-portal'
    default:
      return '/login'
  }
}

/**
 * Obtiene la etiqueta descriptiva en español para cada rol.
 */
export const getRoleLabel = (rol?: Role | string | null): string => {
  switch (rol) {
    case 'SUPER_ADMIN':
      return 'Super Administrador'
    case 'ADMIN_CLINICA':
      return 'Administrador de Clínica'
    case 'ODONTOLOGO':
      return 'Odontólogo'
    case 'RECEPCIONISTA':
      return 'Recepcionista'
    case 'PACIENTE':
      return 'Paciente'
    default:
      return 'Sin rol'
  }
}
