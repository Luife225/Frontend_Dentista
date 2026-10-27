import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { API_BASE_URL } from "../services/apiClient"

// ── Tipos de Datos Oficiales ITIL y Matriz de Riesgo ─────────────────────────
export type PrioridadNivel = "CRÍTICO" | "ALTO" | "MEDIO" | "BAJO"
export type EstadoTicket = "PENDIENTE" | "EN_PROCESO" | "ATENDIDO" | "CANCELADO"
export type AccionBitacora = "CREACION" | "INICIO_ATENCION" | "RESOLUCION" | "CANCELACION"

export interface BitacoraEntry {
  id: number
  ticketId: string
  fechaHora: string
  estadoAnterior: EstadoTicket | null
  estadoNuevo: EstadoTicket
  usuarioNombre: string
  usuarioRol: string
  accion: AccionBitacora
  comentario: string
}

export interface TicketItem {
  id: string
  catalogoId?: string
  codigoCatalogo?: string
  solicitud: string
  solicitante: string
  solicitanteRol?: string
  solicitanteId?: number
  solicitanteCorreo?: string
  responsable: string
  responsableRol?: string
  impacto: number // 1: Bajo, 2: Medio, 3: Alto
  probabilidad: number // 1: Baja, 2: Media, 3: Alta
  prioridad: PrioridadNivel
  estado: EstadoTicket
  tiempoTranscurrido: string
  tipoItil: "Información" | "Acceso" | "Asistencia" | "Incidencia"
  slaMinutos?: number
  evidencia?: string
  fechaRegistro: string
  fechaCierre?: string
  descripcionDetallada?: string
  archivoAdjuntoUrl?: string
  citaId?: number
  pacienteId?: number
  rutaAccion?: string
  accionLabel?: string
  bitacora?: BitacoraEntry[]
}

export interface CatalogPreset {
  codigo: string
  solicitanteRol: "PACIENTE" | "ODONTOLOGO" | "RECEPCIONISTA" | "ADMIN_CLINICA" | "SUPER_ADMIN" | "TODOS"
  solicitud: string
  descripcion: string
  tipoItil: "Información" | "Acceso" | "Asistencia" | "Incidencia"
  impacto: 1 | 2 | 3
  probabilidad: 1 | 2 | 3
  prioridad: PrioridadNivel
  responsable: "Soporte Técnico TI" | "Admin Clínica" | "Recepcionista" | "Odontólogo"
  responsableRol: "SOPORTE_TECNICO" | "ADMIN_CLINICA" | "RECEPCIONISTA" | "ODONTOLOGO"
  slaMinutos: number
  rutaAccion?: string
  accionLabel?: string
  justificacionMatriz: string
}

// ── Catálogo Oficial Segmentado por Rol con Matriz 3x3 ───────────────────────
const OFFICIAL_CATALOG: CatalogPreset[] = [
  // ── PACIENTE
  {
    codigo: "INC-PAC-001",
    solicitanteRol: "PACIENTE",
    solicitud: "Reprogramación urgente de cita odontológica (falta < 2 horas)",
    descripcion: "El paciente solicita cambio de horario de emergencia y no puede esperar a su turno asignado.",
    tipoItil: "Asistencia",
    impacto: 3,
    probabilidad: 2,
    prioridad: "ALTO",
    responsable: "Recepcionista",
    responsableRol: "RECEPCIONISTA",
    slaMinutos: 20,
    rutaAccion: "/app/agenda",
    accionLabel: "📅 Ir a Cita en Agenda",
    justificacionMatriz: "Impacto Alto (3) × Probabilidad Media (2) = Score 6 → ALTO. Pérdida inminente de turno clínico.",
  },
  {
    codigo: "INC-PAC-002",
    solicitanteRol: "PACIENTE",
    solicitud: "Corrección de DNI o Nombre por error de digitación en admisión",
    descripcion: "El paciente detecta que sus datos de identidad fueron mal ingresados en la historia clínica.",
    tipoItil: "Asistencia",
    impacto: 2,
    probabilidad: 2,
    prioridad: "MEDIO",
    responsable: "Admin Clínica",
    responsableRol: "ADMIN_CLINICA",
    slaMinutos: 60,
    rutaAccion: "/app/pacientes",
    accionLabel: "👤 Ir a Ficha Paciente",
    justificacionMatriz: "Impacto Medio (2) × Probabilidad Media (2) = Score 4 → MEDIO. Afecta facturación pero no suspende consulta.",
  },
  {
    codigo: "INC-PAC-003",
    solicitanteRol: "PACIENTE",
    solicitud: "Radiografía o receta médica no visible en portal del paciente",
    descripcion: "El paciente tuvo consulta pero los archivos adjuntos permanecen ocultos o no cargan.",
    tipoItil: "Incidencia",
    impacto: 2,
    probabilidad: 2,
    prioridad: "MEDIO",
    responsable: "Odontólogo",
    responsableRol: "ODONTOLOGO",
    slaMinutos: 30,
    rutaAccion: "/app/pacientes",
    accionLabel: "📁 Ver Adjuntos Médicos",
    justificacionMatriz: "Impacto Medio (2) × Probabilidad Media (2) = Score 4 → MEDIO. Requiere activar interruptor esVisible.",
  },
  {
    codigo: "INC-PAC-004",
    solicitanteRol: "PACIENTE",
    solicitud: "Falla de conexión, video o audio en sala de Teleodontología",
    descripcion: "No se establece enlace WebRTC o token Jitsi en sesión en vivo remota.",
    tipoItil: "Incidencia",
    impacto: 3,
    probabilidad: 3,
    prioridad: "CRÍTICO",
    responsable: "Soporte Técnico TI",
    responsableRol: "SOPORTE_TECNICO",
    slaMinutos: 10,
    rutaAccion: "/app/teleodontologia",
    accionLabel: "📹 Ir a Sala Virtual",
    justificacionMatriz: "Impacto Alto (3) × Probabilidad Alta (3) = Score 9 → CRÍTICO (Caso Aula Cerrada). Paraliza la consulta en vivo.",
  },
  {
    codigo: "INC-PAC-005",
    solicitanteRol: "PACIENTE",
    solicitud: "Consulta sobre horarios de atención de fin de semana o precios",
    descripcion: "Consulta informativa previa sobre turnos disponibles y aranceles de sede.",
    tipoItil: "Información",
    impacto: 1,
    probabilidad: 2,
    prioridad: "BAJO",
    responsable: "Recepcionista",
    responsableRol: "RECEPCIONISTA",
    slaMinutos: 120,
    rutaAccion: "/app/agenda",
    accionLabel: "ℹ️ Ver Horarios de Sede",
    justificacionMatriz: "Impacto Bajo (1) × Probabilidad Media (2) = Score 2 → BAJO. No bloquea operaciones ni consultas activas.",
  },

  // ── ODONTÓLOGO
  {
    codigo: "INC-ODO-001",
    solicitanteRol: "ODONTOLOGO",
    solicitud: "Reasignación urgente de Sillón dental por retraso en cirugía previa",
    descripcion: "Procedimiento de extracción se extiende y el siguiente paciente ya se encuentra en sala.",
    tipoItil: "Incidencia",
    impacto: 2,
    probabilidad: 3,
    prioridad: "ALTO",
    responsable: "Recepcionista",
    responsableRol: "RECEPCIONISTA",
    slaMinutos: 15,
    rutaAccion: "/app/agenda",
    accionLabel: "📅 Reubicar Sillón en Agenda",
    justificacionMatriz: "Impacto Medio (2) × Probabilidad Alta (3) = Score 6 → ALTO. Evita colisión física de pacientes en consultorio.",
  },
  {
    codigo: "INC-ODO-002",
    solicitanteRol: "ODONTOLOGO",
    solicitud: "Error 413 al cargar archivo binario pesado de radiografía (> 25MB)",
    descripcion: "La imagen panorámica supera el umbral estándar configurado en el servidor.",
    tipoItil: "Incidencia",
    impacto: 2,
    probabilidad: 2,
    prioridad: "MEDIO",
    responsable: "Soporte Técnico TI",
    responsableRol: "SOPORTE_TECNICO",
    slaMinutos: 30,
    rutaAccion: "/app/pacientes",
    accionLabel: "📁 Subida Manual",
    justificacionMatriz: "Impacto Medio (2) × Probabilidad Media (2) = Score 4 → MEDIO. Requiere ampliación de límite de carga en Railway.",
  },
  {
    codigo: "INC-ODO-003",
    solicitanteRol: "ODONTOLOGO",
    solicitud: "Solicitud de adenda médica en historia clínica cerrada por auditoría",
    descripcion: "Necesidad de incorporar observación diagnóstica complementaria posterior al cierre.",
    tipoItil: "Asistencia",
    impacto: 1,
    probabilidad: 2,
    prioridad: "BAJO",
    responsable: "Admin Clínica",
    responsableRol: "ADMIN_CLINICA",
    slaMinutos: 120,
    rutaAccion: "/app/pacientes",
    accionLabel: "🦷 Ver Historia Clínica",
    justificacionMatriz: "Impacto Bajo (1) × Probabilidad Media (2) = Score 2 → BAJO. Procedimiento administrativo diferible.",
  },
  {
    codigo: "INC-ODO-004",
    solicitanteRol: "ODONTOLOGO",
    solicitud: "Capacitación técnica en llenado de historia clínica y odontograma digital",
    descripcion: "Inducción para nuevos especialistas en el software odontológico.",
    tipoItil: "Información",
    impacto: 2,
    probabilidad: 1,
    prioridad: "BAJO",
    responsable: "Soporte Técnico TI",
    responsableRol: "SOPORTE_TECNICO",
    slaMinutos: 1440,
    rutaAccion: "/app/pacientes",
    accionLabel: "🦷 Ver Odontograma",
    justificacionMatriz: "Impacto Medio (2) × Probabilidad Baja (1) = Score 2 → BAJO. Coordinación formativa programable.",
  },

  // ── RECEPCIONISTA
  {
    codigo: "INC-REC-001",
    solicitanteRol: "RECEPCIONISTA",
    solicitud: "Liberación de turno y sillón por inasistencia física (Paciente No-Show)",
    descripcion: "Paciente no se presentó transcurridos los 15 min de tolerancia reglamentaria.",
    tipoItil: "Incidencia",
    impacto: 3,
    probabilidad: 2,
    prioridad: "ALTO",
    responsable: "Recepcionista",
    responsableRol: "RECEPCIONISTA",
    slaMinutos: 15,
    rutaAccion: "/app/agenda",
    accionLabel: "📅 Gestionar No-Show",
    justificacionMatriz: "Impacto Alto (3) × Probabilidad Media (2) = Score 6 → ALTO. Permite asignar el sillón a un paciente en espera.",
  },
  {
    codigo: "INC-REC-002",
    solicitanteRol: "RECEPCIONISTA",
    solicitud: "Solicitud de turno de paciente fuera del horario laboral de la sede",
    descripcion: "Paciente solicita atención fuera de turno o en feriado; requiere autorización de gerencia.",
    tipoItil: "Información",
    impacto: 1,
    probabilidad: 2,
    prioridad: "BAJO",
    responsable: "Admin Clínica",
    responsableRol: "ADMIN_CLINICA",
    slaMinutos: 120,
    rutaAccion: "/app/agenda",
    accionLabel: "⚙️ Ver Franja Laboral",
    justificacionMatriz: "Impacto Bajo (1) × Probabilidad Media (2) = Score 2 → BAJO. Consulta de políticas internas.",
  },

  // ── ADMIN CLÍNICA
  {
    codigo: "INC-ADM-001",
    solicitanteRol: "ADMIN_CLINICA",
    solicitud: "Bloqueo urgente de credenciales por desvinculación laboral de personal",
    descripcion: "Cese de contrato de colaborador con acceso a historias y datos sensibles.",
    tipoItil: "Incidencia",
    impacto: 3,
    probabilidad: 2,
    prioridad: "ALTO",
    responsable: "Admin Clínica",
    responsableRol: "ADMIN_CLINICA",
    slaMinutos: 15,
    rutaAccion: "/app/consultorio",
    accionLabel: "👥 Desactivar Credenciales",
    justificacionMatriz: "Impacto Alto (3) × Probabilidad Media (2) = Score 6 → ALTO. Riesgo crítico de seguridad de datos de salud.",
  },
  {
    codigo: "INC-ADM-002",
    solicitanteRol: "ADMIN_CLINICA",
    solicitud: "Caída de base de datos o error 500 en servicios de Railway Cloud",
    descripcion: "Indisponibilidad del backend o lentitud generalizada en consultas de sede.",
    tipoItil: "Incidencia",
    impacto: 3,
    probabilidad: 3,
    prioridad: "CRÍTICO",
    responsable: "Soporte Técnico TI",
    responsableRol: "SOPORTE_TECNICO",
    slaMinutos: 10,
    rutaAccion: "/app/super-admin",
    accionLabel: "🖥️ Monitoreo Railway",
    justificacionMatriz: "Impacto Alto (3) × Probabilidad Alta (3) = Score 9 → CRÍTICO. Colapso operacional total de la clínica.",
  },

  // ── CASO GENERAL / OTROS
  {
    codigo: "INC-GEN-099",
    solicitanteRol: "TODOS",
    solicitud: "Otros requerimientos o fallas no contempladas en el catálogo (Con Captura)",
    descripcion: "Caja de texto libre para detallar el problema y adjuntar captura de evidencia fotográfica.",
    tipoItil: "Asistencia",
    impacto: 2,
    probabilidad: 2,
    prioridad: "MEDIO",
    responsable: "Admin Clínica",
    responsableRol: "ADMIN_CLINICA",
    slaMinutos: 60,
    justificacionMatriz: "Evaluación dinámica según Impacto y Probabilidad seleccionados por el operador.",
  },
]

