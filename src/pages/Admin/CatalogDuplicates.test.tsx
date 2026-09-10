import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RaceCatalogEntry } from '../../../shared/raceCatalog'
import { CatalogDuplicates } from './CatalogDuplicates'

const mergeCatalogRaces = vi.fn()
const separateCatalogRaces = vi.fn()

/** Set per test: the pairs the daily job left for a person to decide. */
let queue: RaceCatalogEntry[][] = []
vi.mock('../../services/adminRaceCatalog', () => ({
  mergeCatalogRaces: (...args: unknown[]) => mergeCatalogRaces(...args),
  separateCatalogRaces: (...args: unknown[]) => separateCatalogRaces(...args),
  loadDuplicateQueue: () => Promise.resolve(queue),
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
  race({
    id: 'de-hamburg-haspa-halbmarathon',
    name: 'Haspa Halbmarathon Hamburg',
    city: 'Hamburg',
    officialUrl: 'https://scc-events.com/haspa-halbmarathon',
  }),
  race({
    id: 'de-hamburg-haspa-marathon',
    name: 'Haspa Marathon Hamburg',
    city: 'Hamburg',
    officialUrl: 'https://scc-events.com/haspa-marathon',
  }),
]

/** The queue as the job stores it: pairs, already decided to be worth asking. */
function pairsOf(races: RaceCatalogEntry[]): RaceCatalogEntry[][] {
  const out: RaceCatalogEntry[][] = []
  for (let at = 0; at + 1 < races.length; at += 2) out.push([races[at]!, races[at + 1]!])
  return out
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  tallies = new Map()
  queue = []
})

describe('CatalogDuplicates', () => {
  it('shows nothing when there is nothing to decide', () => {
    // The job leaves nothing when the rule decided everything.
    const { container } = render(<CatalogDuplicates adminUid="admin" onChanged={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('links each side to the source, so the answer can be checked there', async () => {
    queue = pairsOf(pair)
    render(<CatalogDuplicates adminUid="admin" onChanged={vi.fn()} />)

    await screen.findByText('Haspa Marathon Hamburg')
    const links = screen.getAllByRole('link', { name: /Abrir a origem/ })
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('href', 'https://scc-events.com/haspa-halbmarathon')
    // A new tab, because the operator is mid decision on this page.
    expect(links[0]).toHaveAttribute('target', '_blank')
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('leaves out the link when no source page was recorded', async () => {
    const noUrl: RaceCatalogEntry[] = pair.map((race) => ({ ...race, officialUrl: undefined }))
    queue = pairsOf(noUrl)
    render(<CatalogDuplicates adminUid="admin" onChanged={vi.fn()} />)

    await screen.findByText('Haspa Marathon Hamburg')
    expect(screen.queryByRole('link', { name: /Abrir a origem/ })).not.toBeInTheDocument()
  })

  it('names the source beside each entry', async () => {
    queue = pairsOf(pair)
    render(<CatalogDuplicates adminUid="admin" onChanged={vi.fn()} />)

    await screen.findByText('Haspa Marathon Hamburg')
    // Which source said what is half of why two names disagree.
    expect(screen.getAllByText(/scc-events\.com/).length).toBeGreaterThan(0)
  })

  it('merges into the suggested survivor and reloads', async () => {
    const onChanged = vi.fn()
    queue = pairsOf(pair)
    render(<CatalogDuplicates adminUid="admin" onChanged={onChanged} />)

    await screen.findByText('Haspa Marathon Hamburg')
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
    queue = pairsOf(pair)
    render(<CatalogDuplicates adminUid="admin" onChanged={vi.fn()} />)

    await screen.findByText('Haspa Marathon Hamburg')
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
    queue = pairsOf(pair)
    render(<CatalogDuplicates adminUid="admin" onChanged={vi.fn()} />)

    await screen.findByText('Haspa Marathon Hamburg')
    fireEvent.click(screen.getByRole('button', { name: 'Provas diferentes' }))

    await waitFor(() =>
      expect(separateCatalogRaces).toHaveBeenCalledWith(
        'de-hamburg-haspa-halbmarathon',
        'de-hamburg-haspa-marathon',
        'admin',
      ),
    )
  })

  it('takes the answered pair off the list', async () => {
    // The queue is a document the daily pass writes, so it still names the
    // pair: what had to change is that an answered pair is filtered out when
    // it is read. Without that the row stayed and the button read as dead.
    queue = pairsOf(pair)
    render(<CatalogDuplicates adminUid="admin" onChanged={vi.fn()} />)

    await screen.findByText('Haspa Marathon Hamburg')
    queue = []
    fireEvent.click(screen.getByRole('button', { name: 'Provas diferentes' }))

    await waitFor(() => expect(screen.queryByText('Haspa Marathon Hamburg')).toBeNull())
  })

  it('says so when the write fails, and keeps the pair', async () => {
    mergeCatalogRaces.mockRejectedValueOnce(new Error('denied'))
    queue = pairsOf(pair)
    render(<CatalogDuplicates adminUid="admin" onChanged={vi.fn()} />)

    await screen.findByText('Haspa Marathon Hamburg')
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
    queue = pairsOf(pair)
    render(<CatalogDuplicates adminUid="admin" onChanged={vi.fn()} />)

    expect(await screen.findByText('Votos: mesma prova 3, diferentes 1.')).toBeInTheDocument()
  })

  it('puts the pairs runners recognised at the top', async () => {
    tallies = new Map([['de-saar-sparkassen__de-saar-weltkulturerbe', { same: 2, different: 0 }]])
    queue = pairsOf([...pair, ...other])
    render(<CatalogDuplicates adminUid="admin" onChanged={vi.fn()} />)

    await screen.findByText(/mesma prova 2/)
    const shown = [...document.querySelectorAll('li')].map((row) => row.textContent ?? '')
    // The voted pair first, the unanswered one after it.
    expect(shown[0]).toContain('SAARathon')
    expect(shown[1]).toContain('Haspa')
  })

  it('says nothing when nobody has answered', async () => {
    queue = pairsOf(pair)
    render(<CatalogDuplicates adminUid="admin" onChanged={vi.fn()} />)

    await screen.findByText('Haspa Marathon Hamburg')
    expect(screen.queryByText(/^Votos:/)).not.toBeInTheDocument()
  })
})
