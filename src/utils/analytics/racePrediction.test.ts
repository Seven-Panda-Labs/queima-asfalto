import { describe, expect, it } from 'vitest'
import { makeEvent } from './testFixtures'
import { projectRaceTime, racesPreparing } from './racePrediction'

const TODAY = new Date(2026, 8, 2)
const ANCHOR = { distanceKm: 42.195, date: new Date(2026, 9, 11) }

/** A 10K in 47:12, four weeks before the anchor, declared as preparing it. */
const buildUp = makeEvent({
  id: 'build-up',
  date: new Date(2026, 8, 13),
  eventType: 'km_10',
  name: 'Corrida do Tejo',
  time: '00:47:12',
  raceId: 'race-tejo',
})

/** A faster 10K, older, and nothing to do with the anchor. */
const older = makeEvent({
  id: 'older',
  date: new Date(2026, 2, 1),
  eventType: 'km_10',
  name: 'São Silvestre',
  time: '00:45:00',
  raceId: 'race-silvestre',
})

describe('racesPreparing', () => {
  it('names the race identities declared as preparing the anchor', () => {
    const items = [
      { raceId: 'race-tejo', servesRaceId: 'race-lisboa' },
      { raceId: 'race-sintra', servesRaceId: 'race-porto' },
      { servesRaceId: 'race-lisboa' },
    ]
    expect(racesPreparing('race-lisboa', items)).toEqual(['race-tejo'])
  })

  it('has nothing to name without an anchor identity', () => {
    expect(racesPreparing(undefined, [{ raceId: 'race-tejo', servesRaceId: 'race-lisboa' }])).toEqual(
      [],
    )
  })
})

describe('projectRaceTime', () => {
  it('reads the declared build-up, even when an older race was faster', () => {
    const projection = projectRaceTime(ANCHOR, [older, buildUp], ['race-tejo'], TODAY)!

    expect(projection.fromBuildUp).toBe(true)
    expect(projection.basedOn.event.id).toBe('build-up')
    expect(projection.fromRecentForm).toBe(true)
    // A 47:12 10K over a marathon, through the same equivalence the analysis uses.
    expect(projection.predictedSeconds).toBeGreaterThan(3 * 3600)
    expect(projection.predictedSeconds).toBeLessThan(4 * 3600)
    expect(projection.paceSeconds).toBeCloseTo(projection.predictedSeconds / 42.195, 5)
  })

  it('falls back to current form when no build-up was declared', () => {
    const projection = projectRaceTime(ANCHOR, [older, buildUp], [], TODAY)!

    expect(projection.fromBuildUp).toBe(false)
    // The predictor picks the strongest race in the window, not the latest.
    expect(projection.basedOn.event.id).toBe('older')
  })

  it('ignores a race run after the one being projected', () => {
    const after = makeEvent({
      id: 'after',
      date: new Date(2026, 10, 1),
      eventType: 'km_10',
      time: '00:40:00',
      raceId: 'race-tejo',
    })
    const projection = projectRaceTime(ANCHOR, [buildUp, after], ['race-tejo'], TODAY)!

    expect(projection.basedOn.event.id).toBe('build-up')
  })

  it('says the basis is old when it is more than a year back', () => {
    const stale = makeEvent({
      id: 'stale',
      date: new Date(2024, 5, 1),
      eventType: 'km_10',
      time: '00:47:12',
    })
    expect(projectRaceTime(ANCHOR, [stale], [], TODAY)!.fromRecentForm).toBe(false)
  })

  it('has nothing to say with no results at all', () => {
    expect(projectRaceTime(ANCHOR, [], [], TODAY)).toBeNull()
    const planned = makeEvent({ id: 'p', date: new Date(2026, 8, 20), eventType: 'km_10', status: 'planned' })
    expect(projectRaceTime(ANCHOR, [planned], [], TODAY)).toBeNull()
  })
})
