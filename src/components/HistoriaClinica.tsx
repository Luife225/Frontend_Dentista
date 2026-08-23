import { useState } from 'react'

const initialRecords = [
  {
    id: 1, date: '2026-08-01', patient: 'Carlos Rivas', motivo: 'Dolor agudo zona posterior inferior',
    diagnostico: 'Caries profunda #14 · Sensibilidad post-endodoncia #36',
    procedimiento: 'Exploración clínica + radiografía periapical · Aplicación flúor 2% NaF',
    plan: 'Restauración compuesta #14 · Control radiográfico #36 en 4 semanas',
    indicaciones: 'No alimentos calientes/fríos 2h. Analgésico de rescate si dolor >6/10.',
    dr: 'Dr. Herrera', duration: 45, status: 'complete',
    vitals: { pa: '120/80', fc: '78', peso: '82kg' },
  },
  {
    id: 2, date: '2026-05-22', patient: 'Carlos Rivas', motivo: 'Control periódico',
    diagnostico: 'Sin caries activas. Placa bacteriana moderada zona interproximal.',
    procedimiento: 'Limpieza ultrasónica + pulido coronas · Instrucción de higiene oral',
    plan: 'Control en 6 meses. Hilo dental diario.',
    indicaciones: 'Cepillado técnica Bass modificada. Colutorios con clorhexidina al 0.12% por 10 días.',
    dr: 'Dra. Suárez', duration: 60, status: 'complete',
    vitals: { pa: '125/82', fc: '74', peso: '81kg' },
  },
]

