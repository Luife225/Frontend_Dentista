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
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1';

/** GET /api/v1/patients — Lista todos los pacientes de la clínica */
export async function fetchPatientsFromApi(): Promise<BackendPatientDto[]> {
  const response = await fetch(`${API_BASE_URL}/patients`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
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
    headers: { 'Accept': 'application/json' },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Paciente no encontrado (${response.status}): ${errorText || response.statusText}`);
  }
  return response.json();
}

/** POST /api/v1/patients — Registra un nuevo paciente */
export async function createPatientInApi(patient: Partial<BackendPatientDto>): Promise<BackendPatientDto> {
  const response = await fetch(`${API_BASE_URL}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(patient),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al registrar paciente (${response.status}): ${errorText || response.statusText}`);
  }
  return response.json();
}

/** PUT /api/v1/patients/{id} — Actualiza datos de la ficha del paciente */
export async function updatePatientInApi(
  id: string,
  updates: Partial<BackendPatientDto>
): Promise<BackendPatientDto> {
  const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al actualizar paciente (${response.status}): ${errorText || response.statusText}`);
  }
  return response.json();
}

/** PATCH /api/v1/patients/{id}/archive — Baja lógica: cambia estado a ARCHIVADO */
export async function archivePatientInApi(id: string): Promise<BackendPatientDto> {
  const response = await fetch(`${API_BASE_URL}/patients/${id}/archive`, {
    method: 'PATCH',
    headers: { 'Accept': 'application/json' },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al archivar paciente (${response.status}): ${errorText || response.statusText}`);
  }
  return response.json();
}
