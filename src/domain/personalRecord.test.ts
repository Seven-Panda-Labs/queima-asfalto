import { describe, expect, it } from 'vitest'
import type { Event } from '../types/Event'
import { beatsRecordPace, pickFastestEvent, recordPaceSeconds } from './personalRecord'
import { makeEvent } from '../utils/analytics/testFixtures'

const tenK = (id: string, time: string, realDistance = 10): Event =>
  makeEvent({ id, date: new Date(2026, 0, 1), eventType: 'km_10', realDistance, time, pace: '5:20' })

describe('recordPaceSeconds', () => {
  it('reads the time, not the rounded pace', () => {
    // Both races store 5:20, and three seconds separate them.
    expect(recordPaceSeconds(tenK('a', '00:53:22'))).toBeCloseTo(320.2, 5)
    expect(recordPaceSeconds(tenK('b', '00:53:25'))).toBeCloseTo(320.5, 5)
  })

  it('falls back to the stored pace when a race has no time', () => {
    const event = makeEvent({ id: 'c', date: new Date(2026, 0, 1), eventType: 'km_10', pace: '5:00' })
    expect(recordPaceSeconds(event)).toBe(300)
  })

  it('has nothing to say about a race that was not run', () => {
    const planned = makeEvent({ id: 'd', date: new Date(2026, 0, 1), eventType: 'km_10', status: 'planned' })
    expect(recordPaceSeconds(planned)).toBeNull()
  })
})

describe('pickFastestEvent', () => {
  it('separates two races the stored pace prints the same', () => {
    const best = pickFastestEvent([tenK('slow', '00:53:25'), tenK('fast', '00:53:22')])
    expect(best?.id).toBe('fast')
  })

  it('compares distances that differ by pace, never by total time', () => {
    // 54:26 over 10,2 Km is the same 5:20,2 as 53:22 over 10 Km, run 200 m further.
    const longer = tenK('longer', '00:54:20', 10.2)
    const shorter = tenK('shorter', '00:53:22')
    expect(pickFastestEvent([shorter, longer])?.id).toBe('longer')
  })

  it('keeps the standing record on an exact tie', () => {
    const first = tenK('first', '00:53:22')
    const second = tenK('second', '00:53:22')
    expect(pickFastestEvent([first, second])?.id).toBe('first')
  })

  it('returns nothing when no race can be ranked', () => {
    expect(pickFastestEvent([])).toBeNull()
  })
})

describe('beatsRecordPace', () => {
  it('needs a strictly faster pace', () => {
    expect(beatsRecordPace(319, 320)).toBe(true)
    expect(beatsRecordPace(320, 320)).toBe(false)
  })
})
