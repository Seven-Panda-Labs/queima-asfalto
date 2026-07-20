import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, initializeFirestore, memoryLocalCache, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

function requireEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill in your Firebase config.`,
    )
  }
  return value
}

const firebaseConfig = {
  apiKey: requireEnv('VITE_FIREBASE_API_KEY'),
  authDomain: requireEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: requireEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnv('VITE_FIREBASE_APP_ID'),
  measurementId: requireEnv('VITE_FIREBASE_MEASUREMENT_ID'),
}

const useFirebaseEmulators =
  import.meta.env.DEV &&
  (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' ||
    import.meta.env.VITE_FUNCTIONS_EMULATOR === 'true')

const useFullFirebaseEmulators =
  import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const storage = getStorage(app)

let persistenceWarning: string | null = null

function createFirestore() {
  if (useFullFirebaseEmulators) {
    return initializeFirestore(app, { localCache: memoryLocalCache() })
  }

  if (typeof indexedDB === 'undefined') {
    persistenceWarning =
      'Este browser não suporta modo offline completo (IndexedDB indisponível).'
    return initializeFirestore(app, { localCache: memoryLocalCache() })
  }

  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code: string }).code)
        : ''

    if (code === 'failed-precondition') {
      persistenceWarning =
        'Abre a app numa só janela para modo offline completo (várias tabs abertas).'
    } else if (code === 'unimplemented') {
      persistenceWarning =
        'Este browser não suporta modo offline completo (IndexedDB indisponível).'
    } else {
      persistenceWarning = 'Modo offline limitado neste dispositivo.'
    }

    return initializeFirestore(app, { localCache: memoryLocalCache() })
  }
}

export const db = createFirestore()

const functionsRegion =
  import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION?.trim() || 'europe-west1'

export const functions = getFunctions(app, functionsRegion)

if (useFullFirebaseEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
}

if (useFirebaseEmulators) {
  connectFunctionsEmulator(functions, '127.0.0.1', 5001)
}

export function getPersistenceWarning(): string | null {
  return persistenceWarning
}
