import { apiClient, setJwtToken, getJwtToken, clearAuthStorage, ApiError } from './apiClient';

export interface LoginResponse {
  id: string; // ID decimal string (usuario.id)
  usuarioId: string; // ID decimal string (usuario.id)
  usuarioClinicaId?: string | null; // ID decimal string (usuario_clinica.id)
  clinicaId?: string | null; // ID decimal string (clinica.id)
  pacienteId?: string | null; // ID decimal string (paciente.id si es paciente)
  correo: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  rol: 'SUPER_ADMIN' | 'ODONTOLOGO' | 'RECEPCIONISTA' | 'ADMIN_CLINICA' | 'PACIENTE';
  clinicaNombre?: string;
  token?: string | null;
  tipoToken?: string;
}

export interface UserItem {
  id: string; // ID decimal string (usuario.id)
  usuarioClinicaId?: string; // ID decimal string (usuario_clinica.id)
  correo: string;
  nombres: string;
  apellidos: string;
  rol: string;
  clinicaNombre?: string;
  estado: string;
}

const DECIMAL_ID_REGEX = /^[1-9]\d*$/;

export function isDecimalId(id?: string | null): boolean {
  return typeof id === 'string' && DECIMAL_ID_REGEX.test(id);
}

/**
 * Autenticación real contra PostgreSQL con BCrypt y emisión de JWT.
 * Exige respuesta con IDs decimal string positivos y almacena el token de forma segura.
 */
export async function loginWithApi(correo: string, clave: string): Promise<LoginResponse> {
  const data = await apiClient<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ correo: correo.trim().toLowerCase(), clave }),
  });

  // Validación estricta de contrato F01-A/B
  const rawId = data.id || data.usuarioId;
  if (!rawId || !isDecimalId(rawId)) {
    throw new Error(`Contrato de API inválido: el usuario recibido (${data.correo}) no posee un ID decimal string válido`);
  }
  data.id = String(rawId);
  data.usuarioId = String(rawId);

  if (data.usuarioClinicaId && !isDecimalId(data.usuarioClinicaId)) {
    throw new Error(`Contrato de API inválido: usuarioClinicaId (${data.usuarioClinicaId}) no es un ID decimal string válido`);
  }

  if (data.clinicaId && !isDecimalId(data.clinicaId)) {
    throw new Error(`Contrato de API inválido: clinicaId (${data.clinicaId}) no es un ID decimal string válido`);
  }

  if (data.pacienteId && !isDecimalId(data.pacienteId)) {
    throw new Error(`Contrato de API inválido: pacienteId (${data.pacienteId}) no es un ID decimal string válido`);
  }

  if (data.token) {
    setJwtToken(data.token);
  }

  return data;
}

/**
 * Revalidación en tiempo real de sesión contra el backend (GET /api/v1/auth/me).
 * Consulta en BD el estado activo del usuario, clínica y rol.
 * Si el usuario fue revocado o el token expiró, apiClient arroja 401 e invalida la sesión.
 */
export async function getMeFromApi(): Promise<LoginResponse> {
  const data = await apiClient<LoginResponse>('/auth/me', {
    method: 'GET',
  });

  const rawId = data.id || data.usuarioId;
  if (!rawId || !isDecimalId(rawId)) {
    throw new Error(`Contrato de API inválido: /auth/me no retornó un usuarioId decimal string válido`);
  }
  data.id = String(rawId);
  data.usuarioId = String(rawId);

  if (data.usuarioClinicaId && !isDecimalId(data.usuarioClinicaId)) {
    throw new Error(`Contrato de API inválido: usuarioClinicaId (${data.usuarioClinicaId}) no es decimal string`);
  }

  if (data.clinicaId && !isDecimalId(data.clinicaId)) {
    throw new Error(`Contrato de API inválido: clinicaId (${data.clinicaId}) no es decimal string`);
  }

  // Conservar el token activo en el objeto de sesión
  const currentToken = getJwtToken();
  if (currentToken) {
    data.token = currentToken;
  }

  return data;
}

/**
 * Consulta de directorio de usuarios institucional (GET /api/v1/auth/users).
 * Protegido estrictamente con Bearer y restringido a ADMIN_CLINICA.
 */
export async function fetchUsersFromApi(): Promise<UserItem[]> {
  const list = await apiClient<UserItem[]>('/auth/users', {
    method: 'GET',
  });

  if (!Array.isArray(list)) {
    throw new Error('Respuesta inválida: se esperaba un listado de usuarios');
  }

  for (const user of list) {
    if (!user.id || !isDecimalId(user.id)) {
      throw new Error(`Contrato de API inválido: el usuario ${user.correo} no posee un ID decimal string válido`);
    }
    if (user.usuarioClinicaId && !isDecimalId(user.usuarioClinicaId)) {
      throw new Error(`Contrato de API inválido: usuarioClinicaId (${user.usuarioClinicaId}) no es un ID decimal string válido`);
    }
  }

  return list;
}

export { clearAuthStorage, getJwtToken, ApiError };
