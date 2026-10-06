import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getDefaultRouteForRole, getRoleLabel } from '../routes/routeHelpers'
import coronixLogo from '../imports/coronixlogo.png'

export default function Unauthorized() {
  const { role, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const currentRole = role || user?.rol
  const attemptedPath = (location.state as { from?: { pathname?: string } })?.from?.pathname

  const handleGoHome = () => {
    const destination = getDefaultRouteForRole(currentRole)
    navigate(destination, { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow decoration */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, #5FC9BE 0%, #0B3D3A 70%, transparent 100%)' }}
      />

      <div className="relative z-10 w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <img src={coronixLogo} alt="CORONYX" className="w-12 h-12 object-contain shrink-0" />
          <div className="text-left">
            <p className="text-white text-xl font-bold tracking-wide leading-tight" style={{ fontFamily: 'Outfit' }}>
              CORONYX
            </p>
            <p className="text-xs" style={{ color: '#5FC9BE' }}>
              Control de Acceso Seguro
            </p>
          </div>
        </div>

        {/* Shield / Lock Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-inner">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Badge & Title */}
        <span className="inline-block px-3 py-1 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-full text-xs font-semibold tracking-wider uppercase mb-3">
          403 · Acceso No Autorizado
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>
          Área restringida
        </h1>
        <p className="text-white/60 text-sm leading-relaxed mb-6">
          No tienes los privilegios necesarios para acceder a este módulo del sistema.
          {attemptedPath && (
            <span className="block mt-2 font-mono text-xs text-rose-300 bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-800/30 break-all">
              Ruta solicitada: {attemptedPath}
            </span>
          )}
        </p>

        {/* Current Role Info */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-4 mb-8 text-left">
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-1" style={{ fontFamily: 'Outfit' }}>
            Tu sesión activa
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-semibold">
                {user?.nombreCompleto || user?.correo || 'Usuario autenticado'}
              </p>
              <p className="text-xs text-white/50">
                Rol: <span className="font-semibold text-cyan-400">{getRoleLabel(currentRole)}</span>
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
              {currentRole || 'SIN ROL'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-3">
          <button
            onClick={handleGoHome}
            className="w-full sm:flex-1 py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Volver a mi panel
          </button>
          <button
            onClick={logout}
            className="w-full sm:w-auto py-3 px-4 bg-white/10 hover:bg-white/15 text-white/80 hover:text-white font-medium rounded-xl text-sm transition-all border border-white/10 cursor-pointer"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
