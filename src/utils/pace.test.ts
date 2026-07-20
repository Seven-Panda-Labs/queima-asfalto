import { describe, expect, it } from 'vitest'
import { calculatePace, normalizePace, validatePace } from './pace'

describe('calculatePace', () => {
  it('calculates pace for 5Km in 25:30', () => {
    expect(calculatePace('00:25:30', 5.0)).toBe('5:06')
  })

  it('calculates pace for 5.4Km in 28:53', () => {
    expect(calculatePace('00:28:53', 5.4)).toBe('5:21')
  })

  it('returns null for zero distance', () => {
    expect(calculatePace('00:25:30', 0)).toBeNull()
  })

  it('returns null for invalid time', () => {
    expect(calculatePace('invalid', 5)).toBeNull()
  })
})

describe('validatePace', () => {
  it('accepts mm:ss', () => {
    expect(validatePace('5:30')).toBe(true)
    expect(normalizePace('5:30')).toBe('5:30')
  })

  it('rejects invalid pace', () => {
    expect(validatePace('5:75')).toBe(false)
    expect(validatePace('abc')).toBe(false)
  })
})
