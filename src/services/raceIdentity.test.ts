import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Event } from '../types/Event'

const updateEvent = vi.fn()
const listEvents = vi.fn()
const updateRace = vi.fn()
const findOrCreateRaceId = vi.fn()
const reportEditionDates = vi.fn()
const proposeCatalogRace = vi.fn()

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
vi.mock('./catalogProposals', () => ({
  proposeCatalogRace: (...args: unknown[]) => proposeCatalogRace(...args),
}))

const { identifyRaceInCatalog, proposeRaceForEvent } = await import('./raceIdentity')

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
      { date: new Date('2022-09-11T09:00:00'), resultsUrl: undefined },
      { date: new Date('2024-09-08T09:00:00'), resultsUrl: undefined },
    ])
  })

  it('leaves out a result nobody verified, and another race s editions', async () => {
    listEvents.mockResolvedValue([
      event({ id: 'unverified', resultsVerified: false }),
      event({ id: 'other-race', raceId: 'race-2' }),
      event({ id: 'good' }),
    ])

    await identifyRaceInCatalog('u1', event(), 'de-berlin-tierparklauf-berlin')

    const [, , ran] = reportEditionDates.mock.calls[0] as [string, string, unknown[]]
    expect(ran).toHaveLength(1)
  })

  it('sends the results page along, which is the edition s and not the runner s', async () => {
    listEvents.mockResolvedValue([
      event({
        resultsUrl:
          'https://www.davengo.com/event/result/volvo-tierparklauf-2024/search?term=neves',
      }),
    ])

    await identifyRaceInCatalog('u1', event(), 'de-berlin-tierparklauf-berlin')

    // Raw here, and stripped of the surname by the report itself: this is what
    // the event holds.
    expect(reportEditionDates).toHaveBeenCalledWith('u1', 'de-berlin-tierparklauf-berlin', [
      {
        date: new Date('2024-09-08T09:00:00'),
        resultsUrl:
          'https://www.davengo.com/event/result/volvo-tierparklauf-2024/search?term=neves',
      },
    ])
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

describe('proposeRaceForEvent', () => {
  it('carries the race, so the job can link what it creates', async () => {
    // Measured after the first five proposals were applied: five entries
    // created, no race pointing at any of them, not one report.
    await proposeRaceForEvent('u1', event(), { city: 'Berlin', country: 'DE' })

    expect(proposeCatalogRace).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        name: 'Tierparklauf',
        city: 'Berlin',
        country: 'DE',
        raceDate: '2024-09-08',
        disciplines: ['km_5'],
        raceId: 'race-1',
      }),
    )
  })

  it('gives an event with no race one, and says so on the event', async () => {
    findOrCreateRaceId.mockResolvedValue('race-new')

    await proposeRaceForEvent('u1', event({ raceId: undefined }), { city: 'Berlin', country: 'DE' })

    expect(proposeCatalogRace).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ raceId: 'race-new' }),
    )
    expect(updateEvent).toHaveBeenCalledWith('event-2024', { raceId: 'race-new' })
  })

  it('carries the results page, stripped of what named the runner', async () => {
    await proposeRaceForEvent(
      'u1',
      event({
        resultsUrl:
          'https://www.davengo.com/event/result/volvo-tierparklauf-2024/search?term=neves',
      }),
      { city: 'Berlin', country: 'DE' },
    )

    // Nothing else can carry it: a report cannot name an entry that does not
    // exist yet.
    expect(proposeCatalogRace).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        resultsUrl: 'https://www.davengo.com/event/result/volvo-tierparklauf-2024/search',
      }),
    )
  })

  it('leaves out a results page nobody verified', async () => {
    await proposeRaceForEvent(
      'u1',
      event({ resultsVerified: false, resultsUrl: 'https://timing.example/results' }),
      { city: 'Berlin', country: 'DE' },
    )

    const [, race] = proposeCatalogRace.mock.calls[0] as [string, Record<string, unknown>]
    expect(race.resultsUrl).toBeUndefined()
  })
})
