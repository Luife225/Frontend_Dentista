# PROMPT PARA IA AGENTE — REDISEÑO DEL FRONTEND POR ROLES (Plataforma Odontológica)

Copia y pega el siguiente prompt completo en tu IA agente:

---

## ROL

Actúa como un **Diseñador de Producto y Frontend Lead** especializado en Angular, Angular Material y UX para aplicaciones clínicas multi-rol (web) y una app móvil ligera para pacientes. Ya existe un diseño previo del frontend orientado al odontólogo, pero recibió feedback de un profesor evaluador que debes incorporar como **cambios obligatorios**, no como sugerencias opcionales. Tu tarea es **mejorar el diseño existente del odontólogo** y **diseñar desde cero el login multi-rol y la app del paciente**.

## CONTEXTO DEL PRODUCTO

Plataforma SaaS odontológica compuesta por una **web de gestión clínica** (Admin, Odontólogo, Recepcionista) y una **app móvil de paciente**. Incluye asistente de IA por voz, análisis asistido de radiografías por ML, y teleodontología.

**Stack (respétalo):** Angular + Angular Material para la web. Para la app móvil de paciente, asume un enfoque responsive/PWA o Angular con componentes adaptados a móvil (indícalo como supuesto si el equipo aún no decide nativo vs. híbrido).

## ROLES DEL SISTEMA (ya definidos, impleméntalos en el diseño)

| Rol | Descripción | Acceso |
|---|---|---|
| **ADMIN_CLINICA** | Administra la clínica/sede | Usuarios, configuración, horarios, dashboard, supervisión general |
| **ODONTOLOGO** | Usuario clínico principal | Pacientes, historia clínica, odontograma, IA por voz, radiografías/ML, teleodontología |
| **RECEPCIONISTA** | Usuario administrativo | Pacientes (sin datos clínicos sensibles), citas, agenda, notificaciones, **inventario** |
| **PACIENTE** | Usuario de la app móvil | Su propio perfil, citas, teleodontología, documentos, pagos |
| SUPER_ADMIN | Rol futuro (SaaS multi-sede), no lo diseñes en detalle ahora, solo deja mencionado que el login debe poder soportarlo a futuro | — |

## FEEDBACK DEL PROFESOR — CAMBIOS OBLIGATORIOS SOBRE EL DISEÑO ACTUAL

Estos puntos corrigen y reemplazan cualquier decisión previa del diseño del odontólogo. Son requisitos explícitos, no omitir ninguno:

1. **Historial desde la cita:** al hacer clic en una cita programada (agenda), el usuario debe poder ver el historial del paciente asociado a esa cita. **Si el paciente es nuevo (primera vez), no debe mostrarse historial clínico** (porque no existe aún) — diseña ese estado vacío explícitamente, sin que parezca un error.
2. **Unificar Pacientes + Historia Clínica en un solo módulo:** ya no deben ser dos secciones separadas. Debe existir una única vista de "Perfil del paciente" que muestre tanto los datos de la(s) cita(s) como el historial clínico completo, integrados.
3. **Mover el Odontograma dentro del Historial del paciente:** el odontograma ya no es una sección independiente en el menú principal; debe vivir dentro del perfil/historial del paciente.
4. **Mover Radiografías dentro del Historial del paciente:** igual que el odontograma, las radiografías (carga, visualización y resultados de ML) deben integrarse dentro del perfil/historial del paciente, no como módulo aislado.
5. **Inventario pasa a Recepcionista, no al Odontólogo:** el diseño anterior lo dejaba en el flujo del dentista; corrígelo — el inventario debe estar en el menú/rol de Recepcionista.

## TU TAREA

### PARTE A — Mejora del diseño existente del Odontólogo

Rediseña la navegación y las pantallas del rol ODONTOLOGO aplicando los 5 puntos del feedback. Específicamente:

