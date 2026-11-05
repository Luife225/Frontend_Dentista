import { apiClient } from "./apiClient"

export interface HorarioAtencionDto {
  id?: string
  clinicaId?: string
  odontologoId?: string | null

  diaSemana: number
  horaApertura: string
  horaCierre: string

  activo?: boolean
  duracionTurnoMinutos?: number
}

export interface AusenciaDto {
  id?: string
  clinicaId?: string
  odontologoId: string
  odontologoNombre?: string

  inicioEn: string
  finEn: string
  motivo?: string
  tipo?: string
}

export interface SlotDto {
  inicio: string
  fin: string
  disponible: boolean
  motivoNoDisponible?: string | null
}

export function getClinicSchedule(
  clinicaId?: string,
): Promise<HorarioAtencionDto[]> {
  return apiClient(
    `/disponibilidad/horarios${
      clinicaId ? `?clinicaId=${encodeURIComponent(clinicaId)}` : ""
    }`,
  )
}

export function updateClinicSchedule(
  horarios: HorarioAtencionDto[],
  clinicaId?: string,
): Promise<HorarioAtencionDto[]> {
  return apiClient(
    `/disponibilidad/horarios${
      clinicaId ? `?clinicaId=${encodeURIComponent(clinicaId)}` : ""
    }`,
    {
      method: "PUT",
      body: JSON.stringify(horarios),
    },
  )
}

export function fetchAvailableSlots(
  odontologoId: string,
  fecha: string,
): Promise<SlotDto[]> {
  return apiClient(
    `/disponibilidad/slots?${new URLSearchParams({ odontologoId, fecha })}`,
  )
}

export function getDoctorAbsences(
  odontologoId: string,
): Promise<AusenciaDto[]> {
  return apiClient(
    `/disponibilidad/ausencias/${encodeURIComponent(odontologoId)}`,
  )
}

export function createDoctorAbsence(
  odontologoId: string,
  dto: Omit<AusenciaDto, "odontologoId">,
): Promise<AusenciaDto> {
  return apiClient(
    `/disponibilidad/ausencias/${encodeURIComponent(odontologoId)}`,
    { method: "POST", body: JSON.stringify({ ...dto, odontologoId }) },
  )
}

export async function deleteDoctorAbsence(ausenciaId: string): Promise<void> {
  await apiClient(
    `/disponibilidad/ausencias/${encodeURIComponent(ausenciaId)}`,
    { method: "DELETE" },
  )
}
