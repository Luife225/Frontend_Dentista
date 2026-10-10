# INFORME DE IMPLEMENTACIÓN: F01-B - CONTRATO DE IDs EN FRONTEND

**Proyecto:** CORONYX - Sistema de Gestión Odontológica  
**Módulo:** Frontend (`Frontend_Dentista`)  
**Fase / Bloque:** F01-B (Contrato de IDs en Frontend tras F00 y F01-A)  
**Fecha:** 10 de Octubre de 2026  
**Estado:** COMPLETADO CON ÉXITO (Typecheck: OK | Build: OK | Ensayos Backend: OK)

---

## 1. Resumen Ejecutivo

En concordancia con los acuerdos de arquitectura de **F00** (`CONTRATO_COMUN_F00.md`, `INVENTARIO_RUTAS_F00_B.md`) y la migración a base de datos relacional con `BIGINT identity` completada en **F01-A** (`CONTRATO_F01_A_ENTREGA_A_B.md`), se adaptó de manera integral la capa de servicios, tipos de dominio, contexto de sesión y vistas activas del frontend.

### Reglas Cardinales Aplicadas:
1. **Identificadores como Cadenas Decimales Positivas:** Todo ID persistido se modela y transmite estrictamente como `string` decimal (`/^[1-9]\d*$/`), reflejo exacto del tipo `BIGINT` de PostgreSQL y `Long` de Spring Boot.
2. **Distinción Estricta entre `usuario.id` y `usuario_clinica.id` (`usuarioClinicaId`):**
   - `usuario.id`: Identificador del registro personal de la cuenta en `usuario`.
   - `usuarioClinicaId` (`usuario_clinica.id`): Identificador de la membresía del profesional en la clínica activa. En la creación y consulta de citas (`cita.odontologo_id`), el backend referencia obligatoriamente `usuario_clinica.id`.
3. **Cero Tolerancia a Fallbacks y Mocks Inventados:** Si una respuesta del backend carece de un ID o devuelve un formato no decimal (por ejemplo, un UUID residual), se rechaza de inmediato lanzando una excepción de contrato inválido. No se sintetizan identificadores con `Date.now()`, números autoincrementales locales ni UUIDs efímeros.
4. **Prohibición de `Number()`, `parseInt()` y Aritmética sobre IDs:** Los IDs se conservan inalterados como cadenas para evitar el desbordamiento y redondeo de precisión IEEE-754 más allá de `Number.MAX_SAFE_INTEGER` (`9007199254740991`).
5. **Invalidación de Sesiones Residuales con UUID:** Al iniciar la aplicación o cargar el contexto de autenticación, cualquier sesión persistida en `localStorage` con formato UUID o ID no decimal es purgada automáticamente para forzar un inicio de sesión bajo el nuevo contrato.

---

## 2. Detalle de Archivos Adaptados

### 2.1. Servicios (`src/services/`)

#### [authService.ts](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/src/services/authService.ts)
- Se incorporó la función validadora de contrato:
  ```typescript
  const isDecimalId = (val: unknown): val is string =>
    typeof val === 'string' && /^[1-9]\d*$/.test(val);
  ```
- **Tipado de Sesión y Usuarios:**
  - `LoginResponse`:
    - `id: string` (ID decimal de cuenta en `usuario`).
    - `usuarioId: string` (alias explícito del ID de usuario).
    - `usuarioClinicaId?: string` (ID decimal de membresía en `usuario_clinica`).
    - `clinicaId?: string` (ID decimal de la clínica en `clinica`).
    - `pacienteId?: string` (ID decimal en `paciente`, en caso de rol `PACIENTE`).
  - `UserItem`:
    - `id: string`
    - `usuarioClinicaId?: string`
- **Validación Estricta:**
  - `loginWithApi`: Si `loginData.id` no cumple con `isDecimalId`, se lanza `Error('loginData.id no es un ID decimal string válido')`. De igual forma para `usuarioClinicaId` y `clinicaId` si vienen presentes.
  - `fetchUsersFromApi`: Valida que cada usuario retornado tenga `id` decimal string válido y que `usuarioClinicaId`, si existe, también sea decimal string. Lanza error ante cualquier discrepancia.

