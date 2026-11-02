import { mergeConfig } from 'vite'
import baseConfig from '../vite.config'

// Builds the same voice hook as the app, with synthetic inputs and no real backend.
export default mergeConfig(baseConfig, {
  server: {
    proxy: {
      '/fixture-dental': { target: 'http://127.0.0.1:8795', rewrite: () => '/odontograma/interpretar' },
      '/fixture-transcribe': { target: 'http://127.0.0.1:8795', rewrite: () => '/transcribir' },
      '/fixture-edit': { target: 'http://127.0.0.1:8795', rewrite: () => '/odontograma/editar' },
    },
  },
  build: {
    outDir: '.tmp-corovoz-browser-dist',
    rolldownOptions: { input: 'verification/corovoz-browser.html' },
  },
})
