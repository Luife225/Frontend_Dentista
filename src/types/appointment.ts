export interface Appointment {
  id: string; // ID decimal string (BIGINT en backend)
  clinicaId: string; // ID decimal string
  clinicaNombre?: string;
  pacienteId: string; // ID decimal string
  pacienteNombreCompleto: string;
  pacienteNumeroDocumento: string;
  pacienteTelefono?: string;
  odontologoId: string; // ID decimal string: corresponde a usuario_clinica.id (usuarioClinicaId)
  odontologoNombreCompleto: string;
  odontologoCorreo?: string;
  creadoPorId?: string; // ID decimal string
  creadoPorNombreCompleto?: string;
  inicioEn: string; // ISO 8601
  finEn: string;    // ISO 8601
  modalidad: 'PRESENCIAL' | 'VIRTUAL';
  estado: 'PROGRAMADA' | 'CONFIRMADA' | 'EN_ATENCION' | 'FINALIZADA' | 'REPROGRAMADA' | 'CANCELADA' | 'NO_ASISTIO';
  estadoAsistencia?: 'ASISTIO' | 'NO_SHOW' | null;
  motivo?: string;
  consultorio?: string;
  enlaceTeleconsulta?: string;
  fechaCreacion: string;
}

export interface CreateAppointmentPayload {
  pacienteId: string; // ID decimal string
  odontologoId: string; // ID decimal string: usuarioClinicaId (usuario_clinica.id)
  clinicaId?: string; // ID decimal string opcional
  creadoPorId?: string; // ID decimal string opcional
  inicioEn: string;
  finEn: string;
  modalidad: 'PRESENCIAL' | 'VIRTUAL';
  motivo?: string;
  consultorio?: string;
  enlaceTeleconsulta?: string;
}

export interface PatientAppointmentRequestPayload {
  odontologoId: string;
  inicioEn: string;
  finEn: string;
  modalidad?: 'PRESENCIAL' | 'VIRTUAL';
  motivo?: string;
  consultorio?: string;
  enlaceTeleconsulta?: string;
}

export interface SolicitudReprogramacion {
  id: string;
  citaId: string;
  solicitanteUsuarioId?: string;
  solicitanteNombreCompleto?: string;
  pacienteId?: string;
  pacienteNombreCompleto?: string;
  odontologoId?: string;
  odontologoNombreCompleto?: string;
  fechaActualCitaInicio?: string;
  fechaActualCitaFin?: string;
  nuevaFechaHoraInicio: string;
  nuevaFechaHoraFin: string;
  nuevoInicioDeseado?: string;
  nuevoFinDeseado?: string;
  motivo?: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';
  resolucionUsuarioId?: string;
  resolucionUsuarioNombre?: string;
  resueltoPorId?: string;
  resueltoPorNombre?: string;
  resolucionMotivo?: string;
  resolucionNota?: string;
  fechaSolicitud: string;
  fechaResolucion?: string;
}

export interface CreateSolicitudPayload {
  nuevaFechaHoraInicio: string;
  nuevaFechaHoraFin: string;
  motivo: string;
  citaId?: string;
  nuevoInicioDeseado?: string;
  nuevoFinDeseado?: string;
}

export interface ResolveSolicitudPayload {
  estado: 'APROBADA' | 'RECHAZADA';
  motivoResolucion?: string;
  resolucionNota?: string;
}
