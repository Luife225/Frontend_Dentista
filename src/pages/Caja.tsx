import { useEffect, useMemo, useState } from "react"

import { useAuth } from "../contexts/AuthContext"

import {
  fetchPatientsFromApi,
  type BackendPatientDto,
} from "../services/patientService"

import { getAppointmentsByPatient } from "../services/appointmentService"

import type { Appointment } from "../types/appointment"

import {
  listCharges,
  createCharge,
  payCharge,
  voidCharge,
  voidPayment,
  type CashCharge,
} from "../services/businessService"

import { formatLimaDate, toLimaDateString } from "../utils/appointmentRules"

import exportCsv from "../utils/exportCsv"

const money = (v: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    v,
  )

const field = "w-full border border-slate-300 rounded-xl p-2 text-sm bg-white"

const button =
  "px-4 py-2 rounded-xl bg-cyan-700 text-white text-sm font-semibold disabled:opacity-50"

export default function Caja() {
  const { role } = useAuth()

  const admin = role === "ADMIN_CLINICA"

  const [charges, setCharges] = useState<CashCharge[]>([])

  const [patients, setPatients] = useState<BackendPatientDto[]>([])

  const [appointments, setAppointments] = useState<Appointment[]>([])

  const [selected, setSelected] = useState("")

  const [query, setQuery] = useState("")

  const [date, setDate] = useState(toLimaDateString(new Date().toISOString()))

  const [error, setError] = useState("")

  const [notice, setNotice] = useState("")

  const [loading, setLoading] = useState(true)

  const [busy, setBusy] = useState(false)

  const [form, setForm] = useState({
    pacienteId: "",
    citaId: "",
    concepto: "",
    importe: "",
  })

  const [payment, setPayment] = useState({
    importe: "",
    medio: "EFECTIVO",
    referencia: "",
  })

  const [action, setAction] = useState<{
    type: "cargo" | "pago"
    id: string
  } | null>(null)

  const [reason, setReason] = useState("")

  // Mantener la clave cuando falla la red permite reintentar sin cobrar dos veces.

  const [chargeKey, setChargeKey] = useState(crypto.randomUUID())

  const [paymentKey, setPaymentKey] = useState(crypto.randomUUID())

  async function load() {
    setLoading(true)
    setError("")

    try {
      const [cs, ps] = await Promise.all([
        listCharges(),
        fetchPatientsFromApi(),
      ])

      setCharges(cs)
      setPatients(ps)
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
    setAppointments([])

    if (form.pacienteId)
      getAppointmentsByPatient(form.pacienteId)
        .then((cs) => {
          if (active) setAppointments(cs)
        })
        .catch((e) => {
          if (active) setError(e.message)
        })

    return () => {
      active = false
    }
  }, [form.pacienteId])

  const current = charges.find((c) => c.id === selected)

  const filtered = charges.filter((c) =>
    `${c.pacienteNombre} ${c.concepto} ${c.id}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  )

  const dailyPayments = useMemo(
    () =>
      charges
        .flatMap((c) =>
          c.pagos.map((p) => ({
            ...p,
            paciente: c.pacienteNombre,
            concepto: c.concepto,
          })),
        )

        .filter((p) => toLimaDateString(p.fechaCreacion) === date),
    [charges, date],
  )

  const collected =
    dailyPayments
      .filter((p) => !p.anulado)
      .reduce((s, p) => s + Math.round(Number(p.importe) * 100), 0) / 100

  const outstanding =
    charges.reduce((s, c) => s + Math.round(Number(c.saldo) * 100), 0) / 100

  async function run(work: () => Promise<CashCharge>, success: string) {
    setBusy(true)
    setError("")
    setNotice("")

    try {
      const updated = await work()

      setCharges((cs) => [updated, ...cs.filter((c) => c.id !== updated.id)])

      setSelected(updated.id)
      setNotice(success)

      return true
    } catch (e: any) {
      setError(e.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Caja y cobros</h1>
          <p className="text-sm text-slate-500">
            Cargos, abonos y saldos de la clínica en soles.
          </p>
        </div>
        <button className={button} disabled={loading || busy} onClick={load}>
          Actualizar
        </button>
      </div>
      {error && (
        <div role="alert" className="p-3 rounded-xl bg-rose-50 text-rose-700">
          {error}
        </div>
      )}
      {notice && (
        <p
          role="status"
          className="p-3 rounded-xl bg-emerald-50 text-emerald-800"
        >
          {notice}
        </p>
      )}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-sm text-slate-500">
            Cobrado en la fecha seleccionada
          </p>
          <p className="text-2xl font-bold text-emerald-700">
            {money(collected)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-sm text-slate-500">Saldo total pendiente</p>
          <p className="text-2xl font-bold text-amber-700">
            {money(outstanding)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <label className="text-sm text-slate-500">
            Fecha del reporte (Lima)
            <input
              type="date"
              className={field}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <button
            disabled={loading}
            className="text-sm text-cyan-700 underline mt-2"
            onClick={() =>
              exportCsv(`caja-${date}.csv`, [
                [
                  "Pago",
                  "Cargo",
                  "Fecha",
                  "Paciente",
                  "Concepto",
                  "Importe PEN",
                  "Medio",
                  "Referencia",
                  "Anulado",
                  "Motivo",
                ],
                ...dailyPayments.map((p) => [
                  p.id,
                  p.cargoId,
                  p.fechaCreacion,
                  p.paciente,
                  p.concepto,
                  p.importe,
                  p.medio,
                  p.referencia,
                  p.anulado ? "Sí" : "No",
                  p.motivoAnulacion,
                ]),
              ])
            }
          >
            Exportar pagos de esta fecha
          </button>
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <form
          className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault()

            if (
              await run(
                () =>
                  createCharge({
                    ...form,
                    citaId: form.citaId || undefined,
                    solicitudId: chargeKey,
                  }),
                "Cargo registrado",
              )
            ) {
              setForm({ pacienteId: "", citaId: "", concepto: "", importe: "" })
              setChargeKey(crypto.randomUUID())
            }
          }}
        >
          <h2 className="font-bold">Nuevo cargo</h2>
          <label className="block text-sm">
            Paciente
            <select
              required
              className={field}
              value={form.pacienteId}
              onChange={(e) => {
                setForm((f) => ({
                  ...f,
                  pacienteId: e.target.value,
                  citaId: "",
                }))
                setChargeKey(crypto.randomUUID())
              }}
            >
              <option value="">Seleccionar paciente</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombres} {p.apellidos} · {p.numeroDocumento}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Cita vinculada (opcional)
            <select
              className={field}
              value={form.citaId}
              onChange={(e) =>
                setForm((f) => ({ ...f, citaId: e.target.value }))
              }
            >
              <option value="">Sin cita</option>
              {appointments.map((a) => (
                <option key={a.id} value={a.id}>
                  #{a.id} · {formatLimaDate(a.inicioEn)} · {a.estado}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Concepto
            <input
              required
              maxLength={200}
              className={field}
              value={form.concepto}
              onChange={(e) =>
                setForm((f) => ({ ...f, concepto: e.target.value }))
              }
            />
          </label>
          <label className="block text-sm">
            Importe S/
            <input
              required
              type="number"
              min="0.01"
              max="9999999999.99"
              step="0.01"
              className={field}
              value={form.importe}
              onChange={(e) =>
                setForm((f) => ({ ...f, importe: e.target.value }))
              }
            />
          </label>
          <button className={button} disabled={busy || loading}>
            Registrar cargo
          </button>
        </form>
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
          <label className="text-sm">
            Buscar cargos
            <input
              className={field}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Paciente, concepto o número"
            />
          </label>
          {loading ? (
            <p className="p-5" role="status">
              Cargando caja…
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-slate-500">
              No hay cargos registrados con este criterio.
            </p>
          ) : (
            <div className="divide-y mt-3 max-h-96 overflow-y-auto">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  className={`w-full text-left p-3 rounded-xl ${
                    selected === c.id ? "bg-cyan-50" : "hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    setSelected(c.id)
                    setPayment({
                      importe: String(c.saldo),
                      medio: "EFECTIVO",
                      referencia: "",
                    })
                    setPaymentKey(crypto.randomUUID())
                    setAction(null)
                  }}
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold">{c.pacienteNombre}</span>
                    <span>{money(Number(c.importe))}</span>
                  </div>
                  <p className="text-sm text-slate-500">
                    #{c.id} · {c.concepto} · {c.estado}
                  </p>
                  <p className="text-sm">Saldo {money(Number(c.saldo))}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {current && (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h2 className="font-bold">
            Cargo #{current.id} · {current.concepto}
          </h2>
          <p className="text-sm text-slate-600">
            {current.pacienteNombre} · {current.estado} · Pagado:{" "}
            {money(Number(current.pagado))} · Saldo:{" "}
            {money(Number(current.saldo))}
          </p>
          {Number(current.saldo) > 0 && current.estado !== "ANULADO" && (
            <form
              className="grid sm:grid-cols-4 gap-3 items-end"
              onSubmit={async (e) => {
                e.preventDefault()
                if (
                  await run(
                    () =>
                      payCharge(current.id, {
                        ...payment,
                        solicitudId: paymentKey,
                      }),
                    "Pago registrado",
                  )
                ) {
                  setPaymentKey(crypto.randomUUID())
                  setPayment((p) => ({ ...p, importe: "", referencia: "" }))
                }
              }}
            >
              <label className="text-sm">
                Abono S/
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={current.saldo}
                  className={field}
                  value={payment.importe}
                  onChange={(e) =>
                    setPayment((p) => ({ ...p, importe: e.target.value }))
                  }
                />
              </label>
              <label className="text-sm">
                Medio
                <select
                  className={field}
                  value={payment.medio}
                  onChange={(e) =>
                    setPayment((p) => ({ ...p, medio: e.target.value }))
                  }
                >
                  {["EFECTIVO", "TARJETA", "TRANSFERENCIA", "YAPE", "PLIN"].map(
                    (m) => (
                      <option key={m}>{m}</option>
                    ),
                  )}
                </select>
              </label>
              <label className="text-sm">
                Referencia
                <input
                  maxLength={120}
                  className={field}
                  value={payment.referencia}
                  onChange={(e) =>
                    setPayment((p) => ({ ...p, referencia: e.target.value }))
                  }
                />
              </label>
              <button className={button} disabled={busy}>
                Registrar abono
              </button>
            </form>
          )}
          <div className="divide-y">
            {current.pagos.length === 0 && (
              <p className="text-sm text-slate-500">Sin pagos.</p>
            )}
            {current.pagos.map((p) => (
              <div
                key={p.id}
                className="py-3 flex flex-wrap justify-between gap-2"
              >
                <span className="text-sm">
                  Pago #{p.id} · {formatLimaDate(p.fechaCreacion)} · {p.medio} ·{" "}
                  {money(Number(p.importe))} ·{" "}
                  {p.anulado
                    ? `Anulado: ${p.motivoAnulacion}`
                    : p.referencia || "Registrado"}
                </span>
                {admin && !p.anulado && (
                  <button
                    disabled={busy}
                    className="text-sm text-rose-700 underline"
                    onClick={() => {
                      setAction({ type: "pago", id: p.id })
                      setReason("")
                    }}
                  >
                    Anular pago
                  </button>
                )}
              </div>
            ))}
          </div>
          {admin &&
            current.estado !== "ANULADO" &&
            Number(current.pagado) === 0 && (
              <button
                disabled={busy}
                className="text-sm text-rose-700 underline"
                onClick={() => {
                  setAction({ type: "cargo", id: current.id })
                  setReason("")
                }}
              >
                Anular cargo
              </button>
            )}
          {action && (
            <form
              className="bg-rose-50 p-4 rounded-xl space-y-2"
              onSubmit={async (e) => {
                e.preventDefault()
                if (
                  await run(
                    () =>
                      action.type === "cargo"
                        ? voidCharge(action.id, reason)
                        : voidPayment(action.id, reason),
                    "Anulación registrada",
                  )
                )
                  setAction(null)
              }}
            >
              <label className="text-sm">
                Motivo de anulación
                <input
                  required
                  maxLength={500}
                  className={field}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <div className="flex gap-3">
                <button className={button} disabled={busy}>
                  Confirmar anulación
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setAction(null)}
                >
                  Volver
                </button>
              </div>
            </form>
          )}
        </section>
      )}
      <p className="text-xs text-slate-500">
        Registro interno de cobros. Los pagos se registran después de
        recibirlos; el sistema no procesa tarjetas ni emite comprobantes
        electrónicos tributarios.
      </p>
    </div>
  )
}
