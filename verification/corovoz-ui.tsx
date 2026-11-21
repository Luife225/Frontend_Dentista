// UI-only fixture: real layout/chart, synthetic API responses, no backend access.
// Run on its own origin: http://localhost:5187/verification/corovoz-ui.html
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../src/contexts/AuthContext'
import DashboardLayout from '../src/layouts/DashboardLayout'
import Odontogram from '../src/components/features/Odontogram'
import Agenda from '../src/pages/Agenda'
import AppRouter from '../src/routes/AppRouter'
import { getMinDateString, toLimaIsoString } from '../src/utils/appointmentRules'
import type { DentalProposal } from '../src/services/coroVozService'
import type { OdontogramaVersionDto } from '../src/services/odontogramService'
import '../src/index.css'

const nativeFetch = window.fetch.bind(window)
const root = createRoot(document.getElementById('root')!)
const requestedRole = new URLSearchParams(window.location.search).get('role')
const fixtureRole = ['ODONTOLOGO', 'RECEPCIONISTA', 'ADMIN_CLINICA'].includes(requestedRole || '') ? requestedRole! : 'ODONTOLOGO'
let saves = 0
const versions = new Map<string, OdontogramaVersionDto>()
const surfaces = ['MESIAL', 'DISTAL', 'OCLUSAL', 'VESTIBULAR', 'LINGUAL', 'GENERAL'] as const
const suggestions = surfaces.map(value => ({ value: `cara ${value.toLowerCase()}`, label: value[0] + value.slice(1).toLowerCase() }))
const baseAnswer = { intent: 'AYUDA', route: '', targetLabel: '', understood: true, patients: [], patientId: null, patientName: null, suggestions: [] }
const normalized = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
const agendaDate = getMinDateString()
const fixtureAppointment = {
  id: '501', clinicaId: '8', pacienteId: '101', pacienteNombreCompleto: 'Lucía Mendoza', pacienteNumeroDocumento: '00001234',
  odontologoId: '9', odontologoNombreCompleto: 'Valeria Torres', inicioEn: toLimaIsoString(agendaDate, '16:00'),
  finEn: toLimaIsoString(agendaDate, '16:30'), estado: 'PROGRAMADA', modalidad: 'PRESENCIAL', motivo: 'Control sintético', consultorio: 'Sillón 1',
}
const fixturePatient = { id: '101', clinicaId: '8', nombres: 'Lucía', apellidos: 'Mendoza', numeroDocumento: '00001234', fechaNacimiento: '1995-02-16', estado: 'ACTIVO' }

function versionFor(patientId: string) {
  if (!versions.has(patientId)) versions.set(patientId, { id: `${patientId}1`, pacienteId: patientId, numeroVersion: 1, estado: 'BORRADOR', fechaCreacion: '2026-11-12T09:00:00', hallazgos: [{ codigoPiezaDental: 36, codigoSuperficieCara: 'OCLUSAL', codigoCondicion: 'CARIES', notaObservacion: 'Hallazgo sintético de prueba' }] })
  return versions.get(patientId)!
}

