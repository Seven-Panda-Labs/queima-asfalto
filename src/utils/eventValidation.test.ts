import { describe, expect, it } from 'vitest'
import { deriveEventType, validateEventDateStatus, normalizeStatusForDate } from './eventValidation'

function daysFromToday(offset: number): Date {
  const base = new Date()
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset)
}

describe('validateEventDateStatus', () => {
  it('allows Planeado for future dates', () => {
    expect(validateEventDateStatus(daysFromToday(7), 'planned').valid).toBe(true)
  })

  it('allows Concluído on today', () => {
    expect(validateEventDateStatus(daysFromToday(0), 'completed').valid).toBe(true)
  })

  it('rejects Concluído for future dates', () => {
    expect(validateEventDateStatus(daysFromToday(7), 'completed').valid).toBe(false)
  })

  it('allows Faltou for past dates', () => {
    expect(validateEventDateStatus(daysFromToday(-3), 'missed').valid).toBe(true)
  })

  it('rejects Planeado for past dates', () => {
    expect(validateEventDateStatus(daysFromToday(-3), 'planned').valid).toBe(false)
  })
})

describe('normalizeStatusForDate', () => {
  it('maps Planeado on past dates to Faltou', () => {
    expect(normalizeStatusForDate('planned', daysFromToday(-3))).toBe('missed')
  })

  it('maps Concluído on future dates to Confirmado', () => {
    expect(normalizeStatusForDate('completed', daysFromToday(7))).toBe('confirmed')
  })

  it('keeps Concluído on today', () => {
    expect(normalizeStatusForDate('completed', daysFromToday(0))).toBe('completed')
  })

  it('keeps valid status unchanged', () => {
    expect(normalizeStatusForDate('planned', daysFromToday(7))).toBe('planned')
    expect(normalizeStatusForDate('completed', daysFromToday(-3))).toBe('completed')
  })
})

describe('deriveEventType', () => {
  it('picks the nearest discipline by distance', () => {
    expect(deriveEventType(1.6)).toBe('m_1500')
    expect(deriveEventType(3.2)).toBe('m_3000')
    expect(deriveEventType(5.4)).toBe('km_5')
    expect(deriveEventType(9.8)).toBe('km_10')
    expect(deriveEventType(15.2)).toBe('km_15')
    expect(deriveEventType(16)).toBe('mi_10')
    expect(deriveEventType(21)).toBe('km_21_1')
    expect(deriveEventType(31)).toBe('km_30')
    expect(deriveEventType(99)).toBe('km_100')
    expect(deriveEventType(161)).toBe('mi_100')
  })

  it('returns the marathon for a marathon, which the old three branches never did', () => {
    expect(deriveEventType(42.195)).toBe('km_42_2')
    expect(deriveEventType(42)).toBe('km_42_2')
  })

  it('falls back to the 10K on a distance that says nothing', () => {
    expect(deriveEventType(0)).toBe('km_10')
    expect(deriveEventType(-5)).toBe('km_10')
    expect(deriveEventType(Number.NaN)).toBe('km_10')
  })
})
