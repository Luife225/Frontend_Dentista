import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// ── Brand metadata ──────────────────────────────────────────────────────────
document.title = 'CORONYX — Sistema Dental'

// Favicon: prefer Logo_final.png if present, fall back to favicon.svg
;(function setFavicon() {
  const href = '/Logo_final.png'
  const fallback = '/favicon.svg'
  const link = (document.querySelector("link[rel~='icon']") as HTMLLinkElement)
    || Object.assign(document.createElement('link'), { rel: 'icon' })
  link.type = 'image/png'
  link.href = href
  link.onerror = () => { link.type = 'image/svg+xml'; link.href = fallback }
  document.head.appendChild(link)
})()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
