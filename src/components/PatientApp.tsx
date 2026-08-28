import { useState } from 'react'

type Tab = 'inicio' | 'agenda' | 'pagos' | 'tratamientos' | 'tele' | 'documentos' | 'perfil'

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

// ── Data ──────────────────────────────────────────────────────────────────────
const PATIENT = { name: 'Carlos Rivas', email: 'carlos.rivas@gmail.com', phone: '+57 310 455 7821', dob: '1988-04-12', blood: 'O+', eps: 'Sura EPS', doc: '1.015.672.340', city: 'Bogotá', address: 'Cra. 7 # 45-20 Apto 302' }

const NEXT_APPT = { date: '2026-08-28', time: '10:30', dr: 'Dr. Andrés Herrera', specialty: 'Odontología general', procedure: 'Extracción #38', box: 'Box 2', type: 'Presencial' as const, confirmed: true }

const APPTS = [
  { id:1, date:'2026-08-28', time:'10:30', dr:'Dr. Andrés Herrera', procedure:'Extracción #38',           type:'Presencial', status:'confirmed' },
  { id:2, date:'2026-09-15', time:'09:00', dr:'Dra. Laura Suárez',  procedure:'Control ortodoncia',       type:'Virtual',    status:'pending'   },
  { id:3, date:'2026-10-02', time:'11:30', dr:'Dr. Andrés Herrera', procedure:'Control post-extracción',  type:'Presencial', status:'pending'   },
  { id:4, date:'2026-08-05', time:'10:00', dr:'Dra. Laura Suárez',  procedure:'Ajuste brackets',          type:'Presencial', status:'completed' },
  { id:5, date:'2026-07-18', time:'09:30', dr:'Dr. Andrés Herrera', procedure:'Limpieza ultrasónica',     type:'Presencial', status:'completed' },
  { id:6, date:'2026-05-20', time:'08:00', dr:'Dr. Andrés Herrera', procedure:'Restauración composit #14','type':'Presencial', status:'completed' },
]

const PAYMENTS = [
  { id:1, date:'2026-08-28', procedure:'Extracción #38',             amount:380000,  status:'pending', due:'2026-09-05', receipt:'' },
  { id:2, date:'2026-08-05', procedure:'Ajuste de brackets',         amount:120000,  status:'paid',    paidDate:'2026-08-05', receipt:'REC-0412' },
  { id:3, date:'2026-07-18', procedure:'Limpieza ultrasónica',       amount:95000,   status:'paid',    paidDate:'2026-07-18', receipt:'REC-0401' },
  { id:4, date:'2026-05-20', procedure:'Restauración composit #14',  amount:180000,  status:'paid',    paidDate:'2026-05-20', receipt:'REC-0388' },
]

const PLAN_TOTAL   = 2_400_000
const PLAN_PAID    = 395_000
const INSTALLMENTS = [
  { n:1, amount:395000, due:'2026-06-05', status:'paid' },
  { n:2, amount:395000, due:'2026-07-05', status:'paid' },
  { n:3, amount:395000, due:'2026-08-05', status:'pending' },
  { n:4, amount:395000, due:'2026-09-05', status:'pending' },
  { n:5, amount:395000, due:'2026-10-05', status:'pending' },
  { n:6, amount:425000, due:'2026-11-05', status:'pending' },
]

const TREATMENTS = [
  { name:'Ortodoncia metálica', progress:42, phases:['Diagnóstico ✓','Colocación brackets ✓','Fase activa 1 ✓','Fase activa 2','Retención'], current:3, color:'#7C3AED', start:'2026-01-10', est:'2027-06-01' },
  { name:'Restauración #14',    progress:100, phases:['Diagnóstico ✓','Preparación ✓','Restauración ✓'], current:3, color:'#1E8C82', start:'2026-05-15', est:'2026-05-20' },
  { name:'Extracción #38',      progress:10, phases:['Diagnóstico ✓','Cirugía (28 Ago)','Control post-op'], current:1, color:'#D97706', start:'2026-08-23', est:'2026-09-20' },
]

