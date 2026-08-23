import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import logoSrc from './imports/Logo_final.png'

// ── Favicon dinámico — usa Logo_final.png ──────────────────────────────────
const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']") ?? (() => {
  const el = document.createElement('link')
  el.rel = 'icon'
  document.head.appendChild(el)
  return el
})()
link.href = logoSrc
link.type = 'image/png'

// ── Título de la pestaña del navegador ────────────────────────────────────
document.title = 'CORONYX — Sistema Dental'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
