import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RaceCatalogEntry } from '../../../shared/raceCatalog'
import type { Event } from '../../types/Event'
import type { RaceEntry } from '../../types/RaceEntry'
import { EntryForm } from './EntryForm'

/** Set per test: what the catalog holds for the race in the calendar. */
let catalogRace: RaceCatalogEntry | null = null
/** Set per test: the attempt already recorded, when there is one. */
let entries: RaceEntry[] = []
/** Set per test: the race as it stands in the calendar. */
let event: Event | null = null

vi.mock('../../services/raceCatalog', () => ({
  loadCatalogRace: () => Promise.resolve(catalogRace),
}))
const reportEditionFee = vi.fn()
vi.mock('../../services/editionReports', () => ({
  reportEditionFee: (...args: unknown[]) => reportEditionFee(...args),
}))
const updateEvent = vi.fn()
vi.mock('../../services/events', () => ({
  getEvent: () => Promise.resolve(event),
  updateEvent: (...args: unknown[]) => updateEvent(...args),
}))

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'event-1' }),
  useNavigate: () => vi.fn(),
}))
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }))
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))
vi.mock('../../components/PageShell/PageShell', () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const addEntry = vi.fn((_data: unknown) => Promise.resolve('entry-new'))
const editEntry = vi.fn()
vi.mock('../../hooks/useRaceEntries', () => ({
  useRaceEntries: () => ({
    entries,
    loading: false,
    addEntry: (data: unknown) => addEntry(data),
    editEntry: (id: string, data: unknown) => editEntry(id, data),
  }),
}))
vi.mock('../../hooks/useRaces', () => ({
  useRaces: () => ({
    races: [{ id: 'race-1', userId: 'u1', catalogRaceId: 'pt-lisboa-maratona-de-lisboa' }],
  }),
}))

function scheduled(overrides: Partial<Event> = {}): Event {
  return {
    id: 'event-1',
    userId: 'u1',
    name: 'Maratona de Lisboa',
    date: new Date('2099-10-10T12:00:00'),
    realDistance: 42.195,
    eventType: 'km_42_2',
    location: 'Lisboa, PT',
    status: 'planned',
    raceId: 'race-1',
    createdAt: new Date('2026-09-01'),
    updatedAt: new Date('2026-09-01'),
    ...overrides,
  } as Event
}

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

/**
 * The catalog lands after the first render and the form hydrates from it, so
 * anything typed before that is overwritten. The method is the signal: the
 * catalog says `first_come` and the empty form says `unknown`.
 */
async function hydrated() {
  await waitFor(() =>
    expect(screen.getByLabelText(/Forma de inscrição/)).toHaveValue('first_come'),
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  catalogRace = null
  entries = []
  event = null
})

describe('the paperwork of one race', () => {
  it('asks nothing the calendar already answers', async () => {
    // The year, the distance and the day are the event's. What is left is the
    // lottery and the gates, which is the whole reason this page exists.
    catalogRace = catalog()
    event = scheduled()
    render(<EntryForm />)

    await screen.findByLabelText(/Forma de inscrição/)
    expect(screen.queryByLabelText(/Ano/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Distância/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Data da prova/)).not.toBeInTheDocument()
  })

  it('fills the gates and the fee from the edition being run', async () => {
    catalogRace = catalog()
    event = scheduled()
    render(<EntryForm />)

    // An instant is cut down to its day.
    await waitFor(() =>
      expect(screen.getByLabelText(/Inscrições abrem/)).toHaveTextContent('15/01/2099'),
    )
    expect(screen.getByLabelText(/Inscrições fecham/)).toHaveTextContent('30/09/2099')
    expect(screen.getByLabelText(/Preço/)).toHaveValue(45)
  })

  it('says where the values came from, and that they are not checked', async () => {
    catalogRace = catalog()
    event = scheduled()
    render(<EntryForm />)

    expect(await screen.findByText(/a acorrer.pt publica/)).toBeInTheDocument()
    expect(screen.getByText(/Confirma antes de contares/)).toBeInTheDocument()
  })

  it('writes the event date on the attempt, as a date nobody has to confirm', async () => {
    catalogRace = catalog()
    event = scheduled()
    render(<EntryForm />)

    await hydrated()
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }))

    await waitFor(() =>
      expect(addEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          raceId: 'race-1',
          year: 2099,
          discipline: 'km_42_2',
          eventId: 'event-1',
          raceDateConfirmed: true,
        }),
      ),
    )
  })

  it('confirms the race in the calendar once the runner is in', async () => {
    // Two ways of saying the same thing is how the two drift apart.
    catalogRace = catalog()
    event = scheduled()
    render(<EntryForm />)

    await hydrated()
    fireEvent.change(screen.getByLabelText(/Estado/), { target: { value: 'registered' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }))

    await waitFor(() => expect(updateEvent).toHaveBeenCalledWith('event-1', { status: 'confirmed' }))
  })

  it('leaves an attempt that already exists exactly as it was', async () => {
    catalogRace = catalog()
    event = scheduled()
    entries = [
      {
        id: 'entry-1',
        userId: 'u1',
        raceId: 'race-1',
        year: 2099,
        raceDateConfirmed: false,
        entryMethod: 'lottery',
        entryStatus: 'applied',
        createdAt: new Date('2026-09-01'),
        updatedAt: new Date('2026-09-01'),
      } as RaceEntry,
    ]
    render(<EntryForm />)

    // A field the runner left empty is an answer, not a gap to fill in later.
    await waitFor(() => expect(screen.getByLabelText(/Preço/)).toHaveValue(null))
    expect(screen.getByLabelText(/Inscrições abrem/)).toHaveTextContent('Definir data')
    expect(screen.queryByText(/Preenchido a partir do catálogo/)).not.toBeInTheDocument()
  })

  it('opens empty for a race the catalog does not cover', async () => {
    catalogRace = null
    event = scheduled()
    render(<EntryForm />)

    await waitFor(() =>
      expect(screen.getByLabelText(/Inscrições abrem/)).toHaveTextContent('Definir data'),
    )
    expect(screen.queryByText(/Preenchido a partir do catálogo/)).not.toBeInTheDocument()
  })
})

