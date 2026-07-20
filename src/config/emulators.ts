export function isFirebaseEmulatorsEnabled(): boolean {
  return (
    import.meta.env.DEV &&
    (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' ||
      import.meta.env.VITE_FUNCTIONS_EMULATOR === 'true')
  )
}

export function isFirebaseEmulatorsFull(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'
}

export const EMULATOR_DEV_EMAIL = 'dev@queima-asfalto.local'
export const EMULATOR_DEV_PASSWORD = 'devpassword'
