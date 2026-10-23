const { test } = require("node:test")
const assert = require("node:assert/strict")
const vm = require("node:vm")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")

function harness(overrides = {}) {
  const values = new Map([["coronyx_jwt_token", "test-token-jwt-dentista"]])
  const events = []
  const storage = {
    getItem: (k) => values.get(k) || null,
    setItem: (k, v) => values.set(k, v),
    removeItem: (k) => values.delete(k),
  }
  const sandbox = {
    console,
    URL,
    URLSearchParams,
    FormData,
    Response,
    AbortSignal,
    crypto: require("node:crypto").webcrypto,
    setTimeout,
    clearTimeout,
    Promise,
    localStorage: storage,
    sessionStorage: storage,
    CustomEvent: class {
      constructor(type) {
        this.type = type
      }
    },
    window: { dispatchEvent: (e) => events.push(e.type) },
    env: {
      VITE_API_BASE_URL: "https://api.example.invalid/api/v1",
    },
    fetch: async () => {
      throw new Error("Una prueba intentó usar red sin respuesta controlada")
    },
    ...overrides,
  }
  const context = vm.createContext(sandbox)
  const cache = new Map()
  function load(relative) {
    let file = path.resolve(__dirname, "../src", relative)
    if (!file.endsWith(".ts") && !file.endsWith(".tsx")) file += ".ts"
    if (cache.has(file)) return cache.get(file).exports
    const source = fs
      .readFileSync(file, "utf8")
      .replace(/import\.meta\.env\??/g, "env")
    const code = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.React,
      },
    }).outputText
    const mod = { exports: {} }
    cache.set(file, mod)
    const fn = vm.runInContext(
      `(function (exports, require, module, __filename, __dirname) { ${code}\n})`,
      context,
    )
    fn(mod.exports, (dep) => {
      if (dep.startsWith(".")) {
        return load(path.join(path.dirname(relative), dep))
      }
      return require(dep)
    }, mod, file, path.dirname(file))
    return mod.exports
  }
  return { load, events, values }
}

