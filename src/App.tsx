import { useState, useEffect, useCallback } from 'react'
import LandingPage from './components/LandingPage'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import AgendaUpdated from './components/AgendaUpdated'
import PacientePerfil from './components/PacientePerfil'
import AIAssistant from './components/AIAssistant'
import Notificaciones from './components/Notificaciones'
import Inventario from './components/Inventario'
import Caja from './components/Caja'
import Consultorio from './components/Consultorio'
import Teleodontologia from './components/Teleodontologia'
import PatientApp from './components/PatientApp'
import SuperAdminDashboard from './components/SuperAdminDashboard'
import CoroNyxLogo from './components/CoroNyxLogo'

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'SUPER_ADMIN' | 'ODONTOLOGO' | 'RECEPCIONISTA' | 'ADMIN_CLINICA' | 'PACIENTE'
type AppView = 'landing' | 'login' | 'app'

// ─── History API helpers ─────────────────────────────────────────────────────
function getViewFromPath(): AppView {
  const p = window.location.pathname
  if (p.startsWith('/login')) return 'login'
  if (p.startsWith('/app'))   return 'app'
  return 'landing'
}

function pushView(view: AppView) {
  const paths: Record<AppView, string> = { landing: '/', login: '/login', app: '/app' }
  if (window.location.pathname !== paths[view]) {
    history.pushState({ view }, '', paths[view])
  }
}

type ModuleId =
  | 'dashboard' | 'agenda' | 'pacientes' | 'teleodontologia'
  | 'notificaciones' | 'inventario' | 'caja' | 'consultorio'

interface NavItem { id: ModuleId; label: string; icon: React.ReactNode; group: string }


function SvgIcon({ d }: { d: string }) {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  )
}

// ─── Navigation config ────────────────────────────────────────────────────────
const ALL_NAV: NavItem[] = [
  { id: 'dashboard',       label: 'Dashboard',        group: 'Principal', icon: <SvgIcon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/> },
  { id: 'agenda',          label: 'Agenda',           group: 'Principal', icon: <SvgIcon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/> },
  { id: 'pacientes',       label: 'Pacientes',        group: 'Principal', icon: <SvgIcon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/> },
  { id: 'teleodontologia', label: 'Teleodontología',  group: 'Principal', icon: <SvgIcon d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/> },
  { id: 'notificaciones',  label: 'Notificaciones',   group: 'Gestión',   icon: <SvgIcon d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/> },
  { id: 'inventario',      label: 'Inventario',       group: 'Gestión',   icon: <SvgIcon d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/> },
  { id: 'caja',            label: 'Caja y reportes',  group: 'Gestión',   icon: <SvgIcon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/> },
  { id: 'consultorio',     label: 'Configuración',    group: 'Sistema',   icon: <SvgIcon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"/> },
]

// ─── Role permissions (clinical roles only — SUPER_ADMIN has its own panel) ──
const ROLE_MODULES: Record<Exclude<Role, 'SUPER_ADMIN' | 'PACIENTE'>, ModuleId[]> = {
  ODONTOLOGO:    ['dashboard', 'agenda', 'pacientes', 'teleodontologia', 'notificaciones', 'caja'],
  RECEPCIONISTA: ['dashboard', 'agenda', 'pacientes', 'notificaciones', 'inventario'],
  ADMIN_CLINICA: ['dashboard', 'agenda', 'pacientes', 'notificaciones', 'inventario', 'caja', 'consultorio'],
}

const ROLE_META: Record<Exclude<Role, 'SUPER_ADMIN' | 'PACIENTE'>, { label: string; color: string; avatarBg: string }> = {
  ODONTOLOGO:    { label: 'Dr. Herrera',   color: 'text-cyan-400',   avatarBg: 'from-cyan-400 to-cyan-600' },
  RECEPCIONISTA: { label: 'Paula Ríos',    color: 'text-violet-400', avatarBg: 'from-violet-400 to-violet-600' },
  ADMIN_CLINICA: { label: 'Administrador', color: 'text-slate-300',  avatarBg: 'from-slate-400 to-slate-600' },
}

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN:   'Super Admin',
  ODONTOLOGO:    'Odontólogo',
  RECEPCIONISTA: 'Recepcionista',
  ADMIN_CLINICA: 'Administrador',
  PACIENTE:      'Paciente',
}

