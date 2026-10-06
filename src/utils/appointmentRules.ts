/**
 * Reglas de negocio para citas odontológicas sincronizadas con el Backend (Spring Boot / PostgreSQL)
 *
 * 1. Selector de Fecha:
 *    - min: Fecha de hoy en formato YYYY-MM-DD (bloquear fechas pasadas)
 *    - max: Hoy + 90 días
 *    - Domingo: La clínica permanece cerrada los domingos.
 *
 * 2. Horarios y Slots:
 *    - Lunes a Viernes: 08:00 a 17:15 (citas de 45 min terminan a las 18:00)
 *    - Sábado: 08:00 a 12:15 (citas de 45 min terminan a las 13:00)
 *    - Si es HOY: Deshabilitar / filtrar horarios que ya pasaron en el reloj actual.
 *
 * 3. Cálculo de Hora Fin:
 *    - Inicio + 45 min.
 *    - Validación: No superar 18:00 (Lun-Vie) o 13:00 (Sáb).
 *
 * 4. Sillones / Consultorios:
 *    - 'Sillón 1', 'Sillón 2', 'Box Quirúrgico'
 *
 * 5. Manejo de Errores:
 *    - 409 Conflict: 'Conflicto: El doctor o el sillón seleccionado ya tienen una cita en ese horario.'
 *    - 400 Bad Request: error.response.data.message
 */

export const CONSULTORIOS = [
  'Sillón 1',
  'Sillón 2',
  'Box Quirúrgico',
] as const

export type ConsultorioType = typeof CONSULTORIOS[number]

export interface TimeSlot {
  time: string       // '08:00'
  label: string      // '08:00'
  isPast: boolean    // true si la hora ya pasó en el reloj actual de HOY
  endTime: string    // '08:45'
}

/** Formatea una fecha local a string YYYY-MM-DD evitando el desbalance horario de UTC */
export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Retorna la fecha mínima permitida (HOY en formato YYYY-MM-DD) */
export function getMinDateString(): string {
  return toLocalDateString(new Date())
}

/** Retorna la fecha máxima permitida (HOY + 90 días en formato YYYY-MM-DD) */
export function getMaxDateString(): string {
  const d = new Date()
  d.setDate(d.getDate() + 90)
  return toLocalDateString(d)
}

/** Verifica si la fecha seleccionada corresponde a un Domingo */
export function isSundayDate(dateStr: string): boolean {
  if (!dateStr) return false
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getDay() === 0
}

/** Verifica si la fecha seleccionada corresponde a un Sábado */
export function isSaturdayDate(dateStr: string): boolean {
  if (!dateStr) return false
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getDay() === 6
}

/** Verifica si la fecha corresponde al día de hoy */
export function isTodayDate(dateStr: string): boolean {
  if (!dateStr) return false
  return dateStr === getMinDateString()
}

/**
 * Calcula la hora de fin sumando la duración en minutos (default 45 min)
 * Ej: '10:00' -> '10:45', '17:15' -> '18:00'
 */
export function calculateEndTime(startTime: string, durationMinutes = 45): string {
  if (!startTime) return ''
  const [hStr, mStr] = startTime.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (isNaN(h) || isNaN(m)) return ''

  const totalMin = h * 60 + m + durationMinutes
  const endH = Math.floor(totalMin / 60)
  const endM = totalMin % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}

/**
 * Genera dinámicamente las franjas horarias válidas según las reglas de negocio del Backend:
 * - Lunes a Viernes: 08:00 hasta 17:15
 * - Sábado: 08:00 hasta 12:15
 * - Domingo: lista vacía (clínica cerrada)
 * - Si es HOY: marca isPast = true si ya pasó la hora actual
 */
