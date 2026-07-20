import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const root = fileURLToPath(new URL('.', import.meta.url))

const privacyContentPath = existsSync(resolve(root, 'src/generated/privacyPolicy.content.ts'))
  ? resolve(root, 'src/generated/privacyPolicy.content.ts')
  : resolve(root, 'src/generated/privacyPolicy.content.stub.ts')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '#privacy-policy-content': privacyContentPath,
    },
  },
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'firestore.rules.test.ts'],
    server: {
      deps: {
        moduleDirectories: ['node_modules', resolve(root, 'functions/node_modules')],
      },
    },
  },
})
