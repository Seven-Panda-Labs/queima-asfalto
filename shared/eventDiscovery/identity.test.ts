import { describe, expect, it } from 'vitest'
import { catalogId, raceKey, slugify, stripEdition } from './identity'
import type { DiscoveredRace } from './types'

function race(overrides: Partial<DiscoveredRace> = {}): DiscoveredRace {
  return {
    sourceUrl: 'https://example.invalid/e',
    name: 'XI Run Castle',
    startDate: '2026-09-06T09:00:00+01:00',
    city: 'Montemor-o-Novo',
    country: 'PT',
    distancesKm: [10],
    cancelled: false,
    ...overrides,
  }
}

describe('stripEdition', () => {
  it('drops a roman numeral edition', () => {
    expect(stripEdition('XI Run Castle')).toBe('Run Castle')
    expect(stripEdition('IV Trail Entre o Dão e o Mondego')).toBe('Trail Entre o Dão e o Mondego')
  })

  it('drops a numbered edition however it is written', () => {
    expect(stripEdition('4 Trail do Zêzere')).toBe('Trail do Zêzere')
    expect(stripEdition('12ª Meia de Cascais')).toBe('Meia de Cascais')
    expect(stripEdition('3. Berlin Halbmarathon')).toBe('Berlin Halbmarathon')
  })

  it('leaves a name that only looks like one alone', () => {
    expect(stripEdition('Maratona de Lisboa')).toBe('Maratona de Lisboa')
    expect(stripEdition('Mil Metros do Porto')).toBe('Mil Metros do Porto')
    expect(stripEdition('10K de Aveiro')).toBe('10K de Aveiro')
    expect(stripEdition('Vila do Conde Night Run')).toBe('Vila do Conde Night Run')
  })
})

describe('slugify', () => {
  it('strips accents and punctuation', () => {
    expect(slugify('Trail Entre o Dão e o Mondego')).toBe('trail-entre-o-dao-e-o-mondego')
  })
})

describe('raceKey', () => {
  it('matches the same race listed under different editions of its name', () => {
    expect(raceKey(race({ name: 'XI Run Castle' }))).toBe(
      raceKey(race({ name: '11ª Run Castle' })),
    )
  })

  it('keeps a race in another country apart', () => {
    expect(raceKey(race({ country: 'ES' }))).not.toBe(raceKey(race()))
  })

  it('keeps next year apart, and the day it moved to', () => {
    expect(raceKey(race({ startDate: '2027-09-05' }))).not.toBe(raceKey(race()))
  })
})

describe('catalogId', () => {
  it('is the same id next edition, which is what races point at', () => {
    expect(catalogId(race({ name: 'XI Run Castle' }))).toBe('pt-montemor-o-novo-run-castle')
    expect(catalogId(race({ name: 'XII Run Castle', startDate: '2027-09-05' }))).toBe(
      'pt-montemor-o-novo-run-castle',
    )
  })

  it('survives a listing with no city', () => {
    expect(catalogId(race({ city: undefined }))).toBe('pt-run-castle')
  })
})
