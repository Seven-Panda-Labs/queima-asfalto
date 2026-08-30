import { EVENT_TYPES, isEventType, type EventType } from './eventCodes'

/** Every account starts with the four disciplines the app shipped with. */
export const DEFAULT_ENABLED_DISCIPLINES: EventType[] = [...EVENT_TYPES]

/**
 * An account that never touched the setting has no field and gets everything.
 * An unusable or empty list falls back the same way: a UI with no disciplines
 * at all cannot create a race, a goal or a bucket list item.
 */
export function parseEnabledDisciplines(data: Record<string, unknown> | undefined): EventType[] {
  if (!data || !Array.isArray(data.enabledDisciplines)) {
    return [...DEFAULT_ENABLED_DISCIPLINES]
  }

  const stored = new Set(
    data.enabledDisciplines.filter(
      (value): value is EventType => typeof value === 'string' && isEventType(value),
    ),
  )
  if (stored.size === 0) return [...DEFAULT_ENABLED_DISCIPLINES]

  return sortByDistance(stored)
}

/**
 * The enabled set, plus anything the screen would otherwise strand: the value
 * already in a picker, or the discipline a filter is running on. Without it,
 * editing a race in a disabled discipline would silently move it, and a link
 * into one would narrow a page with nothing on screen to say so.
 *
 * It governs what can be picked, never what is shown: a disabled discipline
 * keeps its races, goals and records, and they still count in every total.
 */
export function visibleDisciplines(
  enabled: readonly EventType[],
  inUse: Iterable<EventType>,
): EventType[] {
  const set = new Set<EventType>(enabled)
  for (const eventType of inUse) {
    if (isEventType(eventType)) set.add(eventType)
  }
  return sortByDistance(set)
}

/** `EVENT_TYPES` runs shortest to longest, and the analytics rely on that order. */
function sortByDistance(types: ReadonlySet<EventType>): EventType[] {
  return EVENT_TYPES.filter((eventType) => types.has(eventType))
}
