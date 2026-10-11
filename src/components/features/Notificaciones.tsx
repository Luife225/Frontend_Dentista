import { useState, useEffect, useCallback } from 'react'
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  type NotificationDto,
} from '../../services/notificationService'

function Icon({ d, className = 'w-4 h-4' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d={d} />
    </svg>
  )
}

function getEventBadge(tipoEvento: string) {
  switch (tipoEvento) {
    case 'CITA_PROGRAMADA':
    case 'CITA_CREADA':
      return {
        label: 'Cita programada',
        bg: 'bg-emerald-100 text-emerald-800',
        icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      }
    case 'CITA_REPROGRAMADA':
      return {
        label: 'Reprogramación',
        bg: 'bg-amber-100 text-amber-800',
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      }
    case 'CITA_CANCELADA':
      return {
        label: 'Cancelación',
        bg: 'bg-rose-100 text-rose-800',
        icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      }
    case 'CITA_APROBADA':
      return {
        label: 'Cita confirmada',
        bg: 'bg-teal-100 text-teal-800',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      }
    case 'DOCUMENTO_PUBLICADO':
    case 'ARCHIVO_PUBLICADO':
      return {
        label: 'Documento disponible',
        bg: 'bg-purple-100 text-purple-800',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      }
    default:
      return {
        label: tipoEvento || 'Aviso del sistema',
        bg: 'bg-slate-100 text-slate-700',
        icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      }
  }
}

export default function Notificaciones() {
  const [notifications, setNotifications] = useState<NotificationDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyNotifications()
      setNotifications(data)
      window.dispatchEvent(new Event('coronyx:notifications-read'))
    } catch (err: any) {
      console.error('[Notificaciones] Error al consultar bandeja:', err)
      setError(err?.message || 'Error al conectar con la bandeja de notificaciones.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const handleMarkAsRead = async (id: string) => {
    setProcessingId(id)
    try {
      const updated = await markAsRead(id)
      setNotifications(prev => prev.map(n => (n.id === id ? updated : n)))
      window.dispatchEvent(new Event('coronyx:notifications-read'))
    } catch (err: any) {
      console.error('[Notificaciones] Error al marcar como leída:', err)
    } finally {
      setProcessingId(null)
    }
  }

  const isUnread = (s?: string) => s !== 'LEIDO' && s !== 'LEIDA'

  const handleMarkAll = async () => {
    try {
      await markAllAsRead()
      setNotifications(prev =>
        prev.map(n => ({
          ...n,
          estado: 'LEIDO',
          fechaLectura: new Date().toISOString(),
        }))
      )
      window.dispatchEvent(new Event('coronyx:notifications-read'))
    } catch (err: any) {
      console.error('[Notificaciones] Error al marcar todas como leídas:', err)
    }
  }

  const unreadCount = notifications.filter(n => isUnread(n.estado)).length

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return isUnread(n.estado)
    if (filter === 'read') return !isUnread(n.estado)
    return true
  })

  return (
    <div className="p-6 space-y-6 fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit' }}>
              Bandeja de notificaciones
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800">
                {unreadCount} sin leer
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Registro transaccional de avisos clínicos y cambios en citas asociadas a tu cuenta.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 transition-colors border border-cyan-200"
            >
              Marcar todas como leídas
            </button>
          )}
          <button
            onClick={loadNotifications}
            disabled={loading}
            className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <span className={loading ? 'animate-spin' : ''}>↻</span>
            Actualizar
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'all' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Todas ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'unread' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          No leídas ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'read' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Leídas ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-semibold text-sm">Error de comunicación</p>
              <p className="text-xs text-rose-600 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={loadNotifications}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition-colors shrink-0"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && !error && (
        <div className="p-12 text-center text-slate-400 font-medium animate-pulse bg-white rounded-xl border border-slate-100">
          Consultando notificaciones registradas en la base de datos...
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-100 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
            🔔
          </div>
          <p className="text-base font-semibold text-slate-800" style={{ fontFamily: 'Outfit' }}>
            No hay notificaciones
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {filter === 'unread'
              ? 'Has leído todas tus notificaciones activas.'
              : 'Cuando ocurran eventos en tus citas o expediente, aparecerán listados aquí en tiempo real.'}
          </p>
        </div>
      )}

      {/* Notifications list */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(notif => {
            const isItemUnread = isUnread(notif.estado)
            const badge = getEventBadge(notif.tipoEvento)
            const dateStr = new Date(notif.fechaCreacion).toLocaleString('es-PE', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })

            return (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border transition-all ${
                  isItemUnread
                    ? 'bg-white border-cyan-200 shadow-sm ring-1 ring-cyan-100'
                    : 'bg-slate-50/70 border-slate-200 opacity-90'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isItemUnread ? 'bg-cyan-50 text-cyan-600' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <Icon d={badge.icon} className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.bg}`}>
                          {badge.label}
                        </span>
                        {isItemUnread && (
                          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" title="Sin leer" />
                        )}
                        <span className="text-xs text-slate-400 font-mono">{dateStr}</span>
                      </div>
                      <h3 className="font-semibold text-sm text-slate-800 mt-1">{notif.titulo}</h3>
                      <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">
                        {notif.cuerpoMensaje}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {isItemUnread && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        disabled={processingId === notif.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {processingId === notif.id ? 'Marcando...' : 'Marcar como leída'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
