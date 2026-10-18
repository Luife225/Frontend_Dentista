# Cómo probar CoroVoz

1. Reiniciar el backend con la rama `feature/AlanAguilera`; arrancar el frontend con `npm run dev`.
2. Iniciar sesión como odontólogo o recepcionista. Abrir CoroVoz en el menú. General acepta texto o voz y ofrece navegación real a Agenda, Pacientes y Notificaciones.
3. Como odontólogo, abrir Pacientes, seleccionar un paciente de prueba y entrar en Odontograma. Abrir CoroVoz → Odontograma.
4. Escribir «Corona en pieza 14» o «Caries en diente treinta y seis cara oclusal». Revisar paciente, pieza, condición y cara. Si se omite la cara, se propone GENERAL.
5. Usar «Correcto: agregar» o decir «CoroVoz correcto». La marca se incorpora al borrador visible. «Editar» permite corregir el dictado completo; «Eliminar propuesta» solo descarta la propuesta pendiente.
6. Pulsar Guardar borrador para conservar cambios manuales y de CoroVoz del mismo odontograma. Confirmar versión conserva el flujo original y no se ejecuta por voz.
7. Pulsar Iniciar escucha para activar el micrófono. Hablar después de la respuesta de CoroVoz. «CoroVoz terminado» detiene la escucha. Si el navegador falla o no da permiso, continuar escribiendo.

`coroVozService` usa el cliente autenticado existente; la lógica general y el parser están en dos endpoints nuevos del backend. No requiere claves de GPT ni instala modelos grandes.

`CoroVozContext` conecta el panel con el odontograma montado y evita aplicar propuestas al cambiar de paciente, pestaña o versión. La integración de guardado usa la misma operación que Guardar borrador. General queda disponible para ambos roles; el modo clínico solo aparece para odontólogos.

`useCoroVozSpeech` administra permiso, escucha, transcripción, lectura y limpieza del micrófono al cerrar. No puede activar voz con una palabra si el micrófono aún está apagado. El proveedor del navegador puede procesar el audio externamente; comprobar esa condición antes de usar datos reales.

Verificaciones automáticas: `npm run typecheck` y `npm run build`. Las pruebas visuales se realizaron con datos y respuestas API simulados; faltan pruebas de voz real en el navegador elegido y una prueba integrada contra una BD de desarrollo con un paciente de prueba.
