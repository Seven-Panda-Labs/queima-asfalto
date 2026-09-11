import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RaceCatalogEntry } from '../../../shared/raceCatalog'
import { AdminCatalog } from './AdminCatalog'

const listStaleForAdmin = vi.fn()
const searchCatalogForAdmin = vi.fn()
const unmergeCatalogRace = vi.fn()
const mergeCatalogRaces = vi.fn()

vi.mock('../../services/adminRaceCatalog', () => ({
  listStaleForAdmin: (...args: unknown[]) => listStaleForAdmin(...args),
  searchCatalogForAdmin: (...args: unknown[]) => searchCatalogForAdmin(...args),
  loadDuplicateQueue: () => Promise.resolve([]),
  mergeCatalogRaces: (...args: unknown[]) => mergeCatalogRaces(...args),
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

describe('a row that is a copy', () => {
  it('reads as the quieter of the two, so the answer is the one that is not', async () => {
    // Four S25 rows side by side, one of them the catalog's answer and three
    // of them not, told apart only by reading the button on the right.
    listStaleForAdmin.mockResolvedValue({
      races: [
        race({ id: 'de-berlin-s25-berlin', name: 'S25 Berlin' }),
        race({
          id: 'de-berlin-s-25-berlin',
          name: 'S 25 Berlin 2027',
          duplicateOfCatalogRaceId: 'de-berlin-s25-berlin',
        }),
      ],
      nextCursor: undefined,
    })
    render(<AdminCatalog />)

    await screen.findByText('S 25 Berlin 2027')
    const rows = screen.getAllByRole('listitem')
    const visible = rows.find((row) => row.textContent?.includes('S25 Berlin'))!
    const copy = rows.find((row) => row.textContent?.includes('S 25 Berlin 2027'))!

    expect(copy).toHaveAttribute('data-merged', 'true')
    expect(visible).not.toHaveAttribute('data-merged')
  })
})

describe('the official page', () => {
  it('opens straight from the list, since that is where the work is', async () => {
    listStaleForAdmin.mockResolvedValue({
      races: [
        race({
          id: 'de-falkensee-lauf-der-sympathie',
          name: 'Lauf der Sympathie',
          officialUrl: 'https://lauf-der-sympathie.de/',
        }),
        race({ id: 'de-berlin-no-site', name: 'Sem site' }),
      ],
      nextCursor: undefined,
    })
    render(<AdminCatalog />)

    const link = await screen.findByRole('link', {
      name: 'Abrir a página oficial de Lauf der Sympathie',
    })
    expect(link).toHaveAttribute('href', 'https://lauf-der-sympathie.de/')
    expect(link).toHaveAttribute('target', '_blank')
    // And an entry with no site shows no link, rather than a dead one.
    expect(screen.queryByRole('link', { name: /Abrir a página oficial de Sem site/ })).toBeNull()
  })
})

describe('joining two entries by hand', () => {
  /** The real case: one entry found by a word, the other by the year. */
  const survivor = race({ id: 'de-berlin-olympiastadion-s-25-berlin', name: 'S 25 Berlin' })
  const repeated = race({ id: 'de-berlin-s-25-berlin', name: 'S 25 Berlin 2027' })

  async function pick(name: string) {
    const rows = screen.getAllByRole('listitem')
    const row = rows.find((candidate) => candidate.textContent?.includes(name))!
    fireEvent.click(within(row).getByRole('button', { name: 'Juntar a outra' }))
  }

  it('points the picked entry at the one that stays, across two searches', async () => {
    listStaleForAdmin.mockResolvedValue({ races: [], nextCursor: undefined })
    searchCatalogForAdmin.mockResolvedValueOnce([repeated])
    render(<AdminCatalog />)

    fireEvent.change(await screen.findByLabelText('Procurar pelo nome'), { target: { value: '2027' } })
    fireEvent.click(screen.getByRole('button', { name: 'Procurar pelo nome' }))
    await screen.findByText('S 25 Berlin 2027')
    await pick('S 25 Berlin 2027')

    // The pick survives the next search, which is the whole point.
    expect(screen.getByText(/A juntar «S 25 Berlin 2027»/)).toBeInTheDocument()
    searchCatalogForAdmin.mockResolvedValueOnce([survivor])
    fireEvent.change(screen.getByLabelText('Procurar pelo nome'), { target: { value: 'olympiastadion' } })
    fireEvent.click(screen.getByRole('button', { name: 'Procurar pelo nome' }))
    await screen.findByText('S 25 Berlin')

    fireEvent.click(screen.getByRole('button', { name: 'Fica esta' }))

    await waitFor(() =>
      expect(mergeCatalogRaces).toHaveBeenCalledWith(
        'de-berlin-olympiastadion-s-25-berlin',
        'de-berlin-s-25-berlin',
        'admin',
      ),
    )
    expect(await screen.findByText(/passa a apontar para/)).toBeInTheDocument()
  })

  it('will not point an entry at a copy, since the chain has to end', async () => {
    listStaleForAdmin.mockResolvedValue({ races: [], nextCursor: undefined })
    searchCatalogForAdmin.mockResolvedValue([
      repeated,
      race({
        id: 'de-berlin-copy',
        name: 'S 25 Halbmarathon Berlin',
        duplicateOfCatalogRaceId: 'de-berlin-other',
      }),
    ])
    render(<AdminCatalog />)

    fireEvent.change(await screen.findByLabelText('Procurar pelo nome'), { target: { value: 's 25' } })
    fireEvent.click(screen.getByRole('button', { name: 'Procurar pelo nome' }))
    await screen.findByText('S 25 Berlin 2027')
    await pick('S 25 Berlin 2027')
    fireEvent.click(screen.getByRole('button', { name: 'Fica esta' }))

    expect(await screen.findByText(/já é uma cópia de de-berlin-other/)).toBeInTheDocument()
    expect(mergeCatalogRaces).not.toHaveBeenCalled()
  })

  it('does not offer an entry as its own survivor', async () => {
    listStaleForAdmin.mockResolvedValue({ races: [repeated], nextCursor: undefined })
    render(<AdminCatalog />)

    await screen.findByText('S 25 Berlin 2027')
    await pick('S 25 Berlin 2027')

    expect(screen.queryByRole('button', { name: 'Fica esta' })).toBeNull()
  })
})
