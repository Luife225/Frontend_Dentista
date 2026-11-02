export const normalizeCoroVoz = (text: string) => text.toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ')
  .replace(/\bcoro voz\b/g, 'corovoz').trim()

/** Conserva fragmentos sin repetir una pieza o condición al corregir el dictado. */
export function mergeDentalDictation(previous: string, next: string): string {
  const number = /\b(?:\d+|once|doce|trece|catorce|quince|dieciseis|diecisiete|dieciocho|veinti\w+|treinta|cuarenta|veinte|uno|dos|tres|cuatro)\b/
  const condition = /\b(?:sano|sana|saludable|caries|cariado|cariada|corona|restaur\w+|obtur\w+|empast\w+|resina|extra\w+|sacado|sacada|endodon\w+|conducto|implante|implantad\w+|fractur\w+|roto|rota)\b/
  const [before, oldNote] = previous.split(/\b(?:notas?|observaci[oó]n(?:es)?)\s*:?\s*/iu, 2)
  const [after, newNote] = next.split(/\b(?:notas?|observaci[oó]n(?:es)?)\s*:?\s*/iu, 2)
  let left = normalizeCoroVoz(before)
  const right = normalizeCoroVoz(after)
  if (number.test(left) && number.test(right)) return next
  if (condition.test(left) && condition.test(right)) left = left.replace(new RegExp(condition.source, 'g'), ' ')
  const surface = /\b(?:cara |superficie )?(?:oclusal|vestibular|bucal|lingual|palatin[ao]|mesial|distal|general|complet[ao])\b/g
  if (new RegExp(surface.source).test(right)) left = left.replace(surface, ' ')
  const note = newNote ?? oldNote
  return `${left} ${after}`.replace(/\s+/g, ' ').trim() + (note !== undefined ? `. Observación: ${note}` : '')
}

export function stripSendCommand(text: string): string {
  return text.replace(/\bcoro\s*voz\s+(?:enviar|env[ií]a|listo)\s*[.!?]*$/iu, '').trim()
}

export function dentalVoiceControl(text: string): 'confirm' | 'edit' | 'discard' | 'repeat' | 'save' | null {
  const value = normalizeCoroVoz(text).replace(/^corovoz /, '').replace(/^por favor /, '').replace(/ por favor$/, '')
  if (/^(?:correcto|confirmar|confirmo|confirma|si correcto|si confirmar|si confirmo|confirmar propuesta|confirma la propuesta)$/.test(value)) return 'confirm'
  if (/^(?:edita|editar|corrige|corregir|editar propuesta|edita la propuesta)$/.test(value)) return 'edit'
  if (/^(?:elimina|eliminar|borra|borrar|cancela|cancelar|descarta|descartar)(?: (?:la )?propuesta)?$/.test(value)) return 'discard'
  if (/^(?:repite|repetir|repite dictado|repetir dictado|repite el dictado|repite lo que dije|que dije|que habia dicho|que estaba dictando|que te dije|repetir propuesta|repite la propuesta|repetir hallazgo|repite el hallazgo|repetir borrador)$/.test(value)) return 'repeat'
  if (/^guarda(?:r)? (?:el )?borrador$/.test(value)) return 'save'
  return null
}

export function isCoroVozControl(text: string): boolean {
  return dentalVoiceControl(text) !== null || /^(?:(?:prender|activar|apagar) corovoz|(?:corovoz )?(?:terminado|detener|iniciar))$/.test(normalizeCoroVoz(text))
}

/** One-based selection spoken after CoroVoz offers clarification options. */
export function coroVozChoiceIndex(text: string, count: number): number | null {
  const value = normalizeCoroVoz(text)
  const match = value.match(/^(?:(?:la|el|opcion|opcion numero|numero) )?(primera|primero|segunda|segundo|tercera|tercero|cuarta|cuarto|quinta|quinto|sexta|sexto|septima|septimo|octava|octavo|uno|dos|tres|cuatro|cinco|seis|siete|ocho|[1-8])$/)
  if (!match) return null
  const number = [['primera', 'primero', 'uno', '1'], ['segunda', 'segundo', 'dos', '2'], ['tercera', 'tercero', 'tres', '3'], ['cuarta', 'cuarto', 'cuatro', '4'], ['quinta', 'quinto', 'cinco', '5'], ['sexta', 'sexto', 'seis', '6'], ['septima', 'septimo', 'siete', '7'], ['octava', 'octavo', 'ocho', '8']].findIndex(words => words.includes(match[1])) + 1
  return number <= count ? number - 1 : null
}

export interface PatientQuestion {
  question: string
  choices: { id: string; name: string; documentHint: string }[]
}

/** Resolve only an explicit selection. A bare yes can never choose between multiple people. */
export function resolvePatientReply(text: string, pending: PatientQuestion) {
  const value = normalizeCoroVoz(text).replace(/^(?:si|es|era|el paciente|la paciente) /, '')
  const index = coroVozChoiceIndex(text, pending.choices.length)
  if (index != null) return pending.choices[index]
  if (isPatientConfirmation(text)) {
    return pending.choices.length === 1 ? pending.choices[0] : null
  }
  const matches = pending.choices.filter(p => {
    const name = normalizeCoroVoz(p.name)
    return value.length > 2 && value.split(' ').every(word => name.split(' ').includes(word))
  })
  return matches.length === 1 ? matches[0] : null
}

export function isPatientConfirmation(text: string) {
  return /^(?:si|si es|si ese|si esa|si el|si ella|el|ella|correcto|exacto|esa persona)$/.test(normalizeCoroVoz(text))
}
