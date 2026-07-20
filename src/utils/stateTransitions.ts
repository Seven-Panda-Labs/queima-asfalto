import type { Event } from '../types/Event'

export const FALTOU_GRACE_DAYS = 2

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function shouldMarkAsFaltou(event: Event, today: Date = new Date()): boolean {
  if (event.status !== 'confirmed' && event.status !== 'planned') return false
  if (event.time) return false

  const cutoff = startOfDay(today)
  cutoff.setDate(cutoff.getDate() - FALTOU_GRACE_DAYS)

  return startOfDay(event.date).getTime() < cutoff.getTime()
}

export function applyAutoTransitions(events: Event[], today?: Date): Event[] {
  return events.filter((event) => shouldMarkAsFaltou(event, today))
}