describe('what the runner tells the catalog back', () => {
  it('asks for the fee when the catalog has none and the runner is in', async () => {
    // Measured: 140 of 5116 entries carry a fee, and both sources that publish
    // one are already read whole. The runner who just got in is the only
    // source left, and this is the only moment they know it.
    catalogRace = catalog({
      editions: [{ year: 2099, raceDate: '2099-10-10', source: 'x', confirmedAt: 'x' }],
    })
    event = scheduled()
    render(<EntryForm />)

    await hydrated()
    expect(screen.queryByText(/Nenhum calendário que lemos publica preços/)).toBeNull()

    fireEvent.change(screen.getByLabelText(/Estado/), { target: { value: 'registered' } })

    expect(screen.getByText(/Nenhum calendário que lemos publica preços/)).toBeInTheDocument()
  })

  it('does not ask when the catalog already knows the price', async () => {
    catalogRace = catalog()
    event = scheduled()
    render(<EntryForm />)

    await hydrated()
    fireEvent.change(screen.getByLabelText(/Estado/), { target: { value: 'registered' } })

    expect(screen.queryByText(/Nenhum calendário que lemos publica preços/)).toBeNull()
  })

  it('says so when a fee would be dropped for having no currency', async () => {
    catalogRace = catalog({
      editions: [{ year: 2099, raceDate: '2099-10-10', source: 'x', confirmedAt: 'x' }],
    })
    event = scheduled()
    render(<EntryForm />)

    await hydrated()
    fireEvent.change(screen.getByLabelText(/Preço/), { target: { value: '45' } })

    expect(screen.getByText(/Escolhe a moeda/)).toBeInTheDocument()
  })

  it('reports the fee it cost once the runner is in', async () => {
    catalogRace = catalog()
    event = scheduled()
    render(<EntryForm />)

    await hydrated()
    fireEvent.change(screen.getByLabelText(/Estado/), { target: { value: 'registered' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }))

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
    event = scheduled()
    render(<EntryForm />)

    await hydrated()
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }))

    await waitFor(() => expect(addEntry).toHaveBeenCalled())
    // A fee they were quoted and never paid is not a fee.
    expect(reportEditionFee).not.toHaveBeenCalled()
  })
})
