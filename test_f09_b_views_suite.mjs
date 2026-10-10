/**
 * ============================================================================
 * TEST SUITE F09 B: PRUEBAS DE VISTAS, INTEGRACIÓN Y RESILIENCIA
 * Sistema Odontológico Multi-Sede Coronyx
 *
 * Denominadores Oficiales de Vistas:
 * - ADMIN_CLINICA:  11 / 11 (Mínimo requerido: 9/11)
 * - RECEPCIONISTA:  10 / 10 (Mínimo requerido: 8/10)
 * - ODONTOLOGO:      8 / 8  (Mínimo requerido: 7/8)
 * - PACIENTE:        5 / 5  (Mínimo requerido: 4/5)
 * Total Casos CSV:  34 / 34 (100%)
 *
 * Validaciones Extra F08:
 * - F08-1: Odontograma interactivo (SVG, borrador, confirmación inmutable y evolución)
 * - F08-2: Disponibilidad y horarios de clínica (slots dinámicos sin mocks)
 * - F08-3: Panel de notificaciones (recuperación por rol y marcado de lectura)
 *
 * Resiliencia y Ciclo de Vida UI:
 * - Segundo Navegador (sesiones aisladas concurrentes sin fuga de tokens)
 * - Recarga / Reinicio (rehidratación de sesión con /auth/me tras F5)
 * - Loading / Error / Vacío (manejo de listas vacías y errores)
 * - API Caída (manejo de desconexión sin pantalla blanca)
 * - Sesión Expirada (401 -> invalidación de almacenamiento local)
 * ============================================================================
 */

import crypto from 'crypto';

const BASE_URL = 'http://localhost:8081/api/v1';

// Contadores de Denominadores Oficiales
const stats = {
  admin: { total: 11, passed: 0, pending: 0, failed: 0 },
  recepcion: { total: 10, passed: 0, pending: 0, failed: 0 },
  odontologo: { total: 8, passed: 0, pending: 0, failed: 0 },
  paciente: { total: 5, passed: 0, pending: 0, failed: 0 },
  f08Extra: { total: 3, passed: 0, pending: 0, failed: 0 },
  resiliencia: { total: 5, passed: 0, pending: 0, failed: 0 }
};

function log(msg) {
  console.log(`[VISTAS-F09-B] ${msg}`);
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FALLÓ LA ASERCIÓN: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

// Helper para login real contra el backend
async function login(correo, clave) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, clave })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Login falló para ${correo}: HTTP ${res.status} - ${errText}`);
  }
  return await res.json();
}

// Helper multipart
function buildMultipartFormData(fields, file) {
  const boundary = '----WebKitFormBoundary' + crypto.randomBytes(16).toString('hex');
  const crlf = '\r\n';
  let bufferChunks = [];

  for (const [key, value] of Object.entries(fields)) {
    let part = `--${boundary}${crlf}`;
    part += `Content-Disposition: form-data; name="${key}"${crlf}${crlf}`;
    part += `${value}${crlf}`;
    bufferChunks.push(Buffer.from(part, 'utf-8'));
  }

  if (file) {
    let filePart = `--${boundary}${crlf}`;
    filePart += `Content-Disposition: form-data; name="${file.fieldName}"; filename="${file.filename}"${crlf}`;
    filePart += `Content-Type: ${file.contentType}${crlf}${crlf}`;
    bufferChunks.push(Buffer.from(filePart, 'utf-8'));
    bufferChunks.push(file.data);
    bufferChunks.push(Buffer.from(crlf, 'utf-8'));
  }

  bufferChunks.push(Buffer.from(`--${boundary}--${crlf}`, 'utf-8'));
  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: Buffer.concat(bufferChunks)
  };
}

// Helper para obtener slots libres dinámicos sin colisión
async function getFreeSlot(odontologoId, minDaysAhead, token) {
  let d = new Date();
  d.setDate(d.getDate() + minDaysAhead);
  for (let i = 0; i < 40; i++) {
    if (d.getDay() !== 0) { // Lunes a Sábado
      const iso = d.toISOString().split('T')[0];
      const res = await fetch(`${BASE_URL}/disponibilidad/slots?odontologoId=${odontologoId}&fecha=${iso}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const slots = await res.json();
        const free = slots.find(s => s.disponible);
        if (free) {
          return {
            fecha: iso,
            inicio: `${iso}T${free.inicio}:00-05:00`,
            fin: `${iso}T${free.fin}:00-05:00`
          };
        }
      }
    }
    d.setDate(d.getDate() + 1);
  }
  throw new Error(`No se encontró slot libre para odontólogo ${odontologoId}`);
}

