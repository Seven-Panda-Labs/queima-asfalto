import type { EventType } from '../types/Event'
import { deriveEventType } from './eventValidation'

export type DerivedFromName = {
  eventType: EventType
  realDistance: number
}

const MEIA_PATTERN = /meia\s*maratona|half\s*marathon/i
const MARATHON_PATTERN = /marathon|maratona/i
const MILLAS_PATTERN = /(\d+(?:[.,]\d+)?)\s*millas?/i
const X_MILLAS_PATTERN = /\bx\s*millas?\b/i
const VARVET_PATTERN = /varvet/i

export function deriveEventTypeFromName(name: string): DerivedFromName {
  const trimmed = name.trim()
  if (!trimmed) {
    return { eventType: 'km_10', realDistance: 10 }
  }

  if (MEIA_PATTERN.test(trimmed) || VARVET_PATTERN.test(trimmed)) {
    return { eventType: 'km_21_1', realDistance: 21.1 }
  }

  const millasMatch = MILLAS_PATTERN.exec(trimmed)
  if (millasMatch) {
    const miles = Number(millasMatch[1].replace(',', '.'))
    const km = Math.round(miles * 1.60934 * 10) / 10
    return { eventType: deriveEventType(km), realDistance: km }
  }

  if (X_MILLAS_PATTERN.test(trimmed)) {
    const km = Math.round(10 * 1.60934 * 10) / 10
    return { eventType: deriveEventType(km), realDistance: km }
  }

  if (MARATHON_PATTERN.test(trimmed)) {
    return { eventType: 'km_42_2', realDistance: 42.2 }
  }

  return { eventType: 'km_10', realDistance: 10 }
}
