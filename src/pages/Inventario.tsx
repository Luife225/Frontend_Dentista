import { useEffect, useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import {
  listItems,
  saveItem,
  moveItem,
  getItemHistory,
  previewCatalog,
  confirmCatalog,
  type InventoryItem,
  type InventoryMovement,
  type CatalogRowDto,
  type CatalogRowAnalysis,
  type CatalogConfirmItem,
} from "../services/businessService"
import { formatLimaDate } from "../utils/appointmentRules"
import exportCsv from "../utils/exportCsv"

const field = "w-full border border-slate-300 rounded-xl p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
const button = "px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm"
const buttonSecondary = "px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold disabled:opacity-50 transition-colors"

const blank = () => ({
  codigo: "",
  nombre: "",
  categoria: "Material dental",
  presentacion: "UNIDAD",
  unidad: "unidades",
  clasificacion: "CONSUMIBLE",
  contenidoDescriptivo: "",
  stockMinimo: 0,
  costoUnitario: 0,
  proveedor: "",
  activo: true,
})

const DEFAULT_SAMPLE_CATALOG_CSV = `CODIGO,DESCRIPCION,UNIDAD,PRECIO_REF,FAMILIA
MAT-001,Guantes de látex desechables caja x 100,caja,28.50,Bioseguridad
MAT-002,Anestesia lidocaína 2% caja con 50 carpules,caja,65.00,Farmacología
MAT-003,Espejo bucal intraoral número 5 reutilizable,unidad,15.00,Instrumental
MAT-004,Resina compuesta fotocurable jeringa 4g,envase,72.00,Restauración
MAT-005,Alcohol etílico al 70% frasco x 1 litro,envase,12.00,Desinfección
MAT-006,Fresas de diamante cilíndricas para turbina,unidad,18.00,Instrumental
SRV-001,Profilaxis y destartraje ultrasónico completo,sesión,120.00,Procedimientos Clínicos
SRV-002,Extracción dental simple bajo anestesia local,procedimiento,150.00,Cirugía Oral`

export default function Inventario() {
  const { role } = useAuth()
  const isAdmin = role === "ADMIN_CLINICA"

  const [items, setItems] = useState<InventoryItem[]>([])
  const [selected, setSelected] = useState("")
  const [history, setHistory] = useState<InventoryMovement[]>([])
  const [form, setForm] = useState(blank())
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [query, setQuery] = useState("")
  const [onlyLow, setOnlyLow] = useState(false)
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  // Modal importación de catálogo
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [catalogRawText, setCatalogRawText] = useState(DEFAULT_SAMPLE_CATALOG_CSV)
  const [catalogLoteId, setCatalogLoteId] = useState("")
  const [catalogAnalysisRows, setCatalogAnalysisRows] = useState<CatalogRowAnalysis[]>([])
  const [catalogWarnings, setCatalogWarnings] = useState<string[]>([])
  const [catalogSummary, setCatalogSummary] = useState<{ total: number; importables: number; servicios: number; existentes: number } | null>(null)
  const [catalogStep, setCatalogStep] = useState<"input" | "preview">("input")
  const [catalogSelectedRows, setCatalogSelectedRows] = useState<Record<number, boolean>>({})

  // Formulario de movimientos
  const [movement, setMovement] = useState({
    tipo: "ENTRADA",
    cantidad: "",
    estadoOrigen: "CERRADO",
    estadoDestino: "CERRADO",
    motivo: "",
  })
  const [requestKey, setRequestKey] = useState(crypto.randomUUID())

  async function load() {
    setLoading(true)
    setError("")
    try {
      setItems(await listItems())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    let active = true
    setHistory([])
    if (selected) {
      setHistoryLoading(true)
      getItemHistory(selected)
        .then((h) => {
          if (active) setHistory(h)
        })
        .catch((e) => {
          if (active) setError(e.message)
        })
        .finally(() => {
          if (active) setHistoryLoading(false)
        })
    }
    return () => {
      active = false
    }
  }, [selected])

  const current = items.find((i) => i.id === selected)

  const filtered = items.filter((i) => {
    const textMatch = `${i.codigo || ""} ${i.nombre} ${i.categoria} ${i.presentacion || ""} ${i.proveedor || ""}`
      .toLowerCase()
      .includes(query.toLowerCase())
    const stockCerrado = i.stockCerrado ?? i.stock
    const isLow = i.activo && stockCerrado <= i.stockMinimo
    return textMatch && (!onlyLow || isLow)
  })

  const replace = (item: InventoryItem) =>
    setItems((is) =>
      [item, ...is.filter((i) => i.id !== item.id)].sort((a, b) =>
        a.nombre.localeCompare(b.nombre),
      ),
    )

  // Cambio dinámico de estados de origen/destino al seleccionar tipo de movimiento
  const handleTipoChange = (tipo: string) => {
    if (tipo === "ENTRADA") {
      setMovement((m) => ({ ...m, tipo, estadoOrigen: "CERRADO", estadoDestino: "CERRADO" }))
    } else if (tipo === "APERTURA") {
      setMovement((m) => ({ ...m, tipo, estadoOrigen: "CERRADO", estadoDestino: "EN_USO" }))
    } else if (tipo === "AGOTADO") {
      setMovement((m) => ({ ...m, tipo, estadoOrigen: "EN_USO", estadoDestino: "AGOTADO" }))
    } else if (tipo === "SALIDA") {
      setMovement((m) => ({ ...m, tipo, estadoOrigen: "CERRADO", estadoDestino: "AGOTADO" }))
    } else if (tipo === "DEVOLUCION") {
      setMovement((m) => ({ ...m, tipo, estadoOrigen: "EN_USO", estadoDestino: "CERRADO" }))
    } else if (tipo === "AJUSTE") {
      setMovement((m) => ({ ...m, tipo, estadoOrigen: "CERRADO", estadoDestino: "CERRADO" }))
    }
  }

  // Previsualizar importación de catálogo CSV/JSON
  async function handleCatalogPreview() {
    setError("")
    setBusy(true)
    try {
      const lines = catalogRawText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
      if (lines.length < 2) {
        throw new Error("El texto debe contener al menos la cabecera y una fila de catálogo")
      }
      const headers = lines[0].split(",").map((h) => h.trim().toUpperCase())
      const descIdx = headers.findIndex((h) => h.includes("DESC") || h.includes("NOMBRE"))
      const codIdx = headers.findIndex((h) => h.includes("COD"))
      const umIdx = headers.findIndex((h) => h.includes("UNID") || h.includes("MEDIDA"))
      const prIdx = headers.findIndex((h) => h.includes("PRECIO") || h.includes("COSTO"))
      const famIdx = headers.findIndex((h) => h.includes("FAMILIA") || h.includes("CAT"))

      const parsedRows: CatalogRowDto[] = []
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",").map((p) => p.trim())
        if (parts.length < 2) continue
        const desc = descIdx >= 0 && parts[descIdx] ? parts[descIdx] : parts[1] || parts[0]
        const cod = codIdx >= 0 ? parts[codIdx] : parts[0]
        const um = umIdx >= 0 ? parts[umIdx] : "unidad"
        const precio = prIdx >= 0 ? parseFloat(parts[prIdx]) || 0 : 0
        const fam = famIdx >= 0 ? parts[famIdx] : "Material dental"
        parsedRows.push({
          codigo: cod,
          descripcion: desc,
          unidadMedida: um,
          precioReferencial: precio,
          familia: fam,
        })
      }

      const res = await previewCatalog({ filas: parsedRows, origen: "IMPORTACION_LOCAL_CSV" })
      setCatalogLoteId(res.loteId)
      setCatalogAnalysisRows(res.filas)
      setCatalogWarnings(res.advertencias)
      setCatalogSummary({
        total: res.totalFilas,
        importables: res.filasImportables,
        servicios: res.filasServiciosOmitidas,
        existentes: res.filasExistentes,
      })

      // Marcar seleccionados por defecto los importables
      const selMap: Record<number, boolean> = {}
      res.filas.forEach((f) => {
        if (f.importable) selMap[f.fila] = true
      })
      setCatalogSelectedRows(selMap)
      setCatalogStep("preview")
    } catch (err: any) {
      setError("Error al procesar catálogo: " + err.message)
    } finally {
      setBusy(false)
    }
  }

  // Confirmar importación
  async function handleCatalogConfirm() {
    if (!catalogLoteId) return
    setBusy(true)
    setError("")
    setNotice("")
    try {
      const itemsToConfirm: CatalogConfirmItem[] = catalogAnalysisRows
        .filter((r) => catalogSelectedRows[r.fila] && r.importable)
        .map((r) => ({
          codigo: r.codigo || undefined,
          nombre: r.descripcion,
          categoria: r.categoriaSugerida || "Material dental",
          presentacion: r.presentacionSugerida,
          unidad: r.unidadSugerida,
          clasificacion: r.clasificacionSugerida,
          contenidoDescriptivo: r.contenidoDescriptivoSugerido || undefined,
          stockCerradoInicial: 0,
          stockEnUsoInicial: 0,
          stockMinimo: 0,
          costoUnitario: r.precioReferencial > 0 ? r.precioReferencial : undefined,
          proveedor: "Catálogo institucional",
        }))

      if (itemsToConfirm.length === 0) {
        throw new Error("No hay insumos seleccionados para importar")
      }

      const result = await confirmCatalog({
        loteId: catalogLoteId,
        items: itemsToConfirm,
        solicitudId: crypto.randomUUID(),
      })

      setNotice(result.mensaje)
      setShowCatalogModal(false)
      setCatalogStep("input")
      await load()
    } catch (err: any) {
      setError("Error al confirmar catálogo: " + err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventario Clínico</h1>
          <p className="text-sm text-slate-500">
            Control de insumos por presentación (Unidad, Caja, Envase) y estados (Cerrado/Disponible, En uso).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={loading || busy} className={buttonSecondary} onClick={load}>
            ↻ Actualizar
          </button>
          <button
            className={buttonSecondary}
            onClick={() => {
              setCatalogStep("input")
              setShowCatalogModal(true)
            }}
          >
            📋 Importar catálogo
          </button>
          <button
            className={button}
            onClick={() => {
              setEditing(null)
              setForm(blank())
              setShowForm(true)
            }}
          >
            + Agregar insumo
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-sm flex items-center justify-between">
          <span>⚠ {error}</span>
          <button onClick={() => setError("")} className="text-xs font-bold text-rose-500 hover:text-rose-700">✕</button>
        </p>
      )}
      {notice && (
        <p role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-sm flex items-center justify-between">
          <span>✓ {notice}</span>
          <button onClick={() => setNotice("")} className="text-xs font-bold text-emerald-600 hover:text-emerald-800">✕</button>
        </p>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-wrap items-center gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
        <label className="flex-1 min-w-[200px] text-sm font-medium text-slate-700">
          Buscar insumos (nombre, código, presentación, categoría)
          <input
            className={field + " mt-1"}
            placeholder="Ej: guantes, lidocaína, caja, MAT-001..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2 cursor-pointer mt-4 md:mt-0">
          <input
            type="checkbox"
            className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
            checked={onlyLow}
            onChange={(e) => setOnlyLow(e.target.checked)}
          />
          <span>Solo stock bajo ({items.filter((i) => i.activo && (i.stockCerrado ?? i.stock) <= i.stockMinimo).length})</span>
        </label>
        <button
          className="text-sm text-cyan-700 font-semibold hover:underline mt-4 md:mt-0"
          disabled={loading}
          onClick={() =>
            exportCsv("inventario_coronyx.csv", [
              [
                "ID",
                "Código",
                "Nombre",
                "Categoría",
                "Presentación",
                "Clasificación",
                "Stock Cerrado (Disponible)",
                "Stock En Uso",
                "Total Actual",
                "Stock Mínimo",
                "Costo S/",
                "Proveedor",
                "Activo",
              ],
              ...filtered.map((i) => [
                i.id,
                i.codigo || "",
                i.nombre,
                i.categoria,
                i.presentacion || "UNIDAD",
                i.clasificacion || "CONSUMIBLE",
                i.stockCerrado ?? i.stock,
                i.stockEnUso ?? 0,
                i.stock,
                i.stockMinimo,
                i.costoUnitario,
                i.proveedor || "",
                i.activo ? "Sí" : "No",
              ]),
            ])
          }
        >
          ⬇ Exportar listado CSV
        </button>
      </div>

      {/* Modal / Formulario de Insumo Nuevo o Edición */}
      {showForm && (
        <form
          className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in duration-150"
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            setError("")
            setNotice("")
            try {
              const i = await saveItem(form, editing || undefined)
              replace(i)
              setSelected(i.id)
              setShowForm(false)
              setNotice(
                editing
                  ? "Insumo actualizado exitosamente"
                  : "Insumo registrado. Registra una entrada para inicializar existencias cerradas.",
              )
            } catch (err: any) {
              setError(err.message)
            } finally {
              setBusy(false)
            }
          }}
        >
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="font-bold text-slate-800 text-base">
              {editing ? "Editar insumo" : "Nuevo insumo dental"}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600 text-sm font-bold"
            >
              ✕
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <label className="text-xs font-semibold text-slate-600">
              Código / SKU
              <input
                maxLength={40}
                placeholder="Ej: MAT-001"
                className={field + " mt-1"}
                value={form.codigo}
                onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
              Nombre descriptivo *
              <input
                required
                maxLength={160}
                placeholder="Ej: Guantes de látex desechables"
                className={field + " mt-1"}
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Presentación *
              <select
                className={field + " mt-1"}
                value={form.presentacion}
                onChange={(e) => setForm((f) => ({ ...f, presentacion: e.target.value }))}
              >
                <option value="UNIDAD">UNIDAD (Piezas individuales)</option>
                <option value="CAJA">CAJA (Empaque con múltiples unidades)</option>
                <option value="ENVASE">ENVASE (Frascos, tubos o botellas)</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Clasificación *
              <select
                className={field + " mt-1"}
                value={form.clasificacion}
                onChange={(e) => setForm((f) => ({ ...f, clasificacion: e.target.value }))}
              >
                <option value="CONSUMIBLE">CONSUMIBLE (Se agota tras su uso)</option>
                <option value="REUTILIZABLE">REUTILIZABLE (Instrumental esterilizable)</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Contenido del empaque (informativo)
              <input
                maxLength={200}
                placeholder="Ej: Caja x 100 uds / Frasco 500ml"
                className={field + " mt-1"}
                value={form.contenidoDescriptivo}
                onChange={(e) => setForm((f) => ({ ...f, contenidoDescriptivo: e.target.value }))}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Categoría *
              <input
                required
                maxLength={80}
                className={field + " mt-1"}
                value={form.categoria}
                onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Unidad de medida *
              <input
                required
                maxLength={40}
                className={field + " mt-1"}
                value={form.unidad}
                onChange={(e) => setForm((f) => ({ ...f, unidad: e.target.value }))}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Stock mínimo de alerta
              <input
                required
                type="number"
                min="0"
                step="1"
                className={field + " mt-1"}
                value={form.stockMinimo}
                onChange={(e) => setForm((f) => ({ ...f, stockMinimo: Number(e.target.value) }))}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Costo unitario referencial S/
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className={field + " mt-1"}
                value={form.costoUnitario}
                onChange={(e) => setForm((f) => ({ ...f, costoUnitario: Number(e.target.value) }))}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
              Proveedor
              <input
                maxLength={160}
                className={field + " mt-1"}
                value={form.proveedor}
                onChange={(e) => setForm((f) => ({ ...f, proveedor: e.target.value }))}
              />
            </label>
          </div>

          <label className="text-sm flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded text-cyan-600 w-4 h-4"
              checked={form.activo}
              onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
            />
            <span className="font-medium text-slate-700">Insumo activo para operaciones clínicas y de inventario</span>
          </label>

          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" disabled={busy} onClick={() => setShowForm(false)} className={buttonSecondary}>
              Cancelar
            </button>
            <button className={button} disabled={busy}>
              {editing ? "Actualizar insumo" : "Guardar insumo"}
            </button>
          </div>
        </form>
      )}

      {/* Modal de Importación de Catálogo */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
              <div>
                <h2 className="font-bold text-slate-800 text-lg">Importación y Previsualización de Catálogo</h2>
                <p className="text-xs text-slate-500">
                  Clasificación inteligente: separa insumos físicos de procedimientos clínicos y estandariza presentaciones.
                </p>
              </div>
              <button onClick={() => setShowCatalogModal(false)} className="text-slate-400 hover:text-slate-600 p-1 font-bold">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {catalogStep === "input" ? (
                <>
                  <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-cyan-800">
                    <p className="font-semibold mb-1">ℹ Instrucciones de importación:</p>
                    <p>Pega un listado CSV con cabeceras (CODIGO, DESCRIPCION, UNIDAD, PRECIO_REF, FAMILIA). El sistema analizará cada fila, descartará servicios/procedimientos clínicos y sugerirá la presentación (UNIDAD, CAJA, ENVASE) y clasificación correspondiente.</p>
                  </div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Contenido CSV de catálogo:
                    <textarea
                      rows={10}
                      className="w-full mt-1 p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500"
                      value={catalogRawText}
                      onChange={(e) => setCatalogRawText(e.target.value)}
                    />
                  </label>
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      className="text-xs text-cyan-700 font-semibold underline"
                      onClick={() => setCatalogRawText(DEFAULT_SAMPLE_CATALOG_CSV)}
                    >
                      Restablecer ejemplo estándar de odontología
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {catalogSummary && (
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div className="p-3 bg-slate-50 rounded-xl border">
                        <span className="text-xs text-slate-500 block">Total filas</span>
                        <span className="font-bold text-slate-800 text-lg">{catalogSummary.total}</span>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                        <span className="text-xs text-emerald-700 block">Insumos físicos</span>
                        <span className="font-bold text-emerald-800 text-lg">{catalogSummary.importables}</span>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <span className="text-xs text-amber-700 block">Servicios omitidos</span>
                        <span className="font-bold text-amber-800 text-lg">{catalogSummary.servicios}</span>
                      </div>
                      <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200">
                        <span className="text-xs text-cyan-700 block">Ya existentes</span>
                        <span className="font-bold text-cyan-800 text-lg">{catalogSummary.existentes}</span>
                      </div>
                    </div>
                  )}

                  {catalogWarnings.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                      <p className="font-semibold">Observaciones detectadas:</p>
                      {catalogWarnings.map((w, idx) => (
                        <p key={idx}>• {w}</p>
                      ))}
                    </div>
                  )}

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                        <tr>
                          <th className="p-2 border-b">Sel.</th>
                          <th className="p-2 border-b">Código</th>
                          <th className="p-2 border-b">Descripción</th>
                          <th className="p-2 border-b">Tipo detectado</th>
                          <th className="p-2 border-b">Presentación</th>
                          <th className="p-2 border-b">Clasificación</th>
                          <th className="p-2 border-b">Contenido</th>
                          <th className="p-2 border-b">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {catalogAnalysisRows.map((r) => (
                          <tr key={r.fila} className={r.importable ? "hover:bg-slate-50" : "bg-slate-50/60 opacity-60"}>
                            <td className="p-2">
                              {r.importable && (
                                <input
                                  type="checkbox"
                                  className="rounded text-cyan-600"
                                  checked={!!catalogSelectedRows[r.fila]}
                                  onChange={(e) =>
                                    setCatalogSelectedRows((prev) => ({
                                      ...prev,
                                      [r.fila]: e.target.checked,
                                    }))
                                  }
                                />
                              )}
                            </td>
                            <td className="p-2 font-mono">{r.codigo}</td>
                            <td className="p-2 font-medium">{r.descripcion}</td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                r.tipoDetectado === "INSUMO_FISICO" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                              }`}>
                                {r.tipoDetectado === "INSUMO_FISICO" ? "Insumo físico" : "Procedimiento/Servicio"}
                              </span>
                            </td>
                            <td className="p-2 font-semibold text-slate-700">{r.presentacionSugerida}</td>
                            <td className="p-2">{r.clasificacionSugerida}</td>
                            <td className="p-2 text-slate-500">{r.contenidoDescriptivoSugerido || "—"}</td>
                            <td className="p-2">
                              {r.existenteEnInventario ? (
                                <span className="text-cyan-700 font-semibold">Ya registrado</span>
                              ) : r.importable ? (
                                <span className="text-emerald-700 font-semibold">Listo para importar</span>
                              ) : (
                                <span className="text-amber-700">{r.observacion}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t bg-slate-50 flex justify-between items-center">
              {catalogStep === "preview" ? (
                <>
                  <button type="button" onClick={() => setCatalogStep("input")} className={buttonSecondary} disabled={busy}>
                    ← Volver a edición de CSV
                  </button>
                  <button type="button" onClick={handleCatalogConfirm} className={button} disabled={busy}>
                    {busy ? "Confirmando importación..." : "Confirmar importación de insumos seleccionados"}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setShowCatalogModal(false)} className={buttonSecondary}>
                    Cancelar
                  </button>
                  <button type="button" onClick={handleCatalogPreview} className={button} disabled={busy}>
                    {busy ? "Analizando catálogo..." : "Previsualizar catálogo →"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sección principal: Lista de Insumos vs Detalle/Movimientos */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Panel Izquierdo: Lista de insumos */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-slate-800">Insumos Registrados ({filtered.length})</h2>
            <span className="text-xs text-slate-400">Total en clínica</span>
          </div>

          {loading ? (
            <p role="status" className="text-sm text-slate-500 py-6 text-center">Cargando inventario clínico…</p>
          ) : filtered.length === 0 ? (
            <p className="text-slate-500 py-6 text-sm text-center">No hay insumos registrados con este criterio.</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[38rem] overflow-y-auto pr-1">
              {filtered.map((i) => {
                const stockCerrado = i.stockCerrado ?? i.stock
                const stockEnUso = i.stockEnUso ?? 0
                const isLow = i.activo && stockCerrado <= i.stockMinimo

                return (
                  <button
                    className={`w-full text-left p-3.5 rounded-xl transition-all ${
                      selected === i.id
                        ? "bg-cyan-50/80 border border-cyan-200 shadow-xs"
                        : "hover:bg-slate-50"
                    }`}
                    key={i.id}
                    onClick={() => {
                      setSelected(i.id)
                      handleTipoChange("ENTRADA")
                      setMovement((m) => ({ ...m, cantidad: "", motivo: "" }))
                      setRequestKey(crypto.randomUUID())
                    }}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-900 text-sm">{i.nombre}</span>
                          {i.codigo && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                              {i.codigo}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            i.presentacion === "CAJA" ? "bg-purple-100 text-purple-700" :
                            i.presentacion === "ENVASE" ? "bg-amber-100 text-amber-800" :
                            "bg-blue-100 text-blue-700"
                          }`}>
                            {i.presentacion || "UNIDAD"}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            i.clasificacion === "REUTILIZABLE" ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-600"
                          }`}>
                            {i.clasificacion === "REUTILIZABLE" ? "Reutilizable" : "Consumible"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {i.categoria} {i.contenidoDescriptivo ? `· ${i.contenidoDescriptivo}` : ""}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-sm font-bold block ${isLow ? "text-amber-700" : "text-slate-800"}`}>
                          Total: {i.stock} {i.unidad}
                        </span>
                        <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1.5 mt-0.5">
                          <span className={isLow ? "text-amber-700 font-semibold" : ""}>
                            Disp: <strong>{stockCerrado}</strong>
                          </span>
                          <span>|</span>
                          <span>
                            En uso: <strong>{stockEnUso}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {isLow && (
                      <div className="mt-2 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded flex items-center gap-1">
                        <span>⚠ Stock disponible ({stockCerrado}) en o bajo el mínimo ({i.stockMinimo}).</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* Panel Derecho: Detalle del insumo seleccionado, Formulario de Movimiento e Historial */}
        {current ? (
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-slate-900 text-base">{current.nombre}</h2>
                  {current.codigo && (
                    <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {current.codigo}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {current.categoria} · {current.proveedor ? `Proveedor: ${current.proveedor}` : "Proveedor no registrado"}
                </p>
              </div>
              <button
                className="text-xs font-semibold text-cyan-700 hover:underline"
                onClick={() => {
                  setEditing(current.id)
                  setForm({
                    codigo: current.codigo || "",
                    nombre: current.nombre,
                    categoria: current.categoria,
                    presentacion: current.presentacion || "UNIDAD",
                    unidad: current.unidad,
                    clasificacion: current.clasificacion || "CONSUMIBLE",
                    contenidoDescriptivo: current.contenidoDescriptivo || "",
                    stockMinimo: current.stockMinimo,
                    costoUnitario: current.costoUnitario,
                    proveedor: current.proveedor || "",
                    activo: current.activo,
                  })
                  setShowForm(true)
                }}
              >
                ✎ Editar datos
              </button>
            </div>

            {/* Tarjetas de estado de existencias */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="text-center p-2 bg-white rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-400 block uppercase font-bold">Cerrados / Disp.</span>
                <span className="font-bold text-base text-slate-800">
                  {current.stockCerrado ?? current.stock}
                </span>
                <span className="text-[10px] text-slate-400 block">{current.presentacion || "UNIDAD"}</span>
              </div>
              <div className="text-center p-2 bg-white rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-400 block uppercase font-bold">En Uso</span>
                <span className="font-bold text-base text-cyan-700">
                  {current.stockEnUso ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 block">Abiertos</span>
              </div>
              <div className="text-center p-2 bg-white rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-400 block uppercase font-bold">Total Actual</span>
                <span className="font-bold text-base text-slate-900">
                  {current.stock}
                </span>
                <span className="text-[10px] text-slate-400 block">{current.unidad}</span>
              </div>
            </div>

            {current.contenidoDescriptivo && (
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                📦 <strong>Contenido de empaque:</strong> {current.contenidoDescriptivo}
                {(current.stockEnUso ?? 0) > 0 && (
                  <span className="text-cyan-700 block mt-0.5">
                    ℹ Las unidades en uso se consideran con contenido restante desconocido sin inventar piezas ficticias.
                  </span>
                )}
              </p>
            )}

            {/* Formulario de registro de movimiento */}
            {current.activo && (
              <form
                className="space-y-3 border-y border-slate-200 py-4"
                onSubmit={async (e) => {
                  e.preventDefault()
                  setBusy(true)
                  setError("")
                  setNotice("")
                  try {
                    const cant = Number(movement.cantidad)
                    if (cant <= 0 && movement.tipo !== "AJUSTE") {
                      throw new Error("La cantidad debe ser mayor a cero")
                    }

                    const i = await moveItem(current.id, {
                      tipo: movement.tipo,
                      cantidad: cant,
                      estadoOrigen: movement.estadoOrigen,
                      estadoDestino: movement.estadoDestino,
                      motivo: movement.motivo,
                      solicitudId: requestKey,
                    })
                    replace(i)

                    setMovement((m) => ({ ...m, cantidad: "", motivo: "" }))
                    setRequestKey(crypto.randomUUID())
                    setNotice(`Movimiento de ${movement.tipo} registrado correctamente`)
                    setHistory(await getItemHistory(current.id))
                  } catch (err: any) {
                    setError(err.message)
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-sm text-slate-800">Registrar operación de existencias</h3>
                  <span className="text-[11px] text-slate-400 font-mono">ID idempotencia: {requestKey.slice(0, 8)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-slate-600">
                    Operación
                    <select
                      className={field + " mt-1"}
                      value={movement.tipo}
                      onChange={(e) => handleTipoChange(e.target.value)}
                    >
                      <option value="ENTRADA">ENTRADA (Recepción / Ingreso a disponible)</option>
                      <option value="APERTURA">APERTURA (Abrir o poner en uso caja/envase)</option>
                      <option value="AGOTADO">AGOTADO (Marcar agotado un empaque en uso)</option>
                      <option value="SALIDA">SALIDA / BAJA (Retiro por merma o rotura con motivo)</option>
                      {current.clasificacion === "REUTILIZABLE" && (
                        <option value="DEVOLUCION">DEVOLUCION (Regresar reutilizable a disponible)</option>
                      )}
                      {isAdmin && <option value="AJUSTE">AJUSTE (Corrección administrativa con auditoría)</option>}
                    </select>
                  </label>

                  <label className="text-xs font-semibold text-slate-600">
                    {movement.tipo === "AJUSTE" ? "Nuevo conteo de stock cerrado" : "Cantidad entera"}
                    <input
                      required
                      type="number"
                      min={movement.tipo === "AJUSTE" ? 0 : 1}
                      max="1000000000"
                      step="1"
                      className={field + " mt-1"}
                      value={movement.cantidad}
                      placeholder={movement.tipo === "APERTURA" ? "Ej: 1 caja a abrir" : "Cantidad"}
                      onChange={(e) => setMovement((m) => ({ ...m, cantidad: e.target.value }))}
                    />
                  </label>
                </div>

                {movement.tipo === "SALIDA" && (
                  <label className="text-xs font-semibold text-slate-600 block">
                    Baja desde:
                    <select
                      className={field + " mt-1"}
                      value={movement.estadoOrigen}
                      onChange={(e) => setMovement((m) => ({ ...m, estadoOrigen: e.target.value }))}
                    >
                      <option value="CERRADO">Existencias cerradas / disponibles</option>
                      <option value="EN_USO">Existencias abiertas en uso</option>
                    </select>
                  </label>
                )}

                <label className="block text-xs font-semibold text-slate-600">
                  Motivo o justificación de la operación *
                  <input
                    required
                    maxLength={500}
                    className={field + " mt-1"}
                    placeholder={
                      movement.tipo === "APERTURA"
                        ? "Ej: Se abre caja para gabinete dental 2"
                        : movement.tipo === "AGOTADO"
                        ? "Ej: Envase agotado en jornada clínica"
                        : movement.tipo === "DEVOLUCION"
                        ? "Ej: Instrumental esterilizado y devuelto al almacén"
                        : "Ej: Recepción según orden de compra / Registro ordinario"
                    }
                    value={movement.motivo}
                    onChange={(e) => setMovement((m) => ({ ...m, motivo: e.target.value }))}
                  />
                </label>

                <div className="flex justify-between items-center pt-1">
                  <p className="text-[11px] text-slate-500">
                    {movement.tipo === "APERTURA"
                      ? "ℹ Abrir no disminuye el stock total; transfiere existencias de cerrado a en uso."
                      : movement.tipo === "AGOTADO"
                      ? "ℹ Agotar retira la existencia en uso y disminuye el stock total."
                      : movement.tipo === "DEVOLUCION"
                      ? "ℹ Reintegra el instrumental reutilizable a stock disponible sin duplicar inventario."
                      : ""}
                  </p>
                  <button disabled={busy} className={button}>
                    {busy ? "Procesando..." : "Guardar movimiento"}
                  </button>
                </div>
              </form>
            )}

            {/* Historial de Movimientos con Estados y Trazabilidad */}
            <div className="flex justify-between items-center gap-2">
              <h3 className="font-semibold text-sm text-slate-800">
                Historial de movimientos y auditoría
              </h3>
              <button
                className="text-xs text-cyan-700 font-semibold hover:underline"
                disabled={historyLoading}
                onClick={() =>
                  exportCsv(`movimientos_${current.id}.csv`, [
                    [
                      "ID",
                      "Fecha",
                      "Operación",
                      "Cantidad",
                      "Origen",
                      "Destino",
                      "Stock Cerrado Resultante",
                      "Stock En Uso Resultante",
                      "Total Resultante",
                      "Motivo",
                      "Registrado Por Usuario ID",
                    ],
                    ...history.map((m) => [
                      m.id,
                      m.fechaCreacion,
                      m.tipo,
                      m.cantidad,
                      m.estadoOrigen || "—",
                      m.estadoDestino || "—",
                      m.stockCerradoResultante ?? "—",
                      m.stockEnUsoResultante ?? "—",
                      m.stockResultante,
                      m.motivo,
                      m.creadoPorId,
                    ]),
                  ])
                }
              >
                ⬇ Exportar historial
              </button>
            </div>

            {historyLoading ? (
              <p role="status" className="text-xs text-slate-500 py-3">Cargando movimientos…</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">Todavía no hay movimientos registrados para este insumo.</p>
            ) : (
              <ol className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {history.map((m) => (
                  <li key={m.id} className="py-2.5 text-xs space-y-1">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                          m.tipo === "ENTRADA" ? "bg-emerald-100 text-emerald-800" :
                          m.tipo === "APERTURA" ? "bg-cyan-100 text-cyan-800" :
                          m.tipo === "AGOTADO" ? "bg-amber-100 text-amber-800" :
                          m.tipo === "DEVOLUCION" ? "bg-teal-100 text-teal-800" :
                          m.tipo === "AJUSTE" ? "bg-purple-100 text-purple-800" :
                          "bg-rose-100 text-rose-800"
                        }`}>
                          {m.tipo}
                        </span>
                        <span className="font-semibold text-slate-800">
                          Cantidad: {m.cantidad}
                        </span>
                        {m.estadoOrigen && m.estadoDestino && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({m.estadoOrigen} → {m.estadoDestino})
                          </span>
                        )}
                      </div>
                      <span className="text-slate-600 font-semibold">
                        Total resultante: {m.stockResultante}
                      </span>
                    </div>

                    {(m.stockCerradoResultante != null || m.stockEnUsoResultante != null) && (
                      <div className="text-[11px] text-slate-500 font-mono">
                        Cerrados: {m.stockCerradoResultante ?? "—"} · En uso: {m.stockEnUsoResultante ?? "—"}
                      </div>
                    )}

                    <p className="text-slate-700">{m.motivo}</p>
                    <p className="text-[10px] text-slate-400">
                      {formatLimaDate(m.fechaCreacion)} · Usuario institucional #{m.creadoPorId}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ) : (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 flex items-center justify-center text-center">
            <p className="text-sm text-slate-500">
              👈 Selecciona un insumo de la lista para ver sus estados de existencias (cerrados y en uso) o registrar movimientos.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