function dentalResult(body: Record<string, any>) {
  const text = normalized(body.text || '')
  const draft = body.draft as DentalProposal | undefined
  const foundSurface = surfaces.find(surface => text.includes(surface.toLowerCase()))
  const foundCondition = text.includes('corona') ? 'CORONA' : text.includes('restaura') ? 'RESTAURADO' : text.includes('sano') ? 'SANO' : text.includes('caries') ? 'CARIES' : null
  const piece = Number(text.match(/\b[1-4][1-8]\b/)?.[0]) || (text.includes('catorce') ? 14 : text.includes('treinta y seis') ? 36 : draft?.piece || body.contextPiece || 14)
  const proposal: DentalProposal = { piece, condition: foundCondition || draft?.condition || 'CARIES', surface: foundSurface || draft?.surface || 'OCLUSAL', note: draft?.note || 'Control en dos semanas' }
  if (body.field === 'note') proposal.note = body.text
  // selectedPiece is reserved for the backend's selection/correction command;
  // proposals use contextPiece so AIAssistant reaches its proposal branch.
  const base = { understood: true, message: 'Revisa la propuesta antes de confirmarla.', proposal, incomplete: false, fragment: '', selectedPiece: null, correctedFrom: null, contextPiece: piece, suggestions: [] }
  if (text.includes('opciones') || text.includes('superficie')) return { ...base, understood: false, proposal: null, incomplete: true, draft: { ...proposal, surface: 'GENERAL' }, fragment: `pieza ${piece} caries`, message: '¿Qué superficie dental deseas modificar?', suggestions }
  if (/^(pieza|diente)\s+\d+$/.test(text)) return { ...base, proposal: null, incomplete: true, draft: { ...proposal, condition: null, surface: 'GENERAL', note: '' }, fragment: `pieza ${piece}`, message: `Pieza ${piece}. ¿Qué condición deseas registrar?` }
  return base
}