1. **Rediseño de la Agenda del odontólogo:** al hacer clic en una cita, define qué se abre (¿modal, panel lateral, o navegación a pantalla completa?) y qué contiene: datos de la cita + acceso directo al historial del paciente. Diseña el estado "paciente nuevo, sin historial" con un mensaje/acción clara (ej. invitar a crear la primera historia clínica).
2. **Nuevo módulo unificado "Perfil del Paciente":** diseña su estructura interna (tabs o secciones) que combine como mínimo: datos personales/antecedentes, historial de citas, historia clínica (motivo, diagnóstico, procedimientos, evolución), **odontograma** y **radiografías/resultados ML**, todo dentro de esta misma vista. Especifica cómo se organiza para que no se sienta sobrecargada (tabs, acordeón, scroll segmentado, etc.) y justifica la elección.
3. **Odontograma embebido:** rediseña cómo se accede al odontograma ahora que vive dentro del perfil del paciente (ya no en el menú principal) sin perder la interacción visual rica que ya tenía.
4. **Radiografías embebidas:** mismo criterio — carga, visualización de zonas detectadas por ML y su historial, dentro del perfil del paciente.
5. **Asistente de IA por voz:** conserva y ajusta su diseño para que, al usarse dentro del perfil del paciente, quede claro en qué parte del historial se registrará lo que la IA transcribe (historia clínica vs. odontograma).
6. **Teleodontología:** diseña cómo se inicia una consulta virtual desde la cita/perfil del paciente y cómo el odontólogo recibe radiografías compartidas por el paciente durante la videollamada.
7. Actualiza el menú de navegación general del odontólogo para reflejar que Pacientes+Historial+Odontograma+Radiografías ahora son un solo módulo, y que Inventario ya no aparece en su rol.

### PARTE B — Login y control de acceso multi-rol

1. Diseña una única pantalla de **login** para la web (Admin, Odontólogo, Recepcionista) y una de login separada o adaptada para la **app del paciente**.
2. Define el flujo de autenticación: login → detección de rol → redirección al dashboard/home correspondiente a cada rol.
3. Diseña el estado de "recuperar contraseña".
4. Define qué menú de navegación ve cada rol (Admin, Odontólogo, Recepcionista) según sus permisos — usa como referencia la matriz de permisos ya definida (Admin: usuarios, configuración, agenda, dashboard, inventario, finanzas; Recepcionista: pacientes sin datos clínicos, agenda, notificaciones, inventario; Odontólogo: como se rediseñó en la Parte A).
5. Diseña el estado de "acceso restringido" para cuando la Recepcionista intente entrar a contenido clínico sensible (debe quedar claro visualmente que no tiene permiso, sin ser un error confuso).

### PARTE C — App móvil del Paciente (básica)

Diseña una app de paciente **simple y enfocada**, sin replicar funciones administrativas. Debe cubrir únicamente:

1. **Inicio:** próxima cita y accesos rápidos.
2. **Agenda:** ver sus citas, solicitar/confirmar/cancelar según políticas.
3. **Pagos:** ver el estado de sus citas/tratamientos y poder pagar (diseña la pantalla de pago y el resumen de pagos realizados/pendientes).
4. **Resumen de avances:** una vista simple donde el paciente vea un resumen de su progreso/tratamientos (sin acceso a la historia clínica completa ni al odontograma técnico) — piensa en cómo traducir información clínica compleja a un resumen entendible para el paciente.
5. Accesos secundarios: perfil, notificaciones, teleodontología (unirse a videollamada), documentos compartidos.

## PARA CADA PANTALLA (en las 3 partes) ENTREGA

- Propósito y rol(es) que la usan.
- Componentes clave de Angular Material a usar.
- Estados de la interfaz: vacío, carga, error, con datos.
- Diseño responsive (web para Admin/Odontólogo/Recepcionista en desktop/tablet; app de paciente pensada mobile-first).

## INNOVACIÓN REQUERIDA (no omitir)

- Propuesta innovadora para que el **historial se sienta "vivo"** al abrirse desde una cita (por ejemplo, línea de tiempo del paciente en vez de solo formularios).
- Propuesta innovadora para el **resumen de avances del paciente** en la app móvil, que humanice la información clínica sin exponer datos técnicos innecesarios.
- Propuesta innovadora para el **pago dentro de la app** (recordatorios de pago pendiente, métodos de pago, comprobante digital).
- Justifica brevemente si cada innovación es viable para el MVP académico (Integrador II) o si es fase 2.

## FORMATO DE ENTREGA

- Organiza la respuesta en tres partes claras: **Parte A (Odontólogo)**, **Parte B (Login/Roles)**, **Parte C (App Paciente)**.
- Usa tablas para el inventario de pantallas por rol.
- Usa listas para flujos de navegación.
- Al final de cada pantalla clave, agrega un apartado corto de **"Elemento innovador"** cuando aplique.
- No generes código Angular todavía, este es un diseño de producto/UX.
- Cierra con una sección de **"Cambios respecto al diseño anterior"** que resuma explícitamente cómo se atendió cada uno de los 5 puntos del feedback del profesor, para poder mostrárselo directamente.

---
