import { describe, expect, it } from 'vitest'
import type { BucketListItem } from '../types/BucketListItem'
import type { Race } from '../types/Race'
import { wishPins, wishSubject } from './wishSubject'

const NOW = new Date('2026-09-25')

function wish(overrides: Partial<BucketListItem> = {}): BucketListItem {
  return {
    id: 'wish-1',
    userId: 'u1',
    name: 'Maratona do Porto',
    location: 'Porto',
    realDistance: 42.195,
    disciplines: ['km_42_2'],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

function race(overrides: Partial<Race> = {}): Race {
  return {
    id: 'race-1',
    userId: 'u1',
    name: 'Maratona do Porto EDP',
    location: 'Porto, Portugal',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

describe('wishSubject', () => {
  it('is the race, so the two can never disagree', () => {
    const subject = wishSubject(wish({ raceId: 'race-1' }), [race()])

    expect(subject.name).toBe('Maratona do Porto EDP')
    expect(subject.location).toBe('Porto, Portugal')
  })

  it('keeps the place the race knows, and the cached one when it knows none', () => {
    expect(
      wishSubject(wish({ raceId: 'race-1', locationLat: 41.1, locationLng: -8.6 }), [race()]),
    ).toMatchObject({ locationLat: 41.1, locationLng: -8.6 })

    expect(
      wishSubject(wish({ raceId: 'race-1', locationLat: 41.1 }), [
        race({ locationLat: 41.2, locationLng: -8.7 }),
      ]),
    ).toMatchObject({ locationLat: 41.2 })
  })

  it('falls back to what a wish written before the marker remembers', () => {
    const subject = wishSubject(wish(), [race()])

    expect(subject.name).toBe('Maratona do Porto')
    expect(subject.location).toBe('Porto')
  })
})

describe('wishPins', () => {
  it('maps a wish by the place its race knows', () => {
    const { mapped, unmapped } = wishPins(
      [wish({ raceId: 'race-1' })],
      [race({ locationLat: 41.15, locationLng: -8.61 })],
    )

    expect(mapped).toEqual([
      expect.objectContaining({ id: 'wish-1', name: 'Maratona do Porto EDP', locationLat: 41.15 }),
    ])
    expect(unmapped).toEqual([])
  })

  it('falls back to the place an old wish carries', () => {
    const { mapped } = wishPins([wish({ locationLat: 41.1, locationLng: -8.6 })], [])

    expect(mapped[0]).toMatchObject({ name: 'Maratona do Porto', locationLat: 41.1 })
  })

  it('lists what it cannot place rather than dropping it', () => {
    const { mapped, unmapped } = wishPins([wish({ raceId: 'race-1' })], [race()])

    expect(mapped).toEqual([])
    expect(unmapped).toEqual([{ id: 'wish-1', name: 'Maratona do Porto EDP', location: 'Porto, Portugal' }])
  })
})
