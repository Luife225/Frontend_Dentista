import { useEffect, useState } from "react"

import { fetchClinicOdontologos } from "../../services/appointmentService"

import type { UserItem } from "../../services/authService"

import {
  getDoctorAbsences,
  createDoctorAbsence,
  deleteDoctorAbsence,
  type AusenciaDto,
} from "../../services/availabilityService"

import { formatLimaDate, formatLimaTime } from "../../utils/appointmentRules"

export default function DoctorAbsences() {
  const [doctors, setDoctors] = useState<UserItem[]>([])

  const [doctorId, setDoctorId] = useState("")

  const [absences, setAbsences] = useState<AusenciaDto[]>([])

  const [error, setError] = useState("")

  const [loading, setLoading] = useState(false)

  const [busy, setBusy] = useState(false)

  const [form, setForm] = useState({
    inicio: "",
    fin: "",
    motivo: "",
    tipo: "VACACIONES",
  })

  useEffect(() => {
    let active = true

    fetchClinicOdontologos()
      .then((ds) => {
        if (active) {
          setDoctors(ds)
          setDoctorId(ds[0]?.usuarioClinicaId || "")
        }
      })
      .catch((e) => {
        if (active) setError(e.message)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    setAbsences([])

    if (!doctorId) return

    setLoading(true)
    setError("")

    getDoctorAbsences(doctorId)
      .then((ds) => {
        if (active) setAbsences(ds)
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [doctorId])

  const field = "w-full border border-slate-300 rounded-xl p-2 text-sm bg-white"

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 mt-5 space-y-4">
      <h2 className="font-bold text-slate-900">Ausencias de odontólogos</h2>
      <p className="text-sm text-slate-500">
        Las ausencias bloquean nuevas reservas. Si hay citas dentro del período,
        debes reprogramarlas o cancelarlas primero.
      </p>
      {error && (
        <p role="alert" className="p-3 bg-rose-50 rounded-xl text-rose-700">
          {error}
        </p>
      )}
      <label className="block text-sm">
        Profesional
        <select
          disabled={busy}
          className={field}
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
        >
          <option value="">Seleccionar odontólogo</option>
          {doctors.map((d) => (
            <option key={d.usuarioClinicaId} value={d.usuarioClinicaId}>
              {d.nombres} {d.apellidos}
            </option>
          ))}
        </select>
      </label>
      {doctorId && (
        <form
          className="grid sm:grid-cols-2 gap-3"
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            setError("")

            try {
              const created = await createDoctorAbsence(doctorId, {
                inicioEn: `${form.inicio}:00-05:00`,
                finEn: `${form.fin}:00-05:00`,
                motivo: form.motivo,
                tipo: form.tipo,
              })

              setAbsences((as) => [...as, created])
              setForm({ inicio: "", fin: "", motivo: "", tipo: "VACACIONES" })
            } catch (err: any) {
              setError(err.message)
            } finally {
              setBusy(false)
            }
          }}
        >
          <label className="text-sm">
            Inicio (Lima)
            <input
              required
              type="datetime-local"
              className={field}
              value={form.inicio}
              onChange={(e) =>
                setForm((f) => ({ ...f, inicio: e.target.value }))
              }
            />
          </label>
          <label className="text-sm">
            Fin (Lima)
            <input
              required
              type="datetime-local"
              min={form.inicio}
              className={field}
              value={form.fin}
              onChange={(e) => setForm((f) => ({ ...f, fin: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Tipo
            <select
              className={field}
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
            >
              {[
                "VACACIONES",
                "LICENCIA_MEDICA",
                "PERMISO",
                "CAPACITACION",
                "OTRO",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Motivo
            <input
              required
              maxLength={255}
              className={field}
              value={form.motivo}
              onChange={(e) =>
                setForm((f) => ({ ...f, motivo: e.target.value }))
              }
            />
          </label>
          <button
            disabled={busy}
            className="px-4 py-2 bg-cyan-700 text-white rounded-xl text-sm font-semibold"
          >
            Registrar ausencia
          </button>
        </form>
      )}
      {loading ? (
        <p role="status">Cargando ausencias…</p>
      ) : (
        <ul className="divide-y">
          {absences.map((a) => (
            <li className="py-3 flex justify-between gap-3 text-sm" key={a.id}>
              <div>
                <strong>{a.tipo}</strong>
                <p>
                  {formatLimaDate(a.inicioEn)} {formatLimaTime(a.inicioEn)} —{" "}
                  {formatLimaDate(a.finEn)} {formatLimaTime(a.finEn)}
                </p>
                <p>{a.motivo}</p>
              </div>
              <button
                disabled={busy}
                className="text-rose-700 underline"
                onClick={async () => {
                  if (
                    !a.id ||
                    !window.confirm(
                      "¿Deseas eliminar este bloqueo de disponibilidad?",
                    )
                  )
                    return

                  setBusy(true)
                  setError("")

                  try {
                    await deleteDoctorAbsence(a.id)
                    setAbsences((as) => as.filter((v) => v.id !== a.id))
                  } catch (err: any) {
                    setError(err.message)
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                Eliminar bloqueo
              </button>
            </li>
          ))}
          {doctorId && absences.length === 0 && (
            <li className="text-slate-500 py-3">Sin ausencias registradas.</li>
          )}
        </ul>
      )}
    </section>
  )
}
