import { describe, expect, it } from 'vitest'
import {
  EVENT_STATUSES,
  EVENT_TYPES,
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
