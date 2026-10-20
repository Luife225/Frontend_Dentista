import { apiClient } from "./apiClient"

export interface TeleconsultationJoinResponse {
  citaId: string
  salaId: string
  token: string
  jitsiServerUrl: string
  rol: "MODERADOR" | "PARTICIPANTE"
  esModerador: boolean
  nombreParticipante: string
  estado: string
}

export interface TeleconsultationCloseResponse {
  salaId: string
  citaId: string
  estado: string
  mensaje: string
}

export interface TeleconsultationVerificationResponse {
  valido: boolean
  salaId?: string
  rol?: string
  citaId?: string
  participanteId?: string
  expiraEn?: string
  mensaje: string
}

export const joinTeleconsultation = (citaId: string) =>
  apiClient<TeleconsultationJoinResponse>(`/teleconsulta/sesion/${citaId}`, {
    method: "POST",
  })

export const closeTeleconsultation = (citaId: string) =>
  apiClient<TeleconsultationCloseResponse>(`/teleconsulta/sesion/${citaId}/cerrar`, {
    method: "POST",
  })

export const verifyTeleconsultationToken = (citaId: string, token: string) =>
  apiClient<TeleconsultationVerificationResponse>(
    `/teleconsulta/sesion/${citaId}/verificar?token=${encodeURIComponent(token)}`,
  )
