export interface BackendPatientDto {
  id?: string;
  clinicaId?: string;
  usuarioId?: string | null;
  nombres: string;
  apellidos: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  fechaNacimiento?: string;
  telefono?: string;
  correo?: string;
  estado?: string;
  alergias?: string;
  antecedentesMedicos?: string;
  medicamentos?: string;
  ciudad?: string;
  tipoSangre?: string;
  tipo_sangre?: string;
  seguro?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface ApiFieldErrorMap {
  [field: string]: string;
}

export class ApiValidationError extends Error {
  status: number;
  errors?: ApiFieldErrorMap;
  response?: {
    status: number;
    data: {
      message?: string;
      errors?: ApiFieldErrorMap;
    };
  };

  constructor(status: number, message: string, errors?: ApiFieldErrorMap) {
    super(message);
    this.name = 'ApiValidationError';
    this.status = status;
    this.errors = errors;
    this.response = {
      status,
      data: {
        message,
        errors,
      },
    };
  }
}

import { apiClient, getAuthHeaders, API_BASE_URL } from './apiClient';

const DECIMAL_ID_REGEX = /^[1-9]\d*$/;

export function isDecimalId(id?: string | null): boolean {
  return typeof id === 'string' && DECIMAL_ID_REGEX.test(id.trim());
}

function validatePatientContract(patient: BackendPatientDto): BackendPatientDto {
  if (!patient || !patient.id || !isDecimalId(patient.id)) {
    throw new Error(`Contrato de API inválido: el paciente no contiene un ID decimal string devuelto por el servidor (${patient?.id})`);
  }
  if (patient.clinicaId && !isDecimalId(patient.clinicaId)) {
    throw new Error(`Contrato de API inválido: clinicaId (${patient.clinicaId}) no es un ID decimal string válido`);
  }
  if (patient.usuarioId && !isDecimalId(patient.usuarioId)) {
    throw new Error(`Contrato de API inválido: usuarioId (${patient.usuarioId}) no es un ID decimal string válido`);
  }
  return patient;
}

/** GET /api/v1/patients — Lista pacientes de la clínica (filtrado por rol en backend) */
export async function fetchPatientsFromApi(): Promise<BackendPatientDto[]> {
  const response = await fetch(`${API_BASE_URL}/patients`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Error al obtener pacientes: ${response.statusText}`);
  }
  const list: BackendPatientDto[] = await response.json();
  return list.map(validatePatientContract);
}

/** GET /api/v1/patients/admin — Proyección estrictamente administrativa de pacientes para ADMIN_CLINICA y RECEPCIONISTA */
export async function fetchAdministrativePatientsFromApi(): Promise<BackendPatientDto[]> {
  const response = await fetch(`${API_BASE_URL}/patients/admin`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Error al obtener proyección administrativa: ${response.statusText}`);
  }
  const list: BackendPatientDto[] = await response.json();
  return list.map(validatePatientContract);
}

