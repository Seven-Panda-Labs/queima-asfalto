import { describe, expect, it } from 'vitest'
import { makeEvent } from './testFixtures'
import { computeDataQuality } from './dataQuality'

describe('computeDataQuality', () => {
  const events = [
    makeEvent({ id: 'ok', date: new Date(2026, 0, 1), eventType: 'km_10', time: '00:50:00', classification: '10/100', resultsVerified: true }),
    makeEvent({ id: 'noClass', date: new Date(2026, 1, 1), eventType: 'km_10', time: '00:51:00' }),
    makeEvent({ id: 'noTime', date: new Date(2026, 2, 1), eventType: 'km_10' }),
    makeEvent({ id: 'paceOnly', date: new Date(2026, 5, 1), eventType: 'km_10', pace: '5:00' }),
    makeEvent({ id: 'noDistance', date: new Date(2026, 3, 1), eventType: 'km_10', time: '00:52:00', realDistance: 0 }),
    makeEvent({ id: 'planned', date: new Date(2026, 4, 1), eventType: 'km_10', status: 'planned' }),
  ]

  it('separates what the analysis can use from what it had to drop', () => {
    const quality = computeDataQuality(events)

    expect(quality.completed).toBe(5)
    expect(quality.analysable).toBe(3)
    expect(quality.excluded.map((event) => event.id)).toEqual(['noTime', 'noDistance'])
  })

  it('names what is missing so the page can ask for it', () => {
    const quality = computeDataQuality(events)

    // `paceOnly` is analysable on a rebuilt time, but still missing one.
    expect(quality.missingTime).toBe(2)
    expect(quality.missingDistance).toBe(1)
    // Counted only among the races the analysis uses.
    expect(quality.missingClassification).toBe(2)
  })

  it('reports verification as a share of completed races', () => {
    const quality = computeDataQuality(events)

    expect(quality.verified).toBe(1)
    expect(quality.verifiedPercent).toBe(20)
  })

  it('does not divide by zero on an empty history', () => {
    expect(computeDataQuality([]).verifiedPercent).toBe(0)
  })
})
