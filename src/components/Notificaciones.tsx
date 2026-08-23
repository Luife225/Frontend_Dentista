import { useState } from 'react'

interface NotificationItem {
  id: number
  patient: string
  channel: 'WhatsApp' | 'Email' | 'SMS'
  type: string
  date: string
  time: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  message: string
}

const initialNotifications: NotificationItem[] = [
  { id: 1, patient: 'Carlos Rivas', channel: 'WhatsApp', type: 'Recordatorio cita', date: '2026-08-08', time: '07:00', status: 'sent', message: 'Hola Carlos, le recordamos su cita de hoy a las 09:15 para Extracción #38. Confirme respondiendo SI.' },
  { id: 2, patient: 'Sofía Mendez', channel: 'WhatsApp', type: 'Confirmación cita', date: '2026-08-08', time: '07:01', status: 'delivered', message: 'Hola Sofía, su cita del lunes 10/08 a las 10:30 está confirmada. ¡Le esperamos!' },
  { id: 3, patient: 'Javier Molina', channel: 'Email', type: 'Recordatorio cita', date: '2026-08-08', time: '07:00', status: 'failed', message: 'Estimado Javier, le recordamos su cita de hoy a las 15:00.' },
  { id: 4, patient: 'Valentina Cruz', channel: 'WhatsApp', type: 'Resultado examen', date: '2026-08-07', time: '14:30', status: 'read', message: 'Valentina, sus radiografías están listas para ser revisadas. Por favor contáctenos.' },
  { id: 5, patient: 'María González', channel: 'WhatsApp', type: 'Control programado', date: '2026-08-06', time: '09:00', status: 'sent', message: 'María, recuerde su control semestral el 10/08.' },
  { id: 6, patient: 'Andrés Torres', channel: 'Email', type: 'Factura', date: '2026-08-05', time: '16:00', status: 'read', message: 'Adjuntamos su factura electrónica por el blanqueamiento dental del 04/08.' },
]

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  sent:      { label: 'Enviado',    color: 'bg-sky-100 text-sky-700',       icon: '📤' },
  delivered: { label: 'Entregado',  color: 'bg-blue-100 text-blue-700',     icon: '✓✓' },
  read:      { label: 'Leído',      color: 'bg-emerald-100 text-emerald-700', icon: '✓✓' },
  failed:    { label: 'Falló',      color: 'bg-rose-100 text-rose-700',     icon: '✕' },
}

const CHANNEL_ICON: Record<string, string> = {
  WhatsApp: '📱',
  Email: '✉️',
  SMS: '💬',
}

const PATIENTS_LIST = [
  'Carlos Rivas',
  'María González',
  'Sofía Mendez',
  'Andrés Torres',
  'Valentina Cruz',
  'Javier Molina',
  'Lucía Reyes',
  'Roberto Patiño',
]

const TEMPLATES: Record<string, string> = {
  'Recordatorio cita': 'Hola {paciente}, le recordamos su cita odontológica programada para el {fecha} a las {hora}. Por favor confirme su asistencia respondiendo SI.',
  'Confirmación cita': 'Hola {paciente}, su cita ha sido confirmada con éxito para el {fecha} a las {hora}. ¡Le esperamos en CORONYX Dental!',
  'Control programado': 'Estimado(a) {paciente}, según su plan de tratamiento le corresponde su control de seguimiento. Comuníquese para agendar.',
  'Resultado examen': 'Estimado(a) {paciente}, sus resultados y radiografías ya están disponibles y analizados en su expediente.',
  'Personalizado': '',
}

