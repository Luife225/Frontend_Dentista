import { useEffect, useMemo, useState } from "react"
import {
  fetchAvailableSlots,
  type SlotDto,
} from "../services/availabilityService"

/** Una respuesta antigua nunca sustituye la disponibilidad del profesional/fecha actual. */
export default function useAppointmentSlots(doctorId: string, date: string) {
  const [result, setResult] = useState<{ key: string ;data: SlotDto[] }>({
    key: "",
    data: [],
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const key = `${doctorId}/${date}`
  useEffect(() => {
    let active = true
    setError("")
    if (!doctorId || !date) {
      setLoading(false)
      return
    }
    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchAvailableSlots(doctorId, date)
        if (active) {
          setResult({ key, data })
          setError("")
        }
      } catch (err: any) {
        if (active) {
          setResult({ key, data: [] })
          setError(err.message || "No se pudo consultar disponibilidad")
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    const timer = setInterval(load, 20000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [doctorId, date, key])
  const slots = useMemo(
    () =>
      result.key === key
        ? result.data.map((s) => ({
            time: s.inicio.slice(0, 5),
            endTime: s.fin.slice(0, 5),
            label: `${s.inicio.slice(0, 5)}${
              !s.disponible
                ? ` — ${s.motivoNoDisponible || "No disponible"}`
                : ""
            }`,
            isPast: !s.disponible,
          }))
        : [],
    [result, key],
  )
  return {
    slots,
    loading: loading || (!!doctorId && !!date && result.key !== key),
    error,
    isSunday: !loading && result.key === key && slots.length === 0,
    isSaturday: false,
    allPassed: !loading && slots.length > 0 && slots.every((s) => s.isPast),
    closingTime: slots.length ? slots[slots.length - 1].endTime : "—",
  }
}
