
const BACKEND_URL = 'http://localhost:8081/api/v1';

async function runTests() {
  console.log('===============================================================');
  console.log(' INICIANDO VERIFICACIÓN E2E DE F03-B (Consultorio y Ficha Admin)');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}: ${details}`);
      failed++;
    }
  }

  // 1. Iniciar sesión como ADMIN_CLINICA
  console.log('--- 1. Login ADMIN_CLINICA ---');
  const adminLoginRes = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: 'admin@coronyx.pe', clave: '123456' }),
  });
  const adminData = await adminLoginRes.json();
  assert(adminLoginRes.status === 200 && adminData.token, 'Admin login exitoso', JSON.stringify(adminData));
  const adminToken = adminData.token;

  // 2. Consultar lista de usuarios de la clínica (GET /api/v1/clinic/users)
  console.log('\n--- 2. Listado de usuarios de clínica ---');
  const listUsersRes = await fetch(`${BACKEND_URL}/clinic/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const clinicUsers = await listUsersRes.json();
  assert(listUsersRes.status === 200 && Array.isArray(clinicUsers), 'GET /api/v1/clinic/users responde 200 OK');
  assert(clinicUsers.length >= 4, `Se encontraron ${clinicUsers.length} cuentas operativas en la clínica`);
  assert(
    clinicUsers.every(u => /^[1-9]\d*$/.test(u.id) && /^[1-9]\d*$/.test(u.usuarioId)),
    'Todas las cuentas tienen IDs decimal string validados'
  );

  // 3. Crear nueva cuenta en Consultorio (POST /api/v1/clinic/users)
  console.log('\n--- 3. Crear nueva cuenta de usuario en Consultorio ---');
  const uniqueEmail = `dr.test.${Date.now()}@coronyx.pe`;
  const createRes = await fetch(`${BACKEND_URL}/clinic/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      correo: uniqueEmail,
      clave: 'claveSegura123',
      nombres: 'Esteban',
      apellidos: 'Bermúdez',
      rol: 'ODONTOLOGO',
      estado: 'ACTIVO',
    }),
  });
  const createdUser = await createRes.json();
  assert(createRes.status === 201 && createdUser.id, 'POST /api/v1/clinic/users crea cuenta (201 Created)', JSON.stringify(createdUser));
  assert(createdUser.rol === 'ODONTOLOGO', 'Rol asignado es ODONTOLOGO');
  assert(createdUser.estado === 'ACTIVO', 'Estado inicial es ACTIVO');
  assert(/^[1-9]\d*$/.test(createdUser.id) && /^[1-9]\d*$/.test(createdUser.usuarioId), 'Contrato de IDs decimal string válido');

  // 4. Probar Login con la cuenta recién creada
  console.log('\n--- 4. Login con la nueva cuenta creada ---');
  const newLoginRes = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: uniqueEmail, clave: 'claveSegura123' }),
  });
  const newUserData = await newLoginRes.json();
  assert(newLoginRes.status === 200 && newUserData.token, 'Nueva cuenta puede iniciar sesión con token JWT válido');
  const newUserToken = newUserData.token;

  // 5. Editar cuenta creada (PUT /api/v1/clinic/users/{id})
  console.log('\n--- 5. Editar datos de la cuenta (PUT) ---');
  const updateRes = await fetch(`${BACKEND_URL}/clinic/users/${createdUser.id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nombres: 'Esteban Alejandro',
      apellidos: 'Bermúdez Soto',
      rol: 'ODONTOLOGO',
      estado: 'ACTIVO',
    }),
  });
  const updatedUser = await updateRes.json();
  assert(updateRes.status === 200 && updatedUser.nombres === 'Esteban Alejandro', 'PUT /api/v1/clinic/users/{id} actualiza nombres');

  // 6. Desactivar cuenta creada (PATCH /api/v1/clinic/users/{id}/status -> INACTIVO)
  console.log('\n--- 6. Desactivar cuenta y verificar invalidación de sesión previa ---');
  const deactivateRes = await fetch(`${BACKEND_URL}/clinic/users/${createdUser.id}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ estado: 'INACTIVO' }),
  });
  const deactivatedUser = await deactivateRes.json();
  assert(deactivateRes.status === 200 && deactivatedUser.estado === 'INACTIVO', 'PATCH /status desactiva la cuenta a INACTIVO');

  // 7. Verificar que el token previo de la cuenta desactivada ahora es RECHAZADO con 401
  const prevSessionRes = await fetch(`${BACKEND_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${newUserToken}` },
  });
  assert(prevSessionRes.status === 401, 'Token previo de cuenta desactivada es rechazado con 401 Unauthorized');

  // 8. Intentar nuevo login con cuenta desactivada -> 401 Unauthorized
  const loginDeactivatedRes = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: uniqueEmail, clave: 'claveSegura123' }),
  });
  assert(loginDeactivatedRes.status === 409 || loginDeactivatedRes.status === 401, `Login de cuenta desactivada es rechazado (HTTP ${loginDeactivatedRes.status})`);

  // 9. Reactivar cuenta (PATCH /status -> ACTIVO) y verificar nuevo login
  console.log('\n--- 7. Reactivar cuenta y verificar nuevo login ---');
  const reactivateRes = await fetch(`${BACKEND_URL}/clinic/users/${createdUser.id}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ estado: 'ACTIVO' }),
  });
  assert(reactivateRes.status === 200, 'PATCH /status reactiva cuenta a ACTIVO');

  const loginReactivatedRes = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: uniqueEmail, clave: 'claveSegura123' }),
  });
  assert(loginReactivatedRes.status === 200, 'Login tras reactivación es exitoso (200 OK)');

  // 10. Probar Recepcionista: Sin acceso a /api/v1/clinic/users y con Ficha Administrativa
  console.log('\n--- 8. Recepcionista sin acceso a Consultorio y con Ficha Administrativa ---');
  const recepLoginRes = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: 'recepcion@coronyx.pe', clave: '123456' }),
  });
  const recepData = await recepLoginRes.json();
  const recepToken = recepData.token;

  // Recepcionista intenta consultar cuentas de clínica -> 403 Forbidden
  const recepClinicUsersRes = await fetch(`${BACKEND_URL}/clinic/users`, {
    headers: { Authorization: `Bearer ${recepToken}` },
  });
  assert(recepClinicUsersRes.status === 403, 'RECEPCIONISTA no puede acceder a /api/v1/clinic/users (403 Forbidden)');

  // Recepcionista consulta pacientes -> no recibe datos clínicos (Control G02)
  const recepPatientsRes = await fetch(`${BACKEND_URL}/patients`, {
    headers: { Authorization: `Bearer ${recepToken}` },
  });
  const recepPatients = await recepPatientsRes.json();
  assert(recepPatientsRes.status === 200, 'RECEPCIONISTA puede consultar /api/v1/patients');
  assert(
    recepPatients.every(p => p.alergias === null && p.antecedentesMedicos === null && p.medicamentos === null),
    'Control G02: RECEPCIONISTA recibe solo proyección administrativa (campos clínicos null)'
  );

  // 11. Crear Paciente con edad eliminada 5-100 (Bebé de 1 año)
  console.log('\n--- 9. Crear paciente sin restricción 5-100 de edad ---');
  const infantDob = new Date();
  infantDob.setFullYear(infantDob.getFullYear() - 1);
  const infantDobStr = infantDob.toISOString().split('T')[0];

  const createPatientRes = await fetch(`${BACKEND_URL}/patients`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nombres: 'Mateo',
      apellidos: 'García Bebé',
      tipoDocumento: 'DNI',
      numeroDocumento: `${Math.floor(10000000 + Math.random() * 89999999)}`,
      fechaNacimiento: infantDobStr,
      telefono: '+51 912345678',
      correo: 'padres.mateo@correo.pe',
      ciudad: 'Lima',
      seguro: 'SIS',
    }),
  });
  const createdPatient = await createPatientRes.json();
  assert(createPatientRes.status === 201 && createdPatient.id, `Paciente de 1 año creado exitosamente (ID: #${createdPatient.id})`);

  // Intentar crear paciente con fecha futura -> Debe fallar con 400
  const futureDob = new Date();
  futureDob.setFullYear(futureDob.getFullYear() + 2);
  const futureDobStr = futureDob.toISOString().split('T')[0];
  const futurePatientRes = await fetch(`${BACKEND_URL}/patients`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nombres: 'Futuro',
      apellidos: 'Paciente',
      tipoDocumento: 'DNI',
      numeroDocumento: '99887766',
      fechaNacimiento: futureDobStr,
      telefono: '+51 912345678',
    }),
  });
  assert(futurePatientRes.status === 400, 'Paciente con fecha de nacimiento futura es rechazado con 400');

  // 12. Vinculación explícita cuenta-paciente (PATCH /api/v1/patients/{id}/link-user)
  console.log('\n--- 10. Vinculación explícita cuenta-paciente ---');
  // Obtener la cuenta de PACIENTE (usuarioId = 4 o creada)
  const patientUser = clinicUsers.find(u => u.rol === 'PACIENTE');
  assert(patientUser != null, 'Existe cuenta con rol PACIENTE en la clínica');

  const linkRes = await fetch(`${BACKEND_URL}/patients/${createdPatient.id}/link-user`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ usuarioId: patientUser.usuarioId }),
  });
  const linkedPatient = await linkRes.json();
  assert(linkRes.status === 200 && linkedPatient.usuarioId === patientUser.usuarioId, 'PATCH /link-user vincula cuenta de usuario al paciente');
  assert(linkedPatient.id !== linkedPatient.usuarioId, `paciente.id (#${linkedPatient.id}) es diferente de usuario.id (#${linkedPatient.usuarioId})`);

  // Desvincular cuenta
  const unlinkRes = await fetch(`${BACKEND_URL}/patients/${createdPatient.id}/link-user`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ usuarioId: null }),
  });
  const unlinkedPatient = await unlinkRes.json();
  assert(unlinkRes.status === 200 && unlinkedPatient.usuarioId === null, 'PATCH /link-user con null desvincula la cuenta');

  // 13. Editar paciente (PUT /api/v1/patients/{id})
  console.log('\n--- 11. Editar paciente (PUT) ---');
  const updatePatientRes = await fetch(`${BACKEND_URL}/patients/${createdPatient.id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nombres: 'Mateo Alejandro',
      apellidos: 'García Pérez',
      ciudad: 'Callao',
      telefono: '+51 988776655',
      seguro: 'EsSalud',
      estado: 'ACTIVO',
    }),
  });
  const updatedPatient = await updatePatientRes.json();
  assert(updatePatientRes.status === 200 && updatedPatient.nombres === 'Mateo Alejandro', 'PUT /api/v1/patients/{id} actualiza datos del paciente');

  // 14. Archivar paciente (PATCH /api/v1/patients/{id}/archive)
  console.log('\n--- 12. Archivar paciente (Baja lógica) ---');
  const archivePatientRes = await fetch(`${BACKEND_URL}/patients/${createdPatient.id}/archive`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
  const archivedPatient = await archivePatientRes.json();
  assert(archivePatientRes.status === 200 && archivedPatient.estado === 'ARCHIVADO', 'PATCH /api/v1/patients/{id}/archive cambia estado a ARCHIVADO');

  // 15. Odontólogo consulta paciente archivado -> recibe datos clínicos completos
  console.log('\n--- 13. Odontólogo consulta proyección clínica autorizada ---');
  const odontoLoginRes = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: 'odontologo@coronyx.pe', clave: '123456' }),
  });
  const odontoData = await odontoLoginRes.json();
  const odontoToken = odontoData.token;

  const odontoGetPatientRes = await fetch(`${BACKEND_URL}/patients/1`, {
    headers: { Authorization: `Bearer ${odontoToken}` },
  });
  const odontoPatient = await odontoGetPatientRes.json();
  assert(odontoGetPatientRes.status === 200, 'ODONTOLOGO accede a ficha de paciente');
  assert(odontoPatient.alergias !== null || odontoPatient.antecedentesMedicos !== null, 'ODONTOLOGO recibe proyección clínica autorizada');

  console.log('\n===============================================================');
  console.log(` RESULTADOS FINALES: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Error fatal durante la ejecución de pruebas:', err);
  process.exit(1);
});
