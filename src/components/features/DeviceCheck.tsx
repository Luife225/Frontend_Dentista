import { useEffect, useRef, useState } from "react"

export default function DeviceCheck() {
  const video = useRef<HTMLVideoElement>(null)

  const stream = useRef<MediaStream | null>(null)

  const [active, setActive] = useState(false)

  const [busy, setBusy] = useState(false)

  const [error, setError] = useState("")

  const mounted = useRef(true)

  const stop = () => {
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null

    if (video.current) video.current.srcObject = null

    setActive(false)
  }

  useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false
      stream.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const start = async () => {
    setBusy(true)
    setError("")

    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          "La prueba necesita acceso seguro al sitio y un navegador con cámara y micrófono.",
        )

      const media = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      if (!mounted.current) {
        media.getTracks().forEach((t) => t.stop())
        return
      }

      stream.current = media

      if (video.current) video.current.srcObject = media

      setActive(true)
    } catch (e: any) {
      if (mounted.current)
        setError(
          e.name === "NotAllowedError"
            ? "Permite el acceso a cámara y micrófono en el navegador para realizar la prueba."
            : e.message || "No se pudo acceder a los dispositivos.",
        )
    } finally {
      if (mounted.current) setBusy(false)
    }
  }

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
      <h2 className="font-bold text-slate-900">Prueba de cámara y micrófono</h2>
      <p className="text-sm text-slate-500">
        La imagen solo se muestra en este equipo. Meet o Zoom solicitará sus
        propios permisos al abrir la reunión.
      </p>
      <video
        ref={video}
        autoPlay
        playsInline
        muted
        className={`w-full max-w-lg rounded-xl bg-slate-900 ${
          active ? "" : "hidden"
        }`}
      />
      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      )}
      {active && (
        <p role="status" className="text-sm text-emerald-700">
          Cámara disponible · Micrófono:{" "}
          {stream.current?.getAudioTracks().some((t) => t.readyState === "live")
            ? "disponible"
            : "sin acceso"}
        </p>
      )}
      <button
        disabled={busy}
        onClick={active ? stop : start}
        className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm disabled:opacity-50"
      >
        {busy
          ? "Solicitando acceso…"
          : active
            ? "Terminar prueba"
            : "Probar dispositivos"}
      </button>
    </section>
  )
}
