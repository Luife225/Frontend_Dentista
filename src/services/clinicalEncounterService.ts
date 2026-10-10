// src/services/clinicalEncounterService.ts
// Servicio para atención clínica manual, borrador y versiones inmutables (F05)

import { API_BASE_URL, getAuthHeaders, ApiError } from './apiClient';
import type {
  ClinicalEncounterDto,
  ClinicalVersionDto,
  CreateClinicalEncounterPayload,
  UpdateClinicalDraftPayload,
  CreateCorrectionVersionPayload,
  ConfirmVersionPayload,
} from '../types/clinicalEncounter';

const DECIMAL_ID_REGEX = /^[1-9]\d*$/;

export function isDecimalId(id?: string | null): boolean {
  return typeof id === 'string' && DECIMAL_ID_REGEX.test(id.trim());
}

function normalizeVersion(v: any): ClinicalVersionDto {
  return {
    ...v,
    id: String(v.id),
    clinicaId: String(v.clinicaId),
    atencionClinicaId: String(v.atencionClinicaId),
    versionAnteriorId: v.versionAnteriorId ? String(v.versionAnteriorId) : null,
    firmadoPorId: v.firmadoPorId ? String(v.firmadoPorId) : null,
    firmadoPorNombre: v.firmadoPorNombre || null,
    numeroVersion: Number(v.numeroVersion || 1),
    estaConfirmado: Boolean(v.estaConfirmado),
    fechaRegistro: v.fechaRegistro,
    fechaConfirmacion: v.fechaConfirmacion || null,
  };
}

function normalizeEncounter(e: any): ClinicalEncounterDto {
  const versiones = (e.versiones || []).map(normalizeVersion);
  return {
    ...e,
    id: String(e.id),
    clinicaId: String(e.clinicaId),
    pacienteId: String(e.pacienteId),
    citaId: e.citaId ? String(e.citaId) : null,
    odontologoId: String(e.odontologoId),
    odontologoNombreCompleto: e.odontologoNombreCompleto || 'Odontólogo Asignado',
    estado: e.estado === 'CONFIRMADO' ? 'CONFIRMADO' : 'BORRADOR',
    fechaCreacion: e.fechaCreacion,
    fechaConfirmacion: e.fechaConfirmacion || null,
    totalVersiones: Number(e.totalVersiones || versiones.length),
    versiones,
    versionActual: e.versionActual ? normalizeVersion(e.versionActual) : (versiones.length > 0 ? versiones[versiones.length - 1] : undefined),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  let body: any = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      body = await res.json();
    } catch {
      body = null;
    }
  } else {
    try {
      body = await res.text();
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    const errorMsg =
      body?.message ||
      body?.error ||
      `Error HTTP ${res.status}: ${res.statusText || 'Petición fallida'}`;
    throw new ApiError(res.status, errorMsg, body);
  }

  return body as T;
}

/**
 * GET /api/v1/clinical-encounters/paciente/{pacienteId}
 * Historial de atenciones clínicas de un paciente (Exclusivo ODONTOLOGO)
 */
export async function getEncountersByPatient(pacienteId: string): Promise<ClinicalEncounterDto[]> {
  if (!isDecimalId(pacienteId)) {
    throw new ApiError(400, `ID de paciente inválido: debe ser decimal string`);
  }

  const url = `${API_BASE_URL}/clinical-encounters/paciente/${encodeURIComponent(pacienteId)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const list = await handleResponse<any[]>(res);
  return (list || []).map(normalizeEncounter);
}

/**
 * GET /api/v1/clinical-encounters/{id}
 * Ficha detallada de una atención clínica con su versión activa
 */
export async function getEncounterById(id: string): Promise<ClinicalEncounterDto> {
  if (!isDecimalId(id)) {
    throw new ApiError(400, `ID de atención inválido: debe ser decimal string`);
  }

  const url = `${API_BASE_URL}/clinical-encounters/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const raw = await handleResponse<any>(res);
  return normalizeEncounter(raw);
}

/**
 * GET /api/v1/clinical-encounters/{id}/versions
 * Auditoría histórica de todas las versiones de una atención clínica
 */
export async function getEncounterVersions(id: string): Promise<ClinicalVersionDto[]> {
  if (!isDecimalId(id)) {
    throw new ApiError(400, `ID de atención inválido: debe ser decimal string`);
  }

  const url = `${API_BASE_URL}/clinical-encounters/${encodeURIComponent(id)}/versions`;
  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const rawList = await handleResponse<any[]>(res);
  return (rawList || []).map(normalizeVersion);
}

/**
 * POST /api/v1/clinical-encounters
 * Abre una atención clínica en estado BORRADOR con su versión 1
 */
export async function createDraftEncounter(
  payload: CreateClinicalEncounterPayload
): Promise<ClinicalEncounterDto> {
  if (!isDecimalId(payload.pacienteId)) {
    throw new ApiError(400, `ID de paciente inválido para crear atención`);
  }

  const url = `${API_BASE_URL}/clinical-encounters`;
  const res = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      ...payload,
      pacienteId: Number(payload.pacienteId),
      citaId: payload.citaId ? Number(payload.citaId) : undefined,
    }),
  });

  const raw = await handleResponse<any>(res);
  return normalizeEncounter(raw);
}

/**
 * PUT /api/v1/clinical-encounters/{id}/draft
 * Actualiza los campos manuales de un borrador no confirmado
 */
export async function updateDraftEncounter(
  id: string,
  payload: UpdateClinicalDraftPayload
): Promise<ClinicalEncounterDto> {
  if (!isDecimalId(id)) {
    throw new ApiError(400, `ID de atención inválido`);
  }

  const url = `${API_BASE_URL}/clinical-encounters/${encodeURIComponent(id)}/draft`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });

  const raw = await handleResponse<any>(res);
  return normalizeEncounter(raw);
}

/**
 * POST /api/v1/clinical-encounters/{id}/confirm
 * Confirma e inmutabiliza la versión exacta (Idempotente frente a reintentos)
 */
export async function confirmEncounterVersion(
  id: string,
  payload?: ConfirmVersionPayload
): Promise<ClinicalEncounterDto> {
  if (!isDecimalId(id)) {
    throw new ApiError(400, `ID de atención inválido`);
  }

  const bodyData: any = {};
  if (payload?.versionId) bodyData.versionId = Number(payload.versionId);
  if (payload?.numeroVersion) bodyData.numeroVersion = Number(payload.numeroVersion);

  const url = `${API_BASE_URL}/clinical-encounters/${encodeURIComponent(id)}/confirm`;
  const res = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(bodyData),
  });

  const raw = await handleResponse<any>(res);
  return normalizeEncounter(raw);
}

/**
 * POST /api/v1/clinical-encounters/{id}/versions
 * Crea una nueva versión de corrección inmutable vinculada a la anterior
 */
export async function createCorrectionVersion(
  id: string,
  payload: CreateCorrectionVersionPayload
): Promise<ClinicalEncounterDto> {
  if (!isDecimalId(id)) {
    throw new ApiError(400, `ID de atención inválido`);
  }

  const url = `${API_BASE_URL}/clinical-encounters/${encodeURIComponent(id)}/versions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });

  const raw = await handleResponse<any>(res);
  return normalizeEncounter(raw);
}
