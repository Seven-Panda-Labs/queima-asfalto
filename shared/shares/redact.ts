import type { EventsPermission } from './types.js'

type RedactableRecord = Record<string, unknown>

export function redactEventForShare(
  event: RedactableRecord,
  eventsPermission: EventsPermission,
): RedactableRecord {
  const base: RedactableRecord = {
    id: event.id,
    userId: event.userId,
    name: event.name,
    date: event.date,
    realDistance: event.realDistance,
    eventType: event.eventType,
    location: event.location ?? '',
    status: event.status,
    emoji: event.emoji ?? null,
    locationLat: typeof event.locationLat === 'number' ? event.locationLat : null,
    locationLng: typeof event.locationLng === 'number' ? event.locationLng : null,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  }

  if (eventsPermission === 'read' || eventsPermission === 'write') {
    return {
      ...base,
      time: event.time ?? null,
      pace: event.pace ?? null,
      classification: event.classification ?? null,
      resultsVerified: event.resultsVerified === true,
    }
  }

  return base
}

export function redactBucketListItemForShare(item: RedactableRecord): RedactableRecord {
  return {
    id: item.id,
    userId: item.userId,
    name: item.name,
    location: item.location ?? '',
    realDistance: item.realDistance,
    disciplines: item.disciplines ?? (item.eventType ? [item.eventType] : []),
    targetMonth: item.targetMonth ?? null,
    link: item.link ?? null,
    emoji: item.emoji ?? null,
    locationLat: typeof item.locationLat === 'number' ? item.locationLat : null,
    locationLng: typeof item.locationLng === 'number' ? item.locationLng : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

export function redactGoalForShare(goal: RedactableRecord): RedactableRecord {
  return {
    id: goal.id,
    userId: goal.userId,
    eventType: goal.eventType,
    targetCount: goal.targetCount,
    year: goal.year,
    emoji: goal.emoji ?? null,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  }
}

export function redactPerformanceGoalForShare(goal: RedactableRecord): RedactableRecord {
  return {
    id: goal.id,
    userId: goal.userId,
    type: goal.type,
    eventType: goal.eventType,
    year: goal.year,
    targetPace: goal.targetPace ?? null,
    targetTime: goal.targetTime ?? null,
    emoji: goal.emoji ?? null,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  }
}
