import { describe, expect, it } from 'vitest'
import { toAnalysableResults } from './results'
import { makeEvent } from './testFixtures'
import { buildRecordProgressions, recordResultIds, recordsSetIn } from './records'

const results = toAnalysableResults([
  makeEvent({ id: 'a', date: new Date(2024, 0, 1), eventType: 'km_10', time: '01:00:00' }),
  makeEvent({ id: 'b', date: new Date(2025, 0, 1), eventType: 'km_10', time: '00:55:00' }),
  makeEvent({ id: 'c', date: new Date(2025, 6, 1), eventType: 'km_10', time: '00:58:00' }),
  makeEvent({ id: 'd', date: new Date(2026, 0, 1), eventType: 'km_10', time: '00:50:00' }),
  makeEvent({ id: 'e', date: new Date(2026, 1, 1), eventType: 'km_5', realDistance: 5, time: '00:25:00' }),
])

describe('buildRecordProgressions', () => {
  it('keeps only the races that beat the standing record', () => {
    const tenK = buildRecordProgressions(results).find((p) => p.eventType === 'km_10')

    expect(tenK!.eventType).toBe('km_10')
    expect(tenK!.marks.map((mark) => mark.result.event.id)).toEqual(['a', 'b', 'd'])
    expect(tenK!.current.result.event.id).toBe('d')
  })

  it('measures each improvement in seconds per km, with none for the first', () => {
    const tenK = buildRecordProgressions(results).find((p) => p.eventType === 'km_10')

    expect(tenK!.marks[0]!.improvementSeconds).toBeNull()
    expect(tenK!.marks[0]!.ordinal).toBe(1)
    // 60:00 to 55:00 over 10 km is 30 s/km.
    expect(tenK!.marks[1]!.improvementSeconds).toBeCloseTo(30, 6)
    expect(tenK!.marks[2]!.improvementSeconds).toBeCloseTo(30, 6)
  })

  it('tracks each discipline separately and skips the empty ones', () => {
    const progressions = buildRecordProgressions(results)

    expect(progressions.map((progression) => progression.eventType)).toEqual(['km_5', 'km_10'])
    expect(progressions[0]!.marks).toHaveLength(1)
  })
})

describe('recordsSetIn', () => {
  it('counts the first race of a discipline as a record', () => {
    expect(recordsSetIn(results, 2024)).toBe(1)
    expect(recordsSetIn(results, 2025)).toBe(1)
    // 2026: the 50:00 10K and the first 5K ever.
    expect(recordsSetIn(results, 2026)).toBe(2)
  })

  it('is zero for a season with no records', () => {
    expect(recordsSetIn(results, 2023)).toBe(0)
  })
})

describe('recordResultIds', () => {
  it('marks every race that ever held a record', () => {
    expect(recordResultIds(results)).toEqual(new Set(['a', 'b', 'd', 'e']))
  })
})
