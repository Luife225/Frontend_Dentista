import DoctorAbsences from "../components/agenda/DoctorAbsences"

import { useState, useEffect } from "react"

import {
  fetchClinicUsers,
  createClinicUser,
  updateClinicUser,
  updateClinicUserStatus,
  type ClinicUserDto,
  type ClinicRole,
  type CreateClinicUserDto,
  type UpdateClinicUserDto,
} from "../services/clinicUserService"

import { ApiError } from "../services/apiClient"

import {
  getClinicProfile,
  updateClinicProfile,
  type ClinicDto,
  type UpdateClinicDto,
} from "../services/clinicService"

import {
  getClinicSchedule,
  updateClinicSchedule,
  type HorarioAtencionDto,
} from "../services/availabilityService"

function Icon({ d, className = "w-4 h-4" }: { d: string ;className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d={d} />
    </svg>
  )
}

// ── Roles oficiales de la clínica (F03-A / F03-B) ─────────────────────────────

const ROLES: ClinicRole[] = [
  "ADMIN_CLINICA",
  "ODONTOLOGO",
  "RECEPCIONISTA",
  "PACIENTE",
]

const ROLE_LABELS: Record<ClinicRole, string> = {
  ADMIN_CLINICA: "Administrador/a",

  ODONTOLOGO: "Odontólogo/a",

  RECEPCIONISTA: "Recepcionista",

  PACIENTE: "Paciente",
}

const ROLE_COLORS: Record<ClinicRole, string> = {
  ADMIN_CLINICA: "bg-slate-100 text-slate-700 border-slate-200",

  ODONTOLOGO: "bg-cyan-100 text-cyan-700 border-cyan-200",

  RECEPCIONISTA: "bg-violet-100 text-violet-700 border-violet-200",

  PACIENTE: "bg-amber-100 text-amber-700 border-amber-200",
}

const ROLE_BUTTON_COLORS: Record<ClinicRole, string> = {
  ADMIN_CLINICA: "bg-slate-600 text-white border-transparent",

  ODONTOLOGO: "bg-cyan-600 text-white border-transparent",

  RECEPCIONISTA: "bg-violet-600 text-white border-transparent",

  PACIENTE: "bg-amber-600 text-white border-transparent",
}

// ── Modal: Crear nuevo usuario ────────────────────────────────────────────────

interface ModalCrearProps {
  onClose: () => void

  onCreated: (user: ClinicUserDto) => void
}

