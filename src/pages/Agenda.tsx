import { useState, useEffect, useMemo } from 'react'
import {
  getAppointments,
  getAppointmentsByDoctor,
  updateStatus,
  markAttendance,
  reschedule,
  getClinicRescheduleRequests,
  resolveRescheduleRequest,
  fetchClinicOdontologos,
} from '../services/appointmentService'
import { fetchUsersFromApi, UserItem } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'
import { Appointment, SolicitudReprogramacion } from '../types/appointment'
import AgendarCitaModal from '../components/agenda/AgendarCitaModal'
import {
  getMinDateString,
  getMaxDateString,
  toLocalDateString,
  isSundayDate,
  isSaturdayDate,
  isTodayDate,
  getAvailableSlots,
  calculateEndTime,
  validateAppointmentSchedule,
  CONFLICT_MESSAGE,
  toLimaIsoString,
  formatLimaTime,
  formatLimaDate,
  toLimaDateString,
  getLimaHourMinute,
} from '../utils/appointmentRules'

// ── Hours configuration ──────────────────────────────────────────────────────
const HOUR_START = 8
const HOUR_END   = 19
const TOTAL_H    = HOUR_END - HOUR_START
const CELL_H     = 56 // px per hour slot

// ── Colors matching the clean design from Image 1 ────────────────────────────
const PROC_COLORS: Record<string, string> = {
  'Ortodoncia':   '#7C3AED', // Purple
  'Endodoncia':   '#DC2626', // Red
  'Extracción':   '#D97706', // Orange
  'Limpieza':     '#1E8C82', // Teal
  'Restauración': '#0369A1', // Blue
  'Control':      '#059669', // Emerald
  'Urgencia':     '#BE123C', // Rose / Crimson
  'Implante':     '#9333EA', // Violet
  'Evaluación':   '#0284C7', // Sky
}

