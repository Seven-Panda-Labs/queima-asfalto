import { describe, expect, it } from 'vitest'
import type { BucketListItem } from '../types/BucketListItem'
import type { Event } from '../types/Event'
import type { Race } from '../types/Race'
import type { RaceEntry } from '../types/RaceEntry'
import { buildSeasonBoard } from './seasonBoard'

const TODAY = new Date('2026-09-02')

function race(overrides: Partial<Race> & Pick<Race, 'id' | 'name'>): Race {
  return {
    userId: 'u1',
    location: 'Lisboa',
    createdAt: TODAY,
    updatedAt: TODAY,
    ...overrides,
  }
}

function event(overrides: Partial<Event> & Pick<Event, 'id' | 'date' | 'raceId'>): Event {
  return {
    userId: 'u1',
    name: 'Prova',
    realDistance: 42.195,
    eventType: 'km_42_2',
    location: 'Lisboa',
    status: 'confirmed',
    createdAt: TODAY,
    updatedAt: TODAY,
    ...overrides,
  }
}

function entry(overrides: Partial<RaceEntry> & Pick<RaceEntry, 'id' | 'raceId' | 'year'>): RaceEntry {
  return {
    userId: 'u1',
    raceDateConfirmed: true,
    entryMethod: 'unknown',
    entryStatus: 'watching',
    createdAt: TODAY,
    updatedAt: TODAY,
    ...overrides,
  }
}

function item(overrides: Partial<BucketListItem> & Pick<BucketListItem, 'id'>): BucketListItem {
  return {
    userId: 'u1',
    name: 'Desejo',
    location: 'Lisboa',
    realDistance: 21.0975,
    disciplines: ['km_21_1'],
    createdAt: TODAY,
    updatedAt: TODAY,
    ...overrides,
  }
}

describe('buildSeasonBoard', () => {
  const anchor = race({ id: 'race-lisboa', name: 'Maratona de Lisboa', anchorYears: [2026] })

  it('reads a race that exists only on the calendar', () => {
    // The case the wish list could never answer: no bucket list item at all.
    const board = buildSeasonBoard({
      races: [anchor],
      entries: [],
      events: [event({ id: 'e1', raceId: 'race-lisboa', date: new Date('2026-11-08') })],
      items: [],
      today: TODAY,
    })

    expect(board.races.map((race) => race.id)).toEqual(['race-lisboa'])
    expect(board.races[0]!.isAnchor).toBe(true)
    expect(board.byRaceId.get('race-lisboa')!.window).toBeDefined()
  })

  it('warns a scheduled build-up that lands in the anchor taper', () => {
    const board = buildSeasonBoard({
      races: [
        anchor,
        race({ id: 'race-oeiras', name: 'São Silvestre', servesRaceId: 'race-lisboa' }),
      ],
      entries: [],
      events: [
        event({ id: 'e1', raceId: 'race-lisboa', date: new Date('2026-11-08') }),
        // Five days before the anchor, and on the calendar rather than on a wish.
        event({ id: 'e2', raceId: 'race-oeiras', date: new Date('2026-11-03'), realDistance: 5 }),
      ],
      items: [],
      today: TODAY,
    })

    expect(board.byRaceId.get('race-oeiras')!.warnings.map((w) => w.rule)).toContain('taper_clash')
  })

  it('says which anchor a race prepares, and how far ahead it sits', () => {
    const board = buildSeasonBoard({
      races: [
        anchor,
        race({ id: 'race-cascais', name: 'Meia de Cascais', role: 'test', servesRaceId: 'race-lisboa' }),
      ],
      entries: [
        entry({
          id: 'x1',
          raceId: 'race-lisboa',
          year: 2026,
          raceDate: new Date('2026-11-08'),
          discipline: 'km_42_2',
        }),
        entry({ id: 'x2', raceId: 'race-cascais', year: 2026, raceDate: new Date('2026-10-18') }),
      ],
      events: [],
      items: [item({ id: 'i2', raceId: 'race-cascais' })],
      today: TODAY,
    })

    const serves = board.byRaceId.get('race-cascais')!.serves!
    expect(serves.name).toBe('Maratona de Lisboa')
    expect(serves.weeksBefore).toBeCloseTo(3, 1)
    expect(board.byRaceId.get('race-lisboa')!.serving).toBe(1)
  })

  it('takes a distance from the entry discipline when nothing else knows one', () => {
    const board = buildSeasonBoard({
      races: [race({ id: 'race-only-entry', name: 'Só inscrição' })],
      entries: [
        entry({
          id: 'z1',
          raceId: 'race-only-entry',
          year: 2027,
          raceDate: new Date('2027-03-07'),
          discipline: 'km_21_1',
        }),
      ],
      events: [],
      items: [],
      today: TODAY,
    })

    expect(board.races[0]!.distanceKm).toBeCloseTo(21.0975, 4)
  })

  it('takes the distance from the event over the wish, and needs one of them', () => {
    const board = buildSeasonBoard({
      races: [race({ id: 'race-x', name: 'Prova X' }), race({ id: 'race-y', name: 'Sem distância' })],
      entries: [entry({ id: 'y1', raceId: 'race-y', year: 2026, raceDate: new Date('2026-10-01') })],
      events: [event({ id: 'e1', raceId: 'race-x', date: new Date('2026-10-01'), realDistance: 10 })],
      items: [item({ id: 'i1', raceId: 'race-x', realDistance: 21.0975 })],
      today: TODAY,
    })

    expect(board.races.find((race) => race.id === 'race-x')!.distanceKm).toBe(10)
    // A race nobody gave a distance cannot be measured against an anchor.
    expect(board.races.map((race) => race.id)).not.toContain('race-y')
  })

  it('leaves out a race nobody has planned', () => {
    const board = buildSeasonBoard({
      races: [anchor],
      entries: [],
      events: [],
      items: [item({ id: 'i1', raceId: 'race-lisboa' })],
      today: TODAY,
    })
    expect(board.races).toEqual([])
  })

  it('drops the planning of an anchor that has been run', () => {
    const board = buildSeasonBoard({
      races: [race({ id: 'race-porto', name: 'Maratona do Porto', anchorYears: [2026] })],
      entries: [],
      events: [event({ id: 'e1', raceId: 'race-porto', date: new Date('2026-05-10') })],
      items: [],
      today: TODAY,
    })

    const annotation = board.byRaceId.get('race-porto')!
    expect(annotation.window).toBeUndefined()
    expect(annotation.serving).toBe(0)
  })

  it('flags what was serving an anchor that failed', () => {
    const board = buildSeasonBoard({
      races: [
        race({ id: 'race-porto', name: 'Maratona do Porto', anchorYears: [2026] }),
        race({ id: 'race-cascais', name: 'Meia de Cascais', servesRaceId: 'race-porto' }),
      ],
      entries: [],
      events: [
        event({ id: 'e1', raceId: 'race-porto', date: new Date('2026-05-10'), status: 'completed', outcomeReason: 'dnf' }),
        event({ id: 'e2', raceId: 'race-cascais', date: new Date('2027-01-10'), realDistance: 21.0975 }),
      ],
      items: [],
      today: TODAY,
    })

    expect(board.byRaceId.get('race-cascais')!.warnings.map((w) => w.rule)).toContain(
      'anchor_failed',
    )
  })
})
