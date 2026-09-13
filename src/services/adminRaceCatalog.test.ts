import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RaceCatalogEntry } from '../../shared/raceCatalog'

const setDoc = vi.fn()

vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, collectionName: string, id: string) => ({ collectionName, id }),
  setDoc: (...args: unknown[]) => setDoc(...args),
  getDoc: vi.fn(async () => ({ exists: () => false, data: () => undefined })),
  getDocs: vi.fn(async () => ({ docs: [] })),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  arrayUnion: vi.fn(),
}))
vi.mock('./firebase', () => ({ db: {} }))

const { saveCatalogRaceForAdmin } = await import('./adminRaceCatalog')

function race(overrides: Partial<RaceCatalogEntry> = {}): RaceCatalogEntry {
  return {
    id: 'frostwiesen-lauf',
    name: 'Frostwiesen Lauf',
    country: 'DE',
    city: 'Burg',
    disciplines: ['km_21_1'],
    entryMethod: 'first_come',
    review: 'reviewed',
    source: 'frostwiese.de',
    ...overrides,
  }
}

beforeEach(() => vi.clearAllMocks())

describe('saving an entry by hand', () => {
  it('writes the words a search can reach it by', async () => {
    // Without this an entry created in the form had none, so no search found
    // it, and the id it held blocked anybody trying to create it again.
    await saveCatalogRaceForAdmin(race(), 'admin')

    const [, written] = setDoc.mock.calls[0] as [unknown, { nameTokens: string[] }]
    expect(written.nameTokens).toEqual(['frostwiesen', 'lauf', 'burg'])
  })

  it('rewrites them when the name changes, rather than keeping the old ones', async () => {
    await saveCatalogRaceForAdmin(
      race({ name: 'Frostwiese Winterlauf', nameTokens: ['frostwiesen', 'lauf', 'burg'] }),
      'admin',
    )

    const [, written] = setDoc.mock.calls[0] as [unknown, { nameTokens: string[] }]
    expect(written.nameTokens).toEqual(['frostwiese', 'winterlauf', 'burg'])
  })

  it('writes no key that holds nothing, which Firestore refuses', async () => {
    await saveCatalogRaceForAdmin(race({ officialUrl: undefined }), 'admin')

    const [, written] = setDoc.mock.calls[0] as [unknown, Record<string, unknown>]
    expect(Object.entries(written).filter(([, value]) => value === undefined)).toEqual([])
  })
})
