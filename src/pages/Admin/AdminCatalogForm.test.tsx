import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminCatalogForm } from './AdminCatalogForm'

const saveCatalogRaceForAdmin = vi.fn(async (_race: unknown, _uid: string) => {})
const catalogRaceIdExists = vi.fn(async (_id: string) => false)
const navigate = vi.fn()

vi.mock('../../services/adminRaceCatalog', () => ({
  getCatalogRaceForAdmin: vi.fn(async () => null),
  saveCatalogRaceForAdmin: (race: unknown, uid: string) => saveCatalogRaceForAdmin(race, uid),
  catalogRaceIdExists: (id: string) => catalogRaceIdExists(id),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useParams: () => ({}),
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