function ModalCrearUsuario({ onClose, onCreated }: ModalCrearProps) {
  const [form, setForm] = useState<CreateClinicUserDto>({
    correo: "",

    clave: "",

    nombres: "",

    apellidos: "",

    rol: "ODONTOLOGO",

    estado: "ACTIVO",

    pacienteId: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isPaciente = form.rol === "PACIENTE"

  const setField =
    (k: keyof CreateClinicUserDto) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }))

      setFieldErrors((fe) => ({ ...fe, [k]: "" }))

      setErrorMessage(null)
    }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setFieldErrors({})

    setErrorMessage(null)

    // Pre-validaciones

    const errors: Record<string, string> = {}

    if (!form.correo.trim())
      errors.correo = "El correo electrónico es obligatorio"

    if (!form.clave || form.clave.length < 6)
      errors.clave = "La contraseña debe tener al menos 6 caracteres"

    if (!form.nombres.trim()) errors.nombres = "Los nombres son obligatorios"

    if (!form.apellidos.trim())
      errors.apellidos = "Los apellidos son obligatorios"

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)

      return
    }

    setIsSubmitting(true)

    try {
      const payload: CreateClinicUserDto = {
        correo: form.correo.trim().toLowerCase(),

        clave: form.clave,

        nombres: form.nombres.trim(),

        apellidos: form.apellidos.trim(),

        rol: form.rol,

        estado: form.estado || "ACTIVO",

        pacienteId:
          isPaciente && form.pacienteId?.trim() ? form.pacienteId.trim() : null,
      }

      const created = await createClinicUser(payload)

      onCreated(created)

      onClose()
    } catch (err: any) {
      if (err instanceof ApiError && err.data) {
        if (err.data.errors && typeof err.data.errors === "object") {
          setFieldErrors(err.data.errors)
        }

        setErrorMessage(err.data.message || err.message)
      } else {
        setErrorMessage(err.message || "Error al crear usuario en la clínica")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputCls =
    "w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div>
            <h2
              className="font-bold text-slate-800"
              style={{ fontFamily: "Outfit" }}
            >
              Crear nueva cuenta y membresía
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Asigna acceso institucional y credenciales
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            <p className="font-semibold">Error al crear cuenta:</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
        >
          {/* Rol selector */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-2">
              Rol en la clínica *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setForm((f) => ({ ...f, rol: r }))}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border-2 transition-all ${
                    form.rol === r
                      ? ROLE_BUTTON_COLORS[r]
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Datos personales */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Nombres *
              </label>
              <input
                value={form.nombres}
                onChange={setField("nombres")}
                className={`${inputCls} ${
                  fieldErrors.nombres ? "border-rose-400 bg-rose-50/20" : ""
                }`}
                placeholder="Ej: Andrés"
                required
              />
              {fieldErrors.nombres && (
                <p className="text-[11px] text-rose-500 mt-1">
                  {fieldErrors.nombres}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Apellidos *
              </label>
              <input
                value={form.apellidos}
                onChange={setField("apellidos")}
                className={`${inputCls} ${
                  fieldErrors.apellidos ? "border-rose-400 bg-rose-50/20" : ""
                }`}
                placeholder="Ej: Herrera"
                required
              />
              {fieldErrors.apellidos && (
                <p className="text-[11px] text-rose-500 mt-1">
                  {fieldErrors.apellidos}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Correo electrónico *
            </label>
            <input
              type="email"
              value={form.correo}
              onChange={setField("correo")}
              className={`${inputCls} ${
                fieldErrors.correo ? "border-rose-400 bg-rose-50/20" : ""
              }`}
              placeholder="usuario@coronyx.pe"
              required
            />
            {fieldErrors.correo && (
              <p className="text-[11px] text-rose-500 mt-1">
                {fieldErrors.correo}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Contraseña de acceso *
            </label>
            <input
              type="password"
              value={form.clave}
              onChange={setField("clave")}
              className={`${inputCls} ${
                fieldErrors.clave ? "border-rose-400 bg-rose-50/20" : ""
              }`}
              placeholder="Mínimo 6 caracteres"
              required
            />
            {fieldErrors.clave && (
              <p className="text-[11px] text-rose-500 mt-1">
                {fieldErrors.clave}
              </p>
            )}
          </div>

          {isPaciente && (
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Expediente de paciente a vincular (opcional)
              </label>
              <input
                value={form.pacienteId || ""}
                onChange={setField("pacienteId")}
                className={inputCls}
                placeholder="Ej: 1 (Número de expediente)"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                El expediente debe pertenecer a tu clínica y estar sin cuenta.
                Si lo dejas vacío, vincúlalo después para habilitar el portal.
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Estado inicial
            </label>
            <div className="flex gap-2">
              {(["ACTIVO", "INACTIVO"] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setForm((f) => ({ ...f, estado: s }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                    form.estado === s
                      ? s === "ACTIVO"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-slate-200 text-slate-400"
                  }`}
                >
                  {s === "ACTIVO" ? "Activo" : "Inactivo"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 bg-cyan-50 rounded-xl p-3 border border-cyan-200">
            <Icon
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5"
            />
            <p className="text-[11px] text-cyan-800">
              La cuenta se creará y se asociará a la clínica con credenciales
              seguras de acceso.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex gap-2 justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-cyan-600/20"
            >
              {isSubmitting && (
                <Icon
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  className="w-3.5 h-3.5 animate-spin"
                />
              )}
              {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal: Editar usuario ─────────────────────────────────────────────────────

interface ModalEditarProps {
  user: ClinicUserDto

  onClose: () => void

  onUpdated: (user: ClinicUserDto) => void
}

function ModalEditarUsuario({ user, onClose, onUpdated }: ModalEditarProps) {
  const [form, setForm] = useState<UpdateClinicUserDto>({
    nombres: user.nombres,

    apellidos: user.apellidos,

    rol: user.rol,

    clave: "",

    estado: user.estado,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const setField =
    (k: keyof UpdateClinicUserDto) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }))

      setFieldErrors((fe) => ({ ...fe, [k]: "" }))

      setErrorMessage(null)
    }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setFieldErrors({})

    setErrorMessage(null)

    const errors: Record<string, string> = {}

    if (!form.nombres?.trim()) errors.nombres = "Los nombres son obligatorios"

    if (!form.apellidos?.trim())
      errors.apellidos = "Los apellidos son obligatorios"

    if (form.clave && form.clave.length < 6)
      errors.clave = "La nueva clave debe tener al menos 6 caracteres"

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)

      return
    }

    setIsSubmitting(true)

    try {
      const payload: UpdateClinicUserDto = {
        nombres: form.nombres?.trim(),

        apellidos: form.apellidos?.trim(),

        rol: form.rol,

        estado: form.estado,

        ...(form.clave?.trim() ? { clave: form.clave.trim() } : {}),
      }

      const updated = await updateClinicUser(user.id, payload)

      onUpdated(updated)

      onClose()
    } catch (err: any) {
      if (err instanceof ApiError && err.data) {
        if (err.data.errors && typeof err.data.errors === "object") {
          setFieldErrors(err.data.errors)
        }

        setErrorMessage(err.data.message || err.message)
      } else {
        setErrorMessage(err.message || "Error al actualizar cuenta")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputCls =
    "w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div>
            <h2
              className="font-bold text-slate-800"
              style={{ fontFamily: "Outfit" }}
            >
              Editar usuario y membresía
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Actualiza el rol o las credenciales del usuario
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            <p className="font-semibold">Error al actualizar cuenta:</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
        >
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Correo electrónico (solo lectura)
            </label>
            <input
              value={user.correo}
              disabled
              className={`${inputCls} bg-slate-100 text-slate-500 cursor-not-allowed`}
            />
          </div>

          {/* Rol selector */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-2">
              Rol en la clínica *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setForm((f) => ({ ...f, rol: r }))}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border-2 transition-all ${
                    form.rol === r
                      ? ROLE_BUTTON_COLORS[r]
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Nombres *
              </label>
              <input
                value={form.nombres || ""}
                onChange={setField("nombres")}
                className={`${inputCls} ${
                  fieldErrors.nombres ? "border-rose-400 bg-rose-50/20" : ""
                }`}
                required
              />
              {fieldErrors.nombres && (
                <p className="text-[11px] text-rose-500 mt-1">
                  {fieldErrors.nombres}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Apellidos *
              </label>
              <input
                value={form.apellidos || ""}
                onChange={setField("apellidos")}
                className={`${inputCls} ${
                  fieldErrors.apellidos ? "border-rose-400 bg-rose-50/20" : ""
                }`}
                required
              />
              {fieldErrors.apellidos && (
                <p className="text-[11px] text-rose-500 mt-1">
                  {fieldErrors.apellidos}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Nueva contraseña (opcional)
            </label>
            <input
              type="password"
              value={form.clave || ""}
              onChange={setField("clave")}
              className={`${inputCls} ${
                fieldErrors.clave ? "border-rose-400 bg-rose-50/20" : ""
              }`}
              placeholder="Dejar en blanco para mantener la actual"
            />
            {fieldErrors.clave && (
              <p className="text-[11px] text-rose-500 mt-1">
                {fieldErrors.clave}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Estado de la membresía
            </label>
            <div className="flex gap-2">
              {(["ACTIVO", "INACTIVO"] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setForm((f) => ({ ...f, estado: s }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                    form.estado === s
                      ? s === "ACTIVO"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-slate-200 text-slate-400"
                  }`}
                >
                  {s === "ACTIVO" ? "Activo" : "Inactivo"}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex gap-2 justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-cyan-600/20"
            >
              {isSubmitting && (
                <Icon
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  className="w-3.5 h-3.5 animate-spin"
                />
              )}
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Tab: Usuarios (CRUD Real) ─────────────────────────────────────────────────

function TabUsuarios() {
  const [users, setUsers] = useState<ClinicUserDto[]>([])

  const [isLoading, setIsLoading] = useState(true)

  const [error, setError] = useState<string | null>(null)

  const [modal, setModal] = useState<"new" | "edit" | null>(null)

  const [editUser, setEditUser] = useState<ClinicUserDto | null>(null)

  const [filterRole, setFilterRole] = useState<ClinicRole | "ALL">("ALL")

  const [filterStatus, setFilterStatus] =
    useState<"ALL" | "ACTIVO" | "INACTIVO">("ALL")

  const [search, setSearch] = useState("")

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const [toast, setToast] = useState<{
    message: string
    type: "success" | "error"
  } | null>(null)

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type })

    setTimeout(() => setToast(null), 4000)
  }

  async function loadUsers() {
    setIsLoading(true)

    setError(null)

    try {
      const data = await fetchClinicUsers()

      setUsers(data)
    } catch (err: any) {
      console.error("Error al cargar cuentas de clínica:", err)

      setError(err.message || "Error al cargar los usuarios del consultorio")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function handleToggleStatus(u: ClinicUserDto) {
    const nextStatus = u.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO"

    const confirmText =
      nextStatus === "INACTIVO"
        ? `¿Desactivar la cuenta de ${u.nombreCompleto || u.nombres}? Su sesión activa será revocada de inmediato.`
        : `¿Reactivar la cuenta de ${u.nombreCompleto || u.nombres}?`

    if (!window.confirm(confirmText)) return

    setActionLoadingId(u.id)

    try {
      const updated = await updateClinicUserStatus(u.id, nextStatus)

      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? updated : item)),
      )

      showToast(
        nextStatus === "INACTIVO"
          ? `✓ Cuenta de ${updated.nombres} desactivada exitosamente.`
          : `✓ Cuenta de ${updated.nombres} activada exitosamente.`,
      )
    } catch (err: any) {
      showToast(err.message || "Error al cambiar estado de cuenta", "error")
    } finally {
      setActionLoadingId(null)
    }
  }

  const visible = users.filter((u) => {
    if (filterRole !== "ALL" && u.rol !== filterRole) return false

    if (filterStatus !== "ALL" && u.estado !== filterStatus) return false

    if (search) {
      const term = search.toLowerCase()

      const fullName = (
        u.nombreCompleto || `${u.nombres} ${u.apellidos}`
      ).toLowerCase()

      const email = u.correo.toLowerCase()

      if (!fullName.includes(term) && !email.includes(term)) return false
    }

    return true
  })

  return (
    <div className="space-y-4">
      {/* Toast banner */}
      {toast && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between border shadow-sm animate-in fade-in duration-200 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modals */}
      {modal === "new" && (
        <ModalCrearUsuario
          onClose={() => setModal(null)}
          onCreated={(created) => {
            setUsers((prev) => [created, ...prev])

            showToast(
              `✓ Cuenta de ${created.nombres} creada exitosamente con ID #${created.id}`,
            )
          }}
        />
      )}

      {modal === "edit" && editUser && (
        <ModalEditarUsuario
          user={editUser}
          onClose={() => {
            setModal(null)

            setEditUser(null)
          }}
          onUpdated={(updated) => {
            setUsers((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item)),
            )

            showToast(`✓ Datos de ${updated.nombres} actualizados exitosamente`)
          }}
        />
      )}

      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
          <div className="relative w-full">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            />
            <span className="absolute left-3 top-2.5 text-slate-400">
              <Icon
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                className="w-3.5 h-3.5"
              />
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Role filter */}
          <select
            value={filterRole}
            onChange={(e) =>
              setFilterRole(e.target.value as ClinicRole | "ALL")
            }
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none"
          >
            <option value="ALL">Todos los roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as "ALL" | "ACTIVO" | "INACTIVO")
            }
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none"
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>

          <button
            onClick={() => {
              setEditUser(null)

              setModal("new")
            }}
            className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-500 flex items-center gap-1.5 transition-colors shadow-sm shadow-cyan-600/20 cursor-pointer"
          >
            <Icon d="M12 4v16m8-8H4" className="w-3.5 h-3.5" />
            Nuevo usuario
          </button>
        </div>
      </div>

      {/* Users table / Loading / Error */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-3">
          <Icon
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            className="w-6 h-6 text-cyan-600 animate-spin mx-auto"
          />
          <p className="text-xs text-slate-500 font-medium">
            Cargando usuarios del sistema...
          </p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <p className="text-sm font-bold text-rose-800">
            Error al cargar cuentas del consultorio
          </p>
          <p className="text-xs text-rose-600">{error}</p>
          <button
            onClick={loadUsers}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-500 transition-colors"
          >
            Reintentar conexión
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-2">
          <Icon
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            className="w-8 h-8 text-slate-300 mx-auto"
          />
          <p className="text-sm font-semibold text-slate-700">
            No se encontraron usuarios
          </p>
          <p className="text-xs text-slate-400">
            Intenta cambiar los filtros de búsqueda o registra un nuevo usuario.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left bg-slate-50/50">
                {[
                  "Usuario / Nombre",
                  "Rol",
                  "Paciente Vinculado",
                  "Estado",
                  "ID Membresía",
                  "Acciones",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-xs font-semibold text-slate-400 px-4 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visible.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800 text-sm">
                      {u.nombreCompleto || `${u.nombres} ${u.apellidos}`}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      {u.correo}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${ROLE_COLORS[u.rol] || "bg-slate-100 text-slate-600"}`}
                    >
                      {ROLE_LABELS[u.rol] || u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {u.pacienteId ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full border border-cyan-200">
                        <span>👤</span> #{u.pacienteId}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        u.estado === "ACTIVO"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {u.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-400">
                    #{u.id}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditUser(u)

                          setModal("edit")
                        }}
                        className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold px-2 py-1 rounded-lg hover:bg-cyan-50 transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        disabled={actionLoadingId === u.id}
                        onClick={() => handleToggleStatus(u)}
                        className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                          u.estado === "ACTIVO"
                            ? "text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {actionLoadingId === u.id
                          ? "..."
                          : u.estado === "ACTIVO"
                            ? "Desactivar"
                            : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400">
        {visible.length} de {users.length} cuentas registradas en la clínica ·{" "}
        {users.filter((u) => u.estado === "ACTIVO").length} activas
      </p>
    </div>
  )
}

// ── Tab: Datos del Consultorio (Carga y Guardado Real V09) ────────────────────

function TabClinica() {
  const [clinic, setClinic] = useState<ClinicDto | null>(null)

  const [form, setForm] = useState<UpdateClinicDto>({
    nombre: "",

    razonSocial: "",

    ruc: "",

    telefono: "",

    correo: "",

    ciudad: "",

    direccion: "",

    zonaHoraria: "America/Lima",
  })

  const [isLoading, setIsLoading] = useState(true)

  const [isSaving, setIsSaving] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setIsLoading(true)

      setError(null)

      try {
        const data = await getClinicProfile()

        setClinic(data)

        setForm({
          nombre: data.nombre || "",

          razonSocial: data.razonSocial || "",

          ruc: data.ruc || "",

          telefono: data.telefono || "",

          correo: data.correo || "",

          ciudad: data.ciudad || "",

          direccion: data.direccion || "",

          zonaHoraria: data.zonaHoraria || "America/Lima",
        })
      } catch (err: any) {
        setError(err.message || "Error al cargar perfil de la clínica")
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const handleChange =
    (field: keyof UpdateClinicDto) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

      setError(null)

      setSuccess(null)
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSaving(true)

    setError(null)

    setSuccess(null)

    try {
      const updated = await updateClinicProfile(form)

      setClinic(updated)

      setSuccess("✓ Datos del consultorio actualizados con éxito.")
    } catch (err: any) {
      setError(err.message || "Error al guardar los datos del consultorio")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-2">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-medium">Cargando datos del consultorio...</p>
      </div>
    )
  }

  const inputCls =
    "w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">
          {success}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
          <div>
            <p
              className="font-bold text-slate-800 text-base"
              style={{ fontFamily: "Outfit" }}
            >
              Identificación del Consultorio
            </p>
            <p className="text-xs text-slate-400">
              Datos fiscales y de contacto que identifican a la clínica en todos
              los reportes y recetas
            </p>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
            Sede #{clinic?.id || "1"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Nombre comercial *
            </label>
            <input
              required
              value={form.nombre || ""}
              onChange={handleChange("nombre")}
              className={inputCls}
              placeholder="Ej. Clínica Dental Coronyx"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Razón social
            </label>
            <input
              value={form.razonSocial || ""}
              onChange={handleChange("razonSocial")}
              className={inputCls}
              placeholder="Ej. Servicios Odontológicos S.A.C."
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              RUC / NIT
            </label>
            <input
              value={form.ruc || ""}
              onChange={handleChange("ruc")}
              className={inputCls}
              placeholder="Ej. 20601234567"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Teléfono oficial
            </label>
            <input
              value={form.telefono || ""}
              onChange={handleChange("telefono")}
              className={inputCls}
              placeholder="Ej. +51 1 456 7890"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={form.correo || ""}
              onChange={handleChange("correo")}
              className={inputCls}
              placeholder="Ej. contacto@coronyx.pe"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Ciudad
            </label>
            <input
              value={form.ciudad || ""}
              onChange={handleChange("ciudad")}
              className={inputCls}
              placeholder="Ej. Lima, Perú"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Dirección física
            </label>
            <input
              value={form.direccion || ""}
              onChange={handleChange("direccion")}
              className={inputCls}
              placeholder="Ej. Av. Javier Prado Este 2465, San Borja"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? "Guardando en BD..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </form>
  )
}

// ── Tab: Horarios de Atención (Disponibilidad A09 / R05) ──────────────────────

const DIAS_SEMANA_MAP: Record<number, string> = {
  1: "Lunes",

  2: "Martes",

  3: "Miércoles",

  4: "Jueves",

  5: "Viernes",

  6: "Sábado",

  7: "Domingo",
}

function TabHorarios() {
  const [horarios, setHorarios] = useState<HorarioAtencionDto[]>([])

  const [isLoading, setIsLoading] = useState(true)

  const [isSaving, setIsSaving] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setIsLoading(true)

      setError(null)

      try {
        const data = await getClinicSchedule()

        // Asegurar que existan los 7 días

        const map = new Map<number, HorarioAtencionDto>()

        data.forEach((h) => map.set(h.diaSemana, h))

        const fullList: HorarioAtencionDto[] = []

        for (let d = 1; d <= 7; d++) {
          if (map.has(d)) {
            fullList.push(map.get(d)!)
          } else {
            fullList.push({
              diaSemana: d,

              horaApertura: d === 6 ? "08:00" : "08:00",

              horaCierre: d === 6 ? "13:00" : d === 7 ? "13:00" : "18:00",

              activo: d !== 7,

              duracionTurnoMinutos: 30,
            })
          }
        }

        setHorarios(fullList)
      } catch (err: any) {
        setError(err.message || "Error al cargar horarios de atención")
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const handleToggleDia = (diaSemana: number) => {
    setHorarios((prev) =>
      prev.map((h) =>
        h.diaSemana === diaSemana ? { ...h, activo: !h.activo } : h,
      ),
    )

    setError(null)

    setSuccess(null)
  }

  const handleChangeHora = (
    diaSemana: number,
    field: "horaApertura" | "horaCierre" | "duracionTurnoMinutos",
    val: any,
  ) => {
    setHorarios((prev) =>
      prev.map((h) => (h.diaSemana === diaSemana ? { ...h, [field]: val } : h)),
    )

    setError(null)

    setSuccess(null)
  }

  const handleSave = async () => {
    setIsSaving(true)

    setError(null)

    setSuccess(null)

    try {
      const updated = await updateClinicSchedule(horarios)

      setHorarios(updated)

      setSuccess(
        "✓ Horarios de atención actualizados con éxito. Los horarios de la agenda se han sincronizado.",
      )
    } catch (err: any) {
      setError(err.message || "Error al guardar configuración de horarios")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-2">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-medium">
          Cargando configuración de horarios de atención...
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-5">
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">
          {success}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-xs">
        <div className="border-b pb-3 border-slate-100 flex items-center justify-between">
          <div>
            <p
              className="font-bold text-slate-800 text-base"
              style={{ fontFamily: "Outfit" }}
            >
              Horarios Semanales y Disponibilidad Real
            </p>
            <p className="text-xs text-slate-400">
              Define la apertura y cierre de la clínica. Las citas fuera de este
              rango son rechazadas automáticamente.
            </p>
          </div>
          <button
            disabled={isSaving}
            onClick={handleSave}
            className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-500 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? "Guardando..." : "Guardar horarios"}
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {horarios.map((h) => {
            const diaNombre =
              DIAS_SEMANA_MAP[h.diaSemana] || `Día ${h.diaSemana}`

            const isActive = Boolean(h.activo)

            return (
              <div
                key={h.diaSemana}
                className="py-3 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 w-32">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => handleToggleDia(h.diaSemana)}
                    className="w-4 h-4 text-cyan-600 rounded cursor-pointer"
                  />
                  <span
                    className={`text-sm font-semibold ${
                      isActive
                        ? "text-slate-800"
                        : "text-slate-400 line-through"
                    }`}
                  >
                    {diaNombre}
                  </span>
                </div>

                {isActive ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">Desde:</span>
                      <input
                        type="time"
                        value={h.horaApertura}
                        onChange={(e) =>
                          handleChangeHora(
                            h.diaSemana,
                            "horaApertura",
                            e.target.value,
                          )
                        }
                        className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">Hasta:</span>
                      <input
                        type="time"
                        value={h.horaCierre}
                        onChange={(e) =>
                          handleChangeHora(
                            h.diaSemana,
                            "horaCierre",
                            e.target.value,
                          )
                        }
                        className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 ml-2">
                      <span className="text-xs text-slate-400">Turno:</span>
                      <select
                        value={h.duracionTurnoMinutos || 30}
                        onChange={(e) =>
                          handleChangeHora(
                            h.diaSemana,
                            "duracionTurnoMinutos",
                            parseInt(e.target.value, 10),
                          )
                        }
                        className="px-2 py-1 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value={15}>15m</option>
                        <option value={30}>30m</option>
                        <option value={45}>45m</option>
                        <option value={60}>60m</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Cerrado (Día no laborable)
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Tab: Integraciones Externas (Sin Mocks Ni Conexiones Ficticias V09) ────────

function TabIntegraciones() {
  const integraciones = [
    {
      name: "WhatsApp Business API",

      desc: "Envío transaccional directo de recordatorios al número registrado del paciente",

      estado: "No configurado",
    },

    {
      name: "SUNAT Facturación Electrónica",

      desc: "Emisión de comprobantes tributarios (Boletas y Facturas electrónicas)",

      estado: "No configurado",
    },

    {
      name: "Google Calendar Sync",

      desc: "Sincronización con calendarios personales del odontólogo",

      estado: "No configurado",
    },

    {
      name: "WebRTC Teleodontología",

      desc: "Servidor TURN/STUN para videoconsultas encriptadas de baja latencia",

      estado: "No configurado",
    },
  ]

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 leading-relaxed">
        <p className="font-semibold text-slate-800 mb-1">
          Estado de integraciones de terceros:
        </p>
        Los proveedores externos no están enlazados a credenciales en este
        incremento. El sistema no simula estados "Conectado" ficticios y
        preserva la integridad del núcleo operativo.
      </div>

      <div className="space-y-3">
        {integraciones.map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-4 bg-white rounded-2xl border border-slate-100 p-4 shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-bold shrink-0">
              {item.name.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-700 text-sm truncate">
                {item.name}
              </p>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 shrink-0">
              {item.estado}
            </span>
            <button
              onClick={() =>
                alert(
                  `El proveedor ${item.name} requiere configuración de claves de API en una fase posterior.`,
                )
              }
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
            >
              Configurar
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main: Consultorio ─────────────────────────────────────────────────────────

type ConsultTab = "usuarios" | "clinica" | "horarios" | "integraciones"

export default function Consultorio() {
  const [tab, setTab] = useState<ConsultTab>("usuarios")

  const tabs: { id: ConsultTab ;label: string }[] = [
    { id: "usuarios", label: "Usuarios y roles" },

    { id: "clinica", label: "Datos del consultorio" },

    { id: "horarios", label: "Horarios de atención" },

    { id: "integraciones", label: "Integraciones" },
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Sub-nav */}
      <div className="bg-white border-b border-slate-100 px-5 flex gap-1 shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              tab === t.id
                ? "border-cyan-500 text-cyan-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {tab === "usuarios" && <TabUsuarios />}
        {tab === "clinica" && <TabClinica />}
        {tab === "horarios" && (
          <>
            <TabHorarios />
            <DoctorAbsences />
          </>
        )}
        {tab === "integraciones" && <TabIntegraciones />}
      </div>
    </div>
  )
}
