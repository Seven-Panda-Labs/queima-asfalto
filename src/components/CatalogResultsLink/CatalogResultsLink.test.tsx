import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Event } from '../../types/Event'
import { CatalogResultsLink } from './CatalogResultsLink'

const getRace = vi.fn()
const loadCatalogRace = vi.fn()
const updateEvent = vi.fn()

vi.mock('../../services/races', () => ({ getRace: (...args: unknown[]) => getRace(...args) }))
vi.mock('../../services/raceCatalog', () => ({
  loadCatalogRace: (...args: unknown[]) => loadCatalogRace(...args),
}))
vi.mock('../../services/events', () => ({
  updateEvent: (...args: unknown[]) => updateEvent(...args),
}))

const page = 'https://www.davengo.com/event/result/volvo-tierparklauf-2024/search'

function event(overrides: Partial<Event> = {}): Event {
  return {
    id: 'event-1',
    userId: 'u1',
    raceId: 'race-1',
    name: 'Tierparklauf',
    date: new Date('2024-09-08T09:00:00'),
    realDistance: 5,
    eventType: 'km_5',
    location: 'Berlin Tierpark',
    status: 'completed',
    createdAt: new Date('2024-09-09'),
    updatedAt: new Date('2024-09-09'),
    ...overrides,
  } as Event
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('CatalogResultsLink', () => {
  it('offers the page the catalog holds for the year this was run', async () => {
    getRace.mockResolvedValue({ id: 'race-1', catalogRaceId: 'de-berlin-tierparklauf-berlin' })
    loadCatalogRace.mockResolvedValue({
      editions: [
        { year: 2022, resultsUrl: 'https://old.example/2022' },
        { year: 2024, resultsUrl: page },
      ],
    })

    render(<CatalogResultsLink event={event()} onUsed={vi.fn()} />)

    // The host, because the URL itself is unreadable, and the 2024 one.
    const link = await screen.findByRole('link', { name: 'davengo.com' })
    expect(link).toHaveAttribute('href', page)
  })

  it('writes the link and the platform it detects', async () => {
    getRace.mockResolvedValue({ id: 'race-1', catalogRaceId: 'de-berlin-tierparklauf-berlin' })
    loadCatalogRace.mockResolvedValue({ editions: [{ year: 2024, resultsUrl: page }] })
    const onUsed = vi.fn()

    render(<CatalogResultsLink event={event()} onUsed={onUsed} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Usar este link' }))

    // The platform is what unlocks the automatic lookup.
    await waitFor(() =>
      expect(updateEvent).toHaveBeenCalledWith('event-1', {
        resultsUrl: page,
        resultsPlatform: 'davengo',
      }),
    )
    expect(onUsed).toHaveBeenCalled()
  })

  it('says nothing when the runner already has a link', () => {
    const { container } = render(
      <CatalogResultsLink event={event({ resultsUrl: 'https://mine.example' })} onUsed={vi.fn()} />,
    )

    expect(container).toBeEmptyDOMElement()
    // Their own link is never touched, so the chain is not even read.
    expect(getRace).not.toHaveBeenCalled()
  })

  it('says nothing about a year the catalog has no page for', async () => {
    getRace.mockResolvedValue({ id: 'race-1', catalogRaceId: 'de-berlin-tierparklauf-berlin' })
    loadCatalogRace.mockResolvedValue({ editions: [{ year: 2026, resultsUrl: page }] })

    const { container } = render(<CatalogResultsLink event={event()} onUsed={vi.fn()} />)

    await waitFor(() => expect(loadCatalogRace).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('says nothing on an event whose race is not in the catalog', async () => {
    getRace.mockResolvedValue({ id: 'race-1' })

    const { container } = render(<CatalogResultsLink event={event()} onUsed={vi.fn()} />)

    await waitFor(() => expect(getRace).toHaveBeenCalled())
    expect(loadCatalogRace).not.toHaveBeenCalled()
    expect(container).toBeEmptyDOMElement()
  })
})
