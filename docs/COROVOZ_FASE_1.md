# Cómo probar CoroVoz

## Ayuda general

1. Inicia frontend y backend de `feature/AlanAguilera`. El modelo de voz se instala una vez desde Backend_Dentista con `java tools/InstallCoroVozModel.java`. Reinicia backend al cambiar clases o corpus.
2. Abre CoroVoz → General como odontólogo o recepcionista. Prueba «¿Qué es Coronix?», «¿Qué es CoroVoz?», «¿Cómo veo usuarios inactivos?» o «¿Cómo guardo el odontograma?». La respuesta distingue permisos y ofrece navegación solo a rutas autorizadas.
3. Hay 45 temas y 375 ejemplos locales. No se llama a una API de GPT. Los temas cubren funciones reales y distinguen las pantallas que todavía son demostración.
4. Para datos reales escribe «Próxima cita del paciente [nombre o DNI]», «Teléfono del paciente [nombre]» o «Información general del paciente [nombre]». Si hay varias coincidencias, elige la persona. Una pregunta posterior como «¿Y su correo?» conserva esa identidad. Escribir otro nombre cambia la consulta; Olvidar paciente limpia el contexto. No se muestran datos clínicos en General ni pacientes de otras clínicas.

## Voz en Brave

Abre por localhost o HTTPS, pulsa Iniciar escucha y permite el micrófono. La barra indica el nivel de entrada. El modo inicial «Cuando pulse Terminé» permite hablar y hacer pausas sin enviar todavía. Pulsa «Terminé: enviar» al acabar. También puedes seleccionar el envío tras 3,5 segundos de silencio. Se captura con getUserMedia + AudioWorklet y se reconoce mediante Whisper en el backend; no depende del servicio SpeechRecognition del navegador.

Si alcanzas 25 segundos, el texto queda para revisión y puedes completarlo antes de enviarlo. El servidor acepta hasta 30 segundos de audio. «Interrumpir respuesta» corta la lectura sin apagar el micrófono. Puedes desactivar Leer respuestas. Un fallo recuperable al transcribir muestra el motivo y permite volver a dictar. Mientras procesa o habla se pausa el envío para evitar eco.

Comandos: «Prender CoroVoz», «CoroVoz correcto», «CoroVoz edita», «CoroVoz elimina» y «CoroVoz terminado». En modo manual pulsa Terminé después de decir el comando. Para activarse por primera vez siempre se necesita el botón y permiso; no escucha palabras si está apagado.

## Odontograma

1. Como odontólogo abre Pacientes, selecciona una persona de prueba y entra en una versión editable del Odontograma. Abre CoroVoz → Odontograma.
2. Dicta o escribe «Pieza catorce». Debe mostrar «pieza 14» y solicitar la condición. Después envía «corona». También admite una frase completa: «Caries en diente treinta y seis cara oclusal».
3. Revisa paciente, número, condición y cara. «Correcto: agregar» o «CoroVoz correcto» incorpora al borrador visible. Editar permite corregir el dictado; Eliminar propuesta solo descarta esa propuesta. El texto permanece editable antes de enviar.
4. Usa Guardar borrador para conservar los cambios. Confirmar versión mantiene el flujo original del odontograma y no se ejecuta por voz. Cambiar de paciente, versión o pestaña descarta propuestas y fragmentos pendientes.

`CoroVozContext` conecta el asistente con el odontograma montado. El servicio utiliza el cliente autenticado existente; `coroVozConversation` normaliza comandos y combina fragmentos evitando duplicar números al corregir. `useCoroVozSpeech` administra captura, envío manual o por pausa, interrupción y lectura. `coroVozAudio` convierte entradas de 16, 44.1 y 48 kHz a WAV PCM16 mono de 16 kHz.

## Verificaciones

- `node verification/corovoz-audio.mjs`: duración, tono, volumen y contrato WAV desde tres frecuencias.
- `node verification/corovoz-conversation.mjs`: fragmentos, correcciones y comandos.
- `npm run typecheck` y `npm run build`.
- El backend verifica clasificación, roles, consultas administrativas, números FDI, fragmentos y formatos de audio. Se prueban también peticiones reales autenticadas sin guardar datos clínicos.

La revisión del micrófono físico y precisión con ruido real requiere pruebas en el equipo del usuario. El corpus sigue siendo limitado: las respuestas no cubren cualquier formulación ni acreditan precisión clínica.