const DOCUMENTS = [
  { id:1, name:'Consentimiento informado — Ortodoncia',  type:'PDF', size:'312 KB', date:'2026-01-08', category:'Consentimiento' },
  { id:2, name:'Presupuesto ortodoncia v2',               type:'PDF', size:'180 KB', date:'2026-01-10', category:'Presupuesto'    },
  { id:3, name:'Radiografía panorámica — Ene 2026',      type:'IMG', size:'2.4 MB', date:'2026-01-08', category:'Radiografía'    },
  { id:4, name:'Consentimiento — Extracción #38',        type:'PDF', size:'290 KB', date:'2026-08-23', category:'Consentimiento' },
  { id:5, name:'Radiografía periapical #38',             type:'IMG', size:'1.1 MB', date:'2026-08-23', category:'Radiografía'    },
  { id:6, name:'Presupuesto extracción + cuotas',        type:'PDF', size:'155 KB', date:'2026-08-23', category:'Presupuesto'    },
]

const DOCTORS = ['Dr. Andrés Herrera', 'Dra. Laura Suárez', 'Dr. Carlos Mejía']
const MOTIVOS = ['Revisión / control', 'Dolor dental', 'Consulta ortodoncia', 'Limpieza', 'Otro']
const TIME_SLOTS = ['08:00', '09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '16:00']

function fmt(n: number) { return new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 }).format(n) }
function fmtDate(iso: string) { return new Date(iso + 'T00:00').toLocaleDateString('es-CO', { day:'numeric', month:'long', year:'numeric' }) }

