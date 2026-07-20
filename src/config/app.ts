const FALLBACK_STORAGE_PREFIX = 'queima-asfalto'

export function resolveAppStoragePrefix(): string {
  const explicit = import.meta.env.VITE_APP_STORAGE_PREFIX?.trim()
  if (explicit) return explicit

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim()
  if (projectId) return projectId

  return FALLBACK_STORAGE_PREFIX
}

export const APP_STORAGE_PREFIX = resolveAppStoragePrefix()

export function guestStorageKey(suffix: string): string {
  return `${APP_STORAGE_PREFIX}:${suffix}`
}
