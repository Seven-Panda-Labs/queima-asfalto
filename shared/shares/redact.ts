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

/**
 * @param race the race the wish marks, which is where its name now lives.
 *
 * A wish is a marker on a race, and a race belongs to its owner: somebody
 * reading a shared list cannot open it. So the name and the place are read
 * here, at the moment of sharing, or a shared wish would arrive nameless.
 */
export function redactBucketListItemForShare(
  item: RedactableRecord,
  race?: RedactableRecord,
): RedactableRecord {
  const place = (value: unknown, fallback: unknown) =>
    typeof value === 'number' ? value : typeof fallback === 'number' ? fallback : null

  return {
    id: item.id,
    userId: item.userId,
    name: race?.name ?? item.name ?? '',
    location: race?.location ?? item.location ?? '',
    realDistance: item.realDistance ?? null,
    disciplines: item.disciplines ?? (item.eventType ? [item.eventType] : []),
    targetMonth: item.targetMonth ?? null,
    link: item.link ?? null,
    emoji: item.emoji ?? null,
    locationLat: place(race?.locationLat, item.locationLat),
    locationLng: place(race?.locationLng, item.locationLng),
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
