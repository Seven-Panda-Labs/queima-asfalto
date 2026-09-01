import { EVENT_TYPES, NOMINAL_DISTANCE_KM, type EventType } from './eventCodes'

/**
 * Groups for the discipline picker, derived from the distance rather than listed
 * by hand, so a discipline added to the catalogue lands in a group on its own.
 *
 * Three, not the five families the chart palette uses: the palette needs hues it
 * can tell apart, the picker needs a list a runner can scan. Marathon sits with
 * the road distances because that is where a road runner looks for it.
 */
export type DisciplineGroupId = 'short' | 'road' | 'ultra'

export const DISCIPLINE_GROUP_IDS: DisciplineGroupId[] = ['short', 'road', 'ultra']

const MARATHON_KM = NOMINAL_DISTANCE_KM.km_42_2

export function disciplineGroup(eventType: EventType): DisciplineGroupId {
  const distanceKm = NOMINAL_DISTANCE_KM[eventType]
  if (distanceKm < NOMINAL_DISTANCE_KM.km_5) return 'short'
  if (distanceKm <= MARATHON_KM) return 'road'
  return 'ultra'
}

export type DisciplineGroup = {
  id: DisciplineGroupId
  disciplines: EventType[]
}

/** Every group that has disciplines, in distance order, each keeping `EVENT_TYPES` order. */
export function groupedDisciplines(
  disciplines: readonly EventType[] = EVENT_TYPES,
): DisciplineGroup[] {
  return DISCIPLINE_GROUP_IDS.map((id) => ({
    id,
    disciplines: EVENT_TYPES.filter(
      (eventType) => disciplines.includes(eventType) && disciplineGroup(eventType) === id,
    ),
  })).filter((group) => group.disciplines.length > 0)
}
