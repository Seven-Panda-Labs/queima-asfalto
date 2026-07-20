import { APP_STORAGE_PREFIX } from '../config/app'

const APP_PREFIX = APP_STORAGE_PREFIX

export function scopedStorageKey(userId: string, key: string): string {
  return `${APP_PREFIX}:${userId}:${key}`
}

export function clearUserLocalStorage(userId: string): void {
  const prefix = `${APP_PREFIX}:${userId}:`
  const migrationKey = `migration-planeado-v1-${userId}`

  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index)
    if (!key) continue
    if (key.startsWith(prefix) || key === migrationKey) {
      localStorage.removeItem(key)
    }
  }
}
