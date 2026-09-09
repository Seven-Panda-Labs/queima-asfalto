import { describe, expect, it } from 'vitest'
import type { EventType } from '../domain/eventCodes'
import type { RaceCatalogEntry } from '../raceCatalog/types'
import { catalogDuplicateCandidates, findCatalogDuplicate } from './duplicates'
import { slugify } from './identity'
import corpus from './fixtures/verified-duplicates.json'

/**
 * Pairs a person read in the app and confirmed are one race.
 *
 * The corpus, not a set of cases somebody invented: every pair here was
 * invisible when it was collected, neither merged nor asked about, and each one
 * named a different reason. Add a pair to the fixture and this test says what
 * the rule does with it, which is the point.
 */

type Side = { name: string; city: string; disciplines: string[]; day?: string }

/** The day both sources agreed on, where they agreed. */
const SAME_DAY = '2026-09-12'

function entry(side: Side, which: string, country = 'DE'): RaceCatalogEntry {
  const raceDate = side.day ?? SAME_DAY
  return {
    id: `${which}-${slugify(side.name)}`,
    name: side.name,
    city: side.city,
    country,
    disciplines: side.disciplines as EventType[],
    entryMethod: 'unknown',
    review: 'unreviewed',
    source: `source-${which}`,
    producer: 'harvest',
    editions: [
      { year: Number(raceDate.slice(0, 4)), raceDate, source: 's', confirmedAt: '2026-09-09' },
    ],
  }
}

function verdict(left: RaceCatalogEntry, right: RaceCatalogEntry): string {
  if (findCatalogDuplicate(right, [left])) return 'merged'
  return catalogDuplicateCandidates([left, right]).length > 0 ? 'queued' : 'invisible'
}

describe('the duplicates a person verified', () => {
  for (const pair of corpus.pairs) {
    it(`${pair.expect}: ${pair.left.name} and ${pair.right.name}`, () => {
      const left = entry(pair.left, 'a', pair.country)
      const right = entry(pair.right, 'b', pair.country)
      expect(verdict(left, right)).toBe(pair.expect)
      // Whichever way round a harvest meets them.
      expect(verdict(right, left)).toBe(pair.expect)
    })
  }

  it('reaches all but the four with nothing to read', () => {
    const reached = corpus.pairs.filter((pair) => pair.expect !== 'invisible')
    expect(corpus.pairs).toHaveLength(25)
    expect(reached).toHaveLength(21)
    expect(corpus.pairs.filter((pair) => pair.expect === 'merged')).toHaveLength(20)
  })
})
