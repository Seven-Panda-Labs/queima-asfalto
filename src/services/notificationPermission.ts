import i18n from '../i18n'

export type NotificationPermissionState = 'unsupported' | 'default' | 'granted' | 'denied'

export function getNotificationPermissionState(): NotificationPermissionState {
  if (typeof globalThis.Notification === 'undefined') {
    return 'unsupported'
  }

  return globalThis.Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof globalThis.Notification === 'undefined') {
    return 'unsupported'
  }

  const current = globalThis.Notification.permission
  if (current === 'granted' || current === 'denied') {
    return current
  }

  return globalThis.Notification.requestPermission()
}

export function notificationPermissionMessage(state: NotificationPermissionState): string | null {
  switch (state) {
    case 'unsupported':
      return i18n.t('notifications.unsupportedBrowser')
    case 'denied':
      return i18n.t('notifications.permissionDeniedHint')
    case 'default':
      return i18n.t('notifications.enableForPermission')
    case 'granted':
      return null
  }
}