const TITLES: Record<ModuleId, string> = {
  dashboard: 'Dashboard', agenda: 'Agenda', pacientes: 'Pacientes',
  teleodontologia: 'Teleodontología', notificaciones: 'Notificaciones',
  inventario: 'Inventario', caja: 'Caja y Reportes', consultorio: 'Configuración',
}

const BADGE: Partial<Record<ModuleId, number>> = { notificaciones: 1, inventario: 3 }

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<AppView>(() => getViewFromPath())
  const [role, setRole] = useState<Role | null>(null)
  const [active, setActive] = useState<ModuleId>('dashboard')
  const [showAI, setShowAI] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // ── Navigate helper: updates both React state AND browser history ──
  const navigate = useCallback((nextView: AppView, nextRole?: Role | null) => {
    pushView(nextView)
    setView(nextView)
    if (nextRole !== undefined) setRole(nextRole)
  }, [])

  // ── Listen to browser back / forward ──
  useEffect(() => {
    // Seed the initial history entry so back-button can return to landing
    if (history.state === null) {
      history.replaceState({ view: getViewFromPath() }, '', window.location.pathname)
    }

    function onPopState(e: PopStateEvent) {
      const targetView: AppView = (e.state as { view?: AppView })?.view ?? getViewFromPath()
      setView(targetView)
      // When navigating back to landing or login, clear role/session
      if (targetView === 'landing' || targetView === 'login') {
        setRole(null)
        setShowAI(false)
      }
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // ── 1. Landing ──
  if (view === 'landing') {
    return <LandingPage onLogin={() => navigate('login')}/>
  }

  // ── 2. Login ──
  if (view === 'login' || !role) {
    return (
      <Login onLogin={(r) => {
        setRole(r)
        setActive('dashboard')
        navigate('app')
      }}/>
    )
  }

  // ── 3a. SUPER_ADMIN panel ──
  if (role === 'SUPER_ADMIN') {
    return <SuperAdminDashboard onLogout={() => navigate('landing', null)}/>
  }

  // ── 3b. PACIENTE portal ──
  if (role === 'PACIENTE') {
    return <PatientApp onLogout={() => navigate('landing', null)}/>
  }

  // ── 3c. Clinical roles (ODONTOLOGO, RECEPCIONISTA, ADMIN_CLINICA) ──
  const clinicalRole = role as Exclude<Role, 'SUPER_ADMIN' | 'PACIENTE'>
  const allowedModules = ROLE_MODULES[clinicalRole]
  const navItems = ALL_NAV.filter(n => allowedModules.includes(n.id))
  const groups = [...new Set(navItems.map(n => n.group))]
  const meta = ROLE_META[clinicalRole]
  const isReadOnly = clinicalRole === 'RECEPCIONISTA'

  // Role accent colors
  const accentBg      = clinicalRole === 'ODONTOLOGO' ? 'bg-cyan-600 hover:bg-cyan-700' : clinicalRole === 'RECEPCIONISTA' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-slate-600 hover:bg-slate-700'
  const accentText    = clinicalRole === 'ODONTOLOGO' ? 'text-cyan-400' : clinicalRole === 'RECEPCIONISTA' ? 'text-violet-400' : 'text-slate-300'
  const accentBgLight = clinicalRole === 'ODONTOLOGO' ? 'bg-cyan-500/15' : clinicalRole === 'RECEPCIONISTA' ? 'bg-violet-500/15' : 'bg-slate-500/15'
  const accentBar     = clinicalRole === 'ODONTOLOGO' ? 'bg-cyan-400' : clinicalRole === 'RECEPCIONISTA' ? 'bg-violet-400' : 'bg-slate-400'

  void accentBg // used via className

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-14' : 'w-56'} shrink-0 flex flex-col h-full transition-all duration-200`}
        style={{ backgroundColor: '#0B3D3A' }}>

        {/* Logo + role badge */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/8 ${collapsed ? 'justify-center' : ''}`}>
          <CoroNyxLogo size={48}/>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold leading-tight tracking-wide" style={{ fontFamily: 'Outfit' }}>CORONYX</p>
              <p className={`text-xs font-medium ${accentText}`}>{ROLE_LABELS[clinicalRole]}</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
          {groups.map(group => (
            <div key={group}>
              {!collapsed && (
                <p className="text-white/20 text-xs font-semibold uppercase tracking-widest px-2 mb-1.5" style={{ fontFamily: 'Outfit' }}>{group}</p>
              )}
              <div className="space-y-0.5">
                {navItems.filter(n => n.group === group).map(item => {
                  const isActive = active === item.id
                  const badge = BADGE[item.id]
                  return (
                    <button key={item.id}
                      onClick={() => setActive(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all relative ${isActive ? `${accentBgLight} ${accentText}` : 'text-white/45 hover:text-white/80 hover:bg-white/5'} ${collapsed ? 'justify-center' : ''}`}>
                      <span className="shrink-0">{item.icon}</span>
                      {!collapsed && <span className="flex-1 text-left font-medium text-[13px]">{item.label}</span>}
                      {badge && !collapsed && (
                        <span className="w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">{badge}</span>
                      )}
                      {badge && collapsed && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full"/>}
                      {isActive && !collapsed && <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r ${accentBar}`}/>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* AI button — Odontólogo only */}
        {clinicalRole === 'ODONTOLOGO' && (
          <div className={`px-3 pb-2 ${collapsed ? 'flex justify-center' : ''}`}>
            <button onClick={() => setShowAI(!showAI)}
              title="Asistente de IA"
              className={`${collapsed ? 'w-9 h-9' : 'w-full'} flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all ${showAI ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/50' : 'bg-white/8 text-white/60 hover:bg-white/15 hover:text-white'}`}>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z"/></svg>
              {!collapsed && <span className="text-sm font-semibold" style={{ fontFamily: 'Outfit' }}>{showAI ? 'Cerrar IA' : 'Asistente IA'}</span>}
              {showAI && !collapsed && (
                <span className="ml-auto flex gap-0.5">
                  {[1, 2, 3].map(i => <span key={i} className="wave-bar w-0.5 h-3 bg-white rounded-full" style={{ animationDelay: `${i * 0.1}s` }}/>)}
                </span>
              )}
            </button>
          </div>
        )}

        {/* User row + collapse */}
        <div className={`p-3 border-t border-white/5 flex ${collapsed ? 'justify-center' : 'items-center gap-2'}`}>
          {!collapsed && (
            <>
              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${meta.avatarBg} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                {meta.label.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-xs font-medium truncate">{meta.label}</p>
                <p className="text-white/30 text-xs truncate">{ROLE_LABELS[clinicalRole]}</p>
              </div>
              <button onClick={() => navigate('landing', null)} className="text-white/25 hover:text-white/60 transition-colors text-xs" title="Cerrar sesión">⏏</button>
            </>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-white/40 hover:text-white/70 shrink-0">
            <svg className={`w-3 h-3 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-12 bg-white border-b border-slate-100 flex items-center px-5 gap-4 shrink-0">
          <h2 className="text-sm font-semibold text-slate-700" style={{ fontFamily: 'Outfit' }}>{TITLES[active]}</h2>
          {isReadOnly && (
            <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium">Solo lectura clínica</span>
          )}
          <div className="flex-1"/>
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input className="pl-8 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50 bg-slate-50 w-44 focus:w-60 transition-all"
              placeholder="Buscar paciente, cita..."/>
          </div>
          <button className="relative p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full"/>
          </button>
          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${meta.avatarBg} flex items-center justify-center text-white text-xs font-bold cursor-pointer`}>
            {meta.label.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-hidden bg-slate-50">
          {active === 'dashboard'       && <div className="h-full overflow-y-auto"><Dashboard/></div>}
          {active === 'agenda'          && <div className="h-full"><AgendaUpdated/></div>}
          {active === 'pacientes'       && <div className="h-full"><PacientePerfil readOnly={isReadOnly}/></div>}
          {active === 'teleodontologia' && <div className="h-full overflow-y-auto"><Teleodontologia/></div>}
          {active === 'notificaciones'  && <div className="h-full overflow-y-auto"><Notificaciones/></div>}
          {active === 'inventario'      && <div className="h-full overflow-y-auto"><Inventario/></div>}
          {active === 'caja'            && <div className="h-full overflow-y-auto"><Caja/></div>}
          {active === 'consultorio'     && <div className="h-full overflow-y-auto"><Consultorio/></div>}
        </main>
      </div>

      {/* AI overlay — Odontólogo only */}
      {showAI && clinicalRole === 'ODONTOLOGO' && <AIAssistant onClose={() => setShowAI(false)}/>}
    </div>
  )
}
