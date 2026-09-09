import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RaceCatalogEntry } from '../../../shared/raceCatalog'
import { FindRaces } from './FindRaces'

const searchRaceCatalog = vi.fn()
/** Set per test: the list the harvest's status document carries, or none. */
let countries: string[] = ['DE', 'PT']

vi.mock('../../services/raceCatalog', () => ({
  searchRaceCatalog: (...args: unknown[]) => searchRaceCatalog(...args),
  loadHarvestStatus: () =>
    Promise.resolve({ syncedAt: new Date('2026-09-04'), countries }),
  catalogRaceToBucketListItem: vi.fn(),
  findOrCreateCatalogRaceId: vi.fn(),
}))

const recordDuplicateVote = vi.fn()
vi.mock('../../services/duplicateVotes', () => ({
  recordDuplicateVote: (...args: unknown[]) => recordDuplicateVote(...args),
  loadMyAnsweredPairs: () => Promise.resolve(new Set<string>()),
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
  countries = ['DE', 'PT']
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

describe('FindRaces without a country list', () => {
  it('leaves the field out rather than showing a dead one', async () => {
    // The list comes from the harvest's status document. An instance that has
    // not harvested since upgrading has none, and a disabled select is a
    // control that does nothing when you click it, which is what shipped.
    countries = []
    render(<FindRaces />)

    await screen.findByText(/Escolhe onde/)
    expect(screen.queryByLabelText('País')).not.toBeInTheDocument()
    // The place field is still there, so the page is not useless without it.
    expect(screen.getByLabelText('Onde')).toBeInTheDocument()
  })

  it('shows the field when the list arrives', async () => {
    render(<FindRaces />)
    expect(await screen.findByLabelText('País')).toBeInTheDocument()
  })
})

describe('the country filter order', () => {
  it('sorts by the name on screen, not by the code behind it', async () => {
    // The stored list is sorted by ISO code, which in Portuguese reads Andorra,
    // Emirados Árabes Unidos, Albânia, Armênia: no order at all to a reader.
    countries = ['AD', 'AE', 'AL', 'AQ', 'AT', 'CH', 'DE', 'PT']
    render(<FindRaces />)

    const select = await screen.findByLabelText('País')
    const shown = [...select.querySelectorAll('option')]
      .map((option) => option.textContent)
      .slice(1)

    expect(shown).toEqual([
      'Albânia',
      'Alemanha',
      'Andorra',
      'Antártida',
      'Áustria',
      'Emirados Árabes Unidos',
      'Portugal',
      'Suíça',
    ])
  })
})

describe('a pair that looks like one race', () => {
  /**
   * A real pair from the catalog: same day, same town, same distance, and the
   * names agree on nothing a rule can use, so no rule merges them.
   */
  const pair = [
    race('de-hamburg-haspa-halbmarathon', {
      name: 'Haspa Halbmarathon Hamburg',
      city: 'Hamburg',
      disciplines: ['km_5'],
    }),
    race('de-hamburg-haspa-marathon', {
      name: 'Haspa Marathon Hamburg',
      city: 'Hamburg',
      disciplines: ['km_5'],
    }),
  ]

  async function search() {
    render(<FindRaces />)
    await screen.findByText(/Escolhe onde/)
    fireEvent.change(screen.getByLabelText('País'), { target: { value: 'DE' } })
  }

  it('asks the runner, under the two rows', async () => {
    searchRaceCatalog.mockResolvedValue(pair)
    await search()

    expect(await screen.findByText(/parecem a mesma prova/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'É a mesma prova' })).toBeInTheDocument()
  })

  it('records the answer as a vote and stops asking', async () => {
    searchRaceCatalog.mockResolvedValue(pair)
    await search()

    fireEvent.click(await screen.findByRole('button', { name: 'É a mesma prova' }))

    await waitFor(() =>
      expect(recordDuplicateVote).toHaveBeenCalledWith(
        'u1',
        'de-hamburg-haspa-halbmarathon',
        'de-hamburg-haspa-marathon',
        true,
      ),
    )
    // Answered once is answered: asking again reads as the answer being lost.
    await waitFor(() =>
      expect(screen.queryByText(/parecem a mesma prova/)).not.toBeInTheDocument(),
    )
    // And both races are still there. A vote decides nothing on its own.
    expect(screen.getByText('Haspa Halbmarathon Hamburg')).toBeInTheDocument()
    expect(screen.getByText('Haspa Marathon Hamburg')).toBeInTheDocument()
  })

  it('says nothing about two races that only share a town', async () => {
    searchRaceCatalog.mockResolvedValue([
      race('de-hamburg-alsterlauf', { name: 'Alsterlauf', city: 'Hamburg' }),
      race('de-hamburg-hafenlauf', { name: 'Hafenlauf', city: 'Hamburg' }),
    ])
    await search()

    await screen.findByText('Alsterlauf')
    expect(screen.queryByText(/parecem a mesma prova/)).not.toBeInTheDocument()
  })
})

describe('the radius', () => {
  /** Berlin, and the browser agreeing to say so. */
  function grantLocation(lat = 52.52, lng = 13.405) {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (ok: (position: { coords: { latitude: number; longitude: number } }) => void) =>
          ok({ coords: { latitude: lat, longitude: lng } }),
      },
    })
  }

  const near = [
    race('berlin', { city: 'Berlin', latitude: 52.52, longitude: 13.405 }),
    race('potsdam', { city: 'Potsdam', latitude: 52.4, longitude: 13.066 }),
    race('hamburg', { city: 'Hamburg', latitude: 53.55, longitude: 9.993 }),
    race('nowhere', { city: 'Kleinkleckersdorf' }),
  ]

  it('asks for a location when there is a radius and no centre', async () => {
    searchRaceCatalog.mockResolvedValue([])
    render(<FindRaces />)

    await screen.findByText(/Escolhe onde/)
    fireEvent.change(screen.getByLabelText('Raio'), { target: { value: '50' } })

    expect(
      await screen.findByRole('button', { name: 'Usar a minha localização' }),
    ).toBeInTheDocument()
  })

  it('keeps what is inside the circle and counts what it could not place', async () => {
    grantLocation()
    searchRaceCatalog.mockResolvedValue(near)
    render(<FindRaces />)

    await screen.findByText(/Escolhe onde/)
    fireEvent.change(screen.getByLabelText('Raio'), { target: { value: '50' } })
    fireEvent.click(await screen.findByRole('button', { name: 'Usar a minha localização' }))

    // Berlin and Potsdam (26 km out) are in, Hamburg (255 km) is not.
    expect(await screen.findByText('berlin')).toBeInTheDocument()
    expect(screen.getByText('potsdam')).toBeInTheDocument()
    expect(screen.queryByText('hamburg')).not.toBeInTheDocument()
    // And the one the source never placed is counted, not hidden.
    expect(screen.getByText(/1 prova que a fonte não situou/)).toBeInTheDocument()
  })

  it('asks the server for more rows when a circle is going to cut them down', async () => {
    grantLocation()
    searchRaceCatalog.mockResolvedValue(near)
    render(<FindRaces />)

    await screen.findByText(/Escolhe onde/)
    fireEvent.change(screen.getByLabelText('Raio'), { target: { value: '50' } })
    fireEvent.click(await screen.findByRole('button', { name: 'Usar a minha localização' }))

    // The circle is applied after the query, so the query has to bring
    // candidates for it to keep.
    await waitFor(() =>
      expect(searchRaceCatalog).toHaveBeenCalledWith(expect.objectContaining({ limit: 200 })),
    )
  })
})
