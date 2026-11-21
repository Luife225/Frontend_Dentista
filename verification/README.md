# Verificación de CoroVoz

## Integración por roles y citas asistidas

La mascota se monta una sola vez en `DashboardLayout` para ODONTOLOGO,
RECEPCIONISTA y ADMIN_CLINICA. Se retiró el botón de apertura redundante de la
barra izquierda. `AIAssistant` es la implementación vigente de la mascota, aunque
conserve su nombre histórico; no debe eliminarse como supuesto componente antiguo.

El formulario real `AgendarCitaModal` se presenta en el área de trabajo cuando
COROVOZ devuelve un borrador, incluso si aún faltan todos los campos. La conversación
permanece visible y el formulario conserva sus validaciones y guardado manual.
Los campos de fecha, hora, paciente, odontólogo, modalidad y motivo se sincronizan
en ambas direcciones. El servidor indica qué campos cambió con `updatedFields`.
Una revisión incremental descarta respuestas anteriores a una edición manual,
una respuesta ya consumida o la cancelación del borrador. Las respuestas no realizan
POST de citas; solo el botón de confirmación del formulario persiste la cita.

`verification/corovoz-appointment.mjs` ejecuta el mismo control de revisiones que
usa el proveedor y prueba apertura parcial, actualización de un único campo,
conservación de ediciones manuales, borrado de campos, respuestas repetidas o
tardías, cancelación y datos inválidos. `npm test` comprueba también servicios y
estados de mascota. `npm run build` valida TypeScript y empaquetado.

Para verificar la interfaz de los tres roles, la página aislada en el puerto 5187
incluye enlaces de roles sintéticos. Los datos y guardados son simulados solo en
ese fixture. Revisar que una solicitud sin datos abre campos vacíos; completar
mediante conversación y modificar un campo manualmente mientras se procesa una
respuesta «lento»; el campo debe conservar la edición. Cerrar el formulario durante
una respuesta no debe reabrirlo. El contador de guardados debe permanecer en cero
hasta pulsar el guardado explícito.

El modo odontograma sigue siendo exclusivo de ODONTOLOGO. Las consultas de piezas
extraídas y observaciones leen únicamente la versión autorizada ya cargada en
pantalla; distinguen esa versión de una historia clínica confirmada. La lectura
de respuestas por voz queda desactivada inicialmente y puede habilitarse con su
control explícito.

## Interfaz de la mascota

### Ocho expresiones conectadas a CoroVoz

Los recursos actuales están en `public/images/coronix-states/`: ocho WebP
transparentes de 320 × 320, 170.646 bytes en total. Se prepararon individualmente
con imagegen integrado a partir de la hoja de referencia del usuario; los PNG
originales y prompts exactos están en `verification/mascot-source/prompts-a.json`
y `prompts-b.json`. Los rótulos y burbujas no forman parte de las imágenes.

La galería `/verification/corovoz-mascot.html` permite inspeccionar los ocho
recursos. Es una página de verificación; la aplicación selecciona la expresión
con `resolveMascotState` a partir de sus estados reales:

| Expresión | Señal |
| --- | --- |
| Minimizado | Panel cerrado |
| Hablando | `speech.speaking` |
| Pensando | Activación del micrófono, transcripción o solicitud pendiente |
| Escuchando | `speech.listening` |
| Advertencia | Error actual de voz o de una operación |
| Preguntando | Alternativas, aclaración de paciente/cita o propuesta dental pendiente |
| Éxito | Consulta resuelta, hallazgo aplicado o borrador guardado correctamente |
| Reposo | Sin otra actividad |

La actividad de voz tiene prioridad sobre resultados y preguntas pendientes.
El éxito dura 2,2 segundos después de terminar la respuesta hablada, también
cuando la escucha automática lo oculta. Una interacción nueva limpia ese
resultado. Las propuestas pendientes nunca disparan una confirmación de éxito.
Un error previo del micrófono se reconoce al iniciar otra acción visual sin
alterar el hook de captura; un fallo posterior vuelve a mostrarse.

