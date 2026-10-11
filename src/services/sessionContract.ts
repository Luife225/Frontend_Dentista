export type OperativeRole = 'ODONTOLOGO' | 'RECEPCIONISTA' | 'ADMIN_CLINICA' | 'PACIENTE';
const OPERATIVE_ROLES: readonly string[] = ['ODONTOLOGO', 'RECEPCIONISTA', 'ADMIN_CLINICA', 'PACIENTE'];

interface SessionIdentity {
  id: string;
  usuarioId: string;
  clinicaId?: string | null;
  usuarioClinicaId?: string | null;
  pacienteId?: string | null;
  rol: OperativeRole;
}

export function isOperativeRole(role: unknown): role is OperativeRole {
  return typeof role === 'string' && OPERATIVE_ROLES.includes(role);
}

export function isDecimalId(id?: string | null): boolean {
  return typeof id === 'string' && /^[1-9]\d*$/.test(id);
}

/** Valida identidad y alcance antes de aceptar una respuesta de login o /auth/me. */
export function validateOperativeSession<T extends SessionIdentity>(data: T): T {
  if (!data || !isOperativeRole(data.rol)) {
    throw new Error('La sesión no corresponde a uno de los cuatro roles habilitados');
  }
  if (!isDecimalId(data.id) || !isDecimalId(data.usuarioId) || data.id !== data.usuarioId || !isDecimalId(data.clinicaId)) {
    throw new Error('La sesión no contiene una identidad y clínica válidas');
  }
  if (data.usuarioClinicaId != null && !isDecimalId(data.usuarioClinicaId)) {
    throw new Error('La membresía de la sesión no es válida');
  }
  if (data.rol === 'PACIENTE') {
    if (!isDecimalId(data.pacienteId)) throw new Error('La cuenta necesita un expediente de paciente vinculado');
  } else if (!isDecimalId(data.usuarioClinicaId) || data.pacienteId != null) {
    throw new Error('La sesión del personal no tiene una membresía válida');
  }
  return data;
}
