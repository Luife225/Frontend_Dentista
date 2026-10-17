# Guía de Integración Google Meet y Tareas Pendientes — Coronyx

Este documento detalla el funcionamiento de la integración con **Google Meet** en Coronyx, cómo configurarlo cuando descargues el proyecto en otra computadora y los puntos pendientes para dar por finalizada la funcionalidad al 100%.

---

## 1. Arquitectura de la Solución Implementada

En Coronyx se implementó la arquitectura oficial recomendada por Google para aplicaciones web (SPA):

```
[Doctor en Frontend]
       │
       ▼ (Clic en "⚡ Generar con Google Meet")
[Google Identity Services (GIS)] ──▶ Abre popup oficial de Google OAuth 2.0
       │
       ▼ (Retorna access_token temporal con scope calendar.events)
[Google Calendar API v3] ──▶ POST /calendars/primary/events?conferenceDataVersion=1
       │
       ▼ (Retorna evento con hangoutLink oficial)
[AgendarCitaModal] ──▶ Guarda en backend: enlaceTeleconsulta = https://meet.google.com/xxx-yyyy-zzz
       │
       ├─▶ Doctor en Agenda / Teleodontología: Botón "🚀 Abrir Sala de Meet ↗"
       └─▶ Paciente en PatientApp: Botón "📹 Unirse a Google Meet ↗"
```

### Archivos clave modificados / creados:
- [src/services/googleMeetService.ts](file:///c:/Users/sebas/Desktop/CoronyxSASS/FrontendCoronyx/Frontend_Dentista/src/services/googleMeetService.ts): Servicio cliente que carga el SDK de Google, gestiona el token OAuth y crea la conferencia en Google Calendar.
- [src/components/agenda/AgendarCitaModal.tsx](file:///c:/Users/sebas/Desktop/CoronyxSASS/FrontendCoronyx/Frontend_Dentista/src/components/agenda/AgendarCitaModal.tsx): UI con botón `⚡ Generar con Google Meet`, spinner de carga, validación de estados y generador alternativo local.
- [index.html](file:///c:/Users/sebas/Desktop/CoronyxSASS/FrontendCoronyx/Frontend_Dentista/index.html): Inclusión asíncrona del SDK `https://accounts.google.com/gsi/client`.
- [.env.example](file:///c:/Users/sebas/Desktop/CoronyxSASS/FrontendCoronyx/Frontend_Dentista/.env.example): Plantilla de variables de entorno seguras.

---

## 2. Cómo configurar el proyecto en tu otra PC

Cuando hagas `git pull` o clones el repositorio en tu otra máquina:

1. **Crear el archivo `.env` en `Frontend_Dentista/`:**
   Copia el archivo `.env.example` y renómbralo a `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:8081/api/v1
   VITE_GOOGLE_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com
   ```

2. **Requisitos en Google Cloud Console (Proyecto `coronyx`):**
   *(Esto es en la nube de Google, no depende de la máquina física):*
   - **Google Calendar API Habilitada:** En *APIs y servicios > Biblioteca* verificar que esté activa.
   - **Usuarios de Prueba (Test Users):** En *Pantalla de consentimiento de OAuth > Usuarios de prueba* deben estar los correos `@gmail.com` de los doctores que van a generar la reunión (por ejemplo: `3lnoob12@gmail.com`, `otakuakise2004@gmail.com`).
   - **Orígenes autorizados:** Asegurar que en el Cliente OAuth esté registrado `http://localhost:5173` y `https://frontenddentista-production.up.railway.app`.

3. **Iniciar el frontend:**
   ```bash
   npm install
   npm run dev
   ```

---

## 3. ¿Qué falta para finalizar la funcionalidad de Google Meet al 100%?

Para dejar la experiencia de teleconsulta completamente pulida y lista para la sustentación, quedan los siguientes puntos:

### A. Portal del Paciente (`PatientApp.tsx`)
- [ ] **Manejo al solicitar cita virtual desde el paciente:**
  Cuando un paciente solicita una cita virtual desde su portal móvil, actualmente genera un enlace local provisional. 
  - *Mejora recomendada:* Mostrarle un aviso amigable: *"Cita virtual solicitada. El odontólogo confirmará la sala oficial de Google Meet antes de tu consulta"*.
  - Cuando el odontólogo confirme o edite la cita en la Agenda, puede presionar `⚡ Generar con Google Meet` para vincular su sala oficial.

### B. Módulo de Teleodontología (`Teleodontologia.tsx`)
- [ ] **Acción rápida para regenerar o cambiar enlace:**
  En la tabla de citas virtuales en Teleodontología, agregar un botón de acción rápida para que el doctor pueda renovar o asignar una sala de Google Meet oficial a una cita existente sin tener que abrir el modal completo de reprogramación.

### C. Plantilla de Mensaje / Compartir enlace
- [ ] **Botón "Copiar mensaje para WhatsApp":**
  Al agendar o en el detalle de la cita virtual, tener un botón para copiar un texto preformateado:
  > *"Hola [Nombre Paciente], te recordamos tu teleconsulta odontológica en Coronyx para el [Fecha] a las [Hora]. Puedes unirte a la sala de Google Meet mediante este enlace: [enlaceTeleconsulta]"*

### D. Pantalla de consentimiento pública (Opcional para producción)
- [ ] Mientras el proyecto esté en desarrollo/sustentación, el modo *"Testing"* con usuarios de prueba funciona perfectamente. Si a futuro se quiere comercializar a cualquier clínica externa sin agregar correos manuales, se solicita la verificación de la pantalla de consentimiento en Google Cloud.
