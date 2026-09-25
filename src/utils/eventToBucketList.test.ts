import { describe, expect, it } from 'vitest'
import type { Event } from '../types/Event'
import { canRecoverEventToBucketList, eventToBucketListItem } from './eventToBucketList'
import {
  bucketListItemHasDiscipline,
  normalizeBucketListDisciplines,
  parseDisciplinesCell,
  serializeDisciplinesCell,
} from './bucketListDisciplines'

function makeEvent(overrides: Partial<Event> = {}): Event {
  const now = new Date()
  return {
    id: 'event-1',
    userId: 'user-1',
    name: 'Test Marathon',
    date: now,
    realDistance: 42.2,
    eventType: 'km_42_2',
    location: 'Berlin',
    status: 'cancelled',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('eventToBucketListItem', () => {
  it('is a marker on the race the event already points at', () => {
    expect(eventToBucketListItem(makeEvent({ raceId: 'race-1', notes: 'Outra vez' }))).toEqual({
      raceId: 'race-1',
      notes: 'Outra vez',
    })
  })

  it('keeps the name for an event with no race identity, which has nothing to point at', () => {
    expect(eventToBucketListItem(makeEvent())).toEqual({
      name: 'Test Marathon',
      location: 'Berlin',
      notes: undefined,
    })
  })
})

describe('canRecoverEventToBucketList', () => {
  it('allows Cancelado and Faltou only', () => {
    expect(canRecoverEventToBucketList('cancelled')).toBe(true)
    expect(canRecoverEventToBucketList('missed')).toBe(true)
    expect(canRecoverEventToBucketList('confirmed')).toBe(false)
  })
})

describe('bucketListDisciplines', () => {
  it('reads canonical disciplines array', () => {
    expect(
      normalizeBucketListDisciplines({
        disciplines: ['km_5', 'km_10'],
      }),
    ).toEqual(['km_5', 'km_10'])
  })

  it('falls back to legacy eventType', () => {
    expect(
      normalizeBucketListDisciplines({
        eventType: 'km_21_1',
      }),
    ).toEqual(['km_21_1'])
  })

  it('parses and serializes discipline cells', () => {
    expect(parseDisciplinesCell('km_5, km_10')).toEqual(['km_5', 'km_10'])
    expect(serializeDisciplinesCell(['km_5', 'km_10'])).toBe('km_5,km_10')
  })

  it('checks discipline membership', () => {
    expect(bucketListItemHasDiscipline({ disciplines: ['km_5', 'km_10'] }, 'km_10')).toBe(true)
    expect(bucketListItemHasDiscipline({ disciplines: ['km_5'] }, 'km_10')).toBe(false)
  })
})