// ── Lista Inicial de Tickets (Limpia para pruebas con datos 100% reales) ──
const INITIAL_TICKETS: TicketItem[] = []

const HELPDESK_STORAGE_KEY = "coronyx_helpdesk_tickets"
const HELPDESK_CHANNEL_NAME = "coronyx_helpdesk_channel"
const HELPDESK_API_URL = `${API_BASE_URL}/helpdesk/tickets`

// Función para calcular la prioridad a partir de la fórmula Matriz 3x3
export function calcularPrioridadMatriz(impacto: number, probabilidad: number): PrioridadNivel {
  const score = impacto * probabilidad
  if (score >= 9) return "CRÍTICO" // 3 x 3
  if (score >= 6) return "ALTO"    // 3 x 2 o 2 x 3
  if (score >= 3) return "MEDIO"   // 2 x 2, 3 x 1, o 1 x 3
  return "BAJO"                    // 1 x 1 o 1 x 2
}

function getLatestStoredTickets(): TicketItem[] {
  try {
    const raw = localStorage.getItem(HELPDESK_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch (err) {
    console.warn("[Helpdesk] Error al leer tickets de localStorage:", err)
  }
  return INITIAL_TICKETS
}

function saveAndBroadcastTickets(updated: TicketItem[]) {
  try {
    localStorage.setItem(HELPDESK_STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.warn("[Helpdesk] Error guardando tickets en localStorage:", err)
  }

  // Notificación instantánea entre ventanas/pestañas vía BroadcastChannel
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(HELPDESK_CHANNEL_NAME)
      bc.postMessage({ type: "SYNC_TICKETS", tickets: updated, timestamp: Date.now() })
      bc.close()
    }
  } catch {}

  // Disparar evento DOM local
  window.dispatchEvent(new CustomEvent("coronyx:helpdesk-updated", { detail: updated }))
}

export default function MesaAyuda() {
  const { role, user } = useAuth()
  const navigate = useNavigate()

  // Rol operativo de sesión activa real
  const effectiveRole = role || "PACIENTE"

  const isPaciente = effectiveRole === "PACIENTE"
  const isRecepcionista = effectiveRole === "RECEPCIONISTA"
  const isOdontologo = effectiveRole === "ODONTOLOGO"
  const isAdminOrSupport = effectiveRole === "ADMIN_CLINICA" || effectiveRole === "SUPER_ADMIN"

  // Mapeo amigable de rol
  const userRoleLabel = useMemo(() => {
    switch (effectiveRole) {
      case "SUPER_ADMIN":
        return "Soporte Técnico TI"
      case "ADMIN_CLINICA":
        return "Admin Clínica"
      case "RECEPCIONISTA":
        return "Recepcionista"
      case "ODONTOLOGO":
        return "Odontólogo"
      case "PACIENTE":
        return "Paciente"
      default:
        return "Paciente"
    }
  }, [effectiveRole])

  // Normalización de rol de sistema para filtrado de catálogo
  const normalizedRole = useMemo(() => {
    if (effectiveRole === "SUPER_ADMIN") return "SUPER_ADMIN"
    if (effectiveRole === "ADMIN_CLINICA") return "ADMIN_CLINICA"
    if (effectiveRole === "RECEPCIONISTA") return "RECEPCIONISTA"
    if (effectiveRole === "ODONTOLOGO") return "ODONTOLOGO"
    return "PACIENTE"
  }, [effectiveRole])

  // Lista viva de tickets
  const [tickets, setTickets] = useState<TicketItem[]>(() => getLatestStoredTickets())

  // Pestañas principales
  const [activeTab, setActiveTab] = useState<"tablero" | "nueva" | "matriz">("tablero")

  // Si cambia a paciente y estaba en matriz, volver a tablero
  useEffect(() => {
    if (isPaciente && activeTab === "matriz") {
      setActiveTab("tablero")
    }
  }, [isPaciente, activeTab])

  // Filtros del tablero
  const [filterEstado, setFilterEstado] = useState<string>("TODOS")
  const [filterPrioridad, setFilterPrioridad] = useState<string>("TODAS")
  const [onlyMyRole, setOnlyMyRole] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [sortMode, setSortMode] = useState<"prioridad" | "fifo">("prioridad")

  // Catálogo segmentado visible en formulario
  const [showAllCatalogRoles, setShowAllCatalogRoles] = useState<boolean>(false)
  const availableCatalog = useMemo(() => {
    if (showAllCatalogRoles || effectiveRole === "SUPER_ADMIN" || effectiveRole === "ADMIN_CLINICA") {
      return OFFICIAL_CATALOG
    }
    return OFFICIAL_CATALOG.filter(
      (c) => c.solicitanteRol === normalizedRole || c.solicitanteRol === "TODOS"
    )
  }, [showAllCatalogRoles, effectiveRole, normalizedRole])

  // Formulario de nueva solicitud
  const [selectedCatalogCode, setSelectedCatalogCode] = useState<string>(availableCatalog[0]?.codigo || "INC-PAC-001")

  // Actualizar ítem seleccionado cuando cambia de rol
  useEffect(() => {
    if (availableCatalog.length > 0) {
      setSelectedCatalogCode(availableCatalog[0].codigo)
    }
  }, [effectiveRole, availableCatalog])
  const [customDescription, setCustomDescription] = useState<string>("")
  const [customImpacto, setCustomImpacto] = useState<1 | 2 | 3>(2)
  const [customProbabilidad, setCustomProbabilidad] = useState<1 | 2 | 3>(2)
  const [customAdjuntoUrl, setCustomAdjuntoUrl] = useState<string>("")
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null)

  // Modales
  const [resolvingTicket, setResolvingTicket] = useState<TicketItem | null>(null)
  const [evidenceInput, setEvidenceInput] = useState<string>("")
  const [cancellingTicket, setCancellingTicket] = useState<TicketItem | null>(null)
  const [cancelReasonInput, setCancelReasonInput] = useState<string>("")
  const [bitacoraModalTicket, setBitacoraModalTicket] = useState<TicketItem | null>(null)

  // Obtener ítem de catálogo activo
  const activeCatalogItem = useMemo(() => {
    return availableCatalog.find((c) => c.codigo === selectedCatalogCode) || availableCatalog[0] || OFFICIAL_CATALOG[0]
  }, [availableCatalog, selectedCatalogCode])

  const isCustomOther = activeCatalogItem.codigo === "INC-GEN-099"

  // Prioridad calculada para el formulario (Automatizada por Matriz 3x3)
  const formCalculatedPriority = useMemo(() => {
    if (isCustomOther) {
      return calcularPrioridadMatriz(customImpacto, customProbabilidad)
    }
    return activeCatalogItem.prioridad
  }, [isCustomOther, customImpacto, customProbabilidad, activeCatalogItem])

  // Sincronización en tiempo real multiventana + Backend
  useEffect(() => {
    const fetchBackendTickets = async () => {
      try {
        const res = await fetch(HELPDESK_API_URL)
        if (res.ok) {
          const data: TicketItem[] = await res.json()
          if (Array.isArray(data)) {
            if (data.length === 0) {
              setTickets([])
              try {
                localStorage.setItem(HELPDESK_STORAGE_KEY, JSON.stringify([]))
              } catch {}
              return
            }

            setTickets((prev) => {
              const prevMap = new Map(prev.map((t) => [t.id, t]))
              const merged: TicketItem[] = data.map((bTicket) => {
                const local = prevMap.get(bTicket.id)
                return {
                  ...bTicket,
                  bitacora: local?.bitacora && local.bitacora.length > 0 ? local.bitacora : bTicket.bitacora,
                  citaId: bTicket.citaId ?? local?.citaId,
                  pacienteId: bTicket.pacienteId ?? local?.pacienteId,
                  rutaAccion: bTicket.rutaAccion ?? local?.rutaAccion,
                  accionLabel: bTicket.accionLabel ?? local?.accionLabel,
                }
              })

              try {
                localStorage.setItem(HELPDESK_STORAGE_KEY, JSON.stringify(merged))
              } catch {}
              return merged
            })
          }
        }
      } catch {
        // Fallback a localStorage si el backend no responde
      }
    }

    fetchBackendTickets()
    const backendInterval = setInterval(fetchBackendTickets, 1500)

    let bc: BroadcastChannel | null = null
    try {
      if (typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel(HELPDESK_CHANNEL_NAME)
        bc.onmessage = (event) => {
          if (event.data?.type === "SYNC_TICKETS" && Array.isArray(event.data.tickets)) {
            setTickets(event.data.tickets)
          }
        }
      }
    } catch {}

    const handleStorage = (event: StorageEvent) => {
      if (event.key === HELPDESK_STORAGE_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue)
          if (Array.isArray(parsed)) setTickets(parsed)
        } catch {}
      }
    }
    window.addEventListener("storage", handleStorage)

    const handleLocalUpdate = (e: any) => {
      if (Array.isArray(e.detail)) setTickets(e.detail)
    }
    window.addEventListener("coronyx:helpdesk-updated", handleLocalUpdate)

    return () => {
      clearInterval(backendInterval)
      if (bc) bc.close()
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("coronyx:helpdesk-updated", handleLocalUpdate)
    }
  }, [])

  // Filtrado y ordenamiento de tickets según el rol activo
  const filteredTickets = useMemo(() => {
    let result = tickets.filter((t) => {
      // 1. Si es Paciente: únicamente ve sus propias solicitudes reales
      if (isPaciente) {
        const isMyTicket =
          (user?.id && t.solicitanteId === Number(user.id)) ||
          (user?.pacienteId && t.pacienteId === Number(user.pacienteId)) ||
          (user?.correo && t.solicitanteCorreo?.toLowerCase() === user.correo.toLowerCase()) ||
          (user?.nombreCompleto && t.solicitante.toLowerCase() === user.nombreCompleto.toLowerCase())
        if (!isMyTicket) return false
      }

      // 2. Si es Recepcionista: ve EXCLUSIVAMENTE los tickets correspondientes a su rol
      if (isRecepcionista) {
        const isForRecepcionista =
          t.responsableRol === "RECEPCIONISTA" ||
          t.responsable === "Recepcionista" ||
          t.solicitanteRol === "RECEPCIONISTA"
        if (!isForRecepcionista) return false
      }

      // 3. Si es Odontólogo: ve EXCLUSIVAMENTE los tickets correspondientes a su rol
      if (isOdontologo) {
        const isForOdontologo =
          t.responsableRol === "ODONTOLOGO" ||
          t.responsable === "Odontólogo" ||
          t.solicitanteRol === "ODONTOLOGO"
        if (!isForOdontologo) return false
      }

      // 4. Si es Administrador / Soporte TI: ve todo por defecto (Gobernanza clínica ITIL general),
      // pero si activa el botón "Ver solo Asignados a mi rol", filtra solo sus tareas
      if (isAdminOrSupport && onlyMyRole) {
        const isMyTask =
          t.responsableRol === effectiveRole ||
          (effectiveRole === "SUPER_ADMIN" && t.responsableRol === "SOPORTE_TECNICO") ||
          t.responsable === userRoleLabel ||
          t.responsable === "Soporte Técnico TI" ||
          t.solicitanteRol === effectiveRole
        if (!isMyTask) return false
      }

      // 5. Filtros de Estado y Prioridad
      if (filterEstado !== "TODOS" && t.estado !== filterEstado) return false
      if (filterPrioridad !== "TODAS" && t.prioridad !== filterPrioridad) return false

      // 4. Búsqueda en vivo
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const match =
          t.id.toLowerCase().includes(query) ||
          t.solicitud.toLowerCase().includes(query) ||
          t.solicitante.toLowerCase().includes(query) ||
          t.responsable.toLowerCase().includes(query) ||
          (t.evidencia && t.evidencia.toLowerCase().includes(query))
        if (!match) return false
      }
      return true
    })

    // Algoritmo de Triaje ITIL (Puntuación de Riesgo Matriz 3x3) vs FIFO
    if (sortMode === "prioridad") {
      const priorityWeight = (prio: string) => {
        switch (prio.toUpperCase()) {
          case "CRÍTICO":
          case "CRITICO":
            return 4
          case "ALTO":
            return 3
          case "MEDIO":
            return 2
          default:
            return 1 // BAJO
        }
      }
      result.sort((a, b) => {
        const wA = priorityWeight(a.prioridad)
        const wB = priorityWeight(b.prioridad)
        if (wA !== wB) return wB - wA // Mayor riesgo primero
        return b.fechaRegistro.localeCompare(a.fechaRegistro)
      })
    } else {
      // FIFO: Orden cronológico de llegada
      result.sort((a, b) => a.fechaRegistro.localeCompare(b.fechaRegistro))
    }

    return result
  }, [
    tickets,
    filterEstado,
    filterPrioridad,
    onlyMyRole,
    userRoleLabel,
    searchQuery,
    sortMode,
    isPaciente,
    isRecepcionista,
    isOdontologo,
  ])

  // KPIs segmentados para Paciente
  const pacienteStats = useMemo(() => {
    const mis = tickets.filter(
      (t) => t.solicitante.toLowerCase().includes("paciente") || t.solicitanteRol === "PACIENTE"
    )
    const pendientes = mis.filter((t) => t.estado === "PENDIENTE").length
    const enProceso = mis.filter((t) => t.estado === "EN_PROCESO").length
    const atendidos = mis.filter((t) => t.estado === "ATENDIDO").length
    return {
      total: mis.length,
      enRevision: pendientes + enProceso,
      solucionados: atendidos,
    }
  }, [tickets])

  // KPIs segmentados para Recepcionista
  const recepcionistaStats = useMemo(() => {
    const asignados = tickets.filter(
      (t) => t.responsableRol === "RECEPCIONISTA" || t.responsable === "Recepcionista"
    )
    const pendientes = asignados.filter((t) => t.estado === "PENDIENTE").length
    const urgentes = asignados.filter(
      (t) =>
        (t.prioridad === "CRÍTICO" || t.prioridad === "ALTO") &&
        (t.estado === "PENDIENTE" || t.estado === "EN_PROCESO")
    ).length
    const atendidos = asignados.filter((t) => t.estado === "ATENDIDO").length
    return { asignados: asignados.length, pendientes, urgentes, atendidos }
  }, [tickets])

  // KPIs segmentados para Odontólogo
  const odontologoStats = useMemo(() => {
    const mios = tickets.filter(
      (t) => t.solicitanteRol === "ODONTOLOGO" || t.responsableRol === "ODONTOLOGO"
    )
    const pendientes = mios.filter((t) => t.estado === "PENDIENTE" || t.estado === "EN_PROCESO").length
    const resueltos = mios.filter((t) => t.estado === "ATENDIDO").length
    return { total: mios.length, pendientes, resueltos }
  }, [tickets])

  // KPIs oficiales ITIL (Para Administrador / Soporte TI)
  const stats = useMemo(() => {
    const total = tickets.length
    const pendientes = tickets.filter((t) => t.estado === "PENDIENTE").length
    const enProceso = tickets.filter((t) => t.estado === "EN_PROCESO").length
    const atendidos = tickets.filter((t) => t.estado === "ATENDIDO").length
    const cancelados = tickets.filter((t) => t.estado === "CANCELADO").length
    const criticosActivos = tickets.filter(
      (t) => (t.prioridad === "CRÍTICO" || (t.prioridad as string) === "CRITICO") && (t.estado === "PENDIENTE" || t.estado === "EN_PROCESO")
    ).length
    const cumplimientoSLA = total > 0 ? Math.round((atendidos / total) * 100) : 100
    return { total, pendientes, enProceso, atendidos, cancelados, criticosActivos, cumplimientoSLA }
  }, [tickets])

  // Crear Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()

    const finalSolicitud = isCustomOther
      ? customDescription.trim() || "Solicitud personalizada no especificada"
      : activeCatalogItem.solicitud

    const now = new Date()
    const timestampStr = now.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })

    const payload: Partial<TicketItem> = {
      catalogoId: activeCatalogItem.codigo,
      codigoCatalogo: activeCatalogItem.codigo,
      solicitud: finalSolicitud,
      solicitante: user?.nombreCompleto || userRoleLabel,
      solicitanteRol: normalizedRole,
      solicitanteId: user?.id ? Number(user.id) : undefined,
      solicitanteCorreo: user?.correo || undefined,
      pacienteId: user?.pacienteId ? Number(user.pacienteId) : undefined,
      responsable: activeCatalogItem.responsable,
      responsableRol: activeCatalogItem.responsableRol,
      impacto: isCustomOther ? customImpacto : activeCatalogItem.impacto,
      probabilidad: isCustomOther ? customProbabilidad : activeCatalogItem.probabilidad,
      prioridad: formCalculatedPriority,
      estado: "PENDIENTE",
      tiempoTranscurrido: "1 min",
      tipoItil: activeCatalogItem.tipoItil,
      slaMinutos: activeCatalogItem.slaMinutos,
      fechaRegistro: timestampStr,
      descripcionDetallada: isCustomOther ? customDescription : undefined,
      archivoAdjuntoUrl: isCustomOther && customAdjuntoUrl ? customAdjuntoUrl : undefined,
      rutaAccion: activeCatalogItem.rutaAccion,
      accionLabel: activeCatalogItem.accionLabel,
    }

    let createdTicket: TicketItem | null = null

    try {
      const res = await fetch(HELPDESK_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        createdTicket = await res.json()
      }
    } catch (err) {
      console.warn("[Helpdesk] Backend offline al crear ticket:", err)
    }

    const currentList = getLatestStoredTickets()

    if (!createdTicket) {
      // Fallback offline si el backend no responde
      const maxNumber = currentList.reduce((max, t) => {
        const match = t.id.match(/\d+/)
        const num = match ? parseInt(match[0], 10) : 0
        return Math.max(max, num)
      }, 0)
      const offlineId = `TKT-${String(maxNumber + 1).padStart(3, "0")}`
      createdTicket = {
        ...(payload as TicketItem),
        id: offlineId,
        bitacora: [
          {
            id: Date.now(),
            ticketId: offlineId,
            fechaHora: timestampStr,
            estadoAnterior: null,
            estadoNuevo: "PENDIENTE",
            usuarioNombre: user?.nombreCompleto || userRoleLabel,
            usuarioRol: userRoleLabel,
            accion: "CREACION",
            comentario: isCustomOther ? customDescription : `Ticket creado desde catálogo con prioridad ${formCalculatedPriority}.`,
          },
        ],
      }
    }

    const updated = [createdTicket, ...currentList.filter((t) => t.id !== createdTicket!.id)]
    setTickets(updated)
    saveAndBroadcastTickets(updated)

    setCustomDescription("")
    setCustomAdjuntoUrl("")
    setActiveTab("tablero")
    setNotificationMsg(
      `✅ Ticket ${createdTicket.id} generado con éxito. Prioridad asignada por Matriz 3x3: [${createdTicket.prioridad}] → Derivado a ${createdTicket.responsable}.`
    )
    setTimeout(() => setNotificationMsg(null), 6000)
  }

  // Transición: Pasa a EN_PROCESO
  const handleStartAttention = (ticket: TicketItem) => {
    const currentList = getLatestStoredTickets()
    const timestampStr = new Date().toLocaleDateString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })

    const newBitacoraEntry: BitacoraEntry = {
      id: Date.now(),
      ticketId: ticket.id,
      fechaHora: timestampStr,
      estadoAnterior: ticket.estado,
      estadoNuevo: "EN_PROCESO",
      usuarioNombre: user?.nombreCompleto || userRoleLabel,
      usuarioRol: userRoleLabel,
      accion: "INICIO_ATENCION",
      comentario: `El operador ${userRoleLabel} ha tomado el ticket y comenzó las acciones de resolución.`,
    }

    const updated = currentList.map((t) =>
      t.id === ticket.id
        ? {
            ...t,
            estado: "EN_PROCESO" as EstadoTicket,
            bitacora: [...(t.bitacora || []), newBitacoraEntry],
          }
        : t
    )

    setTickets(updated)
    saveAndBroadcastTickets(updated)

    // Sincronizar con backend PATCH
    try {
      fetch(`${HELPDESK_API_URL}/${ticket.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "EN_PROCESO",
          nuevoEstado: "EN_PROCESO",
          usuarioNombre: user?.nombreCompleto || userRoleLabel,
          usuarioRol: userRoleLabel,
          evidencia: "Inicio de atención operativa.",
        }),
      }).catch(() => {})
    } catch {}

    setNotificationMsg(`▶️ Ticket ${ticket.id} en curso: Estado cambiado a EN_PROCESO y registrado en bitácora.`)
    setTimeout(() => setNotificationMsg(null), 4000)
  }

  // Transición: Pasa a ATENDIDO (Resuelto)
  const handleConfirmResolve = () => {
    if (!resolvingTicket) return
    const currentList = getLatestStoredTickets()
    const timestampStr = new Date().toLocaleDateString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })

    const evidenceText = evidenceInput.trim() || `Incidencia resuelta y verificada por ${userRoleLabel}.`

    const newBitacoraEntry: BitacoraEntry = {
      id: Date.now(),
      ticketId: resolvingTicket.id,
      fechaHora: timestampStr,
      estadoAnterior: resolvingTicket.estado,
      estadoNuevo: "ATENDIDO",
      usuarioNombre: user?.nombreCompleto || userRoleLabel,
      usuarioRol: userRoleLabel,
      accion: "RESOLUCION",
      comentario: evidenceText,
    }

    const updated = currentList.map((t) =>
      t.id === resolvingTicket.id
        ? {
            ...t,
            estado: "ATENDIDO" as EstadoTicket,
            evidencia: evidenceText,
            fechaCierre: timestampStr,
            tiempoTranscurrido: t.tiempoTranscurrido.includes("min") ? t.tiempoTranscurrido : "15 min",
            bitacora: [...(t.bitacora || []), newBitacoraEntry],
          }
        : t
    )

    setTickets(updated)
    saveAndBroadcastTickets(updated)

    try {
      fetch(`${HELPDESK_API_URL}/${resolvingTicket.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "ATENDIDO",
          nuevoEstado: "ATENDIDO",
          usuarioNombre: user?.nombreCompleto || userRoleLabel,
          usuarioRol: userRoleLabel,
          evidencia: evidenceText,
        }),
      }).catch(() => {})
    } catch {}

    setResolvingTicket(null)
    setEvidenceInput("")
    setNotificationMsg(`🎉 Ticket ${resolvingTicket.id} ATENDIDO con éxito y registrado en bitácora oficial.`)
    setTimeout(() => setNotificationMsg(null), 4000)
  }

  // Transición: Pasa a CANCELADO
  const handleConfirmCancel = () => {
    if (!cancellingTicket) return
    const currentList = getLatestStoredTickets()
    const timestampStr = new Date().toLocaleDateString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })

    const reasonText = cancelReasonInput.trim() || `Cancelado/Rechazado por política de clínica por ${userRoleLabel}.`

    const newBitacoraEntry: BitacoraEntry = {
      id: Date.now(),
      ticketId: cancellingTicket.id,
      fechaHora: timestampStr,
      estadoAnterior: cancellingTicket.estado,
      estadoNuevo: "CANCELADO",
      usuarioNombre: user?.nombreCompleto || userRoleLabel,
      usuarioRol: userRoleLabel,
      accion: "CANCELACION",
      comentario: reasonText,
    }

    const updated = currentList.map((t) =>
      t.id === cancellingTicket.id
        ? {
            ...t,
            estado: "CANCELADO" as EstadoTicket,
            evidencia: reasonText,
            fechaCierre: timestampStr,
            bitacora: [...(t.bitacora || []), newBitacoraEntry],
          }
        : t
    )

    setTickets(updated)
    saveAndBroadcastTickets(updated)

    try {
      fetch(`${HELPDESK_API_URL}/${cancellingTicket.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "CANCELADO",
          nuevoEstado: "CANCELADO",
          usuarioNombre: user?.nombreCompleto || userRoleLabel,
          usuarioRol: userRoleLabel,
          evidencia: reasonText,
        }),
      }).catch(() => {})
    } catch {}

    setCancellingTicket(null)
    setCancelReasonInput("")
    setNotificationMsg(`⚠️ Ticket ${cancellingTicket.id} CANCELADO y archivado en bitácora.`)
    setTimeout(() => setNotificationMsg(null), 4000)
  }

  // Helper para pintar badges de prioridad de 4 niveles
  const renderPriorityBadge = (prio: string) => {
    const clean = prio.toUpperCase()
    if (clean === "CRÍTICO" || clean === "CRITICO") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-900 text-purple-100 border border-purple-700 shadow-2xs">
          <span>🔥</span> CRÍTICO
        </span>
      )
    }
    if (clean === "ALTO" || clean === "ALTA") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <span>⚡</span> ALTO
        </span>
      )
    }
    if (clean === "MEDIO" || clean === "MEDIA") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          <span>⚠️</span> MEDIO
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-300">
        <span>ℹ️</span> BAJO
      </span>
    )
  }

  // Helper para pintar badges de los 4 estados oficiales ITIL
  const renderStateBadge = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            PENDIENTE
          </span>
        )
      case "EN_PROCESO":
      case "EN ATENCIÓN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-spin" />
            EN PROCESO
          </span>
        )
      case "ATENDIDO":
      case "RESUELTO":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <span>✓</span> ATENDIDO
          </span>
        )
      case "CANCELADO":
      case "CERRADO":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
            <span>✕</span> CANCELADO
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {estado}
          </span>
        )
    }
  }

  return (
    <div className="p-6 space-y-6 fade-in max-w-7xl mx-auto">

      {/* ── Encabezado Principal Segmentado por Rol ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          {isPaciente ? (
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Centro de Ayuda al Paciente
                </span>
                <span className="text-xs text-slate-500 font-medium">Clínica Dental Coronyx · Trujillo</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Atención en línea disponible
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>
                Centro de Ayuda & Mis Solicitudes
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Consulta el estado de tus reprogramaciones de citas, justificaciones o solicita asistencia a nuestro equipo de atención.
              </p>
            </div>
          ) : isRecepcionista ? (
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  Mesa de Ayuda · Recepción & Admisión
                </span>
                <span className="text-xs text-slate-500 font-medium">Sede: Trujillo</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  Sincronizado en tiempo real
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>
                Bandeja de Incidencias & Solicitudes de Pacientes
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Atención ágil de reprogramaciones de citas, gestión de inasistencias (No-Show) y requerimientos de pacientes.
              </p>
            </div>
          ) : isOdontologo ? (
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-300">
                  Mesa de Ayuda · Soporte Clínico
                </span>
                <span className="text-xs text-slate-500 font-medium">Consultorios Dental Coronyx</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>
                Centro de Soporte Clínico & Consultorio
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Reporte de incidencias en sillón dental, subida de radiografías, adendas en odontograma y soporte médico.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
                  ITIL 4 · Mesa de Ayuda Oficial
                </span>
                <span className="text-xs text-slate-500 font-medium">Sede: Trujillo</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  Sincronizado en tiempo real (Base de Datos PostgreSQL)
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>
                Mesa de Ayuda & Gestión de Incidencias
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Canales segmentados por rol con Matriz de Priorización de Riesgo 3x3, Bitácora de Auditoría y Acceso Operativo Directo.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Tu Rol Activo</p>
            <p className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
              {userRoleLabel}
            </p>
          </div>
          <button
            onClick={() => setActiveTab("nueva")}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {isPaciente ? "Solicitar Ayuda" : isOdontologo ? "Reportar Falla" : "Nueva Incidencia"}
          </button>
        </div>
      </div>

      {/* ── Banner de Notificación Tostada ───────────────────────────────── */}
      {notificationMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-sm font-medium flex items-center justify-between shadow-sm animate-fade-in">
          <span>{notificationMsg}</span>
          <button onClick={() => setNotificationMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-4 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* ── Métricas y KPIs de Servicio Adaptadas por Rol ────────────────── */}
      {isPaciente ? (
        /* KPIs para Paciente: Simple, comprensible y sin métricas internas */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
              📋
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mis Solicitudes</p>
              <p className="text-xl font-bold text-slate-900">{pacienteStats.total}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl">
              ⏳
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">En Revisión / Atención</p>
              <p className="text-xl font-bold text-amber-600">{pacienteStats.enRevision}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
              ✅
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Solucionadas / Atendidas</p>
              <p className="text-xl font-bold text-emerald-600">{pacienteStats.solucionados}</p>
            </div>
          </div>
        </div>
      ) : isRecepcionista ? (
        /* KPIs para Recepcionista: Enfocados en productividad de atención */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base">
              📥
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Asignados a Recepción</p>
              <p className="text-lg font-bold text-slate-900">{recepcionistaStats.asignados}</p>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-base">
              ⏳
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pendientes de Atención</p>
              <p className="text-lg font-bold text-rose-600">{recepcionistaStats.pendientes}</p>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-base">
              ⚡
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Prioridad Alta / Crítica</p>
              <p className="text-lg font-bold text-purple-700">{recepcionistaStats.urgentes}</p>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base">
              ✅
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Atendidos / Resueltos</p>
              <p className="text-lg font-bold text-emerald-600">{recepcionistaStats.atendidos}</p>
            </div>
          </div>
        </div>
      ) : isOdontologo ? (
        /* KPIs para Odontólogo: Soporte clínico */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xl">
              🦷
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Reportes Clínicos</p>
              <p className="text-xl font-bold text-slate-900">{odontologoStats.total}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl">
              ⏳
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">En Atención</p>
              <p className="text-xl font-bold text-amber-600">{odontologoStats.pendientes}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
              ✅
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Resueltos</p>
              <p className="text-xl font-bold text-emerald-600">{odontologoStats.resueltos}</p>
            </div>
          </div>
        </div>
      ) : (
        /* KPIs Completos ITIL para Administrador / Soporte Técnico TI */
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
              📋
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Tickets</p>
              <p className="text-lg font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base">
              ⏳
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pendientes</p>
              <p className="text-lg font-bold text-amber-600">{stats.pendientes}</p>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
              ⚙️
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">En Proceso</p>
              <p className="text-lg font-bold text-blue-600">{stats.enProceso}</p>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-base">
              🔥
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Críticos Activos</p>
              <p className="text-lg font-bold text-purple-700">{stats.criticosActivos}</p>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base">
              ✅
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Cumplimiento SLA</p>
              <p className="text-lg font-bold text-emerald-600">{stats.cumplimientoSLA}%</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Navegación de Pestañas ───────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 gap-1 bg-slate-50/80 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("tablero")}
          className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
            activeTab === "tablero"
              ? "bg-white text-emerald-700 shadow-sm border border-slate-200/80"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {isPaciente
            ? `📋 Mis Solicitudes (${filteredTickets.length})`
            : isRecepcionista
            ? `📋 Bandeja de Atención (${filteredTickets.length})`
            : `📋 Tablero Operativo (${filteredTickets.length})`}
        </button>

        <button
          onClick={() => setActiveTab("nueva")}
          className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
            activeTab === "nueva"
              ? "bg-white text-emerald-700 shadow-sm border border-slate-200/80"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {isPaciente
            ? "➕ Solicitar Ayuda / Nueva Consulta"
            : isOdontologo
            ? "➕ Reportar Falla en Consultorio"
            : "➕ Registrar Incidencia (Catálogo de Rol)"}
        </button>

        {/* La pestaña de Matriz 3x3 SOLO se muestra a Operadores y Administrador */}
        {!isPaciente && (
          <button
            onClick={() => setActiveTab("matriz")}
            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeTab === "matriz"
                ? "bg-white text-emerald-700 shadow-sm border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            📑 Matriz 3x3 & Criterio de Priorización
          </button>
        )}
      </div>

      {/* ── PESTAÑA 1: TABLERO DE SEGUIMIENTO OPERATIVO ───────────────────── */}
      {activeTab === "tablero" && (
        <div className="space-y-4">
          {/* Banner Didáctico: Solo visible para operadores y administradores (Oculto para Paciente) */}
          {!isPaciente && (
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-emerald-50 border border-purple-200 rounded-xl p-3.5 shadow-2xs">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">⚖️</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      Triaje de Priorización ITIL (Caso Pedagógico: Alan, Chumbes y Pérez)
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Aunque <strong>Alan</strong> reporte 1° (Consulta de Sábado: BAJA) y <strong>Chumbes</strong> 2° (Radiografía: MEDIA), el sistema atiende primero a <strong>Pérez</strong> (Aula cerrada / Teleconsulta caída: <strong>CRÍTICA</strong>) porque su impacto y riesgo detienen la operación clínica.
                    </p>
                  </div>
                </div>

                {/* Toggle de ordenamiento: Prioridad vs FIFO */}
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-purple-200 text-xs shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold px-1 uppercase">Ordenar por:</span>
                  <button
                    type="button"
                    onClick={() => setSortMode("prioridad")}
                    className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                      sortMode === "prioridad"
                        ? "bg-purple-700 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🔥 Matriz de Riesgo ITIL
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortMode("fifo")}
                    className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                      sortMode === "fifo"
                        ? "bg-slate-700 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ⏱️ Orden de Llegada (FIFO)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Barra de Filtros: Adaptada según Rol */}
          {isPaciente ? (
            /* Filtros simples y claros para Paciente */
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-600">Filtrar mis solicitudes:</span>
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="TODOS">Todas ({pacienteStats.total})</option>
                  <option value="PENDIENTE">⏳ En Espera / Revisión ({pacienteStats.enRevision})</option>
                  <option value="ATENDIDO">✅ Solucionadas ({pacienteStats.solucionados})</option>
                </select>
              </div>

              <div className="w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Buscar en mis solicitudes o respuestas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 placeholder-slate-400 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            /* Filtros Operativos para Recepcionista, Odontólogo y Administrador */
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Filtro Estado */}
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="TODOS">Todos los Estados (4)</option>
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="EN_PROCESO">EN PROCESO</option>
                  <option value="ATENDIDO">ATENDIDO</option>
                  <option value="CANCELADO">CANCELADO</option>
                </select>

                {/* Filtro Prioridad */}
                <select
                  value={filterPrioridad}
                  onChange={(e) => setFilterPrioridad(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="TODAS">Todas las Prioridades (4)</option>
                  <option value="CRÍTICO">CRÍTICO (Score 9)</option>
                  <option value="ALTO">ALTO (Score 6)</option>
                  <option value="MEDIO">MEDIO (Score 3-4)</option>
                  <option value="BAJO">BAJO (Score 1-2)</option>
                </select>

                {/* Toggle Asignados a mi rol: Exclusivo para Administrador con visión global */}
                {isAdminOrSupport ? (
                  <button
                    type="button"
                    onClick={() => setOnlyMyRole(!onlyMyRole)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                      onlyMyRole
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {onlyMyRole
                      ? `✓ Filtrando: Asignados a ${userRoleLabel}`
                      : `🎯 Ver solo Asignados a ${userRoleLabel}`}
                  </button>
                ) : isRecepcionista ? (
                  <span className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold flex items-center gap-1.5">
                    📋 Canal Exclusivo de Recepción
                  </span>
                ) : isOdontologo ? (
                  <span className="text-xs px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-semibold flex items-center gap-1.5">
                    🦷 Canal Exclusivo de Odontología
                  </span>
                ) : null}
              </div>

              {/* Buscador */}
              <div className="w-full md:w-72">
                <input
                  type="text"
                  placeholder="Buscar ticket, solicitud o rol..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 placeholder-slate-400 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Vista Paciente: Tarjetas Claras, Amables y Humanas (Sin Fórmulas ITIL ni Códigos Técnicos) */}
          {isPaciente ? (
            <div className="space-y-3">
              {filteredTickets.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3 shadow-sm">
                  <span className="text-4xl">👋</span>
                  <h3 className="text-base font-bold text-slate-800">No tienes solicitudes registradas</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Si necesitas reprogramar una cita odontológica, consultar un tratamiento o tienes algún inconveniente con el sistema, estamos para ayudarte.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("nueva")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    ➕ Solicitar Ayuda Ahora
                  </button>
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const isResolved = t.estado === "ATENDIDO" || (t.estado as string) === "RESUELTO"
                  const isPending = t.estado === "PENDIENTE"
                  const isInProgress = t.estado === "EN_PROCESO" || (t.estado as string) === "EN ATENCIÓN"
                  const isCancelled = t.estado === "CANCELADO" || (t.estado as string) === "CERRADO"

                  return (
                    <div
                      key={t.id}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-emerald-300 transition-all space-y-3"
                    >
                      {/* Cabecera de la solicitud */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                            {t.id}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-500">
                            📅 Enviado: {t.fechaRegistro}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-600">
                            Área a cargo: <strong className="text-slate-800">{t.responsable}</strong>
                          </span>
                        </div>

                        {/* Estado amigable para el paciente */}
                        <div>
                          {isResolved && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <span>✓</span> Solicitud Resuelta
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                              En Espera de Atención
                            </span>
                          )}
                          {isInProgress && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                              <span className="w-2 h-2 rounded-full bg-blue-600 animate-spin" />
                              Siendo Atendido por {t.responsable}
                            </span>
                          )}
                          {isCancelled && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <span>✕</span> Solicitud Cancelada
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Asunto de la solicitud */}
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{t.solicitud}</p>
                        {t.descripcionDetallada && (
                          <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            {t.descripcionDetallada}
                          </p>
                        )}
                      </div>

                      {/* Respuesta oficial y confirmación del personal (Si ya fue atendido) */}
                      {isResolved && (
                        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                              <span>💬</span> Respuesta del equipo de {t.responsable}:
                            </span>
                            {t.fechaCierre && (
                              <span className="text-[10px] text-emerald-700">Resuelto: {t.fechaCierre}</span>
                            )}
                          </div>
                          <p className="text-emerald-900 font-medium">
                            {t.evidencia || "Tu requerimiento fue atendido y procesado satisfactoriamente."}
                          </p>

                          {/* Acceso Directo para el paciente (Plus) */}
                          {t.rutaAccion && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => navigate(t.rutaAccion!)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                              >
                                {t.accionLabel || "📅 Ver mi Cita en Agenda"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pie de tarjeta con opción de ver historial */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <span className="text-[11px] text-slate-400">
                          {isResolved
                            ? "Atención concluida con éxito."
                            : "Tu requerimiento está en cola prioritaria de atención."}
                        </span>
                        <button
                          type="button"
                          onClick={() => setBitacoraModalTicket(t)}
                          className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          📜 Ver Historial de Seguimiento
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          ) : (
            /* Tabla Operativa Oficial para Recepcionista, Odontólogo y Administrador */
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">TICKET</th>
                      <th className="py-3 px-4">INCIDENCIA / SOLICITUD</th>
                      <th className="py-3 px-4">SOLICITANTE</th>
                      <th className="py-3 px-4">RESPONSABLE</th>
                      {isAdminOrSupport && (
                        <th className="py-3 px-4 text-center">RIESGO (3x3)</th>
                      )}
                      <th className="py-3 px-4">PRIORIDAD</th>
                      <th className="py-3 px-4">ESTADO</th>
                      <th className="py-3 px-4 text-center">ACCESO DIRECTO (PLUS)</th>
                      <th className="py-3 px-4 text-center">GESTIÓN & BITÁCORA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={isAdminOrSupport ? 9 : 8} className="py-8 text-center text-slate-400">
                          No se encontraron tickets con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map((t) => {
                        const isPending = t.estado === "PENDIENTE"
                        const isInProgress = t.estado === "EN_PROCESO" || (t.estado as string) === "EN ATENCIÓN"
                        const isResolved = t.estado === "ATENDIDO" || (t.estado as string) === "RESUELTO"
                        const isCancelled = t.estado === "CANCELADO" || (t.estado as string) === "CERRADO"

                        return (
                          <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* ID */}
                            <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                              {t.id}
                            </td>

                            {/* Solicitud */}
                            <td className="py-3 px-4 max-w-xs">
                              <p className="font-semibold text-slate-800 line-clamp-2">{t.solicitud}</p>
                              {t.evidencia && (
                                <p className="text-[11px] text-emerald-700 mt-0.5 flex items-center gap-1">
                                  <span>📌</span> {t.evidencia}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                                <span>📅 {t.fechaRegistro}</span>
                                {t.slaMinutos && (
                                  <span className="bg-slate-100 px-1.5 py-0.2 rounded font-mono">
                                    SLA: {t.slaMinutos}m
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Solicitante */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                {t.solicitante}
                              </span>
                            </td>

                            {/* Responsable */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                  t.responsable === "Soporte Técnico TI"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : t.responsable === "Admin Clínica"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : t.responsable === "Recepcionista"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-teal-50 text-teal-700 border-teal-200"
                                }`}
                              >
                                {t.responsable}
                              </span>
                            </td>

                            {/* Riesgo 3x3 (Solo para Administrador / Soporte ITIL) */}
                            {isAdminOrSupport && (
                              <td className="py-3 px-4 text-center whitespace-nowrap font-mono text-[11px]">
                                <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200" title={`Impacto: ${t.impacto} × Probabilidad: ${t.probabilidad} = ${t.impacto * t.probabilidad}`}>
                                  I:{t.impacto} × P:{t.probabilidad} = <strong>{t.impacto * t.probabilidad}</strong>
                                </span>
                              </td>
                            )}

                            {/* Prioridad */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              {renderPriorityBadge(t.prioridad)}
                            </td>

                            {/* Estado */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              {renderStateBadge(t.estado)}
                            </td>

                            {/* ACCESO DIRECTO OPERATIVO (PLUS REQUERIDO) */}
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              {t.rutaAccion ? (
                                <button
                                  type="button"
                                  onClick={() => navigate(t.rutaAccion!)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                                  title="Acceso directo al módulo correspondiente sin pasos intermedios"
                                >
                                  {t.accionLabel || "🔗 Ir al Módulo"}
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">No aplica</span>
                              )}
                            </td>

                            {/* GESTIÓN DE ESTADOS & BITÁCORA */}
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Botón Bitácora */}
                                <button
                                  type="button"
                                  onClick={() => setBitacoraModalTicket(t)}
                                  className="px-2 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded border border-slate-300 transition-all cursor-pointer"
                                  title="Ver bitácora de auditoría histórica"
                                >
                                  📜 Bitácora
                                </button>

                                {/* Acciones de Flujo para Operadores */}
                                {isPending && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleStartAttention(t)}
                                      className="px-2 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded transition-all cursor-pointer shadow-2xs"
                                      title="Iniciar atención"
                                    >
                                      ▶️ Atender
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setResolvingTicket(t)
                                        setEvidenceInput("")
                                      }}
                                      className="px-2 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-all cursor-pointer shadow-2xs"
                                      title="Resolver de inmediato"
                                    >
                                      ✅ Resolver
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCancellingTicket(t)
                                        setCancelReasonInput("")
                                      }}
                                      className="px-1.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200 transition-all cursor-pointer"
                                      title="Rechazar o Cancelar"
                                    >
                                      ✕
                                    </button>
                                  </>
                                )}

                                {isInProgress && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setResolvingTicket(t)
                                        setEvidenceInput("")
                                      }}
                                      className="px-2 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-all cursor-pointer shadow-2xs"
                                      title="Registrar evidencia y cerrar"
                                    >
                                      ✅ Resolver
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCancellingTicket(t)
                                        setCancelReasonInput("")
                                      }}
                                      className="px-1.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200 transition-all cursor-pointer"
                                      title="Cancelar"
                                    >
                                      ✕
                                    </button>
                                  </>
                                )}

                                {isResolved && (
                                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-bold border border-emerald-200">
                                    ✓ Resuelto
                                  </span>
                                )}

                                {isCancelled && (
                                  <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold border border-slate-200">
                                    Archivado
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PESTAÑA 2: NUEVA SOLICITUD / INCIDENCIA (CATÁLOGO SEGMENTADO) ─── */}
      {activeTab === "nueva" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                {isPaciente
                  ? "¿En qué te podemos ayudar hoy?"
                  : isOdontologo
                  ? "Reportar Falla o Requerimiento Clínico"
                  : "Registrar Solicitud o Incidencia de Servicio"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isPaciente
                  ? "Selecciona el motivo de tu consulta o requerimiento para atenderte con rapidez."
                  : `Opciones predeterminadas filtradas para su rol (${userRoleLabel}). Priorización deducida automáticamente.`}
              </p>
            </div>

            {/* Checkbox para ver catálogo completo (Soporte o Admin) */}
            {(role === "SUPER_ADMIN" || role === "ADMIN_CLINICA") && !isPaciente && (
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAllCatalogRoles}
                  onChange={(e) => setShowAllCatalogRoles(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                Ver incidencias de todos los roles
              </label>
            )}
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-5">
            {/* Selector de Incidencia Predeterminada */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                {isPaciente
                  ? "¿Cuál es el motivo de tu solicitud? (Selecciona una opción)"
                  : "Seleccione el requerimiento concurrente (1 Clic)"}
              </label>
              <select
                value={selectedCatalogCode}
                onChange={(e) => setSelectedCatalogCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {availableCatalog.map((opt) => (
                  <option key={opt.codigo} value={opt.codigo}>
                    {isPaciente
                      ? opt.solicitud
                      : `[${opt.solicitanteRol}] [${opt.tipoItil.toUpperCase()}] ${opt.solicitud} (${opt.prioridad})`}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1 italic">
                {activeCatalogItem.descripcion}
              </p>
            </div>

            {/* Tarjeta Informativa / Reassurance para Paciente VS Evaluación 3x3 para Operadores */}
            {isPaciente ? (
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-xs text-emerald-950 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <h4 className="font-bold text-emerald-900">Atención Garantizada Clínica Dental Coronyx</h4>
                    <p className="text-emerald-700 text-[11px]">
                      Tu solicitud será asignada de inmediato al área de <strong>{activeCatalogItem.responsable}</strong> para su gestión rápida.
                    </p>
                  </div>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between text-[11px] text-slate-600">
                  <span>⏱️ Tiempo estimado de respuesta:</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {activeCatalogItem.slaMinutos >= 60
                      ? `${activeCatalogItem.slaMinutos / 60} hora(s)`
                      : `${activeCatalogItem.slaMinutos} minutos`}
                  </span>
                </div>
              </div>
            ) : (
              /* Tarjeta Didáctica: Evaluación de Riesgo Matriz 3x3 para Operador / Admin */
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-indigo-200/80 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📊</span> Evaluación Automática de Riesgo ITIL (Matriz 3x3)
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Fórmula: Impacto (1-3) × Probabilidad (1-3)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-semibold">1. Impacto a la Clínica</span>
                    <span className="font-bold text-slate-800">
                      {isCustomOther ? customImpacto : activeCatalogItem.impacto} ({isCustomOther ? (customImpacto === 3 ? "Alto" : customImpacto === 2 ? "Medio" : "Bajo") : (activeCatalogItem.impacto === 3 ? "Alto" : activeCatalogItem.impacto === 2 ? "Medio" : "Bajo")})
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-semibold">2. Probabilidad</span>
                    <span className="font-bold text-slate-800">
                      {isCustomOther ? customProbabilidad : activeCatalogItem.probabilidad} ({isCustomOther ? (customProbabilidad === 3 ? "Alta" : customProbabilidad === 2 ? "Media" : "Baja") : (activeCatalogItem.probabilidad === 3 ? "Alta" : activeCatalogItem.probabilidad === 2 ? "Media" : "Baja")})
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-semibold">3. Prioridad Resultante</span>
                    <div className="mt-0.5">{renderPriorityBadge(formCalculatedPriority)}</div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-semibold">4. SLA Comprometido</span>
                    <span className="font-bold text-emerald-700">
                      {activeCatalogItem.slaMinutos >= 60
                        ? `${activeCatalogItem.slaMinutos / 60} hora(s)`
                        : `${activeCatalogItem.slaMinutos} minutos`}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200 gap-2">
                  <div>
                    <strong>Derivación Directa a:</strong>{" "}
                    <span className="font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {activeCatalogItem.responsable}
                    </span>
                  </div>
                  {activeCatalogItem.accionLabel && (
                    <div className="text-indigo-700 font-semibold">
                      Acceso Operativo: {activeCatalogItem.accionLabel}
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 italic">
                  💡 Criterio: {activeCatalogItem.justificacionMatriz}
                </p>
              </div>
            )}

            {/* Detalle para opción "Otros" con subida de captura */}
            {isCustomOther && (
              <div className="space-y-4 p-4 bg-amber-50/70 border border-amber-200 rounded-xl animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    {isPaciente
                      ? "Describe detalladamente tu problema o consulta:"
                      : "Describa detalladamente su problema o solicitud particular:"}
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder={
                      isPaciente
                        ? "Escribe aquí tu consulta o motivo de reprogramación..."
                        : "Escriba aquí los detalles del incidente ocurrido..."
                    }
                    className="w-full bg-white border border-amber-300 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Calificación de Impacto y Probabilidad (Solo para Operadores y Administrador, Oculto para Paciente) */}
                {!isPaciente && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-950 mb-1">
                        ¿Cuánto impacto causará a la clínica? (Impacto):
                      </label>
                      <select
                        value={customImpacto}
                        onChange={(e) => setCustomImpacto(Number(e.target.value) as 1 | 2 | 3)}
                        className="w-full text-xs bg-white border border-amber-300 rounded-lg p-2 text-slate-800 font-medium"
                      >
                        <option value={1}>1 - Bajo: No interrumpe consultas ni citas</option>
                        <option value={2}>2 - Medio: Afecta trámites o genera retrasos menores</option>
                        <option value={3}>3 - Alto: Detiene la atención médica o genera riesgo legal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-950 mb-1">
                        ¿Qué tan probable es que ocurra? (Probabilidad):
                      </label>
                      <select
                        value={customProbabilidad}
                        onChange={(e) => setCustomProbabilidad(Number(e.target.value) as 1 | 2 | 3)}
                        className="w-full text-xs bg-white border border-amber-300 rounded-lg p-2 text-slate-800 font-medium"
                      >
                        <option value={1}>1 - Baja: Caso aislado o esporádico</option>
                        <option value={2}>2 - Media: Ocurre ocasionalmente en la sede</option>
                        <option value={3}>3 - Alta: Frecuente o inminente en este momento</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Subida o URL de captura de pantalla */}
                <div>
                  <label className="block text-[11px] font-bold text-amber-950 mb-1">
                    {isPaciente
                      ? "Adjuntar foto o captura de pantalla (Opcional):"
                      : "Captura de Pantalla / Evidencia Fotográfica (URL o Archivo):"}
                  </label>
                  <input
                    type="text"
                    value={customAdjuntoUrl}
                    onChange={(e) => setCustomAdjuntoUrl(e.target.value)}
                    placeholder="https://coronyx-evidencia.s3.railway.app/pantalla-error.png"
                    className="w-full text-xs bg-white border border-amber-300 rounded-lg p-2 text-slate-800 font-mono"
                  />
                  <p className="text-[10px] text-amber-800 mt-1">
                    📎 Se guardará en la columna <code>archivo_adjunto_url</code> de la base de datos de Railway.
                  </p>
                </div>
              </div>
            )}

            {/* Botones de Envío */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab("tablero")}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>🚀</span> {isPaciente ? "Enviar mi Solicitud" : "Emitir Incidencia"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── PESTAÑA 3: MATRIZ 3x3 DE EVALUACIÓN DE RIESGO ITIL ─────────────── */}
      {activeTab === "matriz" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
              Matriz de Riesgo ITIL 3x3 y Asignación de Prioridad
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Determinación matemática de prioridad cruzando el <strong>Impacto (1 a 3)</strong> con la <strong>Probabilidad (1 a 3)</strong>.
            </p>
          </div>

          {/* Grilla visual 3x3 */}
          <div className="overflow-x-auto">
            <div className="min-w-[650px] p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-center font-bold text-xs text-slate-700 mb-3 uppercase tracking-wider">
                Eje X: Probabilidad de Ocurrencia →
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                {/* Cabecera vacía */}
                <div className="flex items-center justify-center font-bold text-slate-400 text-[11px]">
                  Impacto ↓
                </div>
                <div className="p-2 text-center font-bold bg-white rounded border border-slate-200 text-slate-700">
                  Baja (1)
                </div>
                <div className="p-2 text-center font-bold bg-white rounded border border-slate-200 text-slate-700">
                  Media (2)
                </div>
                <div className="p-2 text-center font-bold bg-white rounded border border-slate-200 text-slate-700">
                  Alta (3)
                </div>

                {/* FILA 1: IMPACTO ALTO (3) */}
                <div className="p-2.5 font-bold bg-white rounded border border-slate-200 text-slate-800 flex items-center justify-between">
                  <span>Alto (3)</span>
                  <span className="text-[10px] text-rose-600 font-mono">Grave</span>
                </div>

                {/* Alto x Baja = 3 (MEDIO) */}
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 flex flex-col justify-between min-h-[90px]">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-amber-800">Score 3</span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-1.5 py-0.2 rounded">MEDIO</span>
                  </div>
                  <p className="text-[11px] text-amber-900 font-medium mt-1">
                    Falla de servidor nocturno / Ausencia no crítica
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">SLA: 60 min</span>
                </div>

                {/* Alto x Media = 6 (ALTO) */}
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 flex flex-col justify-between min-h-[90px]">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-rose-800">Score 6</span>
                    <span className="text-[10px] font-bold text-rose-800 bg-rose-200/60 px-1.5 py-0.2 rounded">ALTO</span>
                  </div>
                  <p className="text-[11px] text-rose-900 font-medium mt-1">
                    Reprogramación &lt; 2h / Colisión de Sillón / Desvinculación
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">SLA: 15-20 min</span>
                </div>

                {/* Alto x Alta = 9 (CRÍTICO) */}
                <div className="p-3 rounded-lg bg-purple-900 text-purple-100 border border-purple-700 flex flex-col justify-between min-h-[90px] shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-purple-300">Score 9</span>
                    <span className="text-[10px] font-extrabold text-white bg-purple-700 px-2 py-0.5 rounded">CRÍTICO 🔥</span>
                  </div>
                  <p className="text-[11px] text-white font-bold mt-1">
                    Aula cerrada con llave / Teleconsulta caída / Caída Railway
                  </p>
                  <span className="text-[10px] text-purple-200 font-mono">SLA: 10 min (Inmediato)</span>
                </div>

                {/* FILA 2: IMPACTO MEDIO (2) */}
                <div className="p-2.5 font-bold bg-white rounded border border-slate-200 text-slate-800 flex items-center justify-between">
                  <span>Medio (2)</span>
                  <span className="text-[10px] text-amber-600 font-mono">Moderado</span>
                </div>

                {/* Medio x Baja = 2 (BAJO) */}
                <div className="p-3 rounded-lg bg-slate-100 border border-slate-300 flex flex-col justify-between min-h-[90px]">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-slate-600">Score 2</span>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-1.5 py-0.2 rounded">BAJO</span>
                  </div>
                  <p className="text-[11px] text-slate-800 font-medium mt-1">
                    Capacitación en software odontológico
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">SLA: 24h</span>
                </div>

                {/* Medio x Media = 4 (MEDIO) */}
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 flex flex-col justify-between min-h-[90px]">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-amber-800">Score 4</span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-1.5 py-0.2 rounded">MEDIO</span>
                  </div>
                  <p className="text-[11px] text-amber-900 font-medium mt-1">
                    Radiografía excede 25MB / Error DNI en admisión
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">SLA: 30-60 min</span>
                </div>

                {/* Medio x Alta = 6 (ALTO) */}
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 flex flex-col justify-between min-h-[90px]">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-rose-800">Score 6</span>
                    <span className="text-[10px] font-bold text-rose-800 bg-rose-200/60 px-1.5 py-0.2 rounded">ALTO</span>
                  </div>
                  <p className="text-[11px] text-rose-900 font-medium mt-1">
                    No-Show recurrente / Retraso repetido de cirugía
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">SLA: 15 min</span>
                </div>

                {/* FILA 3: IMPACTO BAJO (1) */}
                <div className="p-2.5 font-bold bg-white rounded border border-slate-200 text-slate-800 flex items-center justify-between">
                  <span>Bajo (1)</span>
                  <span className="text-[10px] text-slate-500 font-mono">Leve</span>
                </div>

                {/* Bajo x Baja = 1 (BAJO) */}
                <div className="p-3 rounded-lg bg-slate-100 border border-slate-300 flex flex-col justify-between min-h-[90px]">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-slate-600">Score 1</span>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-1.5 py-0.2 rounded">BAJO</span>
                  </div>
                  <p className="text-[11px] text-slate-800 font-medium mt-1">
                    Parlante que no funciona / Duda estética de UI
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">SLA: 120 min</span>
                </div>

                {/* Bajo x Media = 2 (BAJO) */}
                <div className="p-3 rounded-lg bg-slate-100 border border-slate-300 flex flex-col justify-between min-h-[90px]">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-slate-600">Score 2</span>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-1.5 py-0.2 rounded">BAJO</span>
                  </div>
                  <p className="text-[11px] text-slate-800 font-medium mt-1">
                    Consulta horarios de sábado / Cotización de convenio
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">SLA: 120 min</span>
                </div>

                {/* Bajo x Alta = 3 (MEDIO) */}
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 flex flex-col justify-between min-h-[90px]">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-amber-800">Score 3</span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-1.5 py-0.2 rounded">MEDIO</span>
                  </div>
                  <p className="text-[11px] text-amber-900 font-medium mt-1">
                    Reiteradas consultas de aranceles telefónicos
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">SLA: 60 min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comparativa: El Aula Cerrada vs Parlante */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>🏫</span> Ejemplo Pedagógico del Profesor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                <span className="font-bold text-purple-900 block text-xs">Caso A: Aula Cerrada con Llave</span>
                <p className="text-[11px] text-slate-600 mt-1">
                  El profesor y los alumnos no pueden ingresar. La clase se suspende totalmente si no se atiende de inmediato.
                </p>
                <div className="mt-2 text-[11px] font-mono font-bold text-purple-800">
                  Impacto Alto (3) × Probabilidad Alta (3) = 9 → <strong>CRÍTICO (Atención Inmediata)</strong>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-100 border border-slate-200">
                <span className="font-bold text-slate-800 block text-xs">Caso B: Parlantes no funcionan</span>
                <p className="text-[11px] text-slate-600 mt-1">
                  El docente puede continuar hablando a viva voz o usar la pizarra. No detiene la clase.
                </p>
                <div className="mt-2 text-[11px] font-mono font-bold text-slate-700">
                  Impacto Bajo (1) × Probabilidad Baja (1) = 1 → <strong>BAJO (Atención Diferible)</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: RESOLVER TICKET (CON EVIDENCIA OBLIGATORIA) ─────────────── */}
      {resolvingTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {resolvingTicket.id}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Marcar Ticket como Atendido</h3>
              </div>
              <button
                onClick={() => setResolvingTicket(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p>
                <strong className="text-slate-700">Solicitud:</strong> {resolvingTicket.solicitud}
              </p>
              <p>
                <strong className="text-slate-700">Solicitante:</strong> {resolvingTicket.solicitante} ·{" "}
                <strong className="text-slate-700">Responsable:</strong> {resolvingTicket.responsable}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span>Prioridad: {renderPriorityBadge(resolvingTicket.prioridad)}</span>
                {resolvingTicket.rutaAccion && (
                  <button
                    onClick={() => navigate(resolvingTicket.rutaAccion!)}
                    className="text-indigo-600 underline text-[11px] font-semibold cursor-pointer"
                  >
                    {resolvingTicket.accionLabel || "Ir al módulo"}
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Evidencia de Cierre y Solución Aplicada (Obligatoria para Auditoría):
              </label>
              <textarea
                rows={3}
                required
                value={evidenceInput}
                onChange={(e) => setEvidenceInput(e.target.value)}
                placeholder="Ejemplo: Se corrigió el dígito del DNI en base de datos / Se reasignó al Sillón 2 / Se validó enlace WebRTC."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setResolvingTicket(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmResolve}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
              >
                Confirmar Solución ✅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CANCELAR TICKET ────────────────────────────────────────── */}
      {cancellingTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                  {cancellingTicket.id}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Rechazar / Cancelar Ticket</h3>
              </div>
              <button
                onClick={() => setCancellingTicket(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p>
                <strong className="text-slate-700">Solicitud:</strong> {cancellingTicket.solicitud}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motivo del Rechazo / Cancelación (Política de Clínica):
              </label>
              <textarea
                rows={3}
                required
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                placeholder="Ejemplo: No cumple la política de anticipación mínima de 24 horas para reprogramar turnos."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancellingTicket(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Volver
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
              >
                Confirmar Cancelación ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: VER BITÁCORA DE AUDITORÍA HISTÓRICA ─────────────────────── */}
      {bitacoraModalTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {bitacoraModalTicket.id}
                  </span>
                  {renderPriorityBadge(bitacoraModalTicket.prioridad)}
                  {renderStateBadge(bitacoraModalTicket.estado)}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {isPaciente ? "Historial de Seguimiento de tu Solicitud" : "Bitácora de Auditoría y Trazabilidad ITIL"}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1">{bitacoraModalTicket.solicitud}</p>
              </div>
              <button
                onClick={() => setBitacoraModalTicket(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Lista cronológica de bitácora */}
            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {!bitacoraModalTicket.bitacora || bitacoraModalTicket.bitacora.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                  <p>Registro histórico creado con la inicialización del sistema.</p>
                  <p className="mt-1 font-mono text-[11px] text-slate-500">
                    Fecha de Registro: {bitacoraModalTicket.fechaRegistro} por {bitacoraModalTicket.solicitante}
                  </p>
                  {bitacoraModalTicket.evidencia && (
                    <p className="mt-1 text-emerald-700 font-medium">
                      Resolución: {bitacoraModalTicket.evidencia}
                    </p>
                  )}
                </div>
              ) : (
                bitacoraModalTicket.bitacora.map((entry, idx) => (
                  <div key={idx} className="flex gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex flex-col items-center">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      {idx < (bitacoraModalTicket.bitacora?.length || 0) - 1 && (
                        <div className="w-0.5 h-full bg-slate-200 my-1" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          {isPaciente
                            ? entry.accion === "CREACION"
                              ? "Solicitud Enviada"
                              : entry.accion === "INICIO_ATENCION"
                              ? "Atención en Curso"
                              : entry.accion === "RESOLUCION"
                              ? "Solución Confirmada"
                              : "Solicitud Cancelada"
                            : entry.accion}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{entry.fechaHora}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        <strong>{isPaciente ? "Atendido por:" : "Operador:"}</strong> {entry.usuarioNombre} ({entry.usuarioRol})
                      </p>
                      {entry.estadoAnterior && !isPaciente && (
                        <p className="text-[10px] text-slate-500">
                          Transición: <span className="font-mono">{entry.estadoAnterior}</span> → <span className="font-mono font-bold text-emerald-700">{entry.estadoNuevo}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-slate-800 bg-white p-2 rounded border border-slate-200 mt-1">
                        💬 {entry.comentario || (entry as any).comentarioEvidencia || "Sin detalle registrado."}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button
                onClick={() => setBitacoraModalTicket(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 cursor-pointer"
              >
                {isPaciente ? "Cerrar Historial" : "Cerrar Bitácora"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
