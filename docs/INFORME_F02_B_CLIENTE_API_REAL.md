# Informe F02-B: Login, Sesión y Cliente API Real

**Módulo:** `Frontend_Dentista` (React 19, TypeScript, Vite 8, Tailwind 4)  
**Dependencia:** Contrato de seguridad de F02-A (`Backend_Dentista`)  
**Fecha:** 2026-10-10  
**Estado:** COMPLETADO Y VERIFICADO (Build Vite exitoso + 49/49 pruebas automatizadas pasando)

---

## 1. Resumen Ejecutivo de Implementación

En cumplimiento de los requerimientos de **F02-B** y los controles **G01** (Autenticación real) y **G02** (Permisos y separación de datos):

1. **Eliminación Total de `DEMO_ACCOUNTS` como Bypass y Fallback de Autenticación**:
   - Se removió el bloque de `catch` en `Login.tsx` que abría sesiones ficticias locales cuando fallaba la API o no había conexión.
   - Si la API rechaza credenciales o se encuentra caída, se muestra el error real de la API o `"No se pudo conectar con el servidor..."`. **Bajo ninguna circunstancia se abre sesión**.
   - Los botones de cuentas en la pantalla de inicio de sesión funcionan exclusivamente como asistente de autocompletado rápido de campos (`email` y `password`), requiriendo que la petición sea procesada y autorizada por la API PostgreSQL real al pulsar "Ingresar".
2. **Eliminación de Sesiones Inventadas en `AuthContext`**:
   - Se eliminó el método `login(role: Role)` que fabricaba identidades falsas (`'1'`, `'Institucional'`).
   - El acceso se gestiona exclusivamente a través de `loginWithSession(session: LoginResponse)`, garantizando que el usuario tenga un token JWT emitido por el backend, un `usuarioId` y un `usuarioClinicaId` reales.
3. **Bloqueo del Bypass por `localStorage`**:
   - Se eliminó la lógica en `ProtectedRoute.tsx` y `PublicRoute.tsx` que concedía acceso si existía un valor en `localStorage.getItem('coronyx_role')`.
   - Modificar manualmente `coronyx_role` en las herramientas de desarrollo no otorga acceso: las rutas protegidas exigen un objeto de sesión validado con token JWT y revalidación en tiempo real.
4. **Cliente HTTP Centralizado (`apiClient.ts`) con Gestión de Bearer y 401**:
   - `apiClient.ts` inyecta automáticamente el encabezado `Authorization: Bearer <token>`.
   - Intercepta centralizadamente respuestas `401 Unauthorized` (token vencido, firma corrupta o cuenta desactivada en BD):
     - Limpia de inmediato `coronyx_jwt_token`, `coronyx_user` y `coronyx_role`.
     - Emite un evento global `'coronyx:unauthorized'` que hace que `AuthContext` cierre la sesión en memoria y redirija al usuario a `/login`.
5. **Restauración y Revalidación de Sesión con `GET /api/v1/auth/me`**:
   - En el montaje de la aplicación (`AuthProvider`), si existe un token en almacenamiento local, se ejecuta `getMeFromApi()`.
   - Si el backend confirma la validez de la sesión, se actualiza el estado de identidad en tiempo real con datos de BD.
   - Si la revalidación falla (token expirado o usuario desactivado), se limpia el almacenamiento y el usuario es devuelto a `/login`.
   - Se agregó un estado `isRestoringSession` para evitar parpadeos o redirecciones prematuras durante la verificación.
6. **Inclusión de `ADMIN_CLINICA` en Ficha Administrativa de Pacientes**:
   - En `AppRouter.tsx`, se habilitó la ruta `/app/pacientes` para `ADMIN_CLINICA`:
     `<ProtectedRoute allowedRoles={['ODONTOLOGO', 'RECEPCIONISTA', 'ADMIN_CLINICA']}>`.
   - En `DashboardLayout.tsx`, se añadió `'pacientes'` a `ROLE_MODULES['ADMIN_CLINICA']`.
   - En `PacientePerfil.tsx`:
     - **Separación de pestañas por privilegios:**
       - `ODONTOLOGO`: Accede a todas las pestañas (`Resumen`, `Historia clínica`, `Odontograma`, `Radiografías`, `Documentos`).
       - `ADMIN_CLINICA` y `RECEPCIONISTA`: Acceden exclusivamente a pestañas administrativas (`Resumen`, `Documentos`).
     - **Enmascaramiento clínico en Ficha Completa (G02):**
       - Para `ADMIN_CLINICA` y `RECEPCIONISTA`, los campos clínicos (`alergias`, `antecedentes`, `medicamentos`) muestran una advertencia de exclusión por privacidad asistencial (Control G02).
       - Para `ODONTOLOGO`, se visualizan los antecedentes y alergias completos.
