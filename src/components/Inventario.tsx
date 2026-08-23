import { useState } from 'react'

interface InventoryItem {
  id: number
  name: string
  category: string
  stock: number
  min: number
  unit: string
  cost: number
  supplier: string
}

const initialItems: InventoryItem[] = [
  { id: 1, name: 'Guantes nitrilo talla M', category: 'Protección', stock: 12, min: 20, unit: 'cajas', cost: 28000, supplier: 'MedSupply' },
  { id: 2, name: 'Mascarillas quirúrgicas', category: 'Protección', stock: 45, min: 30, unit: 'cajas', cost: 15000, supplier: 'MedSupply' },
  { id: 3, name: 'Anestesia Lidocaína 2%', category: 'Anestésicos', stock: 8, min: 15, unit: 'cajas 50un', cost: 85000, supplier: 'FarmaOdonto' },
  { id: 4, name: 'Composite A2 jeringa', category: 'Resinas', stock: 3, min: 5, unit: 'jeringa', cost: 120000, supplier: 'DentsplyCol' },
  { id: 5, name: 'Resina flow B1', category: 'Resinas', stock: 7, min: 5, unit: 'jeringa', cost: 95000, supplier: 'DentsplyCol' },
  { id: 6, name: 'Fresas de tungsteno redonda', category: 'Instrumental', stock: 22, min: 10, unit: 'unidad', cost: 18000, supplier: 'OdontoTools' },
  { id: 7, name: 'Papel articular 40µm', category: 'Instrumental', stock: 4, min: 8, unit: 'bloc', cost: 12000, supplier: 'OdontoTools' },
  { id: 8, name: 'Alginato Jeltrate', category: 'Impresión', stock: 15, min: 10, unit: 'kg', cost: 68000, supplier: 'DentsplyCol' },
  { id: 9, name: 'Yeso piedra tipo IV', category: 'Impresión', stock: 2, min: 5, unit: 'kg', cost: 45000, supplier: 'GessCol' },
  { id: 10, name: 'Hilo retractor #1', category: 'Cirugía', stock: 18, min: 10, unit: 'bobina', cost: 35000, supplier: 'MedSupply' },
]

const CATEGORIES = ['Todos', 'Protección', 'Anestésicos', 'Resinas', 'Instrumental', 'Impresión', 'Cirugía']

