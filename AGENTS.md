# coronyx-frontend

React + Vite + Tailwind CSS + react-router-dom dental management system.

## Development Server

Start with `npm run dev`. Default port: 5173.

## Project Structure

- `src/main.tsx` - React entrypoint; imports `src/index.css`, wraps with `BrowserRouter`, and mounts `src/App.tsx` into the `#root` element
- `src/App.tsx` - Wraps `AuthProvider` + `AppRouter`
- `src/index.css` - Global CSS entrypoint and Tailwind CSS v4 import
- `src/contexts/AuthContext.tsx` - Authentication context (role, login, logout)
- `src/layouts/DashboardLayout.tsx` - Sidebar + topbar shell with nested `<Outlet />`
- `src/routes/AppRouter.tsx` - All routes (public + protected)
- `src/routes/ProtectedRoute.tsx` - Auth guard component
- `src/pages/` - All page components
- `src/components/features/` - Reusable feature components (AIAssistant, Notificaciones, Odontogram)
- `index.html` - Vite HTML shell containing the `#root` element and loading `src/main.tsx`
- `package.json` - Project dependencies and the Vite build, development, preview, and formatting scripts
- `vite.config.ts` - Vite configuration with React, Tailwind CSS v4, and the `@` alias for `src`

## Dependencies

- Runtime: React 19, React DOM 19, react-router-dom
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8, TypeScript 5.7, and `@vitejs/plugin-react`
- Formatting: oxfmt

## Styling

This project uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin configured in `vite.config.ts`. `src/index.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in `src/index.css`.

## Code quality

- Use double quotes for strings containing apostrophes.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.
