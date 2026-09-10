import { describe, expect, it } from 'vitest'
import { isIsoDay, isIsoDayOrInstant } from './types'

describe('isIsoDay', () => {
  it('takes a day in the shape the catalog stores', () => {
    expect(isIsoDay('2026-08-23')).toBe(true)
  })

  it('refuses the one that white-screened the event page', () => {
    // Typed into the admin form, stored, then handed to `Intl`, which threw.
    expect(isIsoDay('2026-08.-23')).toBe(false)
    expect(isIsoDay('2027-08.-29')).toBe(false)
  })

  it('refuses a day that parses but is not the shape', () => {
    // `new Date` reads these; the duplicate rule compares days as strings.
    expect(isIsoDay('2026-8-3')).toBe(false)
    expect(isIsoDay('23/08/2026')).toBe(false)
    expect(isIsoDay('2026-08-23T09:00:00Z')).toBe(false)
  })

  it('refuses a day that does not exist, and nothing at all', () => {
    expect(isIsoDay('2026-02-31')).toBe(false)
    expect(isIsoDay('')).toBe(false)
    expect(isIsoDay(undefined)).toBe(false)
  })
})

describe('isIsoDayOrInstant', () => {
  it('takes both shapes a gate is published in', () => {
    expect(isIsoDayOrInstant('2026-09-18')).toBe(true)
    expect(isIsoDayOrInstant('2026-08-14T02:00:00Z')).toBe(true)
  })

  it('refuses an instant that is not one', () => {
    expect(isIsoDayOrInstant('2026-08-14T99:00:00Z')).toBe(false)
    expect(isIsoDayOrInstant('daqui a duas semanas')).toBe(false)
  })
})
