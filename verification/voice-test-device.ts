// Boundary doubles for the isolated voice test page. Playback flags and late
// events advance independently, as they can with an OS-backed speech engine.
type FrameCallback = (probabilities: { isSpeech: number }, frame: Float32Array) => void
interface VadOptions {
  getStream(): Promise<MediaStream>
  onFrameProcessed: FrameCallback
}

export function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>(done => { resolve = done })
  return { promise, resolve }
}

export const device = {
  speaking: false,
  pending: false,
  cancels: 0,
  permissionRequests: [] as MediaStreamConstraints[],
  tracks: [] as MediaStreamTrack[],
  utterances: [] as SpeechSynthesisUtterance[],
  remainingText: '',
  frames: [] as FrameCallback[],
  modelGate: null as ReturnType<typeof deferred> | null,
  permissionGate: null as ReturnType<typeof deferred> | null,
  finishCue: null as (() => void) | null,
  deny: false,
  source: 'quiet' as 'quiet' | 'assistant' | 'user',
}

export function advancePlayback(characters: number) {
  const spoken = device.remainingText.slice(0, characters)
  device.remainingText = device.remainingText.slice(characters)
  const utterance = device.utterances[device.utterances.length - 1]
  if (spoken) utterance.onboundary?.call(utterance, { utterance, charIndex: utterance.text.length - device.remainingText.length } as SpeechSynthesisEvent)
  return spoken.length
}

// PCM markers retain their signs through the production WAV encoder. A negative
// sample in the uploaded audio identifies an assistant frame accepted as input.
export function emitFrame(callback = device.frames[device.frames.length - 1]) {
  const amplitude = { quiet: 0, assistant: -0.5, user: 0.4 }[device.source]
  callback?.({ isSpeech: amplitude ? 0.99 : 0 }, new Float32Array(512).fill(amplitude))
}

export const MicVAD = {
  async new(options: VadOptions) {
    await device.modelGate?.promise
    return {
      async start() {
        await options.getStream()
        device.frames.push(options.onFrameProcessed)
      },
      async destroy() {},
    }
  },
}

export function installDevice() {
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
    getVoices: () => [],
    get speaking() { return device.speaking },
    get pending() { return device.pending },
    cancel() { device.cancels++; device.remainingText = '' },
    speak(utterance: SpeechSynthesisUtterance) {
      device.utterances.push(utterance)
      device.remainingText = utterance.text
      device.speaking = true
      utterance.onstart?.call(utterance, { utterance } as SpeechSynthesisEvent)
    },
  } })
  // Stand-in for an unlocked context. No sound reaches the physical device.
  class TestAudioContext {
    state = 'running'
    currentTime = 0
    destination = {}
    createOscillator() {
      const tone = {
        frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        onended: null as (() => void) | null,
        connect() {}, disconnect() {}, start() {},
        stop() { device.finishCue = () => tone.onended?.() },
      }
      return tone
    }
    createGain() {
      return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {} }
    }
    async resume() {}
    async close() { this.state = 'closed' }
  }
  Object.defineProperty(window, 'AudioContext', { configurable: true, value: TestAudioContext })
  Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async (constraints: MediaStreamConstraints) => {
    device.permissionRequests.push(constraints)
    await device.permissionGate?.promise
    if (device.deny) throw new DOMException('Permiso denegado en la prueba', 'NotAllowedError')
    const track = {
      enabled: true, readyState: 'live', onended: null,
      stop() { this.readyState = 'ended' },
    }
    device.tracks.push(track as unknown as MediaStreamTrack)
    return { getTracks: () => [track], getAudioTracks: () => [track] } as unknown as MediaStream
  } })
}

export function resetDevice() {
  device.speaking = device.pending = device.deny = false
  device.cancels = 0
  device.remainingText = ''
  device.permissionRequests.length = device.utterances.length = device.tracks.length = device.frames.length = 0
  device.source = 'quiet'
  device.permissionGate = device.modelGate = null
  device.finishCue = null
}
