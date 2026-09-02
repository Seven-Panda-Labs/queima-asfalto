import { describe, expect, it } from 'vitest'
import {
  anchorRaceIds,
  anyAnchorRaceIds,
  isAnchorFor,
  MAX_ANCHOR_YEARS,
  parseAnchorYears,
  toggleAnchorYear,
} from './seasonAnchors'

describe('isAnchorFor', () => {
  it('is a fact about a season, not about the race', () => {
    const race = { id: 'berlin', anchorYears: [2026] }
    expect(isAnchorFor(race, 2026)).toBe(true)
    expect(isAnchorFor(race, 2027)).toBe(false)
  })

  it('says no for a race that was never an anchor', () => {
    expect(isAnchorFor({ id: 'sintra' }, 2026)).toBe(false)
  })
})

describe('anchorRaceIds', () => {
  const races = [
    { id: 'lisboa', anchorYears: [2026, 2027] },
    { id: 'porto', anchorYears: [2026] },
    { id: 'sintra' },
  ]

  it('answers per season', () => {
    expect([...anchorRaceIds(races, 2026)]).toEqual(['lisboa', 'porto'])
    expect([...anchorRaceIds(races, 2027)]).toEqual(['lisboa'])
  })

  it('answers for any season, which is what a wish with no year needs', () => {
    expect([...anyAnchorRaceIds(races)]).toEqual(['lisboa', 'porto'])
  })
})

describe('toggleAnchorYear', () => {
  it('marks and unmarks one season, leaving the others', () => {
    expect(toggleAnchorYear([2026], 2027, true)).toEqual([2026, 2027])
    expect(toggleAnchorYear([2026, 2027], 2026, false)).toEqual([2027])
  })

  it('does not care how often it is clicked', () => {
    expect(toggleAnchorYear([2026], 2026, true)).toEqual([2026])
    expect(toggleAnchorYear(undefined, 2026, false)).toEqual([])
  })

  it('keeps the list sorted whatever order they arrived in', () => {
    expect(toggleAnchorYear([2027, 2025], 2026, true)).toEqual([2025, 2026, 2027])
  })

  it('keeps the most recent seasons when it hits the cap', () => {
    const many = Array.from({ length: MAX_ANCHOR_YEARS + 2 }, (_, index) => 2020 + index)
    const capped = toggleAnchorYear(many, 2040, true)
    expect(capped).toHaveLength(MAX_ANCHOR_YEARS)
    expect(capped.at(-1)).toBe(2040)
  })
})

describe('parseAnchorYears', () => {
  it('trusts only whole numbers', () => {
    expect(parseAnchorYears([2026, '2027', 2027.5, null, 2025])).toEqual([2025, 2026])
  })

  it('has nothing for a document that never carried the field', () => {
    expect(parseAnchorYears(undefined)).toBeUndefined()
    expect(parseAnchorYears([])).toBeUndefined()
    expect(parseAnchorYears('2026')).toBeUndefined()
  })
})