export default function Inventario() {
  const [itemsList, setItemsList] = useState<InventoryItem[]>(initialItems)
  const [cat, setCat] = useState('Todos')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'name' | 'stock' | 'cost'>('name')
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null)
  const [newStockVal, setNewStockVal] = useState<number>(0)
  const [toastMsg, setToastMsg] = useState('')

  // New item form
  const [formName, setFormName] = useState('')
  const [formCat, setFormCat] = useState('Protección')
  const [formStock, setFormStock] = useState(10)
  const [formMin, setFormMin] = useState(5)
  const [formUnit, setFormUnit] = useState('cajas')
  const [formCost, setFormCost] = useState(30000)
  const [formSupplier, setFormSupplier] = useState('MedSupply')

  const filtered = itemsList
    .filter(i => (cat === 'Todos' || i.category === cat) && i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'stock' ? a.stock - b.stock : a.cost - b.cost)

  const lowStock = itemsList.filter(i => i.stock < i.min)

  function handleCreateItem() {
    if (!formName.trim()) return

    const newItem: InventoryItem = {
      id: Date.now(),
      name: formName.trim(),
      category: formCat,
      stock: Number(formStock),
      min: Number(formMin),
      unit: formUnit,
      cost: Number(formCost),
      supplier: formSupplier || 'Proveedor General',
    }

    setItemsList([newItem, ...itemsList])
    setShowAddModal(false)
    setFormName('')
    setToastMsg(`Ítem "${newItem.name}" agregado al inventario exitosamente.`)
    setTimeout(() => setToastMsg(''), 3500)
  }

  function handleSaveAdjust() {
    if (!adjustItem) return
    setItemsList(prev => prev.map(it => it.id === adjustItem.id ? { ...it, stock: Number(newStockVal) } : it))
    setToastMsg(`Stock de "${adjustItem.name}" actualizado a ${newStockVal} ${adjustItem.unit}.`)
    setAdjustItem(null)
    setTimeout(() => setToastMsg(''), 3500)
  }

  function handlePedir(item: InventoryItem) {
    setToastMsg(`Orden de compra generada para ${item.name} a ${item.supplier}.`)
    setTimeout(() => setToastMsg(''), 3500)
  }

  return (
    <div className="p-6 space-y-5 fade-in relative">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-teal-500/40 fade-in">
          <span className="text-emerald-400 font-bold text-lg">✓</span>
          <div>
            <p className="font-semibold text-xs text-white" style={{ fontFamily: 'Outfit' }}>Inventario Actualizado</p>
            <p className="text-xs text-slate-300">{toastMsg}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900" style={{ fontFamily: 'Outfit' }}>Control de Inventario</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gestión de insumos clínicos, instrumental y alertas de stock mínimo</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setToastMsg('Reporte de inventario exportado en formato CSV.')
              setTimeout(() => setToastMsg(''), 3000)
            }}
            className="px-3.5 py-2 text-xs sm:text-sm border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium">
            Exportar reporte
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors font-semibold shadow-sm">
            <span>+</span> Agregar ítem
          </button>
        </div>
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-amber-800" style={{ fontFamily: 'Outfit' }}>
              ⚠️ Alerta de Stock Bajo ({lowStock.length} productos por debajo del umbral mínimo)
            </p>
            <button
              onClick={() => {
                setToastMsg('Órdenes masivas enviadas a proveedores para reabastecer.')
                setTimeout(() => setToastMsg(''), 3500)
              }}
              className="text-xs bg-amber-600 text-white px-3 py-1 rounded-lg font-semibold hover:bg-amber-700 transition-colors">
              Pedir todos los faltantes
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(i => (
              <span key={i.id} className="text-xs px-3 py-1 bg-amber-100/80 text-amber-900 rounded-full font-medium border border-amber-200 flex items-center gap-1.5">
                <strong>{i.name}</strong> — {i.stock} {i.unit} (Mínimo: {i.min})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400/50 bg-white"
              placeholder="Buscar producto o proveedor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${cat === c ? 'bg-slate-800 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <select
          onChange={e => setSort(e.target.value as typeof sort)}
          value={sort}
          className="px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-600 focus:outline-none bg-white font-medium">
          <option value="name">Ordenar: Nombre A-Z</option>
          <option value="stock">Ordenar: Stock ↑</option>
          <option value="cost">Ordenar: Costo unitario ↑</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Producto / Insumo', 'Categoría', 'Stock actual', 'Mínimo', 'Unidad', 'Costo unit.', 'Proveedor', 'Acciones'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(item => {
              const isLow = item.stock < item.min
              const pct = Math.min(100, (item.stock / (item.min * 2)) * 100)
              return (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5 font-medium text-slate-800">{item.name}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{item.category}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isLow ? 'text-rose-600' : 'text-slate-700'}`}>{item.stock}</span>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isLow ? 'bg-rose-400' : pct > 70 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      {isLow && <span className="text-[11px] text-rose-600 font-semibold">↓ Bajo</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 font-mono text-xs">{item.min}</td>
                  <td className="px-4 py-3.5 text-slate-400 text-xs">{item.unit}</td>
                  <td className="px-4 py-3.5 text-slate-700 font-mono text-xs font-semibold">${item.cost.toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">{item.supplier}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setAdjustItem(item)
                          setNewStockVal(item.stock)
                        }}
                        className="px-2.5 py-1 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors font-medium">
                        Ajustar
                      </button>
                      {isLow && (
                        <button
                          onClick={() => handlePedir(item)}
                          className="px-2.5 py-1 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-semibold transition-colors">
                          Pedir
                        </button>
                      )}
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
            <p className="text-sm font-medium">No se encontraron productos en el inventario</p>
          </div>
        )}
      </div>

      {/* ── Modal: Agregar Ítem ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden fade-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>
                Agregar nuevo ítem al inventario
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center text-xl leading-none transition-colors">
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4 flex-1">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Nombre del insumo / producto</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ej: Fresas diamantadas de grano fino..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Categoría</label>
                  <select
                    value={formCat}
                    onChange={e => setFormCat(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-white">
                    {CATEGORIES.filter(c => c !== 'Todos').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Unidad de medida</label>
                  <select
                    value={formUnit}
                    onChange={e => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-white">
                    {['cajas', 'unidad', 'jeringa', 'bloc', 'kg', 'bobina', 'frasco', 'paquete'].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Stock inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={e => setFormStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Stock mínimo (Alerta)</label>
                  <input
                    type="number"
                    min="1"
                    value={formMin}
                    onChange={e => setFormMin(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Costo unitario ($ COP)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formCost}
                    onChange={e => setFormCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Proveedor</label>
                  <input
                    type="text"
                    value={formSupplier}
                    onChange={e => setFormSupplier(e.target.value)}
                    placeholder="Ej: DentsplyCol, MedSupply..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-100 transition-colors font-medium">
                Cancelar
              </button>
              <button
                onClick={handleCreateItem}
                className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
                Guardar en Inventario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Ajustar Stock ── */}
      {adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden fade-in flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Outfit' }}>
                Ajustar Stock
              </h2>
              <button
                onClick={() => setAdjustItem(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center text-lg leading-none transition-colors">
                ×
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm font-medium text-slate-800">{adjustItem.name}</p>
              <p className="text-xs text-slate-400">Proveedor: {adjustItem.supplier} · Unidad: {adjustItem.unit}</p>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Cantidad real disponible</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setNewStockVal(Math.max(0, newStockVal - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg">
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={newStockVal}
                    onChange={e => setNewStockVal(Math.max(0, Number(e.target.value)))}
                    className="flex-1 px-3 py-2 text-center text-lg font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                  <button
                    onClick={() => setNewStockVal(newStockVal + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg">
                    +
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setAdjustItem(null)}
                className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-100 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSaveAdjust}
                className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold transition-colors">
                Actualizar Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
