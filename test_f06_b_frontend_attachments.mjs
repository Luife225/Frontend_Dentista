import crypto from 'crypto'

const BASE_URL = 'http://localhost:8081/api/v1'

async function login(correo, clave) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, clave })
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Login failed for ${correo}: ${res.status} ${text}`)
  }
  const data = await res.json()
  return data.token
}

async function runTests() {
  console.log('======================================================================')
  console.log('TEST SUITE F06-B: Radiografías y Documentos Reales (Integración Frontend / API)')
  console.log('======================================================================\n')

  // 1. Iniciar sesión como Odontólogo
  console.log('1. Autenticación como Odontólogo...')
  const dentistToken = await login('odontologo@coronyx.pe', '123456')
  console.log('   ✓ Token obtenido para odontologo@coronyx.pe')

  // Iniciar sesión como Paciente (ID 2)
  console.log('   Autenticación como Paciente...')
  const patientToken = await login('paciente@coronyx.pe', '123456')
  console.log('   ✓ Token obtenido para paciente@coronyx.pe')

  // 2. Crear binario real de prueba (Buffer simulando imagen PNG)
  console.log('\n2. Cargar archivo binario real como Odontólogo (pacienteId: 2)...')
  const originalBytes = Buffer.from(
    '89504e470d0a1a0a0000000d4948445200000010000000100802000000909168360000000c49444154789c63601805a360140c000000ffff0300180401217e923e3e0000000049454e44ae426082',
    'hex'
  )
  const originalSha256 = crypto.createHash('sha256').update(originalBytes).digest('hex')
  const testFileName = `radiografia_panoramica_test_${Date.now()}.png`

  const formData = new FormData()
  const blob = new Blob([originalBytes], { type: 'image/png' })
  formData.append('file', blob, testFileName)
  formData.append('pacienteId', '2')
  formData.append('tipoArchivo', 'RADIOGRAFIA')
  formData.append('regionAnatomica', 'Mandíbula inferior')
  formData.append('esVisiblePaciente', 'false')

  const uploadRes = await fetch(`${BASE_URL}/attachments/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${dentistToken}`
    },
    body: formData
  })

  if (uploadRes.status !== 201) {
    const errText = await uploadRes.text()
    throw new Error(`Upload falló con status ${uploadRes.status}: ${errText}`)
  }

  const uploadedAtt = await uploadRes.json()
  console.log(`   ✓ Archivo subido exitosamente. ID: ${uploadedAtt.id}`)
  console.log(`   - Nombre original: ${uploadedAtt.nombreOriginal}`)
  console.log(`   - Peso en bytes: ${uploadedAtt.pesoBytes} (Esperado: ${originalBytes.length})`)
  console.log(`   - Tipo archivo: ${uploadedAtt.tipoArchivo}`)
  console.log(`   - Región anatómica: ${uploadedAtt.regionAnatomica}`)
  console.log(`   - Visible para paciente: ${uploadedAtt.esVisiblePaciente} (Debe ser false)`)
  if (uploadedAtt.pesoBytes !== originalBytes.length) {
    throw new Error(`Discrepancia en pesoBytes: esperado ${originalBytes.length}, recibido ${uploadedAtt.pesoBytes}`)
  }
  if (uploadedAtt.esVisiblePaciente !== false) {
    throw new Error('El archivo debería haber sido creado con esVisiblePaciente = false')
  }

  // 3. Recargar / Consultar lista de archivos del paciente como Odontólogo
  console.log('\n3. Recargar lista de archivos como Odontólogo (GET /attachments/patient/2)...')
  const listDentistRes = await fetch(`${BASE_URL}/attachments/patient/2`, {
    headers: { Authorization: `Bearer ${dentistToken}` }
  })
  if (!listDentistRes.ok) {
    throw new Error(`Listado odontólogo falló: ${listDentistRes.status}`)
  }
  const dentistList = await listDentistRes.json()
  const foundInDentist = dentistList.find(a => a.id === uploadedAtt.id)
  if (!foundInDentist) {
    throw new Error(`El archivo recién subido ${uploadedAtt.id} no fue encontrado en el listado clínico`)
  }
  console.log(`   ✓ Archivo verificado en listado clínico del odontólogo (${dentistList.length} archivos totales)`)

  // 4. Segundo usuario: Paciente no ve ni puede descargar archivo privado
  console.log('\n4. Segundo usuario (Aislamiento de Privacidad): Paciente consulta sus archivos...')
  const listPatientRes = await fetch(`${BASE_URL}/attachments/me`, {
    headers: { Authorization: `Bearer ${patientToken}` }
  })
  if (!listPatientRes.ok) {
    throw new Error(`Listado paciente falló: ${listPatientRes.status}`)
  }
  const patientList = await listPatientRes.json()
  const foundInPatient = patientList.find(a => a.id === uploadedAtt.id)
  if (foundInPatient) {
    throw new Error('FALLO DE SEGURIDAD: Paciente puede ver un archivo privado no compartido!')
  }
  console.log('   ✓ Paciente no ve el archivo privado en /attachments/me')

  console.log('   Intento de descarga directa de archivo privado por el paciente (GET /attachments/{id}/download)...')
  const downloadPrivateRes = await fetch(`${BASE_URL}/attachments/${uploadedAtt.id}/download`, {
    headers: { Authorization: `Bearer ${patientToken}` }
  })
  if (downloadPrivateRes.status !== 403) {
    throw new Error(`FALLO DE SEGURIDAD: Esperado 403 Forbidden para archivo privado, recibido ${downloadPrivateRes.status}`)
  }
  console.log('   ✓ Servidor retornó 403 Forbidden correctamente para paciente intentando descargar archivo privado.')

  // 5. Publicar / Compartir archivo con el paciente
  console.log('\n5. Publicar archivo (PATCH /attachments/{id}/visibility a true)...')
  const publishRes = await fetch(`${BASE_URL}/attachments/${uploadedAtt.id}/visibility`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${dentistToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ esVisiblePaciente: true })
  })
  if (!publishRes.ok) {
    throw new Error(`Publicación falló: ${publishRes.status}`)
  }
  const publishedAtt = await publishRes.json()
  if (publishedAtt.esVisiblePaciente !== true) {
    throw new Error('La visibilidad no cambió a true tras la publicación')
  }
  console.log('   ✓ Archivo marcado como compartido (esVisiblePaciente: true)')

  // 6. Paciente ahora ve y descarga el binario compartido, comprobando integridad binaria
  console.log('\n6. Paciente descarga archivo publicado y verifica integridad binaria...')
  const listPatientRes2 = await fetch(`${BASE_URL}/attachments/me`, {
    headers: { Authorization: `Bearer ${patientToken}` }
  })
  const patientList2 = await listPatientRes2.json()
  const foundPublished = patientList2.find(a => a.id === uploadedAtt.id)
  if (!foundPublished) {
    throw new Error('El paciente no ve el archivo tras haber sido publicado!')
  }
  console.log('   ✓ Archivo ahora visible en el portal del paciente')

  const downloadSharedRes = await fetch(`${BASE_URL}/attachments/${uploadedAtt.id}/download`, {
    headers: { Authorization: `Bearer ${patientToken}` }
  })
  if (!downloadSharedRes.ok) {
    throw new Error(`Descarga de archivo compartido falló: ${downloadSharedRes.status}`)
  }
  const downloadedArrayBuffer = await downloadSharedRes.arrayBuffer()
  const downloadedBuffer = Buffer.from(downloadedArrayBuffer)
  const downloadedSha256 = crypto.createHash('sha256').update(downloadedBuffer).digest('hex')

  console.log(`   - Bytes descargados: ${downloadedBuffer.length} (Original: ${originalBytes.length})`)
  console.log(`   - Hash SHA-256 original:   ${originalSha256}`)
  console.log(`   - Hash SHA-256 descargado: ${downloadedSha256}`)

  if (downloadedSha256 !== originalSha256) {
    throw new Error('FALLO DE INTEGRIDAD: Los bytes descargados no coinciden exactamente con los originales!')
  }
  console.log('   ✓ INTEGRIDAD BINARIA 100% CONFIRMADA: Archivo descargado coincide byte a byte con el servidor.')

  // 7. Revocar visibilidad del archivo
  console.log('\n7. Revocar visibilidad del archivo (PATCH /attachments/{id}/visibility a false)...')
  const revokeRes = await fetch(`${BASE_URL}/attachments/${uploadedAtt.id}/visibility`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${dentistToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ esVisiblePaciente: false })
  })
  if (!revokeRes.ok) {
    throw new Error(`Revocación falló: ${revokeRes.status}`)
  }
  const revokedAtt = await revokeRes.json()
  if (revokedAtt.esVisiblePaciente !== false) {
    throw new Error('La visibilidad no cambió a false tras revocar')
  }
  console.log('   ✓ Archivo revocado (esVisiblePaciente: false)')

  // 8. Verificar que revocación es INMEDIATA para nuevas solicitudes de descarga
  console.log('\n8. Verificar revocación inmediata frente a nuevas solicitudes del paciente...')
  const listPatientRes3 = await fetch(`${BASE_URL}/attachments/me`, {
    headers: { Authorization: `Bearer ${patientToken}` }
  })
  const patientList3 = await listPatientRes3.json()
  if (patientList3.some(a => a.id === uploadedAtt.id)) {
    throw new Error('FALLO: El archivo revocado sigue apareciendo en /attachments/me del paciente!')
  }
  console.log('   ✓ Archivo revocado desapareció inmediatamente de /attachments/me')

  const downloadRevokedRes = await fetch(`${BASE_URL}/attachments/${uploadedAtt.id}/download`, {
    headers: { Authorization: `Bearer ${patientToken}` }
  })
  if (downloadRevokedRes.status !== 403) {
    throw new Error(`FALLO: Se esperaba 403 Forbidden para archivo revocado, pero se recibió ${downloadRevokedRes.status}`)
  }
  console.log('   ✓ Nueva solicitud de descarga del paciente retorna 403 Forbidden inmediatamente.')

  // 9. Pruebas negativas adicionales de seguridad
  console.log('\n9. Pruebas negativas de permisos de Paciente...')
  // Paciente intentando cambiar visibilidad
  const patientPatchRes = await fetch(`${BASE_URL}/attachments/${uploadedAtt.id}/visibility`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${patientToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ esVisiblePaciente: true })
  })
  if (patientPatchRes.status !== 403) {
    throw new Error(`FALLO: Paciente no debería poder modificar visibilidad, status: ${patientPatchRes.status}`)
  }
  console.log('   ✓ Paciente intentando modificar visibilidad recibe 403 Forbidden.')

  // Paciente intentando subir un archivo clínico
  const patientUploadRes = await fetch(`${BASE_URL}/attachments/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: formData
  })
  if (patientUploadRes.status !== 403) {
    throw new Error(`FALLO: Paciente no debería poder subir archivos clínicos, status: ${patientUploadRes.status}`)
  }
  console.log('   ✓ Paciente intentando subir archivo clínico recibe 403 Forbidden.')

  // 10. Prueba adicional: Subir y descargar PDF (Consentimiento informado)
  console.log('\n10. Subida y descarga de PDF compatible (Consentimiento Informado)...')
  const pdfContent = '%PDF-1.4\n1 0 obj\n<< /Title (Consentimiento Informado) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n'
  const pdfBytes = Buffer.from(pdfContent, 'utf-8')
  const pdfSha256 = crypto.createHash('sha256').update(pdfBytes).digest('hex')

  const pdfForm = new FormData()
  const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' })
  pdfForm.append('file', pdfBlob, 'consentimiento_informado_firmado.pdf')
  pdfForm.append('pacienteId', '2')
  pdfForm.append('tipoArchivo', 'CONSENTIMIENTO')
  pdfForm.append('esVisiblePaciente', 'true')

  const uploadPdfRes = await fetch(`${BASE_URL}/attachments/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${dentistToken}` },
    body: pdfForm
  })
  if (uploadPdfRes.status !== 201) {
    throw new Error(`Upload de PDF falló: ${uploadPdfRes.status}`)
  }
  const uploadedPdf = await uploadPdfRes.json()
  console.log(`   ✓ PDF subido con ID: ${uploadedPdf.id}, tipo: ${uploadedPdf.tipoArchivo}, visible: ${uploadedPdf.esVisiblePaciente}`)

  const downloadPdfRes = await fetch(`${BASE_URL}/attachments/${uploadedPdf.id}/download`, {
    headers: { Authorization: `Bearer ${patientToken}` }
  })
  if (!downloadPdfRes.ok) {
    throw new Error(`Descarga de PDF compartido falló: ${downloadPdfRes.status}`)
  }
  const downloadedPdfBuffer = Buffer.from(await downloadPdfRes.arrayBuffer())
  const downloadedPdfSha256 = crypto.createHash('sha256').update(downloadedPdfBuffer).digest('hex')
  if (downloadedPdfSha256 !== pdfSha256) {
    throw new Error('Integridad de PDF no coincide!')
  }
  console.log('   ✓ Integridad de PDF comprobada 100% con servidor (SHA-256 idéntico)')

  console.log('\n======================================================================')
  console.log('>>> TODAS LAS PRUEBAS DE F06-B PASARON EXITOSAMENTE (100% OK) <<<')
  console.log('======================================================================')
}

runTests().catch(err => {
  console.error('\n❌ ERROR EN LA PRUEBA:', err)
  process.exit(1)
})
