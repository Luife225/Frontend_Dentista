import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import coronixLogo from '../imports/coronixlogo.png'
import {
  getMyAppointments,
  createMyAppointment,
  requestReschedule,
  getMyRescheduleRequests,
  cancelRescheduleRequest,
  updateStatus,
} from '../services/appointmentService'
import { fetchUsersFromApi, UserItem } from '../services/authService'
import { Appointment, SolicitudReprogramacion } from '../types/appointment'
import {
  getMyAttachments,
  downloadAttachmentBlob,
  uploadAttachment,
  formatFileSize,
  type AttachmentDto,
} from '../services/attachmentService'
import {
  fetchMyPatientProfile,
  updateMyPatientProfile,
  type BackendPatientDto,
} from '../services/patientService'
import AttachmentViewerModal from '../components/features/AttachmentViewerModal'
import {
  getMinDateString,
  getMaxDateString,
  getAvailableSlots,
  calculateEndTime,
  validateAppointmentSchedule,
  CONFLICT_MESSAGE,
  toLimaIsoString,
  formatLimaTime,
  formatLimaDate,
  CONSULTORIOS,
} from '../utils/appointmentRules'

type Tab = 'inicio' | 'agenda' | 'tratamientos' | 'documentos' | 'perfil'

// ── Brand ─────────────────────────────────────────────────────────────────────
function CxLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <defs>
        <linearGradient id="ptG" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5FC9BE"/>
          <stop offset="100%" stopColor="#0B3D3A"/>
        </linearGradient>
      </defs>
      <path d="M27 5.5 A13.5 13.5 0 1 0 27 30.5" stroke="url(#ptG)" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <circle cx="28.5" cy="4.5" r="1.6" fill="#5FC9BE"/>
      <circle cx="31.5" cy="7.5" r="1" fill="#5FC9BE" opacity="0.55"/>
      <path d="M18 11 C15.5 11 13.5 13 13.5 15.8 L14 22.8 C14.1 23.7 14.7 24.2 15.6 24.2 C16.5 24.2 17 23.4 18 23.4 C19 23.4 19.5 24.2 20.4 24.2 C21.3 24.2 21.9 23.7 22 22.8 L22.5 15.8 C22.5 13 20.5 11 18 11 Z" fill="url(#ptG)" opacity="0.92"/>
      <polyline points="14,12 15.2,8.5 18,11 20.8,8.5 22,12" stroke="#5FC9BE" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function Icon({ d, className = 'w-4 h-4' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d={d}/>
    </svg>
  )
}

const MOTIVOS_PACIENTE = [
  'Evaluación y diagnóstico inicial',
  'Limpieza dental profiláctica',
  'Dolor dental agudo / Urgencia',
  'Control de tratamiento',
  'Consulta de ortodoncia',
  'Extracción dental',
  'Restauración estética',
]

function fmt(n: number) { return new Intl.NumberFormat('es-PE', { style:'currency', currency:'PEN', maximumFractionDigits:0 }).format(n) }
function fmtDate(iso: string) { return formatLimaDate(iso) }