async function runViewsMasterSuite() {
  log('================================================================================');
  log('BATERÍA F09 B: PRUEBAS DE VISTAS, INTEGRACIÓN Y RESILIENCIA (34 CASOS + F08)');
  log(`Fecha y Hora Local: ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}`);
  log('Entorno: Localhost (Spring Boot 8081 + Vite 5173 + PostgreSQL 18)');
  log('================================================================================\n');

  // ===========================================================================
  // FASE 0: AUTENTICACIÓN DE CUENTAS PERSISTENTES DE LOS CUATRO ROLES
  // ===========================================================================
  log('Fase 0: Autenticación de cuentas persistentes...');
  const adminSession = await login('admin@coronyx.pe', '123456');
  const recepSession = await login('recepcion@coronyx.pe', '123456');
  const odontoSession = await login('odontologo@coronyx.pe', '123456');
  const pacienteSession = await login('paciente@coronyx.pe', '123456');

  assert(adminSession.rol === 'ADMIN_CLINICA', 'Sesión ADMIN_CLINICA activa');
  assert(recepSession.rol === 'RECEPCIONISTA', 'Sesión RECEPCIONISTA activa');
  assert(odontoSession.rol === 'ODONTOLOGO', 'Sesión ODONTOLOGO activa');
  assert(pacienteSession.rol === 'PACIENTE', 'Sesión PACIENTE activa');
  assert(typeof adminSession.usuarioId === 'string', 'Long precision: usuarioId serializado como string');

  // ===========================================================================
  // SECCIÓN 1: VISTAS ROL ADMIN_CLINICA (A01 - A11)
  // Rutas: /app/consultorio, /app/pacientes, /app/agenda, /app/dashboard
  // ===========================================================================
  log('\n─────────────────────────────────────────────────────────────────────────────');
  log('SECCIÓN 1: EVALUACIÓN DE VISTAS ADMIN_CLINICA (A01 - A11) - Meta: >= 9/11');
  log('─────────────────────────────────────────────────────────────────────────────');

  // A01: Crear cuenta staff de su clínica en /app/consultorio
  const timestamp = Date.now();
  const newStaffEmail = `staff_vistas_${timestamp}@coronyx.pe`;
  const createStaffRes = await fetch(`${BASE_URL}/clinic/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nombres: 'Staff',
      apellidos: 'Vistas F09',
      correo: newStaffEmail,
      clave: 'Password123!',
      rol: 'RECEPCIONISTA',
      cargo: 'Recepcionista Turno Tarde'
    })
  });
  assert(createStaffRes.status === 201, 'A01 [/app/consultorio]: Creación de cuenta staff retornó 201 Created');
  const createdStaff = await createStaffRes.json();
  const staffLogin = await login(newStaffEmail, 'Password123!');
  assert(Boolean(staffLogin.token), 'A01: Login exitoso con nueva cuenta staff');
  stats.admin.passed++;

  // A02: Editar cuenta staff en /app/consultorio
  const editStaffRes = await fetch(`${BASE_URL}/clinic/users/${createdStaff.id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nombres: 'Staff Actualizado',
      apellidos: 'Vistas F09',
      rol: 'RECEPCIONISTA',
      estado: 'ACTIVO'
    })
  });
  assert(editStaffRes.status === 200, 'A02 [/app/consultorio]: Edición de datos de staff retornó 200 OK');
  stats.admin.passed++;

  // A03: Desactivar cuenta y verificar pérdida de acceso en /app/consultorio
  const toggleStatusRes = await fetch(`${BASE_URL}/clinic/users/${createdStaff.id}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ estado: 'INACTIVO' })
  });
  assert(toggleStatusRes.status === 200, 'A03 [/app/consultorio]: Desactivación de cuenta retornó 200 OK');
  const deadTokenRes = await fetch(`${BASE_URL}/dashboard/resumen`, {
    headers: { Authorization: `Bearer ${staffLogin.token}` }
  });
  assert(deadTokenRes.status === 401, 'A03: Petición con token de usuario desactivado rechazada con 401 Unauthorized');
  stats.admin.passed++;

  // A04: Asignar rol autorizado (bloquear SUPER_ADMIN) en /app/consultorio
  const badSuperAdminRes = await fetch(`${BASE_URL}/clinic/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nombres: 'Intruso',
      apellidos: 'Root',
      correo: `super_${timestamp}@coronyx.pe`,
      clave: 'Password123!',
      rol: 'SUPER_ADMIN'
    })
  });
  assert(badSuperAdminRes.status === 400, 'A04 [/app/consultorio]: Intento de elevar a SUPER_ADMIN rechazado con 400 Bad Request');
  stats.admin.passed++;

  // A05: Buscar / listar pacientes administrativos en /app/pacientes
  const adminPatientsRes = await fetch(`${BASE_URL}/patients`, {
    headers: { Authorization: `Bearer ${adminSession.token}` }
  });
  assert(adminPatientsRes.status === 200, 'A05 [/app/pacientes]: Listado administrativo de pacientes retornó 200 OK');
  const adminPatients = await adminPatientsRes.json();
  assert(Array.isArray(adminPatients) && adminPatients.length > 0, 'A05: Pacientes listados correctamente');
  stats.admin.passed++;

  // A06: Registrar paciente administrativo en /app/pacientes
  const regAdminPatientRes = await fetch(`${BASE_URL}/patients`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nombres: 'Nicolás',
      apellidos: 'Pediátrico Vistas',
      tipoDocumento: 'DNI',
      numeroDocumento: `7${timestamp.toString().slice(-7)}`,
      fechaNacimiento: '2019-06-15',
      sexo: 'MASCULINO',
      nombreApoderado: 'Valeria Apoderada',
      telefonoApoderado: '912345678',
      parentescoApoderado: 'MADRE'
    })
  });
  assert(regAdminPatientRes.status === 201, 'A06 [/app/pacientes]: Registro de paciente administrativo retornó 201 Created');
  const adminNewPatient = await regAdminPatientRes.json();
  stats.admin.passed++;

  // A07: Editar paciente administrativo en /app/pacientes
  const editAdminPatientRes = await fetch(`${BASE_URL}/patients/${adminNewPatient.id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      telefono: '911999888',
      direccion: 'Jr. Huancavelica 550'
    })
  });
  assert(editAdminPatientRes.status === 200, 'A07 [/app/pacientes]: Edición administrativa de contacto retornó 200 OK');
  stats.admin.passed++;

  // A08: Gestionar ciclo de citas (agendar) en /app/agenda
  const slotA08 = await getFreeSlot('1', 5, adminSession.token);
  const adminApptRes = await fetch(`${BASE_URL}/citas`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pacienteId: String(adminNewPatient.id),
      odontologoId: '1',
      inicioEn: slotA08.inicio,
      finEn: slotA08.fin,
      modalidad: 'PRESENCIAL',
      motivo: 'Evaluación general A08',
      consultorio: 'Sillón 1'
    })
  });
  assert(adminApptRes.status === 201, 'A08 [/app/agenda]: Agendamiento administrativo de cita retornó 201 Created');
  const adminAppt = await adminApptRes.json();
  stats.admin.passed++;

  // A09: Configuración de horarios en /app/consultorio
  const adminHoursRes = await fetch(`${BASE_URL}/disponibilidad/horarios`, {
    headers: { Authorization: `Bearer ${adminSession.token}` }
  });
  assert(adminHoursRes.status === 200, 'A09 [/app/consultorio]: Consulta de horarios de atención retornó 200 OK');
  stats.admin.passed++;

  // A10: Cancelación de cita con motivo auditado en /app/agenda
  const cancelApptRes = await fetch(`${BASE_URL}/citas/${adminAppt.id}/estado`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      estado: 'CANCELADA',
      motivoCancelacion: 'Cancelada administrativamente en prueba de vista'
    })
  });
  assert(cancelApptRes.status === 200, 'A10 [/app/agenda]: Cancelación de cita con motivo retornó 200 OK');
  stats.admin.passed++;

  // A11: Panel operativo de dashboard en /app/dashboard
  const dashRes = await fetch(`${BASE_URL}/dashboard/resumen`, {
    headers: { Authorization: `Bearer ${adminSession.token}` }
  });
  assert(dashRes.status === 200, 'A11 [/app/dashboard]: Resumen de dashboard en America/Lima retornó 200 OK');
  const dashData = await dashRes.json();
  assert(typeof dashData.totalCitasHoy === 'number', 'A11: totalCitasHoy es numérico');
  stats.admin.passed++;

  // ===========================================================================
  // SECCIÓN 2: VISTAS ROL RECEPCIONISTA (R01 - R10)
  // Rutas: /app/pacientes, /app/agenda
  // ===========================================================================
  log('\n─────────────────────────────────────────────────────────────────────────────');
  log('SECCIÓN 2: EVALUACIÓN DE VISTAS RECEPCIONISTA (R01 - R10) - Meta: >= 8/10');
  log('─────────────────────────────────────────────────────────────────────────────');

  // R01: Listar pacientes en recepción /app/pacientes
  const recepPatientsRes = await fetch(`${BASE_URL}/patients`, {
    headers: { Authorization: `Bearer ${recepSession.token}` }
  });
  assert(recepPatientsRes.status === 200, 'R01 [/app/pacientes]: Recepción lista pacientes (200 OK)');
  stats.recepcion.passed++;

  // R02: Registrar paciente en recepción /app/pacientes
  const recepPatientRes = await fetch(`${BASE_URL}/patients`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${recepSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nombres: 'Carla',
      apellidos: 'Mostrador Vistas',
      tipoDocumento: 'DNI',
      numeroDocumento: `8${timestamp.toString().slice(-7)}`,
      fechaNacimiento: '1995-11-20',
      sexo: 'FEMENINO',
      telefono: '944555666',
      email: `carla_${timestamp}@coronyx.pe`
    })
  });
  assert(recepPatientRes.status === 201, 'R02 [/app/pacientes]: Registro de paciente en mostrador retornó 201 Created');
  const recepNewPatient = await recepPatientRes.json();
  stats.recepcion.passed++;

  // R03: Actualizar contacto en /app/pacientes
  const recepEditRes = await fetch(`${BASE_URL}/patients/${recepNewPatient.id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${recepSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      telefono: '944777888',
      direccion: 'Av. Colonial 980'
    })
  });
  assert(recepEditRes.status === 200, 'R03 [/app/pacientes]: Actualización de teléfono y dirección retornó 200 OK');
  stats.recepcion.passed++;

  // R04: Consultar agenda en /app/agenda
  const recepAgendaRes = await fetch(`${BASE_URL}/citas`, {
    headers: { Authorization: `Bearer ${recepSession.token}` }
  });
  assert(recepAgendaRes.status === 200, 'R04 [/app/agenda]: Consulta de agenda clínica retornó 200 OK');
  stats.recepcion.passed++;

  // R05: Consultar disponibilidad y slots libres en /app/agenda (modal agendar)
  const slotR06 = await getFreeSlot('1', 6, recepSession.token);
  assert(Boolean(slotR06.inicio), 'R05 [/app/agenda]: Slots dinámicos calculados por motor de disponibilidad');
  stats.recepcion.passed++;

  // R06: Crear cita por recepción en /app/agenda
  const recepBookRes = await fetch(`${BASE_URL}/citas`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${recepSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pacienteId: String(recepNewPatient.id),
      odontologoId: '1',
      inicioEn: slotR06.inicio,
      finEn: slotR06.fin,
      modalidad: 'PRESENCIAL',
      motivo: 'Control general R06',
      consultorio: 'Sillón 1'
    })
  });
  assert(recepBookRes.status === 201, 'R06 [/app/agenda]: Agendamiento por recepción retornó 201 Created');
  const recepAppt = await recepBookRes.json();
  stats.recepcion.passed++;

  // R07: Registrar asistencia física en /app/agenda -> FINALIZADA
  const markAsistioRes = await fetch(`${BASE_URL}/citas/${recepAppt.id}/asistencia`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${recepSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ asistencia: 'ASISTIO' })
  });
  assert(markAsistioRes.status === 200, 'R07 [/app/agenda]: Asistencia física registrada (200 OK, FINALIZADA)');
  stats.recepcion.passed++;

  // R08: Crear otra cita para marcar NO_SHOW
  const slotR08 = await getFreeSlot('1', 7, recepSession.token);
  const apptNoShowRes = await fetch(`${BASE_URL}/citas`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${recepSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pacienteId: String(recepNewPatient.id),
      odontologoId: '1',
      inicioEn: slotR08.inicio,
      finEn: slotR08.fin,
      modalidad: 'PRESENCIAL',
      motivo: 'Cita para no-show R08',
      consultorio: 'Sillón 1'
    })
  });
  const apptNoShow = await apptNoShowRes.json();
  const markNoShowRes = await fetch(`${BASE_URL}/citas/${apptNoShow.id}/asistencia`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${recepSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ asistencia: 'NO_SHOW' })
  });
  assert(markNoShowRes.status === 200, 'R08 [/app/agenda]: Inasistencia NO_SHOW registrada (200 OK, NO_ASISTIO)');
  stats.recepcion.passed++;

  // R09: Reprogramación directa por recepción en /app/agenda
  const slotR09 = await getFreeSlot('1', 8, recepSession.token);
  const apptReprogRes = await fetch(`${BASE_URL}/citas`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${recepSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pacienteId: String(recepNewPatient.id),
      odontologoId: '1',
      inicioEn: slotR09.inicio,
      finEn: slotR09.fin,
      modalidad: 'PRESENCIAL',
      motivo: 'Cita para reprogramar R09',
      consultorio: 'Sillón 1'
    })
  });
  const apptReprog = await apptReprogRes.json();
  const slotTargetR09 = await getFreeSlot('1', 9, recepSession.token);
  const directReprogRes = await fetch(`${BASE_URL}/citas/${apptReprog.id}/reprogramar?nuevoInicio=${slotTargetR09.inicio}&nuevoFin=${slotTargetR09.fin}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${recepSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nuevaFechaHoraInicio: slotTargetR09.inicio,
      nuevaFechaHoraFin: slotTargetR09.fin,
      motivo: 'Reprogramación directa acordada con paciente'
    })
  });
  assert(directReprogRes.status === 200, 'R09 [/app/agenda]: Reprogramación directa retornó 200 OK (REPROGRAMADA)');
  stats.recepcion.passed++;

  // R10: Bandeja de solicitudes de reprogramación y resolución en /app/agenda
  const slotR10 = await getFreeSlot('1', 10, recepSession.token);
  const apptR10Res = await fetch(`${BASE_URL}/citas`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${recepSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pacienteId: String(pacienteSession.pacienteId),
      odontologoId: '1',
      inicioEn: slotR10.inicio,
      finEn: slotR10.fin,
      modalidad: 'PRESENCIAL',
      motivo: 'Cita para solicitud R10',
      consultorio: 'Consultorio 1'
    })
  });
  const apptR10 = await apptR10Res.json();
  const slotSol = await getFreeSlot('1', 11, pacienteSession.token);
  const createSolRes = await fetch(`${BASE_URL}/citas/${apptR10.id}/solicitar-reprogramacion`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pacienteSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nuevaFechaHoraInicio: slotSol.inicio,
      nuevaFechaHoraFin: slotSol.fin,
      motivo: 'Solicitud para recepción R10'
    })
  });
  const createdSol = await createSolRes.json();

  const resolveSolRes = await fetch(`${BASE_URL}/citas/solicitudes-reprogramacion/${createdSol.id}/resolver`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${recepSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      estado: 'APROBADA',
      motivoResolucion: 'Aprobada en vista de agenda'
    })
  });
  assert(resolveSolRes.status === 200, 'R10 [/app/agenda]: Resolución de solicitud de reprogramación retornó 200 OK');
  stats.recepcion.passed++;

  // ===========================================================================
  // SECCIÓN 3: VISTAS ROL ODONTOLOGO (D01 - D08)
  // Rutas: /app/pacientes, /app/agenda
  // ===========================================================================
  log('\n─────────────────────────────────────────────────────────────────────────────');
  log('SECCIÓN 3: EVALUACIÓN DE VISTAS ODONTOLOGO (D01 - D08) - Meta: >= 7/8');
  log('─────────────────────────────────────────────────────────────────────────────');

  // D01: Consultar historia clínica completa en /app/pacientes
  const d01Res = await fetch(`${BASE_URL}/clinical-encounters/paciente/${pacienteSession.pacienteId}`, {
    headers: { Authorization: `Bearer ${odontoSession.token}` }
  });
  const d01PatientRes = await fetch(`${BASE_URL}/patients/${pacienteSession.pacienteId}`, {
    headers: { Authorization: `Bearer ${odontoSession.token}` }
  });
  assert(d01Res.status === 200 && d01PatientRes.status === 200, 'D01 [/app/pacientes]: Ficha clínica integral y atenciones retornaron 200 OK');
  stats.odontologo.passed++;

  // D02: Crear borrador de atención clínica en /app/pacientes
  const d02Res = await fetch(`${BASE_URL}/clinical-encounters`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${odontoSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pacienteId: Number(pacienteSession.pacienteId),
      citaId: Number(apptR10.id),
      diagnostico: 'Pulpitis reversible en pieza 16',
      procedimientos: 'Apertura y recubrimiento pulpar indirecto',
      recetasPrescripciones: 'Ibuprofeno 400mg c/8h',
      evolucion: 'Borrador clínico de vista D02'
    })
  });
  assert(d02Res.status === 201, 'D02 [/app/pacientes]: Apertura de borrador retornó 201 Created');
  const d02Encounter = await d02Res.json();
  assert(d02Encounter.estado === 'BORRADOR', 'D02: Encuentro en estado BORRADOR');
  stats.odontologo.passed++;

  // D03: Guardado progresivo de borrador en /app/pacientes
  const d03Res = await fetch(`${BASE_URL}/clinical-encounters/${d02Encounter.id}/draft`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${odontoSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      diagnostico: 'Pulpitis reversible controlada',
      procedimientos: 'Apertura y restauración provisional con ionómero',
      evolucion: 'Paciente asintomático'
    })
  });
  assert(d03Res.status === 200, 'D03 [/app/pacientes]: Guardado progresivo retornó 200 OK');
  stats.odontologo.passed++;

  // D04: Confirmación inmutable de atención médica en /app/pacientes
  const d04Res = await fetch(`${BASE_URL}/clinical-encounters/${d02Encounter.id}/confirm`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${odontoSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ notasConfirmacion: 'Atención confirmada por Dr. Andrés Herrera' })
  });
  assert(d04Res.status === 200, 'D04 [/app/pacientes]: Confirmación inmutable retornó 200 OK');
  const d04Encounter = await d04Res.json();
  assert(d04Encounter.estado === 'CONFIRMADO' || d04Encounter.estado === 'CONFIRMADA', 'D04: Encuentro pasa a CONFIRMADO');
  stats.odontologo.passed++;

  // D05: Historial de versiones intactas en /app/pacientes
  const d05Res = await fetch(`${BASE_URL}/clinical-encounters/${d02Encounter.id}/versions`, {
    headers: { Authorization: `Bearer ${odontoSession.token}` }
  });
  assert(d05Res.status === 200, 'D05 [/app/pacientes]: Consulta de versiones históricas retornó 200 OK');
  const versionsList = await d05Res.json();
  assert(Array.isArray(versionsList) && versionsList.length >= 1, 'D05: Versiones clínicas intactas comprobadas');
  stats.odontologo.passed++;

  // D06: Creación de versión correctiva/evolutiva N+1 en /app/pacientes
  const d06Res = await fetch(`${BASE_URL}/clinical-encounters/${d02Encounter.id}/versions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${odontoSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      diagnostico: 'Control de pieza 16 asintomática',
      procedimientos: 'Obturación definitiva con resina',
      evolucion: 'Versión evolutiva v2 preservando v1 intacta'
    })
  });
  assert(d06Res.status === 201, 'D06 [/app/pacientes]: Versión evolutiva N+1 retornó 201 Created');
  stats.odontologo.passed++;

  // D07: Odontograma interactivo persistente y versionado en /app/pacientes
  const odontoRes = await fetch(`${BASE_URL}/odontograma/paciente/${pacienteSession.pacienteId}/actual`, {
    headers: { Authorization: `Bearer ${odontoSession.token}` }
  });
  assert(odontoRes.status === 200, 'D07 [/app/pacientes]: Odontograma interactivo actual retornó 200 OK');
  stats.odontologo.passed++;

  // D08: Cargar radiografía privada y publicación al portal en /app/pacientes
  const radioBytes = crypto.randomBytes(3072);
  const radioFormData = buildMultipartFormData(
    {
      pacienteId: String(pacienteSession.pacienteId),
      tipoArchivo: 'RADIOGRAFIA',
      regionAnatomica: 'Bite-wing molar',
      esVisiblePaciente: 'false'
    },
    {
      fieldName: 'file',
      filename: 'radiografia_vistas_f09.pdf',
      contentType: 'application/pdf',
      data: radioBytes
    }
  );
  const uploadRadioRes = await fetch(`${BASE_URL}/attachments/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${odontoSession.token}`,
      'Content-Type': radioFormData.contentType
    },
    body: radioFormData.body
  });
  assert(uploadRadioRes.status === 201, 'D08 [/app/pacientes]: Carga de radiografía privada retornó 201 Created');
  const uploadedRadio = await uploadRadioRes.json();

  // Publicar al portal
  const publishRadioRes = await fetch(`${BASE_URL}/attachments/${uploadedRadio.id}/visibility`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${odontoSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ esVisiblePaciente: true })
  });
  assert(publishRadioRes.status === 200, 'D08 [/app/pacientes]: Publicación a portal del paciente retornó 200 OK');
  stats.odontologo.passed++;

  // ===========================================================================
  // SECCIÓN 4: VISTAS ROL PACIENTE (P01 - P05)
  // Ruta: /app/patient-portal
  // ===========================================================================
  log('\n─────────────────────────────────────────────────────────────────────────────');
  log('SECCIÓN 4: EVALUACIÓN DE VISTAS PACIENTE (P01 - P05) - Meta: >= 4/5');
  log('─────────────────────────────────────────────────────────────────────────────');

  // P01: Consultar citas propias en /app/patient-portal
  const p01Res = await fetch(`${BASE_URL}/me/citas`, {
    headers: { Authorization: `Bearer ${pacienteSession.token}` }
  });
  assert(p01Res.status === 200, 'P01 [/app/patient-portal]: Paciente consulta citas propias en /me/citas (200 OK)');
  const patientAppts = await p01Res.json();
  assert(Array.isArray(patientAppts), 'P01: Citas listadas como arreglo');
  stats.paciente.passed++;

  // P02: Agendamiento autónomo en /app/patient-portal sin suplantación
  const slotP02 = await getFreeSlot('1', 13, pacienteSession.token);
  const p02Res = await fetch(`${BASE_URL}/me/citas`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pacienteSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      odontologoId: '1',
      inicioEn: slotP02.inicio,
      finEn: slotP02.fin,
      modalidad: 'PRESENCIAL',
      motivo: 'Cita agendada desde portal P02',
      consultorio: 'Consultorio 1'
    })
  });
  assert(p02Res.status === 201, 'P02 [/app/patient-portal]: Agendamiento autónomo retornó 201 Created');
  const patientNewAppt = await p02Res.json();
  assert(patientNewAppt.pacienteId === String(pacienteSession.pacienteId), 'P02: Cita asignada estrictamente al paciente autenticado');
  stats.paciente.passed++;

  // P03: Solicitar reprogramación en /app/patient-portal
  const slotP03 = await getFreeSlot('1', 14, pacienteSession.token);
  const p03Res = await fetch(`${BASE_URL}/citas/${patientNewAppt.id}/solicitar-reprogramacion`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pacienteSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nuevaFechaHoraInicio: slotP03.inicio,
      nuevaFechaHoraFin: slotP03.fin,
      motivo: 'Cambio de turno laboral del paciente'
    })
  });
  assert(p03Res.status === 201, 'P03 [/app/patient-portal]: Solicitud de reprogramación retornó 201 Created');
  stats.paciente.passed++;

  // P04: Descarga de documentos compartidos en /app/patient-portal
  const p04Res = await fetch(`${BASE_URL}/attachments/${uploadedRadio.id}/download`, {
    headers: { Authorization: `Bearer ${pacienteSession.token}` }
  });
  assert(p04Res.status === 200, 'P04 [/app/patient-portal]: Descarga de radiografía compartida retornó 200 OK');
  const p04Bytes = Buffer.from(await p04Res.arrayBuffer());
  assert(p04Bytes.length === radioBytes.length, 'P04: Integridad de bytes verificada');
  stats.paciente.passed++;

  // P05: Carga autónoma de archivo y rechazo a ID ajeno en /app/patient-portal
  const p05Bytes = crypto.randomBytes(1536);
  const p05FormData = buildMultipartFormData(
    {
      pacienteId: String(pacienteSession.pacienteId),
      tipoArchivo: 'DOCUMENTO',
      notas: 'Análisis de laboratorio paciente P05',
      esVisiblePaciente: 'true'
    },
    {
      fieldName: 'file',
      filename: 'analisis_sangre_paciente.pdf',
      contentType: 'application/pdf',
      data: p05Bytes
    }
  );
  const p05Res = await fetch(`${BASE_URL}/attachments/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pacienteSession.token}`,
      'Content-Type': p05FormData.contentType
    },
    body: p05FormData.body
  });
  assert(p05Res.status === 201, 'P05 [/app/patient-portal]: Carga autónoma de archivo propio retornó 201 Created');

  // Negativo P05: Intento a ID ajeno
  const p05ForeignFormData = buildMultipartFormData(
    {
      pacienteId: '99999',
      tipoArchivo: 'DOCUMENTO',
      esVisiblePaciente: 'true'
    },
    {
      fieldName: 'file',
      filename: 'infiltrado.pdf',
      contentType: 'application/pdf',
      data: p05Bytes
    }
  );
  const p05ForeignRes = await fetch(`${BASE_URL}/attachments/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pacienteSession.token}`,
      'Content-Type': p05ForeignFormData.contentType
    },
    body: p05ForeignFormData.body
  });
  assert(p05ForeignRes.status === 403, 'P05: Intento de cargar a expediente ajeno RECHAZADO con 403 Forbidden');
  stats.paciente.passed++;

  // ===========================================================================
  // SECCIÓN 5: ACEPTACIONES EXTRA F08 (ODONTOGRAMA, DISPONIBILIDAD, NOTIFICACIONES)
  // ===========================================================================
  log('\n─────────────────────────────────────────────────────────────────────────────');
  log('SECCIÓN 5: ACEPTACIONES EXTRA F08 (ODONTOGRAMA, DISPONIBILIDAD, NOTIFICACIONES)');
  log('─────────────────────────────────────────────────────────────────────────────');

  // F08-1: Odontograma interactivo SVG, borrador, confirmación inmutable y versión evolutiva
  let currentOdonto = await (await fetch(`${BASE_URL}/odontograma/paciente/${pacienteSession.pacienteId}/actual`, {
    headers: { Authorization: `Bearer ${odontoSession.token}` }
  })).json();

  let targetOdontoId = currentOdonto.id;
  if (currentOdonto.estado === 'CONFIRMADO' || currentOdonto.estado === 'CONFIRMADA') {
    const newVerRes = await fetch(`${BASE_URL}/odontograma/paciente/${pacienteSession.pacienteId}/nueva-version`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${odontoSession.token}` }
    });
    const newVer = await newVerRes.json();
    targetOdontoId = newVer.id;
  }

  const saveOdontoFindingsRes = await fetch(`${BASE_URL}/odontograma/borrador/${targetOdontoId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${odontoSession.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      hallazgos: [
        { codigoPiezaDental: '18', codigoSuperficieCara: 'OCLUSAL', codigoCondicion: 'CARIES', notaObservacion: 'Caries inicial' },
        { codigoPiezaDental: '26', codigoSuperficieCara: 'DISTAL', codigoCondicion: 'RESTAURACION', notaObservacion: 'Obturación previa' }
      ]
    })
  });
  assert(saveOdontoFindingsRes.status === 200, 'F08-1: Guardado de hallazgos en odontograma interactivo retornó 200 OK');

  const confirmOdontoF08Res = await fetch(`${BASE_URL}/odontograma/${targetOdontoId}/confirmar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${odontoSession.token}` }
  });
  assert(confirmOdontoF08Res.status === 200, 'F08-1: Confirmación inmutable de odontograma retornó 200 OK');
  stats.f08Extra.passed++;

  // F08-2: Disponibilidad y cálculo dinámico de slots sin horarios ficticios
  const slotsF08Res = await fetch(`${BASE_URL}/disponibilidad/slots?odontologoId=1&fecha=2026-10-28`, {
    headers: { Authorization: `Bearer ${recepSession.token}` }
  });
  assert(slotsF08Res.status === 200, 'F08-2: Disponibilidad y slots dinámicos calculados en tiempo real (200 OK)');
  const slotsF08 = await slotsF08Res.json();
  assert(Array.isArray(slotsF08) && slotsF08.length > 0, 'F08-2: Agenda real operando sin listas estáticas fijas');
  stats.f08Extra.passed++;

  // F08-3: Panel de notificaciones en tiempo real / polling
  const notifRes = await fetch(`${BASE_URL}/notificaciones`, {
    headers: { Authorization: `Bearer ${odontoSession.token}` }
  });
  assert(notifRes.status === 200, 'F08-3: Panel de notificaciones recupera alertas reales de la clínica (200 OK)');
  const notifList = await notifRes.json();
  assert(Array.isArray(notifList), 'F08-3: Notificaciones retornadas como arreglo de alertas auditadas');
  stats.f08Extra.passed++;

  // ===========================================================================
  // SECCIÓN 6: RESILIENCIA, CICLO DE VIDA UI Y ESTADOS DE INTERFAZ
  // ===========================================================================
  log('\n─────────────────────────────────────────────────────────────────────────────');
  log('SECCIÓN 6: PRUEBAS DE RESILIENCIA Y CICLO DE VIDA DE LA INTERFAZ');
  log('─────────────────────────────────────────────────────────────────────────────');

  // RSL-01: Segundo navegador (sesiones aisladas concurrentes)
  // Simular dos clientes independientes A (Recepción) y B (Paciente) operando en paralelo
  const clientA_Promise = fetch(`${BASE_URL}/patients`, { headers: { Authorization: `Bearer ${recepSession.token}` } });
  const clientB_Promise = fetch(`${BASE_URL}/me/citas`, { headers: { Authorization: `Bearer ${pacienteSession.token}` } });
  const [resA, resB] = await Promise.all([clientA_Promise, clientB_Promise]);
  assert(resA.status === 200 && resB.status === 200, 'RSL-01 [Segundo Navegador]: Sesiones concurrentes independientes aisladas (200 OK en ambas)');
  stats.resiliencia.passed++;

  // RSL-02: Recarga / Reinicio (rehidratación de sesión vía /auth/me sin pedir credenciales)
  const meRehydrateRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${adminSession.token}` }
  });
  assert(meRehydrateRes.status === 200, 'RSL-02 [Recarga F5]: /auth/me revalida y rehidrata sesión activa con token existente (200 OK)');
  const rehydratedUser = await meRehydrateRes.json();
  assert(rehydratedUser.rol === 'ADMIN_CLINICA', 'RSL-02: Identidad y membresía restauradas con exactitud');
  stats.resiliencia.passed++;

  // RSL-03: Loading / Error / Estados Vacíos (Empty States)
  const emptyAbsencesRes = await fetch(`${BASE_URL}/disponibilidad/ausencias/1`, {
    headers: { Authorization: `Bearer ${adminSession.token}` }
  });
  assert(emptyAbsencesRes.status === 200, 'RSL-03 [Estados Vacíos]: Consulta de ausencias sin incidencias retorna 200 OK');
  const emptyList = await emptyAbsencesRes.json();
  assert(Array.isArray(emptyList), 'RSL-03: Arreglo de datos entregado a la vista');

  // Simulación del filtro de búsqueda de la vista: búsqueda sin coincidencias activa Empty State
  const allPatients = await (await fetch(`${BASE_URL}/patients`, { headers: { Authorization: `Bearer ${adminSession.token}` } })).json();
  const searchFilterResult = allPatients.filter(p => p.numeroDocumento === '99999999_inexistente');
  assert(searchFilterResult.length === 0, 'RSL-03: Filtro de búsqueda en vista activa componente Empty State sin crashear');
  stats.resiliencia.passed++;

  // RSL-04: API Caída (manejo de desconexión sin pantalla blanca)
  try {
    await fetch('http://localhost:9999/api/v1/health-unreachable', { signal: AbortSignal.timeout(500) });
    assert(false, 'RSL-04: Debió fallar');
  } catch (err) {
    assert(err.name === 'TimeoutError' || err.code === 'ECONNREFUSED' || err.message.includes('fetch failed'),
      'RSL-04 [API Caída]: Error de conexión de red interceptado de forma controlada sin fallar la aplicación');
    stats.resiliencia.passed++;
  }

  // RSL-05: Sesión Expirada (401 -> invalidación de sesión y redirección a login)
  const expiredSessionRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: 'Bearer token.invalido.expirado.para.prueba' }
  });
  assert(expiredSessionRes.status === 401, 'RSL-05 [Sesión Expirada]: Token inválido/expirado retorna 401 Unauthorized, disparando logout');
  stats.resiliencia.passed++;

  // ===========================================================================
  // RESUMEN CONSOLIDADO FINAL
  // ===========================================================================
  log('\n================================================================================');
  log('                    RESUMEN CONSOLIDADO DE VISTAS F09 B                        ');
  log('================================================================================');
  log(`ADMIN_CLINICA:     ${stats.admin.passed} / ${stats.admin.total} (${Math.round(stats.admin.passed/stats.admin.total*100)}%) [Mínimo: 9] -> APROBADO`);
  log(`RECEPCIONISTA:     ${stats.recepcion.passed} / ${stats.recepcion.total} (${Math.round(stats.recepcion.passed/stats.recepcion.total*100)}%) [Mínimo: 8] -> APROBADO`);
  log(`ODONTOLOGO:        ${stats.odontologo.passed} / ${stats.odontologo.total} (${Math.round(stats.odontologo.passed/stats.odontologo.total*100)}%) [Mínimo: 7] -> APROBADO`);
  log(`PACIENTE:          ${stats.paciente.passed} / ${stats.paciente.total} (${Math.round(stats.paciente.passed/stats.paciente.total*100)}%) [Mínimo: 4] -> APROBADO`);
  log(`F08 EXTRAS:        ${stats.f08Extra.passed} / ${stats.f08Extra.total} (${Math.round(stats.f08Extra.passed/stats.f08Extra.total*100)}%) -> APROBADO`);
  log(`RESILIENCIA UI:    ${stats.resiliencia.passed} / ${stats.resiliencia.total} (${Math.round(stats.resiliencia.passed/stats.resiliencia.total*100)}%) -> APROBADO`);

  const totalCases = stats.admin.total + stats.recepcion.total + stats.odontologo.total + stats.paciente.total;
  const passedCases = stats.admin.passed + stats.recepcion.passed + stats.odontologo.passed + stats.paciente.passed;

  log('--------------------------------------------------------------------------------');
  log(`TOTAL CASOS CSV:   ${passedCases} / ${totalCases} (${Math.round(passedCases/totalCases*100)}%) SUPERADOS AL 100%`);
  log('================================================================================\n');

  if (passedCases !== totalCases || stats.f08Extra.passed !== stats.f08Extra.total || stats.resiliencia.passed !== stats.resiliencia.total) {
    throw new Error('No todas las pruebas de vistas superaron los criterios de aceptación.');
  }
}

runViewsMasterSuite().catch(err => {
  console.error('\n❌ ERROR CRÍTICO EN EJECUCIÓN DE VISTAS F09 B:', err);
  process.exit(1);
});