7. **Directorio `/api/v1/auth/users` (`fetchUsersFromApi`) con Autorización**:
   - `fetchUsersFromApi()` envía el encabezado Bearer y valida contratos de IDs decimal string.
   - Si un usuario no autorizado (`RECEPCIONISTA` u `ODONTOLOGO`) interactúa con la agenda, la UI no colapsa: para el odontólogo se resuelve automáticamente su propio perfil de doctor autenticado a partir de su sesión.
8. **Preservación de Vistas Futuras**:
   - Los módulos excluidos del incremento operativo (`SuperAdminPortal.tsx`, IA, teleconsulta, caja, inventario) se conservan intactos en sus respectivos archivos sin vincularlos a los flujos operativos de las 4 cuentas.

---

## 2. Matriz de Pruebas de Verificación UI y API (49/49 Pasadas)

Se ejecutó la suite de integración de cliente [test_f02_b_frontend_auth.mjs](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/test_f02_b_frontend_auth.mjs) contra el backend local activo en `http://localhost:8081/api/v1`:

```text
======================================================
--- INICIO DE PRUEBAS F02-B: CLIENTE API Y SEGURIDAD ---
======================================================

--- Caso 1: Login de las 4 cuentas institucionales reales ---
  ✓ Login odontologo@coronyx.pe responde HTTP 200 OK
  ✓ Rol esperado ODONTOLOGO coincide con recibido ODONTOLOGO
  ✓ ID de usuario (1) es decimal string positivo
  ✓ usuarioId (1) es decimal string positivo
  ✓ Token JWT retornado y no nulo
  ✓ usuarioClinicaId (1) es decimal string
  ✓ clinicaId (1) es decimal string
  ✓ Login recepcion@coronyx.pe responde HTTP 200 OK
  ✓ Rol esperado RECEPCIONISTA coincide con recibido RECEPCIONISTA
  ✓ ID de usuario (2) es decimal string positivo
  ✓ usuarioId (2) es decimal string positivo
  ✓ Token JWT retornado y no nulo
  ✓ usuarioClinicaId (2) es decimal string
  ✓ clinicaId (1) es decimal string
  ✓ Login admin@coronyx.pe responde HTTP 200 OK
  ✓ Rol esperado ADMIN_CLINICA coincide con recibido ADMIN_CLINICA
  ✓ ID de usuario (3) es decimal string positivo
  ✓ usuarioId (3) es decimal string positivo
  ✓ Token JWT retornado y no nulo
  ✓ usuarioClinicaId (3) es decimal string
  ✓ clinicaId (1) es decimal string
  ✓ Login paciente@coronyx.pe responde HTTP 200 OK
  ✓ Rol esperado PACIENTE coincide con recibido PACIENTE
  ✓ ID de usuario (4) es decimal string positivo
  ✓ usuarioId (4) es decimal string positivo
  ✓ Token JWT retornado y no nulo

--- Caso 2: Login con clave incorrecta (no abre sesión) ---
  ✓ Clave incorrecta es rechazada con HTTP 400 Bad Request (recibido 400)
  ✓ Mensaje explícito recibido: "Credenciales incorrectas: la contraseña ingresada no coincide"

--- Caso 3: Login con correo no registrado (no abre sesión) ---
  ✓ Usuario inexistente es rechazado con HTTP 400 Bad Request
  ✓ Mensaje explícito recibido: "Credenciales incorrectas: no existe un usuario registrado con este correo"

--- Caso 4: Conexión a API caída / host no alcanzable ---
  ✓ Petición a API caída arroja excepción de red y NO crea sesión

--- Caso 5: Restauración de sesión con GET /api/v1/auth/me ---
  ✓ GET /auth/me con token válido retorna 200 OK
  ✓ Rol en /auth/me es ODONTOLOGO
  ✓ usuarioId es decimal string (1)
  ✓ usuarioClinicaId es decimal string (1)
  ✓ Endpoint /auth/me NO expone token en el body (contrato acordado)
  ✓ GET /auth/me sin token retorna 401 Unauthorized
  ✓ GET /auth/me con token corrupto retorna 401 Unauthorized

--- Caso 6: Directorio /auth/users con control RBAC ---
  ✓ ADMIN_CLINICA autorizado para consultar /auth/users (HTTP 200 OK)
  ✓ Directorio devuelve 5 miembros
  ✓ Todos los usuarios del directorio poseen ID decimal string
  ✓ RECEPCIONISTA rechazado en /auth/users con HTTP 403 Forbidden
  ✓ ODONTOLOGO rechazado en /auth/users con HTTP 403 Forbidden
  ✓ /auth/users sin token retorna HTTP 401 Unauthorized

--- Caso 7: Exclusión de datos clínicos para rol administrativo ---
  ✓ ADMIN_CLINICA consulta paciente 1 con HTTP 200
  ✓ alergias está excluida (null) para ADMIN_CLINICA
  ✓ antecedentesMedicos está excluida (null) para ADMIN_CLINICA
  ✓ ODONTOLOGO consulta paciente 1 con HTTP 200
  ✓ ODONTOLOGO recibe alergias completas ("Penicilina")

======================================================
--- RESUMEN: 49 pruebas pasadas, 0 fallos ---
======================================================
```

