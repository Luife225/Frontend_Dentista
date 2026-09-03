import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import LandingPage from '../pages/LandingPage';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import PatientApp from '../pages/PatientApp';
import SuperAdminPortal from '../pages/SuperAdminPortal';
import DashboardLayout from '../layouts/DashboardLayout';
import AgendaUpdated from '../pages/AgendaUpdated';
import PacientePerfil from '../pages/PacientePerfil';
import Teleodontologia from '../pages/Teleodontologia';
import Notificaciones from '../components/features/Notificaciones';
import Inventario from '../pages/Inventario';
import Caja from '../pages/Caja';
import Consultorio from '../pages/Consultorio';

export const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Rutas Públicas */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />

                {/* Rutas de Clínica (Odontólogos, Recepción, Admin) */}
                <Route path="/dashboard" element={
                    <ProtectedRoute allowedRoles={['ODONTOLOGO', 'RECEPCIONISTA', 'ADMIN_CLINICA']}>
                        <DashboardLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Dashboard />} />
                    <Route path="agenda" element={<AgendaUpdated />} />
                    <Route path="pacientes" element={<PacientePerfil readOnly={false} />} />
                    <Route path="teleodontologia" element={<Teleodontologia />} />
                    <Route path="notificaciones" element={<Notificaciones />} />
                    <Route path="inventario" element={<Inventario />} />
                    <Route path="caja" element={<Caja />} />
                    <Route path="consultorio" element={<Consultorio />} />
                </Route>

                {/* Ruta para Pacientes */}
                <Route path="/patient-app/*" element={
                    <ProtectedRoute allowedRoles={['PACIENTE']}>
                        <PatientApp />
                    </ProtectedRoute>
                } />

                {/* Ruta para Super Admin */}
                <Route path="/super-admin/*" element={
                    <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                        <SuperAdminPortal />
                    </ProtectedRoute>
                } />

                {/* Redirección por defecto */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};
