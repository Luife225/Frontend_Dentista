import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vite'
import baseConfig from '../vite.config'

// Only this isolated verification server substitutes the hardware and VAD.
export default mergeConfig(baseConfig, {
  cacheDir: 'node_modules/.vite-voice-turns',
  server: { host: '127.0.0.1', port: 5189, strictPort: true },
  resolve: { alias: { '@ricky0123/vad-web': fileURLToPath(new URL('./voice-test-device.ts', import.meta.url)) } },
})
