import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import PublicRoute from './PublicRoute'
import DashboardLayout from '../layouts/DashboardLayout'

// Pages
import LandingPage from '../pages/LandingPage'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Agenda from '../pages/Agenda'
import PacientePerfil from '../pages/PacientePerfil'
import Teleodontologia from '../pages/Teleodontologia'
import Notificaciones from '../components/features/Notificaciones'
import Inventario from '../pages/Inventario'
import Caja from '../pages/Caja'
import Consultorio from '../pages/Consultorio'
import SuperAdminPortal from '../pages/SuperAdminPortal'
import PatientApp from '../pages/PatientApp'
import Unauthorized from '../pages/Unauthorized'

export default function AppRouter() {
  return (
    <Routes>
      {/* ── Public / Guest-only routes ──────────────────────────────────── */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* ── RBAC Error Pages ───────────────────────────────────────────── */}
      <Route path="/sin-acceso" element={<Unauthorized />} />
      <Route path="/403" element={<Navigate to="/sin-acceso" replace />} />

      {/* ── Protected: Super Admin (dedicated portal shell) ─────────────── */}
      <Route
        path="/app/super-admin"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <SuperAdminPortal />
          </ProtectedRoute>
        }
      />

      {/* ── Protected: Patient portal (dedicated mobile/web shell) ──────── */}
      <Route
        path="/app/patient-portal"
        element={
          <ProtectedRoute allowedRoles={['PACIENTE']}>
            <PatientApp />
          </ProtectedRoute>
        }
      />

      {/* ── Protected: Clinical Staff Dashboard Layout with RBAC ────────── */}
      <Route
        path="/app"
        element={
          <ProtectedRoute allowedRoles={['ODONTOLOGO', 'RECEPCIONISTA', 'ADMIN_CLINICA']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Agenda clínica: Odontólogo, Recepcionista y Administrador de Clínica */}
        <Route
          path="agenda"
          element={
            <ProtectedRoute allowedRoles={['ODONTOLOGO', 'RECEPCIONISTA', 'ADMIN_CLINICA']}>
              <Agenda />
            </ProtectedRoute>
          }
        />

        {/* Perfil e historias de pacientes: Odontólogo y Recepcionista */}
        <Route
          path="pacientes"
          element={
            <ProtectedRoute allowedRoles={['ODONTOLOGO', 'RECEPCIONISTA']}>
              <PacientePerfil />
            </ProtectedRoute>
          }
        />

        {/* Teleodontología: Exclusivo Odontólogo */}
        <Route
          path="teleodontologia"
          element={
            <ProtectedRoute allowedRoles={['ODONTOLOGO']}>
              <Teleodontologia />
            </ProtectedRoute>
          }
        />

        {/* Notificaciones: Odontólogo y Recepcionista */}
        <Route
          path="notificaciones"
          element={
            <ProtectedRoute allowedRoles={['ODONTOLOGO', 'RECEPCIONISTA']}>
              <Notificaciones />
            </ProtectedRoute>
          }
        />

        {/* Inventario: Recepcionista y Administrador de Clínica */}
        <Route
          path="inventario"
          element={
            <ProtectedRoute allowedRoles={['RECEPCIONISTA', 'ADMIN_CLINICA']}>
              <Inventario />
            </ProtectedRoute>
          }
        />

        {/* Caja y finanzas: Odontólogo y Administrador de Clínica */}
        <Route
          path="caja"
          element={
            <ProtectedRoute allowedRoles={['ODONTOLOGO', 'ADMIN_CLINICA']}>
              <Caja />
            </ProtectedRoute>
          }
        />

        {/* Configuración del consultorio: Exclusivo Administrador de Clínica */}
        <Route
          path="consultorio"
          element={
            <ProtectedRoute allowedRoles={['ADMIN_CLINICA']}>
              <Consultorio />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* ── Aliases y compatibilidad de rutas ───────────────────────────── */}
      <Route path="/agenda" element={<Navigate to="/app/agenda" replace />} />
      <Route path="/admin" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/odontologia" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/recepcion" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/portal-paciente" element={<Navigate to="/app/patient-portal" replace />} />

      {/* ── Catch-all → Landing ────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