`node --test tests/corovoz-mascot.test.cjs` comprueba estados, prioridades,
recursos distintos, transparencia, dimensiones y presupuesto de descarga.
Las animaciones de confirmación y advertencia se ejecutan una vez; todas las
animaciones respetan `prefers-reduced-motion`.

Para revisar la presentación sin fichas ni escrituras reales, inicia Vite en un
origen separado (`vite --host 127.0.0.1 --port 5187 --strictPort`) y abre
`http://127.0.0.1:5187/verification/corovoz-ui.html`. El fixture usa el layout,
asistente y odontograma reales, intercepta las API y guarda solo en memoria.
No debe ejecutarse en el puerto de la sesión habitual: la página comprueba el
origen antes de instalar una sesión sintética.

- General: `opciones`, `paciente`, `respuesta larga`, `error` y `lento`.
- Odontograma: `pieza 14` genera un formulario incompleto; `caries en pieza 14`
  genera una propuesta. Editar → cara permite elegir una superficie conservando
  pieza, condición y observación. Confirmar y Guardar borrador incrementan el
  contador sintético.
- Pulsar la pestaña activa y minimizar/reabrir debe conservar la propuesta.
  Minimizar durante `lento` cancela la petición y apaga el micrófono.
- El micrófono de este fixture simula permiso denegado. No debe sonar la señal
  de activación; debe aparecer el error discreto. La captura real sigue
  verificándose con el fixture de audio descrito abajo.
- Revisar a 1440 × 900, 1280 × 720 y 390 × 844: el área de página y el asistente
  deben ocupar rectángulos separados. En anchuras menores a 1360 px, el asistente
  pasa debajo del contenido. Ambos tienen desplazamiento independiente.
- Desactivar voz conserva las respuestas escritas y silencia la señal. Ajustes
  conserva las dos modalidades y la pausa preexistente de **3,5 segundos**.

La mascota `public/images/coronix-mascot.png` se extrajo de la referencia del
usuario con la herramienta integrada de generación de imágenes. Prompt usado:
«Use case: background-extraction. Asset type: transparent PNG mascot for a compact
floating dental voice assistant. Edit target: supplied CORONIX crowned tooth
dentist illustration. Extract ONLY the original mascot: same smiling winking
white tooth, dark navy glasses, gold crown, white lab coat with tooth emblem,
thumbs-up hand and ruler held in the other hand. Preserve its original identity,
pose, proportions, coloring and polished illustration style exactly. Remove the
entire speech bubble, all text and chat/crown icons above the mascot, all
lavender/blue background shapes, decorative marks and ground shadow. Real
transparent background, clean alpha edges. Frame the full isolated character
tightly with a small safe margin; crown, hands, feet and ruler all fully visible.
No text, no added objects, no background or floor. This will be displayed at
small UI size.»

Las animaciones respetan `prefers-reduced-motion`. La señal de activación dura
120 ms. En un inicio normal con sonido, el micrófono espera al fin de la señal
y descarta su residuo antes de mostrar «Te escucho». Al interrumpir una lectura,
la preparación es silenciosa.

`npm run verify:corovoz` comprueba audio PCM, selección de pacientes, conservación
de preguntas pendientes, pausas basadas en probabilidad de voz, cambios del
odontograma y preparación de citas. `npm run build` comprueba TypeScript y el
empaquetado completo.

La página `/verification/corovoz-browser.html` ejecuta el mismo hook del micrófono
con una frase sintética seguida de ruido. Intercepta las solicitudes del backend
y sustituye getUserMedia: no usa expedientes reales ni el micrófono del usuario.
En modo manual, el resultado esperado es `review: true`, `tracksStopped: true`
y el micrófono apagado después de la pausa. En automático se espera `review: false`.

Para comprobar las rutas de los módulos ONNX en la versión compilada:

```powershell
npm.cmd run build -- --config=verification/vite.browser.config.ts
npm.cmd run preview -- --outDir=.tmp-corovoz-browser-dist --port=5186
```

