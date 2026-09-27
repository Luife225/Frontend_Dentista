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

export async function fetchPatientsFromApi(): Promise<BackendPatientDto[]> {
  const response = await fetch(`${API_BASE_URL}/patients`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Error al obtener pacientes: ${response.statusText}`);
  }

  return response.json();
}

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
