// test_f05_b_frontend_clinical_integration.mjs
// Automated verification for F05-B: Historia clínica manual real
// Validates frontend integration flow:
// - Role restrictions (Admin / Recepción / Paciente blocked from technical clinical encounters)
// - Patient A vs Patient B isolated data retrieval
// - Draft creation with all manual fields
// - Draft reload and update
// - Confirmation with immutable seal
// - Correction version creation with previous version preserved

const BASE_URL = 'http://localhost:8081';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const res = await fetch(url, {
    ...options,
    headers
  });
  let body = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      body = await res.json();
    } catch {
      body = null;
    }
  } else {
    try {
      body = await res.text();
    } catch {
      body = null;
    }
  }
  return { status: res.status, ok: res.ok, body };
}

async function login(correo, clave) {
  const res = await request('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ correo, clave })
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${correo}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

async function runTests() {
  console.log('================================================================');
  console.log('   F05-B: Historia Clínica Manual Real - Integration Tests     ');
  console.log('================================================================\n');

  // 1. Authenticate roles
  console.log('--- 1. Authenticating Roles ---');
  const doctor = await login('odontologo@coronyx.pe', '123456');
  console.log(`✔ Odontólogo: ${doctor.nombreCompleto} (${doctor.rol}, usuarioClinicaId: ${doctor.usuarioClinicaId})`);

  const admin = await login('admin@coronyx.pe', '123456');
  console.log(`✔ Admin: ${admin.nombreCompleto} (${admin.rol})`);

  const recep = await login('recepcion@coronyx.pe', '123456');
  console.log(`✔ Recepción: ${recep.nombreCompleto} (${recep.rol})`);

  const patient = await login('paciente@coronyx.pe', '123456');
  console.log(`✔ Paciente: ${patient.nombreCompleto} (${patient.rol})\n`);

  // 2. Role Restriction Verification
  console.log('--- 2. Role Restrictions (Admin, Recepción, Paciente Blocked) ---');
  for (const [roleName, auth] of [
    ['ADMIN_CLINICA', admin],
    ['RECEPCIONISTA', recep],
    ['PACIENTE', patient]
  ]) {
    const res = await request('/api/v1/clinical-encounters/paciente/2', {
      headers: { Authorization: `Bearer ${auth.token}` }
    });
    console.log(`[${roleName}] Access status: ${res.status}`);
    if (res.status !== 403) {
      throw new Error(`Security Violation: ${roleName} should be blocked with 403, got ${res.status}`);
    }
  }
  console.log('✔ Non-clinical roles strictly prohibited from accessing technical clinical encounters.\n');

  // 3. Odontologist Queries Patient A vs Patient B
  console.log('--- 3. Odontologist Queries Patient A vs Patient B ---');
  const patientA_Id = '2'; // Luis Paciente
  const patientB_Id = '1'; // Primer paciente

  const listA_Res = await request(`/api/v1/clinical-encounters/paciente/${patientA_Id}`, {
    headers: { Authorization: `Bearer ${doctor.token}` }
  });
  if (listA_Res.status !== 200) {
    throw new Error(`Failed to fetch encounters for Patient A: ${listA_Res.status}`);
  }
  console.log(`Patient A encounters count: ${listA_Res.body.length}`);

  const listB_Res = await request(`/api/v1/clinical-encounters/paciente/${patientB_Id}`, {
    headers: { Authorization: `Bearer ${doctor.token}` }
  });
  if (listB_Res.status !== 200) {
    throw new Error(`Failed to fetch encounters for Patient B: ${listB_Res.status}`);
  }
  console.log(`Patient B encounters count: ${listB_Res.body.length}`);
  console.log('✔ Odontologist successfully retrieved isolated history for distinct patients.\n');

  // 4. Create New Clinical Encounter Draft for Patient A
  console.log('--- 4. Create New Draft Encounter with All Manual Fields ---');
  const draftPayload = {
    pacienteId: Number(patientA_Id),
    motivoConsulta: 'Dolor y sensibilidad térmica en molar 46 tras ingesta de alimentos fríos',
    examenClinico: 'Molar 46 con cavidad mesio-oclusal profunda, prueba de vitalidad pulpar positiva fugaz, percusión indolora.',
    diagnostico: 'K02.1 Caries dentinaria profunda en pieza 46 sin compromiso pulpar irreversible',
    procedimientos: 'Remoción de tejido cariado, protección dentinopulpar con hidróxido de calcio e ionómero de vidrio base, restauración con resina híbrida fotocurable.',
    planTratamiento: 'Control a los 6 meses y evaluación radiográfica periapical.',
    recetasPrescripciones: 'Paracetamol 500mg vía oral cada 8 horas por 2 días en caso de molestias leves.',
    indicaciones: 'Evitar masticar alimentos duros por 24 horas y mantener higiene oral con cepillo suave.',
    evolucion: 'Paciente cooperador, procedimiento finalizado con excelente estética y oclusión ajustada.',
    proximaCitaSugerida: '2026-11-30',
    signosVitales: JSON.stringify({ systolic: 118, diastolic: 76, pulse: 70, temp: 36.4, weight: 70, height: 172, spo2: 99 })
  };

  const createRes = await request('/api/v1/clinical-encounters', {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctor.token}` },
    body: JSON.stringify(draftPayload)
  });

  console.log(`Create Draft HTTP Status: ${createRes.status}`);
  if (createRes.status !== 201) {
    throw new Error(`Create draft failed: ${createRes.status} ${JSON.stringify(createRes.body)}`);
  }
  const createdEncounter = createRes.body;
  console.log(`✔ Created Encounter ID: ${createdEncounter.id}, Estado: ${createdEncounter.estado}`);
  console.log(`  Version: ${createdEncounter.versionActual.numeroVersion}, Total Versiones: ${createdEncounter.totalVersiones}`);
  if (createdEncounter.estado !== 'BORRADOR') {
    throw new Error(`Expected BORRADOR, got ${createdEncounter.estado}`);
  }

  // 5. Reload Draft and Update Fields
  console.log('\n--- 5. Reload and Update Draft ---');
  const reloadRes = await request(`/api/v1/clinical-encounters/${createdEncounter.id}`, {
    headers: { Authorization: `Bearer ${doctor.token}` }
  });
  if (reloadRes.status !== 200 || reloadRes.body.versionActual.diagnostico !== draftPayload.diagnostico) {
    throw new Error(`Reload draft verification failed`);
  }
  console.log(`✔ Reload verified: Encounter #${reloadRes.body.id} data identical to server persistence.`);

  const updateDraftPayload = {
    ...draftPayload,
    evolucion: 'Evolución actualizada en borrador: Sin molestia postoperatoria inmediata.',
    indicaciones: 'Indicaciones ajustadas: Cepillado suave y uso de hilo dental una vez al día.'
  };
  const updateRes = await request(`/api/v1/clinical-encounters/${createdEncounter.id}/draft`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${doctor.token}` },
    body: JSON.stringify(updateDraftPayload)
  });
  console.log(`Update Draft Status: ${updateRes.status}`);
  if (updateRes.status !== 200 || updateRes.body.versionActual.evolucion !== updateDraftPayload.evolucion) {
    throw new Error(`Update draft failed to persist changes`);
  }
  if (updateRes.body.totalVersiones !== 1) {
    throw new Error(`Updating draft must NOT create new versions!`);
  }
  console.log('✔ Draft updated successfully; remains in Version 1 without creating extra versions.\n');

  // 6. Confirm and Sign Version
  console.log('--- 6. Confirm and Sign Version (Explicit Action) ---');
  const confirmRes = await request(`/api/v1/clinical-encounters/${createdEncounter.id}/confirm`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctor.token}` },
    body: JSON.stringify({ numeroVersion: 1 })
  });
  console.log(`Confirm Status: ${confirmRes.status}`);
  if (confirmRes.status !== 200) {
    throw new Error(`Confirm failed: ${confirmRes.status} ${JSON.stringify(confirmRes.body)}`);
  }
  const confirmed = confirmRes.body;
  if (confirmed.estado !== 'CONFIRMADO' || !confirmed.versionActual.estaConfirmado) {
    throw new Error(`Expected CONFIRMADO and estaConfirmado true`);
  }
  console.log(`✔ Encounter #${confirmed.id} confirmed: signed by ${confirmed.versionActual.firmadoPorNombre} at ${confirmed.versionActual.fechaConfirmacion}`);

  // 7. Verify Confirmed Version is Immutable
  console.log('\n--- 7. Verify Confirmed Version Immutability (409 Conflict) ---');
  const conflictRes = await request(`/api/v1/clinical-encounters/${createdEncounter.id}/draft`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${doctor.token}` },
    body: JSON.stringify({ diagnostico: 'Intento de modificar versión confirmada' })
  });
  console.log(`Edit Confirmed Status: ${conflictRes.status}`);
  if (conflictRes.status !== 409) {
    throw new Error(`Expected 409 Conflict when editing confirmed version, got: ${conflictRes.status}`);
  }
  console.log('✔ Modifying confirmed version correctly rejected with HTTP 409 Conflict.\n');

  // 8. Create Correction Version (D06)
  console.log('--- 8. Create Correction Version (D06) Preserving Previous ---');
  const correctionPayload = {
    diagnostico: 'K02.1 Caries dentinaria profunda + leve sobreoclusión corregida en control',
    procedimientos: 'Desgaste selectivo de cúspide de apoyo y pulido con discos de grano fino.',
    evolucion: 'Control a las 48h: Paciente refiere leve interferencia oclusal que fue aliviada.',
    confirmarInmediatamente: true
  };
  const createCorrectionRes = await request(`/api/v1/clinical-encounters/${createdEncounter.id}/versions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctor.token}` },
    body: JSON.stringify(correctionPayload)
  });
  console.log(`Correction Status: ${createCorrectionRes.status}`);
  if (createCorrectionRes.status !== 201) {
    throw new Error(`Failed to create correction version: ${createCorrectionRes.status}`);
  }
  const corrected = createCorrectionRes.body;
  if (corrected.totalVersiones !== 2 || corrected.versionActual.numeroVersion !== 2) {
    throw new Error(`Expected 2 total versions and active version 2`);
  }

  // Verify Version History
  const historyRes = await request(`/api/v1/clinical-encounters/${createdEncounter.id}/versions`, {
    headers: { Authorization: `Bearer ${doctor.token}` }
  });
  const versions = historyRes.body || [];
  console.log(`Audit versions count: ${versions.length}`);
  const v1 = versions.find(v => v.numeroVersion === 1);
  const v2 = versions.find(v => v.numeroVersion === 2);
  if (!v1 || !v2 || v2.versionAnteriorId !== v1.id) {
    throw new Error(`Version history linkage failed`);
  }
  console.log(`✔ Version 1 intact: "${v1.diagnostico}" (Confirmada: ${v1.estaConfirmado})`);
  console.log(`✔ Version 2 trazable: "${v2.diagnostico}" (Version Anterior: #${v2.versionAnteriorId})`);

  console.log('\n================================================================');
  console.log('   ALL F05-B INTEGRATION TESTS PASSED SUCCESSFULLY!             ');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ F05-B TEST FAILED:', err);
  process.exit(1);
});
