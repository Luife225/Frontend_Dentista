import { useState } from 'react'

const items = [
  { id:1, name:'Guantes nitrilo talla M', category:'Protección', stock:12, min:20, unit:'cajas', cost:28000, supplier:'MedSupply' },
  { id:2, name:'Mascarillas quirúrgicas', category:'Protección', stock:45, min:30, unit:'cajas', cost:15000, supplier:'MedSupply' },
  { id:3, name:'Anestesia Lidocaína 2%', category:'Anestésicos', stock:8, min:15, unit:'cajas 50un', cost:85000, supplier:'FarmaOdonto' },
  { id:4, name:'Composite A2 jeringa', category:'Resinas', stock:3, min:5, unit:'jeringa', cost:120000, supplier:'DentsplyCol' },
  { id:5, name:'Resina flow B1', category:'Resinas', stock:7, min:5, unit:'jeringa', cost:95000, supplier:'DentsplyCol' },
  { id:6, name:'Fresas de tungsteno redonda', category:'Instrumental', stock:22, min:10, unit:'unidad', cost:18000, supplier:'OdontoTools' },
  { id:7, name:'Papel articular 40µm', category:'Instrumental', stock:4, min:8, unit:'bloc', cost:12000, supplier:'OdontoTools' },
  { id:8, name:'Alginato Jeltrate', category:'Impresión', stock:15, min:10, unit:'kg', cost:68000, supplier:'DentsplyCol' },
  { id:9, name:'Yeso piedra tipo IV', category:'Impresión', stock:2, min:5, unit:'kg', cost:45000, supplier:'GessCol' },
  { id:10, name:'Hilo retractor #1', category:'Cirugía', stock:18, min:10, unit:'bobina', cost:35000, supplier:'MedSupply' },
]

const CATEGORIES = ['Todos', 'Protección', 'Anestésicos', 'Resinas', 'Instrumental', 'Impresión', 'Cirugía']

export default function Inventario() {
  const [cat, setCat] = useState('Todos')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'name'|'stock'|'cost'>('name')

  const filtered = items
    .filter(i => (cat === 'Todos' || i.category === cat) && i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'stock' ? a.stock - b.stock : a.cost - b.cost)

  const lowStock = items.filter(i => i.stock < i.min)

  return (
    <div className="p-6 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900" style={{fontFamily:'Outfit'}}>Inventario</h1>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Exportar</button>
          <button className="px-3 py-1.5 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">+ Agregar item</button>
        </div>
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2" style={{fontFamily:'Outfit'}}>Stock bajo ({lowStock.length} items)</p>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(i => (
              <span key={i.id} className="text-xs px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full font-medium border border-amber-200">
                {i.name} — {i.stock} {i.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50 bg-white"
            placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${cat === c ? 'bg-slate-800 text-white' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              {c}
            </button>
          ))}
        </div>
        <select onChange={e => setSort(e.target.value as typeof sort)} value={sort}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none bg-white">
          <option value="name">A-Z</option>
          <option value="stock">Stock ↑</option>
          <option value="cost">Precio ↑</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Producto', 'Categoría', 'Stock actual', 'Mínimo', 'Unidad', 'Costo unit.', 'Proveedor', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{fontFamily:'Outfit'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(item => {
              const isLow = item.stock < item.min
              const pct = Math.min(100, (item.stock / (item.min * 2)) * 100)
              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{item.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isLow ? 'text-rose-600' : 'text-slate-700'}`}>{item.stock}</span>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isLow ? 'bg-rose-400' : pct > 70 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      {isLow && <span className="text-xs text-rose-500 font-medium">↓ Bajo</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{item.min}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{item.unit}</td>
                  <td className="px-4 py-3 text-slate-700 font-mono text-xs">${item.cost.toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{item.supplier}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="px-2 py-1 text-xs border border-slate-200 text-slate-500 rounded hover:bg-slate-50">Ajustar</button>
                      {isLow && <button className="px-2 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600">Pedir</button>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-3xl mb-2">📦</p>
            <p className="text-sm">Sin resultados</p>
          </div>
        )}
      </div>
    </div>
  )
}
