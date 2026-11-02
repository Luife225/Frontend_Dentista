export interface SpeechActivity {
  voiced: boolean
  silenceSamples: number
  speechSamples: number
  idleSamples: number
}

export const emptySpeechActivity = (): SpeechActivity => ({ voiced: false, silenceSamples: 0, speechSamples: 0, idleSamples: 0 })

/** Silero's speech probability, independent of microphone volume. Frames are 16 kHz. */
export function updateSpeechActivity(activity: SpeechActivity, probability: number, samples: number, mode: 'manual' | 'pause' = 'pause'): SpeechActivity {
  // Manual dictation often consists of one short word ("editar", "corona").
  const voice = Number.isFinite(probability) && probability >= (mode === 'manual' ? activity.voiced ? 0.25 : 0.4 : activity.voiced ? 0.35 : 0.6)
  const speechSamples = voice ? activity.speechSamples + samples : activity.voiced ? activity.speechSamples : 0
  const voiced = activity.voiced || speechSamples >= 16000 * (mode === 'manual' ? 0.096 : 0.16)
  return {
    voiced,
    silenceSamples: voiced && !voice ? activity.silenceSamples + samples : 0,
    speechSamples,
    idleSamples: activity.idleSamples + samples,
  }
}

export const pauseReached = (activity: SpeechActivity, sampleRate: number) =>
  activity.voiced && activity.silenceSamples >= sampleRate * 3.5

export const shouldAutoSend = (activity: SpeechActivity, sampleRate: number, mode: 'manual' | 'pause') =>
  mode === 'pause' && pauseReached(activity, sampleRate)

export const shouldStopIdle = (activity: SpeechActivity, sampleRate: number) =>
  !activity.voiced && activity.idleSamples >= sampleRate * 15

/** Short answers belong to the active dental dialogue, including "cara" or "confirmar". */
export const speechDetectionMode = (mode: 'manual' | 'pause', awaitingReply: boolean) =>
  mode === 'pause' && awaitingReply ? 'manual' : mode

export const shouldStopConversationIdle = (activity: SpeechActivity, sampleRate: number, mode: 'manual' | 'pause', awaitingReply: boolean) =>
  !(mode === 'pause' && awaitingReply) && shouldStopIdle(activity, sampleRate)
