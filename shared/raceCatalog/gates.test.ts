import { describe, expect, it } from 'vitest'
import { joinGate, splitGate, zoneOffsetMinutes } from './gates'

describe('splitGate', () => {
  it('reads a plain day as a day, with no hour invented', () => {
    expect(splitGate('2026-04-24', 'Europe/London')).toEqual({ day: '2026-04-24' })
  })

  it('reads an instant in the race s own clock', () => {
    // Real: Boston closes at 21:00 UTC, which is 17:00 where the race is.
    expect(splitGate('2026-09-18T21:00:00Z', 'America/New_York')).toEqual({
      day: '2026-09-18',
      time: '17:00',
    })
  })

  it('falls back to UTC when the race has no zone', () => {
    expect(splitGate('2026-09-18T21:00:00Z', undefined)).toEqual({
      day: '2026-09-18',
      time: '21:00',
    })
  })

  it('says nothing about nothing, or about what it cannot read', () => {
    expect(splitGate(undefined, 'Europe/Lisbon')).toBeUndefined()
    expect(splitGate('daqui a duas semanas', 'Europe/Lisbon')).toBeUndefined()
  })
})

describe('joinGate', () => {
  it('keeps a day a day', () => {
    expect(joinGate({ day: '2026-04-24' }, 'Europe/London')).toBe('2026-04-24')
  })

  it('turns an hour in the race s zone into the instant it names', () => {
    expect(joinGate({ day: '2026-09-18', time: '17:00' }, 'America/New_York')).toBe(
      '2026-09-18T21:00:00Z',
    )
    // Winter, when New York is five hours behind rather than four.
    expect(joinGate({ day: '2026-12-18', time: '17:00' }, 'America/New_York')).toBe(
      '2026-12-18T22:00:00Z',
    )
  })

  it('reads the hour on the night the clocks move', () => {
    // Lisbon goes forward on the 29th of March 2026: 09:00 is 08:00 UTC after
    // it, and the naive guess lands on the wrong side of the boundary.
    expect(joinGate({ day: '2026-03-29', time: '09:00' }, 'Europe/Lisbon')).toBe(
      '2026-03-29T08:00:00Z',
    )
    expect(joinGate({ day: '2026-03-28', time: '09:00' }, 'Europe/Lisbon')).toBe(
      '2026-03-28T09:00:00Z',
    )
  })

  it('keeps the day when an hour cannot be anchored', () => {
    // No zone is nobody's hour, so the day is what can honestly be stored.
    expect(joinGate({ day: '2026-09-18', time: '17:00' }, undefined)).toBe('2026-09-18')
  })

  it('survives a round trip', () => {
    const zone = 'Europe/Berlin'
    const stored = joinGate({ day: '2027-06-01', time: '08:30' }, zone)!
    expect(splitGate(stored, zone)).toEqual({ day: '2027-06-01', time: '08:30' })
  })
})

describe('zoneOffsetMinutes', () => {
  it('is what the zone is ahead of UTC at that moment', () => {
    expect(zoneOffsetMinutes('Europe/Lisbon', new Date('2026-01-15T12:00:00Z'))).toBe(0)
    expect(zoneOffsetMinutes('Europe/Lisbon', new Date('2026-07-15T12:00:00Z'))).toBe(60)
    expect(zoneOffsetMinutes('Asia/Tokyo', new Date('2026-01-15T12:00:00Z'))).toBe(540)
    // Half-hour zones exist and are exactly why this is minutes.
    expect(zoneOffsetMinutes('Asia/Kolkata', new Date('2026-01-15T12:00:00Z'))).toBe(330)
  })
})
