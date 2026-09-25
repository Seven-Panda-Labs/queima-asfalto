import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RaceCatalogEntry } from '../../../shared/raceCatalog'
import type { BucketListItem } from '../../types/BucketListItem'
import type { Race } from '../../types/Race'
import { LinkWishesToCatalog } from './LinkWishesToCatalog'

const searchRaceCatalog = vi.fn()
const identifyWishInCatalog = vi.fn()

vi.mock('../../services/raceCatalog', () => ({
  searchRaceCatalog: (...args: unknown[]) => searchRaceCatalog(...args),
}))
vi.mock('../../services/raceIdentity', () => ({
  identifyWishInCatalog: (...args: unknown[]) => identifyWishInCatalog(...args),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function wish(overrides: Partial<BucketListItem> = {}): BucketListItem {
  return {
    id: 'wish-1',
    userId: 'u1',
    name: 'Maratona do Porto',
    location: 'Porto, Portugal',
    realDistance: 42.195,
    disciplines: ['km_42_2'],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

function race(overrides: Partial<Race> = {}): Race {
  return {
    id: 'race-1',
    userId: 'u1',
    name: 'Maratona do Porto',
    location: 'Porto',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

function entry(overrides: Partial<RaceCatalogEntry> = {}): RaceCatalogEntry {
  return {
    id: 'pt-porto-maratona-do-porto',
    name: 'Maratona do Porto',
    country: 'PT',
    city: 'Porto',
    disciplines: ['km_42_2'],
    entryMethod: 'first_come',
    review: 'unreviewed',
    source: 'acorrer.pt',
    ...overrides,
  }
}

describe('LinkWishesToCatalog', () => {
  it('says nothing when every wish already knows which race it is', () => {
    const { container } = render(
      <LinkWishesToCatalog
        items={[wish({ raceId: 'race-1' })]}
        races={[race({ catalogRaceId: 'pt-porto-maratona-do-porto' })]}
        userId="u1"
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('offers the wishes that do not, and links the one the runner picks', async () => {
    searchRaceCatalog.mockResolvedValue([entry()])
    render(<LinkWishesToCatalog items={[wish()]} races={[]} userId="u1" />)

    fireEvent.click(screen.getByRole('button', { name: /1 desejo ainda não diz/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Que prova é?' }))
    fireEvent.click(await screen.findByRole('button', { name: 'É esta' }))

    await waitFor(() =>
      expect(identifyWishInCatalog).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({ id: 'wish-1' }),
        'pt-porto-maratona-do-porto',
      ),
    )
    // Answered, so it leaves the list before the wish arrives again.
    await waitFor(() => expect(screen.queryByText('Maratona do Porto')).not.toBeInTheDocument())
  })

  it('puts the entry that runs this distance first', async () => {
    // Two names that agree on every word but one. The wish knows which.
    searchRaceCatalog.mockResolvedValue([
      entry({ id: 'pt-porto-meia-maratona', name: 'Meia Maratona do Porto', disciplines: ['km_21_1'] }),
      entry(),
    ])
    render(<LinkWishesToCatalog items={[wish()]} races={[]} userId="u1" />)

    fireEvent.click(screen.getByRole('button', { name: /1 desejo ainda não diz/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Que prova é?' }))

    // Both candidates first: a name query resolves on the wish's own name
    // alone, which is true before either of them has rendered.
    await screen.findAllByRole('button', { name: 'É esta' })
    const names = screen.getAllByText(/Maratona do Porto/).map((node) => node.textContent)

    // The wish's own name, then the marathon, then the half.
    expect(names).toEqual(['Maratona do Porto', 'Maratona do Porto', 'Meia Maratona do Porto'])
  })

  it('says so when the catalog has nothing by that name', async () => {
    searchRaceCatalog.mockResolvedValue([])
    render(<LinkWishesToCatalog items={[wish()]} races={[]} userId="u1" />)

    fireEvent.click(screen.getByRole('button', { name: /1 desejo ainda não diz/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Que prova é?' }))

    expect(await screen.findByText(/Nada no catálogo com este nome/)).toBeInTheDocument()
  })
})
