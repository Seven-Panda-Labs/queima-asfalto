import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RaceCatalogEntry } from '../../../shared/raceCatalog'
import { FindRaces } from './FindRaces'

const searchRaceCatalog = vi.fn()

vi.mock('../../services/raceCatalog', () => ({
  searchRaceCatalog: (...args: unknown[]) => searchRaceCatalog(...args),
  loadHarvestStatus: () =>
    Promise.resolve({ syncedAt: new Date('2026-09-04'), countries: ['DE', 'PT'] }),
  catalogRaceToBucketListItem: vi.fn(),
  findOrCreateCatalogRaceId: vi.fn(),
}))

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }))
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))
vi.mock('../../contexts/DisciplinesContext', () => ({
  useDisciplines: () => ({ enabledDisciplines: ['km_5', 'km_10', 'km_21_1'] }),
}))
vi.mock('../../hooks/useBucketList', () => ({
  useBucketList: () => ({ items: [], addItem: vi.fn() }),
}))
vi.mock('../../hooks/useEvents', () => ({
  useEvents: () => ({ allEvents: [], addEvent: vi.fn() }),
}))
vi.mock('../../hooks/useRaceEntries', () => ({ useRaceEntries: () => ({ entries: [] }) }))
vi.mock('../../hooks/useRaces', () => ({ useRaces: () => ({ races: [] }) }))
vi.mock('../../hooks/useUserResultsProfile', () => ({
  useUserResultsProfile: () => ({ profile: {} }),
}))
vi.mock('../../components/NearbyParkruns', () => ({ NearbyParkruns: () => null }))
vi.mock('../../components/PageShell/PageShell', () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('react-router-dom', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>,
}))

function race(id: string, overrides: Partial<RaceCatalogEntry> = {}): RaceCatalogEntry {
  return {
    id,
    name: id,
    country: 'DE',
    city: 'Berlin',
    disciplines: ['km_10'],
    entryMethod: 'unknown',
    review: 'unreviewed',
    source: 'x',
    editions: [{ year: 2099, raceDate: '2099-07-01', source: 'x', confirmedAt: '2026-09-04' }],
    nextRaceDate: '2099-07-01',
    ...overrides,
  }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('FindRaces', () => {
  it('asks for a filter before it searches anything', async () => {
    render(<FindRaces />)

    expect(await screen.findByText(/Escolhe onde ou o quê/)).toBeInTheDocument()
    // The catalog is thousands of races: no query until the runner narrows it.
    expect(searchRaceCatalog).not.toHaveBeenCalled()
  })

  it('says how many countries there are to choose from', async () => {
    render(<FindRaces />)
    expect(await screen.findByText(/2 países/)).toBeInTheDocument()
  })

  it('searches the server once a country is picked', async () => {
    searchRaceCatalog.mockResolvedValue([race('berlin-10k')])
    render(<FindRaces />)

    await screen.findByText(/Escolhe onde/)
    fireEvent.change(screen.getByLabelText('País'), { target: { value: 'DE' } })

    await waitFor(() =>
      expect(searchRaceCatalog).toHaveBeenCalledWith(
        expect.objectContaining({ country: 'DE', limit: 20 }),
      ),
    )
    expect(await screen.findByText('berlin-10k')).toBeInTheDocument()
  })

  it('sends one discipline to the query, because Firestore takes one', async () => {
    searchRaceCatalog.mockResolvedValue([])
    render(<FindRaces />)

    await screen.findByText(/Escolhe onde/)
    fireEvent.click(screen.getByRole('button', { name: '10Km' }))

    await waitFor(() =>
      expect(searchRaceCatalog).toHaveBeenCalledWith(
        expect.objectContaining({ discipline: 'km_10' }),
      ),
    )
  })

  it('asks for more only when the page came back full', async () => {
    searchRaceCatalog.mockResolvedValue([race('one')])
    render(<FindRaces />)

    await screen.findByText(/Escolhe onde/)
    fireEvent.change(screen.getByLabelText('País'), { target: { value: 'DE' } })
    await screen.findByText('one')

    expect(screen.queryByRole('button', { name: 'Mostrar mais' })).not.toBeInTheDocument()
  })

  it('raises the limit when there is more', async () => {
    searchRaceCatalog.mockResolvedValue(
      Array.from({ length: 20 }, (_, index) => race(`race-${index}`)),
    )
    render(<FindRaces />)

    await screen.findByText(/Escolhe onde/)
    fireEvent.change(screen.getByLabelText('País'), { target: { value: 'DE' } })
    const more = await screen.findByRole('button', { name: 'Mostrar mais' })
    fireEvent.click(more)

    await waitFor(() =>
      expect(searchRaceCatalog).toHaveBeenCalledWith(expect.objectContaining({ limit: 40 })),
    )
  })
})
