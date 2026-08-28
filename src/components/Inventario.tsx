import { useState } from 'react'

function Icon({ d, className='w-4 h-4' }: { d: string; className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={d}/></svg>
}
function fmt(n: number) { return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n) }

const CATS = ['Protección','Material dental','Anestesia','Instrumental','Laboratorio','Higiene']

interface Item {
  id: number; name: string; category: string; stock: number; min: number
  unit: string; cost: number; supplier: string; lastOrder: string
}

const ITEMS_INIT: Item[] = [
  { id:1,  name:'Guantes nitrilo talla M',      category:'Protección',    stock:12, min:20, unit:'cajas',   cost:28000,  supplier:'MedSupply',     lastOrder:'2026-07-15' },
  { id:2,  name:'Mascarillas quirúrgicas',       category:'Protección',    stock:45, min:30, unit:'cajas',   cost:15000,  supplier:'MedSupply',     lastOrder:'2026-08-01' },
  { id:3,  name:'Composite A2 jeringa 4g',       category:'Material dental',stock:8, min:10, unit:'unidades',cost:85000,  supplier:'DentPro',       lastOrder:'2026-07-20' },
  { id:4,  name:'Anestesia lidocaína 2% carpule',category:'Anestesia',     stock:60, min:40, unit:'carpules', cost:4500,  supplier:'Pharma Dental', lastOrder:'2026-08-10' },
  { id:5,  name:'Fresas diamante redondas',      category:'Instrumental',  stock:18, min:12, unit:'unidades',cost:12000,  supplier:'DentPro',       lastOrder:'2026-06-30' },
  { id:6,  name:'Radiografías periapicales',     category:'Laboratorio',   stock:6,  min:20, unit:'cajas',   cost:95000,  supplier:'Kodak Dental',  lastOrder:'2026-06-10' },
  { id:7,  name:'Hilo de sutura 3-0 nylon',      category:'Material dental',stock:22, min:15, unit:'unidades',cost:18000, supplier:'Suturemed',     lastOrder:'2026-07-25' },
  { id:8,  name:'Clorhexidina 0.12% solución',   category:'Higiene',       stock:35, min:20, unit:'frascos', cost:22000,  supplier:'PharmaCo',      lastOrder:'2026-08-05' },
  { id:9,  name:'Banda de caucho ortodoncia',    category:'Material dental',stock:4,  min:10, unit:'bolsas',  cost:35000,  supplier:'OrthoSupply',   lastOrder:'2026-07-01' },
  { id:10, name:'Espejos dentales planos',       category:'Instrumental',  stock:14, min:10, unit:'unidades',cost:8500,   supplier:'DentPro',       lastOrder:'2026-05-20' },
  { id:11, name:'Algodón estéril rollo',         category:'Higiene',       stock:8,  min:10, unit:'rollos',  cost:12000,  supplier:'MedSupply',     lastOrder:'2026-07-30' },
  { id:12, name:'Cemento de obturación ProRoot', category:'Material dental',stock:3,  min:5,  unit:'kits',    cost:420000, supplier:'Dentsply',      lastOrder:'2026-05-15' },
]

