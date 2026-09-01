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
 * Reads the instance's collection, so it needs credentials like the backfills:
 *
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-queima-asfalto \
 *     npm run catalog:review
 *
 *   npm run catalog:review        # production, with Application Default Credentials
 */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { RACE_CATALOG_COLLECTION } from '../shared/raceCatalog/collection.js'
import { editionReviewQueue, needsEditionReview } from '../shared/raceCatalog/catalog.js'
import type { RaceCatalogEntry } from '../shared/raceCatalog/types.js'

const require = createRequire(resolve(import.meta.dirname, '../functions/package.json'))
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

const PROJECT_ID =
  process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? 'queima-asfalto'

initializeApp({ projectId: PROJECT_ID })
const races = (await getFirestore().collection(RACE_CATALOG_COLLECTION).get()).docs.map(
  (document: { data: () => RaceCatalogEntry }) => document.data(),
) as RaceCatalogEntry[]
const catalog = { updatedAt: PROJECT_ID, races }

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

console.log(`Project ${PROJECT_ID}, ${catalog.races.length} races in the catalog\n`)

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
