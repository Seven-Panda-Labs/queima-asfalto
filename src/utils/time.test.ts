import { describe, expect, it } from 'vitest'
import { normalizeTime, validateTime } from './time'

describe('validateTime', () => {
  it('accepts hh:mm:ss', () => {
    expect(validateTime('00:25:30')).toBe(true)
    expect(normalizeTime('00:25:30')).toBe('00:25:30')
  })

  it('normalizes hours without leading zero', () => {
    expect(normalizeTime('1:05:09')).toBe('01:05:09')
  })

  it('rejects mm:ss format', () => {
    expect(validateTime('25:30')).toBe(false)
  })

  it('rejects invalid input', () => {
    expect(validateTime('abc')).toBe(false)
  })
})
