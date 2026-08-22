import { useState } from 'react'

const users = [
  { id:1, name:'Dr. Carlos Herrera', role:'Odontólogo', email:'cherrera@clinica.co', schedule:'L-V 8:00-17:00', status:'active' },
  { id:2, name:'Dra. Marcela Suárez', role:'Odontóloga', email:'msuarez@clinica.co', schedule:'L-J 9:00-18:00', status:'active' },
  { id:3, name:'Paula Ríos', role:'Asistente', email:'prios@clinica.co', schedule:'L-V 8:00-17:00', status:'active' },
  { id:4, name:'Jorge Medina', role:'Recepcionista', email:'jmedina@clinica.co', schedule:'L-S 8:00-13:00', status:'active' },
  { id:5, name:'Administrador', role:'Admin sistema', email:'admin@clinica.co', schedule:'—', status:'active' },
]

const tabs = ['General', 'Usuarios', 'Horarios', 'Notificaciones']

export default function Consultorio() {
  const [tab, setTab] = useState('General')
  const [editing, setEditing] = useState(false)

  return (
    <div className="p-6 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Configuración del consultorio</h1>
        {editing && (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Cancelar</button>
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500">Guardar cambios</button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-cyan-500 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'General' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Datos del consultorio</h2>
              <button onClick={() => setEditing(!editing)} className="text-xs text-cyan-600 hover:underline">
                {editing ? 'Cancelar' : 'Editar'}
              </button>
            </div>
            {[
              { label:'Nombre', val:'Clínica Dental Herrera & Asociados' },
              { label:'NIT', val:'900.456.123-1' },
              { label:'Dirección', val:'Cra. 15 #93-47 Of. 502, Bogotá' },
              { label:'Teléfono', val:'(601) 234-5678' },
              { label:'Email', val:'info@clinicaherrera.co' },
              { label:'Sitio web', val:'www.clinicaherrera.co' },
            ].map(({ label, val }) => (
              <div key={label} className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">{label}</label>
                {editing ? (
                  <input defaultValue={val} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" />
                ) : (
                  <p className="text-sm text-slate-700">{val}</p>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4" style={{fontFamily:'Outfit'}}>Horario de atención</h3>
              {[
                { day:'Lunes – Viernes', hours:'8:00 – 18:00' },
                { day:'Sábado', hours:'8:00 – 13:00' },
                { day:'Domingo', hours:'Cerrado' },
              ].map(({ day, hours }) => (
                <div key={day} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-600">{day}</span>
                  <span className={`text-sm font-medium ${hours === 'Cerrado' ? 'text-slate-300' : 'text-slate-800'}`}>{hours}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-3" style={{fontFamily:'Outfit'}}>Boxes / Consultorios</h3>
              {[
                { name:'Box 1', equip:'Unidad dental + RX periapical', status:'Activo' },
                { name:'Box 2', equip:'Unidad dental + blanqueamiento', status:'Activo' },
                { name:'Box 3', equip:'Ortodoncia (en preparación)', status:'Inactivo' },
              ].map(({ name, equip, status }) => (
                <div key={name} className="flex items-start justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{name}</p>
                    <p className="text-xs text-slate-400">{equip}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Usuarios' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Usuarios del sistema</h2>
            <button className="text-xs px-3 py-1.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">+ Invitar usuario</button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Usuario', 'Rol', 'Email', 'Horario', 'Estado', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{fontFamily:'Outfit'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.name.split(' ').slice(-2).map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium text-slate-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{u.role}</span></td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{u.schedule}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Activo</span></td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-slate-400 hover:text-slate-700 transition-colors">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(tab === 'Horarios' || tab === 'Notificaciones') && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center text-slate-400">
          <p className="text-4xl mb-3">⚙️</p>
          <p className="font-medium text-slate-600">Configuración de {tab}</p>
          <p className="text-sm mt-1">Esta sección está disponible en la siguiente iteración</p>
        </div>
      )}
    </div>
  )
}
