export type CoroVozIconName = 'mic' | 'stop' | 'send' | 'volume' | 'mute' | 'settings' | 'minimize' | 'chat' | 'tooth' | 'check' | 'close' | 'pause'

const paths: Record<CoroVozIconName, string> = {
  mic: 'M12 15a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v7a3 3 0 0 0 3 3Zm-7-4v1a7 7 0 0 0 14 0v-1M12 19v3m-4 0h8',
  stop: 'M6 6h12v12H6z', send: 'm21 3-7 18-4-7-7-4 18-7ZM10 14 21 3',
  volume: 'm11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  mute: 'm11 4-6 5H2v6h3l6 5V4Zm5 5 6 6m0-6-6 6',
  settings: 'M4 7h16M4 17h16M8 4v6m8 4v6', minimize: 'M5 12h14',
  chat: 'M21 11a8 8 0 0 1-8 8H8l-5 3V11a9 9 0 0 1 18 0ZM7 10h10m-10 4h6',
  tooth: 'M12 4C8 1 3 3 4 9c1 4 2 12 5 12 2 0 1-8 3-8s1 8 3 8c3 0 4-8 5-12 1-6-4-8-8-5Z',
  check: 'm5 12 4 4L19 6', close: 'm6 6 12 12M6 18 18 6', pause: 'M8 5v14M16 5v14',
}

export default function CoroVozIcon({ name }: { name: CoroVozIconName }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
