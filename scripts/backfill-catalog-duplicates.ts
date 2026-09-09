#!/usr/bin/env npx tsx
/**
 * Applies the duplicate rule to the entries already in the catalog.
 *
 * The rule runs during a harvest, against the race being read. So a change to
 * it only reaches a stored pair when one of its two sources is read again, and
 * the harvest reads one source a day: nine sources is nine days of duplicates
 * a runner can see and we already know about.
 *
 * This does the same thing the harvest would, one pass over what is stored:
 * a pair the rule now recognises collapses, the survivor chosen the way the
 * admin queue suggests one (reviewed or curated first, then a fee or a
 * deadline, then the number of editions).
 *
 * Nothing is deleted. The entry that goes gets `duplicateOfCatalogRaceId`,
 * which the admin area can undo, and which is what the harvest writes too.
 *
 * A pair an operator kept apart (`notDuplicateOf`) is left alone: the rule
 * already refuses those, and this uses the same rule.
 *
 * Against the emulator:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-queima-asfalto \
 *     npm run backfill:catalog-duplicates -- --confirm
 *
 * Against production, with Application Default Credentials:
 *   npm run backfill:catalog-duplicates -- --dry-run
 *   npm run backfill:catalog-duplicates -- --confirm
 */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { findCatalogDuplicate, survivorFirst } from '../shared/eventDiscovery/duplicates.js'
import type { RaceCatalogEntry } from '../shared/raceCatalog/types.js'

const require = createRequire(resolve(import.meta.dirname, '../functions/package.json'))
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

const PROJECT_ID =
  process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? 'queima-asfalto'

const dryRun = process.argv.includes('--dry-run')
const confirm = process.argv.includes('--confirm')

if (!dryRun && !confirm) {
  console.error('Refusing to run. Pass --dry-run to preview, or --confirm to write.')
  process.exit(1)
}

/** Firestore takes 500 writes per batch, and this is one field per document. */
const BATCH_SIZE = 400

/** How far apart two editions may be dated and still be one event. */
const SPREAD_DAYS = 2

/**
 * Pairs are only ever compared within a country and within a few days.
 *
 * The catalog is five thousand entries and comparing every pair is twelve
 * million comparisons for nothing: the rule needs the same country and dates
 * at most two days apart, so that is what the buckets are.
 */
function bucketsOf(entry: RaceCatalogEntry): string[] {
  const days = (entry.editions ?? []).map((edition) => edition.raceDate).filter(Boolean)
  const keys = new Set<string>()
  for (const day of days) {
    const at = Date.parse(`${day}T00:00:00Z`)
    if (!Number.isFinite(at)) continue
    for (let shift = -SPREAD_DAYS; shift <= SPREAD_DAYS; shift += 1) {
      keys.add(`${entry.country}|${new Date(at + shift * 86400000).toISOString().slice(0, 10)}`)
    }
  }
  return [...keys]
}

async function main(): Promise<void> {
  initializeApp({ projectId: PROJECT_ID })
  const db = getFirestore()

  const snapshot = await db.collection('raceCatalog').get()
  const visible: RaceCatalogEntry[] = snapshot.docs
    .map((document: { data: () => RaceCatalogEntry }) => document.data())
    .filter(
      (entry: RaceCatalogEntry) => entry.retired !== true && !entry.duplicateOfCatalogRaceId,
    )

  const byBucket = new Map<string, RaceCatalogEntry[]>()
  for (const entry of visible) {
    for (const bucket of bucketsOf(entry)) {
      byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), entry])
    }
  }

  /** The id each copy should point at, and never one that is itself a copy. */
  const pointsAt = new Map<string, string>()
  const seen = new Set<string>()

  for (const group of byBucket.values()) {
    for (let index = 0; index < group.length; index += 1) {
      for (let other = index + 1; other < group.length; other += 1) {
        const left = group[index]!
        const right = group[other]!
        const pair = [left.id, right.id].sort().join('__')
        if (seen.has(pair)) continue
        seen.add(pair)

        // Both directions, because the rule is asymmetric: a reviewed entry is
        // the anchor whichever side of the pair it is on.
        if (!findCatalogDuplicate(right, [left]) && !findCatalogDuplicate(left, [right])) continue

        const [keep, drop] = survivorFirst(left, right)
        if (pointsAt.has(drop.id)) continue
        pointsAt.set(drop.id, keep.id)
      }
    }
  }

  // Follow the chains to their end. Three entries can be one race, and the
  // pairs are not met in any useful order: the Goslar marathon is in the
  // catalog as Goslar, Goslar-Hahnenklee and Hahnenklee, and whichever pair is
  // read first would otherwise leave a copy pointing at a copy.
  for (const dropId of [...pointsAt.keys()]) {
    const walked = new Set([dropId])
    let target = pointsAt.get(dropId)!
    while (pointsAt.has(target) && !walked.has(target)) {
      walked.add(target)
      target = pointsAt.get(target)!
    }
    if (walked.has(target)) {
      // A ring, which would leave every entry in it invisible. Leave the pair
      // to a person instead.
      console.warn(`refusing a cycle through ${dropId}`)
      pointsAt.delete(dropId)
      continue
    }
    pointsAt.set(dropId, target)
  }

  console.log(`${visible.length} visible entries, ${pointsAt.size} to fold into another`)
  const byId = new Map(visible.map((entry) => [entry.id, entry]))
  for (const [dropId, keepId] of [...pointsAt].slice(0, 10)) {
    console.log(`  ${byId.get(dropId)?.name} -> ${byId.get(keepId)?.name}`)
  }
  if (pointsAt.size > 10) console.log(`  ... and ${pointsAt.size - 10} more`)

  if (dryRun) {
    console.log('Dry run, nothing written.')
    return
  }

  const updatedAt = new Date().toISOString()
  const entries = [...pointsAt]
  for (let at = 0; at < entries.length; at += BATCH_SIZE) {
    const batch = db.batch()
    for (const [dropId, keepId] of entries.slice(at, at + BATCH_SIZE)) {
      batch.update(db.collection('raceCatalog').doc(dropId), {
        duplicateOfCatalogRaceId: keepId,
        updatedAt,
        updatedBy: 'backfill',
      })
    }
    await batch.commit()
    console.log(`written ${Math.min(at + BATCH_SIZE, entries.length)}/${entries.length}`)
  }
}

await main()