Abre `http://localhost:5186/verification/corovoz-browser.html` y pulsa
«Probar pausa con voz y ruido». El módulo `.mjs` y el binario `.wasm` se emiten
como recursos con nombre versionado de Vite. No se debe importar el runtime
ONNX desde `public/corovoz-vad`, porque Vite rechaza esa importación en desarrollo.

Para comprobar memoria, abre el asistente, elige General y desactiva la lectura.
Envía «¿Castillo tiene alguna alergia registrada?», luego «tele odontología».
Cierra y reabre el panel y envía «sí». La solicitud simulada debe conservar la
pregunta original, `patientId: "2"` y `patientConfirmed: true`.

## Transcripción real y conversación del odontograma

Para usar el intérprete Python real con datos sintéticos, inicia desde
`Backend_Dentista/corovoz_python`:

```powershell
$env:COROVOZ_PYTHON_PORT='8795'
$env:COROVOZ_LUNA_ENABLED='false'
python server.py
```

En el frontend inicia la configuración aislada en un puerto distinto de la app:

```powershell
npm.cmd run dev -- --config=verification/vite.browser.config.ts --port=5185 --host=127.0.0.1 --strictPort
```

Abre `/verification/corovoz-browser.html` en ese puerto. Marca «Transcribir con
Whisper local» y pulsa «Probar pausa con voz y ruido»: usa el WAV sintético en
español, Silero, el codificador PCM y Whisper instalado, sin usar el micrófono
físico. El WAV dice «En el diente dieciocho hay una restauración».
Sin la casilla, la transcripción es simulada; sirve para verificar comandos de
la interfaz, pero no demuestra la precisión de Whisper.
«Audio corto: confirmar» cambia el WAV por una sola palabra sintetizada en
español. Con Whisper activado permite verificar detección de voz corta,
transcripción y ejecución del comando en modo manual sobre una propuesta.

En Odontograma, desactiva Leer respuestas y envía
«diente 18 cara oclusal restaracion. Observación: control en 2 semanas».
Comprueba la opción Restauración, cierra/reabre el panel y continúa solo con la
condición. La propuesta debe conservar pieza, cara y observación. «Editar» permite
elegir diente, condición, observación o cara y decir solo su nuevo valor.
«Repetir propuesta» lee el hallazgo propuesto, sin recitar el historial de frases.
«Cambiar paciente de prueba» debe borrar ese contexto. Los hallazgos aplicados
son únicamente objetos en memoria del fixture.

Para probar comandos hablados al pausar 3,5 segundos con transcripción simulada,
desmarca Whisper, escribe «editar», «confirmar» o «eliminar» en Transcripción
simulada e inicia la escucha del asistente en modo automático. Cada comando debe
ejecutarse al terminar la captura sin pulsar Enviar. En modo manual se revisa
el texto y se pulsa Enviar.

«Preparar secuencia de voz» programa seis intervenciones sobre la misma escucha:
editar → condición → caries → eliminar → observación → confirmar. Parte de una
propuesta con corona y nota, desactiva Leer respuestas en el fixture y activa el
envío automático antes de iniciar la escucha. El resultado esperado es CARIES
en la misma pieza, sin nota, aplicada al borrador sintético. Las transcripciones
de esta secuencia son simuladas; el intérprete de edición Python es real.
La validación de Whisper con las dos voces sintéticas se prueba por separado.

«Eliminar condición» o «eliminar diente» debe pedir el dato faltante y bloquear
Confirmar. «Eliminar todo» descarta la propuesta completa. «Editar observación»
debe conservar pieza, condición y cara incluso si la nota contiene números.

