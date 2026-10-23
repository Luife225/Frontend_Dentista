import { useEffect, useState, useRef } from "react"
import {
  joinTeleconsultation,
  closeTeleconsultation,
  type TeleconsultationJoinResponse,
} from "../../services/teleconsultationService"

interface TeleconsultationRoomProps {
  citaId: string
  isDoctorView?: boolean
  patientName?: string
  onHangUp?: () => void
  onCloseSession?: () => void
  onToggleMinimize?: () => void
  isMinimized?: boolean
}

export default function TeleconsultationRoom({
  citaId,
  isDoctorView = false,
  patientName,
  onHangUp,
  onCloseSession,
  onToggleMinimize,
  isMinimized = false,
}: TeleconsultationRoomProps) {
  const [session, setSession] = useState<TeleconsultationJoinResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const timerRef = useRef<number | null>(null)

  async function initSession() {
    setLoading(true)
    setError(null)
    try {
      const data = await joinTeleconsultation(citaId)
      setSession(data)
    } catch (err: any) {
      setError(err.message || "No fue posible unirse a la sala de teleconsulta")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void initSession()
  }, [citaId])

  useEffect(() => {
    if (session && !timerRef.current) {
      timerRef.current = window.setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [session])

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  async function handleCloseRoom() {
    if (!window.confirm("¿Seguro que deseas finalizar y cerrar la sala de teleconsulta? Los participantes ya no podrán ingresar.")) {
      return
    }
    setClosing(true)
    try {
      await closeTeleconsultation(citaId)
      if (onCloseSession) {
        onCloseSession()
      } else if (onHangUp) {
        onHangUp()
      }
    } catch (err: any) {
      alert("Error al cerrar sala: " + err.message)
    } finally {
      setClosing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900 text-white rounded-2xl min-h-[300px] space-y-3">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-200">Autenticando y conectando a sala segura…</p>
        <p className="text-xs text-slate-400">Verificando autorización y token JWT de teleconsulta</p>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="p-6 bg-slate-900 border border-rose-900/60 rounded-2xl text-white space-y-4">
        <div className="flex items-center gap-3 text-rose-400">
          <span className="text-2xl">⚠</span>
          <div>
            <h3 className="font-bold text-sm">Error al conectar con la teleconsulta</h3>
            <p className="text-xs text-slate-300 mt-0.5">{error}</p>
          </div>
        </div>
        <div className="p-3 bg-slate-800/80 rounded-xl text-xs text-slate-300 space-y-1">
          <p className="font-semibold text-cyan-400">Requisitos de infraestructura local:</p>
          <p>La teleconsulta requiere que el stack de Jitsi Meet con Docker esté ejecutándose en esta computadora.</p>
          <p className="text-[11px] font-mono text-slate-400">Servidor configurado: {session?.jitsiServerUrl || "https://localhost:8443"}</p>
        </div>
        <div className="flex gap-2 justify-end">
          {onHangUp && (
            <button
              onClick={onHangUp}
              className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold hover:bg-slate-800"
            >
              Cerrar panel
            </button>
          )}
          <button
            onClick={initSession}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-xs font-semibold text-white shadow-sm"
          >
            Reintentar conexión
          </button>
        </div>
      </div>
    )
  }

  // URL del iframe seguro con JWT y parámetros de configuración
  const effectiveJwt = session.token || session.jwtToken || ""
  const iframeSrc = `${session.jitsiServerUrl}/${session.salaId}?jwt=${effectiveJwt}#config.prejoinPageEnabled=false&config.disableDeepLinking=true&config.startWithAudioMuted=false&config.startWithVideoMuted=false`

  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 w-72 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-3 text-white flex items-center justify-between animate-in slide-in-from-bottom-5">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          <div>
            <p className="text-xs font-bold truncate max-w-[140px]">
              {patientName ? `Llamada: ${patientName}` : "Teleconsulta en curso"}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">{formatDuration(callDuration)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              title="Expandir llamada"
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white"
            >
              ⤢
            </button>
          )}
          {onHangUp && (
            <button
              onClick={onHangUp}
              title="Colgar y salir"
              className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl h-full">
      {/* Barra de control superior */}
      <div className="bg-slate-900/90 backdrop-blur-xs px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                Teleconsulta Integrada
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-cyan-400 border border-cyan-800/60 rounded">
                Sala: {session.salaId}
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded">
                JWT Autenticado
              </span>
            </div>
            {patientName && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                Paciente: <strong>{patientName}</strong> · Rol: {session.rol}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2 py-1 rounded-lg">
            ⏱ {formatDuration(callDuration)}
          </span>

          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              title="Minimizar llamada a esquina flotante"
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              ⤡ Minimizar
            </button>
          )}

          {onHangUp && (
            <button
              onClick={onHangUp}
              title="Salir de la llamada sin cerrar la sala"
              className="px-3 py-1 bg-amber-600/90 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Colgar / Salir
            </button>
          )}

          {isDoctorView && session.esModerador && (
            <button
              disabled={closing}
              onClick={handleCloseRoom}
              title="Finaliza y cierra la sesión de teleconsulta para todos los participantes"
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              {closing ? "Cerrando..." : "Finalizar sala"}
            </button>
          )}
        </div>
      </div>

      {/* Contenedor del video con iframe seguro */}
      <div className="flex-1 relative bg-black min-h-[420px]">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-2 pointer-events-none">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs">Estableciendo flujo multimedia y verificando sala segura…</p>
          </div>
        )}
        <iframe
          src={iframeSrc}
          allow="camera; microphone; display-capture; autoplay; clipboard-write"
          className="w-full h-full border-0 absolute inset-0"
          title={`Teleconsulta Sala ${session.salaId}`}
          onLoad={() => setIframeLoaded(true)}
        />
      </div>

      {/* Pie de llamada informativo */}
      <div className="bg-slate-900/70 px-4 py-2 text-[11px] text-slate-400 border-t border-slate-800 flex justify-between items-center">
        <span>🔒 Sesión cifrada localmente · Sin acceso anónimo ni invitados no autorizados</span>
        <span className="font-mono text-slate-500">ID Cita #{citaId}</span>
      </div>
    </div>
  )
}
