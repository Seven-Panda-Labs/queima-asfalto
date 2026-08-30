import { describe, expect, it } from 'vitest'
import type { TrackSplit } from '../domain/activityTrack'
import { splitExtremes } from './trackSplits'

function split(index: number, paceSecondsPerKm: number, partial = false): TrackSplit {
  return {
    index,
    distanceMeters: partial ? 954 : 1000,
    durationSeconds: paceSecondsPerKm,
    paceSecondsPerKm,
    partial,
  }
}

describe('splitExtremes', () => {
  it('marks the fastest and the slowest kilometre', () => {
    // The sample parkrun: 5:07, 5:13, 5:28, 5:21.
    expect(splitExtremes([split(1, 307), split(2, 313), split(3, 328), split(4, 321)])).toEqual({
      fastestIndex: 1,
      slowestIndex: 3,
    })
  })

  it('leaves the partial split out of the comparison', () => {
    // The partial is the slowest number here, but it is timed over 954 m.
    const extremes = splitExtremes([split(1, 307), split(2, 313), split(3, 340, true)])
    expect(extremes).toEqual({ fastestIndex: 1, slowestIndex: 2 })
  })

  it('marks nothing when there is only one full split', () => {
    expect(splitExtremes([split(1, 307), split(2, 340, true)])).toEqual({
      fastestIndex: null,
      slowestIndex: null,
    })
  })

  it('marks nothing when every kilometre was run at the same pace', () => {
    expect(splitExtremes([split(1, 300), split(2, 300)])).toEqual({
      fastestIndex: null,
      slowestIndex: null,
    })
  })

  it('has nothing to mark for an empty list', () => {
    expect(splitExtremes([])).toEqual({ fastestIndex: null, slowestIndex: null })
  })
})