test("inventario: registrar movimiento de apertura y agotado preserva presentación y estados", async () => {
  const recorded = []
  const { load } = harness({
    fetch: async (url, init) => {
      recorded.push({ url, method: init?.method, body: init?.body ? JSON.parse(init.body) : null })
      if (url.endsWith("/inventario/insumos/101/movimientos") && init.method === "POST") {
        const req = JSON.parse(init.body)
        return new Response(
          JSON.stringify({
            id: "101",
            codigo: "MAT-001",
            nombre: "Guantes de látex desechables",
            categoria: "Bioseguridad",
            presentacion: "CAJA",
            unidad: "cajas",
            clasificacion: "CONSUMIBLE",
            contenidoDescriptivo: "Caja x 100 unidades",
            stock: req.tipo === "AGOTADO" ? 4 : 5,
            stockCerrado: 4,
            stockEnUso: req.tipo === "AGOTADO" ? 0 : 1,
            stockMinimo: 2,
            costoUnitario: 28.5,
            activo: true,
            stockBajo: false,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      }
      return new Response(JSON.stringify({ error: "not found" }), { status: 404 })
    },
  })

  const { moveItem } = load("services/businessService")

  // Apertura de 1 caja: cerrado -> en uso, total permanece en 5
  const resApertura = await moveItem("101", {
    tipo: "APERTURA",
    cantidad: 1,
    estadoOrigen: "CERRADO",
    estadoDestino: "EN_USO",
    motivo: "Puesta en uso para jornada clínica",
    solicitudId: "sol-apertura-1",
  })

  assert.equal(resApertura.presentacion, "CAJA")
  assert.equal(resApertura.stock, 5)
  assert.equal(resApertura.stockCerrado, 4)
  assert.equal(resApertura.stockEnUso, 1)

  // Agotar 1 caja en uso: se retira de existencias, total disminuye a 4
  const resAgotado = await moveItem("101", {
    tipo: "AGOTADO",
    cantidad: 1,
    estadoOrigen: "EN_USO",
    estadoDestino: "AGOTADO",
    motivo: "Caja consumida totalmente",
    solicitudId: "sol-agotado-1",
  })

  assert.equal(resAgotado.stock, 4)
  assert.equal(resAgotado.stockCerrado, 4)
  assert.equal(resAgotado.stockEnUso, 0)
  assert.equal(recorded.length, 2)
})

test("catálogo de inventario: previsualizar y confirmar lote con clasificación y empaque", async () => {
  const recorded = []
  const { load } = harness({
    fetch: async (url, init) => {
      recorded.push({ url, method: init?.method, body: init?.body ? JSON.parse(init.body) : null })
      if (url.endsWith("/inventario/catalogo/previsualizar")) {
        return new Response(
          JSON.stringify({
            loteId: "batch-xyz-123",
            totalFilas: 2,
            filasImportables: 1,
            filasServiciosOmitidas: 1,
            filasExistentes: 0,
            filas: [
              {
                fila: 1,
                codigo: "MAT-002",
                descripcion: "Lidocaína 2% caja con 50 carpules",
                unidadMedida: "caja",
                tipoDetectado: "INSUMO_FISICO",
                presentacionSugerida: "CAJA",
                unidadSugerida: "cajas",
                clasificacionSugerida: "CONSUMIBLE",
                contenidoDescriptivoSugerido: "Caja con 50 carpules",
                categoriaSugerida: "Farmacología",
                importable: true,
                existenteEnInventario: false,
              },
              {
                fila: 2,
                codigo: "SRV-001",
                descripcion: "Profilaxis y destartraje",
                unidadMedida: "sesión",
                tipoDetectado: "SERVICIO_PROCEDIMIENTO",
                presentacionSugerida: "UNIDAD",
                unidadSugerida: "sesión",
                clasificacionSugerida: "CONSUMIBLE",
                importable: false,
                existenteEnInventario: false,
              },
            ],
            advertencias: ["Se omitieron 1 servicios"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      }
      if (url.endsWith("/inventario/catalogo/confirmar")) {
        return new Response(
          JSON.stringify({
            loteId: "batch-xyz-123",
            itemsRegistrados: 1,
            itemsOmitidos: 0,
            mensaje: "Importación completada: 1 insumos registrados",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      }
      return new Response(JSON.stringify({ error: "not found" }), { status: 404 })
    },
  })

  const { previewCatalog, confirmCatalog } = load("services/businessService")

  const preview = await previewCatalog({
    filas: [
      { codigo: "MAT-002", descripcion: "Lidocaína 2%", unidadMedida: "caja" },
      { codigo: "SRV-001", descripcion: "Profilaxis", unidadMedida: "sesión" },
    ],
  })

  assert.equal(preview.loteId, "batch-xyz-123")
  assert.equal(preview.filasImportables, 1)
  assert.equal(preview.filasServiciosOmitidas, 1)

  const confirm = await confirmCatalog({
    loteId: preview.loteId,
    items: [
      {
        codigo: "MAT-002",
        nombre: "Lidocaína 2% caja con 50 carpules",
        categoria: "Farmacología",
        presentacion: "CAJA",
        unidad: "cajas",
        clasificacion: "CONSUMIBLE",
        contenidoDescriptivo: "Caja con 50 carpules",
        stockCerradoInicial: 0,
        stockEnUsoInicial: 0,
        stockMinimo: 5,
        costoUnitario: 65.0,
      },
    ],
    solicitudId: "sol-confirm-batch",
  })

  assert.equal(confirm.itemsRegistrados, 1)
})

test("teleconsulta: unirse a sala opaca con JWT firmado y verificar cierre formal", async () => {
  const recorded = []
  const { load } = harness({
    fetch: async (url, init) => {
      recorded.push({ url, method: init?.method })
      if (url.endsWith("/teleconsulta/sesion/555") && init.method === "POST") {
        return new Response(
          JSON.stringify({
            citaId: "555",
            salaId: "cx-78ab91c4d23e4f50",
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy",
            jitsiServerUrl: "https://localhost:8443",
            rol: "MODERADOR",
            esModerador: true,
            nombreParticipante: "Dr. Roberto Peñaloza",
            estado: "EN_CURSO",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      }
      if (url.endsWith("/teleconsulta/sesion/555/cerrar") && init.method === "POST") {
        return new Response(
          JSON.stringify({
            salaId: "cx-78ab91c4d23e4f50",
            citaId: "555",
            estado: "FINALIZADA",
            mensaje: "La sala de teleconsulta ha sido finalizada formalmente",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      }
      return new Response(JSON.stringify({ error: "not found" }), { status: 404 })
    },
  })

  const { joinTeleconsultation, closeTeleconsultation } = load("services/teleconsultationService")

  const join = await joinTeleconsultation("555")
  assert.equal(join.citaId, "555")
  assert.ok(join.salaId.startsWith("cx-"), "La sala debe usar identificador opaco no predecible")
  assert.equal(join.esModerador, true)
  assert.ok(join.token.length > 10)

  const close = await closeTeleconsultation("555")
  assert.equal(close.estado, "FINALIZADA")
  assert.equal(recorded.length, 2)
})
