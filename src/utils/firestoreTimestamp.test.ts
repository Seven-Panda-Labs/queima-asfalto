import { describe, expect, it } from 'vitest'
import { parseFirestoreTimestamp } from './firestoreTimestamp'

describe('parseFirestoreTimestamp', () => {
  it('parses callable serialized Firestore timestamps', () => {
    const date = parseFirestoreTimestamp({ _seconds: 1558476000, _nanoseconds: 0 })
    expect(date.toISOString()).toBe('2019-05-21T22:00:00.000Z')
  })

  it('parses protobuf-style seconds and nanoseconds', () => {
    const date = parseFirestoreTimestamp({ seconds: 1787954400, nanoseconds: 0 })
    expect(date.getFullYear()).toBe(2026)
  })

  it('parses ISO strings', () => {
    const date = parseFirestoreTimestamp('2024-06-15T10:00:00.000Z')
    expect(date.toISOString()).toBe('2024-06-15T10:00:00.000Z')
  })

  it('returns epoch for unknown values', () => {
    expect(parseFirestoreTimestamp(null).getTime()).toBe(0)
    expect(parseFirestoreTimestamp({}).getTime()).toBe(0)
  })
})
