export interface LoginResponse {
  id: string;
  correo: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  rol: 'SUPER_ADMIN' | 'ODONTOLOGO' | 'RECEPCIONISTA' | 'ADMIN_CLINICA' | 'PACIENTE';
  clinicaId?: string;
  clinicaNombre?: string;
}

export interface UserItem {
  id: string;
  correo: string;
  nombres: string;
  apellidos: string;
  rol: string;
  clinicaNombre?: string;
  estado: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1';

export async function loginWithApi(correo: string, clave: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ correo, clave }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = 'Error al iniciar sesión';
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || message;
    } catch {
      message = errorText || message;
    }
    throw new Error(message);
  }

  return response.json();
}

export async function fetchUsersFromApi(): Promise<UserItem[]> {
  const response = await fetch(`${API_BASE_URL}/auth/users`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener lista de usuarios');
  }

  return response.json();
}
