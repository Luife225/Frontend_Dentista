// src/types/clinicalEncounter.ts
// Tipos oficiales para el dominio de Atenciones Clínicas e Historias Médicas Versionadas (F05)

export interface SignosVitales {
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  temp?: number;
  weight?: number;
  height?: number;
  spo2?: number;
}

export interface ClinicalVersionDto {
  id: string; // Decimal string
  clinicaId: string;
  atencionClinicaId: string;
  versionAnteriorId?: string | null;
  firmadoPorId?: string | null;
  firmadoPorNombre?: string | null;
  numeroVersion: number;
  motivoConsulta?: string;
  examenClinico?: string;
  diagnostico?: string;
  procedimientos?: string;
  planTratamiento?: string;
  recetasPrescripciones?: string;
  indicaciones?: string;
  evolucion?: string;
  proximaCitaSugerida?: string;
  signosVitales?: string; // JSON string con SignosVitales
  textoPendienteRevision?: string;
  estaConfirmado: boolean;
  fechaRegistro: string; // ISO 8601
  fechaConfirmacion?: string | null;
}

export interface ClinicalEncounterDto {
  id: string; // Decimal string
  clinicaId: string;
  pacienteId: string;
  pacienteNombreCompleto: string;
  pacienteNumeroDocumento?: string;
  citaId?: string | null;
  odontologoId: string;
  odontologoNombreCompleto: string;
  estado: 'BORRADOR' | 'CONFIRMADO';
  fechaCreacion: string;
  fechaConfirmacion?: string | null;
  versionActual?: ClinicalVersionDto;
  totalVersiones: number;
  versiones: ClinicalVersionDto[];
}

export interface CreateClinicalEncounterPayload {
  pacienteId: string;
  citaId?: string;
  motivoConsulta?: string;
  examenClinico?: string;
  diagnostico?: string;
  procedimientos?: string;
  planTratamiento?: string;
  recetasPrescripciones?: string;
  indicaciones?: string;
  evolucion?: string;
  proximaCitaSugerida?: string;
  signosVitales?: string;
  textoPendienteRevision?: string;
}

export interface UpdateClinicalDraftPayload {
  motivoConsulta?: string;
  examenClinico?: string;
  diagnostico?: string;
  procedimientos?: string;
  planTratamiento?: string;
  recetasPrescripciones?: string;
  indicaciones?: string;
  evolucion?: string;
  proximaCitaSugerida?: string;
  signosVitales?: string;
  textoPendienteRevision?: string;
}

export interface CreateCorrectionVersionPayload {
  motivoConsulta?: string;
  examenClinico?: string;
  diagnostico?: string;
  procedimientos?: string;
  planTratamiento?: string;
  recetasPrescripciones?: string;
  indicaciones?: string;
  evolucion?: string;
  proximaCitaSugerida?: string;
  signosVitales?: string;
  textoPendienteRevision?: string;
  confirmarInmediatamente?: boolean;
}

export interface ConfirmVersionPayload {
  versionId?: string;
  numeroVersion?: number;
}
