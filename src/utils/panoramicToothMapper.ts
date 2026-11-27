import type { MlBboxPixels } from '../services/attachmentService'

export const FDI_UPPER_RIGHT = ['18', '17', '16', '15', '14', '13', '12', '11']
export const FDI_UPPER_LEFT = ['21', '22', '23', '24', '25', '26', '27', '28']
export const FDI_LOWER_RIGHT = ['48', '47', '46', '45', '44', '43', '42', '41']
export const FDI_LOWER_LEFT = ['31', '32', '33', '34', '35', '36', '37', '38']

export const FDI_ALL_TEETH = [
  ...FDI_UPPER_RIGHT,
  ...FDI_UPPER_LEFT,
  ...FDI_LOWER_RIGHT,
  ...FDI_LOWER_LEFT,
]

export const TOOTH_FACES = [
  { value: 'GENERAL', label: 'General (pieza completa)' },
  { value: 'OCLUSAL', label: 'Oclusal' },
  { value: 'MESIAL', label: 'Mesial' },
  { value: 'DISTAL', label: 'Distal' },
  { value: 'VESTIBULAR', label: 'Vestibular' },
  { value: 'LINGUAL', label: 'Lingual' },
] as const

/**
 * Estima la pieza dental FDI aproximada a partir de la posición geométrica
 * de una caja delimitadora en una radiografía panorámica estándar.
 * Siempre debe ser confirmada o ajustada por el odontólogo tratante.
 */
export function estimateToothFdiFromBbox(
  bbox: MlBboxPixels | undefined | null,
  imageWidth: number,
  imageHeight: number
): string {
  if (!bbox || imageWidth <= 0 || imageHeight <= 0) {
    return '46'
  }

  const cx = (bbox.xMin + bbox.xMax) / 2 / imageWidth
  const cy = (bbox.yMin + bbox.yMax) / 2 / imageHeight

  // Margen lateral aproximado de la rama mandibular en panorámicas (10% a cada lado)
  const archStart = 0.1
  const archEnd = 0.9
  const normX = Math.min(1, Math.max(0, (cx - archStart) / (archEnd - archStart)))

  const isUpper = cy < 0.5
  const isPatientRight = normX < 0.5

  if (isPatientRight) {
    // 0.0 -> 0.5 mapea de molar (índice 0) a incisivo central (índice 7)
    const idx = Math.min(7, Math.max(0, Math.floor((normX / 0.5) * 8)))
    return isUpper ? FDI_UPPER_RIGHT[idx] : FDI_LOWER_RIGHT[idx]
  } else {
    // 0.5 -> 1.0 mapea de incisivo central (índice 0) a molar (índice 7)
    const idx = Math.min(7, Math.max(0, Math.floor(((normX - 0.5) / 0.5) * 8)))
    return isUpper ? FDI_UPPER_LEFT[idx] : FDI_LOWER_LEFT[idx]
  }
}
