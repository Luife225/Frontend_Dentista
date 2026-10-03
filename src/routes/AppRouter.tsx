import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import DashboardLayout from '../layouts/DashboardLayout'

// Pages
import LandingPage from '../pages/LandingPage'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import AgendaUpdated from '../pages/AgendaUpdated'
import PacientePerfil from '../pages/PacientePerfil'
import Teleodontologia from '../pages/Teleodontologia'
import Notificaciones from '../components/features/Notificaciones'
import Inventario from '../pages/Inventario'
import Caja from '../pages/Caja'
import Consultorio from '../pages/Consultorio'
import SuperAdminPortal from '../pages/SuperAdminPortal'
import PatientApp from '../pages/PatientApp'

export default function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />

      {/* Protected: Super Admin (own shell) */}
      <Route path="/app/super-admin" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
          <SuperAdminPortal />
        </ProtectedRoute>
      } />

      {/* Protected: Patient portal (own shell) */}
      <Route path="/app/patient-portal" element={
        <ProtectedRoute allowedRoles={['PACIENTE']}>
          <PatientApp />
        </ProtectedRoute>
      } />

      {/* Protected: Dashboard layout with nested routes */}
      <Route path="/app" element={
        <ProtectedRoute allowedRoles={['ODONTOLOGO', 'RECEPCIONISTA', 'ADMIN_CLINICA']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="agenda" element={<AgendaUpdated />} />
        <Route path="pacientes" element={<PacientePerfil />} />
        <Route path="teleodontologia" element={<Teleodontologia />} />
        <Route path="notificaciones" element={<Notificaciones />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="caja" element={<Caja />} />
        <Route path="consultorio" element={<Consultorio />} />
      </Route>

      {/* Catch-all → landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
