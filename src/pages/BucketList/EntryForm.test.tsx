import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RaceCatalogEntry } from '../../../shared/raceCatalog'
import type { BucketListItem } from '../../types/BucketListItem'
import type { RaceEntry } from '../../types/RaceEntry'
import { EntryForm } from './EntryForm'

/** Set per test: what the catalog holds for the race behind the wish. */
let catalogRace: RaceCatalogEntry | null = null
/** Set per test: the attempt already recorded, when there is one. */
let entries: RaceEntry[] = []

vi.mock('../../services/raceCatalog', () => ({
  loadCatalogRace: () => Promise.resolve(catalogRace),
}))
vi.mock('../../services/races', () => ({ findOrCreateRaceId: vi.fn() }))
const reportEditionFee = vi.fn()
vi.mock('../../services/editionReports', () => ({
  reportEditionFee: (...args: unknown[]) => reportEditionFee(...args),
}))
vi.mock('../../services/events', () => ({ createEvent: vi.fn() }))

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'wish-1' }),
  useNavigate: () => vi.fn(),
}))
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }))
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))
vi.mock('../../components/PageShell/PageShell', () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const wish: BucketListItem = {
  id: 'wish-1',
  userId: 'u1',
  name: 'Maratona de Lisboa',
  location: 'Lisboa, PT',
  realDistance: 42.195,
  disciplines: ['km_42_2'],
  raceId: 'race-1',
  createdAt: new Date('2026-09-01'),
  updatedAt: new Date('2026-09-01'),
}

vi.mock('../../hooks/useBucketList', () => ({
  useBucketList: () => ({ items: [wish], loading: false }),
}))
const addEntry = vi.fn((_data: unknown) => Promise.resolve('entry-new'))
vi.mock('../../hooks/useRaceEntries', () => ({
  useRaceEntries: () => ({
    entries,
    loading: false,
    addEntry: (data: unknown) => addEntry(data),
    editEntry: vi.fn(),
  }),
}))
vi.mock('../../hooks/useRaces', () => ({
  useRaces: () => ({
    races: [{ id: 'race-1', userId: 'u1', catalogRaceId: 'pt-lisboa-maratona-de-lisboa' }],
  }),
}))

function catalog(overrides: Partial<RaceCatalogEntry> = {}): RaceCatalogEntry {
  return {
    id: 'pt-lisboa-maratona-de-lisboa',
    name: 'Maratona de Lisboa',
    country: 'PT',
    city: 'Lisboa',
    disciplines: ['km_42_2'],
    entryMethod: 'first_come',
    review: 'unreviewed',
    source: 'acorrer.pt',
    producer: 'harvest',
    registrationUrl: 'https://acorrer.pt/maratona',
    editions: [
      {
        year: 2099,
        raceDate: '2099-10-10',
        registrationOpensAt: '2099-01-15T09:00:00Z',
        registrationClosesAt: '2099-09-30',
        typicalFee: 45,
        feeCurrency: 'EUR',
        source: 'acorrer.pt',
        confirmedAt: '2026-09-01',
      },
    ],
    ...overrides,
  }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  catalogRace = null
  entries = []
})

describe('what the runner tells the catalog back', () => {
  /** Fills in what saving a registered entry needs, then saves. */
  async function registerAndSave() {
    await waitFor(() => expect(screen.getByLabelText(/Ano/)).toHaveValue(2099))
    fireEvent.change(screen.getByLabelText(/Distância/), { target: { value: 'km_42_2' } })
    fireEvent.change(screen.getByLabelText(/Estado/), { target: { value: 'registered' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }))
  }

  it('reports the fee it cost once the runner is in', async () => {
    catalogRace = catalog()
    render(<EntryForm />)
    await registerAndSave()

    // No source we read publishes a fee, so a runner who paid one is the only
    // one who can say.
    await waitFor(() =>
      expect(reportEditionFee).toHaveBeenCalledWith(
        'u1',
        'pt-lisboa-maratona-de-lisboa',
        2099,
        45,
        'EUR',
      ),
    )
  })

  it('says nothing while the runner is only watching', async () => {
    catalogRace = catalog()
    render(<EntryForm />)

    await waitFor(() => expect(screen.getByLabelText(/Ano/)).toHaveValue(2099))
    fireEvent.change(screen.getByLabelText(/Distância/), { target: { value: 'km_42_2' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }))

    // Wait for the save itself, so this is not passing on a race.
    await waitFor(() => expect(addEntry).toHaveBeenCalled())
    // A fee they were quoted and never paid is not a fee.
    expect(reportEditionFee).not.toHaveBeenCalled()
  })
})

