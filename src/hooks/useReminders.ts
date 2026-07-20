import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getNotificationPermissionState } from '../services/notificationPermission'
import {
  filterUnshownReminders,
  markReminderShown,
  pruneShownReminderIds,
  reminderQueueStorageKey,
} from '../services/reminderQueue'
import { showReminderNotification } from '../services/reminderNotifications'
import {
  computeReminders,
  getReminderDelayMs,
  isReminderSchedulable,
  partitionReminders,
  type Reminder,
} from '../utils/reminderScheduler'
import { useEvents } from './useEvents'
import { useNotificationPrefs } from './useNotificationPrefs'

export function useReminders() {
  const { user } = useAuth()
  const { allEvents } = useEvents()
  const { prefs, loading: prefsLoading } = useNotificationPrefs()
  const deliveredIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    deliveredIdsRef.current.clear()

    if (!user || prefsLoading || !prefs.notificationsEnabled) {
      return
    }

    if (getNotificationPermissionState() !== 'granted') {
      return
    }

    const queueKey = reminderQueueStorageKey(user.uid)
    const now = new Date()
    const reminders = computeReminders(allEvents, prefs, now)
    pruneShownReminderIds(
      reminders.map((reminder) => reminder.id),
      localStorage,
      queueKey,
    )

    const { missed, upcoming } = partitionReminders(reminders)
    const timeouts: ReturnType<typeof setTimeout>[] = []

    async function deliverReminder(reminder: Reminder) {
      if (deliveredIdsRef.current.has(reminder.id)) return
      deliveredIdsRef.current.add(reminder.id)

      try {
        await showReminderNotification(reminder, prefs.reminderDaysBefore)
        markReminderShown(reminder.id, localStorage, queueKey)
      } catch (error) {
        deliveredIdsRef.current.delete(reminder.id)
        console.error('Failed to show reminder notification:', error)
      }
    }

    for (const reminder of filterUnshownReminders(missed, localStorage, queueKey)) {
      void deliverReminder(reminder)
    }

    for (const reminder of filterUnshownReminders(upcoming, localStorage, queueKey)) {
      if (!isReminderSchedulable(reminder, now)) continue

      const timeout = setTimeout(() => {
        void deliverReminder(reminder)
      }, getReminderDelayMs(reminder, now))
      timeouts.push(timeout)
    }

    return () => {
      for (const timeout of timeouts) {
        clearTimeout(timeout)
      }
    }
  }, [user, allEvents, prefs, prefsLoading])
}
