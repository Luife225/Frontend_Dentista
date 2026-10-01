# 🦷 CORONYX — Sistema de Gestión Dental

> Plataforma SaaS multi-sede para clínicas odontológicas con asistente IA, análisis ML de radiografías y teleodontología integrada.

---

## 📋 Tabla de contenido

- [Descripción general](#descripción-general)
- [Stack tecnológico](#stack-tecnológico)
- [Animaciones GSAP](#animaciones-gsap)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Roles y módulos](#roles-y-módulos)
- [Páginas y vistas](#páginas-y-vistas)
- [Instalación y desarrollo](#instalación-y-desarrollo)
- [Variables de entorno](#variables-de-entorno)
- [Rutas de la aplicación](#rutas-de-la-aplicación)
- [Diseño y estilos](#diseño-y-estilos)
- [Planes SaaS](#planes-saas)
- [Funcionalidades clave](#funcionalidades-clave)

---

## Descripción general

**CORONYX** es un sistema de gestión odontológica SaaS Enterprise diseñado para clínicas modernas. Ofrece:

- 🗓 **Agenda inteligente** con confirmación automática vía WhatsApp y SMS
- 🧠 **Asistente IA por voz** para dictado de historia clínica
- 🔬 **Análisis ML de radiografías** con detección automática de caries y patologías
- 📹 **Teleodontología** con videoconsulta integrada y sala de espera virtual
- 🦷 **Odontograma digital** interactivo con historial por diente
- 💰 **Caja y reportes** financieros con MRR, ingresos y pagos
- 📦 **Inventario** con alertas de stock mínimo
- 🌐 **Portal del paciente** web/móvil con citas, pagos y seguimiento
- 🏢 **Multi-sede Enterprise** con Super Admin global

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| UI Framework | React | 19.x |
| Lenguaje | TypeScript | 5.7.x |
| Build Tool | Vite | 8.x |
| Routing | react-router-dom | 7.x |
| Styling | Tailwind CSS v4 | 4.x |
| Plugin Tailwind | @tailwindcss/vite | 4.x |
| Plugin React | @vitejs/plugin-react | 6.x |
| Animaciones | GSAP | 3.15.x |
| React GSAP | @gsap/react | 2.1.x |
| Formatter | oxfmt | 0.2.x |

---

## Animaciones GSAP

El proyecto usa **GSAP 3.15** con el hook `useGSAP` de `@gsap/react` para todas las animaciones. No se usa `gsap.registerPlugin(useGSAP)` — `useGSAP` es un hook de React y solo se importa directamente.

### Páginas animadas

#### `LandingPage` — animaciones con ScrollTrigger
- Hero, features y secciones animadas al hacer scroll
- Selector de roles con pill deslizante
- Registra `ScrollTrigger` con `gsap.registerPlugin(ScrollTrigger)`

#### `Login` — 6 sistemas de animación

| Sistema | Técnica |
|---|---|
| **Entrada de pantalla** | `gsap.timeline` con `back.out`, stagger por rol, panel derecho con offset `<0.15` |
| **Focus glow en inputs** | `gsap.to({ boxShadow })` en `onFocus`/`onBlur` |
| **Pill deslizante de roles** | `getBoundingClientRect` + `gsap.to` con `overwrite: 'auto'` |
| **Bounce de ícono de rol** | `gsap.fromTo` con `back.out(1.6)` al seleccionar |
| **Shimmer badge SaaS** | `gsap.timeline({ repeat: -1, yoyo: true })` |
| **Shake de validación** | `gsap.timeline()` secuencial sobre el eje `x` |
| **Botón hover** | `gsap.to({ scale, boxShadow })` en `mouseenter`/`mouseleave` |
| **Spinner de carga** | `gsap.to({ rotation: 360, repeat: -1 })` via `useEffect` con cleanup |

### Convenciones de animación

- Todas las animaciones de entrada se envuelven en `gsap.matchMedia()`:
  - `(prefers-reduced-motion: no-preference)` → animaciones completas
  - `(prefers-reduced-motion: reduce)` → `gsap.set(...)` al estado final inmediatamente, sin loops
- `force3D: true` en todos los tweens con transforms para GPU acceleration
- `overwrite: 'auto'` en tweens que pueden solaparse (pill, botón hover)
- Cleanup automático via `useGSAP` scope + `return () => mm.revert()`
- Spinner `useEffect` incluye `return () => gsap.killTweensOf(ref)` para evitar tweens huérfanos al desmontar

---

## Estructura del proyecto

```
Frontend_Dentista/
├── public/
│   └── favicon.svg             # Favicon de la aplicación
├── src/
│   ├── App.tsx                 # Root: AuthProvider + AppRouter
│   ├── main.tsx                # Entrypoint React, monta en #root
│   ├── index.css               # Estilos globales + import Tailwind v4
│   ├── vite-env.d.ts           # Types de entorno Vite
│   │
│   ├── imports/
│   │   └── coronixlogo.png     # Logotipo oficial de CORONYX
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx     # Contexto de autenticación (role, login, logout)
│   │
│   ├── routes/
│   │   ├── AppRouter.tsx       # Definición de rutas públicas y protegidas
│   │   └── ProtectedRoute.tsx  # Guard de autenticación por rol
│   │
│   ├── layouts/
│   │   └── DashboardLayout.tsx # Sidebar + topbar shell (Outlet de react-router)
│   │
│   ├── pages/
│   │   ├── LandingPage.tsx     # Página pública de marketing (GSAP + ScrollTrigger)
│   │   ├── Login.tsx           # Autenticación con 6 sistemas de animación GSAP
│   │   ├── Dashboard.tsx       # Panel principal del odontólogo/admin
│   │   ├── AgendaUpdated.tsx   # Gestión de citas con calendario interactivo
│   │   ├── Patients.tsx        # Listado de pacientes
│   │   ├── PacientePerfil.tsx  # Perfil completo del paciente + historia clínica
│   │   ├── HistoriaClinica.tsx # Historia clínica interactiva con IA
│   │   ├── Radiografias.tsx    # Visor DICOM + análisis ML de radiografías
│   │   ├── Teleodontologia.tsx # Módulo de videoconsulta y sala virtual
│   │   ├── Inventario.tsx      # Gestión de stock e insumos
│   │   ├── Caja.tsx            # Reportes financieros y caja diaria
│   │   ├── Consultorio.tsx     # Configuración del consultorio/clínica
│   │   ├── PatientApp.tsx      # Portal web del paciente (layout propio)
│   │   └── SuperAdminPortal.tsx# Portal Super Admin SaaS (layout propio)
│   │
│   └── components/
│       └── features/
│           ├── AIAssistant.tsx     # Asistente IA flotante (solo Odontólogo)
│           ├── Notificaciones.tsx  # Centro de notificaciones
│           └── Odontogram.tsx      # Odontograma digital interactivo
│
├── index.html                  # HTML shell de Vite con div#root
├── vite.config.ts              # Config Vite: React, Tailwind v4, alias @/src
├── tsconfig.json               # Config TypeScript
├── package.json                # Dependencias y scripts npm
└── AGENTS.md                   # Reglas de arquitectura para agentes de código
```

---

## Roles y módulos

CORONYX implementa un sistema de **5 roles** con acceso granular a módulos:

| Rol | Acceso | Descripción |
|---|---|---|
| `SUPER_ADMIN` | Portal propio | Gestión global SaaS: clínicas, planes, ingresos, logs |
| `ODONTOLOGO` | Dashboard, Agenda, Pacientes, Teleodontología, Notificaciones, Caja | Flujo clínico completo + Asistente IA |
| `RECEPCIONISTA` | Dashboard, Agenda, Pacientes (sin datos clínicos), Notificaciones, Inventario | Modo solo-lectura clínica |
| `ADMIN_CLINICA` | Dashboard, Inventario, Caja, Configuración | Gestión administrativa |
| `PACIENTE` | Portal propio | Citas, pagos, tratamientos, teleconsulta, documentos |

---

## Páginas y vistas

### Públicas

#### `LandingPage` — `/`
Página de marketing con:
- Navbar flotante con scroll con logo CORONYX
- Hero con dashboard mockup animado (GSAP + ScrollTrigger)
- Strip de estadísticas clave
- Grid de funcionalidades
- Selector de roles con pill deslizante animado (GSAP)
- Tabla de planes (Individual, Pro, Enterprise)
- Seguridad y compliance (HIPAA, ISO 27001, AES-256)
- Formulario de contacto/demo
- CTA final de conversión
- Footer con links de plataforma, soluciones y soporte

#### `Login` — `/login`
Pantalla de autenticación con:
- Panel izquierdo con branding y descripción de roles (animado con GSAP entry timeline)
- Panel derecho con formulario email + contraseña (animado con delay de profundidad)
- Demo de roles: selector con pill deslizante GSAP para simular cualquiera de los 5 roles
- Detección automática de rol por patrón de email
- Glow animado en inputs al hacer focus (GSAP `boxShadow`)
- Shake de validación en campos vacíos (GSAP timeline secuencial sobre eje X)
- Botón con hover scale+glow (GSAP) y spinner de carga animado
- Shimmer sutil en badge SaaS (loop infinito, pausado con `prefers-reduced-motion`)
- Soporte completo `prefers-reduced-motion` via `gsap.matchMedia()`
- Pantalla de recuperación de contraseña

---

### Protegidas — Dashboard Layout

Todas las vistas bajo `/app` usan `DashboardLayout` con:
- Sidebar colapsable con navegación por rol
- Topbar con buscador, notificaciones y avatar
- Asistente IA (botón flotante para Odontólogo)

#### `Dashboard` — `/app/dashboard`
Vista principal con estadísticas del día, timeline de citas y alertas.

#### `AgendaUpdated` — `/app/agenda`
Gestión completa de citas con vista semanal/mensual y confirmaciones pendientes.

#### `PacientePerfil` — `/app/pacientes`
Perfil 360° del paciente: historia clínica, odontograma, radiografías, plan de tratamiento.

#### `Teleodontologia` — `/app/teleodontologia`
Sala de espera virtual, videoconsulta integrada e historial de teleconsultas.

#### `Inventario` — `/app/inventario`
Control de stock de insumos con alertas de stock mínimo.

#### `Caja` — `/app/caja`
Reportes financieros, registro de pagos y exportación de reportes.

#### `Consultorio` — `/app/consultorio`
Configuración de la clínica, usuarios, horarios y suscripción.

---

### Portales independientes

#### `SuperAdminPortal` — `/app/super-admin`
Portal de gestión global CORONYX (solo `SUPER_ADMIN`):
- Resumen global: MRR total, clínicas activas, solicitudes pendientes
- Gestión de clínicas con filtros por estado (activa/trial/pausada)
- Solicitudes de cambio de plan: aprobar/rechazar upgrades
- Ingresos y MRR por plan
- Log de actividad completo

#### `PatientApp` — `/app/patient-portal`
Portal web del paciente (solo `PACIENTE`):
- Inicio con próxima cita y saldo pendiente
- Agenda: citas pasadas y futuras, solicitar nueva cita
- Pagos: facturas, recibos y plan de cuotas
- Tratamientos: progreso visual de cada tratamiento activo
- Teleodontología: sala de espera y videoconsulta
- Documentos: radiografías, consentimientos y presupuestos
- Mi perfil: datos personales y de salud

---

## Instalación y desarrollo

### Requisitos previos
- Node.js 18+
- npm 9+ o pnpm 8+

### Instalación

```bash
git clone <url-del-repo>
cd Frontend_Dentista

npm install
# o con pnpm
pnpm install
```

### Desarrollo local

```bash
npm run dev
# Disponible en: http://localhost:5173
```

### Build de producción

```bash
npm run build
# Salida en: dist/
```

### Preview de producción

```bash
npm run preview
```

### Formatear código

```bash
npm run format
```

---

## Variables de entorno

> Este proyecto es actualmente un frontend de demostración sin backend real. La autenticación es simulada mediante `AuthContext`.

Para producción, configurar:

```env
VITE_API_URL=https://api.coronyx.io
VITE_WS_URL=wss://api.coronyx.io
VITE_STORAGE_URL=https://storage.coronyx.io
```

---

## Rutas de la aplicación

| Ruta | Componente | Roles permitidos |
|---|---|---|
| `/` | `LandingPage` | Público |
| `/login` | `Login` | Público |
| `/app/super-admin` | `SuperAdminPortal` | `SUPER_ADMIN` |
| `/app/patient-portal` | `PatientApp` | `PACIENTE` |
| `/app/dashboard` | `Dashboard` | `ODONTOLOGO`, `RECEPCIONISTA`, `ADMIN_CLINICA` |
| `/app/agenda` | `AgendaUpdated` | `ODONTOLOGO`, `RECEPCIONISTA`, `ADMIN_CLINICA` |
| `/app/pacientes` | `PacientePerfil` | `ODONTOLOGO`, `RECEPCIONISTA`, `ADMIN_CLINICA` |
| `/app/teleodontologia` | `Teleodontologia` | `ODONTOLOGO` |
| `/app/notificaciones` | `Notificaciones` | `ODONTOLOGO`, `RECEPCIONISTA` |
| `/app/inventario` | `Inventario` | `RECEPCIONISTA`, `ADMIN_CLINICA` |
| `/app/caja` | `Caja` | `ODONTOLOGO`, `ADMIN_CLINICA` |
| `/app/consultorio` | `Consultorio` | `ADMIN_CLINICA` |

---

## Diseño y estilos

### Sistema de diseño

- **Fuente principal**: Inter (cuerpo)
- **Fuente de marca**: Outfit (títulos, labels, UI)
- **Color primario**: `#1E8C82` (teal oscuro)
- **Color acento**: `#5FC9BE` (teal claro)
- **Fondo dark**: `#0B3D3A` (sidebar) / `#080f0e` (landing) / `#0C0A09` (super admin)
- **Fondo claro**: `#f8fafc` (contenido principal)

### Paleta por rol

| Rol | Color hex | Tailwind |
|---|---|---|
| Odontólogo | `#5FC9BE` | cyan-400 |
| Recepcionista | `#7C3AED` | violet-600 |
| Admin Clínica | `#64748B` | slate-500 |
| Paciente | `#059669` | emerald-600 |
| Super Admin | `#D97706` | amber-500 |

---

## Planes SaaS

| Plan | Precio | Consultorios | Usuarios | Almacenamiento |
|---|---|---|---|---|
| **Individual** | $149.000/mes | 1 | 1 | 10 GB DICOM |
| **Clínicas Pro** | $490.000/mes | Hasta 5 | Hasta 15 | 100 GB + backups |
| **Enterprise** | A medida | Ilimitados | Ilimitados | 1 TB+ escalable |

---

## Funcionalidades clave

### Asistente IA
- Dictado de historia clínica por voz en tiempo real
- Sugerencias clínicas basadas en historial del paciente
- Transcripción automática y estructuración de notas
- Solo disponible para el rol `ODONTOLOGO`

### Análisis ML de Radiografías
- Detección automática de caries, fracturas y patologías
- Visor DICOM con zoom y ajuste de brillo/contraste
- Anotaciones automáticas con nivel de confianza
- Historial comparativo por fecha

### Teleodontología
- Videoconsulta integrada sin plugins externos
- Sala de espera virtual con checklist pre-consulta
- Grabación y almacenamiento de sesiones
- Solicitud de cita virtual desde el portal del paciente

### Seguridad y Compliance
- Cifrado en tránsito: TLS 1.3
- Cifrado en reposo: AES-256
- HIPAA Compliant
- Ley 1581 Colombia / GDPR compatible
- Autenticación multifactor (MFA)
- Auditoría completa de acciones clínicas
- ISO 27001 / SOC 2

---

## Contacto y soporte

- **Sitio web**: coronyx.io
- **Email**: soporte@coronyx.io
- **Versión**: v2.0 Enterprise
- **País de origen**: Colombia

---

*CORONYX v2.0 · Multi-sede Enterprise · 2026 Todos los derechos reservados*
