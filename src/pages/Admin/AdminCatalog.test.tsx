import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RaceCatalogEntry } from '../../../shared/raceCatalog'
import { AdminCatalog } from './AdminCatalog'

const listStaleForAdmin = vi.fn()
const searchCatalogForAdmin = vi.fn()
const unmergeCatalogRace = vi.fn()

vi.mock('../../services/adminRaceCatalog', () => ({
  listStaleForAdmin: (...args: unknown[]) => listStaleForAdmin(...args),
  searchCatalogForAdmin: (...args: unknown[]) => searchCatalogForAdmin(...args),
  loadDuplicateQueue: () => Promise.resolve([]),
  mergeCatalogRaces: vi.fn(),
  separateCatalogRaces: vi.fn(),
  unmergeCatalogRace: (...args: unknown[]) => unmergeCatalogRace(...args),
}))

vi.mock('../../services/catalogProposals', () => ({
  loadPendingProposals: () => Promise.resolve([]),
}))
vi.mock('../../services/duplicateVotes', () => ({
  loadDuplicateVoteTallies: () => Promise.resolve(new Map()),
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'admin' } }),
}))

vi.mock('../../components/PageShell/PageShell', () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('react-router-dom', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>,
  NavLink: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>,
}))

function race(overrides: Partial<RaceCatalogEntry> & Pick<RaceCatalogEntry, 'id'>): RaceCatalogEntry {
  return {
    name: overrides.id,
    country: 'PT',
    city: 'Porto',
    disciplines: ['km_42_2'],
    entryMethod: 'lottery',
    review: 'reviewed',
    source: 'test',
    ...overrides,
  }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AdminCatalog, which no longer downloads the catalog', () => {
  it('opens on the work, a page at a time', async () => {
    listStaleForAdmin.mockResolvedValue({
      races: [race({ id: 'out-of-editions' })],
      nextCursor: '2026-01-01',
    })
    render(<AdminCatalog />)

    expect(await screen.findByText('out-of-editions')).toBeInTheDocument()
    // Fifty at a time, and never the whole collection.
    expect(listStaleForAdmin).toHaveBeenCalledWith(50, undefined)
  })

  it('asks for the next page from where the last one ended', async () => {
    listStaleForAdmin.mockResolvedValue({
      races: [race({ id: 'out-of-editions' })],
      nextCursor: '2026-01-01',
    })
    render(<AdminCatalog />)

    fireEvent.click(await screen.findByRole('button', { name: 'Mostrar mais' }))

    await waitFor(() => expect(listStaleForAdmin).toHaveBeenCalledWith(50, '2026-01-01'))
  })

  it('offers no next page when the queue ends', async () => {
    listStaleForAdmin.mockResolvedValue({ races: [race({ id: 'only-one' })] })
    render(<AdminCatalog />)

    await screen.findByText('only-one')
    expect(screen.queryByRole('button', { name: 'Mostrar mais' })).not.toBeInTheDocument()
  })

  it('searches the whole catalog only when asked', async () => {
    listStaleForAdmin.mockResolvedValue({ races: [] })
    searchCatalogForAdmin.mockResolvedValue([race({ id: 'found-race' })])
    render(<AdminCatalog />)

    await screen.findByText(/Nada à espera/)
    // The other flow: nothing is searched until an operator asks.
    expect(searchCatalogForAdmin).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Procurar pelo nome'), {
      target: { value: 'Teltowkanal' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Procurar pelo nome' }))

    expect(await screen.findByText('found-race')).toBeInTheDocument()
    expect(searchCatalogForAdmin).toHaveBeenCalledWith('Teltowkanal', 50)
  })

  it('says so when nothing needs a new season', async () => {
    listStaleForAdmin.mockResolvedValue({ races: [] })
    render(<AdminCatalog />)

    expect(await screen.findByText(/Nada à espera/)).toBeInTheDocument()
  })

  it('says so when the load fails', async () => {
    listStaleForAdmin.mockRejectedValue(new Error('denied'))
    render(<AdminCatalog />)

    expect(await screen.findByText(/Não foi possível carregar/)).toBeInTheDocument()
  })
})
