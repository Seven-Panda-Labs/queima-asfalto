import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import i18n from '../i18n'
import {
  getNotificationPermissionState,
  notificationPermissionMessage,
  requestNotificationPermission,
} from './notificationPermission'

describe('notificationPermission', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('pt')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns unsupported when Notification API is missing', () => {
    vi.stubGlobal('Notification', undefined)
    expect(getNotificationPermissionState()).toBe('unsupported')
  })

  it('reads current permission state', () => {
    vi.stubGlobal('Notification', {
      permission: 'denied',
      requestPermission: vi.fn(),
    })
    expect(getNotificationPermissionState()).toBe('denied')
  })

  it('requests permission when state is default', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted')
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission,
    })

    await expect(requestNotificationPermission()).resolves.toBe('granted')
    expect(requestPermission).toHaveBeenCalledOnce()
  })

  it('does not re-request when already granted or denied', async () => {
    const requestPermission = vi.fn()
    vi.stubGlobal('Notification', {
      permission: 'granted',
      requestPermission,
    })

    await expect(requestNotificationPermission()).resolves.toBe('granted')
    expect(requestPermission).not.toHaveBeenCalled()
  })

  it('returns user-facing messages for blocked states', () => {
    expect(notificationPermissionMessage('denied')).toMatch(/negada/i)
    expect(notificationPermissionMessage('unsupported')).toMatch(/não suporta/i)
    expect(notificationPermissionMessage('granted')).toBeNull()
  })
})