export default function Notificaciones() {
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>(initialNotifications)
  const [showModal, setShowModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(PATIENTS_LIST[0])
  const [selectedChannel, setSelectedChannel] = useState<'WhatsApp' | 'Email' | 'SMS'>('WhatsApp')
  const [selectedType, setSelectedType] = useState('Recordatorio cita')
  const [customDate, setCustomDate] = useState('2026-08-10')
  const [customTime, setCustomTime] = useState('09:00')
  const [messageText, setMessageText] = useState(
    TEMPLATES['Recordatorio cita'].replace('{paciente}', PATIENTS_LIST[0]).replace('{fecha}', '10/08/2026').replace('{hora}', '09:00 AM')
  )
  const [sending, setSending] = useState(false)
  const [successToast, setSuccessToast] = useState(false)

  function handleTypeChange(newType: string) {
    setSelectedType(newType)
    if (newType === 'Personalizado') {
      setMessageText('')
    } else {
      const templ = TEMPLATES[newType] || ''
      setMessageText(
        templ
          .replace('{paciente}', selectedPatient)
          .replace('{fecha}', customDate)
          .replace('{hora}', customTime)
      )
    }
  }

  function handlePatientChange(p: string) {
    setSelectedPatient(p)
    if (selectedType !== 'Personalizado') {
      const templ = TEMPLATES[selectedType] || ''
      setMessageText(
        templ
          .replace('{paciente}', p)
          .replace('{fecha}', customDate)
          .replace('{hora}', customTime)
      )
    }
  }

  function handleSendReminder() {
    setSending(true)
    setTimeout(() => {
      const now = new Date()
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const dateStr = now.toISOString().split('T')[0]
      const newNotif: NotificationItem = {
        id: Date.now(),
        patient: selectedPatient,
        channel: selectedChannel,
        type: selectedType,
        date: dateStr,
        time: timeStr,
        status: 'sent',
        message: messageText || `Mensaje de ${selectedType} enviado a ${selectedPatient}`,
      }
      setNotificationsList([newNotif, ...notificationsList])
      setSending(false)
      setShowModal(false)
      setSuccessToast(true)
      setTimeout(() => setSuccessToast(false), 3000)
    }, 600)
  }

  function handleRetry(id: number) {
    setNotificationsList(prev =>
      prev.map(n => n.id === id ? { ...n, status: 'sent' } : n)
    )
  }

  const sentCount = notificationsList.filter(n => n.status === 'sent').length
  const deliveredCount = notificationsList.filter(n => n.status === 'delivered').length
  const readCount = notificationsList.filter(n => n.status === 'read').length
  const failedCount = notificationsList.filter(n => n.status === 'failed').length

  return (
    <div className="p-6 space-y-5 fade-in">
      {/* Success Toast */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 fade-in">
          <span className="text-xl">✓</span>
          <div>
            <p className="font-semibold text-sm">Notificación enviada</p>
            <p className="text-xs text-emerald-100">El mensaje se ha emitido correctamente al paciente.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900" style={{ fontFamily: 'Outfit' }}>Notificaciones y Recordatorios</h1>
          <p className="text-xs text-slate-500 mt-0.5">Envío automatizado de mensajes por WhatsApp, Email y SMS</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition-all shadow-sm hover:shadow">
          <span>+</span> Enviar recordatorio
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Enviadas', val: sentCount, color: 'sky' },
          { label: 'Entregadas', val: deliveredCount, color: 'blue' },
          { label: 'Leídas', val: readCount, color: 'emerald' },
          { label: 'Fallidas', val: failedCount, color: 'rose' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4">
            <p className="text-xs text-slate-400 font-medium" style={{ fontFamily: 'Outfit' }}>{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${
              s.color === 'sky' ? 'text-sky-600' : s.color === 'blue' ? 'text-blue-600' :
              s.color === 'emerald' ? 'text-emerald-600' : 'text-rose-600'
            }`} style={{ fontFamily: 'Outfit' }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900" style={{ fontFamily: 'Outfit' }}>Historial de mensajes emitidos</h2>
          <span className="text-xs text-slate-400">{notificationsList.length} registros</span>
        </div>
        <div className="divide-y divide-slate-50">
          {notificationsList.map(n => (
            <div key={n.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0 mt-0.5">
                {CHANNEL_ICON[n.channel] || '💬'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-semibold text-slate-800">{n.patient}</p>
                  <span className="text-xs text-slate-300">·</span>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">{n.type}</span>
                  <span className="text-xs text-slate-300">·</span>
                  <span className="text-xs text-slate-500 font-medium">{n.channel}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_META[n.status].color}`}>
                  {STATUS_META[n.status].icon} {STATUS_META[n.status].label}
                </span>
                <span className="text-xs text-slate-400 font-mono">{n.date} · {n.time}</span>
                {n.status === 'failed' && (
                  <button
                    onClick={() => handleRetry(n.id)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline underline-offset-2">
                    Reintentar envío
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Enviar recordatorio */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden fade-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>
                Enviar recordatorio / notificación
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center text-xl leading-none transition-colors">
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4 flex-1">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Paciente destinatario</label>
                <select
                  value={selectedPatient}
                  onChange={e => handlePatientChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-white">
                  {PATIENTS_LIST.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Canal de envío</label>
                  <select
                    value={selectedChannel}
                    onChange={e => setSelectedChannel(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-white">
                    <option value="WhatsApp">📱 WhatsApp</option>
                    <option value="Email">✉️ Correo Electrónico</option>
                    <option value="SMS">💬 Mensaje de Texto (SMS)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Tipo de mensaje</label>
                  <select
                    value={selectedType}
                    onChange={e => handleTypeChange(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-white">
                    <option value="Recordatorio cita">Recordatorio de cita</option>
                    <option value="Confirmación cita">Confirmación de cita</option>
                    <option value="Control programado">Control semestral</option>
                    <option value="Resultado examen">Resultado de examen</option>
                    <option value="Personalizado">Personalizado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Fecha de la cita</label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={e => {
                      setCustomDate(e.target.value)
                      if (selectedType !== 'Personalizado') {
                        setMessageText(
                          (TEMPLATES[selectedType] || '')
                            .replace('{paciente}', selectedPatient)
                            .replace('{fecha}', e.target.value)
                            .replace('{hora}', customTime)
                        )
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Hora</label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={e => {
                      setCustomTime(e.target.value)
                      if (selectedType !== 'Personalizado') {
                        setMessageText(
                          (TEMPLATES[selectedType] || '')
                            .replace('{paciente}', selectedPatient)
                            .replace('{fecha}', customDate)
                            .replace('{hora}', e.target.value)
                        )
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Contenido del mensaje</label>
                <textarea
                  rows={4}
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder="Escribe el mensaje que recibirá el paciente..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-100 transition-colors font-medium">
                Cancelar
              </button>
              <button
                onClick={handleSendReminder}
                disabled={sending}
                className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Enviar ahora</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
