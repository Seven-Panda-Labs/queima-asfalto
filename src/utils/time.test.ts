import { describe, expect, it } from 'vitest'
import { hasTimeInput, joinTime, normalizeTime, validateTime } from './time'

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

describe('hasTimeInput', () => {
  it('is false for a form nobody has touched', () => {
    expect(hasTimeInput('', '', '')).toBe(false)
    expect(hasTimeInput(' ', '', ' ')).toBe(false)
  })

  it('is true as soon as any field holds something', () => {
    expect(hasTimeInput('', '26', '')).toBe(true)
    expect(hasTimeInput('0', '', '')).toBe(true)
  })

  it('separates an empty form from a deliberate zero', () => {
    // joinTime turns both into a valid 0:00:00, so only this tells them apart.
    expect(joinTime('', '', '')).toBe(joinTime('0', '0', '0'))
    expect(hasTimeInput('', '', '')).not.toBe(hasTimeInput('0', '0', '0'))
  })
})