---

## 3. Verificación de Compilación y Tipado

La compilación de producción con Vite (`npm run build`) se ejecutó exitosamente:

```text
> coronyx-frontend@1.0.0 build
> vite build

vite v8.2.2 building client environment for production...
transforming...
✓ 58 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                         0.42 kB │ gzip:   0.29 kB
dist/assets/coronixlogo-DJuPJdUE.png   59.04 kB
dist/assets/index-CVWSHRwb.css         94.64 kB │ gzip:  14.62 kB
dist/assets/index-oxsXZYnM.js         758.18 kB │ gzip: 206.06 kB
✓ built in 930ms
```

---

## 4. Archivos Modificados / Creados

1. [apiClient.ts](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/src/services/apiClient.ts): Cliente HTTP centralizado con token Bearer, captura de 401 e invalidación reactiva de sesión.
2. [authService.ts](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/src/services/authService.ts): `loginWithApi`, `getMeFromApi` y `fetchUsersFromApi` integrados con `apiClient`.
3. [AuthContext.tsx](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/src/contexts/AuthContext.tsx): Eliminado login demo; revalidación activa contra `/auth/me` en el montaje; escucha eventos de 401.
4. [ProtectedRoute.tsx](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/src/routes/ProtectedRoute.tsx): Eliminado bypass por `localStorage.getItem('coronyx_role')`; espera activa durante revalidación.
5. [PublicRoute.tsx](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/src/routes/PublicRoute.tsx): Bloqueo estricto basado en sesión real validada.
6. [Login.tsx](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/src/pages/Login.tsx): Eliminado fallback demo; atajos convertidos en autocompletado del formulario para cuentas reales `@coronyx.pe` con clave `123456`.
7. [AppRouter.tsx](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/src/routes/AppRouter.tsx): Habilitada ruta `/app/pacientes` para `ADMIN_CLINICA`.
8. [DashboardLayout.tsx](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/src/layouts/DashboardLayout.tsx): Añadido módulo `'pacientes'` a `ADMIN_CLINICA`; visualización de nombre real del usuario y sede.
9. [PacientePerfil.tsx](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/src/pages/PacientePerfil.tsx): Separación de pestañas clínicas vs. administrativas; enmascaramiento de datos clínicos en la Ficha Completa para personal administrativo (Control G02).
10. [Agenda.tsx](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/src/pages/Agenda.tsx) y [AgendarCitaModal.tsx](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/src/components/agenda/AgendarCitaModal.tsx): Manejo robusto de autorización de doctores.
11. [test_f02_b_frontend_auth.mjs](file:///c:/Users/USER/Desktop/CoronyxProyecto/Frontend_Dentista/test_f02_b_frontend_auth.mjs): Suite de pruebas de integración HTTP.
