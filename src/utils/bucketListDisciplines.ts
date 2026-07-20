import type { EventType } from '../types/Event'
import { EVENT_TYPES } from '../types/Event'
import { normalizeEventType } from '../domain/eventCodes'

const VALID_EVENT_TYPES = new Set<EventType>(EVENT_TYPES)

export function normalizeBucketListDisciplines(data: Record<string, unknown>): EventType[] {
  const raw = data.disciplines
  if (Array.isArray(raw) && raw.length > 0) {
    const normalized = raw
      .map((value) => (typeof value === 'string' ? normalizeEventType(value) : null))
      .filter((value): value is EventType => value !== null && VALID_EVENT_TYPES.has(value))
    const unique = [...new Set(normalized)]
    if (unique.length > 0) return unique
  }

  if (typeof data.eventType === 'string') {
    const legacy = normalizeEventType(data.eventType)
    if (VALID_EVENT_TYPES.has(legacy)) return [legacy]
  }

  return ['km_10']
}

export function parseDisciplinesCell(value: unknown): EventType[] | null {
  const text = value === null || value === undefined ? '' : String(value).trim()
  if (!text) return null

  const parts = text.split(/[,;|]/).map((part) => part.trim()).filter(Boolean)
  const normalized = parts
    .map((part) => normalizeEventType(part))
    .filter((type) => VALID_EVENT_TYPES.has(type))
  const unique = [...new Set(normalized)]
  return unique.length > 0 ? unique : null
}

export function serializeDisciplinesCell(disciplines: EventType[]): string {
  return disciplines.join(',')
}

export function bucketListItemHasDiscipline(
  item: { disciplines: EventType[] },
  discipline: EventType,
): boolean {
  return item.disciplines.includes(discipline)
}
