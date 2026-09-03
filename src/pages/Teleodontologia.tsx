import { useState, useRef } from 'react'

type CallState = 'idle' | 'waiting' | 'active' | 'ended'

interface Attachment {
  id: number
  name: string
  size: string
  from: 'doctor' | 'patient'
  state: 'uploading' | 'done' | 'error'
  progress: number
}

const upcoming = [
  { id:1, patient:'Carlos Rivas', time:'10:00', date:'2026-08-08', motivo:'Consulta post-extracción', shared: [] as string[] },
  { id:2, patient:'María González', time:'11:30', date:'2026-08-09', motivo:'Control ortodoncia virtual', shared: ['rx_panoramica.jpg'] },
  { id:3, patient:'Sofía Mendez', time:'15:00', date:'2026-08-10', motivo:'Seguimiento embarazo dental', shared: ['foto_zona_14.png', 'rx_periapical_14.jpg'] },
]

export default function Teleodontologia() {
  const [callState, setCallState] = useState<CallState>('idle')
  const [activeConsult, setActiveConsult] = useState<typeof upcoming[0] | null>(null)
  const [chatMsg, setChatMsg] = useState('')
  const [messages, setMessages] = useState([
    { from:'patient', text:'Buenos días doctor, estoy conectado.' },
    { from:'dr', text:'Hola Carlos, ya lo veo. ¿Cómo está el área de la extracción?' },
  ])
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [sharedImages, setSharedImages] = useState<string[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  let nextAttachId = useRef(1)

  function handleAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const id = nextAttachId.current++
    const newAttach: Attachment = {
      id, name: file.name, size: `${(file.size/1024).toFixed(0)} KB`,
      from: 'doctor', state: 'uploading', progress: 0,
    }
    setAttachments(prev => [...prev, newAttach])
    // Simulate upload progress
    let p = 0
    const iv = setInterval(() => {
      p += Math.random() * 30
      if (p >= 100) {
        p = 100
        clearInterval(iv)
        setAttachments(prev => prev.map(a => a.id === id ? { ...a, state: 'done', progress: 100 } : a))
      } else {
        setAttachments(prev => prev.map(a => a.id === id ? { ...a, progress: Math.round(p) } : a))
      }
    }, 300)
    // Reset input
    e.target.value = ''
  }

  function retryAttach(id: number) {
    setAttachments(prev => prev.map(a => a.id === id ? { ...a, state: 'uploading', progress: 0 } : a))
    let p = 0
    const iv = setInterval(() => {
      p += Math.random() * 25
      if (p >= 100) {
        clearInterval(iv)
        setAttachments(prev => prev.map(a => a.id === id ? { ...a, state: 'done', progress: 100 } : a))
      } else {
        setAttachments(prev => prev.map(a => a.id === id ? { ...a, progress: Math.round(p) } : a))
      }
    }, 350)
  }

  function startCall(c: typeof upcoming[0]) {
    setActiveConsult(c)
    setCallState('waiting')
    setTimeout(() => {
      setCallState('active')
      if (c.shared.length) setSharedImages(c.shared)
    }, 1800)
  }

  function endCall() {
    setCallState('ended')
    setTimeout(() => { setCallState('idle'); setActiveConsult(null); setSharedImages([]) }, 1200)
  }

  function sendMsg() {
    if (!chatMsg.trim()) return
    setMessages(m => [...m, { from:'dr', text: chatMsg }])
    setChatMsg('')
  }

  return (
    <div className="p-6 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Teleodontología</h1>
        <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">Servicio activo</span>
      </div>

      {callState === 'idle' && (
        <div className="grid grid-cols-3 gap-4">
          {/* Upcoming video consultations */}
          <div className="col-span-2 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700" style={{fontFamily:'Outfit'}}>Consultas virtuales programadas</h2>
            {upcoming.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">{c.patient}</p>
                      <span className="text-xs font-mono text-slate-400">{c.date} {c.time}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{c.motivo}</p>
                    {c.shared.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <svg className="w-3.5 h-3.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                        <span className="text-xs text-violet-600">{c.shared.length} imagen(es) compartida(s) por paciente</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => startCall(c)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-500 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/></svg>
                    Iniciar llamada
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Info panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm" style={{fontFamily:'Outfit'}}>Cómo funciona</h3>
              {[
                ['1', 'El paciente recibe un enlace por WhatsApp/email'],
                ['2', 'Puede compartir radiografías o fotos desde su app'],
                ['3', 'El doctor las recibe en tiempo real durante la llamada'],
                ['4', 'La consulta queda registrada en la historia clínica'],
              ].map(([n, t]) => (
                <div key={n} className="flex items-start gap-2 mb-2 text-xs text-slate-600">
                  <span className="w-4 h-4 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center font-bold shrink-0 text-[10px]">{n}</span>
                  {t}
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3" style={{fontFamily:'Outfit'}}>Este mes</p>
              {[
                ['Consultas realizadas', '12'],
                ['Tiempo promedio', '18 min'],
                ['Satisfacción', '4.8 / 5'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between py-1.5 border-b border-slate-50 last:border-0 text-sm">
                  <span className="text-slate-500">{l}</span>
                  <span className="font-semibold text-slate-700">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Connecting */}
      {callState === 'waiting' && (
        <div className="bg-slate-900 rounded-2xl h-96 flex flex-col items-center justify-center gap-4 slide-up">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 pulse-ring"></div>
            <div className="absolute inset-0 w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/></svg>
            </div>
          </div>
          <p className="text-white font-semibold" style={{fontFamily:'Outfit'}}>Conectando con {activeConsult?.patient}...</p>
          <p className="text-white/40 text-sm">Enviando notificación al paciente</p>
        </div>
      )}

      {/* Active call */}
      {callState === 'active' && activeConsult && (
        <div className="bg-slate-950 rounded-2xl overflow-hidden slide-up" style={{height:'600px'}}>
          <div className="flex h-full">
            {/* Video area */}
            <div className="flex-1 relative bg-slate-900 flex items-center justify-center">
              {/* Patient video (simulated) */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-3xl font-bold" style={{fontFamily:'Outfit'}}>
                  {activeConsult.patient.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
              </div>
              {/* Self preview */}
              <div className="absolute bottom-4 right-4 w-32 h-24 bg-slate-700 rounded-xl border-2 border-white/20 flex items-center justify-center overflow-hidden">
                {camOn ? (
                  <div className="bg-gradient-to-br from-cyan-800 to-cyan-900 w-full h-full flex items-center justify-center">
                    <span className="text-white/40 text-xs">Tu cámara</span>
                  </div>
                ) : (
                  <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                )}
              </div>
              {/* Shared images from patient */}
              {sharedImages.length > 0 && (
                <div className="absolute top-4 left-4 bg-black/50 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-xs text-white/60 mb-2">Imágenes del paciente</p>
                  <div className="flex gap-2">
                    {sharedImages.map((img, i) => (
                      <div key={i} className="w-16 h-12 bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-cyan-400 transition-all">
                        <span className="text-xs text-white/40 font-mono text-center px-1 truncate">{img.slice(0,6)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 items-center">
                <button onClick={() => setMicOn(!micOn)}
                  title={micOn ? 'Silenciar' : 'Activar micrófono'}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white/10 text-rose-400'}`}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/></svg>
                </button>
                <button onClick={() => setCamOn(!camOn)}
                  title={camOn ? 'Apagar cámara' : 'Activar cámara'}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${camOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white/10 text-rose-400'}`}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/></svg>
                </button>
                {/* Attach document button — Ajuste 2 */}
                <button
                  title="Adjuntar documento"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors relative">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                  </svg>
                  {attachments.some(a => a.state === 'uploading') && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full border border-slate-900 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 border border-white border-t-transparent rounded-full animate-spin"></span>
                    </span>
                  )}
                  {attachments.length > 0 && !attachments.some(a => a.state === 'uploading') && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cyan-500 rounded-full border border-slate-900 text-[9px] text-white font-bold flex items-center justify-center">
                      {attachments.filter(a => a.state === 'done').length}
                    </span>
                  )}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*,.pdf,.dcm" className="hidden" onChange={handleAttach} />
                <button onClick={endCall}
                  title="Colgar"
                  className="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.42 19.42 0 013.07 9.5 19.79 19.79 0 01.5 1.31 2 2 0 012.48 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.46 7.91"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Right panel: chat + attachments */}
            <div className="w-72 shrink-0 flex flex-col border-l border-white/10">
              <div className="p-4 border-b border-white/10">
                <p className="text-white font-semibold text-sm" style={{fontFamily:'Outfit'}}>{activeConsult.patient}</p>
                <p className="text-white/40 text-xs">{activeConsult.motivo}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-emerald-400">En llamada</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {/* Chat messages */}
                {messages.map((m, i) => (
                  <div key={i} className={`max-w-[85%] ${m.from === 'dr' ? 'ml-auto' : ''}`}>
                    <div className={`px-3 py-2 rounded-xl text-xs ${m.from === 'dr' ? 'bg-cyan-600 text-white' : 'bg-white/10 text-white/80'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}

                {/* Patient shared images (pre-loaded from invite) */}
                {sharedImages.map((img, i) => (
                  <div key={`pi-${i}`} className="max-w-[90%]">
                    <p className="text-[10px] text-white/30 mb-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>Paciente adjuntó
                    </p>
                    <div className="flex items-center gap-2 bg-white/8 rounded-xl px-3 py-2 border border-violet-400/20">
                      <svg className="w-4 h-4 text-violet-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      <span className="text-xs text-white/70 truncate">{img}</span>
                    </div>
                  </div>
                ))}

                {/* Doctor attachments — with upload states */}
                {attachments.map(a => (
                  <div key={a.id} className="ml-auto max-w-[90%]">
                    <p className="text-[10px] text-white/30 mb-1 text-right flex items-center justify-end gap-1">
                      Tú adjuntaste<span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    </p>
                    <div className={`rounded-xl px-3 py-2.5 border ${
                      a.state === 'error' ? 'bg-rose-500/10 border-rose-400/30' :
                      a.state === 'uploading' ? 'bg-white/8 border-white/10' :
                      'bg-white/8 border-cyan-400/20'
                    }`}>
                      <div className="flex items-center gap-2">
                        <svg className={`w-4 h-4 shrink-0 ${a.state === 'error' ? 'text-rose-400' : a.state === 'done' ? 'text-cyan-400' : 'text-white/40'}`}
                          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/80 truncate">{a.name}</p>
                          <p className="text-[10px] text-white/30">{a.size}</p>
                        </div>
                        {a.state === 'done' && (
                          <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        )}
                        {a.state === 'error' && (
                          <button onClick={() => retryAttach(a.id)} className="text-[10px] text-rose-400 hover:text-rose-300 shrink-0 underline">Reintentar</button>
                        )}
                      </div>
                      {a.state === 'uploading' && (
                        <div className="mt-2">
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 rounded-full transition-all duration-300" style={{width:`${a.progress}%`}}></div>
                          </div>
                          <p className="text-[10px] text-white/30 mt-0.5 text-right">{a.progress}%</p>
                        </div>
                      )}
                      {a.state === 'done' && (
                        <p className="text-[10px] text-white/30 mt-1">Guardado en historial del paciente</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-white/10 flex gap-2">
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-8 h-8 rounded-xl bg-white/8 text-white/50 hover:bg-white/15 hover:text-white transition-colors flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                  </svg>
                </button>
                <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMsg()}
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/10 rounded-xl text-white text-xs placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                  placeholder="Mensaje..." />
                <button onClick={sendMsg} className="px-3 py-2 bg-cyan-600 text-white rounded-xl text-xs hover:bg-cyan-500 transition-colors">↑</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call ended */}
      {callState === 'ended' && (
        <div className="bg-slate-900 rounded-2xl h-32 flex items-center justify-center gap-4 slide-up">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
          </div>
          <div>
            <p className="text-white font-semibold" style={{fontFamily:'Outfit'}}>Consulta finalizada</p>
            <p className="text-white/40 text-sm">Guardando registro en historia clínica...</p>
          </div>
        </div>
      )}
    </div>
  )
}
