# 🦷 CORONYX DENTAL SaaS — ROADMAP MAESTRO FULLSTACK
> **Sistema Integral de Gestión Odontológica Multi-Clínica con Asistencia de Inteligencia Artificial**  
> **Backend:** Spring Boot 3 / Java 21 / PostgreSQL 17 / Flyway  
> **Frontend:** React 18 / TypeScript / Vite / Tailwind CSS / Lucide Icons  
> **Arquitectura:** SaaS Multi-Tenant con Aislamiento Lógico por Sede (`clinica_id`)

---

## 📑 TABLA DE CONTENIDOS
1. [Arquitectura SaaS y Segregación de Datos](#1-arquitectura-saas-y-segregación-de-datos)
2. [Matriz de Roles y Vistas (RBAC)](#2-matriz-de-roles-y-vistas-rbac)
3. [Mapa de Fases y Estado de Avance](#3-mapa-de-fases-y-estado-de-avance)
4. [Detalle Exhaustivo por Fase (Sprint por Sprint)](#4-detalle-exhaustivo-por-fase)
   - [Fase 0: Cimientos Multi-Tenant & Persistencia (BD)](#fase-0-cimientos-multi-tenant--persistencia)
   - [Fase 1: Módulo de Pacientes & Admisión](#fase-1-módulo-de-pacientes--admisión)
   - [Fase 2: Agenda y Turnos Odontológicos (Citas)](#fase-2-agenda-y-turnos-odontológicos)
   - [Fase 3: Consulta Médica, Evolución y Recetas Farmacológicas](#fase-3-consulta-médica-evolución-y-recetas)
   - [Fase 4: Odontograma Digital Interactivo (Sistema FDI)](#fase-4-odontograma-digital-interactivo)
   - [Fase 5: Imágenes Clínicas & Asistencia Diagnóstica con IA](#fase-5-imágenes-clínicas--asistencia-con-ia)
   - [Fase 6: Administración de la Clínica & Métricas Operativas](#fase-6-administración-de-la-clínica)
   - [Fase 7: Portal del Paciente & Notificaciones Transaccionales](#fase-7-portal-del-paciente--notificaciones)
   - [Fase 8: Plataforma SaaS Global (Super Admin)](#fase-8-plataforma-saas-global)
5. [Guía de Pruebas y Enlaces a Recursos](#5-guía-de-pruebas-y-enlaces)

---

## 1. ARQUITECTURA SAAS Y SEGREGACIÓN DE DATOS

El sistema implementa el patrón **Shared Database, Shared Schema with Tenant Discriminator (`clinica_id`)**:

* **Tenant Raíz:** Cada consultorio, franquicia o policlínico dental es un registro en la tabla `clinica`.
* **Aislamiento Estricto:** Toda tabla operativa (`paciente`, `cita`, `atencion_clinica`, `version_odontograma`, `archivo_adjunto`) contiene la clave foránea obligatoria `clinica_id UUID NOT NULL` y llaves compuestas `UNIQUE (clinica_id, id)`.
* **Membresía Multi-Sede:** Los usuarios existen de forma global en `usuario`, pero sus roles y permisos se asignan por sede en `usuario_clinica`. Un odontólogo puede trabajar en la *Sede Central* y en la *Sede Miraflores* con horarios independientes.

```
                  ┌──────────────────────────────┐
                  │    CORONYX SAAS PLATFORM     │
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
┌───────────────────┐                           ┌───────────────────┐
│  CLÍNICA SEDE A   │                           │  CLÍNICA SEDE B   │
├───────────────────┤                           ├───────────────────┤
│ • Pacientes (A)   │  <--- AISLAMIENTO --->    │ • Pacientes (B)   │
│ • Citas (A)       │      (clinica_id)         │ • Citas (B)       │
│ • Odontogramas (A)│                           │ • Odontogramas (B)│
└───────────────────┘                           └───────────────────┘
```

---

## 2. MATRIZ DE ROLES Y VISTAS (RBAC)

| Rol | Alcance de Negocio | Vistas Principales en el Frontend | Endpoints Backend |
| :--- | :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Dueño del SaaS. Gestión global de clínicas, suscripciones y telemetría de IA. | `/superadmin/clinicas`<br>`/superadmin/metricas` | `/api/v1/superadmin/**` |
| **`ADMIN_CLINICA`** | Gerente o Director de la sede. Contratación de personal, sillones y reportes financieros. | `/admin/dashboard`<br>`/admin/personal`<br>`/admin/pacientes` | `/api/v1/admin/**`<br>`/api/v1/patients/**` |
| **`ODONTOLOGO`** | Especialista clínico. Diagnóstico, odontograma, recetas e IA sobre rayos X. | `/odontologo/agenda`<br>`/odontologo/consulta/:id`<br>`/odontologo/odontograma` | `/api/v1/atenciones/**`<br>`/api/v1/odontogramas/**`<br>`/api/v1/archivos/**` |
| **`RECEPCIONISTA`** | Admisión y counter. Registro de pacientes, agendamiento de citas y confirmación de turnos. | `/recepcion/citas`<br>`/recepcion/pacientes`<br>`/recepcion/admision` | `/api/v1/patients/**`<br>`/api/v1/citas/**` |
| **`PACIENTE`** | Cliente final. Consulta de turnos agendados y descarga de recetas emitidas en PDF. | `/portal/mis-citas`<br>`/portal/mis-recetas` | `/api/v1/portal/**`<br>`/api/v1/notificaciones/**` |

---

## 3. MAPA DE FASES Y ESTADO DE AVANCE

- [x] **Fase 0:** Base de Datos Relacional y Migraciones Flyway (PostgreSQL 17, 12 tablas + RBAC)
- [x] **Fase 1 (Backend):** CRUD de Pacientes con 20 campos, validaciones internacionales y formato clínico
- [x] **Fase 1 (Frontend):** Sincronización del Modal "+ Nuevo Paciente" y tabla de directorio médico
- [x] **Fase 2 (Backend):** Módulo de Agenda y Citas Odontológicas (Anti-double-booking, estados y asistencia)
- [x] **Fase 2 (Frontend):** Calendario de turnos semanal/diario y agendador visual de citas con detección 409
- [ ] **Fase 3:** Consulta Médica, Evolución Inmutable y Receta Farmacológica Digital
- [ ] **Fase 4:** Odontograma Digital Interactivo 2D/3D (32 piezas, 5 caras, estándar FDI)
- [ ] **Fase 5:** Visor de Rayos X y Asistente Diagnóstico con Inteligencia Artificial (JSONB)
- [ ] **Fase 6:** Administración de la Sede, Gestión de Odontólogos y Cuadro de Mando
- [ ] **Fase 7:** Portal de Autoservicio del Paciente y Notificaciones Transaccionales (SMS/Email)
- [ ] **Fase 8:** Plataforma de Suscripción SaaS Global y Telemetría de Servidores

---

## 4. DETALLE EXHAUSTIVO POR FASE

---

### FASE 0: Cimientos Multi-Tenant & Persistencia
* **Estado:** ✅ Completado
* **Archivos clave:**
  * `V1__initial_schema.sql`
  * `V2__seed_users_and_roles.sql`
  * `V3__add_patient_extended_fields.sql`
* **Entregables:**
  * 12 tablas normalizadas con claves primarias UUID nativas (128 bits binarios).
  * Extensión `pgcrypto` para criptografía y `gen_random_uuid()`.
  * Índices B-Tree optimizados e índice GIN sobre hallazgos de IA.

---

### FASE 1: Módulo de Pacientes & Admisión
* **Objetivo:** Registro integral y validado de la historia y ficha del paciente odontológico.
* **Roles:** `RECEPCIONISTA`, `ODONTOLOGO`, `ADMIN_CLINICA`.
* **Tablas:** `paciente` (20 columnas totales).

#### ⚙️ Backend (Spring Boot):
* **Controlador:** `PatientController.java`
* **Servicio:** `PatientService.java`
* **DTO:** `PatientDto.java`
* **Endpoints:**
  ```http
  POST   /api/v1/patients         -> Crea un nuevo paciente con validaciones estrictas
  GET    /api/v1/patients         -> Lista todos los pacientes ordenados por fecha desc
  GET    /api/v1/patients/{id}    -> Obtiene ficha completa por UUID
  PUT    /api/v1/patients/{id}    -> Actualiza campos editables del paciente
  PATCH  /api/v1/patients/{id}/archive -> Baja lógica (estado = 'ARCHIVADO')
  ```
* **Reglas de Negocio Implementadas:**
  * `DNI`: Exactamente 8 dígitos numéricos.
  * `CE`: 9 a 12 caracteres alfanuméricos.
  * `PASAPORTE`: 6 a 12 caracteres alfanuméricos.
  * `CC` (Colombia/Latam): 6 a 10 dígitos numéricos.
  * **Edad válida:** Mínimo 5 años cumplidos, máximo 100 años.
  * Manejador global de excepciones con respuesta estructurada HTTP 400 (`MethodArgumentNotValidException`).

#### 🎨 Frontend (React + TypeScript):
* **Vistas:** `src/pages/PacientePerfil.tsx`, `src/pages/Patients.tsx`
* **Servicio:** `src/services/patientService.ts`
* **Componentes Implementados/Alineados:**
  * Modal `ModalNuevoPaciente`:
    * División de campos en `Nombres *` y `Apellidos *`.
    * Desplegable de documentos con limitador de dígitos y sanitización en vivo.
    * Selector de EPS (`EsSalud`, `SIS`, `Rímac`, `Pacífico`, `Mapfre`, `Sanitas`, `PARTICULAR`).
    * Selector de tipo de sangre (`O+`, `A+`, etc., y `POR DETERMINAR`).
    * Control de fecha de nacimiento con `min` y `max` (edad 5 a 100 años).
    * Renderizado dinámico de errores HTTP 400 bajo cada input.

---

### FASE 2: Agenda y Turnos Odontológicos
* **Objetivo:** Gestión eficiente de citas por sillón dental y odontólogo, evitando cruces de horarios.
* **Roles:** `RECEPCIONISTA` (Gestión total) | `ODONTOLOGO` (Agenda propia) | `ADMIN_CLINICA` | `PACIENTE` (Consulta).
* **Tablas:** `cita`, `paciente`, `usuario_clinica`, `clinica`.

#### ⚙️ Backend (Spring Boot):
* **Controlador:** `AppointmentController.java` (`/api/v1/citas`)
* **Servicio:** `AppointmentService.java`
* **DTOs:** `AppointmentRequestDto`, `AppointmentResponseDto`, `AppointmentEstadoDto`, `AppointmentAsistenciaDto`
* **Endpoints:**
  ```http
  POST   /api/v1/citas                       -> Reserva de cita con validación anti-solapamiento
  GET    /api/v1/citas                       -> Citas por rango de fechas [desde, hasta]
  GET    /api/v1/citas/odontologo/{doctorId} -> Agenda filtrada por doctor
  GET    /api/v1/citas/paciente/{pacienteId} -> Historial de citas del paciente
  PATCH  /api/v1/citas/{id}/estado           -> Cambia estado (PROGRAMADA, CONFIRMADA, EN_ATENCION, FINALIZADA, CANCELADA)
  PATCH  /api/v1/citas/{id}/asistencia       -> Marca ASISTIO o NO_SHOW
  PUT    /api/v1/citas/{id}/reprogramar      -> Reprograma horario (nuevoInicio, nuevoFin)
  ```
* **Reglas de Negocio:**
  * `ck_cita_fechas`: `fin_en > inicio_en`.
  * Validación Java: Ningún odontólogo puede tener dos citas que colisionen en horario:
    `COUNT(c) WHERE c.odontologo_id = :docId AND c.estado != 'CANCELADA' AND (c.inicio_en < :fin AND c.fin_en > :inicio) == 0`.

#### 🎨 Frontend (React + TypeScript):
* **Página:** `src/pages/Agenda.tsx`
* **Servicio:** `src/services/appointmentService.ts`
* **Tipos:** `src/types/appointment.ts`
* **Modal:** `src/components/agenda/AgendarCitaModal.tsx`
* **Componentes:**
  * Rejilla de turnos semanal/diaria limpia con horas (08:00 a 19:00).
  * Filtro por doctor conectado a `/api/v1/auth/users`.
  * Drawer lateral `PatientPanel` con acciones rápidas (Confirmar, Atender, Finalizar, Asistió, Reprogramar, Cancelar).
  * Modal `AgendarCitaModal` con cálculo automático de 45 minutos y detección en tiempo real de conflicto HTTP 409.

---

### FASE 3: Consulta Médica, Evolución y Recetas
* **Objetivo:** Registro médico legal inmutable de la atención odontológica y prescripción de fármacos.
* **Roles:** `ODONTOLOGO` (Exclusivo).
* **Tablas:** `atencion_clinica`, `version_atencion_clinica`.

#### ⚙️ Backend (Spring Boot):
* **Controlador:** `AtencionClinicaController.java` (`/api/v1/atenciones`)
* **Endpoints:**
  ```http
  POST   /api/v1/atenciones                  -> Inicia la sesión clínica desde una cita
  POST   /api/v1/atenciones/{id}/versiones   -> Guarda borrador o versión de evolución médica
  PATCH  /api/v1/atenciones/{id}/firmar      -> Firma y confirma la atención (bloqueo inmutable)
  GET    /api/v1/atenciones/paciente/{pacId} -> Historial clínico completo del paciente
  ```
* **Estructura de Datos (`version_atencion_clinica`):**
  * `diagnostico`: Diagnóstico clínico y codificación CIE-10 dental.
  * `procedimientos`: Procedimientos aplicados (ej. pulpectomía cameral, profilaxis).
  * `recetas_prescripciones`: Medicación detallada (Fármaco, presentación, dosis y duración).
  * `indicaciones`: Pautas postoperatorias para el paciente.

#### 🎨 Frontend (React + TypeScript):
* **Página:** `src/pages/ConsultaAtencion.tsx`
* **Componentes:**
  * `HeaderAlertaMedica.tsx`: Banner superior con Alergias y Enfermedades preexistentes en rojo.
  * `EditorRecetaMedica.tsx`: Añadir medicamentos con autocompletado y cálculo de días.
  * Botón `ExportarPDFReceta.tsx`: Genera el PDF membretado de la clínica con la firma del odontólogo listo para imprimir o enviar por WhatsApp.

---

### FASE 4: Odontograma Digital Interactivo
* **Objetivo:** Mapeo anatómico digital de las 32 piezas dentales adultas y 20 temporales (FDI).
* **Roles:** `ODONTOLOGO` (Edición y firma) | `PACIENTE` (Solo visualización).
* **Tablas:** `version_odontograma`, `hallazgo_odontograma`.

#### ⚙️ Backend (Spring Boot):
* **Controlador:** `OdontogramaController.java` (`/api/v1/odontogramas`)
* **Endpoints:**
  ```http
  GET    /api/v1/odontogramas/paciente/{pacienteId}/actual -> Último estado dental consolidado
  POST   /api/v1/odontogramas/paciente/{pacienteId}        -> Genera nueva versión histórica
  POST   /api/v1/odontogramas/versiones/{vId}/hallazgos    -> Agrega/actualiza hallazgo en una cara
  DELETE /api/v1/odontogramas/hallazgos/{hallazgoId}       -> Elimina o rectifica un hallazgo
  ```
* **Diccionario de Condiciones Odontológicas:**
  * Caras: `MESIAL`, `DISTAL`, `OCLUSAL`, `VESTIBULAR`, `LINGUAL`, `GENERAL`.
  * Condiciones: `CARIES`, `OBTURACION_RESINA`, `OBTURACION_AMALGAMA`, `CORONA`, `ENDODONCIA`, `FRACTURA`, `AUSENTE`, `DIENTE_SANO`.

#### 🎨 Frontend (React + TypeScript):
* **Componente:** `src/components/odontograma/OdontogramaCanvas.tsx`
* **Características Visuales:**
  * 32 piezas representadas en SVG geométrico con 5 polígonos interactivos por diente.
  * Paleta de acciones con colores normados:
    * 🔴 Rojo: Patología activa (Caries, diente fracturado).
    * 🔵 Azul: Tratamiento ya ejecutado (Resina en buen estado).
    * ❌ Cruz negra sobre la pieza: Diente ausente o extraído.
    * 🟡 Amarillo: Corona o prótesis dental fija.
  * Historial comparativo: Slider temporal para ver cómo estaban los dientes hace 6 meses vs hoy.

---

### FASE 5: Imágenes Clínicas & Asistencia con IA
* **Objetivo:** Almacenamiento seguro de radiografías periapicales/panorámicas y detección automática de caries mediante visión artificial.
* **Roles:** `ODONTOLOGO` (Revisión y validación) | `ADMIN_CLINICA`.
* **Tablas:** `archivo_adjunto` (con campo `JSONB` e índice GIN).

#### ⚙️ Backend (Spring Boot):
* **Controlador:** `ArchivoClinicoController.java` (`/api/v1/archivos`)
* **Endpoints:**
  ```http
  POST   /api/v1/archivos/subir               -> Carga de imagen (MultipartFile)
  POST   /api/v1/archivos/{id}/analizar-ia    -> Ejecuta/simula modelo IA y guarda hallazgos en JSONB
  PATCH  /api/v1/archivos/{id}/revision-ia    -> Odontólogo dictamina: ACEPTADO, RECHAZADO o CORREGIDO
  GET    /api/v1/archivos/paciente/{pacienteId}-> Galería de radiografías y fotos del paciente
  ```
* **Estructura del Payload JSONB (`ia_hallazgos_json`):**
  ```json
  {
    "modelo": "DentAI-Caries-v2.4",
    "fechaInferencia": "2026-10-04T10:15:00Z",
    "hallazgos": [
      {
        "pieza": "36",
        "cara": "OCLUSAL",
        "probabilidad": 0.94,
        "severidad": "PROFUNDA",
        "coordenadas": { "x": 120, "y": 340, "ancho": 45, "alto": 50 }
      }
    ]
  }
  ```

#### 🎨 Frontend (React + TypeScript):
* **Componente:** `src/components/ia/VisorRadiografiaIA.tsx`
* **Herramientas:**
  * Filtro de contraste e inversión de color para visualización ósea.
  * Capa interactiva de cajas delimitadoras (Bounding Boxes) sobre los dientes detectados con caries.
  * Panel lateral de confirmación: *"La IA detectó Caries en Pieza 36 (94% confianza) -> [ Aceptar ] [ Descartar ]"*.

---

### FASE 6: Administración de la Clínica
* **Objetivo:** Control operativo y gerencial de la clínica: contratación de doctores, configuración de sillones y reportes de rentabilidad.
* **Roles:** `ADMIN_CLINICA` (Exclusivo).
* **Tablas:** `usuario_clinica`, `usuario`, `rol`, `clinica`.

#### ⚙️ Backend (Spring Boot):
* **Controlador:** `AdminClinicaController.java` (`/api/v1/admin`)
* **Endpoints:**
  ```http
  GET    /api/v1/admin/personal          -> Lista de odontólogos y recepcionistas de la sede
  POST   /api/v1/admin/personal          -> Da de alta a un nuevo doctor en la clínica
  PATCH  /api/v1/admin/personal/{id}     -> Activa/Desactiva personal o cambia rol
  GET    /api/v1/admin/metricas-mensuales-> Citas totales, tasa de ausentismo (No-Show) e ingresos
  ```

#### 🎨 Frontend (React + TypeScript):
* **Páginas:**
  * `src/pages/admin/PersonalPage.tsx`: Directorio de doctores con horarios asignados.
  * `src/pages/admin/DashboardMetricas.tsx`: Gráficos con Recharts (Citas por semana, tratamientos más frecuentes).

---

### FASE 7: Portal del Paciente & Notificaciones
* **Objetivo:** Empoderar al paciente con acceso a sus citas, indicaciones y recetas desde su smartphone o computadora.
* **Roles:** `PACIENTE`.
* **Tablas:** `notificacion`, `cita`, `version_atencion_clinica`.

#### ⚙️ Backend (Spring Boot):
* **Controlador:** `PortalPacienteController.java` (`/api/v1/portal`)
* **Endpoints:**
  ```http
  GET    /api/v1/portal/mis-citas        -> Próximas citas agendadas e historial
  GET    /api/v1/portal/mis-recetas      -> Recetas emitidas con botón de descarga
  GET    /api/v1/notificaciones          -> Bandeja de avisos transaccionales
  PATCH  /api/v1/notificaciones/{id}/leer-> Marca notificación como leída
  ```

#### 🎨 Frontend (React + TypeScript):
* **Página:** `src/pages/portal/PortalPaciente.tsx`
* **Características:**
  * Interfaz limpia y responsiva adaptada a móviles.
  * Botón directo: *"Descargar receta de mi última cita (PDF)"*.
  * Recordatorios automáticos en pantalla de su próxima visita.

---

### FASE 8: Plataforma SaaS Global (Super Admin)
* **Objetivo:** Gestión global de las clínicas suscritas, cobro de licencias SaaS y auditoría de infraestructura.
* **Roles:** `SUPER_ADMIN` (Exclusivo).
* **Tablas:** `clinica`, `usuario`, `rol`.

#### ⚙️ Backend y Frontend:
* `POST /api/v1/superadmin/clinicas`: Alta de una nueva clínica dental cliente del software.
* `PATCH /api/v1/superadmin/clinicas/{id}/estado`: Suspender clínica por mora o mantenimiento.
* Monitor de consumo de almacenamiento de radiografías y llamadas a la API de IA.

---

## 5. GUÍA DE PRUEBAS Y ENLACES

### Recursos Disponibles en el Repositorio:
1. **Colección de Pruebas de Postman v2.1:**  
   `Coronyx_API_Collection.postman_collection.json`  
   *(Contiene scripts automáticos para guardar tokens y UUIDs al ejecutar peticiones).*
2. **Visualizador Dinámico de Datos y Flujo de Tablas:**  
   `data_flow_dashboard.html`  
   *(Abre este archivo en tu navegador para ver las 12 tablas llenas con datos clínicos verídicos).*
3. **Migraciones de Base de Datos:**  
   • `V1__initial_schema.sql` — Esquema inicial de 12 tablas  
   • `V2__seed_users_and_roles.sql` — Usuarios semilla y roles institucionales  
   • `V3__add_patient_extended_fields.sql` — Columnas `ciudad`, `tipo_sangre`, `seguro` y soporte de `CC`

### Credenciales Semilla de Prueba (Clave: `123456`):
* **Odontólogo:** `odontologo@coronyx.pe`
* **Recepcionista:** `recepcion@coronyx.pe`
* **Admin de Clínica:** `admin@coronyx.pe`
* **Super Administrador:** `superadmin@coronyx.pe`
* **Paciente de Prueba:** `paciente@coronyx.pe`
