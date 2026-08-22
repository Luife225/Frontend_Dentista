import { useState } from 'react'

const transactions = [
  { id:1, date:'2026-08-08', time:'08:47', patient:'Carlos Rivas', procedure:'Extracción #38', amount:320000, method:'Transferencia', status:'paid' },
  { id:2, date:'2026-08-08', time:'09:30', patient:'María González', procedure:'Limpieza ultrasónica', amount:95000, method:'Efectivo', status:'paid' },
  { id:3, date:'2026-08-08', time:'11:00', patient:'Sofía Mendez', procedure:'Corona provisional', amount:450000, method:'Tarjeta', status:'pending' },
  { id:4, date:'2026-08-07', time:'15:20', patient:'Lucía Reyes', procedure:'Ortodoncia control', amount:120000, method:'Transferencia', status:'paid' },
  { id:5, date:'2026-08-07', time:'16:45', patient:'Andrés Torres', procedure:'Blanqueamiento', amount:380000, method:'Tarjeta', status:'paid' },
  { id:6, date:'2026-08-06', time:'10:10', patient:'Roberto Patiño', procedure:'Endodoncia #46', amount:850000, method:'Transferencia', status:'paid' },
  { id:7, date:'2026-08-06', time:'14:00', patient:'Javier Molina', procedure:'Diagnóstico', amount:80000, method:'Efectivo', status:'pending' },
]

const monthly = [
  { month:'Mar', val: 3800000 }, { month:'Abr', val: 4200000 }, { month:'May', val: 3950000 },
  { month:'Jun', val: 5100000 }, { month:'Jul', val: 4750000 }, { month:'Ago', val: 2295000 },
]
const maxVal = Math.max(...monthly.map(m => m.val))

export default function Caja() {
  const [dateFilter, setDateFilter] = useState<'today'|'week'|'month'>('today')
  const todayTotal = transactions.filter(t => t.date === '2026-08-08' && t.status === 'paid').reduce((s,t) => s + t.amount, 0)
  const pending = transactions.filter(t => t.status === 'pending').reduce((s,t) => s + t.amount, 0)

  const filtered = transactions.filter(t => {
    if (dateFilter === 'today') return t.date === '2026-08-08'
    if (dateFilter === 'week') return ['2026-08-06','2026-08-07','2026-08-08'].includes(t.date)
    return true
  })

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Caja y reportes</h1>
        <button className="px-3 py-1.5 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Exportar reporte</button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:'Ingresos hoy', value:`$${todayTotal.toLocaleString('es-CO')}`, sub:'Cobrado', color:'emerald' },
          { label:'Pendiente cobro', value:`$${pending.toLocaleString('es-CO')}`, sub:'2 pacientes', color:'amber' },
          { label:'Citas facturadas', value:'5', sub:'de 7 hoy', color:'cyan' },
          { label:'Meta mensual', value:'$4.8M', sub:'47% alcanzado', color:'slate' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider" style={{fontFamily:'Outfit'}}>{k.label}</p>
            <p className={`text-2xl font-bold mt-1 ${
              k.color === 'emerald' ? 'text-emerald-600' :
              k.color === 'amber' ? 'text-amber-600' :
              k.color === 'cyan' ? 'text-cyan-600' : 'text-slate-800'
            }`} style={{fontFamily:'Outfit'}}>{k.value}</p>
            <p className="text-xs text-slate-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Transactions */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Movimientos</h2>
            <div className="flex border border-slate-200 rounded-lg overflow-hidden text-xs">
              {(['today','week','month'] as const).map(f => (
                <button key={f} onClick={() => setDateFilter(f)}
                  className={`px-3 py-1.5 font-medium transition-colors ${dateFilter === f ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                  {f === 'today' ? 'Hoy' : f === 'week' ? 'Semana' : 'Mes'}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {filtered.map(t => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="text-right w-16">
                  <p className="text-xs font-mono text-slate-400">{t.time}</p>
                  <p className="text-xs text-slate-400">{t.date.slice(5)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{t.patient}</p>
                  <p className="text-xs text-slate-400 truncate">{t.procedure}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400">{t.method}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {t.status === 'paid' ? 'Pagado' : 'Pendiente'}
                  </span>
                  <span className={`font-semibold text-sm font-mono ${t.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    ${t.amount.toLocaleString('es-CO')}
                  </span>
                  {t.status === 'pending' && (
                    <button className="text-xs px-2 py-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">Cobrar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 mb-4" style={{fontFamily:'Outfit'}}>Ingresos mensuales</h3>
          <div className="flex items-end justify-between gap-2 h-36">
            {monthly.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-xs text-slate-400 font-mono">{i === 5 ? `$${(m.val/1000000).toFixed(1)}M` : ''}</p>
                <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                  <div
                    className={`w-full rounded-t-md transition-all ${i === 5 ? 'bg-cyan-500' : 'bg-slate-100 hover:bg-slate-200'}`}
                    style={{ height: `${(m.val / maxVal) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">{m.month}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Mejor mes</span>
              <span className="font-semibold text-slate-700">Jun — $5.1M</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-slate-400">Promedio</span>
              <span className="font-semibold text-slate-700">$4.1M / mes</span>
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" style={{fontFamily:'Outfit'}}>Medios de pago</p>
            {[
              { label:'Transferencia', pct:55, color:'bg-cyan-500' },
              { label:'Tarjeta', pct:30, color:'bg-violet-400' },
              { label:'Efectivo', pct:15, color:'bg-slate-300' },
            ].map(p => (
              <div key={p.label} className="flex items-center gap-2 mb-1.5">
                <span className="text-xs text-slate-500 w-24">{p.label}</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${p.color} rounded-full`} style={{width:`${p.pct}%`}}></div>
                </div>
                <span className="text-xs text-slate-400 font-mono w-8 text-right">{p.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
