# Verificación de CoroVoz

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
