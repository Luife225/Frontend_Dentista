import { apiClient, ApiError } from './apiClient';

export type ClinicRole = 'ADMIN_CLINICA' | 'ODONTOLOGO' | 'RECEPCIONISTA' | 'PACIENTE';

export interface ClinicUserDto {
  id: string; // usuario_clinica.id
  usuarioId: string; // usuario.id
  correo: string;
  nombres: string;
  apellidos: string;
  nombreCompleto?: string;
  rol: ClinicRole;
  rolNombre?: string;
  estado: 'ACTIVO' | 'INACTIVO';
  clinicaId: string;
  clinicaNombre?: string;
  pacienteId?: string | null;
  fechaAsignacion?: string;
  fechaActualizacion?: string;
}

export interface CreateClinicUserDto {
  correo: string;
  clave: string;
  nombres: string;
  apellidos: string;
  rol: ClinicRole;
  estado?: 'ACTIVO' | 'INACTIVO';
  pacienteId?: string | null;
}

export interface UpdateClinicUserDto {
  nombres?: string;
  apellidos?: string;
  rol?: ClinicRole;
  clave?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}

const DECIMAL_ID_REGEX = /^[1-9]\d*$/;

export function isDecimalId(id?: string | null): boolean {
  return typeof id === 'string' && DECIMAL_ID_REGEX.test(id.trim());
}

function validateClinicUserContract(u: ClinicUserDto): ClinicUserDto {
  if (!u || !u.id || !isDecimalId(u.id)) {
    throw new Error(`Contrato de API inválido: la membresía no contiene un ID decimal string devuelto por el servidor (${u?.id})`);
  }
  if (!u.usuarioId || !isDecimalId(u.usuarioId)) {
    throw new Error(`Contrato de API inválido: el usuarioId (${u?.usuarioId}) no es un ID decimal string válido`);
  }
  if (u.clinicaId && !isDecimalId(u.clinicaId)) {
    throw new Error(`Contrato de API inválido: clinicaId (${u.clinicaId}) no es un ID decimal string válido`);
  }
  if (u.pacienteId && !isDecimalId(u.pacienteId)) {
    throw new Error(`Contrato de API inválido: pacienteId (${u.pacienteId}) no es un ID decimal string válido`);
  }
  return u;
}

/**
 * GET /api/v1/clinic/users
 * Lista todas las cuentas y membresías de la clínica activa (requiere ADMIN_CLINICA)
 */
export async function fetchClinicUsers(): Promise<ClinicUserDto[]> {
  const users = await apiClient<ClinicUserDto[]>('/clinic/users');
  return users.map(validateClinicUserContract);
}

/**
 * GET /api/v1/clinic/users/{id}
 * Detalle de una cuenta y membresía por ID de usuario_clinica
 */
export async function fetchClinicUserById(id: string): Promise<ClinicUserDto> {
  if (!isDecimalId(id)) {
    throw new Error(`ID de membresía inválido: ${id} debe ser una cadena decimal positiva`);
  }
  const user = await apiClient<ClinicUserDto>(`/clinic/users/${id}`);
  return validateClinicUserContract(user);
}

/**
 * POST /api/v1/clinic/users
 * Registra una nueva cuenta de usuario y le asigna membresía en la clínica
 */
export async function createClinicUser(dto: CreateClinicUserDto): Promise<ClinicUserDto> {
  if (dto.pacienteId && !isDecimalId(dto.pacienteId)) {
    throw new Error(`pacienteId inválido: ${dto.pacienteId} debe ser una cadena decimal positiva`);
  }
  const created = await apiClient<ClinicUserDto>('/clinic/users', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  return validateClinicUserContract(created);
}

/**
 * PUT /api/v1/clinic/users/{id}
 * Actualiza datos del usuario, rol, estado o contraseña opcional
 */
export async function updateClinicUser(id: string, dto: UpdateClinicUserDto): Promise<ClinicUserDto> {
  if (!isDecimalId(id)) {
    throw new Error(`ID de membresía inválido: ${id} debe ser una cadena decimal positiva`);
  }
  const updated = await apiClient<ClinicUserDto>(`/clinic/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
  return validateClinicUserContract(updated);
}

/**
 * PATCH /api/v1/clinic/users/{id}/status
 * Activa o desactiva la cuenta/membresía. Desactivar invalida inmediatamente tokens activos.
 */
export async function updateClinicUserStatus(id: string, estado: 'ACTIVO' | 'INACTIVO'): Promise<ClinicUserDto> {
  if (!isDecimalId(id)) {
    throw new Error(`ID de membresía inválido: ${id} debe ser una cadena decimal positiva`);
  }
  const result = await apiClient<ClinicUserDto>(`/clinic/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
  return validateClinicUserContract(result);
}