En automático, una propuesta o edición pendiente mantiene la escucha aunque
transcurran más de 15 segundos sin voz. Fuera de ese diálogo se mantiene el
apagado por inactividad. Las respuestas cortas usan el umbral de voz específico.
Para comprobarlo, crea una propuesta, selecciona envío automático, activa Audio
corto y simula «repetir propuesta» al iniciar la escucha. Tras la lectura espera
más de 15 segundos: el micrófono del asistente debe seguir activo. Marca Whisper
local y pulsa Emitir siguiente frase, sin reiniciar el micrófono. El WAV dice
«Confirmar». Debe aplicarse el hallazgo y mostrarse Guardados del borrador: 1.
El guardado del fixture es simulado; la aplicación usa el servicio autorizado
real y serializa los hallazgos recién aplicados desde su referencia actual.

## Propuesta progresiva

Envía «pieza 15» en Odontograma. Debe aparecer Formulario de la propuesta con
cuatro campos: pieza 15, condición Pendiente, observación opcional y cara General.
Correcto: agregar debe estar desactivado. Continúa con «observaciones: control en
2 semanas», «cara mesial» y «corona»: cada frase debe actualizar ese formulario
conservando los demás valores. Solo al completar la condición se habilita la
confirmación. Cerrar/reabrir debe conservar también el formulario incompleto.
Después de completarlo puedes decir «cara distal» o «observación: otra nota»
directamente, sin tener que volver a dictar todos los campos. Los cambios se
mantienen en memoria hasta confirmar, y se validan con el intérprete Python.

## Interrupción de voz y desplazamiento en V2.1

Las pruebas de navegador usan Node 22 o posterior y un perfil temporal de Chromium. `COROVOZ_CHROMIUM` permite indicar la ubicación de un ejecutable compatible.

**Voz.** Inicia el servidor aislado desde la raíz del frontend. Ejecuta la segunda línea en otra terminal y deja abierta la primera durante la prueba.

```powershell
npm.cmd run dev -- --config verification/vite.voice-turns.config.ts --host 127.0.0.1 --port 5189 --strictPort
node verification/corovoz-voice-turns.mjs
```

Los 14 escenarios accionan los controles de COROVOZ y controlan el reloj de reproducción, las señales de voz, el permiso de micrófono y el detector. La inspección del WAV distingue las muestras del asistente de las del usuario. Incluye interrupciones al inicio, en medio y al final, colas y eventos tardíos, doble pulsación, ambas modalidades, permisos lentos o denegados, ruido continuo y el sonido de activación. El detector Silero y el transcriptor Whisper reales se verifican por separado con los dos WAV del apartado «Transcripción real».

**Scroll.** La prueba abre las rutas protegidas con datos sintéticos. Desde la raíz del frontend, inicia el servidor y ejecuta el comprobador en otra terminal.

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5187 --strictPort
node verification/corovoz-scroll.mjs
```

La prueba selecciona una pieza, crea una propuesta y mueve la rueda hasta los controles inferiores. Comprueba si están visibles bajo el puntero y si la propuesta persiste tras minimizar y volver a abrir el chat. Usa el zoom real de Chrome al 80 %, 100 %, 125 % y 150 %, una ventana de escritorio, una ventana reducida y una vista móvil emulada. Comprueba también el historial del chat, la ficha, el formulario de paciente y las rutas de Agenda, Inventario, Dashboard, Caja, Configuración, Notificaciones y Teleodontología.

**Audio físico.** La prueba optativa `verification/corovoz-hardware.mjs` usa el servidor local de la interfaz en 5187. Sus dos argumentos son fragmentos de los nombres que el navegador muestra para el micrófono y la salida. Por defecto reproduce con el sintetizador nativo en la salida predeterminada. Con `--wav-output` envía una frase pregrabada a la salida elegida. El comprobador interrumpe la frase, abre el micrófono real y cuenta durante 4,2 segundos cuántos dictados intentaría enviar la aplicación. Las solicitudes de transcripción se interceptan en memoria. Ejecuta estos ejemplos solo si los dispositivos corresponden al equipo que se va a probar.

```powershell
node verification/corovoz-hardware.mjs --physical ACH3621 ACH3621
node verification/corovoz-hardware.mjs --physical "Microphone Array" Realtek --wav-output
```
