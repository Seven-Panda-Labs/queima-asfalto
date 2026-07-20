import i18n from '../i18n'
import type { Reminder } from '../utils/reminderScheduler'
import { formatReminderBody } from '../utils/reminderScheduler'

export async function showReminderNotification(
  reminder: Reminder,
  daysBefore: number,
): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service worker unavailable.')
  }

  const registration = await navigator.serviceWorker.ready
  await registration.showNotification(i18n.t('notifications.titlePrefix'), {
    body: formatReminderBody(reminder, daysBefore),
    icon: '/pwa-192x192.png',
    tag: reminder.id,
    data: {
      url: `/eventos/${reminder.eventId}/editar`,
    },
  })
}