export function getAvailableSlots(dateStr: string): {
  slots: TimeSlot[]
  isSunday: boolean
  isSaturday: boolean
  isToday: boolean
  allPassed: boolean
  closingTime: string
} {
  if (!dateStr) {
    return {
      slots: [],
      isSunday: false,
      isSaturday: false,
      isToday: false,
      allPassed: false,
      closingTime: '18:00',
    }
  }

  const [y, m, d] = dateStr.split('-').map(Number)
  const dateObj = new Date(y, m - 1, d)
  const dayOfWeek = dateObj.getDay()

  // Domingo
  if (dayOfWeek === 0) {
    return {
      slots: [],
      isSunday: true,
      isSaturday: false,
      isToday: false,
      allPassed: false,
      closingTime: 'Cerrado',
    }
  }

  const isSaturday = dayOfWeek === 6
  const isToday = isTodayDate(dateStr)

  // Límites según día
  // Lun-Vie: 08:00 a 17:15 (cierre 18:00)
  // Sábado:  08:00 a 12:15 (cierre 13:00)
  const startMin = 8 * 60 // 08:00
  const maxStartMin = isSaturday ? 12 * 60 + 15 : 17 * 60 + 15
  const closingTime = isSaturday ? '13:00' : '18:00'

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const slots: TimeSlot[] = []

  for (let mins = startMin; mins <= maxStartMin; mins += 15) {
    const h = Math.floor(mins / 60)
    const min = mins % 60
    const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
    const isPast = isToday && mins <= currentMinutes

    slots.push({
      time: timeStr,
      label: timeStr,
      isPast,
      endTime: calculateEndTime(timeStr, 45),
    })
  }

  const allPassed = isToday && slots.length > 0 && slots.every(s => s.isPast)

  return {
    slots,
    isSunday: false,
    isSaturday,
    isToday,
    allPassed,
    closingTime,
  }
}

/**
 * Valida los límites estrictos de horario para una cita
 */
export function validateAppointmentSchedule(
  dateStr: string,
  startTime: string,
  endTime: string
): { valid: boolean; error?: string } {
  if (!dateStr || !startTime || !endTime) {
    return { valid: false, error: 'Por favor completa la fecha y las horas de inicio y fin.' }
  }

  // Validar domingo
  if (isSundayDate(dateStr)) {
    return { valid: false, error: 'La clínica permanece cerrada los domingos.' }
  }

  // Validar fechas pasadas
  const todayStr = getMinDateString()
  if (dateStr < todayStr) {
    return { valid: false, error: 'No se pueden agendar citas en fechas pasadas.' }
  }

  const [sH, sM] = startTime.split(':').map(Number)
  const [eH, eM] = endTime.split(':').map(Number)
  const startMins = sH * 60 + sM
  const endMins = eH * 60 + eM

  if (endMins <= startMins) {
    return { valid: false, error: 'La hora de fin debe ser posterior a la hora de inicio.' }
  }

  // Si es hoy, verificar que la hora de inicio no haya pasado
  if (isTodayDate(dateStr)) {
    const now = new Date()
    const nowMins = now.getHours() * 60 + now.getMinutes()
    if (startMins <= nowMins) {
      return { valid: false, error: 'La hora de inicio seleccionada ya ha pasado en el día de hoy.' }
    }
  }

  // Horario de apertura: 08:00
  if (startMins < 8 * 60) {
    return { valid: false, error: 'La clínica abre a las 08:00. Selecciona un horario a partir de esa hora.' }
  }

  // Horario de cierre según día
  const isSat = isSaturdayDate(dateStr)
  const maxEndMins = isSat ? 13 * 60 : 18 * 60
  const maxEndLabel = isSat ? '13:00' : '18:00'

  if (endMins > maxEndMins) {
    return {
      valid: false,
      error: `La hora de fin (${endTime}) no puede superar las ${maxEndLabel} (${isSat ? 'horario de sábado' : 'horario regular'}).`,
    }
  }

  return { valid: true }
}

export const CONFLICT_MESSAGE = 'Conflicto: El doctor o el sillón seleccionado ya tienen una cita en ese horario.'
