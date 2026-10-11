/**
 * Cliente HTTP centralizado para Coronyx Dental
 * Gestiona cabeceras Bearer, intercepción de errores 401 RFC-7807,
 * e invalidación automática de sesiones expiradas o manipuladas.
 */

export const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8081/api/v1';

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/** Obtiene el token JWT actual desde el almacenamiento local */
export function getJwtToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('coronyx_jwt_token');
}

/** Almacena el token JWT de la sesión validada */
export function setJwtToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('coronyx_jwt_token', token);
  }
}

/** Limpia las credenciales y el estado local de sesión */
export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('coronyx_jwt_token');
  localStorage.removeItem('coronyx_user');
  localStorage.removeItem('coronyx_role');
  sessionStorage.removeItem('coronyx_session_active');
}

/** Emite evento global de sesión expirada para que AuthContext reaccione */
export function triggerUnauthorized(): void {
  clearAuthStorage();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('coronyx:unauthorized'));
  }
}

/** Construye cabeceras HTTP incluyendo Authorization: Bearer <token> si existe */
export function getAuthHeaders(customHeaders: Record<string, string> = {}): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...customHeaders,
  };

  const token = getJwtToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Realiza una petición fetch centralizada con autenticación Bearer y manejo de 401.
 */
export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const headers = getAuthHeaders((options.headers as Record<string, string>) || {});
  
  // Si el body es FormData, remover Content-Type para que el navegador genere boundary multipart automáticamente
  if (options.body && options.body instanceof FormData) {
    delete (headers as Record<string, string>)['Content-Type'];
  } else if (options.body && !(headers as Record<string, string>)['Content-Type']) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new ApiError(0, `No se pudo conectar con el servidor backend (${API_BASE_URL}). Verifique su conexión y que el servicio esté activo.`);
  }

  // Intercepción centralizada de 401: token inválido, expirado o usuario deshabilitado en BD
  if (response.status === 401) {
    // Credenciales rechazadas al entrar deben mostrarse en el formulario.
    // Un 401 de una operación autenticada sí revoca la sesión local.
    const isLoginRequest = options.method?.toUpperCase() === 'POST' && url.split('?')[0].endsWith('/auth/login');
    if (!isLoginRequest) triggerUnauthorized();
    let errMessage = 'Sesión expirada o credenciales no autorizadas (401)';
    try {
      const errJson = await response.json();
      errMessage = errJson.message || errJson.detail || errJson.error || errMessage;
    } catch {
      // Ignorar fallo de parseo
    }
    throw new ApiError(401, errMessage);
  }

  if (!response.ok) {
    let errorData: any = null;
    let message = `Error del servidor (${response.status}: ${response.statusText})`;
    try {
      const text = await response.text();
      try {
        errorData = JSON.parse(text);
        message = errorData.message || errorData.error || message;
      } catch {
        message = text || message;
      }
    } catch {
      // Usar mensaje por defecto
    }
    throw new ApiError(response.status, message, errorData);
  }

  // Si la respuesta no tiene contenido (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  try {
    return await response.json();
  } catch {
    return {} as T;
  }
}
