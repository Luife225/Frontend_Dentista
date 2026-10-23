/**
 * Servicio de integración con Google Calendar API y Google Meet
 * Utiliza Google Identity Services (GIS) para solicitar autorización OAuth 2.0
 * y generar salas oficiales de Google Meet vinculadas al calendario del profesional.
 */

declare global {
  interface Window {
    google?: any
  }
}

let scriptLoadingPromise: Promise<void> | null = null

/**
 * Asegura que el script de Google Identity Services esté cargado en el documento
 */

export function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve()
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise
  }

  const scriptUrl = "https://accounts.google.com/gsi/client"

  scriptLoadingPromise = new Promise<void>((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${scriptUrl}"]`,
    )

    const fail = () => {
      clearTimeout(timeout)

      script?.remove()

      scriptLoadingPromise = null

      reject(
        new Error(
          "No se pudo cargar Google. Comprueba la conexión y vuelve a intentar.",
        ),
      )
    }

    const timeout = setTimeout(fail, 15000)

    if (!script) {
      script = document.createElement("script")

      script.src = scriptUrl
      script.async = true
      script.defer = true

      script.onload = () => {
        clearTimeout(timeout)

        if (window.google?.accounts?.oauth2) resolve()
        else fail()
      }

      script.onerror = fail

      document.head.appendChild(script)
    } else {
      script.addEventListener(
        "load",
        () => {
          clearTimeout(timeout)
          resolve()
        },
        { once: true },
      )

      script.addEventListener("error", fail, { once: true })
    }
  })

  return scriptLoadingPromise
}

export interface GoogleMeetCreationParams {
  summary?: string

  description?: string

  startDateTime?: string // Formato ISO 8601 (ej: 2026-10-16T10:00:00-05:00)

  endDateTime?: string // Formato ISO 8601

  patientName?: string

  doctorName?: string
}

export interface GoogleMeetResult {
  meetUrl: string

  eventId: string

  calendarLink?: string
}

/**
 * Solicita consentimiento al usuario vía Google OAuth 2.0 y genera
 * una sala oficial en Google Meet creando un evento en su Google Calendar.
 */

export async function createOfficialGoogleMeet(
  params: GoogleMeetCreationParams = {},
): Promise<GoogleMeetResult> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  if (!clientId || clientId.includes("pega_aqui")) {
    throw new Error(
      "VITE_GOOGLE_CLIENT_ID no está configurado en el archivo .env del frontend.",
    )
  }

  await loadGoogleIdentityScript()

  if (!window.google?.accounts?.oauth2) {
    throw new Error(
      "Google Identity Services no está disponible en este navegador.",
    )
  }

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,

        scope: "https://www.googleapis.com/auth/calendar.events",

        error_callback: (error: any) =>
          reject(
            new Error(
              error.type === "popup_closed"
                ? "Se cerró la autorización de Google. Puedes volver a intentarlo."
                : "No se pudo abrir la autorización de Google. Permite ventanas emergentes e inténtalo otra vez.",
            ),
          ),

        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            if (tokenResponse.error === "access_denied") {
              reject(
                new Error(
                  "Permiso denegado: El usuario canceló la autorización de Google.",
                ),
              )
            } else {
              reject(
                new Error(
                  `Error de autorización Google: ${tokenResponse.error_description || tokenResponse.error}`,
                ),
              )
            }

            return
          }

          try {
            const accessToken = tokenResponse.access_token

            // Fechas por defecto si no vienen definidas

            const now = new Date()

            const defaultStart = new Date(
              now.getTime() + 15 * 60000,
            ).toISOString()

            const defaultEnd = new Date(
              now.getTime() + 75 * 60000,
            ).toISOString()

            const startIso = params.startDateTime || defaultStart

            const endIso = params.endDateTime || defaultEnd

            const summary =
              params.summary ||
              `Teleconsulta Odontológica — ${
                params.patientName
                  ? `Paciente: ${params.patientName}`
                  : "Coronyx"
              }`

            const description =
              params.description ||
              `Cita virtual generada desde Coronyx Dental System.\n${
                params.doctorName ? `Odontólogo: ${params.doctorName}\n` : ""
              }${params.patientName ? `Paciente: ${params.patientName}` : ""}`

            // Llamada oficial a Google Calendar API v3 solicitando creación de Google Meet

            const response = await fetch(
              "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",

              {
                method: "POST",

                signal: AbortSignal.timeout(20000),

                headers: {
                  Authorization: `Bearer ${accessToken}`,

                  "Content-Type": "application/json",
                },

                body: JSON.stringify({
                  summary,

                  description,

                  start: { dateTime: startIso },

                  end: { dateTime: endIso },

                  conferenceData: {
                    createRequest: {
                      requestId: `coronyx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,

                      conferenceSolutionKey: {
                        type: "hangoutsMeet",
                      },
                    },
                  },
                }),
              },
            )

            if (!response.ok) {
              const errBody = await response.json().catch(() => ({}))

              const errorMsg =
                errBody.error?.message ||
                `Error HTTP ${response.status} de Google Calendar API`

              if (response.status === 403) {
                reject(
                  new Error(
                    `Error 403: Verifica que la "Google Calendar API" esté habilitada en Google Cloud Console para este proyecto. Detalle: ${errorMsg}`,
                  ),
                )
              } else {
                reject(new Error(errorMsg))
              }

              return
            }

            let event = await response.json()

            const getUrl = (e: any) =>
              e.hangoutLink ||
              e.conferenceData?.entryPoints?.find(
                (ep: any) => ep.entryPointType === "video",
              )?.uri

            for (
              let attempt = 0;
              !getUrl(event) &&
              event.id &&
              event.conferenceData?.createRequest?.status?.statusCode ===
                "pending" &&
              attempt < 8;
              attempt++
            ) {
              await new Promise((r) => setTimeout(r, 1000))

              const poll = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(event.id)}`,
                {
                  headers: { Authorization: `Bearer ${accessToken}` },
                  signal: AbortSignal.timeout(15000),
                },
              )

              if (!poll.ok)
                throw new Error(
                  "No se pudo consultar el evento creado en Google Calendar. Revisa tu calendario antes de crear otro.",
                )

              event = await poll.json()
            }

            const meetUrl = getUrl(event)

            if (!meetUrl) {
              reject(
                new Error(
                  "Google creó el evento, pero la sala aún no está disponible. Revisa tu calendario antes de generar otro evento.",
                ),
              )

              return
            }

            resolve({
              meetUrl,

              eventId: event.id,

              calendarLink: event.htmlLink,
            })
          } catch (apiErr: any) {
            reject(
              new Error(
                `Fallo al contactar Google Calendar API: ${apiErr.message || apiErr}`,
              ),
            )
          }
        },
      })

      // Abrir el popup oficial de Google OAuth

      tokenClient.requestAccessToken({ prompt: "" })
    } catch (err: any) {
      reject(
        new Error(
          `No se pudo inicializar el cliente de Google: ${err.message || err}`,
        ),
      )
    }
  })
}
