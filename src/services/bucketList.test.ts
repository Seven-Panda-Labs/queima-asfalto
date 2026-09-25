import { describe, expect, it, vi } from 'vitest'

vi.mock('./firebase', () => ({ db: {} }))
const addDoc = vi.fn(() => Promise.resolve({ id: 'wish-new' }))
const getDocs = vi.fn(() => Promise.resolve({ docs: [] as { id: string }[] }))
vi.mock('firebase/firestore', () => ({
  addDoc: (...args: unknown[]) => addDoc(...args),
  collection: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: (...args: unknown[]) => getDocs(...args),
  onSnapshot: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  serverTimestamp: vi.fn(),
  updateDoc: vi.fn(),
  where: vi.fn(),
}))
vi.mock('./races', () => ({ findOrCreateRaceId: vi.fn() }))

const { createBucketListItem, docToBucketListItem } = await import('./bucketList')

describe('docToBucketListItem', () => {
  it('reads a Firestore timestamp', () => {
    const at = new Date('2026-09-25T10:00:00Z')
    const item = docToBucketListItem('w1', {
      userId: 'u1',
      raceId: 'race-1',
      createdAt: { toDate: () => at },
      updatedAt: { toDate: () => at },
    })

    expect(item.updatedAt).toEqual(at)
  })

  it('survives a field that is not one', () => {
    // A script wrote an ISO string into `updatedAt` and the whole list went
    // blank: the page maps every document, so one bad field loses all of them.
    const item = docToBucketListItem('w1', {
      userId: 'u1',
      raceId: 'race-1',
      updatedAt: '2026-09-25T10:00:00.000Z',
    })

    expect(item.updatedAt).toEqual(new Date('2026-09-25T10:00:00.000Z'))
    expect(item.raceId).toBe('race-1')
  })

  it('falls back rather than throwing on rubbish', () => {
    expect(docToBucketListItem('w1', { userId: 'u1', updatedAt: 42.5 }).updatedAt).toBeInstanceOf(
      Date,
    )
    expect(docToBucketListItem('w1', { userId: 'u1', updatedAt: {} }).updatedAt).toEqual(
      new Date(0),
    )
  })
})

describe('createBucketListItem', () => {
  it('marks a race once, however many times the heart is pressed', async () => {
    // Three wishes for the Meia Maratona de Faro is what the second press
    // used to do, because nothing on screen said it was already marked.
    getDocs.mockResolvedValueOnce({ docs: [{ id: 'wish-1' }] })

    const id = await createBucketListItem('u1', { raceId: 'race-1' })

    expect(id).toBe('wish-1')
    expect(addDoc).not.toHaveBeenCalled()
  })

  it('writes one for a race nobody had marked', async () => {
    getDocs.mockResolvedValueOnce({ docs: [] })

    const id = await createBucketListItem('u1', { raceId: 'race-1' })

    expect(id).toBe('wish-new')
    expect(addDoc).toHaveBeenCalled()
  })
})
