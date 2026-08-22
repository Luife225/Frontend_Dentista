const notifications = [
  { id:1, patient:'Carlos Rivas', channel:'WhatsApp', type:'Recordatorio cita', date:'2026-08-08', time:'07:00', status:'sent', message:'Hola Carlos, le recordamos su cita de hoy a las 09:15 para Extracción #38. Confirme respondiendo SI.' },
  { id:2, patient:'Sofía Mendez', channel:'WhatsApp', type:'Confirmación cita', date:'2026-08-08', time:'07:01', status:'delivered', message:'Hola Sofía, su cita del lunes 10/08 a las 10:30 está confirmada. ¡Le esperamos!' },
  { id:3, patient:'Javier Molina', channel:'Email', type:'Recordatorio cita', date:'2026-08-08', time:'07:00', status:'failed', message:'Estimado Javier, le recordamos su cita de hoy a las 15:00.' },
  { id:4, patient:'Valentina Cruz', channel:'WhatsApp', type:'Resultado examen', date:'2026-08-07', time:'14:30', status:'read', message:'Valentina, sus radiografías están listas para ser revisadas. Por favor contáctenos.' },
  { id:5, patient:'María González', channel:'WhatsApp', type:'Control programado', date:'2026-08-06', time:'09:00', status:'sent', message:'María, recuerde su control semestral el 10/08.' },
  { id:6, patient:'Andrés Torres', channel:'Email', type:'Factura', date:'2026-08-05', time:'16:00', status:'read', message:'Adjuntamos su factura electrónica por el blanqueamiento dental del 04/08.' },
]

const STATUS_META: Record<string, { label:string, color:string, icon:string }> = {
  sent:      { label:'Enviado',    color:'bg-sky-100 text-sky-700',       icon:'📤' },
  delivered: { label:'Entregado',  color:'bg-blue-100 text-blue-700',     icon:'✓✓' },
  read:      { label:'Leído',      color:'bg-emerald-100 text-emerald-700', icon:'✓✓' },
  failed:    { label:'Falló',      color:'bg-rose-100 text-rose-700',     icon:'✕' },
}

const CHANNEL_ICON: Record<string, string> = {
  WhatsApp: '📱',
  Email: '✉',
}

export default function Notificaciones() {
  return (
    <div className="p-6 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Notificaciones</h1>
        <button className="px-3 py-1.5 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
          + Enviar recordatorio
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:'Enviadas hoy', val:'6', color:'sky' },
          { label:'Entregadas', val:'5', color:'blue' },
          { label:'Leídas', val:'2', color:'emerald' },
          { label:'Fallidas', val:'1', color:'rose' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4">
            <p className="text-xs text-slate-400 font-medium" style={{fontFamily:'Outfit'}}>{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${
              s.color === 'sky' ? 'text-sky-600' : s.color === 'blue' ? 'text-blue-600' :
              s.color === 'emerald' ? 'text-emerald-600' : 'text-rose-600'
            }`} style={{fontFamily:'Outfit'}}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Historial de mensajes</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {notifications.map(n => (
            <div key={n.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-base shrink-0 mt-0.5">
                {CHANNEL_ICON[n.channel]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-slate-800">{n.patient}</p>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-400">{n.type}</span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-400">{n.channel}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{n.message}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_META[n.status].color}`}>
                  {STATUS_META[n.status].icon} {STATUS_META[n.status].label}
                </span>
                <span className="text-xs text-slate-400 font-mono">{n.date.slice(5)} {n.time}</span>
                {n.status === 'failed' && (
                  <button className="text-xs text-rose-500 hover:text-rose-700 font-medium">Reintentar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
