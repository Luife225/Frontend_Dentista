export interface Appointment {
  id: string;
  clinicaId: string;
  clinicaNombre?: string;
  pacienteId: string;
  pacienteNombreCompleto: string;
  pacienteNumeroDocumento: string;
  pacienteTelefono?: string;
  odontologoId: string;
  odontologoNombreCompleto: string;
  odontologoCorreo?: string;
  creadoPorId?: string;
  creadoPorNombreCompleto?: string;
  inicioEn: string; // ISO 8601
  finEn: string;    // ISO 8601
  modalidad: 'PRESENCIAL' | 'VIRTUAL';
  estado: 'PROGRAMADA' | 'CONFIRMADA' | 'EN_ATENCION' | 'FINALIZADA' | 'CANCELADA';
  estadoAsistencia?: 'ASISTIO' | 'NO_SHOW';
  motivo?: string;
  consultorio?: string;
  enlaceTeleconsulta?: string;
  fechaCreacion: string;
}

export interface CreateAppointmentPayload {
  pacienteId: string;
  odontologoId: string;
  clinicaId?: string;
  inicioEn: string;
  finEn: string;
  modalidad: 'PRESENCIAL' | 'VIRTUAL';
  motivo?: string;
  consultorio?: string;
}