describe('EntryForm and what the catalog already knows', () => {
  it('fills the dates, the gates and the fee for a first attempt', async () => {
    catalogRace = catalog()
    render(<EntryForm />)

    // The year comes from the edition, not from the form's guess of next year.
    await waitFor(() => expect(screen.getByLabelText(/Ano/)).toHaveValue(2099))
    expect(screen.getByLabelText(/Data da prova/)).toHaveValue('2099-10-10')
    // An instant is cut down to the day a date input takes.
    expect(screen.getByLabelText(/Inscrições abrem/)).toHaveValue('2099-01-15')
    expect(screen.getByLabelText(/Inscrições fecham/)).toHaveValue('2099-09-30')
    expect(screen.getByLabelText(/Preço/)).toHaveValue(45)
  })

  it('says where the values came from, and that they are not checked', async () => {
    catalogRace = catalog()
    render(<EntryForm />)

    expect(await screen.findByText(/a acorrer.pt publica/)).toBeInTheDocument()
    expect(screen.getByText(/Confirma antes de contares/)).toBeInTheDocument()
  })

  it('does not call a date confirmed on an entry nobody checked', async () => {
    catalogRace = catalog()
    render(<EntryForm />)

    await waitFor(() => expect(screen.getByLabelText(/Data da prova/)).toHaveValue('2099-10-10'))
    // The review rule: an unreviewed entry may suggest and may never assert.
    expect(screen.getByLabelText(/A data da prova está confirmada/)).not.toBeChecked()
  })

  it('calls it confirmed once a person has checked the entry', async () => {
    catalogRace = catalog({ review: 'reviewed' })
    render(<EntryForm />)

    await waitFor(() => expect(screen.getByLabelText(/A data da prova está confirmada/)).toBeChecked())
    expect(await screen.findByText(/verificado na acorrer.pt/)).toBeInTheDocument()
  })

  it('leaves an attempt that already exists exactly as it was', async () => {
    catalogRace = catalog()
    entries = [
      {
        id: 'entry-1',
        userId: 'u1',
        raceId: 'race-1',
        bucketListItemId: 'wish-1',
        year: 2098,
        raceDateConfirmed: false,
        entryMethod: 'lottery',
        entryStatus: 'applied',
        createdAt: new Date('2026-09-01'),
        updatedAt: new Date('2026-09-01'),
      } as RaceEntry,
    ]
    render(<EntryForm />)

    // A field the runner left empty is an answer, not a gap to fill in later.
    await waitFor(() => expect(screen.getByLabelText(/Ano/)).toHaveValue(2098))
    expect(screen.getByLabelText(/Data da prova/)).toHaveValue('')
    expect(screen.getByLabelText(/Preço/)).toHaveValue(null)
    expect(screen.queryByText(/Preenchido a partir do catálogo/)).not.toBeInTheDocument()
  })

  it('opens empty for a race the catalog does not cover', async () => {
    catalogRace = null
    render(<EntryForm />)

    await waitFor(() => expect(screen.getByLabelText(/Data da prova/)).toHaveValue(''))
    expect(screen.queryByText(/Preenchido a partir do catálogo/)).not.toBeInTheDocument()
  })
})
