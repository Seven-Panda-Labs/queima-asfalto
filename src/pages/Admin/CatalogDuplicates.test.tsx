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

/** Set per test: what the runners answered, keyed the way the pair id is built. */
let tallies = new Map<string, { same: number; different: number }>()
vi.mock('../../services/duplicateVotes', () => ({
  loadDuplicateVoteTallies: () => Promise.resolve(tallies),
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
  tallies = new Map()
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

    fireEvent.click(screen.getByRole('button', { name: /Haspa Halbmarathon Hamburg/ }))

    await waitFor(() =>
      expect(mergeCatalogRaces).toHaveBeenCalledWith(
        'de-hamburg-haspa-halbmarathon',
        'de-hamburg-haspa-marathon',
        'admin',
      ),
    )
    expect(onChanged).toHaveBeenCalled()
  })

  it('merges the other way when the operator prefers the other name', async () => {
    render(<CatalogDuplicates races={pair} adminUid="admin" onChanged={vi.fn()} />)

    // The suggestion is a guess, and the operator may know the organiser calls
    // the race by the name it did not pick.
    fireEvent.click(screen.getByRole('button', { name: /Haspa Marathon Hamburg/ }))

    await waitFor(() =>
      expect(mergeCatalogRaces).toHaveBeenCalledWith(
        'de-hamburg-haspa-marathon',
        'de-hamburg-haspa-halbmarathon',
        'admin',
      ),
    )
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

    fireEvent.click(screen.getByRole('button', { name: /Haspa Halbmarathon Hamburg/ }))

    expect(await screen.findByText('Não foi possível guardar.')).toBeInTheDocument()
    expect(screen.getByText('Haspa Marathon Hamburg')).toBeInTheDocument()
  })
})

describe('what the runners answered', () => {
  /** Another pair from the queue, and another the rule will not decide. */
  const other = [
    race({ id: 'de-saar-sparkassen', name: 'Sparkassen-SAARathon', city: 'Saarbrücken' }),
    race({
      id: 'de-saar-weltkulturerbe',
      name: '3. SAARathon Weltkulturerbe-Marathon',
      city: 'Saarbrücken',
    }),
  ]

  it('shows the count on the pair', async () => {
    tallies = new Map([
      ['de-hamburg-haspa-halbmarathon__de-hamburg-haspa-marathon', { same: 3, different: 1 }],
    ])
    render(<CatalogDuplicates races={pair} adminUid="admin" onChanged={vi.fn()} />)

    expect(await screen.findByText('Votos: mesma prova 3, diferentes 1.')).toBeInTheDocument()
  })

  it('puts the pairs runners recognised at the top', async () => {
    tallies = new Map([['de-saar-sparkassen__de-saar-weltkulturerbe', { same: 2, different: 0 }]])
    render(
      <CatalogDuplicates races={[...pair, ...other]} adminUid="admin" onChanged={vi.fn()} />,
    )

    await screen.findByText(/mesma prova 2/)
    const shown = [...document.querySelectorAll('li')].map((row) => row.textContent ?? '')
    // The voted pair first, the unanswered one after it.
    expect(shown[0]).toContain('SAARathon')
    expect(shown[1]).toContain('Haspa')
  })

  it('says nothing when nobody has answered', async () => {
    render(<CatalogDuplicates races={pair} adminUid="admin" onChanged={vi.fn()} />)

    await screen.findByText('Haspa Marathon Hamburg')
    expect(screen.queryByText(/^Votos:/)).not.toBeInTheDocument()
  })
})
