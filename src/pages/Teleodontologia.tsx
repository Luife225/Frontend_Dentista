import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAppointments } from '../services/appointmentService'
import { Appointment } from '../types/appointment'
import { formatLimaDate, formatLimaTime } from '../utils/appointmentRules'

type CallState = 'idle' | 'waiting' | 'active' | 'ended'

interface Attachment {
  id: number
  name: string
  size: string
  from: 'doctor' | 'patient'
  state: 'uploading' | 'done' | 'error'
  progress: number
}

export default function Teleodontologia() {
  const navigate = useNavigate()
  const [citas, setCitas] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ACTIVAS' | 'FINALIZADAS' | 'TODAS'>('ACTIVAS')

  // Simulator / In-page call state
  const [callState, setCallState] = useState<CallState>('idle')
  const [activeConsult, setActiveConsult] = useState<Appointment | null>(null)
  const [chatMsg, setChatMsg] = useState('')
  const [messages, setMessages] = useState([
    { from: 'patient', text: 'Buenos días doctor, ya estoy conectado a la sala virtual.' },
    { from: 'dr', text: 'Hola, un gusto saludarte. ¿Cómo te has sentido desde la última consulta?' },
  ])
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [sharedImages, setSharedImages] = useState<string[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const nextAttachId = useRef(1)

  const loadVirtualAppointments = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAppointments()
      // Filtrar únicamente citas con modalidad VIRTUAL
      const virtualList = data.filter(c => c.modalidad === 'VIRTUAL')
      // Ordenar cronológicamente
      virtualList.sort((a, b) => (a.inicioEn || '').localeCompare(b.inicioEn || ''))
      setCitas(virtualList)
    } catch (err: any) {
      console.error('Error al cargar teleconsultas:', err)
      setError(err.message || 'No se pudieron cargar las teleconsultas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVirtualAppointments()
  }, [])

  // Filtrado de citas para la vista
  const filteredCitas = useMemo(() => {
    if (filter === 'ACTIVAS') {
      return citas.filter(c => c.estado !== 'FINALIZADA' && c.estado !== 'CANCELADA')
    }
    if (filter === 'FINALIZADAS') {
      return citas.filter(c => c.estado === 'FINALIZADA')
    }
    return citas
  }, [citas, filter])

  // Métricas calculadas en tiempo real de la base de datos
  const stats = useMemo(() => {
    const activas = citas.filter(c => c.estado !== 'FINALIZADA' && c.estado !== 'CANCELADA').length
    const finalizadas = citas.filter(c => c.estado === 'FINALIZADA').length
    const total = citas.length
    return { activas, finalizadas, total }
  }, [citas])

  function handleAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const id = nextAttachId.current++
    const newAttach: Attachment = {
      id,
      name: file.name,
      size: `${(file.size / 1024).toFixed(0)} KB`,
      from: 'doctor',
      state: 'uploading',
      progress: 0,
    }
    setAttachments(prev => [...prev, newAttach])

    let p = 0
    const iv = setInterval(() => {
      p += Math.random() * 30
      if (p >= 100) {
        p = 100
        clearInterval(iv)
        setAttachments(prev => prev.map(a => (a.id === id ? { ...a, state: 'done', progress: 100 } : a)))
      } else {
        setAttachments(prev => prev.map(a => (a.id === id ? { ...a, progress: Math.round(p) } : a)))
      }
    }, 300)

    e.target.value = ''
  }

  function startTestCall(c: Appointment) {
    setActiveConsult(c)
    setCallState('waiting')
    setTimeout(() => {
      setCallState('active')
      setSharedImages(['radiografia_diagnostico.jpg'])
    }, 1200)
  }

  function endCall() {
    setCallState('ended')
    setTimeout(() => {
      setCallState('idle')
      setActiveConsult(null)
      setSharedImages([])
    }, 1200)
  }

  function sendMsg() {
    if (!chatMsg.trim()) return
    setMessages(m => [...m, { from: 'dr', text: chatMsg }])
    setChatMsg('')
  }

  return (
    <div className="p-6 space-y-5 fade-in">
      {/* Header con estado del servicio */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Outfit' }}>
              Teleodontología · Consultas Virtuales
            </h1>
            <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-0.5 rounded-full font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Google Meet Activo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión y atención de videollamadas con pacientes mediante salas oficiales de Google Meet
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadVirtualAppointments}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Recargar citas de teleodontología"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            <span>Actualizar</span>
          </button>
          <button
            onClick={() => navigate('/app/agenda')}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>📅 Ir a la Agenda</span>
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      {callState === 'idle' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Columna Izquierda: Citas Virtuales Reales (2 columnas) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filtros */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilter('ACTIVAS')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filter === 'ACTIVAS'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Próximas y activas ({stats.activas})
                </button>
                <button
                  onClick={() => setFilter('FINALIZADAS')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filter === 'FINALIZADAS'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Historial finalizadas ({stats.finalizadas})
                </button>
                <button
                  onClick={() => setFilter('TODAS')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filter === 'TODAS'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Todas ({stats.total})
                </button>
              </div>

              <span className="text-xs text-slate-400">
                {filteredCitas.length} {filteredCitas.length === 1 ? 'consulta' : 'consultas'}
              </span>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
                <span>{error}</span>
                <button onClick={loadVirtualAppointments} className="font-bold underline cursor-pointer">
                  Reintentar
                </button>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="space-y-3">
                {[1, 2].map(n => (
                  <div key={n} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-slate-100 rounded w-full"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredCitas.length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 text-2xl flex items-center justify-center mx-auto">
                  📹
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm" style={{ fontFamily: 'Outfit' }}>
                    No hay teleconsultas {filter === 'ACTIVAS' ? 'próximas' : ''}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Cuando un paciente reserve una cita virtual o se agende una teleconsulta con Google Meet en la
                    agenda, se listará aquí automáticamente.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/app/agenda')}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>📅 Agendar nueva cita en Agenda</span>
                </button>
              </div>
            )}

            {/* List of Real Appointments */}
            {!loading &&
              filteredCitas.map(c => {
                const meetUrl = c.enlaceTeleconsulta || 'https://meet.google.com/new'

                return (
                  <div
                    key={c.id}
                    className={`bg-white rounded-2xl border transition-all p-5 shadow-xs hover:shadow-md ${
                      c.estado === 'EN_ATENCION'
                        ? 'border-teal-400 bg-teal-50/20 ring-2 ring-teal-400/20'
                        : 'border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="space-y-1.5 flex-1 min-w-[240px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-base" style={{ fontFamily: 'Outfit' }}>
                            {c.pacienteNombreCompleto}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              c.estado === 'CONFIRMADA'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : c.estado === 'EN_ATENCION'
                                ? 'bg-teal-100 text-teal-800 border border-teal-200 animate-pulse'
                                : c.estado === 'FINALIZADA'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {c.estado === 'EN_ATENCION'
                              ? '🩺 En Atención'
                              : c.estado === 'CONFIRMADA'
                              ? '✓ Confirmada'
                              : c.estado === 'FINALIZADA'
                              ? '🏁 Finalizada'
                              : 'Programada'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <span>📅</span>
                            {formatLimaDate(c.inicioEn)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono text-slate-700 font-semibold">
                            <span>⏰</span>
                            {formatLimaTime(c.inicioEn)} - {formatLimaTime(c.finEn)} (Lima)
                          </span>
                          <span>•</span>
                          <span className="text-slate-600">
                            Dr(a). {c.odontologoNombreCompleto || 'Odontólogo asignado'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 font-medium">
                          <span className="text-slate-400">Motivo:</span> {c.motivo || 'Consulta odontológica virtual'}
                        </p>

                        {/* Caja del Enlace Google Meet */}
                        <div className="bg-sky-50 border border-sky-200/80 rounded-xl px-3 py-2 flex items-center justify-between gap-2 mt-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base">📹</span>
                            <span className="text-xs font-mono font-bold text-sky-900 truncate">
                              {c.enlaceTeleconsulta || 'https://meet.google.com/new'}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase bg-sky-200/60 text-sky-800 px-2 py-0.5 rounded shrink-0">
                            Google Meet
                          </span>
                        </div>
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                        {/* Botón Principal: Abrir Google Meet */}
                        <a
                          href={meetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer text-center"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
                          </svg>
                          <span>Iniciar Google Meet ↗</span>
                        </a>

                        {/* Botón Historia Clínica / Atender */}
                        <button
                          onClick={() =>
                            navigate(
                              `/app/pacientes?pacienteId=${c.pacienteId}&citaId=${c.id}&tab=historia&atender=true`
                            )
                          }
                          className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>🩺 Historia Clínica / Atender</span>
                        </button>

                        {/* Botón Probar Cámara / Simulador (para docencia) */}
                        <button
                          onClick={() => startTestCall(c)}
                          className="px-3 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-[11px] font-medium rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          title="Probar vista previa de cámara y micrófono en plataforma"
                        >
                          <span>🎙 Probar cámara / audio</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>

          {/* Columna Derecha: Información y Métricas Reales */}
          <div className="space-y-4">
            {/* Cómo funciona */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: 'Outfit' }}>
                Protocolo de Teleconsulta
              </h3>
              {[
                ['1', 'Cita reservada en modalidad virtual con sala de Google Meet asignada'],
                ['2', 'El paciente accede desde su portal con 1 clic al enlace oficial'],
                ['3', 'El odontólogo realiza el triaje visual y anamnesis en tiempo real'],
                ['4', 'El registro clínico se guarda y firma de forma inmutable en el historial'],
              ].map(([n, t]) => (
                <div key={n} className="flex items-start gap-2.5 text-xs text-slate-600">
                  <span className="w-5 h-5 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center font-bold shrink-0 text-[11px]">
                    {n}
                  </span>
                  <span className="leading-relaxed">{t}</span>
                </div>
              ))}
            </div>

            {/* Métricas Reales de la Clínica */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>
                  Métricas de Teleodontología
                </p>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">En vivo</span>
              </div>

              <div className="space-y-2 pt-1">
                {[
                  ['Teleconsultas activas / próximas', stats.activas.toString(), 'text-sky-700 font-bold'],
                  ['Teleconsultas completadas', stats.finalizadas.toString(), 'text-emerald-700 font-bold'],
                  ['Total histórico registrado', stats.total.toString(), 'text-slate-800 font-bold'],
                  ['Plataforma de videollamada', 'Google Meet', 'text-sky-600 font-semibold'],
                  ['Instalación requerida', 'Ninguna (Web)', 'text-emerald-600 font-semibold'],
                ].map(([l, v, cl]) => (
                  <div key={l} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0 text-xs">
                    <span className="text-slate-500">{l}</span>
                    <span className={cl}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tarjeta de Acceso Rápido a Meet */}
            <div className="bg-gradient-to-br from-sky-900 to-indigo-950 rounded-2xl p-5 text-white shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚀</span>
                <h4 className="font-bold text-sm" style={{ fontFamily: 'Outfit' }}>
                  Sala de Emergencia Rápida
                </h4>
              </div>
              <p className="text-xs text-sky-200/80 leading-relaxed">
                ¿Necesitas iniciar una teleconsulta inmediata sin programar cita previa?
              </p>
              <button
                type="button"
                onClick={() => window.open('https://meet.google.com/new', '_blank')}
                className="w-full py-2 bg-white text-sky-950 font-bold text-xs rounded-xl hover:bg-sky-50 transition-all shadow-sm cursor-pointer"
              >
                Crear reunión instantánea en Meet ↗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulator: Connecting */}
      {callState === 'waiting' && (
        <div className="bg-slate-900 rounded-2xl h-96 flex flex-col items-center justify-center gap-4 slide-up">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 pulse-ring"></div>
            <div className="absolute inset-0 w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
              </svg>
            </div>
          </div>
          <p className="text-white font-semibold text-base" style={{ fontFamily: 'Outfit' }}>
            Conectando con {activeConsult?.pacienteNombreCompleto}...
          </p>
          <p className="text-white/40 text-xs">Probando periféricos de cámara y micrófono</p>
        </div>
      )}

      {/* Simulator: Active Call View */}
      {callState === 'active' && activeConsult && (
        <div className="bg-slate-950 rounded-2xl overflow-hidden slide-up" style={{ height: '600px' }}>
          <div className="flex h-full">
            {/* Video Area */}
            <div className="flex-1 relative bg-slate-900 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center gap-3">
                <div
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                  style={{ fontFamily: 'Outfit' }}
                >
                  {activeConsult.pacienteNombreCompleto
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-base" style={{ fontFamily: 'Outfit' }}>
                    {activeConsult.pacienteNombreCompleto}
                  </p>
                  <p className="text-white/50 text-xs">Paciente en consulta virtual</p>
                </div>
              </div>

              {/* Self Preview */}
              <div className="absolute bottom-4 right-4 w-36 h-28 bg-slate-800 rounded-xl border border-white/20 flex items-center justify-center overflow-hidden shadow-lg">
                {camOn ? (
                  <div className="bg-gradient-to-br from-cyan-900 to-slate-900 w-full h-full flex items-center justify-center">
                    <span className="text-white/60 text-xs font-semibold">Tu cámara activa</span>
                  </div>
                ) : (
                  <span className="text-rose-400 text-xs font-semibold">Cámara apagada</span>
                )}
              </div>

              {/* Controles de Llamada */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 items-center bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                <button
                  onClick={() => setMicOn(!micOn)}
                  title={micOn ? 'Silenciar' : 'Activar micrófono'}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    micOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-500/30 text-rose-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  </svg>
                </button>
                <button
                  onClick={() => setCamOn(!camOn)}
                  title={camOn ? 'Apagar cámara' : 'Activar cámara'}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    camOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-500/30 text-rose-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
                  </svg>
                </button>
                <button
                  title="Adjuntar documento"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors relative cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.dcm"
                  className="hidden"
                  onChange={handleAttach}
                />
                <button
                  onClick={endCall}
                  title="Finalizar prueba"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Salir de prueba
                </button>
              </div>
            </div>

            {/* Right panel: Chat & notes */}
            <div className="w-80 shrink-0 flex flex-col border-l border-white/10 bg-slate-900">
              <div className="p-4 border-b border-white/10">
                <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Outfit' }}>
                  {activeConsult.pacienteNombreCompleto}
                </p>
                <p className="text-white/50 text-xs truncate mt-0.5">{activeConsult.motivo}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-emerald-400 font-semibold">En llamada</span>
                  </div>
                  <a
                    href={activeConsult.enlaceTeleconsulta || 'https://meet.google.com/new'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-sky-400 hover:underline font-bold"
                  >
                    Abrir Meet Oficial ↗
                  </a>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.map((m, i) => (
                  <div key={i} className={`max-w-[85%] ${m.from === 'dr' ? 'ml-auto' : ''}`}>
                    <div
                      className={`px-3 py-2 rounded-xl text-xs ${
                        m.from === 'dr' ? 'bg-sky-600 text-white' : 'bg-white/10 text-white/90'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-white/10 flex gap-2">
                <input
                  value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMsg()}
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/10 rounded-xl text-white text-xs placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Escribir mensaje..."
                />
                <button
                  onClick={sendMsg}
                  className="px-3 py-2 bg-sky-600 text-white rounded-xl text-xs hover:bg-sky-500 transition-colors cursor-pointer"
                >
                  ↑
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulator: Call ended */}
      {callState === 'ended' && (
        <div className="bg-slate-900 rounded-2xl h-32 flex items-center justify-center gap-4 slide-up">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold" style={{ fontFamily: 'Outfit' }}>
              Sesión de teleconsulta completada
            </p>
            <p className="text-white/40 text-xs">Volviendo al panel de teleodontología...</p>
          </div>
        </div>
      )}
    </div>
  )
}