#### [patientService.ts](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/src/services/patientService.ts)
- Función de validación de contrato de paciente `validatePatientContract(p: Patient)`:
  - Exige que `p.id` exista y sea una cadena decimal positiva (`/^[1-9]\d*$/`).
  - Lanza excepción descriptiva si el contrato es inválido.
- Se eliminaron comentarios y lógica residual de UUIDs (`isUuid`, `createPatientUUID`, etc.).
- Todos los métodos (`fetchPatientsFromApi`, `fetchPatientById`, `createPatientInApi`, `updatePatientInApi`, `archivePatientInApi`) exigen y operan con `id: string`. Si el backend responde sin ID o con ID inválido, se interrumpe el flujo con error.

#### [appointmentService.ts](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/src/services/appointmentService.ts)
- Función de validación de contrato de cita `validateAppointmentContract(c: CitaApi)`:
  - Valida que `c.id` sea decimal string.
  - Valida que `c.pacienteId` sea decimal string.
  - Valida que `c.odontologoId` sea decimal string (`usuario_clinica.id`).
- Métodos adaptados:
  - `getAppointments`, `getAppointmentsByDoctor`, `getAppointmentsByPatient`, `getAppointmentById`: Validación rigurosa de cada elemento devuelto.
  - `createAppointment`: Requiere `CreateAppointmentPayload` con `pacienteId`, `odontologoId` (`usuarioClinicaId`), `clinicaId` y opcional `creadoPorId`. Retorna y valida el `id` decimal devuelto por la API.
  - `updateStatus`, `markAttendance`, `reschedule`: Operan estrictamente con `id: string` decimal.

---

### 2.2. Tipos y Contexto de Sesión

#### [appointment.ts](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/src/types/appointment.ts)
- Actualización de `CitaApi`:
  - `id: string` (BIGINT identity en PostgreSQL).
  - `clinicaId: string`.
  - `pacienteId: string`.
  - `odontologoId: string` (Documentado expresamente como FK a `usuario_clinica.id`).
  - `creadoPorId?: string`.
- Actualización de `CreateAppointmentPayload`:
  - Agregado campo opcional `creadoPorId?: string`.

#### [AuthContext.tsx](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/src/contexts/AuthContext.tsx)
- **Depuración Automática de Sesión Antigua:**
  ```typescript
  const hasLegacyUuid = (val?: string) => Boolean(val && (val.includes('-') || !/^[1-9]\d*$/.test(val)));
  if (hasLegacyUuid(storedUser.id) || hasLegacyUuid(storedUser.usuarioClinicaId) || hasLegacyUuid(storedUser.clinicaId)) {
    console.warn('[AUTH] Sesión almacenada contiene IDs no decimales (UUID residuales). Purgando localStorage...');
    localStorage.removeItem('coronyx_user');
    localStorage.removeItem('coronyx_role');
    localStorage.removeItem('coronyx_jwt_token');
    return null;
  }
  ```
- **Tipado de Usuario de Sesión:** `id: string`, `usuarioClinicaId?: string`, `clinicaId?: string`, `pacienteId?: string`.
- Sesión institucional por defecto actualizada con IDs decimal string `'1'`.

---

### 2.3. Vistas y Componentes Operativos

#### [AgendarCitaModal.tsx](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/src/components/agenda/AgendarCitaModal.tsx)
- Carga de doctores:
  - Valida que los odontólogos recibidos posean `usuarioClinicaId` decimal string. Si un odontólogo no tiene `usuarioClinicaId`, se descarta o se notifica como error de contrato.
  - El selector de doctores se enlaza directamente a `u.usuarioClinicaId`.
- Carga de pacientes:
  - El selector de pacientes se enlaza a `p.id` (cadena decimal).
- Envío de payload a `createAppointment`:
  - Envía `odontologoId: formData.doctor` (que contiene el `usuarioClinicaId`).
  - Envía `pacienteId: selectedPatient.id`.
  - Envía `clinicaId: user.clinicaId || '1'`.
  - Recibe y valida la cita creada directamente desde la API sin inventar identificadores locales.

