import { describe, expect, it } from 'vitest'
import { isKnownParkrun } from './parkrunEvent'

describe('isKnownParkrun', () => {
  it('counts an event linked by slug or by results platform', () => {
    expect(isKnownParkrun({ parkrunEventSlug: 'cardiff' })).toBe(true)
    expect(isKnownParkrun({ resultsPlatform: 'parkrun' })).toBe(true)
  })

  it('does not count an unlinked race', () => {
    expect(isKnownParkrun({})).toBe(false)
    expect(isKnownParkrun({ resultsPlatform: 'sporthive' })).toBe(false)
  })
})
