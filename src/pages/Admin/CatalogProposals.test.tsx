import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CatalogProposal } from '../../../shared/raceCatalog'
import { CatalogProposals } from './CatalogProposals'

/** Set per test: what runners proposed and the job has not answered. */
let pending: CatalogProposal[] = []
vi.mock('../../services/catalogProposals', () => ({
  loadPendingProposals: () => Promise.resolve(pending),
}))

afterEach(() => {
  cleanup()
  pending = []
})

describe('CatalogProposals', () => {
  it('shows nothing when nothing is waiting', () => {
    const { container } = render(<CatalogProposals />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows what a runner proposed while it waits for the daily run', async () => {
    // The window this exists for: saved, told to the runner, and invisible to
    // everybody until the job ran.
    pending = [
      {
        uid: 'u1',
        name: 'Lauf der Sympathie',
        city: 'Falkensee',
        country: 'DE',
        raceDate: '2026-03-15',
        disciplines: ['km_10'],
        proposedAt: '2026-09-10',
      },
    ]
    render(<CatalogProposals />)

    expect(await screen.findByText('Lauf der Sympathie')).toBeInTheDocument()
    expect(screen.getByText('Falkensee, DE')).toBeInTheDocument()
    expect(screen.getByText('2026-03-15')).toBeInTheDocument()
    expect(screen.getByText(/Nada para decidir aqui/)).toBeInTheDocument()
  })
})
