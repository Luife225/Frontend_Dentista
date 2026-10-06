export interface BackendPatientDto {
  id?: string;
  clinicaId?: string;
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  const token = typeof window !== 'undefined' ? localStorage.getItem('coronyx_jwt_token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/** GET /api/v1/patients — Lista todos los pacientes de la clínica */
export async function fetchPatientsFromApi(): Promise<BackendPatientDto[]> {
  const response = await fetch(`${API_BASE_URL}/patients`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Error al obtener pacientes: ${response.statusText}`);
  }
  return response.json();
}

/** GET /api/v1/patients/{id} — Ficha completa de un paciente por UUID */
export async function fetchPatientById(id: string): Promise<BackendPatientDto> {
  const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Paciente no encontrado (${response.status}): ${errorText || response.statusText}`);
  }
  return response.json();
}

/** POST /api/v1/patients — Registra un nuevo paciente */
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

  return response.json();
}

/** PUT /api/v1/patients/{id} — Actualiza datos de la ficha del paciente */
export async function updatePatientInApi(
  id: string,
  updates: Partial<BackendPatientDto>
): Promise<BackendPatientDto> {
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

  return response.json();
}

/** PATCH /api/v1/patients/{id}/archive — Baja lógica: cambia estado a ARCHIVADO */
export async function archivePatientInApi(id: string): Promise<BackendPatientDto> {
  const response = await fetch(`${API_BASE_URL}/patients/${id}/archive`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al archivar paciente (${response.status}): ${errorText || response.statusText}`);
  }
  return response.json();
}
