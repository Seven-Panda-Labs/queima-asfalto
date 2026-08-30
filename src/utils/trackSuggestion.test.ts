import { describe, expect, it } from 'vitest'
import {
  buildTrackTimeSuggestion,
  distanceDeviationPercent,
  formatSecondsAsTime,
} from './trackSuggestion'

describe('formatSecondsAsTime', () => {
  it('produces the hh:mm:ss the event form stores', () => {
    expect(formatSecondsAsTime(1580)).toBe('00:26:20')
    expect(formatSecondsAsTime(3661)).toBe('01:01:01')
    expect(formatSecondsAsTime(0)).toBe('00:00:00')
  })

  it('rounds a fractional elapsed time to the nearest second', () => {
    expect(formatSecondsAsTime(1580.4)).toBe('00:26:20')
    expect(formatSecondsAsTime(1580.6)).toBe('00:26:21')
  })
})

describe('buildTrackTimeSuggestion', () => {
  it('offers the measured time when the event has none', () => {
    expect(buildTrackTimeSuggestion({ elapsedSeconds: 1580 }, undefined)).toEqual({
      state: 'empty',
      suggestedTime: '00:26:20',
    })
  })

  it('treats an unparseable existing time as no time at all', () => {
    expect(buildTrackTimeSuggestion({ elapsedSeconds: 1580 }, 'nonsense').state).toBe('empty')
  })

  it('says nothing needs deciding when the two agree', () => {
    expect(buildTrackTimeSuggestion({ elapsedSeconds: 1580 }, '00:26:20')).toEqual({
      state: 'matches',
      suggestedTime: '00:26:20',
    })
  })

  it('reports a difference rather than resolving it', () => {
    // The official result stays: the editor only offers the choice.
    expect(buildTrackTimeSuggestion({ elapsedSeconds: 1580 }, '00:26:13')).toEqual({
      state: 'differs',
      suggestedTime: '00:26:20',
      currentTime: '00:26:13',
      deltaSeconds: 7,
    })
  })

  it('signs the difference against the recorded time', () => {
    const suggestion = buildTrackTimeSuggestion({ elapsedSeconds: 1580 }, '00:26:30')
    expect(suggestion.state === 'differs' && suggestion.deltaSeconds).toBe(-10)
  })
})

describe('distanceDeviationPercent', () => {
  it('reports the small deviation a normal GPS track has', () => {
    expect(distanceDeviationPercent({ distanceMeters: 4954 }, 5)).toBeCloseTo(-0.92, 2)
  })

  it('reports a deviation large enough to mean the wrong file', () => {
    expect(distanceDeviationPercent({ distanceMeters: 10000 }, 5)).toBeCloseTo(100, 2)
  })

  it('has nothing to say without an official distance', () => {
    expect(distanceDeviationPercent({ distanceMeters: 4954 }, 0)).toBeNull()
  })
})
