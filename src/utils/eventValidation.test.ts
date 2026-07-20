import { describe, expect, it } from 'vitest'
import { validateEventDateStatus, normalizeStatusForDate } from './eventValidation'

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