// ── Modal Solicitar Cita ───────────────────────────────────────────────────────
function ModalCita({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ modality:'Presencial', doctor:'', motivo:'', date:'', time:'', notes:'' })
  const [sent, setSent] = useState(false)

  function submit() {
    setSent(true)
    setTimeout(() => { setSent(false); onClose() }, 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800 text-base" style={{fontFamily:'Outfit'}}>Solicitar cita</h2>
            {!sent && <p className="text-xs text-slate-400 mt-0.5">Paso {step} de 3</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5"/>
          </button>
        </div>

        {sent ? (
          <div className="px-6 py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Icon d="M5 13l4 4L19 7" className="w-7 h-7 text-emerald-600"/>
            </div>
            <p className="font-bold text-slate-800 text-lg mb-1" style={{fontFamily:'Outfit'}}>¡Solicitud enviada!</p>
            <p className="text-slate-500 text-sm">Te confirmaremos por correo y WhatsApp.</p>
          </div>
        ) : (
          <>
            {/* Step progress */}
            <div className="flex px-6 pt-4 gap-2">
              {[1,2,3].map(s => (
                <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= step ? 'bg-cyan-500' : 'bg-slate-100'}`}/>
              ))}
            </div>

            <div className="px-6 py-5 space-y-4">
              {step === 1 && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-2">Modalidad</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Presencial','Virtual'].map(m => (
                        <button key={m} onClick={() => setForm(f => ({...f, modality:m}))}
                          className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${form.modality === m ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                          {m === 'Presencial' ? '🏥' : '💻'} {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-2">Doctor</label>
                    <select value={form.doctor} onChange={e => setForm(f=>({...f, doctor:e.target.value}))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 bg-white">
                      <option value="">Seleccionar...</option>
                      {DOCTORS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-2">Motivo de consulta</label>
                    <select value={form.motivo} onChange={e => setForm(f=>({...f, motivo:e.target.value}))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 bg-white">
                      <option value="">Seleccionar...</option>
                      {MOTIVOS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-2">Fecha preferida</label>
                    <input type="date" value={form.date} onChange={e => setForm(f=>({...f, date:e.target.value}))}
                      min="2026-08-24"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-2">Hora preferida</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {TIME_SLOTS.map(t => (
                        <button key={t} onClick={() => setForm(f=>({...f, time:t}))}
                          className={`py-2 rounded-lg text-xs font-medium transition-all border ${form.time === t ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-slate-200 text-slate-600 hover:border-cyan-300 hover:text-cyan-600'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  {/* Summary */}
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                    {[
                      ['Modalidad', form.modality],
                      ['Doctor', form.doctor || '—'],
                      ['Motivo', form.motivo || '—'],
                      ['Fecha', form.date ? fmtDate(form.date) : '—'],
                      ['Hora', form.time || '—'],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between text-sm">
                        <span className="text-slate-500">{l}</span>
                        <span className="font-medium text-slate-800">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-2">Notas adicionales (opcional)</label>
                    <textarea value={form.notes} onChange={e => setForm(f=>({...f, notes:e.target.value}))} rows={3}
                      placeholder="Ej: tengo alergia a la lidocaína..."
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 pb-5 flex gap-2">
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Atrás
                </button>
              )}
              {step < 3 ? (
                <button onClick={() => setStep(s => s + 1)}
                  className="flex-1 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 transition-colors">
                  Continuar
                </button>
              ) : (
                <button onClick={submit}
                  className="flex-1 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 transition-colors">
                  Confirmar solicitud
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
  { id:'pagos',        label:'Pagos',             iconPath:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { id:'tratamientos', label:'Mis tratamientos',  iconPath:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { id:'tele',         label:'Teleodontología',   iconPath:'M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { id:'documentos',   label:'Documentos',        iconPath:'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id:'perfil',       label:'Mi perfil',         iconPath:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
]

// ── TAB SECTIONS ──────────────────────────────────────────────────────────────

function TabInicio({ onRequestAppt }: { onRequestAppt: () => void }) {
  return (
    <div className="space-y-6">
      {/* Next appointment hero card */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background:'linear-gradient(135deg, #0B3D3A, #1E8C82)' }}>
        <div className="absolute right-4 top-4 text-6xl opacity-10">🦷</div>
        <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-3" style={{fontFamily:'Outfit'}}>Próxima cita</p>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xl font-bold mb-1" style={{fontFamily:'Outfit'}}>{NEXT_APPT.procedure}</p>
            <p className="text-white/80 text-sm">{NEXT_APPT.dr} · {NEXT_APPT.box}</p>
            <div className="flex items-center gap-3 mt-4">
              <div className="bg-white/15 rounded-lg px-3 py-1.5">
                <p className="text-[10px] text-white/60 font-medium">Fecha</p>
                <p className="text-sm font-bold">{fmtDate(NEXT_APPT.date)}</p>
              </div>
              <div className="bg-white/15 rounded-lg px-3 py-1.5">
                <p className="text-[10px] text-white/60 font-medium">Hora</p>
                <p className="text-sm font-bold">{NEXT_APPT.time}</p>
              </div>
              <div className="bg-white/15 rounded-lg px-3 py-1.5">
                <p className="text-[10px] text-white/60 font-medium">Tipo</p>
                <p className="text-sm font-bold">{NEXT_APPT.type}</p>
              </div>
            </div>
          </div>
          {NEXT_APPT.confirmed && (
            <span className="bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full">Confirmada</span>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3" style={{fontFamily:'Outfit'}}>Accesos rápidos</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon:'📅', label:'Solicitar cita', action: onRequestAppt, accent:'#1E8C82' },
            { icon:'💳', label:'Ver pagos',      action: undefined,     accent:'#7C3AED' },
            { icon:'📋', label:'Documentos',     action: undefined,     accent:'#D97706' },
            { icon:'📹', label:'Videoconsulta',  action: undefined,     accent:'#059669' },
          ].map((q, i) => (
            <button key={i} onClick={q.action}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-md hover:border-transparent transition-all group">
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
          { label:'Pago pendiente',    value: fmt(380000),    sub:'Extracción #38',      color:'#D97706', bg:'bg-amber-50' },
          { label:'Tratamientos activos', value:'2 activos',  sub:'Ortodoncia + Extr.',  color:'#7C3AED', bg:'bg-violet-50' },
          { label:'Próximo control',   value:'28 Ago',        sub:'10:30 — Dr. Herrera', color:'#1E8C82', bg:'bg-cyan-50'  },
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

function TabAgenda({ onRequestAppt }: { onRequestAppt: () => void }) {
  const upcoming = APPTS.filter(a => a.status !== 'completed')
  const past     = APPTS.filter(a => a.status === 'completed')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800 text-lg" style={{fontFamily:'Outfit'}}>Mi agenda</h2>
        <button onClick={onRequestAppt}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors"
          style={{ backgroundColor:'#1E8C82' }}>
          <Icon d="M12 4v16m8-8H4" className="w-4 h-4"/>
          Solicitar cita
        </button>
      </div>

      {/* Upcoming */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3" style={{fontFamily:'Outfit'}}>Próximas citas</p>
        <div className="space-y-2">
          {upcoming.map(a => (
            <div key={a.id} className="flex items-center gap-4 bg-white rounded-2xl border border-slate-100 px-5 py-4 hover:shadow-sm transition-all">
              <div className="text-center w-12 shrink-0">
                <p className="text-lg font-bold text-slate-800 leading-none">{new Date(a.date+'T00:00').getDate()}</p>
                <p className="text-[10px] text-slate-400 uppercase">{new Date(a.date+'T00:00').toLocaleString('es-CO',{month:'short'})}</p>
              </div>
              <div className="w-px h-10 bg-slate-100" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm">{a.procedure}</p>
                <p className="text-xs text-slate-500 mt-0.5">{a.dr} · {a.time}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                a.type === 'Virtual' ? 'bg-violet-100 text-violet-600' : 'bg-cyan-50 text-cyan-700'
              }`}>{a.type}</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                a.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
              }`}>{a.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3" style={{fontFamily:'Outfit'}}>Historial</p>
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              {['Fecha','Procedimiento','Doctor','Tipo'].map(h => (
                <th key={h} className="text-left text-xs text-slate-400 font-medium px-4 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {past.map(a => (
                <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(a.date)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{a.procedure}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{a.dr}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.type === 'Virtual' ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500'}`}>{a.type}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function TabPagos() {
  const pending  = PAYMENTS.filter(p => p.status === 'pending')
  const totalPending = pending.reduce((s, p) => s + p.amount, 0)
  const pct = Math.round((PLAN_PAID / PLAN_TOTAL) * 100)

  return (
    <div className="space-y-6">
      {/* Pending banner */}
      {totalPending > 0 && (
        <div className="rounded-2xl p-5 flex items-center justify-between"
          style={{ background:'linear-gradient(135deg, #D97706, #B45309)' }}>
          <div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-1">Pago pendiente</p>
            <p className="text-white text-3xl font-bold" style={{fontFamily:'Outfit'}}>{fmt(totalPending)}</p>
            <p className="text-white/70 text-xs mt-1">Vence el {fmtDate(pending[0]?.due ?? '')}</p>
          </div>
          <button className="px-5 py-2.5 bg-white text-amber-700 font-bold text-sm rounded-xl hover:shadow-lg transition-all">
            Pagar ahora
          </button>
        </div>
      )}

      {/* Installment plan */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>Plan de cuotas — Ortodoncia</p>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">{pct}% pagado</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width:`${pct}%` }}/>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {INSTALLMENTS.map(c => (
            <div key={c.n} className={`rounded-xl p-3 border ${c.status === 'paid' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-500">Cuota {c.n}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${c.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                  {c.status === 'paid' ? '✓ Pagada' : 'Pendiente'}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-700">{fmt(c.amount)}</p>
              <p className="text-[10px] text-slate-400">{fmtDate(c.due)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Receipts table */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3" style={{fontFamily:'Outfit'}}>Recibos y facturas</p>
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              {['Fecha','Procedimiento','Monto','Estado','Recibo'].map(h => (
                <th key={h} className="text-left text-xs text-slate-400 font-medium px-4 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {PAYMENTS.map(p => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(p.date)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{p.procedure}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800 font-mono">{fmt(p.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                      {p.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.status === 'paid' && (
                      <button className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700 font-medium transition-colors">
                        <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-3.5 h-3.5"/>
                        Descargar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function TabTratamientos() {
  return (
    <div className="space-y-5">
      <h2 className="font-bold text-slate-800 text-lg" style={{fontFamily:'Outfit'}}>Mis tratamientos</h2>
      {TREATMENTS.map(t => (
        <div key={t.name} className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>{t.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">Inicio: {fmtDate(t.start)} · Est. finalización: {fmtDate(t.est)}</p>
            </div>
            <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ backgroundColor: t.color+'15', color: t.color }}>
              {t.progress}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-5">
            <div className="h-full rounded-full transition-all duration-700" style={{ width:`${t.progress}%`, backgroundColor: t.color }}/>
          </div>

          {/* Phases */}
          <div className="flex gap-0 items-start">
            {t.phases.map((phase, i) => {
              const done = i < t.current
              const active = i === t.current
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="flex items-center w-full">
                    {i > 0 && <div className={`flex-1 h-0.5 ${done ? '' : 'bg-slate-200'}`} style={done ? { backgroundColor: t.color } : {}}/>}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 transition-all ${done ? 'text-white' : active ? 'bg-white border-current' : 'bg-white border-slate-200 text-slate-300'}`}
                      style={done ? { backgroundColor: t.color, borderColor: t.color } : active ? { color: t.color, borderColor: t.color } : {}}>
                      {done ? '✓' : i + 1}
                    </div>
                    {i < t.phases.length - 1 && <div className={`flex-1 h-0.5 ${done ? '' : 'bg-slate-200'}`} style={done ? { backgroundColor: t.color } : {}}/>}
                  </div>
                  <p className="text-[10px] text-center mt-1.5 leading-tight px-1"
                    style={{ color: done ? t.color : active ? t.color : '#94a3b8', fontWeight: active ? 600 : 400 }}>
                    {phase.replace(' ✓', '')}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function TabTele({ onRequestAppt }: { onRequestAppt: () => void }) {
  const [inCall, setInCall] = useState(false)
  const [checks, setChecks] = useState({ cam: false, mic: false, conn: false, quiet: false })
  const allChecked = Object.values(checks).every(Boolean)

  if (inCall) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-lg" style={{fontFamily:'Outfit'}}>Videoconsulta en curso</h2>
          <div className="flex items-center gap-2 bg-emerald-100 text-emerald-600 text-xs font-semibold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
            Conectado · 02:34
          </div>
        </div>

        {/* Video area */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900" style={{height:320}}>
          {/* Doctor feed (main) */}
          <div className="absolute inset-0 flex items-center justify-center" style={{background:'linear-gradient(135deg,#0B3D3A,#062422)'}}>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-700 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">AH</div>
              <p className="text-white font-semibold">Dr. Andrés Herrera</p>
              <p className="text-white/50 text-sm">Odontología general</p>
            </div>
          </div>
          {/* Self preview */}
          <div className="absolute bottom-4 right-4 w-32 h-24 rounded-xl bg-slate-700 border-2 border-white/20 flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm mx-auto mb-1">CR</div>
              <p className="text-white/70 text-xs">Tú</p>
            </div>
          </div>
          {/* Recording badge */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/40 backdrop-blur rounded-lg px-2.5 py-1.5">
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"/>
            <span className="text-white text-xs font-medium">REC</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 py-2">
          {[
            { icon:'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z', label:'Mic',    bg:'bg-white border border-slate-200 text-slate-600' },
            { icon:'M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', label:'Cám', bg:'bg-white border border-slate-200 text-slate-600' },
            { icon:'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label:'Docs', bg:'bg-white border border-slate-200 text-slate-600' },
          ].map(c => (
            <button key={c.label} className={`flex flex-col items-center gap-1 w-16 h-16 rounded-2xl ${c.bg} hover:shadow-md transition-all`}>
              <Icon d={c.icon} className="w-5 h-5 mt-3"/>
              <span className="text-[10px] font-medium">{c.label}</span>
            </button>
          ))}
          <button onClick={() => setInCall(false)}
            className="flex flex-col items-center gap-1 w-16 h-16 rounded-2xl bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-lg">
            <Icon d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" className="w-5 h-5 mt-3"/>
            <span className="text-[10px] font-medium">Colgar</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800 text-lg" style={{fontFamily:'Outfit'}}>Teleodontología</h2>
        <button onClick={onRequestAppt}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors"
          style={{ backgroundColor:'#1E8C82' }}>
          <Icon d="M12 4v16m8-8H4" className="w-4 h-4"/>
          Solicitar videoconsulta
        </button>
      </div>

      {/* Waiting room */}
      <div className="rounded-2xl border-2 border-dashed border-cyan-200 bg-cyan-50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
            <Icon d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" className="w-5 h-5 text-cyan-600"/>
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm" style={{fontFamily:'Outfit'}}>Sala de espera — Dr. Andrés Herrera</p>
            <p className="text-xs text-slate-500">Hoy, 15 Sep · 09:00</p>
          </div>
        </div>

        {/* Pre-call checklist */}
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3" style={{fontFamily:'Outfit'}}>Verifica antes de entrar</p>
        <div className="space-y-2 mb-5">
          {[
            { key:'cam'   as const, label:'Cámara funcionando y con buena iluminación'    },
            { key:'mic'   as const, label:'Micrófono activo — prueba diciendo "hola"'     },
            { key:'conn'  as const, label:'Conexión estable (WiFi recomendado)'            },
            { key:'quiet' as const, label:'Entorno tranquilo y privado'                    },
          ].map(c => (
            <label key={c.key} className="flex items-center gap-3 cursor-pointer group">
              <div onClick={() => setChecks(ch => ({...ch, [c.key]: !ch[c.key]}))}
                className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-all cursor-pointer ${checks[c.key] ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300 group-hover:border-emerald-400'}`}>
                {checks[c.key] && <Icon d="M5 13l4 4L19 7" className="w-3 h-3 text-white"/>}
              </div>
              <span className={`text-sm transition-colors ${checks[c.key] ? 'text-emerald-700 line-through opacity-60' : 'text-slate-700'}`}>{c.label}</span>
            </label>
          ))}
        </div>

        <button onClick={() => allChecked && setInCall(true)}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${allChecked ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
          {allChecked ? '📹 Ingresar a la videoconsulta' : `Completa el checklist (${Object.values(checks).filter(Boolean).length}/4)`}
        </button>
      </div>

      {/* Past telconsults */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3" style={{fontFamily:'Outfit'}}>Videoconsultas anteriores</p>
        {[
          { date:'2026-07-10', dr:'Dra. Laura Suárez', duration:'18 min', topic:'Control ortodoncia' },
          { date:'2026-05-30', dr:'Dr. Andrés Herrera', duration:'12 min', topic:'Seguimiento extracción' },
        ].map((v, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b last:border-0 border-slate-50">
            <div>
              <p className="text-sm font-semibold text-slate-700">{v.topic}</p>
              <p className="text-xs text-slate-400">{fmtDate(v.date)} · {v.dr} · {v.duration}</p>
            </div>
            <button className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold transition-colors">Ver grabación</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabDocumentos() {
  const [filter, setFilter] = useState('Todos')
  const cats = ['Todos', 'Consentimiento', 'Presupuesto', 'Radiografía']
  const visible = filter === 'Todos' ? DOCUMENTS : DOCUMENTS.filter(d => d.category === filter)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800 text-lg" style={{fontFamily:'Outfit'}}>Mis documentos</h2>
        <div className="flex gap-1.5">
          {cats.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${filter === c ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100">
            {['Documento','Tipo','Tamaño','Fecha',''].map(h => (
              <th key={h} className="text-left text-xs text-slate-400 font-medium px-4 py-3">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {visible.map(d => (
              <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${d.type === 'PDF' ? 'bg-rose-100 text-rose-600' : 'bg-violet-100 text-violet-600'}`}>
                      {d.type}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{d.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    d.category === 'Consentimiento' ? 'bg-emerald-100 text-emerald-600' :
                    d.category === 'Presupuesto'    ? 'bg-amber-100 text-amber-600' :
                    'bg-violet-100 text-violet-600'
                  }`}>{d.category}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 font-mono">{d.size}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(d.date)}</td>
                <td className="px-4 py-3">
                  <button className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700 font-semibold transition-colors">
                    <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-3.5 h-3.5"/>
                    Descargar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TabPerfil() {
  const [form, setForm] = useState(PATIENT)
  const [saved, setSaved] = useState(false)

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const field = (label: string, key: keyof typeof PATIENT) => (
    <div key={key}>
      <label className="text-xs font-semibold text-slate-500 block mb-1.5">{label}</label>
      <input value={form[key]} onChange={e => setForm(f => ({...f, [key]:e.target.value}))}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"/>
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800 text-lg" style={{fontFamily:'Outfit'}}>Mi perfil</h2>
        <button onClick={save}
          className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-cyan-600 text-white hover:bg-cyan-500'}`}>
          {saved ? <><Icon d="M5 13l4 4L19 7" className="w-4 h-4"/>Guardado</> : 'Guardar cambios'}
        </button>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {PATIENT.name.split(' ').map(n=>n[0]).join('')}
        </div>
        <div>
          <p className="font-bold text-slate-800 text-base">{form.name}</p>
          <p className="text-sm text-slate-500">{form.email}</p>
          <button className="text-xs text-cyan-600 hover:text-cyan-700 font-medium mt-1 transition-colors">Cambiar foto</button>
        </div>
      </div>

      {/* Personal data */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4" style={{fontFamily:'Outfit'}}>Datos personales</p>
        <div className="grid grid-cols-2 gap-4">
          {field('Nombre completo', 'name')}
          {field('Correo electrónico', 'email')}
          {field('Teléfono', 'phone')}
          {field('Fecha de nacimiento', 'dob')}
          {field('Ciudad', 'city')}
          {field('Dirección', 'address')}
        </div>
      </div>

      {/* Health data */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4" style={{fontFamily:'Outfit'}}>Datos de salud y seguro</p>
        <div className="grid grid-cols-2 gap-4">
          {field('Tipo de sangre', 'blood')}
          {field('EPS / Seguro', 'eps')}
          {field('N° Identificación', 'doc')}
        </div>
      </div>
    </div>
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────
export default function PatientApp({ onLogout }: { onLogout?: () => void }) {
  const [tab, setTab] = useState<Tab>('inicio')
  const [collapsed, setCollapsed] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const SECTION_TITLES: Record<Tab, string> = {
    inicio:'Inicio', agenda:'Mi agenda', pagos:'Pagos', tratamientos:'Mis tratamientos',
    tele:'Teleodontología', documentos:'Documentos', perfil:'Mi perfil',
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {showModal && <ModalCita onClose={() => setShowModal(false)} />}

      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-14' : 'w-56'} shrink-0 flex flex-col h-full transition-all duration-200 bg-white border-r border-slate-100`}>
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-100 ${collapsed ? 'justify-center' : ''}`}>
          <CxLogo size={26} />
          {!collapsed && (
            <div>
              <p className="font-bold text-sm leading-tight tracking-wide" style={{ fontFamily:'Outfit', color:'#0B3D3A' }}>CORONYX</p>
              <p className="text-[10px] font-medium" style={{ color:'#1E8C82' }}>Portal del Paciente</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = tab === item.id
            return (
              <button key={item.id} onClick={() => setTab(item.id)} title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm transition-all relative ${collapsed ? 'justify-center' : ''} ${active ? 'bg-cyan-50 text-cyan-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
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
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">CR</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate">Carlos Rivas</p>
                <p className="text-[10px] text-slate-400 truncate">Paciente</p>
              </div>
              {onLogout && (
                <button onClick={onLogout} className="text-slate-300 hover:text-slate-500 transition-colors text-xs" title="Cerrar sesión">⏏</button>
              )}
            </>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center text-slate-400 shrink-0">
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors"
            style={{ backgroundColor:'#1E8C82' }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Solicitar cita
          </button>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer">CR</div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {tab === 'inicio'       && <TabInicio       onRequestAppt={() => setShowModal(true)} />}
          {tab === 'agenda'       && <TabAgenda       onRequestAppt={() => setShowModal(true)} />}
          {tab === 'pagos'        && <TabPagos />}
          {tab === 'tratamientos' && <TabTratamientos />}
          {tab === 'tele'         && <TabTele         onRequestAppt={() => setShowModal(true)} />}
          {tab === 'documentos'   && <TabDocumentos />}
          {tab === 'perfil'       && <TabPerfil />}
        </main>
      </div>
    </div>
  )
}
