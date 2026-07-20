import type { Event } from '../types/Event'

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function findNextEvent(events: Event[], today: Date = new Date()): Event | null {
  const todayStart = startOfDay(today).getTime()

  const upcoming = events
    .filter(
      (event) =>
        (event.status === 'planned' || event.status === 'confirmed') &&
        startOfDay(event.date).getTime() >= todayStart,
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  return upcoming[0] ?? null
}

export function daysUntilEvent(eventDate: Date, today: Date = new Date()): number {
  const todayStart = startOfDay(today).getTime()
  const eventStart = startOfDay(eventDate).getTime()
  return Math.round((eventStart - todayStart) / 86_400_000)
}

export function formatDaysUntil(
  eventDate: Date,
  today: Date,
  labels: { today: string; tomorrow: string; other: (n: number) => string },
): string {
  const days = daysUntilEvent(eventDate, today)
  if (days === 0) return labels.today
  if (days === 1) return labels.tomorrow
  return labels.other(days)
}
