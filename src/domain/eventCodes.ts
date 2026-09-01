export type EventStatus = 'planned' | 'confirmed' | 'completed' | 'missed' | 'cancelled'

export type EventType =
  | 'm_1500'
  | 'm_3000'
  | 'km_5'
  | 'km_10'
  | 'km_15'
  | 'mi_10'
  | 'km_21_1'
  | 'km_30'
  | 'km_42_2'
  | 'km_50'
  | 'mi_50'
  | 'km_100'
  | 'mi_100'

export const EVENT_STATUSES: EventStatus[] = [
  'planned',
  'confirmed',
  'completed',
  'missed',
  'cancelled',
]

/**
 * Shortest to longest, and that order is load-bearing: `pickReferenceEventType`
 * breaks ties with it, `computeBestPerformances` and `buildRecordProgressions`
 * iterate it, and `sortByDistance` in `disciplinePreferences` filters through it.
 * A new discipline goes in its distance's place, never at the end.
 */
export const EVENT_TYPES: EventType[] = [
  'm_1500',
  'm_3000',
  'km_5',
  'km_10',
  'km_15',
  'mi_10',
  'km_21_1',
  'km_30',
  'km_42_2',
  'km_50',
  'mi_50',
  'km_100',
  'mi_100',
]

const LEGACY_STATUS_MAP: Record<string, EventStatus> = {
  Agendado: 'planned',
  Planeado: 'planned',
  planned: 'planned',
  Confirmado: 'confirmed',
  confirmed: 'confirmed',
  Concluído: 'completed',
  Concluido: 'completed',
  completed: 'completed',
  Faltou: 'missed',
  missed: 'missed',
  Cancelado: 'cancelled',
  cancelled: 'cancelled',
}

const LEGACY_TYPE_MAP: Record<string, EventType> = {
  '5Km': 'km_5',
  km_5: 'km_5',
  '10Km': 'km_10',
  km_10: 'km_10',
  '21.1Km': 'km_21_1',
  km_21_1: 'km_21_1',
  '42.2Km': 'km_42_2',
  km_42_2: 'km_42_2',
  Outra: 'km_10',
}

/**
 * Official distances, used only to convert between disciplines. A race's own
 * pace always uses its measured `realDistance`.
 */
export const NOMINAL_DISTANCE_KM: Record<EventType, number> = {
  m_1500: 1.5,
  m_3000: 3,
  km_5: 5,
  km_10: 10,
  km_15: 15,
  mi_10: 16.0934,
  km_21_1: 21.0975,
  km_30: 30,
  km_42_2: 42.195,
  km_50: 50,
  mi_50: 80.4672,
  km_100: 100,
  mi_100: 160.9344,
}

const DEFAULT_STATUS: EventStatus = 'planned'
const DEFAULT_TYPE: EventType = 'km_10'

export function normalizeEventStatus(raw: string): EventStatus {
  return LEGACY_STATUS_MAP[raw] ?? LEGACY_STATUS_MAP[raw.trim()] ?? DEFAULT_STATUS
}

export function normalizeEventType(raw: string): EventType {
  // Canonical codes first: the legacy map only ever knew the original four, so
  // without this every discipline added since falls through to the default.
  const trimmed = raw.trim()
  if (isEventType(trimmed)) return trimmed
  return LEGACY_TYPE_MAP[raw] ?? LEGACY_TYPE_MAP[trimmed] ?? DEFAULT_TYPE
}

export function isEventStatus(value: string): value is EventStatus {
  return (EVENT_STATUSES as readonly string[]).includes(value)
}

export function isEventType(value: string): value is EventType {
  return (EVENT_TYPES as readonly string[]).includes(value)
}

