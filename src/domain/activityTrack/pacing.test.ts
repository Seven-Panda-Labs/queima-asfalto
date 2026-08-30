import { describe, expect, it } from 'vitest'
import type { TrackSplit } from './metrics'
import { computePacingDrift } from './pacing'

function splits(paces: number[], trailingPartial?: number): TrackSplit[] {
  const full = paces.map((pace, index) => ({
    index: index + 1,
    distanceMeters: 1000,
    durationSeconds: pace,
    paceSecondsPerKm: pace,
    partial: false,
  }))
  if (trailingPartial === undefined) return full
  return [
    ...full,
    {
      index: full.length + 1,
      distanceMeters: 540,
      durationSeconds: trailingPartial * 0.54,
      paceSecondsPerKm: trailingPartial,
      partial: true,
    },
  ]
}

describe('computePacingDrift', () => {
  it('reports how much slower the second half was', () => {
    // 5:00, 5:00 then 5:20, 5:20 is twenty seconds a kilometre slower.
    expect(computePacingDrift(splits([300, 300, 320, 320]))).toBe(20)
  })

  it('goes negative for a race that finished faster than it started', () => {
    expect(computePacingDrift(splits([320, 320, 300, 300]))).toBe(-20)
  })

  it('is zero for an evenly run race', () => {
    expect(computePacingDrift(splits([300, 300, 300, 300]))).toBe(0)
  })

  it('leaves the middle kilometre out of both halves', () => {
    // The 400 in the middle is ignored, so this is 300,300 against 320,320.
    expect(computePacingDrift(splits([300, 300, 400, 320, 320]))).toBe(20)
  })

  it('ignores the trailing partial split, whatever it claims', () => {
    const withPartial = computePacingDrift(splits([300, 300, 320, 320], 900))
    expect(withPartial).toBe(computePacingDrift(splits([300, 300, 320, 320])))
  })

  it('refuses a race too short to say anything', () => {
    expect(computePacingDrift(splits([300, 320]))).toBeNull()
    expect(computePacingDrift(splits([300, 300, 320], 400))).toBeNull()
    expect(computePacingDrift([])).toBeNull()
  })
})
