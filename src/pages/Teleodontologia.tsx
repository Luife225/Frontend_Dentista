import { useEffect, useState } from "react"

import { useNavigate } from "react-router-dom"

import { useAuth } from "../contexts/AuthContext"

import {
  getAppointmentsByDoctor,
  updateTeleconsultationLink,
} from "../services/appointmentService"

import { startAppointmentAttention } from "../services/clinicalEncounterService"

import type { Appointment } from "../types/appointment"

import { formatLimaDate, formatLimaTime } from "../utils/appointmentRules"

import DeviceCheck from "../components/features/DeviceCheck"

const openStates = ["PROGRAMADA", "CONFIRMADA", "REPROGRAMADA", "EN_ATENCION"]

export default function Teleodontologia() {
  const { user } = useAuth()

  const navigate = useNavigate()

  const [appointments, setAppointments] = useState<Appointment[]>([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState("")

  const [busy, setBusy] = useState("")

  const [filter, setFilter] = useState("ACTIVAS")

  const [editing, setEditing] = useState<string | null>(null)

  const [link, setLink] = useState("")

  async function load() {
    setLoading(true)
    setError("")

    try {
      if (!user?.usuarioClinicaId)
        throw new Error("La sesión no tiene un odontólogo asociado")

      const now = Date.now()

      const data = await getAppointmentsByDoctor(
        user.usuarioClinicaId,
        new Date(now - 30 * 86400000).toISOString(),
        new Date(now + 90 * 86400000).toISOString(),
      )

      setAppointments(data.filter((a) => a.modalidad === "VIRTUAL"))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [user?.usuarioClinicaId])

  const visible = appointments.filter(
    (a) =>
      filter === "TODAS" ||
      (filter === "ACTIVAS"
        ? openStates.includes(a.estado)
        : !openStates.includes(a.estado)),
  )

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teleodontología</h1>
          <p className="text-sm text-slate-500">
            Tus citas virtuales y sus enlaces de acceso a Meet o Zoom.
          </p>
        </div>
        <button
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-cyan-700 text-white text-sm"
          onClick={load}
        >
          Actualizar
        </button>
      </div>
      {error && (
        <p role="alert" className="bg-rose-50 text-rose-700 p-3 rounded-xl">
          {error}
        </p>
      )}
      <DeviceCheck />
      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center gap-3">
          <h2 className="font-bold">Teleconsultas</h2>
          <label className="text-sm">
            Mostrar{" "}
            <select
              className="border border-slate-200 rounded-lg p-2"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="ACTIVAS">Activas</option>
              <option value="CERRADAS">Cerradas</option>
              <option value="TODAS">Todas</option>
            </select>
          </label>
        </div>
        {loading ? (
          <p role="status">Cargando teleconsultas…</p>
        ) : visible.length === 0 ? (
          <p className="text-slate-500 py-8">
            No hay teleconsultas en este período (30 días anteriores y 90
            siguientes).
          </p>
        ) : (
          <ul className="divide-y">
            {visible.map((a) => (
              <li key={a.id} className="py-5 space-y-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">
                      {a.pacienteNombreCompleto}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {formatLimaDate(a.inicioEn)} ·{" "}
                      {formatLimaTime(a.inicioEn)}–{formatLimaTime(a.finEn)}{" "}
                      (Lima)
                    </p>
                  </div>
                  <span className="text-sm">{a.estado}</span>
                </div>
                {a.enlaceTeleconsulta ? (
                  <a
                    href={a.enlaceTeleconsulta}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-700 text-sm underline break-all"
                  >
                    {a.enlaceTeleconsulta}
                  </a>
                ) : (
                  <p className="text-amber-700 text-sm">
                    Enlace pendiente de asignación. El paciente verá esta misma
                    condición.
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  {a.enlaceTeleconsulta && openStates.includes(a.estado) && (
                    <a
                      href={a.enlaceTeleconsulta}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-sky-700 text-white rounded-xl text-sm"
                    >
                      Unirse a la reunión ↗
                    </a>
                  )}
                  {openStates.includes(a.estado) && (
                    <button
                      disabled={!!busy}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-sm"
                      onClick={() => {
                        setEditing(a.id)
                        setLink(a.enlaceTeleconsulta || "")
                      }}
                    >
                      Asignar o cambiar enlace
                    </button>
                  )}
                  <button
                    disabled={!!busy}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm"
                    onClick={async () => {
                      setBusy(a.id)
                      setError("")

                      try {
                        if (openStates.includes(a.estado))
                          await startAppointmentAttention(a.id)

                        navigate(
                          `/app/pacientes?pacienteId=${a.pacienteId}&citaId=${a.id}&tab=historia${
                            openStates.includes(a.estado) ? "&atender=true" : ""
                          }`,
                        )
                      } catch (e: any) {
                        setError(e.message)
                      } finally {
                        setBusy("")
                      }
                    }}
                  >
                    {openStates.includes(a.estado)
                      ? "Atender y registrar historia"
                      : "Consultar historia clínica"}
                  </button>
                </div>
                {editing === a.id && (
                  <form
                    className="bg-slate-50 rounded-xl p-4 space-y-3"
                    onSubmit={async (e) => {
                      e.preventDefault()
                      setBusy(a.id)
                      setError("")

                      try {
                        const updated = await updateTeleconsultationLink(
                          a.id,
                          link.trim(),
                        )
                        setAppointments((as) =>
                          as.map((v) => (v.id === updated.id ? updated : v)),
                        )
                        setEditing(null)
                      } catch (err: any) {
                        setError(err.message)
                      } finally {
                        setBusy("")
                      }
                    }}
                  >
                    <label className="block text-sm">
                      Enlace de reunión
                      <input
                        required
                        type="url"
                        maxLength={500}
                        className="border border-slate-200 rounded-xl p-2 text-sm w-full bg-white"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        placeholder="https://meet.google.com/abc-defg-hij"
                      />
                    </label>
                    <p className="text-xs text-slate-500">
                      Crea una reunión con la cuenta autorizada de la clínica y
                      pega su enlace. Al guardarlo quedará disponible en el
                      portal del paciente.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        disabled={!!busy}
                        className="px-4 py-2 bg-cyan-700 text-white rounded-xl text-sm"
                      >
                        Guardar enlace
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(null)}
                        disabled={!!busy}
                      >
                        Cancelar
                      </button>
                      <a
                        href="https://meet.google.com/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-cyan-700 underline"
                      >
                        Crear reunión en Meet ↗
                      </a>
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
