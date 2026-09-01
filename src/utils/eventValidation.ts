import type { EventStatus, EventType } from '../types/Event'
import { EVENT_TYPES, NOMINAL_DISTANCE_KM } from '../domain/eventCodes'
import i18n from '../i18n'
import { isFutureDate, isPastDate } from './date'

export type ValidationResult = {
  valid: boolean
  message?: string
}

const FUTURE_STATUSES: EventStatus[] = ['planned', 'confirmed', 'cancelled']
const PAST_STATUSES: EventStatus[] = ['completed', 'missed', 'cancelled', 'confirmed']

export function allowedStatusesForDate(date: Date, includePastConfirmado = true): EventStatus[] {
  if (isFutureDate(date)) {
    return FUTURE_STATUSES
  }

  if (includePastConfirmado) {
    return PAST_STATUSES
  }

  return PAST_STATUSES.filter((status) => status !== 'confirmed')
}

/** Ajusta estados inválidos para a data (ex.: Planeado no passado → Faltou). */
export function normalizeStatusForDate(status: EventStatus, date: Date): EventStatus {
  const allowed = allowedStatusesForDate(date, true)
  if (allowed.includes(status)) return status

  if (isPastDate(date) && status === 'planned') {
    return 'missed'
  }

  if (isFutureDate(date) && (status === 'completed' || status === 'missed')) {
    return 'confirmed'
  }

  return allowed[0]
}

export function validateEventDateStatus(date: Date, status: EventStatus): ValidationResult {
  if (isFutureDate(date)) {
    if (status === 'completed' || status === 'missed') {
      return {
        valid: false,
        message: i18n.t('validation.futureNoCompleted'),
      }
    }
    if (status === 'planned' || status === 'confirmed' || status === 'cancelled') {
      return { valid: true }
    }
  }

  if (isPastDate(date)) {
    if (status === 'planned') {
      return {
        valid: false,
        message: i18n.t('validation.pastNoPlanned'),
      }
    }
    if (
      status === 'completed' ||
      status === 'missed' ||
      status === 'cancelled' ||
      status === 'confirmed'
    ) {
      return { valid: true }
    }
  }

  return { valid: true }
}

/**
 * The discipline whose nominal distance sits closest to the measured one, in
 * log space so 3 km lands on the 3000 m and not on the 5K: proportional error
 * is what matters between distances that span two orders of magnitude.
 *
 * Ties go to the shorter discipline, which is the conservative read of a race
 * measured between two of them.
 */
export function deriveEventType(distanceKm: number): EventType {
  if (!(distanceKm > 0)) return 'km_10'

  let best: EventType = EVENT_TYPES[0]!
  let bestDistance = Infinity
  for (const eventType of EVENT_TYPES) {
    const nominal = NOMINAL_DISTANCE_KM[eventType]
    const gap = Math.abs(Math.log(distanceKm / nominal))
    if (gap < bestDistance) {
      best = eventType
      bestDistance = gap
    }
  }

  return best
}