// ── Modal Solicitar Reprogramación (Paciente) ──────────────────────────────────
function ModalSolicitarReprogramacion({
  cita,
  onClose,
  onSuccess,
}: {
  cita: Appointment
  onClose: () => void
  onSuccess: () => void
}) {
  const [fecha, setFecha] = useState(() => getMinDateString())
  const [horaInicio, setHoraInicio] = useState('10:00')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const slotData = useMemo(() => getAvailableSlots(fecha), [fecha])
  const { slots, isSunday } = slotData
  const horaFin = useMemo(() => calculateEndTime(horaInicio, 45) || '10:45', [horaInicio])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validation = validateAppointmentSchedule(fecha, horaInicio, horaFin)
    if (!validation.valid) {
      setError(validation.error || 'Horario no permitido.')
      return
    }

    const nuevoInicioDeseado = toLimaIsoString(fecha, horaInicio)
    const nuevoFinDeseado = toLimaIsoString(fecha, horaFin)

    setIsSubmitting(true)
    try {
      await requestReschedule(cita.id, {
        nuevaFechaHoraInicio: nuevoInicioDeseado,
        nuevaFechaHoraFin: nuevoFinDeseado,
        motivo: motivo.trim() || 'Solicitud de cambio de horario',
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message
      setError(msg || 'Error al enviar solicitud de reprogramación')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-base" style={{ fontFamily: 'Outfit' }}>
              Solicitar Cambio de Horario
            </h3>
            <p className="text-xs text-slate-400">
              Cita: {cita.motivo || 'Consulta'} · Dr(a). {cita.odontologoNombreCompleto || 'Asignado'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs mt-3 flex items-start gap-2">
            <span>⚠</span>
            <div className="flex-1">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Nueva Fecha Deseada</label>
            <input
              type="date"
              required
              min={getMinDateString()}
              max={getMaxDateString()}
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </div>

          {isSunday ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl">
              La clínica permanece cerrada los domingos. Por favor selecciona otro día.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Hora Inicio</label>
                <select
                  value={horaInicio}
                  onChange={e => setHoraInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                >
                  {slots.map(s => (
                    <option key={s.time} value={s.time} disabled={s.isPast}>
                      {s.label} {s.isPast ? '(Pasado)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Hora Fin (+45m)</label>
                <input
                  type="text"
                  readOnly
                  value={horaFin}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-500 font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Motivo del cambio</label>
            <textarea
              rows={2}
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Indica la razón por la que solicitas el cambio de horario..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSunday}
              className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold hover:bg-cyan-500 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal Solicitar Cita (Conectado a F04-A /me/citas) ──────────────────────────
function ModalCita({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState(1)
  const [doctors, setDoctors] = useState<UserItem[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [form, setForm] = useState({
    modality: 'Presencial',
    doctorClinicaId: '',
    motivo: '',
    date: getMinDateString(),
    time: '09:00',
    notes: '',
  })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Cargar odontólogos reales autorizados con usuarioClinicaId
  useEffect(() => {
    async function loadDocs() {
      setLoadingDoctors(true)
      try {
        const users = await fetchUsersFromApi()
        const odon = users.filter(u => u.rol === 'ODONTOLOGO' && Boolean(u.usuarioClinicaId))
        setDoctors(odon)
        if (odon.length > 0) {
          setForm(f => ({ ...f, doctorClinicaId: odon[0].usuarioClinicaId! }))
        }
      } catch (err) {
        console.warn('Error al cargar doctores:', err)
      } finally {
        setLoadingDoctors(false)
      }
    }
    loadDocs()
  }, [])

  const slotData = useMemo(() => getAvailableSlots(form.date), [form.date])
  const { slots, isSunday } = slotData
  const endTime = useMemo(() => calculateEndTime(form.time, 45) || '09:45', [form.time])

  // Ajustar hora si el slot actual es pasado o domingo
  useEffect(() => {
    if (!isSunday && slots.length > 0) {
      const valid = slots.find(s => !s.isPast)
      if (valid && (!form.time || slots.find(s => s.time === form.time)?.isPast)) {
        setForm(f => ({ ...f, time: valid.time }))
      }
    }
  }, [form.date, slots, isSunday])

  const selectedDoctorObj = useMemo(
    () => doctors.find(d => d.usuarioClinicaId === form.doctorClinicaId),
    [doctors, form.doctorClinicaId]
  )

  async function submit() {
    setError(null)
    if (!form.doctorClinicaId) {
      setError('Por favor selecciona un profesional odontólogo')
      return
    }

    const validation = validateAppointmentSchedule(form.date, form.time, endTime)
    if (!validation.valid) {
      setError(validation.error || 'Horario inválido.')
      return
    }

    const inicioEn = toLimaIsoString(form.date, form.time)
    const finEn = toLimaIsoString(form.date, endTime)

    setIsSubmitting(true)
    try {
      await createMyAppointment({
        odontologoId: form.doctorClinicaId,
        inicioEn,
        finEn,
        modalidad: form.modality === 'Virtual' ? 'VIRTUAL' : 'PRESENCIAL',
        motivo: form.motivo || form.notes || 'Consulta general odontológica',
        consultorio: CONSULTORIOS[0],
      })
      setSent(true)
      onSuccess()
      setTimeout(() => {
        setSent(false)
        onClose()
      }, 1600)
    } catch (err: any) {
      const status = err.status || err.response?.status
      const msg = err.response?.data?.message || err.message
      if (status === 409 || msg?.toLowerCase().includes('conflicto') || msg?.toLowerCase().includes('solapa')) {
        setError(CONFLICT_MESSAGE)
        // 409: no guarda en memoria y recarga
        onSuccess()
      } else {
        setError(msg || 'Error al procesar la cita')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800 text-base" style={{fontFamily:'Outfit'}}>Solicitar cita dental</h2>
            {!sent && <p className="text-xs text-slate-400 mt-0.5">Paso {step} de 3</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5"/>
          </button>
        </div>

        {sent ? (
          <div className="px-6 py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-200">
              <Icon d="M5 13l4 4L19 7" className="w-7 h-7 text-emerald-600"/>
            </div>
            <p className="font-bold text-slate-800 text-lg mb-1" style={{fontFamily:'Outfit'}}>¡Cita solicitada exitosamente!</p>
            <p className="text-slate-500 text-sm">Registrada en la agenda oficial de la clínica.</p>
          </div>
        ) : (
          <>
            {/* Step progress */}
            <div className="flex px-6 pt-4 gap-2">
              {[1,2,3].map(s => (
                <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= step ? 'bg-cyan-500' : 'bg-slate-100'}`}/>
              ))}
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                <span>⚠</span>
                <span className="flex-1">{error}</span>
              </div>
            )}

            <div className="px-6 py-5 space-y-4">
              {step === 1 && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-2">Modalidad de atención</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Presencial','Virtual'].map(m => (
                        <button key={m} onClick={() => setForm(f => ({...f, modality:m}))}
                          className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer ${form.modality === m ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                          {m === 'Presencial' ? '🏥' : '💻'} {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-2">Odontólogo tratante</label>
                    {loadingDoctors ? (
                      <p className="text-xs text-slate-400">Cargando profesionales...</p>
                    ) : (
                      <select
                        value={form.doctorClinicaId}
                        onChange={e => setForm(f=>({...f, doctorClinicaId:e.target.value}))}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 bg-white"
                      >
                        {doctors.map(d => (
                          <option key={d.usuarioClinicaId!} value={d.usuarioClinicaId!}>
                            Dr(a). {d.nombres} {d.apellidos}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-2">Motivo de consulta</label>
                    <select
                      value={form.motivo}
                      onChange={e => setForm(f=>({...f, motivo:e.target.value}))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 bg-white"
                    >
                      <option value="">Selecciona un motivo frecuente...</option>
                      {MOTIVOS_PACIENTE.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-2">Fecha preferida</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => {
                        setForm(f=>({...f, date:e.target.value}))
                        setError(null)
                      }}
                      min={getMinDateString()}
                      max={getMaxDateString()}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    />
                  </div>
                  {isSunday ? (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl">
                      La clínica permanece cerrada los domingos. Por favor selecciona una fecha entre lunes y sábado.
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-2">
                        Horarios disponibles (Lima UTC-5, duración 45 min)
                      </label>
                      <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-1">
                        {slots.map(s => (
                          <button
                            key={s.time}
                            disabled={s.isPast}
                            onClick={() => {
                              setForm(f=>({...f, time:s.time}))
                              setError(null)
                            }}
                            className={`py-2 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                              form.time === s.time
                                ? 'bg-cyan-500 border-cyan-500 text-white font-bold'
                                : s.isPast
                                ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                : 'border-slate-200 text-slate-600 hover:border-cyan-300 hover:text-cyan-600'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {step === 3 && (
                <>
                  {/* Summary */}
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2.5 border border-slate-100">
                    {[
                      ['Modalidad', form.modality],
                      ['Odontólogo', selectedDoctorObj ? `Dr(a). ${selectedDoctorObj.nombres} ${selectedDoctorObj.apellidos}` : '—'],
                      ['Motivo', form.motivo || 'Consulta general'],
                      ['Fecha', form.date ? formatLimaDate(form.date) : '—'],
                      ['Horario', `${form.time} - ${endTime}`],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between text-sm">
                        <span className="text-slate-500">{l}</span>
                        <span className="font-semibold text-slate-800">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-2">Observaciones o síntomas (opcional)</label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm(f=>({...f, notes:e.target.value}))}
                      rows={2}
                      placeholder="Ej: molestia al masticar en el lado izquierdo..."
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 pb-5 flex gap-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(s => s - 1)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Atrás
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  disabled={isSunday}
                  onClick={() => setStep(s => s + 1)}
                  className="flex-1 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Continuar
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting || isSunday}
                  onClick={submit}
                  className="flex-1 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Agendando...' : 'Confirmar y agendar cita'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── NAV ───────────────────────────────────────────────────────────────────────
const NAV: Array<{ id: Tab; label: string; iconPath: string }> = [
  { id:'inicio',       label:'Inicio',           iconPath:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id:'agenda',       label:'Mi agenda',         iconPath:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id:'tratamientos', label:'Mis tratamientos',  iconPath:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { id:'documentos',   label:'Documentos y Radiografías', iconPath:'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id:'perfil',       label:'Mi perfil',         iconPath:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
]

// ── TAB SECTIONS ──────────────────────────────────────────────────────────────

function TabInicio({
  appointments,
  onRequestAppt,
  onNavigate,
}: {
  appointments: Appointment[]
  onRequestAppt: () => void
  onNavigate: (tab: Tab) => void
}) {
  const nextAppt = useMemo(() => {
    const active = appointments.filter(a => a.estado !== 'CANCELADA' && a.estado !== 'FINALIZADA')
    active.sort((a, b) => (a.inicioEn || '').localeCompare(b.inicioEn || ''))
    return active[0] || null
  }, [appointments])

  return (
    <div className="space-y-6">
      {/* Next appointment hero card */}
      {nextAppt ? (
        <div
          className="rounded-2xl p-6 text-white relative overflow-hidden shadow-lg"
          style={{ background: 'linear-gradient(135deg, #0B3D3A, #1E8C82)' }}
        >
          <div className="absolute right-4 top-4 text-6xl opacity-10">🦷</div>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-3" style={{ fontFamily: 'Outfit' }}>
            Próxima cita programada
          </p>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold mb-1" style={{ fontFamily: 'Outfit' }}>
                {nextAppt.motivo || 'Consulta odontológica'}
              </p>
              <p className="text-white/80 text-sm">
                {nextAppt.odontologoNombreCompleto ? `Dr(a). ${nextAppt.odontologoNombreCompleto}` : 'Odontólogo asignado'} · {nextAppt.consultorio || 'Sillón general'}
              </p>
              <div className="flex items-center gap-3 mt-4">
                <div className="bg-white/15 rounded-lg px-3 py-1.5">
                  <p className="text-[10px] text-white/60 font-medium">Fecha</p>
                  <p className="text-sm font-bold">{formatLimaDate(nextAppt.inicioEn)}</p>
                </div>
                <div className="bg-white/15 rounded-lg px-3 py-1.5">
                  <p className="text-[10px] text-white/60 font-medium">Horario (Lima)</p>
                  <p className="text-sm font-bold">
                    {formatLimaTime(nextAppt.inicioEn)} - {formatLimaTime(nextAppt.finEn)}
                  </p>
                </div>
                <div className="bg-white/15 rounded-lg px-3 py-1.5">
                  <p className="text-[10px] text-white/60 font-medium">Modalidad</p>
                  <p className="text-sm font-bold">
                    {nextAppt.modalidad === 'VIRTUAL' ? '💻 Virtual' : '🏥 Presencial'}
                  </p>
                </div>
              </div>
            </div>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                nextAppt.estado === 'CONFIRMADA'
                  ? 'bg-emerald-400/20 border border-emerald-400/40 text-emerald-300'
                  : 'bg-amber-400/20 border border-amber-400/40 text-amber-200'
              }`}
            >
              {nextAppt.estado === 'CONFIRMADA' ? '✓ Confirmada' : 'Programada'}
            </span>
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl p-6 text-white relative overflow-hidden shadow-lg flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #0B3D3A, #1E8C82)' }}
        >
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1" style={{ fontFamily: 'Outfit' }}>
              Sin citas pendientes
            </p>
            <p className="text-xl font-bold" style={{ fontFamily: 'Outfit' }}>
              Mantén tu salud bucal al día
            </p>
            <p className="text-xs text-white/80 mt-1 max-w-md">
              Agenda tu próxima cita con nuestros odontólogos especialistas en pocos pasos.
            </p>
          </div>
          <button
            onClick={onRequestAppt}
            className="px-4 py-2.5 bg-white text-teal-800 font-bold text-xs rounded-xl hover:shadow-lg transition-all cursor-pointer"
          >
            + Solicitar cita
          </button>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3" style={{fontFamily:'Outfit'}}>Accesos rápidos</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon:'📅', label:'Solicitar cita', action: onRequestAppt, accent:'#1E8C82' },
            { icon:'🗓️', label:'Mi agenda',      action: () => onNavigate('agenda'),       accent:'#0284C7' },
            { icon:'🦷', label:'Tratamientos',   action: () => onNavigate('tratamientos'), accent:'#0D9488' },
            { icon:'📋', label:'Documentos',     action: () => onNavigate('documentos'),   accent:'#D97706' },
          ].map((q, i) => (
            <button key={i} onClick={q.action}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-md hover:border-transparent transition-all group cursor-pointer">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: q.accent + '15' }}>
                {q.icon}
              </div>
              <span className="text-xs font-semibold text-slate-600 text-center">{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:'Próxima cita', value: nextAppt ? formatLimaDate(nextAppt.inicioEn) : 'Sin pendientes', sub: nextAppt ? (nextAppt.estado === 'CONFIRMADA' ? 'Confirmada' : 'Programada') : 'Agenda cuando gustes', color:'#0D9488', bg:'bg-teal-50' },
          { label:'Documentos y Radiografías', value:'Portal Seguro', sub:'Archivos compartidos', color:'#0284C7', bg:'bg-sky-50' },
          { label:'Total de Citas', value: `${appointments.length} citas`, sub:'Historial registrado', color:'#1E8C82', bg:'bg-cyan-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4 border border-transparent`}>
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className="font-bold text-lg" style={{ color: s.color, fontFamily:'Outfit' }}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabAgenda({
  appointments,
  requests,
  onRequestAppt,
  onConfirmAppt,
  onCancelAppt,
  onOpenReprogramar,
  onCancelRequest,
}: {
  appointments: Appointment[]
  requests: SolicitudReprogramacion[]
  onRequestAppt: () => void
  onConfirmAppt: (id: string) => Promise<void>
  onCancelAppt: (id: string) => Promise<void>
  onOpenReprogramar: (c: Appointment) => void
  onCancelRequest: (id: string) => Promise<void>
}) {
  const upcoming = useMemo(
    () => appointments.filter(a => a.estado !== 'FINALIZADA' && a.estado !== 'CANCELADA'),
    [appointments]
  )
  const past = useMemo(
    () => appointments.filter(a => a.estado === 'FINALIZADA' || a.estado === 'CANCELADA'),
    [appointments]
  )

  const pendingByApptId = useMemo(() => {
    const set = new Set<string>()
    for (const r of requests) {
      if (r.estado === 'PENDIENTE') {
        set.add(r.citaId)
      }
    }
    return set
  }, [requests])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800 text-lg" style={{ fontFamily: 'Outfit' }}>
          Mi agenda de citas
        </h2>
        <button
          onClick={onRequestAppt}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors cursor-pointer shadow-sm"
          style={{ backgroundColor: '#1E8C82' }}
        >
          <Icon d="M12 4v16m8-8H4" className="w-4 h-4" />
          Solicitar nueva cita
        </button>
      </div>

      {/* Próximas Citas */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3" style={{ fontFamily: 'Outfit' }}>
          Próximas citas ({upcoming.length})
        </p>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
            <span className="text-3xl">📅</span>
            <p className="font-bold text-slate-700 text-sm mt-2" style={{ fontFamily: 'Outfit' }}>
              No tienes citas próximas programadas
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Haz clic en "Solicitar nueva cita" para agendar tu atención con nuestros odontólogos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(a => {
              const hasPendingReq = pendingByApptId.has(a.id)
              const [dayNum, monthShort] = (() => {
                try {
                  const d = new Date(a.inicioEn)
                  return [
                    new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', day: 'numeric' }).format(d),
                    new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', month: 'short' }).format(d),
                  ]
                } catch {
                  return ['--', '--']
                }
              })()

              return (
                <div
                  key={a.id}
                  className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col md:flex-row md:items-center gap-4 hover:shadow-xs transition-all"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="text-center w-12 shrink-0 bg-teal-50 rounded-xl py-2 px-1 border border-teal-100/50">
                      <p className="text-lg font-bold text-teal-900 leading-none">{dayNum}</p>
                      <p className="text-[10px] text-teal-600 uppercase font-semibold mt-0.5">{monthShort}</p>
                    </div>
                    <div className="w-px h-10 bg-slate-100 hidden md:block" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-800 text-sm" style={{ fontFamily: 'Outfit' }}>
                          {a.motivo || 'Consulta general'}
                        </p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          a.modalidad === 'VIRTUAL' ? 'bg-violet-100 text-violet-700' : 'bg-cyan-50 text-cyan-700'
                        }`}>
                          {a.modalidad === 'VIRTUAL' ? '💻 Virtual' : '🏥 Presencial'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          a.estado === 'CONFIRMADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {a.estado === 'CONFIRMADA' ? 'Confirmada' : 'Programada'}
                        </span>
                        {hasPendingReq && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 animate-pulse">
                            🔄 Reprogramación en revisión
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Dr(a). {a.odontologoNombreCompleto || 'Odontólogo asignado'} · {formatLimaTime(a.inicioEn)} - {formatLimaTime(a.finEn)} · {a.consultorio || 'Sillón'}
                      </p>
                    </div>
                  </div>

                  {/* Actions for this appointment */}
                  <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-50 shrink-0">
                    {a.estado === 'PROGRAMADA' && (
                      <button
                        onClick={() => onConfirmAppt(a.id)}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <Icon d="M5 13l4 4L19 7" className="w-3.5 h-3.5" />
                        Confirmar
                      </button>
                    )}
                    <button
                      onClick={() => onOpenReprogramar(a)}
                      className="px-3 py-1.5 text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-xl transition-all cursor-pointer"
                    >
                      Solicitar cambio
                    </button>
                    <button
                      onClick={() => onCancelAppt(a.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Solicitudes de Reprogramación */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3" style={{ fontFamily: 'Outfit' }}>
          Mis solicitudes de reprogramación ({requests.length})
        </p>
        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center text-xs text-slate-400">
            No tienes peticiones de cambio de horario registradas.
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map(req => {
              const statusBadge = {
                PENDIENTE: { cls: 'bg-amber-100 text-amber-800', label: 'En revisión por recepción' },
                APROBADA:  { cls: 'bg-emerald-100 text-emerald-800', label: 'Aprobada ✓ (Cita actualizada)' },
                RECHAZADA: { cls: 'bg-rose-100 text-rose-800', label: 'Rechazada por clínica' },
                CANCELADA: { cls: 'bg-slate-100 text-slate-700', label: 'Cancelada' },
              }[req.estado] || { cls: 'bg-slate-100 text-slate-700', label: req.estado }

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800 text-sm">
                        Solicitud para Cita #{req.citaId}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge.cls}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <strong>Horario pedido:</strong> {formatLimaDate(req.nuevaFechaHoraInicio || req.nuevoInicioDeseado)} de {formatLimaTime(req.nuevaFechaHoraInicio || req.nuevoInicioDeseado)} a {formatLimaTime(req.nuevaFechaHoraFin || req.nuevoFinDeseado)}
                    </p>
                    {req.motivo && (
                      <p className="text-xs text-slate-400 mt-0.5 italic">
                        Motivo: "{req.motivo}"
                      </p>
                    )}
                    {(req.resolucionMotivo || req.resolucionNota) && (
                      <p className="text-xs text-slate-600 mt-1 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                        Respuesta de recepción: "{req.resolucionMotivo || req.resolucionNota}"
                      </p>
                    )}
                  </div>

                  {req.estado === 'PENDIENTE' && (
                    <button
                      onClick={() => onCancelRequest(req.id)}
                      className="text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors self-start md:self-auto cursor-pointer"
                    >
                      Cancelar solicitud
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Historial */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3" style={{ fontFamily: 'Outfit' }}>
          Historial de citas ({past.length})
        </p>
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {past.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No hay citas finalizadas o canceladas en tu historial.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {['Fecha', 'Procedimiento', 'Doctor', 'Modalidad', 'Estado'].map(h => (
                    <th key={h} className="text-left text-xs text-slate-400 font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {past.map(a => (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatLimaDate(a.inicioEn)} ({formatLimaTime(a.inicioEn)})
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{a.motivo || 'Consulta'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">Dr(a). {a.odontologoNombreCompleto || 'Asignado'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        a.modalidad === 'VIRTUAL' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {a.modalidad === 'VIRTUAL' ? 'Virtual' : 'Presencial'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        a.estado === 'FINALIZADA' ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-600'
                      }`}>
                        {a.estado === 'FINALIZADA' ? 'Finalizada' : 'Cancelada'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}



function TabTratamientos() {
  const [documents, setDocuments] = useState<AttachmentDto[]>([])
  const [loading, setLoading] = useState(true)
  const [viewerAttachment, setViewerAttachment] = useState<AttachmentDto | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getMyAttachments()
        // Filtrar documentos clínicos de tratamiento, informes, recetas o consentimientos
        setDocuments(data.filter(d => 
          d.tipoArchivo === 'INFORME' || 
          d.tipoArchivo === 'RECETA' || 
          d.tipoArchivo === 'CONSENTIMIENTO' || 
          d.tipoArchivo === 'DOCUMENTO'
        ))
      } catch {
        // En caso de fallo de red
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-5">
      {viewerAttachment && (
        <AttachmentViewerModal
          attachment={viewerAttachment}
          isDentistOrAdmin={false}
          onClose={() => setViewerAttachment(null)}
        />
      )}

      <div>
        <h2 className="font-bold text-slate-800 text-lg" style={{ fontFamily: 'Outfit' }}>
          Planes de Tratamiento y Prescripciones
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Documentos de evolución, recetas médicas e indicaciones clínicas compartidas por tu odontólogo
        </p>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 space-y-2">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium">Consultando tratamientos publicados...</p>
        </div>
      )}

      {!loading && documents.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center space-y-3">
          <span className="text-3xl">🦷</span>
          <p className="font-bold text-slate-700 text-sm mt-1" style={{ fontFamily: 'Outfit' }}>
            No hay planes de tratamiento o recetas publicadas actualmente
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Tu odontólogo registrará y compartirá aquí tus planes de tratamiento, indicaciones médicas y recetas conforme se formalicen en consulta clínica.
          </p>
        </div>
      )}

      {!loading && documents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map(d => (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3 hover:shadow-xs transition-all">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  {d.tipoArchivo}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(d.fechaCreacion).toLocaleDateString('es-PE')}
                </span>
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">{d.nombreOriginal}</p>
                {d.subidoPorNombre && (
                  <p className="text-xs text-slate-500 mt-0.5">Emitido por Dr(a). {d.subidoPorNombre}</p>
                )}
              </div>
              <div className="pt-2 border-t border-slate-50 flex justify-end">
                <button
                  onClick={() => setViewerAttachment(d)}
                  className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors cursor-pointer"
                >
                  Consultar documento
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ModalSubirDocumentoPaciente({
  patientId,
  onClose,
  onSuccess,
}: {
  patientId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [tipoArchivo, setTipoArchivo] = useState('RADIOGRAFIA')
  const [regionAnatomica, setRegionAnatomica] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (selected.size > 25 * 1024 * 1024) {
        setError('El archivo no puede exceder los 25 MB permitidos.')
        setFile(null)
        return
      }
      setError(null)
      setFile(selected)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Por favor selecciona un archivo a subir.')
      return
    }
    setUploading(true)
    setError(null)
    try {
      await uploadAttachment({
        file,
        pacienteId: patientId,
        tipoArchivo,
        regionAnatomica: regionAnatomica.trim() || undefined,
        esVisiblePaciente: true,
      })
      onSuccess()
    } catch (err: any) {
      console.error('[Upload] Error al subir archivo:', err)
      setError(err?.response?.data?.message || err?.message || 'Error al subir el archivo al expediente.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-base" style={{ fontFamily: 'Outfit' }}>
            Subir estudio o documento a tu expediente
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Archivo binario (máx. 25 MB)</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.dcm"
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
            />
            {file && (
              <p className="text-[11px] text-slate-400 mt-1">
                Seleccionado: {file.name} ({formatFileSize(file.size)})
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Tipo de documento</label>
            <select
              value={tipoArchivo}
              onChange={e => setTipoArchivo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            >
              <option value="RADIOGRAFIA">Radiografía / Tomografía</option>
              <option value="CONSENTIMIENTO">Consentimiento informado firmado</option>
              <option value="RECETA">Receta médica previa</option>
              <option value="FOTOGRAFIA">Fotografía intraoral / extraoral</option>
              <option value="OTRO">Otro documento clínico</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Región anatómica o descripción (opcional)</label>
            <input
              type="text"
              placeholder="Ej: Panorámica, Pieza 18, Examen de sangre"
              value={regionAnatomica}
              onChange={e => setRegionAnatomica(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {uploading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Subiendo...</span>
                </>
              ) : (
                'Subir a mi expediente'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TabDocumentos() {
  const { user } = useAuth()
  const [attachments, setAttachments] = useState<AttachmentDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'Todos' | 'Radiografías' | 'Fotografías' | 'Documentos' | 'Consentimientos' | 'Prescripciones'>('Todos')
  const [viewerAttachment, setViewerAttachment] = useState<AttachmentDto | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)

  const loadAttachments = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyAttachments()
      setAttachments(data)
    } catch (err: any) {
      console.error('Error al cargar documentos del paciente:', err)
      setError(err?.response?.data?.message || err?.message || 'Error al conectar con el servidor para consultar documentos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAttachments()
  }, [])

  const handleDownload = async (att: AttachmentDto) => {
    setDownloadingId(att.id)
    try {
      const { blob, filename } = await downloadAttachmentBlob(att.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || att.nombreOriginal
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setToast(`Descarga completada: ${att.nombreOriginal}`)
      setTimeout(() => setToast(null), 3500)
    } catch (err: any) {
      console.error('Error al descargar archivo:', err)
      alert(err?.response?.data?.message || err?.message || 'No fue posible descargar el archivo. Puede haber sido revocado.')
    } finally {
      setDownloadingId(null)
    }
  }

  const filtered = useMemo(() => {
    if (filter === 'Todos') return attachments
    if (filter === 'Radiografías') return attachments.filter(a => a.tipoArchivo === 'RADIOGRAFIA')
    if (filter === 'Fotografías') return attachments.filter(a => a.tipoArchivo === 'FOTOGRAFIA')
    if (filter === 'Consentimientos') return attachments.filter(a => a.tipoArchivo === 'CONSENTIMIENTO')
    if (filter === 'Prescripciones') return attachments.filter(a => a.tipoArchivo === 'RECETA')
    if (filter === 'Documentos') return attachments.filter(a => a.tipoArchivo === 'DOCUMENTO' || a.tipoArchivo === 'INFORME' || a.tipoArchivo === 'OTRO')
    return attachments
  }, [attachments, filter])

  const categories = [
    { key: 'Todos', label: 'Todos', count: attachments.length },
    { key: 'Radiografías', label: 'Radiografías', count: attachments.filter(a => a.tipoArchivo === 'RADIOGRAFIA').length },
    { key: 'Fotografías', label: 'Fotografías', count: attachments.filter(a => a.tipoArchivo === 'FOTOGRAFIA').length },
    { key: 'Consentimientos', label: 'Consentimientos', count: attachments.filter(a => a.tipoArchivo === 'CONSENTIMIENTO').length },
    { key: 'Prescripciones', label: 'Prescripciones', count: attachments.filter(a => a.tipoArchivo === 'RECETA').length },
    { key: 'Documentos', label: 'Informes / Otros', count: attachments.filter(a => a.tipoArchivo === 'DOCUMENTO' || a.tipoArchivo === 'INFORME' || a.tipoArchivo === 'OTRO').length },
  ] as const

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {viewerAttachment && (
        <AttachmentViewerModal
          attachment={viewerAttachment}
          isDentistOrAdmin={false}
          onClose={() => setViewerAttachment(null)}
        />
      )}

      {showUploadModal && user?.pacienteId && (
        <ModalSubirDocumentoPaciente
          patientId={String(user.pacienteId)}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false)
            setToast('✓ Archivo subido y guardado exitosamente en tu expediente')
            setTimeout(() => setToast(null), 3500)
            loadAttachments()
          }}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-800 text-lg" style={{ fontFamily: 'Outfit' }}>
            Mis Documentos y Radiografías Compartidas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Archivos, estudios radiológicos y consentimientos compartidos en tu expediente digital
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user?.pacienteId && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors cursor-pointer shadow-xs"
            >
              <span>+</span>
              <span>Subir documento</span>
            </button>
          )}
          <button
            onClick={loadAttachments}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map(c => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key as any)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === c.key
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{c.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              filter === c.key ? 'bg-teal-700 text-teal-100' : 'bg-slate-100 text-slate-500'
            }`}>
              {c.count}
            </span>
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 space-y-2">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium">Obteniendo tus documentos duraderos...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </div>
          <button
            onClick={loadAttachments}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 text-[11px] cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl mx-auto text-slate-400">
            📁
          </div>
          <p className="font-bold text-slate-700 text-sm" style={{ fontFamily: 'Outfit' }}>
            No hay documentos en esta categoría
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Aquí podrás visualizar los estudios radiológicos y archivos de tu expediente dental.
          </p>
        </div>
      )}

      {/* Document table / list */}
      {!loading && !error && filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-xs text-slate-400 font-semibold px-4 py-3">Documento</th>
                  <th className="text-xs text-slate-400 font-semibold px-4 py-3">Categoría</th>
                  <th className="text-xs text-slate-400 font-semibold px-4 py-3">Tamaño</th>
                  <th className="text-xs text-slate-400 font-semibold px-4 py-3">Fecha de publicación</th>
                  <th className="text-xs text-slate-400 font-semibold px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(d => {
                  const isPdf = d.tipoMime?.includes('pdf') || d.nombreOriginal?.toLowerCase().endsWith('.pdf')
                  const isImg = d.tipoMime?.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(d.nombreOriginal || '')

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                              isPdf
                                ? 'bg-rose-100 text-rose-700'
                                : isImg
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isPdf ? 'PDF' : isImg ? 'IMG' : 'DOC'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate max-w-xs sm:max-w-md">
                              {d.nombreOriginal}
                            </p>
                            {d.regionAnatomica && (
                              <p className="text-[11px] text-slate-400">Región: {d.regionAnatomica}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            d.tipoArchivo === 'RADIOGRAFIA'
                              ? 'bg-purple-100 text-purple-700'
                              : d.tipoArchivo === 'CONSENTIMIENTO'
                              ? 'bg-emerald-100 text-emerald-700'
                              : d.tipoArchivo === 'RECETA'
                              ? 'bg-amber-100 text-amber-700'
                              : d.tipoArchivo === 'FOTOGRAFIA'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {d.tipoArchivo}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">
                        {formatFileSize(d.pesoBytes || 0)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {new Date(d.fechaCreacion).toLocaleDateString('es-PE', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewerAttachment(d)}
                            className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => handleDownload(d)}
                            disabled={downloadingId === d.id}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {downloadingId === d.id ? (
                              <>
                                <span className="w-3 h-3 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                                <span>...</span>
                              </>
                            ) : (
                              <>
                                <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-3.5 h-3.5" />
                                <span>Descargar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function TabPerfil() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<BackendPatientDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState({
    telefono: '',
    ciudad: '',
    direccion: '',
  })

  useEffect(() => {
    let isMounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchMyPatientProfile()
        if (isMounted) {
          setProfile(data)
          setForm({
            telefono: data.telefono || '',
            ciudad: data.ciudad || '',
            direccion: (data as any).direccion || '',
          })
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Error al obtener tu ficha de paciente.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => { isMounted = false }
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await updateMyPatientProfile({
        telefono: form.telefono.trim(),
        ciudad: form.ciudad.trim(),
        direccion: form.direccion.trim(),
      })
      setProfile(updated)
      setForm({
        telefono: updated.telefono || '',
        ciudad: updated.ciudad || '',
        direccion: (updated as any).direccion || '',
      })
      setSuccess('Tus datos de contacto han sido actualizados con éxito en el expediente.')
    } catch (err: any) {
      console.error('[Perfil] Error al actualizar perfil:', err)
      setError(err?.message || 'Error al guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  const fullName = profile ? `${profile.nombres} ${profile.apellidos}` : `${user?.nombres || ''} ${user?.apellidos || ''}`.trim() || 'Paciente'
  const initials = fullName.split(' ').map(n=>n[0]).filter(Boolean).join('').substring(0, 2) || 'PA'

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 font-medium animate-pulse">
        Cargando datos de tu expediente clínico...
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-800 text-lg" style={{ fontFamily: 'Outfit' }}>
            Mi perfil de paciente
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Puedes actualizar tus datos de contacto administrativo. Los datos médicos y de identidad están protegidos.
          </p>
        </div>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <span>✓</span>
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Tarjeta de Identidad y Avatar */}
      <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-bold text-slate-800 text-base">{fullName}</p>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {profile?.tipoDocumento || 'DNI'}: {profile?.numeroDocumento || 'No registrado'}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
              Expediente: PAC-{profile?.id || user?.pacienteId || 'N/A'}
            </span>
            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              Estado: {profile?.estado || 'ACTIVO'}
            </span>
          </div>
        </div>
      </div>

      {/* Formulario de campos administrativos editables */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>
              Datos de contacto modificables
            </p>
            <p className="text-[11px] text-slate-400">
              Campos autorizados para auto-gestión del paciente.
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {saving ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              'Guardar cambios'
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Teléfono de contacto</label>
            <input
              type="tel"
              value={form.telefono}
              onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
              placeholder="Ej: +51 987654321"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Ciudad de residencia</label>
            <input
              type="text"
              value={form.ciudad}
              onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))}
              placeholder="Ej: Lima"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Dirección domiciliaria</label>
            <input
              type="text"
              value={form.direccion}
              onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
              placeholder="Ej: Av. Javier Prado 1234, San Isidro"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all"
            />
          </div>
        </div>
      </form>

      {/* Información médica y clínica protegida (Solo lectura para el paciente) */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>
            Información clínica y seguro (Protegida)
          </p>
          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            Solo editable por odontólogo
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 font-medium block">Correo electrónico de cuenta</span>
            <span className="text-slate-700 font-semibold">{profile?.correo || user?.correo || 'No registrado'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 font-medium block">Fecha de nacimiento</span>
            <span className="text-slate-700 font-semibold">{profile?.fechaNacimiento || 'No registrada'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 font-medium block">Alergias declaradas</span>
            <span className="text-slate-700 font-semibold">{profile?.alergias || 'Ninguna registrada'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 font-medium block">Medicamentos habituales</span>
            <span className="text-slate-700 font-semibold">{profile?.medicamentos || 'Ninguno registrado'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl sm:col-span-2">
            <span className="text-slate-400 font-medium block">Antecedentes médicos</span>
            <span className="text-slate-700 font-semibold">{profile?.antecedentesMedicos || 'Sin antecedentes reportados'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────
export default function PatientApp() {
  const { role, user, logout: onLogout } = useAuth()
  const [tab, setTab] = useState<Tab>('inicio')
  const [collapsed, setCollapsed] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [reprogramarCita, setReprogramarCita] = useState<Appointment | null>(null)

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [requests, setRequests] = useState<SolicitudReprogramacion[]>([])
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const loadPatientData = async (silent = false) => {
    try {
      const [appts, reqs] = await Promise.all([
        getMyAppointments(),
        getMyRescheduleRequests(),
      ])
      setAppointments(appts)
      setRequests(reqs)
    } catch (err: any) {
      if (!silent) {
        console.warn('Error al cargar datos del paciente:', err)
        showToast('Error al sincronizar citas con el servidor')
      }
    }
  }

  // Sondeo cada 5 s y carga inicial (garantiza sincronización <= 10 s)
  useEffect(() => {
    loadPatientData()
    const timer = setInterval(() => {
      loadPatientData(true)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleConfirmAppt = async (id: string) => {
    try {
      await updateStatus(id, 'CONFIRMADA')
      showToast('✓ Cita confirmada exitosamente')
      await loadPatientData(true)
    } catch (err: any) {
      showToast(err.message || 'Error al confirmar cita')
    }
  }

  const handleCancelAppt = async (id: string) => {
    try {
      await updateStatus(id, 'CANCELADA', 'Cancelado por el paciente desde el portal')
      showToast('✓ Cita cancelada')
      await loadPatientData(true)
    } catch (err: any) {
      showToast(err.message || 'Error al cancelar cita')
    }
  }

  const handleCancelRequest = async (id: string) => {
    try {
      await cancelRescheduleRequest(id)
      showToast('✓ Solicitud de reprogramación cancelada')
      await loadPatientData(true)
    } catch (err: any) {
      showToast(err.message || 'Error al cancelar solicitud')
    }
  }

  const savedRole = typeof window !== 'undefined' ? localStorage.getItem('coronyx_role') : null
  if (!role && !savedRole) return null

  const SECTION_TITLES: Record<Tab, string> = {
    inicio:'Inicio', agenda:'Mi agenda', tratamientos:'Mis tratamientos',
    documentos:'Documentos y Radiografías', perfil:'Mi perfil',
  }

  const fullName = `${user?.nombres || ''} ${user?.apellidos || ''}`.trim() || 'Paciente'
  const initials = `${user?.nombres?.[0] || 'P'}${user?.apellidos?.[0] || ''}`

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 relative">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute top-4 right-6 z-50 px-4 py-2 bg-slate-900 text-white rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in duration-150">
          <span className="w-2 h-2 rounded-full bg-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal Solicitar Cita */}
      {showModal && (
        <ModalCita
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            showToast('✓ Cita registrada correctamente')
            loadPatientData(true)
          }}
        />
      )}

      {/* Modal Solicitar Reprogramación */}
      {reprogramarCita && (
        <ModalSolicitarReprogramacion
          cita={reprogramarCita}
          onClose={() => setReprogramarCita(null)}
          onSuccess={() => {
            showToast('✓ Solicitud de cambio enviada a recepción')
            loadPatientData(true)
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-14' : 'w-56'} shrink-0 flex flex-col h-full transition-all duration-200 bg-white border-r border-slate-100`}>
        {/* Logo */}
        <div className={`flex items-center gap-2.5 px-4 py-4 border-b border-slate-100 ${collapsed ? 'justify-center' : ''}`}>
          {collapsed ? (
            <img src={coronixLogo} alt="CORONYX" className="w-9 h-9 object-contain shrink-0"/>
          ) : (
            <>
              <img src={coronixLogo} alt="CORONYX" className="w-10 h-10 object-contain shrink-0"/>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight tracking-wide" style={{ fontFamily:'Outfit', color:'#0B3D3A' }}>CORONYX</p>
                <p className="text-[10px] font-medium" style={{ color:'#1E8C82' }}>Portal del Paciente</p>
              </div>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = tab === item.id
            return (
              <button key={item.id} onClick={() => setTab(item.id)} title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm transition-all relative cursor-pointer ${collapsed ? 'justify-center' : ''} ${active ? 'bg-cyan-50 text-cyan-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d={item.iconPath}/>
                </svg>
                {!collapsed && <span className="font-medium text-[13px]">{item.label}</span>}
                {active && !collapsed && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-cyan-500"/>}
              </button>
            )
          })}
        </nav>

        {/* User row */}
        <div className={`p-3 border-t border-slate-100 flex ${collapsed ? 'justify-center' : 'items-center gap-2'}`}>
          {!collapsed && (
            <>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate">{fullName}</p>
                <p className="text-[10px] text-slate-400 truncate">Paciente</p>
              </div>
              <button onClick={onLogout} className="text-slate-300 hover:text-slate-500 transition-colors text-xs cursor-pointer" title="Cerrar sesión">⏏</button>
            </>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center text-slate-400 shrink-0 cursor-pointer">
            <svg className={`w-3 h-3 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-12 bg-white border-b border-slate-100 flex items-center px-6 gap-4 shrink-0">
          <h2 className="text-sm font-semibold text-slate-700" style={{fontFamily:'Outfit'}}>{SECTION_TITLES[tab]}</h2>
          <div className="flex-1" />
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
            style={{ backgroundColor:'#1E8C82' }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Solicitar cita
          </button>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
            {initials}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {tab === 'inicio'       && <TabInicio       appointments={appointments} onRequestAppt={() => setShowModal(true)} onNavigate={setTab} />}
          {tab === 'agenda'       && (
            <TabAgenda
              appointments={appointments}
              requests={requests}
              onRequestAppt={() => setShowModal(true)}
              onConfirmAppt={handleConfirmAppt}
              onCancelAppt={handleCancelAppt}
              onOpenReprogramar={c => setReprogramarCita(c)}
              onCancelRequest={handleCancelRequest}
            />
          )}
          {tab === 'tratamientos' && <TabTratamientos />}
          {tab === 'documentos'   && <TabDocumentos />}
          {tab === 'perfil'       && <TabPerfil />}
        </main>
      </div>
    </div>
  )
}
