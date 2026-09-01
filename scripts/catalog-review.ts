#!/usr/bin/env npx tsx
/**
 * Lists the catalog entries that need a human, so the review has a queue instead
 * of a vibe.
 *
 * Two kinds of work, printed separately:
 *   - never checked: the entry itself was assembled from public listings
 *   - out of editions: checked once, but every edition it holds is in the past
 *
 * Ordered by how soon the race typically falls, so the queue reads as a calendar.
 *
 *   npm run catalog:review
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { editionReviewQueue, needsEditionReview } from '../shared/raceCatalog/catalog.js'
import type { RaceCatalog } from '../shared/raceCatalog/types.js'

const catalog = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../src/data/race-catalog.json'), 'utf8'),
) as RaceCatalog

const today = new Date()
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function line(id: string, month: number | undefined, detail: string): string {
  const when = month ? MONTHS[month - 1] : '??'
  return `  ${when}  ${id.padEnd(32)} ${detail}`
}

const unreviewed = editionReviewQueue(catalog.races, today).filter(
  (race) => race.review === 'unreviewed',
)
const staleEditions = editionReviewQueue(catalog.races, today).filter(
  (race) => race.review === 'reviewed',
)
const current = catalog.races.filter((race) => !needsEditionReview(race, today))

console.log(`Catalog updated ${catalog.updatedAt}, ${catalog.races.length} races\n`)

console.log(`Never checked (${unreviewed.length}):`)
for (const race of unreviewed) {
  console.log(line(race.id, race.typicalRaceMonth, race.officialUrl ?? 'no official url'))
}

console.log(`\nChecked, out of editions (${staleEditions.length}):`)
for (const race of staleEditions) {
  const latest = [...(race.editions ?? [])].sort((left, right) => right.year - left.year)[0]
  console.log(
    line(race.id, race.typicalRaceMonth, `newest edition ${latest?.year ?? 'none'}, ${race.officialUrl ?? 'no official url'}`),
  )
}

console.log(`\nCurrent, nothing to do (${current.length}):`)
for (const race of current) {
  const next = [...(race.editions ?? [])]
    .filter((edition) => edition.raceDate)
    .sort((left, right) => (left.raceDate! < right.raceDate! ? -1 : 1))[0]
  console.log(line(race.id, race.typicalRaceMonth, `next ${next?.raceDate ?? 'unknown'}`))
}