/** GET /api/v1/patients/{id} — Ficha completa o administrativa de un paciente por ID decimal string */
export async function fetchPatientById(id: string): Promise<BackendPatientDto> {
  if (!isDecimalId(id)) {
    throw new Error(`Contrato de API inválido: el ID de paciente (${id}) debe ser una cadena decimal positiva`);
  }

  const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Paciente no encontrado (${response.status}): ${errorText || response.statusText}`);
  }
  const data: BackendPatientDto = await response.json();
  return validatePatientContract(data);
}

/** POST /api/v1/patients — Registra un nuevo paciente (ID devuelto por la API) */
export async function createPatientInApi(patient: Partial<BackendPatientDto>): Promise<BackendPatientDto> {
  const payload = {
    ...patient,
    tipoSangre: patient.tipoSangre || patient.tipo_sangre || 'POR DETERMINAR',
    tipo_sangre: patient.tipo_sangre || patient.tipoSangre || 'POR DETERMINAR',
  };

  const response = await fetch(`${API_BASE_URL}/patients`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = `Error al registrar paciente (${response.status})`;
    let fieldErrors: ApiFieldErrorMap | undefined = undefined;

    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || message;
      if (parsed.errors && typeof parsed.errors === 'object') {
        fieldErrors = parsed.errors;
      }
    } catch {
      message = errorText || message;
    }

    throw new ApiValidationError(response.status, message, fieldErrors);
  }

  const created: BackendPatientDto = await response.json();
  return validatePatientContract(created);
}

/** PUT /api/v1/patients/{id} — Actualiza datos de la ficha del paciente */
export async function updatePatientInApi(
  id: string,
  updates: Partial<BackendPatientDto>
): Promise<BackendPatientDto> {
  if (!isDecimalId(id)) {
    throw new Error(`Contrato de API inválido: el ID de paciente (${id}) debe ser una cadena decimal positiva`);
  }

  const payload = {
    ...updates,
    ...(updates.tipoSangre || updates.tipo_sangre ? {
      tipoSangre: updates.tipoSangre || updates.tipo_sangre,
      tipo_sangre: updates.tipo_sangre || updates.tipoSangre,
    } : {}),
  };

  const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = `Error al actualizar paciente (${response.status})`;
    let fieldErrors: ApiFieldErrorMap | undefined = undefined;

    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || message;
      if (parsed.errors && typeof parsed.errors === 'object') {
        fieldErrors = parsed.errors;
      }
    } catch {
      message = errorText || message;
    }

    throw new ApiValidationError(response.status, message, fieldErrors);
  }

  const updated: BackendPatientDto = await response.json();
  return validatePatientContract(updated);
}

/** PATCH /api/v1/patients/{id}/archive — Baja lógica: cambia estado a ARCHIVADO */
export async function archivePatientInApi(id: string): Promise<BackendPatientDto> {
  if (!isDecimalId(id)) {
    throw new Error(`Contrato de API inválido: el ID de paciente (${id}) debe ser una cadena decimal positiva`);
  }

  const response = await fetch(`${API_BASE_URL}/patients/${id}/archive`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al archivar paciente (${response.status}): ${errorText || response.statusText}`);
  }
  const archived: BackendPatientDto = await response.json();
  return validatePatientContract(archived);
}

/** PATCH /api/v1/patients/{id}/link-user — Vincula o desvincula cuenta de usuario a paciente sin equiparar paciente.id a usuario.id */
export async function linkPatientUserAccount(id: string, usuarioId: string | null): Promise<BackendPatientDto> {
  if (!isDecimalId(id)) {
    throw new Error(`Contrato de API inválido: el ID de paciente (${id}) debe ser una cadena decimal positiva`);
  }
  if (usuarioId && !isDecimalId(usuarioId)) {
    throw new Error(`Contrato de API inválido: el ID de usuario (${usuarioId}) debe ser una cadena decimal positiva`);
  }

  const linked = await apiClient<BackendPatientDto>(`/patients/${id}/link-user`, {
    method: 'PATCH',
    body: JSON.stringify({ usuarioId: usuarioId || null }),
  });
  return validatePatientContract(linked);
}

export interface UpdateMyProfilePayload {
  telefono?: string;
  ciudad?: string;
  direccion?: string;
}

/** GET /api/v1/patients/me - Obtiene la ficha de paciente propia del usuario autenticado */
export async function fetchMyPatientProfile(): Promise<BackendPatientDto> {
  const response = await fetch(`${API_BASE_URL}/patients/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = `Error al consultar perfil propio (${response.status})`;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || message;
    } catch {
      message = errorText || message;
    }
    throw new Error(message);
  }

  const data: BackendPatientDto = await response.json();
  return validatePatientContract(data);
}

/** PUT /api/v1/patients/me - Actualiza campos administrativos propios del paciente sin alterar campos clínicos */
export async function updateMyPatientProfile(payload: UpdateMyProfilePayload): Promise<BackendPatientDto> {
  const response = await fetch(`${API_BASE_URL}/patients/me`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = `Error al actualizar perfil (${response.status})`;
    let fieldErrors: ApiFieldErrorMap | undefined;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || message;
      if (parsed.errors && typeof parsed.errors === 'object') {
        fieldErrors = parsed.errors;
      }
    } catch {
      message = errorText || message;
    }
    throw new ApiValidationError(response.status, message, fieldErrors);
  }

  const updated: BackendPatientDto = await response.json();
  return validatePatientContract(updated);
}

