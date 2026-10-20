import type { Appointment } from "../types/appointment"

export const appointmentStateLabels: Record<Appointment["estado"], string> = {
  PROGRAMADA: "Programada",
  CONFIRMADA: "Confirmada",
  REPROGRAMADA: "Reprogramada",
  EN_ATENCION: "En atención",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
  NO_ASISTIO: "No asistió",
}
export function isUpcomingAppointment(
  a: Appointment,
  now = Date.now(),
): boolean {
  return (
    ["PROGRAMADA", "CONFIRMADA", "REPROGRAMADA", "EN_ATENCION"].includes(
      a.estado,
    ) && new Date(a.finEn).getTime() >= now
  )
}
