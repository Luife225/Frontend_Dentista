// Test suite de verificación para F02-B: Login y cliente API real
// Prueba cuatro cuentas, clave incorrecta, API caída, revalidación con /auth/me y RBAC

const API_BASE_URL = 'http://localhost:8081/api/v1';
const DECIMAL_ID_REGEX = /^[1-9]\d*$/;

function isDecimalId(val) {
  return typeof val === 'string' && DECIMAL_ID_REGEX.test(val);
}

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failCount++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('--- INICIO DE PRUEBAS F02-B: CLIENTE API Y SEGURIDAD ---');
  console.log('======================================================\n');

  // 1. Prueba de las cuatro cuentas institucionales
  console.log('--- Caso 1: Login de las 4 cuentas institucionales reales ---');
  const accounts = [
    { email: 'odontologo@coronyx.pe', expectedRole: 'ODONTOLOGO' },
    { email: 'recepcion@coronyx.pe', expectedRole: 'RECEPCIONISTA' },
    { email: 'admin@coronyx.pe', expectedRole: 'ADMIN_CLINICA' },
    { email: 'paciente@coronyx.pe', expectedRole: 'PACIENTE' },
  ];

  const tokens = {};

  for (const acc of accounts) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ correo: acc.email, clave: '123456' }),
    });

    assert(res.status === 200, `Login ${acc.email} responde HTTP 200 OK`);
    const data = await res.json();
    assert(data.rol === acc.expectedRole, `Rol esperado ${acc.expectedRole} coincide con recibido ${data.rol}`);
    assert(isDecimalId(data.id), `ID de usuario (${data.id}) es decimal string positivo`);
    assert(isDecimalId(data.usuarioId), `usuarioId (${data.usuarioId}) es decimal string positivo`);
    assert(Boolean(data.token), `Token JWT retornado y no nulo`);
    if (acc.expectedRole !== 'PACIENTE') {
      assert(isDecimalId(data.usuarioClinicaId), `usuarioClinicaId (${data.usuarioClinicaId}) es decimal string`);
      assert(isDecimalId(data.clinicaId), `clinicaId (${data.clinicaId}) es decimal string`);
    }
    tokens[acc.expectedRole] = data.token;
  }

  // 2. Prueba de clave incorrecta
  console.log('\n--- Caso 2: Login con clave incorrecta (no abre sesión) ---');
  {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ correo: 'odontologo@coronyx.pe', clave: 'clave_erronea_123' }),
    });
    assert(res.status === 400, `Clave incorrecta es rechazada con HTTP 400 Bad Request (recibido ${res.status})`);
    const err = await res.json();
    assert(err.message && err.message.includes('contraseña'), `Mensaje explícito recibido: "${err.message}"`);
  }

  // 3. Prueba de usuario inexistente
  console.log('\n--- Caso 3: Login con correo no registrado (no abre sesión) ---');
  {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ correo: 'noexiste@coronyx.pe', clave: '123456' }),
    });
    assert(res.status === 400, `Usuario inexistente es rechazado con HTTP 400 Bad Request`);
    const err = await res.json();
    assert(err.message && err.message.includes('correo'), `Mensaje explícito recibido: "${err.message}"`);
  }

  // 4. Prueba de API caída / puerto inexistente
  console.log('\n--- Caso 4: Conexión a API caída / host no alcanzable ---');
  {
    let catched = false;
    let errorMsg = '';
    try {
      await fetch('http://localhost:59999/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: 'admin@coronyx.pe', clave: '123456' }),
      });
    } catch (e) {
      catched = true;
      errorMsg = e.message;
    }
    assert(catched, `Petición a API caída arroja excepción de red y NO crea sesión`);
  }

  // 5. Prueba de restauración y revalidación de sesión con GET /api/v1/auth/me
  console.log('\n--- Caso 5: Restauración de sesión con GET /api/v1/auth/me ---');
  {
    // Con token válido de ODONTOLOGO
    const resMe = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens['ODONTOLOGO']}`, 'Accept': 'application/json' },
    });
    assert(resMe.status === 200, `GET /auth/me con token válido retorna 200 OK`);
    const meData = await resMe.json();
    assert(meData.rol === 'ODONTOLOGO', `Rol en /auth/me es ODONTOLOGO`);
    assert(isDecimalId(meData.usuarioId), `usuarioId es decimal string (${meData.usuarioId})`);
    assert(isDecimalId(meData.usuarioClinicaId), `usuarioClinicaId es decimal string (${meData.usuarioClinicaId})`);
    assert(meData.token === null || meData.token === undefined, `Endpoint /auth/me NO expone token en el body (contrato acordado)`);

    // Sin token
    const resNoToken = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    assert(resNoToken.status === 401, `GET /auth/me sin token retorna 401 Unauthorized`);

    // Con token inválido / manipulado
    const resBadToken = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer token.corrupto.invalido', 'Accept': 'application/json' },
    });
    assert(resBadToken.status === 401, `GET /auth/me con token corrupto retorna 401 Unauthorized`);
  }

  // 6. Prueba de autorización en directorio GET /api/v1/auth/users (fetchUsersFromApi)
  console.log('\n--- Caso 6: Directorio /auth/users con control RBAC ---');
  {
    // ADMIN_CLINICA: Autorizado
    const resAdmin = await fetch(`${API_BASE_URL}/auth/users`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens['ADMIN_CLINICA']}`, 'Accept': 'application/json' },
    });
    assert(resAdmin.status === 200, `ADMIN_CLINICA autorizado para consultar /auth/users (HTTP 200 OK)`);
    const users = await resAdmin.json();
    assert(Array.isArray(users) && users.length > 0, `Directorio devuelve ${users.length} miembros`);
    assert(users.every(u => isDecimalId(u.id)), `Todos los usuarios del directorio poseen ID decimal string`);

    // RECEPCIONISTA: No autorizado -> 403 Forbidden
    const resRecep = await fetch(`${API_BASE_URL}/auth/users`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens['RECEPCIONISTA']}`, 'Accept': 'application/json' },
    });
    assert(resRecep.status === 403, `RECEPCIONISTA rechazado en /auth/users con HTTP 403 Forbidden`);

    // ODONTOLOGO: No autorizado -> 403 Forbidden
    const resOdonto = await fetch(`${API_BASE_URL}/auth/users`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens['ODONTOLOGO']}`, 'Accept': 'application/json' },
    });
    assert(resOdonto.status === 403, `ODONTOLOGO rechazado en /auth/users con HTTP 403 Forbidden`);

    // Sin token: 401 Unauthorized
    const resSinToken = await fetch(`${API_BASE_URL}/auth/users`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    assert(resSinToken.status === 401, `/auth/users sin token retorna HTTP 401 Unauthorized`);
  }

  // 7. Prueba de exclusión de datos clínicos en DTO administrativo (Control G02)
  console.log('\n--- Caso 7: Exclusión de datos clínicos para rol administrativo ---');
  {
    // Consulta como ADMIN_CLINICA al paciente 1
    const resPacAdmin = await fetch(`${API_BASE_URL}/patients/1`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens['ADMIN_CLINICA']}`, 'Accept': 'application/json' },
    });
    assert(resPacAdmin.status === 200, `ADMIN_CLINICA consulta paciente 1 con HTTP 200`);
    const pacAdmin = await resPacAdmin.json();
    assert(pacAdmin.alergias === null || pacAdmin.alergias === undefined, `alergias está excluida (null) para ADMIN_CLINICA`);
    assert(pacAdmin.antecedentesMedicos === null || pacAdmin.antecedentesMedicos === undefined, `antecedentesMedicos está excluida (null) para ADMIN_CLINICA`);

    // Consulta como ODONTOLOGO al paciente 1
    const resPacOdonto = await fetch(`${API_BASE_URL}/patients/1`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens['ODONTOLOGO']}`, 'Accept': 'application/json' },
    });
    assert(resPacOdonto.status === 200, `ODONTOLOGO consulta paciente 1 con HTTP 200`);
    const pacOdonto = await resPacOdonto.json();
    assert(pacOdonto.alergias === 'Penicilina', `ODONTOLOGO recibe alergias completas ("Penicilina")`);
  }

  console.log('\n======================================================');
  console.log(`--- RESUMEN: ${passCount} pruebas pasadas, ${failCount} fallos ---`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Error fatal durante la prueba:', err);
  process.exit(1);
});
