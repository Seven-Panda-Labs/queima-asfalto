/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_MEASUREMENT_ID: string
  readonly VITE_GEOAPIFY_API_KEY: string
  readonly VITE_FIREBASE_VAPID_KEY?: string
  readonly VITE_FIREBASE_FUNCTIONS_REGION?: string
  readonly VITE_APP_STORAGE_PREFIX?: string
  readonly VITE_USE_FIREBASE_EMULATORS?: string
  readonly VITE_FUNCTIONS_EMULATOR?: string
  readonly VITE_PRIVACY_POLICY_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
