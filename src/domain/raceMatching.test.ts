import { describe, expect, it } from 'vitest'
import { findRaceByName } from './raceMatching'

const races = [
  { id: 'race-porto', name: 'Maratona do Porto' },
  { id: 'race-hasenheide', name: 'Hasenheide Parkrun' },
]

describe('findRaceByName', () => {
  it('matches the same race typed differently', () => {
    expect(findRaceByName(races, 'maratona do porto')?.id).toBe('race-porto')
    expect(findRaceByName(races, 'Parkrun Hasenheide')?.id).toBe('race-hasenheide')
    expect(findRaceByName(races, 'Hasenheide Parkrun 2023')?.id).toBe('race-hasenheide')
  })

  it('does not match a different race that reads alike', () => {
    expect(findRaceByName(races, 'Meia Maratona do Porto')).toBeNull()
  })

  it('returns null for a name with nothing in it', () => {
    expect(findRaceByName(races, '   ')).toBeNull()
    expect(findRaceByName([], 'Maratona do Porto')).toBeNull()
  })
})
