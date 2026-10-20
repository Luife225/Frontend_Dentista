export const normalizeCoroVoz = (text: string) => text.toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ')
  .replace(/\bcoro voz\b/g, 'corovoz').trim()

/** Conserva fragmentos sin repetir una pieza o condición al corregir el dictado. */
export function mergeDentalDictation(previous: string, next: string): string {
  const number = /\b(?:\d+|once|doce|trece|catorce|quince|dieciseis|diecisiete|dieciocho|veinti\w+|treinta|cuarenta|veinte|uno|dos|tres|cuatro)\b/
  const condition = /\b(?:caries|cariado|cariada|corona|restaur\w+|obtur\w+|extra\w+|endodon\w+|implante|fractur\w+)\b/
  const left = normalizeCoroVoz(previous), right = normalizeCoroVoz(next)
  if (number.test(left) && number.test(right) || condition.test(left) && condition.test(right)) return next
  // Las notas pueden contener números y condiciones; no se combinan como comandos nuevos.
  if (/\b(?:nota|observacion)\b/.test(left)) return next
  return `${previous} ${next}`.trim()
}

export function stripSendCommand(text: string): string {
  return text.replace(/\bcoro\s*voz\s+(?:enviar|env[ií]a|listo)\s*[.!?]*$/iu, '').trim()
}

export function isCoroVozControl(text: string): boolean {
  return /^(?:(?:prender|activar|apagar) corovoz|(?:corovoz )?(?:correcto|confirmar|edita|editar|elimina|eliminar|cancelar|terminado|detener|iniciar))$/.test(normalizeCoroVoz(text))
}