// ── Modal: Agregar ítem ───────────────────────────────────────────────────────
const BLANK_ITEM = () => ({ name:'', category:CATS[0], stock:0, min:10, unit:'unidades', cost:0, supplier:'', lastOrder:new Date().toISOString().slice(0,10) })
function ModalAgregarItem({ onSave, onClose }: { onSave: (item: Omit<Item,'id'>) => void; onClose: () => void }) {
  const [form, setForm] = useState(BLANK_ITEM())
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(f=>({...f,[k]:e.target.type==='number'?+e.target.value:e.target.value}))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>+ Agregar insumo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5"/></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Nombre del insumo *</label>
            <input value={form.name} onChange={set('name')} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" placeholder="Nombre del producto..."/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Categoría</label>
              <select value={form.category} onChange={set('category')} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                {CATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Unidad de medida</label>
              <input value={form.unit} onChange={set('unit')} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" placeholder="cajas, unidades, kg..."/>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Stock inicial</label>
              <input type="number" min="0" value={form.stock} onChange={set('stock')} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Stock mínimo</label>
              <input type="number" min="0" value={form.min} onChange={set('min')} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Costo unitario</label>
              <input type="number" min="0" value={form.cost} onChange={set('cost')} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Proveedor</label>
            <input value={form.supplier} onChange={set('supplier')} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" placeholder="Nombre del proveedor..."/>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button onClick={()=>onSave(form)} className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500">Agregar insumo</button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: Ajustar stock ──────────────────────────────────────────────────────
function ModalAjustarStock({ item, onSave, onClose }: { item: Item; onSave: (id: number, delta: number, note: string) => void; onClose: () => void }) {
  const [delta, setDelta] = useState(0)
  const [note, setNote] = useState('')
  const newStock = item.stock + delta

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800" style={{fontFamily:'Outfit'}}>Ajustar stock</h2>
            <p className="text-xs text-slate-400 mt-0.5">{item.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5"/></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 justify-center">
            <button onClick={()=>setDelta(d=>d-1)} className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl font-bold text-xl hover:bg-rose-200 transition-colors">−</button>
            <div className="text-center w-24">
              <p className="text-3xl font-bold text-slate-800" style={{fontFamily:'Outfit'}}>{newStock}</p>
              <p className="text-xs text-slate-400">{item.unit}</p>
            </div>
            <button onClick={()=>setDelta(d=>d+1)} className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl font-bold text-xl hover:bg-emerald-200 transition-colors">+</button>
          </div>
          {delta!==0 && (
            <div className={`text-center text-sm font-semibold rounded-xl p-2 ${delta>0?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700'}`}>
              {delta>0?'+':''}{delta} {item.unit} · Nuevo stock: {newStock}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Motivo (opcional)</label>
            <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Ej: entrada de proveedor, uso en cirugía..." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button onClick={()=>onSave(item.id,delta,note)} disabled={delta===0} className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed">Guardar</button>
        </div>
      </div>
    </div>
  )
}

export default function Inventario() {
  const [items, setItems] = useState(ITEMS_INIT)
  const [showAdd, setShowAdd] = useState(false)
  const [adjustItem, setAdjustItem] = useState<Item|null>(null)
  const [filterCat, setFilterCat] = useState('Todas')
  const [filterAlert, setFilterAlert] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name'|'stock'|'cost'>('name')

  const lowStock = items.filter(i=>i.stock<i.min)

  function addItem(data: Omit<Item,'id'>) {
    setItems(is=>[...is,{...data,id:Date.now()}])
    setShowAdd(false)
  }

  function adjust(id: number, delta: number) {
    setItems(is=>is.map(i=>i.id===id?{...i,stock:Math.max(0,i.stock+delta)}:i))
    setAdjustItem(null)
  }

  function reorder(id: number) {
    alert(`Orden de reposición enviada al proveedor para ítem #${id}. (Demo)`)
  }

  const visible = items.filter(i => {
    if (filterCat!=='Todas' && i.category!==filterCat) return false
    if (filterAlert && i.stock>=i.min) return false
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a,b)=>{
    if(sortBy==='stock') return a.stock-b.stock
    if(sortBy==='cost') return b.cost-a.cost
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="p-5 space-y-5 max-w-6xl mx-auto">
      {showAdd && <ModalAgregarItem onSave={addItem} onClose={()=>setShowAdd(false)}/>}
      {adjustItem && <ModalAjustarStock item={adjustItem} onSave={adjust} onClose={()=>setAdjustItem(null)}/>}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-800 text-lg" style={{fontFamily:'Outfit'}}>Inventario de insumos</h2>
          <p className="text-xs text-slate-400 mt-0.5">{items.length} ítems · {lowStock.length} alerta{lowStock.length!==1?'s':''} de stock bajo</p>
        </div>
        <button onClick={()=>setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors" style={{backgroundColor:'#1E8C82'}}>
          <Icon d="M12 4v16m8-8H4" className="w-4 h-4"/>
          Agregar insumo
        </button>
      </div>

      {/* Low stock alert */}
      {lowStock.length>0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <Icon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"/>
          <div>
            <p className="text-sm font-semibold text-amber-800">Stock bajo en {lowStock.length} producto{lowStock.length!==1?'s':''}</p>
            <p className="text-xs text-amber-700 mt-0.5">{lowStock.map(i=>i.name).join(', ')}</p>
          </div>
          <button onClick={()=>setFilterAlert(true)} className="ml-auto text-xs text-amber-700 font-semibold hover:text-amber-900 shrink-0">Ver alertas</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar insumo..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50"/>
        </div>

        <div className="flex gap-1 flex-wrap">
          {(['Todas',...CATS]).map(c=>(
            <button key={c} onClick={()=>setFilterCat(c)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${filterCat===c?'bg-cyan-600 text-white':'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {c}
            </button>
          ))}
        </div>

        <button onClick={()=>setFilterAlert(!filterAlert)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${filterAlert?'bg-amber-500 text-white':'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"/>
          {filterAlert?'Mostrando alertas':'Ver solo alertas'}
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-slate-400">Ordenar por:</span>
          {([['name','Nombre'],['stock','Stock'],['cost','Costo']] as const).map(([k,l])=>(
            <button key={k} onClick={()=>setSortBy(k)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${sortBy===k?'bg-slate-800 text-white':'bg-slate-100 text-slate-500'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {['Insumo','Categoría','Stock','Mínimo','Costo unit.','Proveedor','Acciones'].map(h=>(
                <th key={h} className="text-left text-xs text-slate-400 font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map(item=>{
              const low = item.stock < item.min
              const critical = item.stock < item.min * 0.5
              return (
                <tr key={item.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${low?'bg-amber-50/40':''}`}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-700 text-sm">{item.name}</p>
                    <p className="text-[10px] text-slate-400">{item.unit}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{item.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${critical?'text-rose-600':low?'text-amber-600':'text-slate-800'}`}>{item.stock}</span>
                      {low && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${critical?'bg-rose-100 text-rose-600':'bg-amber-100 text-amber-600'}`}>{critical?'Crítico':'Bajo'}</span>}
                    </div>
                    <div className="h-1 w-16 bg-slate-100 rounded-full mt-1 overflow-hidden">
                      <div className={`h-full rounded-full ${critical?'bg-rose-500':low?'bg-amber-400':'bg-emerald-500'}`} style={{width:`${Math.min((item.stock/item.min)*100,100)}%`}}/>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{item.min} {item.unit}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-700">{fmt(item.cost)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{item.supplier}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={()=>setAdjustItem(item)}
                        className="flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-700 px-2 py-1 rounded-lg hover:bg-cyan-50 transition-colors">
                        <Icon d="M12 4v16m8-8H4" className="w-3 h-3"/>Ajustar
                      </button>
                      {low && (
                        <button onClick={()=>reorder(item.id)}
                          className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-50 transition-colors">
                          <Icon d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" className="w-3 h-3"/>Pedir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {visible.length===0 && (
          <div className="py-12 text-center text-slate-400">
            <Icon d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" className="w-8 h-8 mx-auto mb-2 opacity-30"/>
            <p className="text-sm">No se encontraron insumos</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-xs text-slate-400 mb-1">Valor total en inventario</p>
          <p className="font-bold text-xl text-slate-800" style={{fontFamily:'Outfit'}}>{fmt(items.reduce((s,i)=>s+i.stock*i.cost,0))}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
          <p className="text-xs text-amber-600 mb-1">Ítems bajo stock mínimo</p>
          <p className="font-bold text-xl text-amber-700" style={{fontFamily:'Outfit'}}>{lowStock.length}</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4">
          <p className="text-xs text-emerald-600 mb-1">Ítems con stock óptimo</p>
          <p className="font-bold text-xl text-emerald-700" style={{fontFamily:'Outfit'}}>{items.length-lowStock.length}</p>
        </div>
      </div>
    </div>
  )
}
