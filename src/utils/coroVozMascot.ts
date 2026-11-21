export type CoroVozMascotState = 'idle' | 'speaking' | 'listening' | 'thinking' | 'choosing' | 'success' | 'error' | 'minimized'

export interface MascotActivity {
  expanded: boolean
  speaking: boolean
  processing: boolean
  listening: boolean
  error: boolean
  awaitingAnswer: boolean
  success: boolean
}

/** Presentation only: live activity takes priority over a pending question or result. */
export function resolveMascotState(activity: MascotActivity): CoroVozMascotState {
  if (!activity.expanded) return 'minimized'
  if (activity.speaking) return 'speaking'
  if (activity.processing) return 'thinking'
  if (activity.listening) return 'listening'
  if (activity.error) return 'error'
  if (activity.awaitingAnswer) return 'choosing'
  if (activity.success) return 'success'
  return 'idle'
}

export const MASCOT_LABELS: Record<CoroVozMascotState, string> = {
  idle: 'Coronix en reposo', speaking: 'Coronix hablando', listening: 'Coronix escuchando',
  thinking: 'Coronix pensando', choosing: 'Coronix preguntando', success: 'Coronix confirma el resultado',
  error: 'Coronix indica un problema', minimized: 'Coronix asomándose',
}

export const MASCOT_ASSETS: Record<CoroVozMascotState, string> = {
  idle: 'idle.webp', speaking: 'speaking.webp', listening: 'listening.webp', thinking: 'thinking.webp',
  choosing: 'choosing.webp', success: 'success.webp', error: 'error.webp', minimized: 'minimized.webp',
}
