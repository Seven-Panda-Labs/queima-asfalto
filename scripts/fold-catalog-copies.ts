#!/usr/bin/env npx tsx
/**
 * Folds what every copy knows into the entry it points at.
 *
 * A merge was a pointer and nothing else until now, so the information stayed
 * in the copy where nobody could reach it: on one instance four S25 entries
 * were linked into one that showed a single 2023 edition, while three later
 * editions, two results pages, a fee, a timezone and the official site sat
 * inside the copies. Merging folds from now on; this does it for what is
 * already merged.
 *
 * It also flattens the chains. A copy of a copy is how that mess was built:
 * the rich entry was merged into a new one and the two entries that already
 * pointed at it were left hanging off a copy. Every copy ends up pointing at
 * the root of its tree, and a cycle is reported and left alone.
 *
 * Against the emulator:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-queima-asfalto \
 *     npm run fold:catalog-copies -- --confirm
 *
 * Against production, with Application Default Credentials:
 *   npm run fold:catalog-copies -- --dry-run
 *   npm run fold:catalog-copies -- --confirm
 */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { absorb } from '../shared/raceCatalog/absorb.js'
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

/** The fields a fold can change, so nothing else is written over. */
const FOLDED = [
  'editions',
  'nextRaceDate',
  'disciplines',
  'nameTokens',
  'entryMethod',
  'officialUrl',
  'registrationUrl',
  'typicalRaceMonth',
  'typicalWindowNote',
  'latitude',
  'longitude',
  'notDuplicateOf',
] as const

/** The entry at the end of the pointers, or null when they run in a circle. */
function rootOf(
  entry: RaceCatalogEntry,
  byId: Map<string, RaceCatalogEntry>,
): RaceCatalogEntry | null {
  const seen = new Set<string>([entry.id])
  let at = entry
  while (at.duplicateOfCatalogRaceId) {
    const next = byId.get(at.duplicateOfCatalogRaceId)
    if (!next || seen.has(next.id)) return null
    seen.add(next.id)
    at = next
  }
  return at
}

async function main(): Promise<void> {
  initializeApp({ projectId: PROJECT_ID })
  const db = getFirestore()
  const today = new Date().toISOString().slice(0, 10)

  const snapshot = await db.collection('raceCatalog').get()
  const byId = new Map<string, RaceCatalogEntry>(
    snapshot.docs.map((document: { id: string; data: () => unknown }) => [
      document.id,
      { ...(document.data() as RaceCatalogEntry), id: document.id },
    ]),
  )

  const copiesOf = new Map<string, RaceCatalogEntry[]>()
  let cycles = 0
  for (const entry of byId.values()) {
    if (!entry.duplicateOfCatalogRaceId) continue
    const root = rootOf(entry, byId)
    if (!root) {
      console.log(`  cycle around ${entry.id}, left alone`)
      cycles += 1
      continue
    }
    copiesOf.set(root.id, [...(copiesOf.get(root.id) ?? []), entry])
  }

  let folded = 0
  let repointed = 0
  const writes: { id: string; data: Record<string, unknown> }[] = []

  for (const [rootId, copies] of copiesOf) {
    const root = byId.get(rootId)!
    // By id, so two runs of this produce the same entry.
    const ordered = [...copies].sort((left, right) => left.id.localeCompare(right.id))
    let merged = root
    for (const copy of ordered) merged = absorb(merged, copy, today)

    const changed: Record<string, unknown> = {}
    for (const field of FOLDED) {
      const before = JSON.stringify(root[field] ?? null)
      const after = JSON.stringify(merged[field] ?? null)
      if (before !== after) changed[field] = merged[field]
    }
    if (Object.keys(changed).length > 0) {
      folded += 1
      console.log(`  ${rootId} gains ${Object.keys(changed).join(', ')} from ${ordered.length} copies`)
      writes.push({ id: rootId, data: changed })
    }

    for (const copy of ordered) {
      if (copy.duplicateOfCatalogRaceId === rootId) continue
      repointed += 1
      console.log(`  ${copy.id}: ${copy.duplicateOfCatalogRaceId} -> ${rootId}`)
      writes.push({ id: copy.id, data: { duplicateOfCatalogRaceId: rootId } })
    }
  }

  console.log(
    `${byId.size} entries, ${copiesOf.size} trees, ${folded} survivors to fill in, ` +
      `${repointed} copies to re-point, ${cycles} cycles left alone`,
  )
  if (dryRun) {
    console.log('Dry run, nothing written.')
    return
  }

  for (const write of writes) {
    await db.collection('raceCatalog').doc(write.id).update(write.data)
  }
  console.log(`written ${writes.length}`)
}

await main()
