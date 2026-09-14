import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readCologneTimingCalendar } from './cologneTiming'

const BASE = 'https://cologne-timing.de/veranstaltungen'

const races = readCologneTimingCalendar(
  readFileSync(resolve(import.meta.dirname, 'fixtures/cologne-timing-veranstaltungen.html'), 'utf8'),
  { country: 'DE', baseUrl: BASE },
)

describe('readCologneTimingCalendar', () => {
  it('reads the name, the day and the town of each race', () => {
    expect(races.find((race) => race.name === 'Förderturmlauf')).toMatchObject({
      startDate: '2026-09-17',
      city: 'Essen',
      country: 'DE',
      distancesKm: [],
      cancelled: false,
    })
  })

  it('links the race to its own site rather than to the calendar', () => {
    expect(races.find((race) => race.name === 'Förderturmlauf')?.sourceUrl).toBe(
      'https://foerderturmlauf.de/',
    )
  })

  it('takes the distance from the name where the name carries one', () => {
    expect(races.find((race) => race.name.includes('Westenergie'))?.distancesKm).toEqual([42.195])
  })

  it('leaves a race with no distance rather than guessing one', () => {
    // "37. Internationaler Bitburger 0,0%-Silvesterlauf": every number in it
    // is an edition, a brand or a percentage, and none of them is a race.
    expect(races.find((race) => race.name.includes('Silvesterlauf'))?.distancesKm).toEqual([])
  })

  it('keeps the accents the page publishes', () => {
    expect(races.some((race) => race.name === 'Rund um den Fühlinger See')).toBe(true)
    expect(races.find((race) => race.name === 'Rund um den Fühlinger See')?.city).toBe('Köln')
  })

  it('leaves out what the operator times but nobody races', () => {
    expect(races.some((race) => /hike/i.test(race.name))).toBe(false)
    expect(races.some((race) => /swim/i.test(race.name))).toBe(false)
  })

  it('leaves out the virtual edition, which has no town to be in', () => {
    expect(races.some((race) => /virtuell/i.test(race.name))).toBe(false)
    expect(races.some((race) => race.name.includes('ZeroHungerRun'))).toBe(false)
  })

  it('keeps a relay, which is a race people enter', () => {
    expect(races.some((race) => race.name.includes('Winterstaffel'))).toBe(true)
  })

  it('reads every race on the page and invents none', () => {
    expect(races).toHaveLength(5)
  })
})
