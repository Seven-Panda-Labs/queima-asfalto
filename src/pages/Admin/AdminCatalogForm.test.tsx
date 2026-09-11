import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminCatalogForm } from './AdminCatalogForm'

const saveCatalogRaceForAdmin = vi.fn(async (_race: unknown, _uid: string) => {})
const catalogRaceIdExists = vi.fn(async (_id: string) => false)
const getCatalogRaceForAdmin = vi.fn(async (_id: string) => null as unknown)
const navigate = vi.fn()
/** The route's own params, so a test can open an entry that already exists. */
let params: { id?: string } = {}

vi.mock('../../services/adminRaceCatalog', () => ({
  getCatalogRaceForAdmin: (id: string) => getCatalogRaceForAdmin(id),
  saveCatalogRaceForAdmin: (race: unknown, uid: string) => saveCatalogRaceForAdmin(race, uid),
  catalogRaceIdExists: (id: string) => catalogRaceIdExists(id),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useParams: () => params,
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user-admin' } }),
}))

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

vi.mock('../../components/PageShell/PageShell', () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  params = {}
  getCatalogRaceForAdmin.mockResolvedValue(null)
})

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(new RegExp(label)), { target: { value } })
}

describe('AdminCatalogForm', () => {
  it('derives the id from the name and saves the entry', async () => {
    render(<AdminCatalogForm />)

    fill('Nome', 'Maratona do Porto')
    fill('Cidade', 'Porto')
    fireEvent.change(screen.getByLabelText(/País/), { target: { value: 'PT' } })
    fill('Fonte', 'maratonadoporto.com, confirmado 2026-09-01')
    fireEvent.click(screen.getByText('Maratona'))
    fireEvent.click(screen.getByText('Guardar'))

    await waitFor(() => expect(saveCatalogRaceForAdmin).toHaveBeenCalled())
    const [saved] = saveCatalogRaceForAdmin.mock.calls[0]! as unknown as [
      { id: string; disciplines: string[] },
    ]
    expect(saved.id).toBe('maratona-do-porto')
    expect(saved.disciplines).toEqual(['km_42_2'])
  })

  it('refuses an entry with no country chosen', async () => {
    render(<AdminCatalogForm />)

    fill('Nome', 'Maratona do Porto')
    fill('Cidade', 'Porto')
    fill('Fonte', 'x')
    fireEvent.click(screen.getByText('Maratona'))
    fireEvent.click(screen.getByText('Guardar'))

    // The country is the first field the duplicate rule compares, so an entry
    // without one can never merge with its own other listing.
    await waitFor(() =>
      expect(screen.getByText('Escolhe o país da lista.')).toBeInTheDocument(),
    )
    expect(saveCatalogRaceForAdmin).not.toHaveBeenCalled()
  })

  it('will not store dated editions on an entry nobody confirmed', async () => {
    render(<AdminCatalogForm />)

    fill('Nome', 'Maratona do Porto')
    fill('Cidade', 'Porto')
    fireEvent.change(screen.getByLabelText(/País/), { target: { value: 'PT' } })
    fill('Fonte', 'x')
    fireEvent.click(screen.getByText('Maratona'))
    fireEvent.click(screen.getByText('Acrescentar edição'))
    fireEvent.click(screen.getByText('Guardar'))

    await waitFor(() =>
      expect(
        screen.getByText('Uma entrada não confirmada não pode ter edições com datas.'),
      ).toBeInTheDocument(),
    )
    expect(saveCatalogRaceForAdmin).not.toHaveBeenCalled()
  })

  it('refuses to save an entry whose stored date is malformed', async () => {
    // Real, and typed into this form when it was free text: "2026-08.-23"
    // took the event page to a white screen, because `Intl` throws on it.
    params = { id: 'de-berlin-steglitz-die-generalprobe' }
    getCatalogRaceForAdmin.mockResolvedValue({
      id: 'de-berlin-steglitz-die-generalprobe',
      name: 'Die Generalprobe',
      country: 'DE',
      city: 'Berlin',
      disciplines: ['km_21_1'],
      entryMethod: 'unknown',
      review: 'reviewed',
      source: 'berliner-generalprobe.de',
      editions: [
        {
          year: 2026,
          raceDate: '2026-08.-23',
          source: 'berliner-generalprobe.de',
          confirmedAt: '2026-09-10',
        },
      ],
    })
    render(<AdminCatalogForm />)

    fireEvent.click(await screen.findByText('Guardar'))

    await waitFor(() =>
      expect(
        screen.getByText('Data inválida. Usa o selector, no formato AAAA-MM-DD.'),
      ).toBeInTheDocument(),
    )
    expect(saveCatalogRaceForAdmin).not.toHaveBeenCalled()
  })

  it('refuses to save a stored deadline that is neither a day nor an instant', async () => {
    // The form edits a day and an hour now, so this can only arrive from
    // storage: it still must not be written back.
    params = { id: 'pt-porto-maratona-do-porto' }
    getCatalogRaceForAdmin.mockResolvedValue({
      id: 'pt-porto-maratona-do-porto',
      name: 'Maratona do Porto',
      country: 'PT',
      city: 'Porto',
      disciplines: ['km_42_2'],
      entryMethod: 'unknown',
      review: 'reviewed',
      source: 'maratonadoporto.com',
      editions: [
        {
          year: 2027,
          registrationClosesAt: 'daqui a duas semanas',
          source: 'maratonadoporto.com',
          confirmedAt: '2026-09-11',
        },
      ],
    })
    render(<AdminCatalogForm />)

    fireEvent.click(await screen.findByText('Guardar'))

    await waitFor(() => expect(screen.getByText(/Prazo inválido/)).toBeInTheDocument())
    expect(saveCatalogRaceForAdmin).not.toHaveBeenCalled()
  })

  it('does not ask for a zone the country already answers', async () => {
    render(<AdminCatalogForm />)

    fireEvent.change(screen.getByLabelText(/País/), { target: { value: 'DE' } })

    // Germany is Europe/Berlin and Europe/Busingen, one clock under two names.
    expect(await screen.findByText(/Europe\/Berlin, pelo país/)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Fuso horário/)).toBeNull()
  })

  it('asks with that country s zones when the country is really several', async () => {
    render(<AdminCatalogForm />)

    fireEvent.change(screen.getByLabelText(/País/), { target: { value: 'PT' } })

    const zone = await screen.findByLabelText(/Fuso horário/)
    // The empty option plus the Azores, Madeira and Lisbon.
    expect(within(zone).getAllByRole('option')).toHaveLength(4)
    expect(screen.getByText(/Este país tem 3 fusos/)).toBeInTheDocument()
  })

  it('refuses a fee with no currency, since a price is both', async () => {
    params = { id: 'pt-porto-maratona-do-porto' }
    getCatalogRaceForAdmin.mockResolvedValue({
      id: 'pt-porto-maratona-do-porto',
      name: 'Maratona do Porto',
      country: 'PT',
      city: 'Porto',
      disciplines: ['km_42_2'],
      entryMethod: 'unknown',
      review: 'reviewed',
      source: 'maratonadoporto.com',
      editions: [
        { year: 2027, typicalFee: 40, source: 'maratonadoporto.com', confirmedAt: '2026-09-11' },
      ],
    })
    render(<AdminCatalogForm />)

    fireEvent.click(await screen.findByText('Guardar'))

    await waitFor(() => expect(screen.getByText('Um preço precisa da moeda.')).toBeInTheDocument())
    expect(saveCatalogRaceForAdmin).not.toHaveBeenCalled()
  })

  it('edits a deadline as a day and an hour in the race s own clock', async () => {
    // Stored as the instant, shown as what the organiser published: Boston
    // closes at 21:00 UTC, which is 17:00 where the race is.
    params = { id: 'us-boston-boston-marathon' }
    getCatalogRaceForAdmin.mockResolvedValue({
      id: 'us-boston-boston-marathon',
      name: 'Boston Marathon',
      country: 'US',
      city: 'Boston',
      timezone: 'America/New_York',
      disciplines: ['km_42_2'],
      entryMethod: 'qualifying',
      review: 'reviewed',
      source: 'baa.org',
      editions: [
        {
          year: 2027,
          registrationClosesAt: '2026-09-18T21:00:00Z',
          source: 'baa.org',
          confirmedAt: '2026-09-11',
        },
      ],
    })
    render(<AdminCatalogForm />)

    const time = await screen.findByLabelText('Hora')
    expect(time).toHaveValue('17:00')
    expect(screen.getByText(/hora em America\/New_York/)).toBeInTheDocument()

    fireEvent.change(time, { target: { value: '18:30' } })
    fireEvent.click(screen.getByText('Guardar'))

    await waitFor(() => expect(saveCatalogRaceForAdmin).toHaveBeenCalled())
    const [saved] = saveCatalogRaceForAdmin.mock.calls[0]! as unknown as [
      { editions: { registrationClosesAt: string }[] },
    ]
    expect(saved.editions[0]!.registrationClosesAt).toBe('2026-09-18T22:30:00Z')
  })

  it('will not take an hour it cannot anchor', async () => {
    // The United States is twenty-nine zones, so until one is picked an hour
    // is an hour in nobody's day.
    params = { id: 'us-boston-boston-marathon' }
    getCatalogRaceForAdmin.mockResolvedValue({
      id: 'us-boston-boston-marathon',
      name: 'Boston Marathon',
      country: 'US',
      city: 'Boston',
      disciplines: ['km_42_2'],
      entryMethod: 'qualifying',
      review: 'reviewed',
      source: 'baa.org',
      editions: [
        { year: 2027, registrationClosesAt: '2026-09-18', source: 'baa.org', confirmedAt: '2026-09-11' },
      ],
    })
    render(<AdminCatalogForm />)

    expect(await screen.findByLabelText('Hora')).toBeDisabled()
    expect(screen.getByText(/escolhe primeiro o fuso da prova/)).toBeInTheDocument()
  })

  it('refuses an id that is already taken', async () => {
    catalogRaceIdExists.mockResolvedValue(true)
    render(<AdminCatalogForm />)

    fill('Nome', 'Maratona do Porto')
    fill('Cidade', 'Porto')
    fireEvent.change(screen.getByLabelText(/País/), { target: { value: 'PT' } })
    fill('Fonte', 'x')
    fireEvent.click(screen.getByText('Maratona'))
    fireEvent.click(screen.getByText('Guardar'))

    await waitFor(() =>
      expect(screen.getByText('Já existe uma prova com este identificador.')).toBeInTheDocument(),
    )
    expect(saveCatalogRaceForAdmin).not.toHaveBeenCalled()
  })
})
