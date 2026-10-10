import { apiClient } from './apiClient';

export interface DashboardAppointmentItem {
  id: string;
  clinicaId: string;
  clinicaNombre?: string;
  pacienteId: string;
  pacienteNombreCompleto: string;
  pacienteNumeroDocumento?: string;
  pacienteTelefono?: string;
  odontologoId: string;
  odontologoNombreCompleto: string;
  odontologoCorreo?: string;
  inicioEn: string;
  finEn: string;
  modalidad: string;
  estado: string;
  estadoAsistencia?: string;
  motivo?: string;
  consultorio?: string;
}

export interface DashboardSummary {
  totalCitasHoy: number;
  citasConfirmadasHoy: number;
  citasPendientesHoy: number;
  citasAtendidasHoy: number;
  citasCanceladasHoy: number;
  totalPacientes: number;
  fechaHoyLima: string;
  proximaCita: DashboardAppointmentItem | null;
  citasHoy: DashboardAppointmentItem[];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiClient<DashboardSummary>('/dashboard/summary');
}
