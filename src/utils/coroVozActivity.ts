export interface SpeechActivity {
  voiced: boolean
  silenceSamples: number
  noiseFloor: number
  peakRms: number
}

export const emptySpeechActivity = (): SpeechActivity => ({ voiced: false, silenceSamples: 0, noiseFloor: 0.003, peakRms: 0 })

/** A moving noise floor lets the pause timer work with quieter voices and steady room noise. */
export function updateSpeechActivity(activity: SpeechActivity, rms: number, samples: number): SpeechActivity {
  const threshold = Math.max(0.004, activity.noiseFloor * 2.2, activity.peakRms * 0.27)
  const voice = rms > threshold
  const noiseFloor = voice ? activity.noiseFloor : activity.noiseFloor * 0.94 + rms * 0.06
  return {
    voiced: activity.voiced || voice,
    silenceSamples: activity.voiced && !voice ? activity.silenceSamples + samples : 0,
    noiseFloor: Math.min(0.03, Math.max(0.001, noiseFloor)),
    peakRms: Math.max(activity.peakRms, rms),
  }
}

export const pauseReached = (activity: SpeechActivity, sampleRate: number) =>
  activity.voiced && activity.silenceSamples >= sampleRate * 3.5

export const shouldAutoSend = (activity: SpeechActivity, sampleRate: number, mode: 'manual' | 'pause') =>
  mode === 'pause' && pauseReached(activity, sampleRate)