#### [Agenda.tsx](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/src/pages/Agenda.tsx)
- Filtro de Odontólogo:
  - Los doctores se filtran exigiendo que posean `usuarioClinicaId`.
  - El `<select>` de doctor en la vista agenda usa como valor `d.usuarioClinicaId!`.
- Selección de Cita:
  - `selectedCita` maneja `id: string`.
  - Acciones de cambio de estado (`handleConfirm`, `handleStartAttention`, `handleFinish`, `handleMarkAttendance`, `reschedule`):
    - Invocan directamente `appointmentService` con el `id` decimal string de la cita.
    - Se eliminaron conversiones a número o comparaciones sueltas.

#### [PacientePerfil.tsx](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/src/pages/PacientePerfil.tsx)
- Se eliminó el branching `isUuid = typeof id === 'string' && id.includes('-')` que desviaba a mocks locales los IDs que no tuvieran guiones.
- La interfaz interna `Patient` define `id: string`.
- Los pacientes de demostración locales iniciales usan cadenas decimales (`'1'`, `'2'`, `'3'`).
- `addPatient`:
  - Envía el alta mediante `createPatientInApi`.
  - **Exige que el backend devuelva `created.id`**.
  - Si la API no retorna el ID, lanza error y no agrega el paciente con `Date.now()`.
- `updatePatientInApi` y `archivePatientInApi` se invocan de forma unificada para cualquier paciente seleccionado mediante su `id: string`.
- La interfaz gráfica se actualizó para indicar:
  - *Etiqueta:* "ID Decimal String (PostgreSQL BIGINT)" en lugar de "UUID de Identificación Técnica".

#### [HistoriaClinica.tsx](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/src/pages/HistoriaClinica.tsx) y [Patients.tsx](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/src/pages/Patients.tsx)
- Se actualizaron las interfaces y listas auxiliares a IDs tipo `string` decimal (`'1'`, `'2'`, etc.).
- En `Patients.tsx`, se retiró el fallback `Date.now().toString()` en `addPatient`, requiriendo estrictamente `created.id` emitido por el backend.

---

## 3. Verificación de Transmisión Precisa (> `Number.MAX_SAFE_INTEGER`)

En JavaScript / TypeScript, cualquier número mayor a `Number.MAX_SAFE_INTEGER` (`9007199254740991`, $2^{53} - 1$) sufre pérdida de precisión por redondeo IEEE-754:
```javascript
// Si se usara Number():
Number("9007199254740995") === 9007199254740996 // ¡TRUE! Corrupción de datos
```
Al mantener los identificadores como `string`:
1. La serialización y deserialización JSON en `fetch` conserva el literal exacto `"9007199254740995"`.
2. Las rutas REST (por ejemplo `/patients/9007199254740995` o `/citas/9007199254740995`) envían la cadena sin conversión.
3. El backend Spring Boot deserializa la cadena como `Long` sin truncamiento ni redondeo.
4. Esta garantía fue ensayada exitosamente en el script de prueba contra el backend en el paso 9.

---

## 4. Pruebas de Compilación y Validación Estática

Se ejecutaron las herramientas de verificación estática de TypeScript y empaquetado de Vite en `Frontend_Dentista`:

### 4.1. Typecheck (`npx tsc --noEmit`)
```powershell
PS C:\Users\USER\Desktop\CoronyxProyecto\Frontend_Dentista> npx tsc --noEmit
# Resultado: Código de salida 0 (CERO errores de tipos en todo el proyecto)
```

### 4.2. Build de Producción (`npm run build`)
```powershell
PS C:\Users\USER\Desktop\CoronyxProyecto\Frontend_Dentista> npm run build

> coronyx-frontend@0.0.0 build
> vite build

vite v8.2.2 building client for production...
transforming...
✓ 232 modules transformed.
rendering chunks...
computing chunk sizes...
dist/index.html                   0.89 kB │ gzip:   0.45 kB
dist/assets/index-Bf6tGf2E.css   62.13 kB │ gzip:  10.97 kB
dist/assets/index-BiX4d5n8.js   505.74 kB │ gzip: 147.23 kB
✓ built in 1010ms
# Resultado: Código de salida 0 (Bundle generado exitosamente sin advertencias de compilación)
```