function installFixture() {
  // The dedicated port prevents replacing the normal application's auth storage.
  localStorage.setItem('coronyx_jwt_token', 'synthetic-ui-only')
  window.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input), window.location.href)
    if (!url.pathname.includes('/api/')) {
      if (url.origin !== window.location.origin) throw new Error('Fixture: solicitud externa bloqueada')
      return nativeFetch(input, init)
    }
    const path = url.pathname
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : {}
    if (path.endsWith('/auth/me')) return json({ id: '7', usuarioId: '7', usuarioClinicaId: '9', clinicaId: '8', rol: fixtureRole, nombres: 'Valeria', apellidos: 'Torres', nombreCompleto: 'Valeria Torres', correo: 'fixture@example.test', clinicaNombre: 'Clínica de demostración' })
    if (path.endsWith('/patients') || path.endsWith('/patients/admin')) return json([fixturePatient])
    if (path.endsWith('/patients/101')) return json(fixturePatient)
    if (path.endsWith('/dashboard/summary')) return json({ totalCitasHoy: 1, citasConfirmadasHoy: 0, citasPendientesHoy: 1, citasAtendidasHoy: 0, citasCanceladasHoy: 0, totalPacientes: 1, fechaHoyLima: agendaDate, proximaCita: fixtureAppointment, citasHoy: [fixtureAppointment] })
    if (path.endsWith('/citas/odontologos') || path.endsWith('/auth/users')) return json([{ id: '7', usuarioClinicaId: '9', nombres: 'Valeria', apellidos: 'Torres', correo: 'fixture@example.test', rol: 'ODONTOLOGO', estado: 'ACTIVO' }])
    if (path.endsWith('/disponibilidad/slots')) return json(['10:00', '11:00', '16:00', '17:00'].map(time => ({ inicio: time, fin: time.replace(':00', ':30'), disponible: time !== '17:00', motivoNoDisponible: time === '17:00' ? 'Horario ocupado sintético' : null })))
    if (path.endsWith('/citas') && init?.method === 'POST') {
      saves++
      window.dispatchEvent(new Event('fixture:saved'))
      return json({ ...body, id: String(500 + saves), pacienteNombreCompleto: 'Lucía Mendoza', odontologoNombreCompleto: 'Valeria Torres', estado: 'PROGRAMADA' })
    }
    if (path.endsWith('/citas') || path.endsWith('/citas/odontologo/9')) return json([fixtureAppointment])
    if (path.includes('notificacion') || path.includes('notification')) return json(path.includes('count') || path.includes('conteo') ? { unreadCount: 0 } : [])
    if (path.endsWith('/corovoz/status')) return json({ version: 4, speechReady: true })
    if (path.includes('/corovoz/')) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, normalized(body.text || '').includes('lento') ? 4000 : 650)
        const abort = () => { clearTimeout(timer); reject(new DOMException('Cancelado', 'AbortError')) }
        if (init?.signal?.aborted) abort()
        else init?.signal?.addEventListener('abort', abort, { once: true })
      })
      if (normalized(body.text || '').includes('error')) return json({ message: 'Error sintético' }, 503)
      if (path.endsWith('/odontograma/interpretar') || path.endsWith('/odontograma/editar')) return json(dentalResult(body))
      if (path.endsWith('/transcribir')) return json({ text: 'Caries en pieza 14 cara mesial' })
      const text = normalized(body.text || '')
      if (/siguiente cita|reprogramar esta cita/.test(text)) {
        return json({ ...baseAnswer, intent: 'AGENDA_CONSULTA', answer: 'Cita sintética de Lucía Mendoza a las 16:00.', route: '/app/agenda',
          targetLabel: 'Abrir cita', agendaContext: { date: agendaDate, appointmentId: '501', selectedDate: agendaDate } })
      }
      // This is a UI contract fixture, not a substitute for the Python interpreter.
      if (/(agendar|programar|sacar|reservar)/.test(text) || body.appointmentDraft) {
        const draft = { date: null, time: null, patientId: null, dentistId: null, reason: null, modality: null, ...body.appointmentDraft }
        const updatedFields: string[] = []
        const patch = (key: string, value: string) => { draft[key] = value; updatedFields.push(key) }
        if (text.includes('lucia')) patch('patientId', '101')
        if (text.includes('valeria')) patch('dentistId', '9')
        if (text.includes('manana')) { const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); patch('date', new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(tomorrow)) }
        const hour = text.match(/\ba las (\d{1,2})(?::(\d{2}))?/)
        if (hour) patch('time', `${String(Number(hour[1]) + (text.includes('tarde') && Number(hour[1]) < 12 ? 12 : 0)).padStart(2, '0')}:${hour[2] || '00'}`)
        if (text.includes('limpieza')) patch('reason', 'Limpieza')
        return json({ ...baseAnswer, intent: 'CITA_BORRADOR', answer: 'Formulario sintético preparado. Revisa los campos antes de guardar.', appointmentDraft: { ...draft, updatedFields, missingFields: ['patientId', 'date', 'time', 'dentistId'].filter(key => !draft[key]) } })
      }
      if (text.includes('paciente') || text.includes('alergia')) {
        if (body.patientConfirmed) return json({ ...baseAnswer, answer: 'Lucía Mendoza. Alergia registrada: penicilina (dato sintético).', patientId: '101', patientName: 'Lucía Mendoza' })
        return json({ ...baseAnswer, intent: 'PACIENTE_ELEGIR', answer: '¿A cuál paciente te refieres?', patients: [{ id: '101', name: 'Lucía Mendoza', documentHint: 'Documento termina en 1234' }, { id: '102', name: 'Mateo Mendoza', documentHint: 'Documento termina en 5678' }] })
      }
      if (text.includes('opciones') && !body.selectedIntent) return json({ ...baseAnswer, answer: '¿Qué deseas consultar?', suggestions: [{ intent: 'AGENDA', label: 'Agenda de hoy' }, { intent: 'PACIENTES', label: 'Buscar paciente' }, { intent: 'TELEODONTOLOGIA', label: 'Teleodontología' }] })
      if (text.includes('larga')) return json({ ...baseAnswer, answer: Array.from({ length: 10 }, (_, index) => `${index + 1}. Esta es una respuesta sintética extensa para revisar el desplazamiento interno. La información del odontograma debe seguir visible y accesible mientras consultas a Coronix.`).join('\n\n') })
      return json({ ...baseAnswer, answer: 'Claro, puedo ayudarte a consultar pacientes, organizar citas y registrar hallazgos en el odontograma. Selecciona una opción o cuéntame qué necesitas.', route: '/app/agenda', targetLabel: 'Abrir agenda' })
    }
    const patientId = path.match(/\/odontograma\/paciente\/(\d+)/)?.[1]
    if (patientId) {
      if (path.endsWith('/historial')) return json([versionFor(patientId)])
      if (path.endsWith('/borrador')) {
        versions.set(patientId, { ...versionFor(patientId), hallazgos: body.hallazgos || [] })
        saves++
        window.dispatchEvent(new Event('fixture:saved'))
      }
      return json(versionFor(patientId))
    }
    // Every other API call is mocked, including writes; never falls through to native fetch.
    return json([])
  }
  if (navigator.mediaDevices) Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async () => { throw new DOMException('Permiso denegado en fixture', 'NotAllowedError') } })
}

