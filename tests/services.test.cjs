const { test } = require("node:test")
const assert = require("node:assert/strict")
const vm = require("node:vm")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")

// Se ejecuta la fuente de producción: solo se sustituyen red, navegador y proveedor externo.
function harness(overrides = {}) {
  const values = new Map([["coronyx_jwt_token", "token-ficticio"]])
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
      VITE_GOOGLE_CLIENT_ID: "test.apps.googleusercontent.com",
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
    if (!file.endsWith(".ts")) file += ".ts"
    if (cache.has(file)) return cache.get(file).exports
    const source = fs
      .readFileSync(file, "utf8")
      .replace(/import\.meta\.env\??/g, "env")
    const code = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText
    const mod = { exports: {} }
    cache.set(file, mod)
    const fn = vm.runInContext(
      `(function(require,module,exports){${code}\n})`,
      context,
      { filename: file },
    )
    fn(
      (id) =>
        load(
          path.relative(
            path.resolve(__dirname, "../src"),
            path.resolve(path.dirname(file), id),
          ),
        ),
      mod,
      mod.exports,
    )
    return mod.exports
  }
  return { load, values, events, sandbox }
}
const encounter = {
  id: "9007199254740993",
  clinicaId: "1",
  pacienteId: "9007199254740995",
  citaId: "9007199254740997",
  odontologoId: "3",
  estado: "BORRADOR",
  versiones: [],
}

test("el portal excluye inasistencias y fechas pasadas de próximas citas", () => {
  const { isUpcomingAppointment } = harness().load(
    "utils/appointmentPresentation",
  )
  const now = Date.parse("2026-10-18T10:00:00-05:00")
  assert.equal(
    isUpcomingAppointment(
      { estado: "NO_ASISTIO", finEn: "2026-10-20T10:00:00-05:00" },
      now,
    ),
    false,
  )
  assert.equal(
    isUpcomingAppointment(
      { estado: "PROGRAMADA", finEn: "2026-10-17T10:00:00-05:00" },
      now,
    ),
    false,
  )
  assert.equal(
    isUpcomingAppointment(
      { estado: "PROGRAMADA", finEn: "2026-10-20T10:00:00-05:00" },
      now,
    ),
    true,
  )
})

test("alta clínica conserva los IDs BIGINT al enviar y recibir", async () => {
  let body
  const h = harness({
    fetch: async (_url, opts) => {
      body = JSON.parse(opts.body)
      return Response.json(encounter)
    },
  })
  const result = await h
    .load("services/clinicalEncounterService")
    .createDraftEncounter({
      pacienteId: encounter.pacienteId,
      citaId: encounter.citaId,
    })
  assert.equal(body.pacienteId, encounter.pacienteId)
  assert.equal(body.citaId, encounter.citaId)
  assert.equal(result.id, encounter.id)
})
test("firma usa la versión exacta como string", async () => {
  let body
  const h = harness({
    fetch: async (_url, opts) => {
      body = JSON.parse(opts.body)
      return Response.json(encounter)
    },
  })
  await h
    .load("services/clinicalEncounterService")
    .confirmEncounterVersion(encounter.id, { versionId: "9007199254740999" })
  assert.equal(body.versionId, "9007199254740999")
})
test("la URL configurada se utiliza también para disponibilidad y ausencias", async () => {
  const urls = []
  const h = harness({
    fetch: async (url) => {
      urls.push(url)
      return Response.json([])
    },
  })
  const service = h.load("services/availabilityService")
  await service.getDoctorAbsences("9")
  await service.fetchAvailableSlots("9", "2026-10-20")
  assert.equal(
    urls[0],
    "https://api.example.invalid/api/v1/disponibilidad/ausencias/9",
  )
  assert.match(
    urls[1],
    /disponibilidad\/slots\?odontologoId=9&fecha=2026-10-20$/,
  )
})
test("401 clínico revoca la sesión local y avisa al contexto de autenticación", async () => {
  const h = harness({
    fetch: async () =>
      Response.json({ message: "Sesión revocada" }, { status: 401 }),
  })
  await assert.rejects(
    h.load("services/clinicalEncounterService").getEncounterById("9"),
    /Sesión revocada/,
  )
  assert.equal(h.values.has("coronyx_jwt_token"), false)
  assert.deepEqual(h.events, ["coronyx:unauthorized"])
})
test("401 de inventario también invalida la sesión", async () => {
  const h = harness({
    fetch: async () =>
      Response.json({ message: "Sesión revocada" }, { status: 401 }),
  })
  await assert.rejects(
    h.load("services/businessService").listItems(),
    /Sesión revocada/,
  )
  assert.equal(h.values.has("coronyx_jwt_token"), false)
})
test("Meet resuelve el cierre del popup y permite reintentar", async () => {
  let config
  const h = harness({
    window: {
      google: {
        accounts: {
          oauth2: {
            initTokenClient: (c) => {
              config = c
              return {
                requestAccessToken: () =>
                  queueMicrotask(() =>
                    config.error_callback({ type: "popup_closed" }),
                  ),
              }
            },
          },
        },
      },
    },
  })
  await assert.rejects(
    h.load("services/googleMeetService").createOfficialGoogleMeet(),
    /Se cerró la autorización/,
  )
})
test("Meet espera una conferencia pendiente consultando el evento creado", async () => {
  let config
  const urls = []
  const h = harness({
    setTimeout: (fn, ms) => setTimeout(fn, ms === 1000 ? 0 : ms),
    window: {
      google: {
        accounts: {
          oauth2: {
            initTokenClient: (c) => {
              config = c
              return {
                requestAccessToken: () =>
                  queueMicrotask(() =>
                    config.callback({ access_token: "token-ficticio" }),
                  ),
              }
            },
          },
        },
      },
    },
    fetch: async (url) => {
      urls.push(url)
      return Response.json(
        urls.length === 1
          ? {
              id: "event-1",
              conferenceData: {
                createRequest: { status: { statusCode: "pending" } },
              },
            }
          : {
              id: "event-1",
              hangoutLink: "https://meet.google.com/abc-defg-hij",
            },
      )
    },
  })
  const result = await h
    .load("services/googleMeetService")
    .createOfficialGoogleMeet()
  assert.equal(result.meetUrl, "https://meet.google.com/abc-defg-hij")
  assert.equal(urls.length, 2)
  assert.match(urls[1], /events\/event-1$/)
})
test("SDK de Google puede cargarse de nuevo después de un fallo", async () => {
  let count = 0
  const h = harness({
    document: {
      querySelector: () => null,
      createElement: () => ({ remove() {} }),
      head: {
        appendChild: (script) => {
          count++
          queueMicrotask(() => {
            if (count === 1) script.onerror()
            else {
              h.sandbox.window.google = { accounts: { oauth2: {} } }
              script.onload()
            }
          })
        },
      },
    },
  })
  const service = h.load("services/googleMeetService")
  await assert.rejects(
    service.loadGoogleIdentityScript(),
    /No se pudo cargar Google/,
  )
  await service.loadGoogleIdentityScript()
  assert.equal(count, 2)
})

test("rechaza IDs numéricos recibidos para evitar aceptar valores redondeados", async () => {
  const h = harness({ fetch: async () => Response.json({ ...encounter, id: 9007199254740992 }) });
  await assert.rejects(h.load("services/clinicalEncounterService").getEncounterById("9"), /cadena decimal/);
});
