import { useState } from 'react'

// Mobile-first patient app (Parte C)
type PatientTab = 'inicio' | 'agenda' | 'pagos' | 'avances'

const nextAppt = { date:'2026-08-08', time:'09:15', dr:'Dr. Herrera', procedure:'Extracción #38', location:'Box 1', confirmed:true }

const allAppts = [
  { id:1, date:'2026-08-08', time:'09:15', dr:'Dr. Herrera', procedure:'Extracción #38', status:'confirmed' },
  { id:2, date:'2026-09-05', time:'10:00', dr:'Dr. Herrera', procedure:'Control post-extracción', status:'pending' },
  { id:3, date:'2026-07-22', time:'11:00', dr:'Dra. Suárez', procedure:'Limpieza', status:'completed' },
  { id:4, date:'2026-05-14', time:'09:30', dr:'Dr. Herrera', procedure:'Restauración #14', status:'completed' },
]

const payments = [
  { id:1, date:'2026-08-08', procedure:'Extracción #38', amount:320000, status:'pending', due:'2026-08-15' },
  { id:2, date:'2026-07-22', procedure:'Limpieza ultrasónica', amount:95000, status:'paid', paidDate:'2026-07-22' },
  { id:3, date:'2026-05-14', procedure:'Restauración composit #14', amount:180000, status:'paid', paidDate:'2026-05-14' },
]

const progress = [
  { category:'Higiene oral', score:75, label:'Buena', tip:'Recuerda usar hilo dental diario', icon:'🪥', color:'emerald' },
  { category:'Tratamientos pendientes', score:1, label:'1 restante', tip:'Restauración #36 programada', icon:'📋', color:'amber' },
  { category:'Próximas revisiones', score:100, label:'Al día', tip:'Tu próximo control es en 6 meses', icon:'📅', color:'cyan' },
]