export default function FixturePage() {
  const [patient, setPatient] = useState('101')
  const [chart, setChart] = useState(fixtureRole === 'ODONTOLOGO')
  const [saved, setSaved] = useState(saves)
  useEffect(() => { const handler = () => setSaved(saves); window.addEventListener('fixture:saved', handler); return () => window.removeEventListener('fixture:saved', handler) }, [])
  return <div className="p-4 sm:p-6 space-y-5">
    <nav className="flex flex-wrap gap-3 text-sm" aria-label="Roles sintéticos">{['ODONTOLOGO', 'RECEPCIONISTA', 'ADMIN_CLINICA'].map(role => <a className="underline" key={role} href={`/verification/corovoz-ui.html?role=${role}`}>{role}</a>)}</nav>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-teal-700">Pacientes / Ficha clínica</p><h1 className="text-2xl font-bold text-slate-800">{patient === '101' ? 'Lucía Mendoza' : 'Mateo Mendoza'}</h1><p className="text-sm text-slate-500">Datos sintéticos · guardados locales: {saved}</p></div><div className="flex flex-wrap gap-2"><button className="border rounded-lg px-3 py-2 text-sm bg-white" onClick={() => setPatient(patient === '101' ? '102' : '101')}>Cambiar paciente de prueba</button><button className="border rounded-lg px-3 py-2 text-sm bg-white" onClick={() => setChart(!chart)}>{chart ? 'Vista general de prueba' : 'Ver odontograma'}</button></div></div>
    {chart ? <><nav className="flex gap-5 border-b text-sm text-slate-500 pb-3"><span>Información general</span><strong className="text-teal-800">Odontograma</strong><span>Documentos</span></nav><Odontogram key={patient} patientId={patient} patientName={patient === '101' ? 'Lucía Mendoza' : 'Mateo Mendoza'} /></> : <div className="bg-white border rounded-2xl p-6"><h2 className="font-bold text-lg">Consultas generales</h2><p className="text-slate-600 mt-2">Abre Coronix para probar respuestas, opciones y voz.</p></div>}
    <details className="text-xs text-slate-500"><summary>Guía de esta verificación aislada</summary><p className="mt-2">General: «opciones», «paciente», «respuesta larga», «error», «lento». Odontograma: «pieza 14», «caries en pieza 14», «opciones de superficie». Guarda únicamente en memoria. El micrófono simula permiso denegado.</p></details>
  </div>
}

if (window.location.port !== '5187' || !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
  root.render(<p>Abre esta verificación en localhost:5187 para mantener aislada la sesión real.</p>)
} else {
  installFixture()
  const module = new URLSearchParams(window.location.search).get('module')
  const useAppRoutes = ['pacientes', 'agenda', 'inventario', 'dashboard', 'caja', 'consultorio', 'notificaciones', 'teleodontologia'].includes(module || '')
  if (useAppRoutes) window.history.replaceState(null, '', `/app/${module}`)
  root.render(<BrowserRouter><AuthProvider>{useAppRoutes ? <AppRouter /> : <Routes><Route element={<DashboardLayout />}><Route path="/app/agenda" element={<Agenda />} /><Route path="*" element={<FixturePage />} /></Route></Routes>}</AuthProvider></BrowserRouter>)
}
if (import.meta.hot) import.meta.hot.dispose(() => { root.unmount(); window.fetch = nativeFetch })
