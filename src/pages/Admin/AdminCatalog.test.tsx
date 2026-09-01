import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RaceCatalogEntry } from '../../../shared/raceCatalog'
import { AdminCatalog } from './AdminCatalog'

const listCatalogForAdmin = vi.fn()

vi.mock('../../services/adminRaceCatalog', () => ({
  listCatalogForAdmin: () => listCatalogForAdmin(),
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

describe('AdminCatalog', () => {
  it('shows work before it shows a catalog', async () => {
    listCatalogForAdmin.mockResolvedValue([
      race({
        id: 'current-race',
        editions: [{ year: 2099, raceDate: '2099-05-01', source: 's', confirmedAt: '2026-09-01' }],
      }),
      race({ id: 'never-checked', review: 'unreviewed' }),
      race({ id: 'out-of-editions' }),
    ])

    render(<AdminCatalog />)

    await waitFor(() => expect(screen.getByText('never-checked')).toBeInTheDocument())
    const headings = screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent)
    expect(headings[0]).toContain('Nunca confirmadas')
    expect(headings[1]).toContain('sem edição futura')
    expect(headings[2]).toContain('Em ordem')
  })

  it('keeps a retired race out of the working groups', async () => {
    listCatalogForAdmin.mockResolvedValue([
      race({ id: 'retired-race', retired: true }),
      race({ id: 'never-checked', review: 'unreviewed' }),
    ])

    render(<AdminCatalog />)

    await waitFor(() => expect(screen.getByText('retired-race')).toBeInTheDocument())
    const headings = screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent)
    expect(headings).toHaveLength(2)
    expect(headings[1]).toContain('Fora de circulação')
  })

  it('tells an operator how to fill an empty catalog', async () => {
    listCatalogForAdmin.mockResolvedValue([])

    render(<AdminCatalog />)

    await waitFor(() =>
      expect(screen.getByText('O catálogo desta instância está vazio.')).toBeInTheDocument(),
    )
    expect(screen.getByText(/seed:race-catalog/)).toBeInTheDocument()
  })

  it('says so when the load fails', async () => {
    listCatalogForAdmin.mockRejectedValue(new Error('nope'))

    render(<AdminCatalog />)

    await waitFor(() =>
      expect(screen.getByText('Não foi possível carregar o catálogo.')).toBeInTheDocument(),
    )
  })
})
