import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getDashboardSummary, type DashboardSummary, type DashboardAppointmentItem } from '../services/dashboardService'

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch {
    return '--:--'
  }
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDashboardSummary()
      setSummary(data)
    } catch (err: any) {
      console.error('[Dashboard] Error al cargar resumen:', err)
      setError(err?.message || 'Error al conectar con la API de resumen del panel.')
      setSummary(null) // ¡IMPORTANTE: No mostrar cero exitoso cuando hay error!
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  // Formato de fecha en zona horaria Lima
  const todayFormatted = summary?.fechaHoyLima
    ? (summary.fechaHoyLima.includes(' de ')
        ? summary.fechaHoyLima
        : new Date(summary.fechaHoyLima + 'T00:00:00').toLocaleDateString('es-PE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }))
    : new Date().toLocaleDateString('es-PE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })

  const getGreeting = () => {
    const rolePrefix = user?.rol === 'ODONTOLOGO' ? 'Dr(a). ' : ''
    const name = user?.nombreCompleto || 'Usuario'
    return `Buenos días, ${rolePrefix}${name}`
  }

  return (
    <div className="p-6 space-y-6 fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase" style={{ fontFamily: 'Outfit' }}>
            {todayFormatted} · Sede: {user?.clinicaNombre || 'Clínica Dental'}
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1" style={{ fontFamily: 'Outfit' }}>
            {getGreeting()}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/app/agenda')}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors font-medium shadow-sm"
          >
            Ver agenda
          </button>
          <button
            onClick={() => navigate('/app/pacientes')}
            className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors shadow-sm"
          >
            Directorio pacientes
          </button>
        </div>
      </div>

      {/* API Error State - Requisito: error API no aparece como cero exitoso */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-sm">Error al cargar datos del panel</p>
              <p className="text-xs text-rose-600 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={loadSummary}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition-colors shrink-0"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !error && (
        <div className="p-8 text-center text-slate-400 font-medium animate-pulse">
          Cargando indicadores operativos en tiempo real...
        </div>
      )}

      {/* Main Content when loaded successfully */}
      {summary && !loading && (
        <>
          {/* Alerts strip - Basado estrictamente en datos reales */}
          {summary.citasPendientesHoy > 0 && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl text-sm bg-amber-50 border border-amber-200 text-amber-800">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>
                  Hay <strong>{summary.citasPendientesHoy}</strong> cita(s) pendiente(s) de confirmación para hoy.
                </span>
              </div>
              <button
                onClick={() => navigate('/app/agenda')}
                className="font-medium underline underline-offset-2 hover:no-underline text-xs"
              >
                Revisar en agenda
              </button>
            </div>
          )}

          {/* Stats - Indicadores reales de BD (sin ingresos ficticios ni series fijas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>
                Citas hoy
              </p>
              <p className="text-3xl font-bold mt-1 text-cyan-600" style={{ fontFamily: 'Outfit' }}>
                {summary.totalCitasHoy}
              </p>
              <p className="text-xs text-slate-400 mt-1">{summary.citasConfirmadasHoy} confirmadas</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>
                Citas atendidas
              </p>
              <p className="text-3xl font-bold mt-1 text-emerald-600" style={{ fontFamily: 'Outfit' }}>
                {summary.citasAtendidasHoy}
              </p>
              <p className="text-xs text-slate-400 mt-1">{summary.citasPendientesHoy} pendientes</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>
                Pacientes registrados
              </p>
              <p className="text-3xl font-bold mt-1 text-slate-800" style={{ fontFamily: 'Outfit' }}>
                {summary.totalPacientes}
              </p>
              <p className="text-xs text-slate-400 mt-1">Total en la clínica</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>
                Próxima cita
              </p>
              <p className="text-3xl font-bold mt-1 text-indigo-600" style={{ fontFamily: 'Outfit' }}>
                {summary.proximaCita ? formatTime(summary.proximaCita.inicioEn) : '--:--'}
              </p>
              <p className="text-xs text-slate-400 mt-1 truncate">
                {summary.proximaCita ? summary.proximaCita.pacienteNombreCompleto : 'Sin citas programadas'}
              </p>
            </div>
          </div>

          {/* Timeline + Right column */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's timeline */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900" style={{ fontFamily: 'Outfit' }}>
                  Agenda de hoy ({summary.citasHoy.length})
                </h2>
                <button
                  onClick={loadSummary}
                  className="text-xs text-cyan-600 font-medium hover:underline flex items-center gap-1"
                >
                  ↻ Actualizar
                </button>
              </div>

              {summary.citasHoy.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <p className="text-sm">No hay citas programadas para hoy en esta clínica.</p>
                  <button
                    onClick={() => navigate('/app/agenda')}
                    className="mt-3 text-xs text-cyan-600 font-medium hover:underline"
                  >
                    Abrir agenda para programar citas
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 max-h-[460px] overflow-y-auto">
                  {summary.citasHoy.map((apt: DashboardAppointmentItem) => {
                    const horaInicio = formatTime(apt.inicioEn)
                    const horaFin = formatTime(apt.finEn)
                    const isConfirmed = apt.estado === 'CONFIRMADA'
                    const isPending = apt.estado === 'PENDIENTE'
                    const isAttended = apt.estado === 'ATENDIDA'
                    const isCancelled = apt.estado === 'CANCELADA'

                    return (
                      <div key={apt.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                        <div className="text-xs font-mono font-medium text-slate-500 shrink-0 w-24">
                          {horaInicio} - {horaFin}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{apt.pacienteNombreCompleto}</p>
                          <p className="text-xs text-slate-400 truncate">
                            {apt.motivo || 'Consulta odontológica'} {apt.consultorio ? `· ${apt.consultorio}` : ''}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                              isConfirmed
                                ? 'bg-emerald-100 text-emerald-700'
                                : isPending
                                ? 'bg-amber-100 text-amber-700'
                                : isAttended
                                ? 'bg-cyan-100 text-cyan-700'
                                : isCancelled
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {apt.estado}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Próxima cita destacada */}
              {summary.proximaCita ? (
                <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-xl p-5 text-white shadow-sm">
                  <p className="text-xs font-semibold opacity-80 uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>
                    Próxima cita en fila
                  </p>
                  <p className="text-3xl font-bold mt-1" style={{ fontFamily: 'Outfit' }}>
                    {formatTime(summary.proximaCita.inicioEn)}
                  </p>
                  <p className="font-semibold text-base mt-2">{summary.proximaCita.pacienteNombreCompleto}</p>
                  <p className="text-xs opacity-80 mt-0.5">
                    {summary.proximaCita.motivo || 'Atención dental'} {summary.proximaCita.consultorio ? `· ${summary.proximaCita.consultorio}` : ''}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => navigate('/app/agenda')}
                      className="flex-1 bg-white/20 hover:bg-white/30 transition-colors text-white text-xs font-medium py-2 rounded-lg text-center"
                    >
                      Abrir en agenda
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center text-slate-500">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Próxima cita</p>
                  <p className="text-sm font-medium mt-2">No hay citas pendientes para el resto del día.</p>
                </div>
              )}

              {/* Distribución por estado de citas - 100% sustentado en BD */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <p className="text-sm font-semibold text-slate-800 mb-3" style={{ fontFamily: 'Outfit' }}>
                  Distribución de citas hoy
                </p>
                {summary.totalCitasHoy === 0 ? (
                  <p className="text-xs text-slate-400 py-2">Sin citas registradas para calcular distribución.</p>
                ) : (
                  [
                    {
                      label: 'Confirmadas',
                      val: summary.citasConfirmadasHoy,
                      total: summary.totalCitasHoy,
                      color: 'bg-emerald-500',
                    },
                    {
                      label: 'Pendientes',
                      val: summary.citasPendientesHoy,
                      total: summary.totalCitasHoy,
                      color: 'bg-amber-500',
                    },
                    {
                      label: 'Atendidas',
                      val: summary.citasAtendidasHoy,
                      total: summary.totalCitasHoy,
                      color: 'bg-cyan-500',
                    },
                    {
                      label: 'Canceladas',
                      val: summary.citasCanceladasHoy,
                      total: summary.totalCitasHoy,
                      color: 'bg-rose-500',
                    },
                  ].map((row, i) => {
                    const pct = row.total > 0 ? Math.round((row.val / row.total) * 100) : 0
                    return (
                      <div key={i} className="mb-2.5 last:mb-0">
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span>{row.label}</span>
                          <span className="font-mono">
                            {row.val} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${row.color} rounded-full`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