// ─── Modal genérico ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors text-lg leading-none">
            ×
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Modal: Nueva consulta ─────────────────────────────────────────────────────
function NuevaConsultaModal({ onClose, onSave }: { onClose: () => void; onSave: (record: typeof initialRecords[0]) => void }) {
  const [dictating, setDictating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    motivo: '', diagnostico: '', procedimiento: '', plan: '', indicaciones: '',
    pa: '', fc: '', peso: '',
  })

  function handleSave() {
    setSaving(true)
    setTimeout(() => {
      const today = new Date().toISOString().split('T')[0]
      onSave({
        id: Date.now(),
        date: today,
        patient: 'Carlos Rivas',
        motivo: form.motivo || 'Nueva consulta',
        diagnostico: form.diagnostico,
        procedimiento: form.procedimiento,
        plan: form.plan,
        indicaciones: form.indicaciones,
        dr: 'Dr. Herrera',
        duration: 30,
        status: 'complete',
        vitals: { pa: form.pa || '—', fc: form.fc || '—', peso: form.peso ? `${form.peso}kg` : '—' },
      })
      setSaving(false)
      onClose()
    }, 800)
  }

  return (
    <Modal title="Nueva consulta" onClose={onClose}>
      {/* IA dictado */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-400">Paciente: <span className="text-slate-700 font-medium">Carlos Rivas</span></p>
        <button
          onClick={() => setDictating(!dictating)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${dictating ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>
          {dictating ? (
            <><div className="w-2 h-2 rounded-full bg-white animate-pulse"/><span>Escuchando...</span></>
          ) : (
            <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z"/></svg><span>Dictar con IA</span></>
          )}
        </button>
      </div>

      {/* Vitales */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { key: 'pa', label: 'Presión arterial', placeholder: '120/80' },
          { key: 'fc', label: 'Frec. cardíaca (bpm)', placeholder: '78' },
          { key: 'peso', label: 'Peso (kg)', placeholder: '82' },
        ].map(f => (
          <div key={f.key}>
            <label className="text-xs text-slate-500 font-medium block mb-1">{f.label}</label>
            <input
              value={form[f.key as keyof typeof form]}
              onChange={e => setForm({ ...form, [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {[
          { key: 'motivo', label: 'Motivo de consulta', placeholder: 'Describe el motivo principal de la visita...', rows: 2 },
          { key: 'diagnostico', label: 'Diagnóstico', placeholder: 'Hallazgos clínicos y diagnóstico presuntivo...', rows: 3 },
          { key: 'procedimiento', label: 'Procedimiento realizado', placeholder: 'Detalla cada procedimiento realizado durante la consulta...', rows: 3 },
          { key: 'plan', label: 'Plan de tratamiento', placeholder: 'Próximos pasos, remisiones, controles...', rows: 2 },
          { key: 'indicaciones', label: 'Indicaciones al paciente', placeholder: 'Instrucciones post-procedimiento...', rows: 2 },
        ].map(f => (
          <div key={f.key}>
            <label className="text-xs text-slate-500 font-semibold block mb-1.5" style={{ fontFamily: 'Outfit' }}>{f.label}</label>
            <textarea
              rows={f.rows}
              placeholder={f.placeholder}
              value={form[f.key as keyof typeof form]}
              onChange={e => setForm({ ...form, [f.key]: e.target.value })}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all ${dictating ? 'border-rose-300 bg-rose-50 placeholder-rose-300' : 'border-slate-200 bg-white'}`}/>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-5 border-t border-slate-100 mt-5">
        <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-500 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Guardando...</> : 'Guardar consulta'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Modal: Editar consulta ────────────────────────────────────────────────────
function EditarConsultaModal({ record, onClose, onSave }: { record: typeof initialRecords[0]; onClose: () => void; onSave: (r: typeof initialRecords[0]) => void }) {
  const [form, setForm] = useState({ ...record, pa: record.vitals.pa, fc: record.vitals.fc, peso: record.vitals.peso })
  const [saving, setSaving] = useState(false)

  function handleSave() {
    setSaving(true)
    setTimeout(() => {
      onSave({ ...record, ...form, vitals: { pa: form.pa, fc: form.fc, peso: form.peso } })
      setSaving(false)
      onClose()
    }, 700)
  }

  return (
    <Modal title="Editar consulta" onClose={onClose}>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[{ key: 'pa', label: 'P. arterial' }, { key: 'fc', label: 'FC (bpm)' }, { key: 'peso', label: 'Peso' }].map(f => (
          <div key={f.key}>
            <label className="text-xs text-slate-500 font-medium block mb-1">{f.label}</label>
            <input value={(form as Record<string, string>)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {[
          { key: 'motivo', label: 'Motivo de consulta', rows: 2 },
          { key: 'diagnostico', label: 'Diagnóstico', rows: 3 },
          { key: 'procedimiento', label: 'Procedimiento realizado', rows: 3 },
          { key: 'plan', label: 'Plan de tratamiento', rows: 2 },
          { key: 'indicaciones', label: 'Indicaciones al paciente', rows: 2 },
        ].map(f => (
          <div key={f.key}>
            <label className="text-xs text-slate-500 font-semibold block mb-1.5" style={{ fontFamily: 'Outfit' }}>{f.label}</label>
            <textarea rows={f.rows} value={(form as Record<string, string>)[f.key]}
              onChange={e => setForm({ ...form, [f.key]: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/50 bg-white"/>
          </div>
        ))}
      </div>
      <div className="flex gap-3 pt-5 border-t border-slate-100 mt-5">
        <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Guardando...</> : 'Guardar cambios'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Modal: Imprimir (preview) ─────────────────────────────────────────────────
function ImprimirModal({ record, onClose }: { record: typeof initialRecords[0]; onClose: () => void }) {
  return (
    <Modal title="Vista previa de impresión" onClose={onClose}>
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-sm font-mono print:block">
        <div className="text-center border-b border-slate-200 pb-4">
          <p className="font-bold text-lg text-slate-900" style={{ fontFamily: 'Outfit' }}>CORONYX — Sistema Dental</p>
          <p className="text-slate-500 text-xs">Historia Clínica Odontológica</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="text-slate-400">Paciente:</span> <strong>{record.patient}</strong></div>
          <div><span className="text-slate-400">Fecha:</span> <strong>{record.date}</strong></div>
          <div><span className="text-slate-400">Odontólogo:</span> <strong>{record.dr}</strong></div>
          <div><span className="text-slate-400">Duración:</span> <strong>{record.duration} min</strong></div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 rounded-lg p-3">
          <div><span className="text-slate-400">P.A:</span> <strong>{record.vitals.pa}</strong></div>
          <div><span className="text-slate-400">F.C:</span> <strong>{record.vitals.fc} bpm</strong></div>
          <div><span className="text-slate-400">Peso:</span> <strong>{record.vitals.peso}</strong></div>
        </div>
        {[
          { label: 'MOTIVO DE CONSULTA', val: record.motivo },
          { label: 'DIAGNÓSTICO', val: record.diagnostico },
          { label: 'PROCEDIMIENTO REALIZADO', val: record.procedimiento },
          { label: 'PLAN DE TRATAMIENTO', val: record.plan },
          { label: 'INDICACIONES AL PACIENTE', val: record.indicaciones },
        ].map(s => (
          <div key={s.label} className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{s.label}</p>
            <p className="text-slate-800 text-sm leading-relaxed">{s.val}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3 pt-4">
        <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">Cerrar</button>
        <button onClick={() => window.print()}
          className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #1E8C82, #0B3D3A)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
          Imprimir
        </button>
      </div>
    </Modal>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function HistoriaClinica() {
  const [records, setRecords] = useState(initialRecords)
  const [selected, setSelected] = useState(initialRecords[0])
  const [modal, setModal] = useState<'nueva' | 'editar' | 'imprimir' | null>(null)

  function handleSaveNew(record: typeof initialRecords[0]) {
    setRecords(prev => [record, ...prev])
    setSelected(record)
  }

  function handleSaveEdit(updated: typeof initialRecords[0]) {
    setRecords(prev => prev.map(r => r.id === updated.id ? updated : r))
    setSelected(updated)
  }

  return (
    <>
      <div className="flex h-full fade-in">
        {/* Records list */}
        <div className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-800 text-sm" style={{ fontFamily: 'Outfit' }}>Historia clínica</h2>
              <button
                onClick={() => setModal('nueva')}
                className="text-xs px-2.5 py-1 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-1">
                + Nueva
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-xs font-bold shrink-0">CR</div>
              <div>
                <p className="font-medium text-slate-700 text-xs">Carlos Rivas</p>
                <p className="text-slate-400 text-xs">52 años · #2</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {records.map(r => (
              <div key={r.id}
                onClick={() => setSelected(r)}
                className={`px-3 py-3 rounded-lg cursor-pointer transition-colors ${selected.id === r.id ? 'bg-cyan-50 border border-cyan-200' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">{r.date}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${r.status === 'complete' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {r.status === 'complete' ? 'Completa' : 'Borrador'}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-700 mt-1 leading-tight">{r.motivo.slice(0, 45)}{r.motivo.length > 45 ? '…' : ''}</p>
                <p className="text-xs text-slate-400 mt-0.5">{r.dr} · {r.duration} min</p>
              </div>
            ))}
          </div>
        </div>

        {/* Detail view */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono text-slate-400">{selected.date}</p>
                <h2 className="text-lg font-semibold text-slate-900 mt-0.5" style={{ fontFamily: 'Outfit' }}>{selected.motivo}</h2>
                <p className="text-sm text-slate-500">{selected.dr} · {selected.duration} min</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setModal('imprimir')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                  Imprimir
                </button>
                <button
                  onClick={() => setModal('editar')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  Editar
                </button>
              </div>
            </div>

            {/* Vitals */}
            <div className="grid grid-cols-3 gap-3">
              {[
                ['Presión arterial', selected.vitals.pa, 'mmHg'],
                ['Frecuencia cardíaca', selected.vitals.fc, 'bpm'],
                ['Peso', selected.vitals.peso, ''],
              ].map(([label, val, unit]) => (
                <div key={label} className="bg-white rounded-xl border border-slate-100 p-4">
                  <p className="text-xs text-slate-400" style={{ fontFamily: 'Outfit' }}>{label}</p>
                  <p className="text-xl font-bold text-slate-800 mt-1" style={{ fontFamily: 'Outfit' }}>{val}</p>
                  <p className="text-xs text-slate-400">{unit}</p>
                </div>
              ))}
            </div>

            {/* Clinical sections */}
            {[
              { label: 'Diagnóstico', icon: '🔬', content: selected.diagnostico, color: 'amber' },
              { label: 'Procedimiento realizado', icon: '⚙', content: selected.procedimiento, color: 'blue' },
              { label: 'Plan de tratamiento', icon: '📋', content: selected.plan, color: 'cyan' },
              { label: 'Indicaciones al paciente', icon: '📝', content: selected.indicaciones, color: 'emerald' },
            ].map(({ label, icon, content, color }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span>{icon}</span>
                  <p className={`text-sm font-semibold text-${color === 'amber' ? 'amber-700' : color === 'blue' ? 'blue-700' : color === 'cyan' ? 'cyan-700' : 'emerald-700'}`} style={{ fontFamily: 'Outfit' }}>{label}</p>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal === 'nueva'    && <NuevaConsultaModal onClose={() => setModal(null)} onSave={handleSaveNew}/>}
      {modal === 'editar'   && <EditarConsultaModal record={selected} onClose={() => setModal(null)} onSave={handleSaveEdit}/>}
      {modal === 'imprimir' && <ImprimirModal record={selected} onClose={() => setModal(null)}/>}
    </>
  )
}
