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

  scriptLoadingPromise = new Promise((resolve, reject) => {
    // Si ya existe el tag script en el DOM
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve())
      existingScript.addEventListener('error', (e) => reject(new Error('Error al cargar Google Identity Services')))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('No se pudo cargar la librería de Google (comprueba tu conexión)'))
    document.head.appendChild(script)
  })

  return scriptLoadingPromise
}

export interface GoogleMeetCreationParams {
  summary?: string
  description?: string
  startDateTime?: string // Formato ISO 8601 (ej: 2026-10-16T10:00:00-05:00)
  endDateTime?: string   // Formato ISO 8601
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
export async function createOfficialGoogleMeet(params: GoogleMeetCreationParams = {}): Promise<GoogleMeetResult> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  if (!clientId || clientId.includes('pega_aqui')) {
    throw new Error('VITE_GOOGLE_CLIENT_ID no está configurado en el archivo .env del frontend.')
  }

  await loadGoogleIdentityScript()

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services no está disponible en este navegador.')
  }

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/calendar.events',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            if (tokenResponse.error === 'access_denied') {
              reject(new Error('Permiso denegado: El usuario canceló la autorización de Google.'))
            } else {
              reject(new Error(`Error de autorización Google: ${tokenResponse.error_description || tokenResponse.error}`))
            }
            return
          }

          try {
            const accessToken = tokenResponse.access_token

            // Fechas por defecto si no vienen definidas
            const now = new Date()
            const defaultStart = new Date(now.getTime() + 15 * 60000).toISOString()
            const defaultEnd = new Date(now.getTime() + 75 * 60000).toISOString()

            const startIso = params.startDateTime || defaultStart
            const endIso = params.endDateTime || defaultEnd

            const summary = params.summary || `Teleconsulta Odontológica — ${params.patientName ? `Paciente: ${params.patientName}` : 'Coronyx'}`
            const description = params.description || `Cita virtual generada desde Coronyx Dental System.\n${params.doctorName ? `Odontólogo: ${params.doctorName}\n` : ''}${params.patientName ? `Paciente: ${params.patientName}` : ''}`

            // Llamada oficial a Google Calendar API v3 solicitando creación de Google Meet
            const response = await fetch(
              'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
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
                        type: 'hangoutsMeet',
                      },
                    },
                  },
                }),
              }
            )

            if (!response.ok) {
              const errBody = await response.json().catch(() => ({}))
              const errorMsg = errBody.error?.message || `Error HTTP ${response.status} de Google Calendar API`
              
              if (response.status === 403) {
                reject(new Error(`Error 403: Verifica que la "Google Calendar API" esté habilitada en Google Cloud Console para este proyecto. Detalle: ${errorMsg}`))
              } else {
                reject(new Error(errorMsg))
              }
              return
            }

            const event = await response.json()
            const meetUrl = event.hangoutLink || event.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri

            if (!meetUrl) {
              reject(new Error('Google creó el evento en Calendar, pero no devolvió enlace Meet. Verifica permisos de Google Meet en tu cuenta.'))
              return
            }

            resolve({
              meetUrl,
              eventId: event.id,
              calendarLink: event.htmlLink,
            })
          } catch (apiErr: any) {
            reject(new Error(`Fallo al contactar Google Calendar API: ${apiErr.message || apiErr}`))
          }
        },
      })

      // Abrir el popup oficial de Google OAuth
      tokenClient.requestAccessToken({ prompt: '' })
    } catch (err: any) {
      reject(new Error(`No se pudo inicializar el cliente de Google: ${err.message || err}`))
    }
  })
}
