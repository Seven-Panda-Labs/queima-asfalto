import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RaceCatalogEntry } from '../../../shared/raceCatalog'
import { CatalogDuplicates } from './CatalogDuplicates'

const mergeCatalogRaces = vi.fn()
const separateCatalogRaces = vi.fn()

vi.mock('../../services/adminRaceCatalog', () => ({
  mergeCatalogRaces: (...args: unknown[]) => mergeCatalogRaces(...args),
  separateCatalogRaces: (...args: unknown[]) => separateCatalogRaces(...args),
}))

function race(overrides: Partial<RaceCatalogEntry> & Pick<RaceCatalogEntry, 'id' | 'name'>): RaceCatalogEntry {
  return {
    country: 'DE',
    city: 'Berlin',
    disciplines: ['km_5'],
    entryMethod: 'unknown',
    review: 'unreviewed',
    source: 'scc-events.com',
    producer: 'harvest',
    editions: [{ year: 2026, raceDate: '2026-09-26', source: 's', confirmedAt: '2026-09-02' }],
    ...overrides,
  }
}

/**
 * A real pair from the catalog: the two share "Haspa", which is evidence, and
 * neither name is inside the other, so no rule merges them on its own.
 */
const pair = [
  race({ id: 'de-hamburg-haspa-halbmarathon', name: 'Haspa Halbmarathon Hamburg', city: 'Hamburg' }),
  race({ id: 'de-hamburg-haspa-marathon', name: 'Haspa Marathon Hamburg', city: 'Hamburg' }),
]

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('CatalogDuplicates', () => {
  it('shows nothing when there is nothing to decide', () => {
    const { container } = render(
      <CatalogDuplicates races={[pair[0]]} adminUid="admin" onChanged={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('merges into the suggested survivor and reloads', async () => {
    const onChanged = vi.fn()
    render(<CatalogDuplicates races={pair} adminUid="admin" onChanged={onChanged} />)

    fireEvent.click(screen.getByRole('button', { name: /mesma prova/i }))

    await waitFor(() =>
      expect(mergeCatalogRaces).toHaveBeenCalledWith(
        'de-hamburg-haspa-halbmarathon',
        'de-hamburg-haspa-marathon',
        'admin',
      ),
    )
    expect(onChanged).toHaveBeenCalled()
  })

  it('records a no, so the next harvest does not ask again', async () => {
    render(<CatalogDuplicates races={pair} adminUid="admin" onChanged={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Provas diferentes' }))

    await waitFor(() =>
      expect(separateCatalogRaces).toHaveBeenCalledWith(
        'de-hamburg-haspa-halbmarathon',
        'de-hamburg-haspa-marathon',
        'admin',
      ),
    )
  })

  it('says so when the write fails, and keeps the pair', async () => {
    mergeCatalogRaces.mockRejectedValueOnce(new Error('denied'))
    render(<CatalogDuplicates races={pair} adminUid="admin" onChanged={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /mesma prova/i }))

    expect(await screen.findByText('Não foi possível guardar.')).toBeInTheDocument()
    expect(screen.getByText('Haspa Marathon Hamburg')).toBeInTheDocument()
  })
})