export default function PatientApp({ onLogout }: { onLogout?: () => void }) {
  const [tab, setTab] = useState<PatientTab>('inicio')
  const [payingId, setPayingId] = useState<number | null>(null)
  const [payDone, setPayDone] = useState<number[]>([])
  const [payMethod, setPayMethod] = useState('card')

  function processPayment(id: number) {
    setTimeout(() => {
      setPayDone(p => [...p, id])
      setPayingId(null)
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      {/* Phone frame */}
      <div className="w-96 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col" style={{height:'760px', border:'8px solid #0f172a'}}>
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1 bg-white">
          <span className="text-xs font-semibold text-slate-800 font-mono">09:15</span>
          <div className="flex gap-1 items-center">
            <div className="flex gap-0.5">{[3,3,4,4].map((h,i) => <div key={i} className="w-1 rounded-sm bg-slate-800" style={{height:`${h*2}px`}}></div>)}</div>
            <svg className="w-3.5 h-3.5 text-slate-800" fill="currentColor" viewBox="0 0 24 24"><path d="M1.865 4.515a15.865 15.865 0 0120.274 0l-1.55 1.55a13.737 13.737 0 00-17.168 0L1.865 4.515zm3.72 3.72a10.59 10.59 0 0112.83 0l-1.55 1.55a8.462 8.462 0 00-9.734 0l-1.546-1.55zm3.707 3.708a5.317 5.317 0 015.416 0L13.159 13.5a3.188 3.188 0 00-2.314 0l-1.553-1.557zM12 17.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/></svg>
            <div className="w-5 h-2.5 border border-slate-800 rounded-sm relative"><div className="absolute inset-y-0.5 left-0.5 w-3 bg-emerald-500 rounded-sm"></div></div>
          </div>
        </div>

        {/* App header */}
        <div className="px-5 pt-2 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium" style={{fontFamily:'Outfit'}}>Hola, Carlos</p>
              <p className="text-lg font-bold text-slate-900" style={{fontFamily:'Outfit'}}>CORONYX</p>
            </div>
            <div className="flex gap-2">
              <button className="relative w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
              </button>
              <button onClick={onLogout} className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-xs font-bold">CR</button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'inicio' && (
            <div className="p-5 space-y-4">
              {/* Next appointment card */}
              <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-2xl p-5 text-white">
                <p className="text-xs font-medium opacity-70 uppercase tracking-wider" style={{fontFamily:'Outfit'}}>Próxima cita</p>
                <p className="text-3xl font-bold mt-1" style={{fontFamily:'Outfit'}}>{nextAppt.time}</p>
                <p className="font-semibold mt-0.5">{nextAppt.procedure}</p>
                <p className="text-sm opacity-80">{nextAppt.dr} · {nextAppt.date}</p>
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs font-medium py-2 rounded-xl transition-colors">Confirmar</button>
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs py-2 rounded-xl transition-colors">Cómo llegar</button>
                  <button className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded-xl transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/></svg>
                  </button>
                </div>
              </div>

              {/* Payment alert */}
              {payments.some(p => p.status === 'pending') && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Pago pendiente</p>
                    <p className="text-xs text-amber-600">Vence {payments.find(p=>p.status==='pending')?.due}</p>
                  </div>
                  <button onClick={() => setTab('pagos')} className="px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors">
                    Pagar ahora
                  </button>
                </div>
              )}

              {/* Quick actions */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label:'Citas', icon:'📅', tab:'agenda' as PatientTab },
                  { label:'Pagos', icon:'💳', tab:'pagos' as PatientTab },
                  { label:'Avances', icon:'📊', tab:'avances' as PatientTab },
                  { label:'Teleo', icon:'📹', tab:'inicio' as PatientTab },
                ].map(a => (
                  <button key={a.label} onClick={() => setTab(a.tab)}
                    className="flex flex-col items-center gap-1.5 py-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                    <span className="text-xl">{a.icon}</span>
                    <span className="text-xs text-slate-600 font-medium">{a.label}</span>
                  </button>
                ))}
              </div>

              {/* Recent */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2" style={{fontFamily:'Outfit'}}>Recientes</p>
                {allAppts.filter(a => a.status === 'completed').slice(0,2).map(a => (
                  <div key={a.id} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{a.procedure}</p>
                      <p className="text-xs text-slate-400">{a.date} · {a.dr}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'agenda' && (
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Mis citas</p>
                <button className="text-xs text-cyan-600 font-medium">Solicitar cita</button>
              </div>
              {allAppts.map(a => (
                <div key={a.id} className={`bg-white rounded-xl border p-4 ${a.status === 'confirmed' ? 'border-cyan-200' : a.status === 'pending' ? 'border-amber-200' : 'border-slate-100'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          a.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                          a.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {a.status === 'confirmed' ? 'Confirmada' : a.status === 'pending' ? 'Por confirmar' : 'Realizada'}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 mt-1 text-sm">{a.procedure}</p>
                      <p className="text-xs text-slate-400">{a.dr}</p>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">{a.date} {a.time}</p>
                    </div>
                    {a.status !== 'completed' && (
                      <div className="flex flex-col gap-1">
                        {a.status === 'pending' && (
                          <button className="text-xs px-2.5 py-1 bg-cyan-600 text-white rounded-lg">Confirmar</button>
                        )}
                        <button className="text-xs px-2.5 py-1 border border-slate-200 text-slate-500 rounded-lg">Cancelar</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'pagos' && (
            <div className="p-5 space-y-4">
              <p className="font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Pagos</p>

              {payments.map(p => {
                const isPaid = payDone.includes(p.id) || p.status === 'paid'
                return (
                  <div key={p.id} className={`bg-white rounded-xl border p-4 ${!isPaid ? 'border-amber-200' : 'border-slate-100'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{p.procedure}</p>
                        <p className="text-xs text-slate-400 font-mono">{p.date}</p>
                        {!isPaid && p.due && (
                          <p className="text-xs text-amber-600 mt-0.5">Vence: {p.due}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900" style={{fontFamily:'Outfit'}}>${(p.amount/1000).toFixed(0)}k</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {isPaid ? '✓ Pagado' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                    {!isPaid && payingId !== p.id && (
                      <button onClick={() => setPayingId(p.id)} className="w-full mt-3 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-xl hover:bg-cyan-500 transition-colors">
                        Pagar ${(p.amount/1000).toFixed(0)}k
                      </button>
                    )}

                    {/* Payment modal */}
                    {payingId === p.id && (
                      <div className="mt-3 space-y-3 border-t border-slate-100 pt-3 slide-up">
                        <p className="text-xs font-semibold text-slate-600">Método de pago</p>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id:'card', label:'Tarjeta', icon:'💳' },
                            { id:'pse', label:'PSE', icon:'🏦' },
                            { id:'nequi', label:'Nequi', icon:'📱' },
                          ].map(m => (
                            <button key={m.id} onClick={() => setPayMethod(m.id)}
                              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium border transition-colors ${payMethod === m.id ? 'border-cyan-400 bg-cyan-50 text-cyan-700' : 'border-slate-200 text-slate-500'}`}>
                              <span className="text-xl">{m.icon}</span>
                              {m.label}
                            </button>
                          ))}
                        </div>
                        {payMethod === 'card' && (
                          <div className="space-y-2">
                            <input className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" placeholder="Número de tarjeta" />
                            <div className="flex gap-2">
                              <input className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" placeholder="MM/AA" />
                              <input className="w-20 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" placeholder="CVV" />
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button onClick={() => setPayingId(null)} className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-xl text-sm">Cancelar</button>
                          <button onClick={() => processPayment(p.id)} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-500">
                            Confirmar ${(p.amount/1000).toFixed(0)}k
                          </button>
                        </div>
                      </div>
                    )}
                    {isPaid && p.status === 'paid' && (
                      <button className="w-full mt-2 text-xs text-slate-400 flex items-center justify-center gap-1 hover:text-slate-600 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        Descargar comprobante
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'avances' && (
            <div className="p-5 space-y-4">
              <p className="font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Tu progreso dental</p>
              <p className="text-xs text-slate-400">Resumen de tu salud bucal — actualizado por tu doctor</p>

              {/* Progress cards — humanized clinical info */}
              {progress.map((pr, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{pr.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">{pr.category}</p>
                      <p className={`text-xs font-medium ${pr.color === 'emerald' ? 'text-emerald-600' : pr.color === 'amber' ? 'text-amber-600' : 'text-cyan-600'}`}>
                        {pr.label}
                      </p>
                    </div>
                  </div>
                  {pr.color !== 'amber' && (
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                      <div className={`h-full rounded-full ${pr.color === 'emerald' ? 'bg-emerald-400' : 'bg-cyan-400'}`}
                        style={{width:`${pr.score}%`}} />
                    </div>
                  )}
                  <p className="text-xs text-slate-500">{pr.tip}</p>
                </div>
              ))}

              {/* Treatment timeline simplified */}
              <div className="bg-white rounded-xl border border-slate-100 p-4">
                <p className="text-sm font-semibold text-slate-800 mb-3" style={{fontFamily:'Outfit'}}>Lo que hicimos juntos</p>
                <div className="space-y-3">
                  {[
                    { done:true, label:'Limpieza profunda', date:'Jul 2026', icon:'✓' },
                    { done:true, label:'Restauración diente #14', date:'May 2026', icon:'✓' },
                    { done:false, label:'Extracción diente #38', date:'Ago 2026', icon:'→' },
                    { done:false, label:'Control post-extracción', date:'Sep 2026', icon:'○' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${item.done ? 'bg-emerald-100 text-emerald-600' : i === 2 ? 'bg-cyan-100 text-cyan-600' : 'bg-slate-100 text-slate-400'}`}>
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${item.done ? 'text-slate-500 line-through' : 'text-slate-800 font-medium'}`}>{item.label}</p>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{item.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div className="flex border-t border-slate-100 bg-white px-2 py-2 shrink-0">
          {[
            { id:'inicio' as PatientTab, label:'Inicio', icon:'🏠' },
            { id:'agenda' as PatientTab, label:'Citas', icon:'📅' },
            { id:'pagos' as PatientTab, label:'Pagos', icon:'💳' },
            { id:'avances' as PatientTab, label:'Avances', icon:'📊' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition-colors ${tab === t.id ? 'text-cyan-600' : 'text-slate-400'}`}>
              <span className="text-lg">{t.icon}</span>
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
