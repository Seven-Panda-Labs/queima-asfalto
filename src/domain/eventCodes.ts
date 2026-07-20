export type EventStatus = 'planned' | 'confirmed' | 'completed' | 'missed' | 'cancelled'

export type EventType = 'km_5' | 'km_10' | 'km_21_1' | 'km_42_2'

export const EVENT_STATUSES: EventStatus[] = [
  'planned',
  'confirmed',
  'completed',
  'missed',
  'cancelled',
]

export const EVENT_TYPES: EventType[] = ['km_5', 'km_10', 'km_21_1', 'km_42_2']

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

const DEFAULT_STATUS: EventStatus = 'planned'
const DEFAULT_TYPE: EventType = 'km_10'

export function normalizeEventStatus(raw: string): EventStatus {
  return LEGACY_STATUS_MAP[raw] ?? LEGACY_STATUS_MAP[raw.trim()] ?? DEFAULT_STATUS
}

export function normalizeEventType(raw: string): EventType {
  return LEGACY_TYPE_MAP[raw] ?? LEGACY_TYPE_MAP[raw.trim()] ?? DEFAULT_TYPE
}

export function isEventStatus(value: string): value is EventStatus {
  return (EVENT_STATUSES as readonly string[]).includes(value)
}

export function isEventType(value: string): value is EventType {
  return (EVENT_TYPES as readonly string[]).includes(value)
}

