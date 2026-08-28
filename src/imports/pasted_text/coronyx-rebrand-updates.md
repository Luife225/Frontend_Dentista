CONTEXTO

Ya tienes construido el diseño del sistema (dashboard, sidebar, agenda, teleodontología, etc., actualmente bajo el nombre provisional "DentalOS"). Ahora debes aplicar 3 ajustes específicos sobre ese mismo diseño, manteniendo toda la estructura, componentes y flujos ya definidos. No agregues módulos nuevos ni cambies la arquitectura de información ya aprobada.

AJUSTE 1 — Eliminar el selector "Demo" de roles

En el header actual existe un control llamado "Demo" que permite cambiar entre Dr. / Recep. / Admin / (ícono de celular para Paciente). Esto era útil solo para presentar el prototipo, pero debe eliminarse del diseño final, porque el rol del usuario ya se define en el login (ver diseño de autenticación multi-rol ya solicitado antes) y no debe poder cambiarse manualmente desde la interfaz.

Elimina ese bloque de switcher del header en todas las pantallas donde aparezca.
El header debe reflejar únicamente el rol de la sesión activa (ej. mostrar "Dr. Herrera" con su rol fijo, sin opción de alternar).
Si necesitas mantener un modo de "vista previa por rol" para fines de demo/presentación académica, ese control debe quedar claramente fuera del diseño de producto final (por ejemplo, como una herramienta interna de desarrollo, no visible en la UI del usuario real). Acláralo como nota, pero el entregable de diseño debe mostrarse sin el switcher.
AJUSTE 2 — Botón de adjuntar documentos en Teleodontología (durante la llamada)

En la pantalla de Teleodontología, cuando la consulta está en curso ("En llamada"), agrega un nuevo control en la barra de acciones (donde ya están los íconos de micrófono, cámara y colgar):

Nuevo botón: "Adjuntar documento" (ícono de clip o de imagen).
Al presionarlo, debe permitir subir un archivo (imagen, radiografía, PDF) desde el dispositivo del odontólogo.
El archivo adjuntado debe:
Mostrarse en el panel lateral del chat/consulta (como ya existe el chat de mensajes), como un elemento adjunto con miniatura y nombre de archivo.
Quedar asociado automáticamente al paciente y a esa consulta virtual, para que después aparezca en su historial (radiografías/documentos).
Diseña también el estado de "subiendo archivo" (barra de progreso o loader) y el estado de error si falla la carga.
Si el paciente es quien comparte una radiografía desde su lado (según el flujo ya definido de teleodontología), el mismo componente de adjuntos debe mostrar de qué lado vino el archivo (doctor o paciente).
AJUSTE 3 — Rebranding completo con la paleta del logo CORONYX

Se adjunta el logo oficial: CORONYX — Sistema Dental (ícono de diente con corona dentro de una "C", en degradado turquesa/verde azulado, con texto en tipografía bold en tono petróleo/turquesa oscuro).

Aplica los siguientes cambios en toda la plataforma (dashboard, sidebar, agenda, teleodontología, login, app de paciente, y cualquier otra pantalla ya diseñada):

Reemplazo de marca: cambia el nombre "DentalOS" por "CORONYX" en el sidebar y en cualquier lugar donde aparezca el branding, junto con el isotipo del logo (el diente con corona).
Paleta de colores (extraída del logo, ajusta el tono exacto con el picker sobre el archivo adjunto, estos son valores de referencia aproximados):
Uso	Color de referencia	Ejemplo hex aproximado
Color primario (acciones, botones activos, sidebar activo)	Turquesa medio del degradado del logo	
#1E8C82
Color primario oscuro (hover, headers, textos de marca)	Verde petróleo oscuro (tono del texto "CORONYX")	
#0B3D3A
Color primario claro (fondos suaves, badges, hover leve)	Turquesa claro del degradado	
#5FC9BE
Acento / detalle (corona, elementos premium)	Tono metálico oscuro de la corona	
#1A2E35
Fondo general	Blanco / gris muy claro (mantener como está)	
#FAFAFA
Texto principal	Gris oscuro neutro (mantener legibilidad, no todo en turquesa)	
#1F2937
Aplica el color primario turquesa a: ítem activo del sidebar (ya usan un color similar, ajústalo al tono exacto del logo), botones principales ("Nueva cita", "Nuevo paciente"), badges de estado positivo ("Confirmada", "Servicio activo"), y el ícono del "Asistente IA".
Usa el verde petróleo oscuro para textos de marca, encabezados de sección y elementos de alto contraste (por ejemplo el sidebar podría pasar de negro/azul oscuro actual a este tono petróleo, si mejora la coherencia visual con el logo — evalúalo y decide con criterio de diseño).
Mantén buen contraste y legibilidad: no reemplaces el gris de fondo ni el gris de texto secundario solo por aplicar la marca; la paleta turquesa debe usarse en acentos y elementos de marca, no en todo el fondo.
Actualiza también el ícono/favicon y cualquier referencia visual del logo anterior por el isotipo de CORONYX (el diente con corona).
FORMATO DE ENTREGA
Aplica estos 3 ajustes directamente sobre las pantallas ya construidas (Dashboard, Teleodontología, Sidebar, y cualquier otra donde corresponda), no regeneres el diseño completo desde cero.
Muestra explícitamente un antes/después o una lista de qué cambiaste en cada pantalla.
Si algún ajuste de color entra en conflicto con un estado semántico ya definido (rojo de error, amarillo de alerta, verde de éxito), no los reemplaces por turquesa — esos colores de estado se mantienen igual; el turquesa aplica solo a marca y acciones primarias.