function getProcedureColor(text?: string): string {
  if (!text) return '#1E8C82'
  const lower = text.toLowerCase()
  for (const [key, color] of Object.entries(PROC_COLORS)) {
    if (lower.includes(key.toLowerCase())) return color
  }
  return '#1E8C82'
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function Icon({ d, className = 'w-4 h-4' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d={d} />
    </svg>
  )
}

function formatHourMinute(isoStr?: string): string {
  return formatLimaTime(isoStr)
}

// ── Side Drawer: Detalle y Acciones del Paciente (Matching Image 1) ───────────
function PatientPanel({
  cita,
  onClose,
  onConfirm,
  onStartAttention,
  onFinish,
  onMarkAttendance,
  onOpenReprogramar,
  onOpenCancel,
}: {
  cita: Appointment
  onClose: () => void
  onConfirm: (id: string) => Promise<void>
  onStartAttention: (id: string) => Promise<void>
  onFinish: (id: string) => Promise<void>
  onMarkAttendance: (id: string, asistencia: 'ASISTIO' | 'NO_SHOW') => Promise<void>
  onOpenReprogramar: (c: Appointment) => void
  onOpenCancel: (c: Appointment) => void
}) {
  const color = getProcedureColor(cita.motivo)
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm(cita.id)
    } finally {
      setIsConfirming(false)
    }
  }

  // Parse Date & Time con zona horaria oficial Lima
  const durationMin = (() => {
    try {
      const s = getLimaHourMinute(cita.inicioEn)
      const e = getLimaHourMinute(cita.finEn)
      return (e.hour * 60 + e.minute) - (s.hour * 60 + s.minute) || 45
    } catch {
      return 45
    }
  })()

  const capitalizedDay = (() => {
    try {
      const formatted = formatLimaDate(cita.inicioEn, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
      return formatted.charAt(0).toUpperCase() + formatted.slice(1)
    } catch {
      return 'Fecha de cita'
    }
  })()

  const statusMeta: Record<
    Appointment['estado'],
    { label: string; cls: string }
  > = {
    CONFIRMADA:   { label: 'Confirmada',   cls: 'bg-emerald-100 text-emerald-700' },
    PROGRAMADA:   { label: 'Programada',   cls: 'bg-amber-100 text-amber-700' },
    EN_ATENCION:  { label: 'En atención',  cls: 'bg-cyan-100 text-cyan-700' },
    FINALIZADA:   { label: 'Finalizada',   cls: 'bg-slate-100 text-slate-700' },
    REPROGRAMADA: { label: 'Reprogramada', cls: 'bg-purple-100 text-purple-700' },
    CANCELADA:    { label: 'Cancelada',    cls: 'bg-rose-100 text-rose-700' },
    NO_ASISTIO:   { label: 'No asistió',   cls: 'bg-slate-200 text-slate-700' },
  }

  return (
    <div className="w-80 shrink-0 flex flex-col bg-white border-l border-slate-200 shadow-xl z-20 animate-in slide-in-from-right duration-150">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0"
        style={{ backgroundColor: color + '15' }}
      >
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm truncate" style={{ fontFamily: 'Outfit' }}>
            {cita.pacienteNombreCompleto}
          </p>
          <p className="text-xs text-slate-500 font-mono">
            {cita.pacienteNumeroDocumento ? `Doc: ${cita.pacienteNumeroDocumento}` : 'Sin documento'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/50 transition-colors ml-2"
        >
          <Icon d="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Procedure box */}
        <div
          className="rounded-xl p-3.5"
          style={{ backgroundColor: color + '12', borderLeft: `3px solid ${color}` }}
        >
          <p className="font-bold text-sm" style={{ color }}>
            {cita.motivo || 'Consulta general'}
          </p>
          <p className="text-xs text-slate-600 font-medium mt-1">
            {capitalizedDay} · {formatHourMinute(cita.inicioEn)} - {formatHourMinute(cita.finEn)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {durationMin} min · {cita.consultorio || 'Sillón general'}
          </p>
        </div>

        {/* Details list */}
        <div className="space-y-2 text-xs">
          {[
            ['Doctor', cita.odontologoNombreCompleto ? `Dr. ${cita.odontologoNombreCompleto}` : 'No asignado'],
            ['Modalidad', cita.modalidad === 'VIRTUAL' ? '💻 Virtual' : '🏥 Presencial'],
            ['Teléfono', cita.pacienteTelefono || 'No registrado'],
            ['Email', cita.odontologoCorreo || ''],
          ]
            .filter(([, v]) => v)
            .map(([label, val]) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold text-slate-700 text-right max-w-[160px] truncate">{val}</span>
              </div>
            ))}

          <div className="flex justify-between py-1.5 border-b border-slate-50">
            <span className="text-slate-500">Estado</span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                statusMeta[cita.estado]?.cls || 'bg-slate-100 text-slate-600'
              }`}
            >
              {statusMeta[cita.estado]?.label || cita.estado}
            </span>
          </div>

          <div className="flex justify-between py-1.5">
            <span className="text-slate-500">Asistencia</span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                cita.estadoAsistencia === 'ASISTIO'
                  ? 'bg-emerald-100 text-emerald-800'
                  : cita.estadoAsistencia === 'NO_SHOW'
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {cita.estadoAsistencia === 'ASISTIO'
                ? '✓ Asistió'
                : cita.estadoAsistencia === 'NO_SHOW'
                ? 'No asistió (No-show)'
                : 'Pendiente'}
            </span>
          </div>
        </div>

        {cita.consultorio && (
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-xs text-slate-600 flex items-center gap-2">
            <span className="text-base">🪑</span>
            <div>
              <p className="font-semibold text-slate-700">Espacio Asignado</p>
              <p className="text-[11px] text-slate-500">{cita.consultorio}</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/50 shrink-0">
        {/* Confirmar cita (when PROGRAMADA) */}
        {cita.estado === 'PROGRAMADA' && (
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-emerald-700/20 disabled:opacity-60 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #1E8C82, #0B3D3A)' }}
          >
            {isConfirming ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Icon d="M5 13l4 4L19 7" className="w-4 h-4" />
            )}
            {isConfirming ? 'Confirmando...' : 'Confirmar cita'}
          </button>
        )}

        {/* Iniciar atención (when CONFIRMADA) */}
        {cita.estado === 'CONFIRMADA' && (
          <button
            onClick={() => onStartAttention(cita.id)}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-cyan-600/20 cursor-pointer"
          >
            <span>▶ Iniciar atención</span>
          </button>
        )}

        {/* Finalizar cita (when EN_ATENCION) */}
        {cita.estado === 'EN_ATENCION' && (
          <button
            onClick={() => onFinish(cita.id)}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-indigo-600/20 cursor-pointer"
          >
            <span>🏁 Finalizar atención</span>
          </button>
        )}

        {/* Marcar asistencia */}
        {cita.estado !== 'CANCELADA' && !cita.estadoAsistencia && (
          <div className="flex gap-2">
            <button
              onClick={() => onMarkAttendance(cita.id, 'ASISTIO')}
              className="flex-1 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-3.5 h-3.5" />
              Asistió
            </button>
            <button
              onClick={() => onMarkAttendance(cita.id, 'NO_SHOW')}
              className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              ✕ No asistió
            </button>
          </div>
        )}

        {/* Reprogramar & Cancelar */}
        {cita.estado !== 'CANCELADA' && cita.estado !== 'FINALIZADA' && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onOpenReprogramar(cita)}
              className="flex-1 py-2 text-xs font-semibold text-cyan-700 border border-cyan-200 rounded-xl hover:bg-cyan-50 transition-colors cursor-pointer"
            >
              Reprogramar
            </button>
            <button
              onClick={() => onOpenCancel(cita)}
              className="flex-1 py-2 text-xs font-semibold text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Modal Solicitudes de Reprogramación (Staff: Recepción y Admin) ────────────
function SolicitudesModal({
  isOpen,
  onClose,
  solicitudes,
  onResolve,
  isResolving,
}: {
  isOpen: boolean
  onClose: () => void
  solicitudes: SolicitudReprogramacion[]
  onResolve: (id: string, accion: 'APROBADA' | 'RECHAZADA', nota?: string) => Promise<void>
  isResolving: boolean
}) {
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectNota, setRejectNota] = useState('')

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-sm">
              🔄
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-base" style={{ fontFamily: 'Outfit' }}>
                Solicitudes de Reprogramación
              </h3>
              <p className="text-xs text-slate-500">
                Peticiones registradas por pacientes pendientes de resolución por recepción
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Icon d="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {solicitudes.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-3xl">✨</span>
              <p className="font-bold text-slate-700 text-sm mt-2" style={{ fontFamily: 'Outfit' }}>
                No hay solicitudes pendientes
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Todas las solicitudes de cambio de horario han sido atendidas.
              </p>
            </div>
          ) : (
            solicitudes.map(sol => (
              <div
                key={sol.id}
                className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-slate-800 text-sm" style={{ fontFamily: 'Outfit' }}>
                      {sol.pacienteNombreCompleto || `Cita #${sol.citaId}`}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <strong>Nuevo horario deseado:</strong>{' '}
                      {formatLimaDate(sol.nuevaFechaHoraInicio || sol.nuevoInicioDeseado)} de {formatLimaTime(sol.nuevaFechaHoraInicio || sol.nuevoInicioDeseado)} a {formatLimaTime(sol.nuevaFechaHoraFin || sol.nuevoFinDeseado)}
                    </p>
                    {sol.motivo && (
                      <p className="text-xs text-slate-600 mt-1 italic bg-white p-2 rounded-lg border border-slate-100">
                        "{sol.motivo}"
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Pendiente
                  </span>
                </div>

                {rejectId === sol.id ? (
                  <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl space-y-2">
                    <p className="text-xs font-semibold text-rose-800">Motivo del rechazo (opcional):</p>
                    <input
                      type="text"
                      value={rejectNota}
                      onChange={e => setRejectNota(e.target.value)}
                      placeholder="Ej: Sin disponibilidad en el sillón requerido..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-rose-300 rounded-lg focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setRejectId(null)
                          setRejectNota('')
                        }}
                        className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        disabled={isResolving}
                        onClick={async () => {
                          await onResolve(sol.id, 'RECHAZADA', rejectNota || 'Rechazado por recepción')
                          setRejectId(null)
                          setRejectNota('')
                        }}
                        className="px-3 py-1 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-500 disabled:opacity-50 cursor-pointer"
                      >
                        Confirmar Rechazo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2 pt-1 border-t border-slate-200/50">
                    <button
                      disabled={isResolving}
                      onClick={() => setRejectId(sol.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      Rechazar
                    </button>
                    <button
                      disabled={isResolving}
                      onClick={() => onResolve(sol.id, 'APROBADA', 'Aprobado por recepción')}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <span>✓ Aprobar y Reprogramar</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Agenda Component ─────────────────────────────────────────────────────
export default function Agenda() {
  const { role, user } = useAuth()
  const [view, setView] = useState<'week' | 'day'>('week')
  const [citas, setCitas] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<UserItem[]>([])
  const [filterDoc, setFilterDoc] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Current calendar reference date (defaults to current date)
  const [refDate, setRefDate] = useState(() => new Date())
  const [selCita, setSelCita] = useState<Appointment | null>(null)

  // Modals state
  const [showModal, setShowModal] = useState(false)
  const [prefill, setPrefill] = useState<{ date?: string; time?: string }>({})
  const [cancelCita, setCancelCita] = useState<Appointment | null>(null)
  const [cancelMotivo, setCancelMotivo] = useState('')
  const [reprogramarCita, setReprogramarCita] = useState<Appointment | null>(null)
  const [reprogFecha, setReprogFecha] = useState(getMinDateString())
  const [reprogInicio, setReprogInicio] = useState('10:00')
  const [reprogFin, setReprogFin] = useState('10:45')
  const [reprogError, setReprogError] = useState<string | null>(null)

  // Solicitudes de reprogramación (Staff)
  const [showRequestsModal, setShowRequestsModal] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<SolicitudReprogramacion[]>([])
  const [isResolvingRequest, setIsResolvingRequest] = useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // ── Calculate Week Days (Monday to Saturday, 6 business days) ──────────────
  const isSundayToday = useMemo(() => new Date().getDay() === 0, [])

  const weekDays = useMemo(() => {
    const d = new Date(refDate)
    const day = d.getDay() // 0 = Dom, 1 = Lun, etc.
    // Si la fecha es Domingo, avanzamos +1 día al Lunes entrante para mostrar la semana laboral operativa
    const diff = d.getDate() + (day === 0 ? 1 : 1 - day)
    const monday = new Date(d)
    monday.setDate(diff)

    const shortNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const result: {
      date: Date
      dateStr: string
      dayShort: string
      dayNum: number
      monthShort: string
      isToday: boolean
      isSaturday: boolean
    }[] = []

    const todayStr = getMinDateString()

    for (let i = 0; i < 6; i++) {
      const cur = new Date(monday)
      cur.setDate(monday.getDate() + i)
      const dateStr = toLocalDateString(cur)
      const monthShort = cur.toLocaleDateString('es-PE', { month: 'short' }).replace('.', '')

      result.push({
        date: cur,
        dateStr,
        dayShort: shortNames[i],
        dayNum: cur.getDate(),
        monthShort,
        isToday: dateStr === todayStr,
        isSaturday: i === 5,
      })
    }
    return result
  }, [refDate])

  // Rango de fechas formateado limpiamente (ej. '28 Set – 3 Oct 2026' o '5 – 10 Oct 2026')
  const weekRangeText = useMemo(() => {
    if (weekDays.length === 0) return ''
    const first = weekDays[0]
    const last = weekDays[weekDays.length - 1]
    const year = first.date.getFullYear()
    if (first.monthShort === last.monthShort) {
      return `${first.dayNum}–${last.dayNum} ${first.monthShort} ${year}`
    }
    return `${first.dayNum} ${first.monthShort} – ${last.dayNum} ${last.monthShort} ${year}`
  }, [weekDays])

  // Current day index when in Day view (0 to 5)
  // Por defecto se posiciona en el día actual (si está en la semana), o en el primer día hábil (0 = Lunes)
  const [dayIdx, setDayIdx] = useState(0)

  // Sincronizar dayIdx cuando cambia la semana o se detecta el día actual
  useEffect(() => {
    const todayIndex = weekDays.findIndex(d => d.isToday)
    if (todayIndex >= 0) {
      setDayIdx(todayIndex)
    }
  }, [weekDays])

  // ── Cargar Doctores ────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadDocs() {
      try {
        let users: UserItem[] = []
        try {
          users = await fetchClinicOdontologos()
        } catch {
          users = await fetchUsersFromApi()
        }
        const odon = users.filter(u => u.rol === 'ODONTOLOGO' && Boolean(u.usuarioClinicaId))
        setDoctors(odon)
        if (role === 'ODONTOLOGO' && user?.usuarioClinicaId) {
          setFilterDoc(user.usuarioClinicaId)
        }
      } catch (err) {
        if (role === 'ODONTOLOGO' && user && user.usuarioClinicaId) {
          setDoctors([{
            id: user.usuarioId || user.id,
            usuarioClinicaId: user.usuarioClinicaId,
            correo: user.correo,
            nombres: user.nombres,
            apellidos: user.apellidos,
            rol: 'ODONTOLOGO',
            estado: 'ACTIVO',
          }])
          setFilterDoc(user.usuarioClinicaId)
        } else {
          console.warn('Directorio no autorizado o no disponible para este rol:', err)
        }
      }
    }
    loadDocs()
  }, [role, user])

  // ── Cargar Solicitudes de Reprogramación (Staff: Recepción / Admin) ─────────
  const loadPendingRequests = async (silent = false) => {
    if (role !== 'ADMIN_CLINICA' && role !== 'RECEPCIONISTA') return
    try {
      const reqs = await getClinicRescheduleRequests('PENDIENTE')
      setPendingRequests(reqs)
    } catch (err) {
      if (!silent) console.warn('Error al cargar solicitudes de reprogramación:', err)
    }
  }

  const handleResolveRequest = async (id: string, accion: 'APROBADA' | 'RECHAZADA', nota?: string) => {
    setIsResolvingRequest(true)
    try {
      await resolveRescheduleRequest(id, {
        estado: accion,
        motivoResolucion: nota || (accion === 'APROBADA' ? 'Aprobado por recepción' : 'Rechazado por recepción'),
      })
      showToast(accion === 'APROBADA' ? '✓ Solicitud aprobada y cita reprogramada' : '✓ Solicitud rechazada')
      await loadPendingRequests(true)
      await loadWeekCitas(true)
    } catch (err: any) {
      const status = err.status || err.response?.status
      const msg = err.response?.data?.message || err.message
      if (status === 409 || msg?.toLowerCase().includes('conflicto') || msg?.toLowerCase().includes('solapa')) {
        showToast('⚠️ Conflicto 409: El horario ya está ocupado. Se recarga la agenda.')
        await loadWeekCitas(true)
        await loadPendingRequests(true)
      } else {
        showToast(msg || 'Error al resolver solicitud')
      }
    } finally {
      setIsResolvingRequest(false)
    }
  }

  // ── Cargar Citas para el rango de la semana (Lunes a Sábado) ───────────────
  const loadWeekCitas = async (silent = false) => {
    if (weekDays.length < 5) return
    if (!silent) setIsLoading(true)
    try {
      const desde = toLimaIsoString(weekDays[0].dateStr, '00:00')
      const hasta = toLimaIsoString(weekDays[weekDays.length - 1].dateStr, '23:59')

      let data: Appointment[] = []
      if (filterDoc) {
        data = await getAppointmentsByDoctor(filterDoc, desde, hasta)
      } else {
        data = await getAppointments(desde, hasta)
      }
      setCitas(data)
    } catch (err: any) {
      if (!silent) {
        console.warn('Error al consultar citas de Spring Boot:', err)
        showToast('Error al conectar con la agenda')
      }
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  // Sincronización y Sondeo cada 5 segundos (garantiza sincronización <= 10 s entre sesiones)
  useEffect(() => {
    loadWeekCitas()
    loadPendingRequests(true)
    const interval = setInterval(() => {
      loadWeekCitas(true)
      loadPendingRequests(true)
    }, 5000)
    return () => clearInterval(interval)
  }, [weekDays, filterDoc, role])

  // ── Filtrado por Doctor ────────────────────────────────────────────────────
  const filteredCitas = useMemo(() => {
    if (!filterDoc) return citas
    return citas.filter(c => c.odontologoId === filterDoc)
  }, [citas, filterDoc])

  // ── Navegación de Semana y Día ─────────────────────────────────────────────
  const shiftWeek = (delta: number) => {
    setRefDate(prev => {
      const next = new Date(prev)
      next.setDate(next.getDate() + delta * 7)
      return next
    })
  }

  const shiftDay = (delta: number) => {
    setDayIdx(prev => {
      const next = prev + delta
      if (next < 0) return 0
      if (next > weekDays.length - 1) return weekDays.length - 1
      return next
    })
  }

  // ── Clic en ranura horaria (Reglas de validación antes de abrir modal) ─────
  const handleSlotClick = (targetDateStr: string, hour: number) => {
    // Regla 1: Validar fecha no pasada
    const minDate = getMinDateString()
    if (targetDateStr < minDate) {
      showToast('⚠️ No se pueden programar citas en fechas pasadas')
      return
    }

    // Regla 1: Validar domingo
    if (isSundayDate(targetDateStr)) {
      showToast('⚠️ La clínica permanece cerrada los domingos')
      return
    }

    // Regla 2: Sábados cierran a las 13:00 (última cita a las 12:15)
    if (isSaturdayDate(targetDateStr) && hour >= 13) {
      showToast('⚠️ Los sábados la clínica atiende únicamente hasta las 13:00')
      return
    }

    // Regla 2: Lunes a viernes cierran a las 18:00
    if (!isSaturdayDate(targetDateStr) && hour >= 18) {
      showToast('⚠️ La clínica atiende de 08:00 a 18:00')
      return
    }

    // Regla 2: Si es hoy, verificar si la hora ya transcurrió en el reloj
    if (isTodayDate(targetDateStr)) {
      const now = new Date()
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      if (hour * 60 <= nowMinutes) {
        showToast('⚠️ Este horario ya ha transcurrido en el día de hoy')
        return
      }
    }

    const timeFormatted = `${String(hour).padStart(2, '0')}:00`
    setPrefill({
      date: targetDateStr,
      time: timeFormatted,
    })
    setShowModal(true)
  }

  // ── Acciones sobre la Cita con reconsulta inmediata ────────────────────────
  const handleConfirm = async (id: string) => {
    try {
      const updated = await updateStatus(id, 'CONFIRMADA')
      setCitas(cs => cs.map(c => (c.id === id ? updated : c)))
      setSelCita(sc => (sc && sc.id === id ? updated : sc))
      showToast('✓ Cita confirmada exitosamente')
      await loadWeekCitas(true)
    } catch (err: any) {
      showToast(err.message || 'Error al confirmar')
    }
  }

  const handleStartAttention = async (id: string) => {
    try {
      const updated = await updateStatus(id, 'EN_ATENCION')
      setCitas(cs => cs.map(c => (c.id === id ? updated : c)))
      setSelCita(sc => (sc && sc.id === id ? updated : sc))
      showToast('✓ Estado: En atención')
      await loadWeekCitas(true)
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar')
    }
  }

  const handleFinish = async (id: string) => {
    try {
      const updated = await updateStatus(id, 'FINALIZADA')
      setCitas(cs => cs.map(c => (c.id === id ? updated : c)))
      setSelCita(sc => (sc && sc.id === id ? updated : sc))
      showToast('✓ Cita finalizada')
      await loadWeekCitas(true)
    } catch (err: any) {
      showToast(err.message || 'Error al finalizar')
    }
  }

  const handleMarkAttendance = async (id: string, asistencia: 'ASISTIO' | 'NO_SHOW') => {
    try {
      const updated = await markAttendance(id, asistencia)
      setCitas(cs => cs.map(c => (c.id === id ? updated : c)))
      setSelCita(sc => (sc && sc.id === id ? updated : sc))
      showToast(asistencia === 'ASISTIO' ? '✓ Asistencia registrada (ASISTIÓ)' : '✓ Inasistencia registrada (NO_SHOW)')
      await loadWeekCitas(true)
    } catch (err: any) {
      showToast(err.message || 'Error al registrar asistencia')
    }
  }

  // Reprogramar con validación estricta y manejo de 400 y 409
  const handleExecuteReprogramar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reprogramarCita) return
    setReprogError(null)

    const validation = validateAppointmentSchedule(reprogFecha, reprogInicio, reprogFin)
    if (!validation.valid) {
      setReprogError(validation.error || 'Horario no permitido.')
      return
    }

    // Timestamps ISO oficiales con offset Lima (-05:00)
    const nuevoInicio = toLimaIsoString(reprogFecha, reprogInicio)
    const nuevoFin = toLimaIsoString(reprogFecha, reprogFin)

    try {
      const updated = await reschedule(reprogramarCita.id, nuevoInicio, nuevoFin)
      await loadWeekCitas(true)
      if (selCita?.id === reprogramarCita.id) setSelCita(updated)
      showToast('✓ Cita reprogramada correctamente')
      setReprogramarCita(null)
    } catch (err: any) {
      const status = err.status || err.response?.status
      const msg = err.response?.data?.message || err.message
      if (status === 409 || msg?.toLowerCase().includes('conflicto') || msg?.toLowerCase().includes('solapa')) {
        setReprogError(CONFLICT_MESSAGE)
        // 409 muestra conflicto y recarga, NO guarda en memoria
        await loadWeekCitas(true)
      } else if (status === 400) {
        setReprogError(msg || 'Error 400: Datos de reprogramación inválidos según las reglas de la clínica.')
      } else {
        setReprogError(msg || 'Error al reprogramar la cita')
      }
    }
  }

  const handleExecuteCancel = async () => {
    if (!cancelCita) return
    try {
      const updated = await updateStatus(cancelCita.id, 'CANCELADA', cancelMotivo)
      setCitas(cs => cs.map(c => (c.id === cancelCita.id ? updated : c)))
      if (selCita?.id === cancelCita.id) setSelCita(updated)
      showToast('✓ Cita cancelada')
      setCancelCita(null)
      await loadWeekCitas(true)
    } catch (err: any) {
      showToast(err.message || 'Error al cancelar')
    }
  }

  // Horas del día para labels (8am a 6pm/7pm)
  const hours = useMemo(() => Array.from({ length: TOTAL_H }, (_, i) => HOUR_START + i), [])

  return (
    <div className="flex h-full bg-white relative overflow-hidden fade-in">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute top-4 right-6 z-50 px-4 py-2 bg-slate-900 text-white rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in duration-150">
          <span className="w-2 h-2 rounded-full bg-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── TOOLBAR (Matching Image 1 EXACTLY) ────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 shrink-0">
          {/* View Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {(['week', 'day'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  view === v ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {v === 'week' ? 'Semana' : 'Día'}
              </button>
            ))}
          </div>

          {/* Navegación por Semana */}
          {view === 'week' && (
            <div className="flex items-center gap-1.5 ml-1">
              <button
                onClick={() => shiftWeek(-1)}
                title="Semana anterior"
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Icon d="M15 19l-7-7 7-7" className="w-3.5 h-3.5 text-slate-500" />
              </button>
              <span className="text-xs font-semibold text-slate-700 px-1">
                {weekRangeText}
              </span>
              <button
                onClick={() => shiftWeek(1)}
                title="Semana siguiente"
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Icon d="M9 5l7 7-7 7" className="w-3.5 h-3.5 text-slate-500" />
              </button>
              <button
                onClick={() => {
                  setRefDate(new Date())
                  const todayIndex = weekDays.findIndex(d => d.isToday)
                  if (todayIndex >= 0) setDayIdx(todayIndex)
                }}
                className="text-[11px] font-semibold text-slate-500 hover:text-teal-700 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hoy
              </button>
              {isSundayToday && (
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium ml-1">
                  <span>⚠️</span> Hoy es domingo (clínica cerrada) · Mostrando semana entrante
                </span>
              )}
            </div>
          )}

          {/* Navegación por Día */}
          {view === 'day' && (
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={() => shiftDay(-1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Icon d="M15 19l-7-7 7-7" className="w-3.5 h-3.5 text-slate-500" />
              </button>
              <span className="text-sm font-semibold text-slate-700 min-w-[120px] text-center">
                {weekDays[dayIdx]?.dayShort} {weekDays[dayIdx]?.dayNum} {weekDays[dayIdx]?.monthShort}
              </span>
              <button
                onClick={() => shiftDay(1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Icon d="M9 5l7 7-7 7" className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Botón de Solicitudes de Reprogramación (Recepción y Admin) */}
          {(role === 'ADMIN_CLINICA' || role === 'RECEPCIONISTA') && (
            <button
              onClick={() => setShowRequestsModal(true)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <span>🔄 Solicitudes</span>
              {pendingRequests.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-bold">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          )}

          {/* Selector de Odontólogos según Rol (D02 Odontólogo ve su agenda clínica autorizada) */}
          {role === 'ODONTOLOGO' ? (
            <div className="px-3 py-1.5 text-xs bg-teal-50 text-teal-800 font-semibold rounded-lg border border-teal-200 flex items-center gap-1.5">
              <span>🩺</span>
              <span>Dr(a). {user?.nombres} {user?.apellidos} (Mi agenda)</span>
            </div>
          ) : (
            <select
              value={filterDoc}
              onChange={e => setFilterDoc(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-600 font-medium cursor-pointer"
            >
              <option value="">Todos los doctores</option>
              {doctors.map(d => {
                const val = d.usuarioClinicaId!
                return (
                  <option key={val} value={val}>
                    Dr(a). {d.nombres} {d.apellidos}
                  </option>
                )
              })}
            </select>
          )}

          {/* Leyenda de Procedimientos (Matching Image 1) */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#7C3AED' }} />
              <span className="text-[11px] text-slate-500">Ortodoncia</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#DC2626' }} />
              <span className="text-[11px] text-slate-500">Endodoncia</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#D97706' }} />
              <span className="text-[11px] text-slate-500">Extracción</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#1E8C82' }} />
              <span className="text-[11px] text-slate-500">Limpieza</span>
            </div>
          </div>

          {/* Botón Principal: + NUEVA CITA */}
          <button
            onClick={() => {
              setPrefill({})
              setShowModal(true)
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-xl transition-all shadow-xs hover:opacity-90 active:scale-98 cursor-pointer"
            style={{ backgroundColor: '#1E8C82' }}
          >
            <Icon d="M12 4v16m8-8H4" className="w-3.5 h-3.5" />
            + Nueva cita
          </button>
        </div>

        {/* ── CALENDARIO PRINCIPAL ──────────────────────────────────────────── */}
        {view === 'week' ? (
          /* ── WEEK VIEW (Matching Image 1 Grid con soporte de Lunes a Sábado) ─ */
          <div className="flex-1 overflow-auto bg-white">
            <div className="min-w-[840px] h-full flex flex-col">
              {/* Day Headers (Sticky) */}
              <div
                className="grid sticky top-0 z-10 bg-white border-b border-slate-200"
                style={{ gridTemplateColumns: `52px repeat(${weekDays.length}, 1fr)` }}
              >
                <div className="px-2 py-3" />
                {weekDays.map(d => (
                  <div
                    key={d.dateStr}
                    className={`px-2 py-2.5 text-center border-l border-slate-100 transition-colors ${
                      d.isToday ? 'bg-teal-50/60 ring-1 ring-inset ring-teal-500/30' : d.isSaturday ? 'bg-slate-50/50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <p className={`text-xs ${d.isToday ? 'text-teal-700 font-bold' : 'text-slate-500'}`}>
                        {d.dayShort}
                      </p>
                      {d.isToday && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-teal-600 text-white px-1.5 py-0.5 rounded-full">
                          Hoy
                        </span>
                      )}
                    </div>
                    <p className={`font-bold text-base mt-0.5 ${d.isToday ? 'text-teal-900' : 'text-slate-800'}`}>
                      {d.dayNum}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {d.isSaturday ? '08h-13h' : d.monthShort}
                    </p>
                  </div>
                ))}
              </div>

              {/* Grid Lines & Appointment Cards */}
              <div
                className="relative grid flex-1"
                style={{ gridTemplateColumns: `52px repeat(${weekDays.length}, 1fr)`, minHeight: TOTAL_H * CELL_H }}
              >
                {/* Time Labels Column */}
                <div>
                  {hours.map(h => (
                    <div
                      key={h}
                      className="flex items-start justify-end pr-2 text-[10px] text-slate-400 font-medium"
                      style={{ height: CELL_H }}
                    >
                      {String(h).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Day Columns */}
                {weekDays.map((d) => {
                  // Filtrar citas que pertenecen a este día según hora Lima
                  const dayCitas = filteredCitas.filter(c => {
                    const citaDate = toLimaDateString(c.inicioEn)
                    return citaDate === d.dateStr && c.estado !== 'CANCELADA'
                  })

                  return (
                    <div
                      key={d.dateStr}
                      className={`relative border-l border-slate-100 ${d.isToday ? 'bg-teal-50/15' : ''}`}
                      style={{ height: TOTAL_H * CELL_H }}
                    >
                      {/* Hour Slot Clickable Rows */}
                      {hours.map(h => {
                        const isSatClosed = d.isSaturday && h >= 13
                        const isWeekdayClosed = !d.isSaturday && h >= 18
                        const isClosed = isSatClosed || isWeekdayClosed

                        return (
                          <div
                            key={h}
                            onClick={() => handleSlotClick(d.dateStr, h)}
                            className={`border-b border-slate-100 transition-colors ${
                              isClosed
                                ? 'bg-slate-50/70 cursor-not-allowed select-none'
                                : 'hover:bg-slate-50/60 cursor-pointer'
                            }`}
                            style={{ height: CELL_H }}
                            title={
                              isClosed
                                ? `Cerrado (${d.isSaturday ? 'Sábados atención hasta 13:00' : 'Atención hasta 18:00'})`
                                : `Clic para agendar cita a las ${String(h).padStart(2, '0')}:00`
                            }
                          >
                            {isClosed && (
                              <span className="text-[9px] text-slate-300 font-medium px-1.5 py-0.5 block select-none">
                                Cerrado
                              </span>
                            )}
                          </div>
                        )
                      })}

                      {/* Render Appointment Cards directly on grid (Image 1 Style) */}
                      {dayCitas.map(c => {
                        const { hour: startH, minute: startM } = getLimaHourMinute(c.inicioEn)
                        const { hour: endH, minute: endM } = getLimaHourMinute(c.finEn)
                        const duration = (endH * 60 + endM) - (startH * 60 + startM) || 45

                        const topPct =
                          (((startH - HOUR_START) + startM / 60) / TOTAL_H) * 100
                        const heightPx = (duration / 60) * CELL_H
                        const color = getProcedureColor(c.motivo)

                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              setSelCita(c)
                            }}
                            className="absolute left-1 right-1 rounded-lg overflow-hidden text-left shadow-2xs hover:shadow-md transition-all group z-10 cursor-pointer"
                            style={{
                              top: `${topPct}%`,
                              height: Math.max(heightPx - 4, 24),
                              backgroundColor: color + '20',
                              borderLeft: `3px solid ${color}`,
                            }}
                          >
                            <div className="px-1.5 py-1 min-w-0">
                              <p
                                className="text-[10px] font-bold leading-tight truncate"
                                style={{ color }}
                              >
                                {c.motivo || 'Consulta general'}
                              </p>
                              <p className="text-[9px] text-slate-600 truncate mt-0.5">
                                {c.pacienteNombreCompleto}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ── DAY VIEW (Matching Image 1 Single Day) ────────────────────── */
          <div className="flex-1 overflow-auto bg-white">
            <div className="min-w-0">
              {/* Day Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800 text-sm flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
                    {weekDays[dayIdx]?.isToday && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-600 text-white px-2 py-0.5 rounded-full">
                        Hoy
                      </span>
                    )}
                    <span>
                      {weekDays[dayIdx]?.dayShort}, {weekDays[dayIdx]?.dayNum} de {weekDays[dayIdx]?.monthShort}{' '}
                      {weekDays[dayIdx]?.date.getFullYear()}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">
                    {
                      filteredCitas.filter(
                        c =>
                          c.inicioEn &&
                          c.inicioEn.substring(0, 10) === weekDays[dayIdx]?.dateStr &&
                          c.estado !== 'CANCELADA'
                      ).length
                    }{' '}
                    citas programadas ({weekDays[dayIdx]?.isSaturday ? 'Horario sábado: 08:00 - 13:00' : 'Horario regular: 08:00 - 18:00'})
                  </p>
                </div>
              </div>

              {/* Day Grid */}
              <div
                className="relative grid"
                style={{ gridTemplateColumns: '56px 1fr', minHeight: TOTAL_H * CELL_H }}
              >
                <div>
                  {hours.map(h => (
                    <div
                      key={h}
                      className="flex items-start justify-end pr-2 pt-1 text-[10px] text-slate-400 font-medium"
                      style={{ height: CELL_H + 12 }}
                    >
                      {String(h).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                <div
                  className="relative border-l border-slate-100"
                  style={{ height: TOTAL_H * (CELL_H + 12) }}
                >
                  {hours.map(h => {
                    const curDay = weekDays[dayIdx]
                    const isSatClosed = curDay?.isSaturday && h >= 13
                    const isWeekdayClosed = !curDay?.isSaturday && h >= 18
                    const isClosed = isSatClosed || isWeekdayClosed

                    return (
                      <div
                        key={h}
                        onClick={() => handleSlotClick(curDay?.dateStr, h)}
                        className={`border-b border-slate-100 transition-colors ${
                          isClosed
                            ? 'bg-slate-50/70 cursor-not-allowed select-none'
                            : 'hover:bg-slate-50/50 cursor-pointer'
                        }`}
                        style={{ height: CELL_H + 12 }}
                        title={
                          isClosed
                            ? `Cerrado (${curDay?.isSaturday ? 'Sábados cierran 13:00' : 'Cierre 18:00'})`
                            : `Clic para agendar a las ${String(h).padStart(2, '0')}:00`
                        }
                      >
                        {isClosed && (
                          <span className="text-[10px] text-slate-300 font-medium px-3 py-1 block select-none">
                            Cerrado
                          </span>
                        )}
                      </div>
                    )
                  })}

                  {filteredCitas
                    .filter(
                      c =>
                        toLimaDateString(c.inicioEn) === weekDays[dayIdx]?.dateStr &&
                        c.estado !== 'CANCELADA'
                    )
                    .map(c => {
                      const { hour: startH, minute: startM } = getLimaHourMinute(c.inicioEn)
                      const { hour: endH, minute: endM } = getLimaHourMinute(c.finEn)
                      const duration = (endH * 60 + endM) - (startH * 60 + startM) || 45

                      const top =
                        (((startH - HOUR_START) + startM / 60) / TOTAL_H) * 100
                      const h = (duration / 60) * (CELL_H + 12)
                      const col = getProcedureColor(c.motivo)

                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            setSelCita(c)
                          }}
                          className="absolute left-3 right-3 rounded-xl overflow-hidden text-left shadow-2xs hover:shadow-md transition-all cursor-pointer"
                          style={{
                            top: `${top}%`,
                            height: Math.max(h - 4, 32),
                            backgroundColor: col + '18',
                            borderLeft: `4px solid ${col}`,
                          }}
                        >
                          <div className="px-3 py-2">
                            <p className="text-xs font-bold leading-tight" style={{ color: col }}>
                              {c.motivo || 'Consulta general'}
                            </p>
                            <p className="text-xs text-slate-700 font-medium mt-0.5">
                              {c.pacienteNombreCompleto}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {formatHourMinute(c.inicioEn)} - {formatHourMinute(c.finEn)} · {duration} min ·{' '}
                              Dr. {c.odontologoNombreCompleto || 'Asignado'} · {c.consultorio || 'Sillón'}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── PATIENT SIDE PANEL (Matching Image 1) ──────────────────────────── */}
      {selCita && (
        <PatientPanel
          cita={selCita}
          onClose={() => setSelCita(null)}
          onConfirm={handleConfirm}
          onStartAttention={handleStartAttention}
          onFinish={handleFinish}
          onMarkAttendance={handleMarkAttendance}
          onOpenReprogramar={c => {
            setReprogramarCita(c)
            const citaDateStr = toLimaDateString(c.inicioEn) || getMinDateString()
            const validDate = citaDateStr < getMinDateString() ? getMinDateString() : citaDateStr
            setReprogFecha(validDate)
            const initH = formatHourMinute(c.inicioEn)
            setReprogInicio(initH)
            setReprogFin(calculateEndTime(initH, 45))
            setReprogError(null)
          }}
          onOpenCancel={c => {
            setCancelCita(c)
            setCancelMotivo('')
          }}
        />
      )}

      {/* ── MODAL AGENDAR CITA (Connected with strict rules 1-5) ─────────────── */}
      {showModal && (
        <AgendarCitaModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          initialDate={prefill.date || weekDays[0]?.dateStr}
          initialTime={prefill.time || '10:00'}
          initialDoctorId={filterDoc || undefined}
          onSuccess={nuevaCita => {
            showToast('✓ Cita agendada exitosamente')
            loadWeekCitas(true)
            setShowModal(false)
          }}
          onConflict={() => {
            loadWeekCitas(true)
          }}
        />
      )}

      {/* ── MODAL SOLICITUDES DE REPROGRAMACIÓN (Staff: Recepción y Admin) ──────── */}
      {showRequestsModal && (
        <SolicitudesModal
          isOpen={showRequestsModal}
          onClose={() => setShowRequestsModal(false)}
          solicitudes={pendingRequests}
          onResolve={handleResolveRequest}
          isResolving={isResolvingRequest}
        />
      )}

      {/* ── MODAL REPROGRAMAR (Reglas de negocio 1, 2, 3 y 5 aplicadas) ─────── */}
      {reprogramarCita && (() => {
        const reprogSlotData = getAvailableSlots(reprogFecha)
        const isReprogSunday = reprogSlotData.isSunday
        const reprogSlots = reprogSlotData.slots

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)' }}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-700 flex items-center justify-center font-bold text-sm">
                    🔄
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base" style={{ fontFamily: 'Outfit' }}>
                      Reprogramar Horario de Cita
                    </h3>
                    <p className="text-xs text-slate-500">
                      {reprogramarCita.pacienteNombreCompleto} · {reprogramarCita.motivo || 'Consulta'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReprogramarCita(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Icon d="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
                </button>
              </div>

              {/* Feedback de error 400 o 409 */}
              {reprogError && (
                <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 text-xs text-rose-800 mt-3 flex items-start gap-2 animate-in fade-in">
                  <span className="font-bold text-rose-600">⚠</span>
                  <div className="flex-1">
                    <p className="font-bold text-rose-950">Aviso de Validación</p>
                    <p className="mt-0.5">{reprogError}</p>
                  </div>
                </div>
              )}

              {/* Advertencia si selecciona Domingo */}
              {isReprogSunday && (
                <div className="bg-amber-100 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 mt-3 flex items-start gap-2">
                  <span className="font-bold text-amber-700">⚠️</span>
                  <div>
                    <p className="font-bold">La clínica permanece cerrada los domingos.</p>
                    <p className="text-amber-800 text-[11px] mt-0.5">Selecciona un día entre lunes y sábado.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleExecuteReprogramar} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nueva Fecha <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={getMinDateString()}
                    max={getMaxDateString()}
                    value={reprogFecha}
                    onChange={e => {
                      setReprogFecha(e.target.value)
                      setReprogError(null)
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Rango permitido: Hoy a +90 días (Lunes a Sábado).
                  </p>
                </div>

                {!isReprogSunday && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Hora Inicio <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={reprogInicio}
                        onChange={e => {
                          const newStart = e.target.value
                          setReprogInicio(newStart)
                          setReprogFin(calculateEndTime(newStart, 45))
                          setReprogError(null)
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                      >
                        {reprogSlots.map(s => (
                          <option key={s.time} value={s.time} disabled={s.isPast}>
                            {s.label} {s.isPast ? '(Pasado)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Hora Fin (+45 min)
                      </label>
                      <input
                        type="time"
                        readOnly
                        value={reprogFin}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-100 text-slate-700 font-semibold cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setReprogramarCita(null)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isReprogSunday || !reprogInicio}
                    className="px-4 py-2 text-white rounded-xl text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors cursor-pointer"
                    style={{ backgroundColor: '#1E8C82' }}
                  >
                    Guardar Nuevo Horario
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      })()}

      {/* ── MODAL CANCELAR CITA ──────────────────────────────────────────────── */}
      {cancelCita && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)' }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
            <h3 className="font-bold text-slate-900 text-base" style={{ fontFamily: 'Outfit' }}>
              Cancelar Cita
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              ¿Estás seguro de cancelar la cita de{' '}
              <strong>{cancelCita.pacienteNombreCompleto}</strong>?
            </p>

            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Motivo de Cancelación (opcional)
              </label>
              <textarea
                rows={2}
                value={cancelMotivo}
                onChange={e => setCancelMotivo(e.target.value)}
                placeholder="Ej: Paciente solicitó cancelación / reprogramación..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs resize-none focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelCita(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                No, mantener cita
              </button>
              <button
                type="button"
                onClick={handleExecuteCancel}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-500 shadow-sm transition-colors cursor-pointer"
              >
                Sí, cancelar cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
