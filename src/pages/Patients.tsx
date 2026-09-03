import { useState } from 'react'

const patients = [
  { id: 1, name: 'María González', age: 34, phone: '310 234 5678', email: 'maria.g@gmail.com', lastVisit: '2026-07-14', nextVisit: '2026-08-10', tags: ['ortodoncia', 'hipertensión'], status: 'active' },
  { id: 2, name: 'Carlos Rivas', age: 52, phone: '315 987 6543', email: 'c.rivas@hotmail.com', lastVisit: '2026-08-01', nextVisit: '2026-08-08', tags: ['diabético', 'cirugía'], status: 'active' },
  { id: 3, name: 'Sofía Mendez', age: 28, phone: '300 112 2334', email: 'sofiamendez@gmail.com', lastVisit: '2026-06-20', nextVisit: '2026-08-10', tags: ['embarazada'], status: 'active' },
  { id: 4, name: 'Andrés Torres', age: 41, phone: '320 445 6677', email: 'atorres@empresa.co', lastVisit: '2026-07-30', nextVisit: null, tags: [], status: 'active' },
  { id: 5, name: 'Lucía Reyes', age: 16, phone: '312 333 4455', email: null, lastVisit: '2026-07-22', nextVisit: '2026-08-14', tags: ['ortodoncia', 'menor'], status: 'active' },
  { id: 6, name: 'Javier Molina', age: 67, phone: '318 667 8890', email: 'jmolina@gmail.com', lastVisit: '2026-05-11', nextVisit: '2026-08-08', tags: ['anticoagulante', 'mayor'], status: 'active' },
  { id: 7, name: 'Valentina Cruz', age: 23, phone: '301 556 9900', email: 'vcruz@uni.edu.co', lastVisit: '2026-07-18', nextVisit: '2026-08-16', tags: [], status: 'inactive' },
  { id: 8, name: 'Roberto Patiño', age: 45, phone: '317 223 4411', email: 'rpati@yahoo.com', lastVisit: '2025-12-05', nextVisit: null, tags: ['alérgico penicilina'], status: 'inactive' },
]

const tagColors: Record<string, string> = {
  'ortodoncia': 'bg-violet-100 text-violet-700',
  'hipertensión': 'bg-rose-100 text-rose-700',
  'diabético': 'bg-amber-100 text-amber-700',
  'cirugía': 'bg-orange-100 text-orange-700',
  'embarazada': 'bg-pink-100 text-pink-700',
  'anticoagulante': 'bg-red-100 text-red-700',
  'menor': 'bg-sky-100 text-sky-700',
  'mayor': 'bg-slate-100 text-slate-600',
  'alérgico penicilina': 'bg-red-100 text-red-700',
}

export default function Patients() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<typeof patients[0] | null>(null)
  const [filter, setFilter] = useState<'all'|'active'|'inactive'>('all')

  const filtered = patients.filter(p =>
    (filter === 'all' || p.status === filter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) ||
     p.phone.includes(search) ||
     p.tags.some(t => t.includes(search.toLowerCase())))
  )

  return (
    <div className="flex h-full fade-in">
      {/* List */}
      <div className={`${selected ? 'w-1/2' : 'w-full'} flex flex-col h-full transition-all duration-200`}>
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Pacientes</h1>
            <button className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors">
              + Nuevo paciente
            </button>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50 bg-white"
                placeholder="Buscar por nombre, teléfono o etiqueta..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex border border-slate-200 rounded-lg overflow-hidden text-sm">
              {(['all','active','inactive'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-2 font-medium transition-colors ${filter === f ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                  {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-2 pb-6">
          {filtered.map(p => (
            <div key={p.id}
              onClick={() => setSelected(selected?.id === p.id ? null : p)}
              className={`bg-white rounded-xl border transition-all cursor-pointer hover:shadow-sm ${selected?.id === p.id ? 'border-cyan-400 shadow-sm' : 'border-slate-100'}`}>
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white font-semibold text-sm shrink-0" style={{fontFamily:'Outfit'}}>
                  {p.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-800 text-sm">{p.name}</p>
                    <span className="text-xs text-slate-400">{p.age} años</span>
                    {p.status === 'inactive' && <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Inactivo</span>}
                  </div>
                  <p className="text-xs text-slate-400">{p.phone} {p.email ? `· ${p.email}` : ''}</p>
                  {p.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {p.tags.map(t => (
                        <span key={t} className={`text-xs px-1.5 py-0.5 rounded font-medium ${tagColors[t] || 'bg-slate-100 text-slate-600'}`}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400">Última visita</p>
                  <p className="text-xs font-mono text-slate-600">{p.lastVisit}</p>
                  {p.nextVisit && (
                    <>
                      <p className="text-xs text-slate-400 mt-1">Próxima</p>
                      <p className="text-xs font-mono text-cyan-600 font-medium">{p.nextVisit}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <p className="text-4xl mb-3">🦷</p>
              <p className="font-medium">Sin resultados</p>
              <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-1/2 border-l border-slate-200 bg-white flex flex-col h-full overflow-y-auto slide-up">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-xl font-bold" style={{fontFamily:'Outfit'}}>
                  {selected.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>{selected.name}</h2>
                  <p className="text-sm text-slate-500">{selected.age} años · {selected.phone}</p>
                  <div className="flex gap-1 mt-1">
                    {selected.tags.map(t => (
                      <span key={t} className={`text-xs px-1.5 py-0.5 rounded font-medium ${tagColors[t] || 'bg-slate-100 text-slate-600'}`}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 py-2 text-sm font-medium bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">Historia clínica</button>
              <button className="flex-1 py-2 text-sm font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">Nueva cita</button>
              <button className="flex-1 py-2 text-sm font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">Odontograma</button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Medical history summary */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3" style={{fontFamily:'Outfit'}}>Antecedentes médicos</h3>
              <div className="space-y-2">
                {[
                  ['Medicamentos actuales', selected.tags.includes('anticoagulante') ? 'Warfarina 5mg/día' : selected.tags.includes('diabético') ? 'Metformina 850mg' : 'Ninguno'],
                  ['Alergias', selected.tags.includes('alérgico penicilina') ? 'Penicilina — reacción severa' : 'Sin alergias conocidas'],
                  ['Enfermedades sistémicas', selected.tags.includes('hipertensión') ? 'Hipertensión arterial' : selected.tags.includes('diabético') ? 'Diabetes Mellitus tipo 2' : 'Ninguna'],
                  ['Grupo sanguíneo', 'O+'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-sm py-2 border-b border-slate-50">
                    <span className="text-slate-500">{label}</span>
                    <span className={`font-medium ${val.includes('severa') || val.includes('Warfarina') ? 'text-red-600' : 'text-slate-700'}`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visit history */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3" style={{fontFamily:'Outfit'}}>Historial de visitas</h3>
              <div className="space-y-2">
                {[
                  { date: selected.lastVisit, proc: 'Control periódico', dr: 'Dr. Herrera', amount: '$85.000' },
                  { date: '2026-05-22', proc: 'Resina composit #12', dr: 'Dr. Herrera', amount: '$180.000' },
                  { date: '2026-02-14', proc: 'Limpieza ultrasónica', dr: 'Dra. Suárez', amount: '$95.000' },
                ].map((v, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-400 w-24">{v.date}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{v.proc}</p>
                        <p className="text-xs text-slate-400">{v.dr}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-600">{v.amount}</span>
                      <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
