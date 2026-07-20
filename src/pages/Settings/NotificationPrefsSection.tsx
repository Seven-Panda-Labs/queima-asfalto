import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { REMINDER_DAYS_OPTIONS } from '../../types/NotificationPrefs'
import { useNotificationPrefs } from '../../hooks/useNotificationPrefs'
import { useToast } from '../../contexts/ToastContext'
import {
  getNotificationPermissionState,
  notificationPermissionMessage,
  requestNotificationPermission,
  type NotificationPermissionState,
} from '../../services/notificationPermission'

export function NotificationPrefsSection() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const toast = useToast()
  const { prefs, loading, saving, error, savePrefs } = useNotificationPrefs()
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>(() =>
    getNotificationPermissionState(),
  )

  useEffect(() => {
    setPermissionState(getNotificationPermissionState())
  }, [prefs.notificationsEnabled])

  async function handleToggle(enabled: boolean) {
    if (enabled) {
      const nextPermission = await requestNotificationPermission()
      setPermissionState(nextPermission)

      if (nextPermission !== 'granted') {
        toast.error(
          notificationPermissionMessage(nextPermission) ?? t('notifications.activateError'),
        )
        return
      }
    }

    try {
      await savePrefs({ notificationsEnabled: enabled })
      if (user) {
        const { syncPushNotifications } = await import('../../services/pushNotifications')
        await syncPushNotifications(user.uid, enabled)
      }
      toast.success(enabled ? t('notifications.remindersEnabled') : t('notifications.remindersDisabled'))
    } catch {
      toast.error(t('notifications.savePrefsError'))
    }
  }

  async function handleDaysChange(daysBefore: number) {
    if (!REMINDER_DAYS_OPTIONS.includes(daysBefore as (typeof REMINDER_DAYS_OPTIONS)[number])) {
      return
    }

    try {
      await savePrefs({
        reminderDaysBefore: daysBefore as (typeof REMINDER_DAYS_OPTIONS)[number],
      })
    } catch {
      toast.error(t('notifications.savePrefsError'))
    }
  }

  async function handleTimeChange(reminderTime: string) {
    try {
      await savePrefs({ reminderTime })
    } catch {
      toast.error(t('notifications.savePrefsError'))
    }
  }

  if (loading) {
    return (
      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">{t('notifications.title')}</h2>
        <p className="mt-2 text-sm text-muted">{t('common.loading')}</p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-foreground">{t('notifications.title')}</h2>
      <p className="mt-2 text-sm text-muted">{t('notifications.subtitle')}</p>

      <div className="mt-4 space-y-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={prefs.notificationsEnabled}
            disabled={saving}
            onChange={(event) => void handleToggle(event.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <span className="text-sm font-medium text-foreground">{t('notifications.enable')}</span>
        </label>

        <fieldset disabled={!prefs.notificationsEnabled || saving} className="space-y-4">
          <legend className="sr-only">{t('notifications.configLegend')}</legend>

          <div>
            <label htmlFor="reminder-days" className="block text-sm font-medium text-foreground">
              {t('notifications.daysBefore')}
            </label>
            <select
              id="reminder-days"
              value={prefs.reminderDaysBefore}
              onChange={(event) => void handleDaysChange(Number(event.target.value))}
              className="mt-1 w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {REMINDER_DAYS_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  {days === 1
                    ? t('notifications.daysBeforeOne')
                    : t('notifications.daysBeforeOther', { count: days })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="reminder-time" className="block text-sm font-medium text-foreground">
              {t('notifications.reminderTime')}
            </label>
            <input
              id="reminder-time"
              type="time"
              value={prefs.reminderTime}
              onChange={(event) => void handleTimeChange(event.target.value)}
              className="mt-1 w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
        </fieldset>

        <p className="rounded-md border border-border bg-background px-3 py-2 text-xs text-muted">
          <Trans i18nKey="notifications.platformNotes" />
        </p>

        {permissionState !== 'granted' && prefs.notificationsEnabled ? (
          <p className="text-xs text-danger">
            {notificationPermissionMessage(permissionState) ?? t('notifications.permissionDenied')}
          </p>
        ) : null}

        {!prefs.notificationsEnabled && permissionState === 'default' ? (
          <p className="text-xs text-muted">{notificationPermissionMessage('default')}</p>
        ) : null}

        {permissionState === 'denied' ? (
          <p className="text-xs text-danger">{notificationPermissionMessage('denied')}</p>
        ) : null}

        {permissionState === 'unsupported' ? (
          <p className="text-xs text-muted">{notificationPermissionMessage('unsupported')}</p>
        ) : null}

        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </div>
    </section>
  )
}