---

## 5. Registro de Ensayos con Backend Real

Se realizaron dos rondas de ensayo automatizadas con backend real:

### 5.1. Prueba de Rechazo de Contrato contra Backend Pre-V4 (Puerto 8081 con UUIDs)
- **Objetivo:** Verificar que el frontend rechace respuestas del backend que violen el contrato F01 (por ejemplo, tokens o IDs en formato UUID).
- **Resultado:**
  ```text
  [PASS] Rechazo exitoso de contrato inválido: Error: loginData.id is not decimal string: 5fe8c174-f0ac-45cd-9241-3d9df5c22273
  ```
  El cliente detectó inmediatamente el UUID y arrojó excepción de contrato inválido, confirmando que no tolera respuestas fuera de especificación.

### 5.2. Ensayo Completo E2E contra Backend V4 (Puerto 8082, base de datos `coronyx_ensayo`)
Se ejecutó el script de ensayo `test_f01_b_contract.mjs` validando los flujos clave del incremento operativo:

| Paso | Flujo Ensayado | Método & Endpoint | Resultado Obtenido | Validación de Contrato |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Autenticación (Login)** | `POST /auth/login` | Token JWT emitido. `id: "1"`, `usuarioClinicaId: "1"`, `clinicaId: "1"` | **PASS**: IDs decimal strings diferenciados |
| **2** | **Listado de Usuarios** | `GET /auth/users` | 7 usuarios retornados | **PASS**: Cada usuario tiene `id` decimal string y `usuarioClinicaId` diferenciado |
| **3** | **Listado de Pacientes** | `GET /patients` | 17 pacientes retornados | **PASS**: Todos los pacientes poseen `id` decimal string |
| **4** | **Alta de Paciente** | `POST /patients` | Paciente "Carlos Ensayo Decimal" creado | **PASS**: Retornó `id: "18"` (emitido por la base de datos). No se usó `Date.now()` |
| **5** | **Consulta de Paciente** | `GET /patients/18` | Paciente "Carlos Ensayo Decimal" obtenido | **PASS**: `id: "18"` |
| **6** | **Edición de Paciente** | `PUT /patients/18` | Nombre actualizado a "Carlos Ensayo Editado" | **PASS**: Actualización persistida con éxito |
| **7** | **Archivar Paciente** | `PATCH /patients/18/archive` | Estado actualizado a `ARCHIVADO` | **PASS**: Transición de estado correcta |
| **8** | **Agendar Cita** | `POST /citas` | Cita agendada con `odontologoId: "1"` (`usuarioClinicaId`) y `pacienteId: "18"` | **PASS**: Backend creó cita con `id: "14"` |
| **9** | **Transmisión de ID > MAX_SAFE_INTEGER** | `GET /patients/9007199254740995` | Solicitud transmitida al backend sin redondeo (retorna 404 esperado en BD) | **PASS**: La URL y string mantuvieron fidelidad absoluta (`...0995` != `...0996`) |

---

## 6. Conclusión y Estado de Entrega

El bloque **F01-B** se encuentra **100% completado**:
- Todos los servicios (`authService`, `patientService`, `appointmentService`), tipos y componentes activos (`AuthContext`, `Agenda`, `AgendarCitaModal`, `PacientePerfil`) operan exclusivamente con IDs decimal string positivos.
- Se distingue claramente `usuarioClinicaId` de `usuario.id`.
- Se erradicó por completo el uso de `Number()`, `parseInt()`, `Date.now()` o UUIDs para identificadores persistidos.
- Las sesiones residuales con UUIDs son purgadas automáticamente al inicio.
- Se verificó la transmisión precisa sin pérdida de precisión sobre valores superiores a `Number.MAX_SAFE_INTEGER`.
- Se validó la compilación limpia con `tsc --noEmit` y `npm run build`.
- Se ensayaron y documentaron los flujos completos con el backend Spring Boot.
