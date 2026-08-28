# PROMPT PARA IA AGENTE — DISEÑO DEL FRONTEND (MVP Sistema de Gestión Odontológica)

Copia y pega el siguiente prompt completo en tu IA agente:

---

## ROL

Actúa como un **Diseñador de Producto y Frontend Lead** especializado en Angular, Angular Material y UX para aplicaciones clínicas de uso intensivo (consultorio real, con el odontólogo interactuando muchas veces con manos ocupadas o el paciente presente). Tu tarea es diseñar el **frontend completo** de un sistema de gestión para clínicas odontológicas, siendo **innovador en cada pantalla y flujo**, no solo en la estética general.

## CONTEXTO TÉCNICO (respétalo, no lo cambies)

- **Framework:** Angular + Angular Material (no usar React, no rediseñar el sistema de componentes desde cero)
- **Backend:** Spring Boot vía REST API (`/api/v1/...`), autenticación JWT
- **Servicio de IA:** expuesto también vía el backend (asistente de voz para historia clínica y odontograma)
- **Consumo de datos:** todo vía HTTP/REST, con estados de carga, error y éxito que deben diseñarse explícitamente
- **Usuarios del sistema:** odontólogo, asistente/recepcionista, administrador de clínica

## MÓDULOS QUE DEBE CUBRIR EL FRONTEND (no omitir ninguno)

1. **Gestión del consultorio** — configuración de clínica, usuarios, roles, horarios
2. **Gestión de pacientes** — registro, antecedentes, historial, documentos
3. **Agenda y citas** — crear, mover, cancelar, confirmar citas, vista calendario
4. **Historia clínica** — motivo, diagnóstico, procedimientos, evolución, indicaciones
5. **Odontograma interactivo** — selección visual de dientes y registro de hallazgos
6. **Asistente de IA por voz** — activación de modo dictado, visualización de transcripción en vivo, borrador generado por IA, confirmación/edición antes de guardar
7. **Notificaciones** — vista de recordatorios enviados/programados (WhatsApp/correo)
8. **Dashboard** — resumen diario del consultorio
9. **Inventario** (fase 2, diseñar igual) — control de materiales e insumos
10. **Caja y reportes** — pagos, ingresos, estadísticas
11. **Radiografías** — carga y visualización de imágenes (con espacio reservado para IA en fase 2)

## TU TAREA

Diseña el frontend completo, módulo por módulo, sin omitir ninguno de los 11. Para cada módulo entrega:

### 1. Inventario de pantallas
Lista de todas las pantallas/vistas necesarias, con su propósito y qué rol de usuario la usa.

### 2. Flujo de navegación
Cómo se llega a cada pantalla y a qué lleva cada acción (describe el flujo, no hace falta código).

### 3. Componentes clave de Angular Material a usar
Qué componentes (tablas, calendarios, steppers, chips, dialogs, etc.) tienen sentido en cada pantalla y por qué, evitando reinventar UI que Angular Material ya resuelve.

### 4. Estados de la interfaz
Diseño explícito de estado vacío, estado de carga, estado de error y estado con datos para cada pantalla que consuma datos del backend.

### 5. Diseño responsive y "manos libres"
Cómo se adapta cada pantalla a tablet (uso típico en consultorio) y qué pantallas deben poder operarse con mínima interacción táctil mientras el odontólogo atiende (foco especial en Historia Clínica, Odontograma y Asistente de IA).

## FOCO ESPECIAL DE INNOVACIÓN (obligatorio, con detalle de interacción)

### Odontograma interactivo
- Propuesta de interacción visual novedosa para seleccionar diente, cara del diente y registrar hallazgo (no un simple formulario con dropdown de números de diente).
- Cómo se muestra visualmente el historial de un diente al pasar el cursor o tocarlo.
- Cómo se resalta en tiempo real un diente cuando el asistente de IA lo menciona por voz.

### Asistente de IA por voz
- Diseño de un panel/overlay de "modo dictado" que muestre la transcripción en vivo, resalte lo que la IA está interpretando, y separe claramente "lo que dijo el odontólogo" de "lo que la IA entendió y va a registrar".
- Diseño del paso de confirmación: cómo se le muestra al odontólogo el borrador para aprobar/editar/rechazar antes de guardar, de forma rápida (pensado en segundos, no minutos, porque está con el paciente).
- Micro-interacciones que den confianza (indicador de "escuchando", indicador de "procesando", indicador de "guardado").

### Dashboard
- Propuesta de un dashboard que no sea solo tarjetas de números, sino que priorice acciones del día (próxima cita, pacientes pendientes de confirmación, alertas), pensado para verse en 5 segundos al llegar al consultorio.

### Agenda
- Propuesta de vista de calendario que facilite reprogramar citas de forma muy rápida (arrastrar y soltar, o similar) y que muestre visualmente conflictos de horario.

## FORMATO DE ENTREGA

- Organiza la respuesta con un encabezado por cada uno de los 11 módulos.
- Dentro de cada módulo, sigue el orden: pantallas → flujo → componentes → estados → responsive.
- Al final de cada módulo, agrega un apartado corto de **"Elemento innovador"** con la propuesta diferenciadora de esa pantalla.
- Usa tablas para el inventario de pantallas y listas para los flujos.
- No generes código Angular todavía, este es un diseño de producto/UX, no la implementación.
- Cierra con una sección de **"Supuestos de diseño"** listando cualquier decisión que hayas tomado por tu cuenta para que el equipo la valide.

---
