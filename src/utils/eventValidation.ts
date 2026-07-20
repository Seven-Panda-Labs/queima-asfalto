import type { EventStatus, EventType } from '../types/Event'
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

export function deriveEventType(distanceKm: number): EventType {
  if (distanceKm <= 6) return 'km_5'
  if (distanceKm <= 11) return 'km_10'
  return 'km_21_1'
}
