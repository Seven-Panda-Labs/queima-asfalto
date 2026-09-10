import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Event } from '../types/Event'

const updateEvent = vi.fn()
const listEvents = vi.fn()
const updateRace = vi.fn()
const findOrCreateRaceId = vi.fn()
const reportEditionDates = vi.fn()

vi.mock('./events', () => ({
  updateEvent: (...args: unknown[]) => updateEvent(...args),
  listEvents: (...args: unknown[]) => listEvents(...args),
}))
vi.mock('./races', () => ({
  updateRace: (...args: unknown[]) => updateRace(...args),
  findOrCreateRaceId: (...args: unknown[]) => findOrCreateRaceId(...args),
}))
vi.mock('./editionReports', () => ({
  reportEditionDates: (...args: unknown[]) => reportEditionDates(...args),
}))

const { identifyRaceInCatalog } = await import('./raceIdentity')

function event(overrides: Partial<Event> = {}): Event {
  return {
    id: 'event-2024',
    userId: 'u1',
    raceId: 'race-1',
    name: 'Tierparklauf',
    date: new Date('2024-09-08T09:00:00'),
    realDistance: 5,
    eventType: 'km_5',
    location: 'Berlin Tierpark',
    status: 'completed',
    resultsVerified: true,
    createdAt: new Date('2024-09-08'),
    updatedAt: new Date('2024-09-08'),
    ...overrides,
  } as Event
}

beforeEach(() => {
  vi.clearAllMocks()
  listEvents.mockResolvedValue([])
})

describe('identifyRaceInCatalog', () => {
  it('gives an event with no race one, and links both', async () => {
    findOrCreateRaceId.mockResolvedValue('race-new')

    await identifyRaceInCatalog('u1', event({ raceId: undefined }), 'de-berlin-tierparklauf-berlin')

    expect(updateRace).toHaveBeenCalledWith('race-new', {
      catalogRaceId: 'de-berlin-tierparklauf-berlin',
    })
    expect(updateEvent).toHaveBeenCalledWith('event-2024', { raceId: 'race-new' })
  })

  it('reports every edition this runner already has verified, not just this one', async () => {
    // The link is made years after the results were saved, which is why the
    // report at save time never fired: there was no catalog id yet.
    listEvents.mockResolvedValue([
      event({ id: 'a', date: new Date('2022-09-11T09:00:00') }),
      event({ id: 'b', date: new Date('2024-09-08T09:00:00') }),
    ])

    await identifyRaceInCatalog('u1', event(), 'de-berlin-tierparklauf-berlin')

    expect(reportEditionDates).toHaveBeenCalledWith('u1', 'de-berlin-tierparklauf-berlin', [
      new Date('2022-09-11T09:00:00'),
      new Date('2024-09-08T09:00:00'),
    ])
  })

  it('leaves out a result nobody verified, and another race s editions', async () => {
    listEvents.mockResolvedValue([
      event({ id: 'unverified', resultsVerified: false }),
      event({ id: 'other-race', raceId: 'race-2' }),
      event({ id: 'good' }),
    ])

    await identifyRaceInCatalog('u1', event(), 'de-berlin-tierparklauf-berlin')

    const [, , days] = reportEditionDates.mock.calls[0] as [string, string, Date[]]
    expect(days).toHaveLength(1)
  })

  it('says nothing when there is nothing verified to report', async () => {
    listEvents.mockResolvedValue([event({ resultsVerified: false })])

    await identifyRaceInCatalog('u1', event(), 'de-berlin-tierparklauf-berlin')

    expect(reportEditionDates).not.toHaveBeenCalled()
  })

  it('still links when the reports cannot be read', async () => {
    listEvents.mockRejectedValue(new Error('offline'))

    await identifyRaceInCatalog('u1', event(), 'de-berlin-tierparklauf-berlin')

    // The link is what the runner asked for; the contribution is a side effect.
    expect(updateRace).toHaveBeenCalledWith('race-1', {
      catalogRaceId: 'de-berlin-tierparklauf-berlin',
    })
  })
})
