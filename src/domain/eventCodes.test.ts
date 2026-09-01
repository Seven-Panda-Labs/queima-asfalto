import { describe, expect, it } from 'vitest'
import {
  EVENT_STATUSES,
  EVENT_TYPES,
  NOMINAL_DISTANCE_KM,
  normalizeEventStatus,
  normalizeEventType,
} from './eventCodes'

describe('normalizeEventStatus', () => {
  it('maps Portuguese and legacy values to canonical codes', () => {
    expect(normalizeEventStatus('Agendado')).toBe('planned')
    expect(normalizeEventStatus('Planeado')).toBe('planned')
    expect(normalizeEventStatus('Confirmado')).toBe('confirmed')
    expect(normalizeEventStatus('Concluído')).toBe('completed')
    expect(normalizeEventStatus('Faltou')).toBe('missed')
    expect(normalizeEventStatus('Cancelado')).toBe('cancelled')
  })

  it('passes through canonical codes', () => {
    for (const status of EVENT_STATUSES) {
      expect(normalizeEventStatus(status)).toBe(status)
    }
  })
})

describe('normalizeEventType', () => {
  it('maps Portuguese and legacy values to canonical codes', () => {
    expect(normalizeEventType('5Km')).toBe('km_5')
    expect(normalizeEventType('10Km')).toBe('km_10')
    expect(normalizeEventType('21.1Km')).toBe('km_21_1')
    expect(normalizeEventType('42.2Km')).toBe('km_42_2')
    expect(normalizeEventType('Outra')).toBe('km_10')
  })

  it('passes through canonical codes', () => {
    for (const type of EVENT_TYPES) {
      expect(normalizeEventType(type)).toBe(type)
    }
  })
})

describe('the discipline catalogue', () => {
  it('runs shortest to longest, which the analytics depend on', () => {
    const distances = EVENT_TYPES.map((eventType) => NOMINAL_DISTANCE_KM[eventType])
    expect(distances).toEqual([...distances].sort((left, right) => left - right))
  })

  it('gives every discipline a nominal distance', () => {
    for (const eventType of EVENT_TYPES) {
      expect(NOMINAL_DISTANCE_KM[eventType]).toBeGreaterThan(0)
    }
    expect(Object.keys(NOMINAL_DISTANCE_KM).sort()).toEqual([...EVENT_TYPES].sort())
  })
})
