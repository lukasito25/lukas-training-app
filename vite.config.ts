import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Shared domain logic (program engine, progression, autoregulation).
      '@fitness/core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
    },
  },
})
