import { loadEnvFile } from './scripts/privacyPolicy.js'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const root = fileURLToPath(new URL('.', import.meta.url))
loadEnvFile(resolve(root, '.env.privacy.generated'))

const privacyContentPath = existsSync(resolve(root, 'src/generated/privacyPolicy.content.ts'))
  ? resolve(root, 'src/generated/privacyPolicy.content.ts')
  : resolve(root, 'src/generated/privacyPolicy.content.stub.ts')

export default defineConfig({
  resolve: {
    alias: {
      '#privacy-policy-content': privacyContentPath,
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
      ],
      manifest: {
        name: 'Queima Asfalto',
        short_name: 'QueimaAsfalto',
        description: 'Gestão de época de corrida — eventos, objetivos e resultados.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        lang: 'pt-PT',
        theme_color: '#2563EB',
        background_color: '#F9FAFB',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        importScripts: ['notification-sw.js'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/__/],
        runtimeCaching: [],
      },
    }),
  ],
})
